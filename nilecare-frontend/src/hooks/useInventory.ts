import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, CreateInventoryItemRequest } from '../api/inventory.api';

export function useInventory(params: {
  page?: number;
  limit?: number;
  facilityId?: number;
  category?: string;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['inventory', params],
    queryFn: () => inventoryApi.list(params),
    keepPreviousData: true,
  });
}

export function useInventoryItem(id: number | undefined) {
  return useQuery({
    queryKey: ['inventory', id],
    queryFn: () => inventoryApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInventoryItemRequest) => inventoryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateInventoryItemRequest> }) =>
      inventoryApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.id] });
    },
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => inventoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useAdjustInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { quantity: number; reason: string; transactionType: string } }) =>
      inventoryApi.adjustQuantity(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.id] });
    },
  });
}

export function useLowStockItems(facilityId?: number) {
  return useQuery({
    queryKey: ['inventory', 'low-stock', facilityId],
    queryFn: () => inventoryApi.getLowStock(facilityId),
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useInventoryTransactions(itemId: number | undefined) {
  return useQuery({
    queryKey: ['inventory', itemId, 'transactions'],
    queryFn: () => inventoryApi.getTransactions(itemId!),
    enabled: !!itemId,
  });
}

