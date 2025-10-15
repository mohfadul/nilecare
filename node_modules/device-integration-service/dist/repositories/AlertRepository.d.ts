/**
 * Alert Repository
 * Handles device alerts and notifications
 */
import { Pool } from 'pg';
import { IAlert, AlertDTO, AlertQueryParams, AlertAcknowledgeDTO, AlertResolveDTO } from '../models/Alert';
export declare class AlertRepository {
    private pool;
    constructor(pool: Pool);
    create(alertData: AlertDTO): Promise<IAlert>;
    findById(alertId: string, tenantId: string): Promise<IAlert | null>;
    findAll(params: AlertQueryParams): Promise<{
        alerts: IAlert[];
        total: number;
    }>;
    acknowledge(acknowledgeData: AlertAcknowledgeDTO, tenantId: string): Promise<IAlert>;
    resolve(resolveData: AlertResolveDTO, tenantId: string): Promise<IAlert>;
    markNotificationSent(alertId: string, channels: string[], tenantId: string): Promise<void>;
    getCriticalAlertsCount(deviceId: string, tenantId: string): Promise<number>;
    getUnacknowledgedAlerts(tenantId: string): Promise<IAlert[]>;
    private mapRowToAlert;
}
export default AlertRepository;
//# sourceMappingURL=AlertRepository.d.ts.map