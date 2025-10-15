import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facilitiesApi, CreateFacilityRequest } from '../api/facilities.api';

export function useFacilities(params: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['facilities', params],
    queryFn: () => facilitiesApi.list(params),
    keepPreviousData: true,
  });
}

export function useFacility(id: number | undefined) {
  return useQuery({
    queryKey: ['facilities', id],
    queryFn: () => facilitiesApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateFacility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFacilityRequest) => facilitiesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
    },
  });
}

export function useUpdateFacility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateFacilityRequest> }) =>
      facilitiesApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      queryClient.invalidateQueries({ queryKey: ['facilities', variables.id] });
    },
  });
}

export function useDeleteFacility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => facilitiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
    },
  });
}

export function useFacilityDepartments(facilityId: number | undefined) {
  return useQuery({
    queryKey: ['facilities', facilityId, 'departments'],
    queryFn: () => facilitiesApi.getDepartments(facilityId!),
    enabled: !!facilityId,
  });
}

export function useFacilityCapacity(facilityId: number | undefined) {
  return useQuery({
    queryKey: ['facilities', facilityId, 'capacity'],
    queryFn: () => facilitiesApi.getCapacity(facilityId!),
    enabled: !!facilityId,
  });
}

