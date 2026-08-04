type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private static instance: Logger;
  private isProduction = import.meta.env.PROD;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  public debug(message: string, context?: LogContext): void {
    if (!this.isProduction) {
      console.debug(this.formatMessage('debug', message), context || '');
    }
  }

  public info(message: string, context?: LogContext): void {
    console.info(this.formatMessage('info', message), context || '');
    // Preparado para integração com Sentry/PostHog
  }

  public warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message), context || '');
  }

  public error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorDetails = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    console.error(this.formatMessage('error', message), { error: errorDetails, ...context });
    // TODO: Enviar para serviço de monitoramento em produção
  }
}

export const logger = Logger.getInstance();
