/**
 * Validation Utilities
 * Common validation functions for device integration
 */
import { DeviceProtocol } from '../models/Device';
export declare const isValidUUID: (uuid: string) => boolean;
export declare const isValidDeviceType: (type: string) => boolean;
export declare const isValidDeviceProtocol: (protocol: string) => boolean;
export declare const isValidDeviceStatus: (status: string) => boolean;
export declare const isValidAlertType: (type: string) => boolean;
export declare const isValidAlertSeverity: (severity: string) => boolean;
export declare const isValidVitalSign: (value: number, min: number, max: number) => boolean;
export declare const sanitizeString: (input: string) => string;
export declare const validateConnectionParams: (protocol: DeviceProtocol, params: any) => boolean;
export declare const validateVitalSignsRange: (parameter: string, value: number) => boolean;
declare const _default: {
    isValidUUID: (uuid: string) => boolean;
    isValidDeviceType: (type: string) => boolean;
    isValidDeviceProtocol: (protocol: string) => boolean;
    isValidDeviceStatus: (status: string) => boolean;
    isValidAlertType: (type: string) => boolean;
    isValidAlertSeverity: (severity: string) => boolean;
    isValidVitalSign: (value: number, min: number, max: number) => boolean;
    sanitizeString: (input: string) => string;
    validateConnectionParams: (protocol: DeviceProtocol, params: any) => boolean;
    validateVitalSignsRange: (parameter: string, value: number) => boolean;
};
export default _default;
//# sourceMappingURL=validators.d.ts.map