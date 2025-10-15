import winston from 'winston';

/**
 * Winston Logger Configuration
 * Provides structured logging for the Inventory Service
 * Audit-compliant with detailed tracking
 */

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(logColors);

// Log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logMessage = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      logMessage += `\n${stack}`;
    }
    
    return logMessage;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logMessage = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    if (stack) {
      logMessage += `\n${stack}`;
    }
    
    return logMessage;
  })
);

// Create logger
export const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'development' ? consoleFormat : logFormat,
    }),
    new winston.transports.File({
      filename: 'logs/inventory-service-error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/inventory-service-combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/inventory-service-audit.log',
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/inventory-service-exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/inventory-service-rejections.log' }),
  ],
});

/**
 * Log stock movement (audit trail)
 */
export function logStockMovement(params: {
  userId: string;
  userRole: string;
  itemId: string;
  itemName: string;
  movementType: 'receipt' | 'dispensing' | 'adjustment' | 'transfer' | 'return' | 'damage' | 'expiry';
  quantityChange: number;
  batchNumber?: string;
  fromLocation?: string;
  toLocation?: string;
  reference?: string;
  facilityId: string;
  timestamp?: Date;
}) {
  logger.info('STOCK_MOVEMENT', {
    event: 'stock_movement',
    userId: params.userId,
    userRole: params.userRole,
    itemId: params.itemId,
    itemName: params.itemName,
    movementType: params.movementType,
    quantityChange: params.quantityChange,
    batchNumber: params.batchNumber,
    fromLocation: params.fromLocation,
    toLocation: params.toLocation,
    reference: params.reference,
    facilityId: params.facilityId,
    timestamp: (params.timestamp || new Date()).toISOString(),
  });
}

/**
 * Log stock reservation
 */
export function logStockReservation(params: {
  userId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  reservationType: 'medication_dispense' | 'procedure' | 'transfer' | 'other';
  reference: string;
  expiresAt: Date;
  facilityId: string;
  timestamp?: Date;
}) {
  logger.info('STOCK_RESERVED', {
    event: 'stock_reservation',
    userId: params.userId,
    itemId: params.itemId,
    itemName: params.itemName,
    quantity: params.quantity,
    reservationType: params.reservationType,
    reference: params.reference,
    expiresAt: params.expiresAt.toISOString(),
    facilityId: params.facilityId,
    timestamp: (params.timestamp || new Date()).toISOString(),
  });
}

/**
 * Log stock commit (after successful dispensing)
 */
export function logStockCommit(params: {
  userId: string;
  reservationId: string;
  itemId: string;
  quantity: number;
  reference: string;
  facilityId: string;
  timestamp?: Date;
}) {
  logger.info('STOCK_COMMITTED', {
    event: 'stock_commit',
    userId: params.userId,
    reservationId: params.reservationId,
    itemId: params.itemId,
    quantity: params.quantity,
    reference: params.reference,
    facilityId: params.facilityId,
    timestamp: (params.timestamp || new Date()).toISOString(),
  });
}

/**
 * Log stock rollback (after failed dispensing)
 */
export function logStockRollback(params: {
  userId: string;
  reservationId: string;
  itemId: string;
  quantity: number;
  reason: string;
  facilityId: string;
  timestamp?: Date;
}) {
  logger.warn('STOCK_ROLLED_BACK', {
    event: 'stock_rollback',
    userId: params.userId,
    reservationId: params.reservationId,
    itemId: params.itemId,
    quantity: params.quantity,
    reason: params.reason,
    facilityId: params.facilityId,
    timestamp: (params.timestamp || new Date()).toISOString(),
  });
}

/**
 * Log low stock alert
 */
export function logLowStockAlert(params: {
  itemId: string;
  itemName: string;
  currentStock: number;
  reorderLevel: number;
  facilityId: string;
  locationId: string;
  timestamp?: Date;
}) {
  logger.warn('LOW_STOCK_ALERT', {
    event: 'low_stock_alert',
    itemId: params.itemId,
    itemName: params.itemName,
    currentStock: params.currentStock,
    reorderLevel: params.reorderLevel,
    facilityId: params.facilityId,
    locationId: params.locationId,
    timestamp: (params.timestamp || new Date()).toISOString(),
  });
}

/**
 * Log expiry alert
 */
export function logExpiryAlert(params: {
  itemId: string;
  itemName: string;
  batchNumber: string;
  expiryDate: Date;
  quantityInBatch: number;
  facilityId: string;
  locationId: string;
  daysUntilExpiry: number;
  timestamp?: Date;
}) {
  logger.warn('EXPIRY_ALERT', {
    event: 'expiry_alert',
    itemId: params.itemId,
    itemName: params.itemName,
    batchNumber: params.batchNumber,
    expiryDate: params.expiryDate.toISOString(),
    quantityInBatch: params.quantityInBatch,
    daysUntilExpiry: params.daysUntilExpiry,
    facilityId: params.facilityId,
    locationId: params.locationId,
    timestamp: (params.timestamp || new Date()).toISOString(),
  });
}

// Prevent crash on unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise,
  });
});

export default logger;

