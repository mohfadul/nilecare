import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi, CreateInvoiceRequest } from '../api/billing.api';

export function useInvoices(params: {
  page?: number;
  limit?: number;
  status?: string;
  patientId?: number;
  facilityId?: number;
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => billingApi.list(params),
    keepPreviousData: true,
  });
}

export function useInvoice(id: number | undefined) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => billingApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvoiceRequest) => billingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateInvoiceRequest> }) =>
      billingApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', variables.id] });
    },
  });
}

export function useCancelInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => billingApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useInvoiceStatistics(params?: {
  dateFrom?: string;
  dateTo?: string;
  facilityId?: number;
}) {
  return useQuery({
    queryKey: ['invoices', 'statistics', params],
    queryFn: () => billingApi.getStatistics(params),
  });
}

export function useSyncPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => billingApi.syncPayment(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices', id] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

