/**
 * Logger Utility
 * Handles all console logging with development-only filtering
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: Date;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logs: LogEntry[] = [];

  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toLocaleTimeString();
    const emoji = {
      debug: '🐛',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    }[level];

    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] ${emoji} ${message}${dataStr}`;
  }

  /**
   * Log debug message (development only)
   */
  debug(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, data));
    }
    this.logs.push({ level: 'debug', message, data, timestamp: new Date() });
  }

  /**
   * Log info message (development only)
   */
  info(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message, data));
    }
    this.logs.push({ level: 'info', message, data, timestamp: new Date() });
  }

  /**
   * Log warning message (development only)
   */
  warn(message: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.warn(this.formatMessage('warn', message, data));
    }
    this.logs.push({ level: 'warn', message, data, timestamp: new Date() });
  }

  /**
   * Log error message (always logged)
   */
  error(message: string, error?: Error | unknown): void {
    const errorData = error instanceof Error ? error.message : error;
    console.error(this.formatMessage('error', message, errorData));
    this.logs.push({ level: 'error', message, data: errorData, timestamp: new Date() });
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return this.logs;
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Export singleton instance
export const logger = new Logger();

export default logger;
