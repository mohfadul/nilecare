/**
 * Inventory Service Client
 * Provides type-safe access to Inventory Service APIs
 */
export declare class InventoryServiceClient {
    private baseUrl;
    private axiosInstance;
    private breaker;
    constructor(baseUrl: string);
    /**
     * Set authorization token for requests
     */
    setAuthToken(token: string): void;
    /**
     * Get low stock items count
     */
    getLowStockItemsCount(): Promise<number>;
    /**
     * Get low stock items details
     */
    getLowStockItems(limit?: number): Promise<any[]>;
    /**
     * Get out of stock items count
     */
    getOutOfStockCount(): Promise<number>;
    /**
     * Get all inventory stats
     */
    getAllStats(): Promise<any>;
}
export default InventoryServiceClient;
