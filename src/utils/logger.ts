import chalk from 'chalk';

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Current log level
 */
let currentLogLevel = LogLevel.INFO;

/**
 * Sets the current log level
 * @param level Log level to set
 */
export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

/**
 * Logs a debug message
 * @param message Message to log
 */
export function debug(message: string): void {
  if (currentLogLevel <= LogLevel.DEBUG) {
    console.log(chalk.gray(`[DEBUG] ${message}`));
  }
}

/**
 * Logs an info message
 * @param message Message to log
 */
export function info(message: string): void {
  if (currentLogLevel <= LogLevel.INFO) {
    console.log(chalk.blue(`[INFO] ${message}`));
  }
}

/**
 * Logs a warning message
 * @param message Message to log
 */
export function warn(message: string): void {
  if (currentLogLevel <= LogLevel.WARN) {
    console.log(chalk.yellow(`[WARN] ${message}`));
  }
}

/**
 * Logs an error message
 * @param message Message to log
 */
export function error(message: string): void {
  if (currentLogLevel <= LogLevel.ERROR) {
    console.log(chalk.red(`[ERROR] ${message}`));
  }
}

/**
 * Logs a success message
 * @param message Message to log
 */
export function success(message: string): void {
  if (currentLogLevel <= LogLevel.INFO) {
    console.log(chalk.green(`[SUCCESS] ${message}`));
  }
}
