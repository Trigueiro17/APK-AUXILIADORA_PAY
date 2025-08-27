import winston from 'winston';
import path from 'path';

// Configuração dos níveis de log
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Cores para os níveis de log
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

// Adiciona as cores ao winston
winston.addColors(logColors);

// Formato personalizado para logs
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Formato para console (desenvolvimento)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Configuração dos transports
const transports: winston.transport[] = [];

// Console transport (sempre ativo em desenvolvimento)
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || 'debug',
      format: consoleFormat,
    })
  );
}

// File transports (produção e desenvolvimento)
const logDir = process.env.LOG_FILE_PATH || './logs';
const maxSize = process.env.LOG_MAX_SIZE || '10m';
const maxFiles = parseInt(process.env.LOG_MAX_FILES || '5');

// Log de erros
transports.push(
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: logFormat,
    maxsize: maxSize as any,
    maxFiles,
    tailable: true,
  })
);

// Log combinado
transports.push(
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    format: logFormat,
    maxsize: maxSize as any,
    maxFiles,
    tailable: true,
  })
);

// Log de sincronização
transports.push(
  new winston.transports.File({
    filename: path.join(logDir, 'sync.log'),
    level: 'info',
    format: logFormat,
    maxsize: maxSize as any,
    maxFiles,
    tailable: true,
  })
);

// Criação do logger principal
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Logger específico para sincronização
export const syncLogger = winston.createLogger({
  level: 'info',
  levels: logLevels,
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'sync.log'),
      format: logFormat,
      maxsize: maxSize as any,
      maxFiles,
      tailable: true,
    }),
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      })
    ] : []),
  ],
});

// Logger específico para API requests
export const apiLogger = winston.createLogger({
  level: 'info',
  levels: logLevels,
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'api.log'),
      format: logFormat,
      maxsize: maxSize as any,
      maxFiles,
      tailable: true,
    }),
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      })
    ] : []),
  ],
});

// Logger específico para erros de sistema
export const errorLogger = winston.createLogger({
  level: 'error',
  levels: logLevels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      format: logFormat,
      maxsize: maxSize as any,
      maxFiles,
      tailable: true,
    }),
  ],
});

// Classe para logging estruturado
export class StructuredLogger {
  private logger: winston.Logger;
  private context: Record<string, any>;

  constructor(context: Record<string, any> = {}, customLogger?: winston.Logger) {
    this.logger = customLogger || logger;
    this.context = context;
  }

  private formatMessage(message: string, meta: Record<string, any> = {}) {
    return {
      message,
      ...this.context,
      ...meta,
      timestamp: new Date().toISOString(),
    };
  }

  error(message: string, meta: Record<string, any> = {}) {
    this.logger.error(this.formatMessage(message, meta));
  }

  warn(message: string, meta: Record<string, any> = {}) {
    this.logger.warn(this.formatMessage(message, meta));
  }

  info(message: string, meta: Record<string, any> = {}) {
    this.logger.info(this.formatMessage(message, meta));
  }

  debug(message: string, meta: Record<string, any> = {}) {
    this.logger.debug(this.formatMessage(message, meta));
  }

  // Métodos específicos para diferentes tipos de eventos
  syncStart(entity: string, operation: string) {
    this.info('Sync started', { entity, operation, type: 'sync_start' });
  }

  syncSuccess(entity: string, operation: string, duration: number, count?: number) {
    this.info('Sync completed successfully', {
      entity,
      operation,
      duration,
      count,
      type: 'sync_success',
    });
  }

  syncError(entity: string, operation: string, error: any, duration?: number) {
    this.error('Sync failed', {
      entity,
      operation,
      error: error.message || error,
      stack: error.stack,
      duration,
      type: 'sync_error',
    });
  }

  apiRequest(method: string, url: string, statusCode: number, duration: number) {
    this.info('API request', {
      method,
      url,
      statusCode,
      duration,
      type: 'api_request',
    });
  }

  apiError(method: string, url: string, error: any, duration?: number) {
    this.error('API request failed', {
      method,
      url,
      error: error.message || error,
      statusCode: error.status || error.statusCode,
      duration,
      type: 'api_error',
    });
  }

  userAction(userId: string, action: string, details: Record<string, any> = {}) {
    this.info('User action', {
      userId,
      action,
      ...details,
      type: 'user_action',
    });
  }

  systemEvent(event: string, details: Record<string, any> = {}) {
    this.info('System event', {
      event,
      ...details,
      type: 'system_event',
    });
  }

  performance(operation: string, duration: number, details: Record<string, any> = {}) {
    this.info('Performance metric', {
      operation,
      duration,
      ...details,
      type: 'performance',
    });
  }
}

// Instâncias pré-configuradas
export const syncStructuredLogger = new StructuredLogger({ service: 'sync' }, syncLogger);
export const apiStructuredLogger = new StructuredLogger({ service: 'api' }, apiLogger);
export const systemStructuredLogger = new StructuredLogger({ service: 'system' });

// Função helper para criar logger com contexto
export const createLogger = (context: Record<string, any>) => {
  return new StructuredLogger(context);
};

// Middleware para capturar erros não tratados
process.on('uncaughtException', (error) => {
  errorLogger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
    type: 'uncaught_exception',
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  errorLogger.error('Unhandled Rejection', {
    reason,
    promise,
    type: 'unhandled_rejection',
  });
});

// Função para configurar logging em produção
export const configureProductionLogging = () => {
  // Remove console transport em produção
  logger.remove(winston.transports.Console);
  
  // Adiciona transport para serviços externos (ex: Sentry, LogRocket)
  // Implementar conforme necessário
};

// Função para obter estatísticas de logs
export const getLogStats = async () => {
  // Implementar lógica para obter estatísticas dos logs
  // Por exemplo, contar erros por período, etc.
  return {
    totalErrors: 0,
    totalWarnings: 0,
    totalInfo: 0,
    lastError: null,
  };
};

export default logger;