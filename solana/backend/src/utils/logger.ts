interface LogData {
  [key: string]: any;
}

class Logger {
  private formatMessage(level: string, message: string, data?: LogData): string {
    const timestamp = new Date().toISOString();
    const baseMsg = `[${level}] ${timestamp} - ${message}`;
    
    if (data) {
      return `${baseMsg}\n${JSON.stringify(data, null, 2)}`;
    }
    
    return baseMsg;
  }

  info(message: string, data?: LogData) {
    console.log(this.formatMessage('INFO', message, data));
  }

  error(message: string, error?: Error | LogData) {
    if (error instanceof Error) {
      console.error(this.formatMessage('ERROR', message, {
        message: error.message,
        stack: error.stack,
        name: error.name
      }));
    } else {
      console.error(this.formatMessage('ERROR', message, error));
    }
  }

  warn(message: string, data?: LogData) {
    console.warn(this.formatMessage('WARN', message, data));
  }

  debug(message: string, data?: LogData) {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatMessage('DEBUG', message, data));
    }
  }

  // Performance logging
  time(label: string) {
    console.time(`[PERF] ${label}`);
  }

  timeEnd(label: string) {
    console.timeEnd(`[PERF] ${label}`);
  }
}

export const logger = new Logger();