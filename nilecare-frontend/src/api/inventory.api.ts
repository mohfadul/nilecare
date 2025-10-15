import { apiClient, NileCareResponse } from './client';

export interface InventoryItem {
  id: number;
  facilityId: number;
  itemName: string;
  itemCode: string;
  category: 'medication' | 'supply' | 'equipment' | 'consumable' | 'other';
  quantity: number;
  unit: string;
  reorderLevel: number;
  reorderQuantity: number;
  unitCost: number;
  totalValue: number;
  expiryDate?: string;
  location?: string;
  supplierId?: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'expired';
  lastRestockDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryItemRequest {
  facilityId: number;
  itemName: string;
  itemCode: string;
  category: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  reorderQuantity: number;
  unitCost: number;
  expiryDate?: string;
  location?: string;
  supplierId?: number;
}

export interface InventoryTransaction {
  id: number;
  itemId: number;
  transactionType: 'restock' | 'dispense' | 'adjustment' | 'transfer' | 'expired';
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  reason?: string;
  performedBy: number;
  createdAt: string;
}

export const inventoryApi = {
  // Get inventory list
  async list(params: {
    page?: number;
    limit?: number;
    facilityId?: number;
    category?: string;
    status?: string;
    search?: string;
  }): Promise<NileCareResponse<{ items: InventoryItem[] }>> {
    const response = await apiClient.get<NileCareResponse<{ items: InventoryItem[] }>>(
      '/api/v1/inventory',
      { params }
    );
    return response.data;
  },

  // Get single item
  async get(id: number): Promise<NileCareResponse<{ item: InventoryItem }>> {
    const response = await apiClient.get<NileCareResponse<{ item: InventoryItem }>>(
      `/api/v1/inventory/${id}`
    );
    return response.data;
  },

  // Create item
  async create(data: CreateInventoryItemRequest): Promise<NileCareResponse<{ item: InventoryItem }>> {
    const response = await apiClient.post<NileCareResponse<{ item: InventoryItem }>>(
      '/api/v1/inventory',
      data
    );
    return response.data;
  },

  // Update item
  async update(id: number, data: Partial<CreateInventoryItemRequest>): Promise<NileCareResponse<{ item: InventoryItem }>> {
    const response = await apiClient.put<NileCareResponse<{ item: InventoryItem }>>(
      `/api/v1/inventory/${id}`,
      data
    );
    return response.data;
  },

  // Delete item
  async delete(id: number): Promise<NileCareResponse<void>> {
    const response = await apiClient.delete<NileCareResponse<void>>(
      `/api/v1/inventory/${id}`
    );
    return response.data;
  },

  // Adjust quantity
  async adjustQuantity(
    id: number,
    data: {
      quantity: number;
      reason: string;
      transactionType: string;
    }
  ): Promise<NileCareResponse<{ item: InventoryItem }>> {
    const response = await apiClient.post<NileCareResponse<{ item: InventoryItem }>>(
      `/api/v1/inventory/${id}/adjust`,
      data
    );
    return response.data;
  },

  // Get low stock items
  async getLowStock(facilityId?: number): Promise<NileCareResponse<{ items: InventoryItem[] }>> {
    const response = await apiClient.get<NileCareResponse<{ items: InventoryItem[] }>>(
      '/api/v1/inventory/low-stock',
      { params: { facilityId } }
    );
    return response.data;
  },

  // Get transactions for item
  async getTransactions(itemId: number): Promise<NileCareResponse<{ transactions: InventoryTransaction[] }>> {
    const response = await apiClient.get<NileCareResponse<{ transactions: InventoryTransaction[] }>>(
      `/api/v1/inventory/${itemId}/transactions`
    );
    return response.data;
  },
};

