/**
 * Shared logger utility
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service?: string;
  context?: Record<string, any>;
  error?: Error;
}

export class Logger {
  constructor(private serviceName: string) {}

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } as any : undefined,
    };

    // In production, you might send this to a logging service
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(entry));
    } else {
      // Pretty print for development
      const color = this.getColor(level);
      console.log(
        `${color}[${entry.timestamp}] [${level.toUpperCase()}] [${this.serviceName}]${this.resetColor} ${message}`,
        context ? context : '',
        error ? error : ''
      );
    }
  }

  private getColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR: return '\x1b[31m'; // Red
      case LogLevel.WARN: return '\x1b[33m'; // Yellow
      case LogLevel.INFO: return '\x1b[36m'; // Cyan
      case LogLevel.DEBUG: return '\x1b[90m'; // Gray
      default: return '';
    }
  }

  private resetColor = '\x1b[0m';

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: Record<string, any>): void {
    if (process.env.NODE_ENV !== 'production') {
      this.log(LogLevel.DEBUG, message, context);
    }
  }
}

/**
 * Create a logger instance for a service
 */
export function createLogger(serviceName: string): Logger {
  return new Logger(serviceName);
}

