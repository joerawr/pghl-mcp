/**
 * Simple console logging utility for PGHL-MCP
 * All logs go to stderr to keep stdout clean for MCP protocol
 */

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Logger configuration
 */
const config = {
  level: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
  timestamp: true,
};

/**
 * Get log level priority for comparison
 */
function getLevelPriority(level: LogLevel): number {
  const priorities = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
  };
  return priorities[level];
}

/**
 * Check if message should be logged based on current log level
 */
function shouldLog(level: LogLevel): boolean {
  return getLevelPriority(level) >= getLevelPriority(config.level);
}

/**
 * Format log message with timestamp and level
 */
function formatMessage(level: LogLevel, message: string): string {
  const timestamp = config.timestamp
    ? `[${new Date().toISOString()}]`
    : '';
  return `${timestamp} [${level}] ${message}`;
}

/**
 * Log debug message
 */
export function debug(message: string, ...args: unknown[]): void {
  if (shouldLog(LogLevel.DEBUG)) {
    console.error(formatMessage(LogLevel.DEBUG, message), ...args);
  }
}

/**
 * Log info message
 */
export function info(message: string, ...args: unknown[]): void {
  if (shouldLog(LogLevel.INFO)) {
    console.error(formatMessage(LogLevel.INFO, message), ...args);
  }
}

/**
 * Log warning message
 */
export function warn(message: string, ...args: unknown[]): void {
  if (shouldLog(LogLevel.WARN)) {
    console.error(formatMessage(LogLevel.WARN, message), ...args);
  }
}

/**
 * Log error message
 */
export function error(message: string, ...args: unknown[]): void {
  if (shouldLog(LogLevel.ERROR)) {
    console.error(formatMessage(LogLevel.ERROR, message), ...args);
  }
}

/**
 * Default logger object
 */
export const logger = {
  debug,
  info,
  warn,
  error,
};
