/**
 * Dayora Logger Service
 * Production-safe logging service that strips verbose debug output in production release builds.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private static isDev = __DEV__;

  public static log(level: LogLevel, message: string, context?: unknown): void {
    switch (level) {
      case 'debug':
        this.debug(message, context);
        break;
      case 'info':
        this.info(message, context);
        break;
      case 'warn':
        this.warn(message, context);
        break;
      case 'error':
        this.error(message, context);
        break;
    }
  }

  public static debug(message: string, context?: unknown): void {
    if (this.isDev) {
      console.log(`[DEBUG] ${message}`, context ?? '');
    }
  }

  public static info(message: string, context?: unknown): void {
    if (this.isDev) {
      console.info(`[INFO] ${message}`, context ?? '');
    }
  }

  public static warn(message: string, context?: unknown): void {
    console.warn(`[WARN] ${message}`, context ?? '');
  }

  public static error(message: string, error?: unknown): void {
    console.error(`[ERROR] ${message}`, error ?? '');
  }
}
