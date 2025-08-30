import { logInfo, logError, logWarn, logDebug } from "./backend";

/**
 * Logger utility class for consistent logging across the application
 */
export class Logger {
  private static getTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  private static formatMessage(level: string, message: string): string {
    const timestamp = this.getTimestamp();
    return `[${timestamp}] ${level} ${message}`;
  }

  static info(message: string): void {
    const formattedMessage = this.formatMessage('INFO', message);
    console.log(formattedMessage);
    logInfo(formattedMessage);
  }

  static error(message: string): void {
    const formattedMessage = this.formatMessage('ERROR', message);
    console.error(formattedMessage);
    logError(formattedMessage);
  }

  static warn(message: string): void {
    const formattedMessage = this.formatMessage('WARN', message);
    console.warn(formattedMessage);
    logWarn(formattedMessage);
  }

  static debug(message: string): void {
    const formattedMessage = this.formatMessage('DEBUG', message);
    console.debug(formattedMessage);
    logDebug(formattedMessage);
  }
} 