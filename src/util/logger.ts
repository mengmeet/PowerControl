import { Backend } from ".";

/**
 * Logger utility class for consistent logging across the application
 */
export class Logger {
  private static getTimestamp(): string {
    return new Date().toISOString();
  }

  private static formatMessage(level: string, message: string): string {
    const timestamp = this.getTimestamp();
    return `[${timestamp}] ${level} ${message}`;
  }

  static info(message: string): void {
    const formattedMessage = this.formatMessage('INFO', message);
    console.log(formattedMessage);
    Backend.logInfo(formattedMessage);
  }

  static error(message: string): void {
    const formattedMessage = this.formatMessage('ERROR', message);
    console.error(formattedMessage);
    Backend.logError(formattedMessage);
  }

  static warn(message: string): void {
    const formattedMessage = this.formatMessage('WARN', message);
    console.warn(formattedMessage);
    Backend.logWarn(formattedMessage);
  }

  static debug(message: string): void {
    const formattedMessage = this.formatMessage('DEBUG', message);
    console.debug(formattedMessage);
    Backend.logDebug(formattedMessage);
  }
} 