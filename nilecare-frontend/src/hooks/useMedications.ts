import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicationsApi, CreateMedicationRequest, DiscontinueMedicationRequest } from '../api/medications.api';

export function useMedications(params: {
  page?: number;
  limit?: number;
  status?: string;
  patientId?: number;
}) {
  return useQuery({
    queryKey: ['medications', params],
    queryFn: () => medicationsApi.list(params),
    keepPreviousData: true,
  });
}

export function useMedication(id: number | undefined) {
  return useQuery({
    queryKey: ['medications', id],
    queryFn: () => medicationsApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMedicationRequest) => medicationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
    },
  });
}

export function useUpdateMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateMedicationRequest> }) =>
      medicationsApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['medications', variables.id] });
    },
  });
}

export function useDiscontinueMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DiscontinueMedicationRequest }) =>
      medicationsApi.discontinue(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['medications', variables.id] });
    },
  });
}

export function usePatientMedications(patientId: number | undefined) {
  return useQuery({
    queryKey: ['medications', 'patient', patientId],
    queryFn: () => medicationsApi.getPatientMedications(patientId!),
    enabled: !!patientId,
  });
}

export function useActiveMedications() {
  return useQuery({
    queryKey: ['medications', 'active'],
    queryFn: () => medicationsApi.getActive(),
    refetchInterval: 60000, // Refetch every minute
  });
}

