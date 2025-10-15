import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { labsApi, CreateLabOrderRequest, SubmitLabResultRequest } from '../api/labs.api';

export function useLabOrders(params: {
  page?: number;
  limit?: number;
  status?: string;
  patientId?: number;
  priority?: string;
}) {
  return useQuery({
    queryKey: ['labs', params],
    queryFn: () => labsApi.list(params),
    keepPreviousData: true,
  });
}

export function useLabOrder(id: number | undefined) {
  return useQuery({
    queryKey: ['labs', id],
    queryFn: () => labsApi.get(id!),
    enabled: !!id,
  });
}

export function useLabResults(labOrderId: number | undefined) {
  return useQuery({
    queryKey: ['labs', labOrderId, 'results'],
    queryFn: () => labsApi.getResults(labOrderId!),
    enabled: !!labOrderId,
  });
}

export function useCreateLabOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLabOrderRequest) => labsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labs'] });
    },
  });
}

export function useUpdateLabOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateLabOrderRequest> }) =>
      labsApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['labs'] });
      queryClient.invalidateQueries({ queryKey: ['labs', variables.id] });
    },
  });
}

export function useCancelLabOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => labsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labs'] });
    },
  });
}

export function useSubmitLabResults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ labOrderId, results }: { labOrderId: number; results: SubmitLabResultRequest[] }) =>
      labsApi.submitResults(labOrderId, results),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['labs'] });
      queryClient.invalidateQueries({ queryKey: ['labs', variables.labOrderId] });
      queryClient.invalidateQueries({ queryKey: ['labs', variables.labOrderId, 'results'] });
    },
  });
}

export function usePendingLabs() {
  return useQuery({
    queryKey: ['labs', 'pending'],
    queryFn: () => labsApi.getPending(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function usePatientLabs(patientId: number | undefined) {
  return useQuery({
    queryKey: ['labs', 'patient', patientId],
    queryFn: () => labsApi.getPatientLabs(patientId!),
    enabled: !!patientId,
  });
}

