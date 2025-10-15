import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsApi, CreatePatientRequest } from '../api/patients.api';

export function usePatients(params: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['patients', params],
    queryFn: () => patientsApi.list(params),
    keepPreviousData: true,
  });
}

export function usePatient(id: number | undefined) {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: () => patientsApi.get(id!),
    enabled: !!id,
  });
}

export function usePatientComplete(id: number | undefined) {
  return useQuery({
    queryKey: ['patients', id, 'complete'],
    queryFn: () => patientsApi.getComplete(id!),
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePatientRequest) => patientsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreatePatientRequest> }) =>
      patientsApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients', variables.id] });
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => patientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

export function useSearchPatients(query: string) {
  return useQuery({
    queryKey: ['patients', 'search', query],
    queryFn: () => patientsApi.search(query),
    enabled: query.length > 2, // Only search if query is longer than 2 characters
  });
}

