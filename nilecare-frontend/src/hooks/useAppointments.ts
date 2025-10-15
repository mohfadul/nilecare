import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, CreateAppointmentRequest, Appointment } from '../api/appointments.api';

export function useAppointments(params: {
  page?: number;
  limit?: number;
  status?: string;
  providerId?: number;
  patientId?: number;
  date?: string;
}) {
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: () => appointmentsApi.list(params),
    keepPreviousData: true,
  });
}

export function useAppointment(id: number | undefined) {
  return useQuery({
    queryKey: ['appointments', id],
    queryFn: () => appointmentsApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAppointmentRequest) => appointmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateAppointmentRequest> }) =>
      appointmentsApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: Appointment['status'] }) =>
      appointmentsApi.updateStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', variables.id] });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => appointmentsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
    },
  });
}

export function useAvailableSlots(params: {
  providerId?: number;
  date?: string;
  duration?: number;
}) {
  return useQuery({
    queryKey: ['available-slots', params],
    queryFn: () => appointmentsApi.getAvailableSlots({
      providerId: params.providerId!,
      date: params.date!,
      duration: params.duration,
    }),
    enabled: !!params.providerId && !!params.date,
  });
}

export function useTodayAppointments(providerId?: number) {
  return useQuery({
    queryKey: ['appointments', 'today', providerId],
    queryFn: () => appointmentsApi.getToday(providerId),
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useAppointmentStatistics(params: {
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: ['appointments', 'statistics', params],
    queryFn: () => appointmentsApi.getStatistics(params),
  });
}

