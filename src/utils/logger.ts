/**
 * Logging utility for application-wide logging with colored output
 * Provides different log levels and structured logging capabilities
 * @module utils/logger
 */

/**
 * Available log levels in order of increasing severity
 */
export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO', 
    WARN = 'WARN',
    ERROR = 'ERROR'
}

/**
 * Logger class providing structured logging with color-coded output
 * Supports multiple log levels and context-aware logging
 */
export class Logger {
    /** ANSI color codes for different types of log messages */
    private readonly colors = {
      reset: '\x1b[0m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      cyan: '\x1b[36m'
    };
  
    /**
     * Generates ISO timestamp for log entries
     * @returns Formatted timestamp string
     */
    private getTimestamp(): string {
      return new Date().toISOString();
    }
  
    /**
     * Maps log levels to appropriate colors
     * @param level - Log level to get color for
     * @returns ANSI color code for the log level
     */
    private getColor(level: LogLevel): string {
      switch (level) {
        case LogLevel.ERROR:
          return this.colors.red;
        case LogLevel.WARN:
          return this.colors.yellow;
        case LogLevel.INFO:
          return this.colors.green;
        case LogLevel.DEBUG:
          return this.colors.cyan;
        default:
          return this.colors.reset;
      }
    }
  
    /**
     * Core logging function that handles all log levels
     * @param level - Severity level of the log
     * @param message - Main log message
     * @param context - Optional structured data to include
     */
    private log(level: LogLevel, message: string, context?: any): void {
      const timestamp = this.getTimestamp();
      const color = this.getColor(level);
      
      let logMessage = `${color}[${timestamp}] [${level}] ${message}${this.colors.reset}`;
      
      if (context) {
        logMessage += '\n' + JSON.stringify(context, null, 2);
      }
      
      console.log(logMessage);
    }
  
    /**
     * Logs debug level messages
     * @param message - Debug message
     * @param context - Optional debug context
     */
    debug(message: string, context?: any): void {
      this.log(LogLevel.DEBUG, message, context);
    }
  
    /**
     * Logs informational messages
     * @param message - Info message
     * @param context - Optional info context
     */
    info(message: string, context?: any): void {
      this.log(LogLevel.INFO, message, context);
    }
  
    /**
     * Logs warning messages
     * @param message - Warning message
     * @param context - Optional warning context
     */
    warn(message: string, context?: any): void {
      this.log(LogLevel.WARN, message, context);
    }
  
    /**
     * Logs error messages with optional error objects
     * @param message - Error message
     * @param error - Optional Error object
     * @param context - Optional error context
     */
    error(message: string, error?: Error, context?: any): void {
      const errorContext = error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...context
      } : context;
  
      this.log(LogLevel.ERROR, message, errorContext);
    }
}