import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi, CreatePaymentRequest } from '../api/payments.api';

export function usePaymentProviders() {
  return useQuery({
    queryKey: ['payment-providers'],
    queryFn: () => paymentsApi.getProviders(),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
}

export function usePayment(id: string | undefined) {
  return useQuery({
    queryKey: ['payments', id],
    queryFn: () => paymentsApi.get(id!),
    enabled: !!id,
    refetchInterval: (data) => {
      // Refetch every 5 seconds if payment is pending/processing
      const status = data?.data?.payment.status;
      return status === 'pending' || status === 'processing' ? 5000 : false;
    },
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePaymentRequest) => paymentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => paymentsApi.verify(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['payments', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useRefundPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { amount: number; reason: string } }) =>
      paymentsApi.refund(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function usePaymentHistory(patientId?: number) {
  return useQuery({
    queryKey: ['payments', 'history', patientId],
    queryFn: () => paymentsApi.getHistory(patientId),
  });
}

export function useInvoicePayments(invoiceId: number | undefined) {
  return useQuery({
    queryKey: ['payments', 'invoice', invoiceId],
    queryFn: () => paymentsApi.getByInvoice(invoiceId!),
    enabled: !!invoiceId,
  });
}
