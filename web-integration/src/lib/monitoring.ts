import { auxiliadoraApiClient } from './api-client';
import { SystemStatus } from '@/types';

/**
 * Interface para métricas do sistema
 */
export interface SystemMetrics {
  // Métricas de dados
  totalUsers: number;
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  
  // Métricas de sincronização
  syncStatus: SystemStatus;
  lastSyncTime: Date | null;
  syncErrorRate: number;
  
  // Métricas de performance
  avgResponseTime: number;
  apiRequestCount: number;
  errorRate: number;
  
  // Métricas de sistema
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  
  // Status geral
  overallHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

/**
 * Interface para alertas
 */
export interface Alert {
  id: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: any;
}

/**
 * Classe principal para monitoramento do sistema
 */
export class MonitoringService {
  private static instance: MonitoringService;
  private startTime: Date;
  private healthCheckInterval?: ReturnType<typeof setInterval>;
  private metricsInterval?: ReturnType<typeof setInterval>;
  private alerts: Alert[] = [];

  constructor() {
    this.startTime = new Date();
  }

  /**
   * Singleton instance
   */
  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Inicia o sistema de monitoramento
   */
  async start(): Promise<void> {
    console.log('Starting monitoring service...');
    
    // Inicia verificações de saúde periódicas
    this.startHealthChecks();
    
    // Inicia coleta de métricas
    this.startMetricsCollection();
    
    // Executa verificação inicial
    await this.performHealthCheck();
    
    console.log('Monitoring service started successfully');
  }

  /**
   * Para o sistema de monitoramento
   */
  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = undefined;
    }
    
    console.log('Monitoring service stopped');
  }

  /**
   * Inicia verificações de saúde periódicas
   */
  private startHealthChecks(): void {
    const interval = parseInt(process.env.HEALTH_CHECK_INTERVAL || '60000'); // 1 minuto
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Health check error:', error);
      }
    }, interval);
  }

  /**
   * Inicia coleta de métricas
   */
  private startMetricsCollection(): void {
    const interval = parseInt(process.env.METRICS_COLLECTION_INTERVAL || '300000'); // 5 minutos
    
    this.metricsInterval = setInterval(async () => {
      try {
        await this.collectAndStoreMetrics();
      } catch (error) {
        console.error('Metrics collection error:', error);
      }
    }, interval);
  }

  /**
   * Executa verificação de saúde completa
   */
  async performHealthCheck(): Promise<{
    api: boolean;
    sync: boolean;
    overall: boolean;
  }> {
    const results = {
      api: false,
      sync: false,
      overall: false,
    };

    try {
      // Verifica API Auxiliadora Pay
      results.api = await this.checkApiHealth();
      
      // Verifica sistema de sincronização
      results.sync = await this.checkSyncHealth();
      
      // Status geral
      results.overall = results.api && results.sync;
      
      // Registra resultado
      console.log('Health check completed:', results);
      
      // Gera alertas se necessário
      await this.processHealthCheckResults(results);
      
      return results;
    } catch (error) {
      console.error('Health check failed:', error);
      return results;
    }
  }



  /**
   * Verifica saúde da API
   */
  private async checkApiHealth(): Promise<boolean> {
    try {
      const isHealthy = await auxiliadoraApiClient.healthCheck();
      
      if (!isHealthy) {
        await this.createAlert({
          type: 'ERROR',
          title: 'API Health Check Failed',
          message: 'Auxiliadora Pay API is not responding properly',
        });
      }
      
      return isHealthy;
    } catch (error) {
      await this.createAlert({
        type: 'CRITICAL',
        title: 'API Connection Failed',
        message: `Failed to connect to Auxiliadora Pay API: ${error}`,
        metadata: { error: error instanceof Error ? error.message : String(error) },
      });
      
      return false;
    }
  }

  /**
   * Verifica saúde do sistema de sincronização
   */
  private async checkSyncHealth(): Promise<boolean> {
    try {
      // Simulação do status de sincronização
      const syncStatus = {
        isRunning: true,
        lastSync: new Date(),
        errors: []
      };
      
      // Verifica se a sincronização está rodando
      if (!syncStatus.isRunning) {
        await this.createAlert({
          type: 'ERROR',
          title: 'Sync Engine Not Running',
          message: 'The synchronization engine is not active',
        });
        return false;
      }
      
      // Verifica se há sincronizações recentes
      const lastSyncTime = syncStatus.lastSync;
      
      if (lastSyncTime) {
        const timeSinceLastSync = Date.now() - lastSyncTime.getTime();
        const maxSyncInterval = parseInt(process.env.SYNC_INTERVAL || '30000') * 3; // 3x o intervalo normal
        
        if (timeSinceLastSync > maxSyncInterval) {
          await this.createAlert({
            type: 'WARNING',
            title: 'Sync Delay Detected',
            message: `Last sync was ${Math.round(timeSinceLastSync / 1000 / 60)} minutes ago`,
            metadata: { lastSyncTime, timeSinceLastSync },
          });
          return false;
        }
      }
      
      return true;
    } catch (error) {
      await this.createAlert({
        type: 'ERROR',
        title: 'Sync Health Check Failed',
        message: `Failed to check sync health: ${error}`,
        metadata: { error: error instanceof Error ? error.message : String(error) },
      });
      
      return false;
    }
  }

  /**
   * Processa resultados da verificação de saúde
   */
  private async processHealthCheckResults(results: {
    api: boolean;
    sync: boolean;
    overall: boolean;
  }): Promise<void> {
    // Se tudo estiver funcionando, resolve alertas relacionados
    if (results.overall) {
      await this.resolveAlerts(['API Connection Failed', 'Sync Engine Not Running']);
    }
    
    // Status não é mais salvo no banco local
    console.log('Health check status updated:', {
      syncStatus: results.overall ? 'HEALTHY' : 'ERROR',
      timestamp: new Date()
    });
  }

  /**
   * Coleta e armazena métricas do sistema
   */
  async collectAndStoreMetrics(): Promise<SystemMetrics> {
    try {
      const metrics = await this.calculateSystemMetrics();
      
      // Métricas não são mais salvas no banco local
      console.log('System metrics stored:', {
        totalUsers: metrics.totalUsers,
        totalProducts: metrics.totalProducts,
        totalSales: metrics.totalSales,
        totalRevenue: metrics.totalRevenue,
        syncStatus: metrics.syncStatus,
        errorRate: metrics.errorRate,
        timestamp: new Date()
      });
      
      // Registra métricas no log
      console.log('Metrics collected:', {
        totalUsers: metrics.totalUsers,
        totalProducts: metrics.totalProducts,
        totalSales: metrics.totalSales,
        syncStatus: metrics.syncStatus,
        errorRate: metrics.errorRate,
        overallHealth: metrics.overallHealth,
      });
      
      // Verifica se há problemas nas métricas
      await this.analyzeMetrics(metrics);
      
      return metrics;
    } catch (error) {
      console.error('Metrics collection failed:', error);
      throw error;
    }
  }

  /**
   * Calcula métricas do sistema usando API externa
   */
  private async calculateSystemMetrics(): Promise<SystemMetrics> {
    try {
      // Busca métricas da API externa
      const [users, products, sales] = await Promise.all([
        auxiliadoraApiClient.getUsers({ active: true }),
        auxiliadoraApiClient.getProducts({ active: true }),
        auxiliadoraApiClient.getSales({}),
      ]);

      const userCount = users.length || 0;
      const productCount = products.length || 0;
      const saleCount = sales.length || 0;
      const totalRevenue = sales.reduce((sum: number, sale: any) => sum + sale.total, 0) || 0;

      // Métricas de sincronização simuladas
      const lastSyncTime = new Date();
      const syncErrorRate = 0; // Simulado como 0% de erro

      // Métricas de performance simuladas
      const avgResponseTime = 500; // Simulado
      const errorRate = 0; // Simulado

      // Métricas de sistema
      const uptime = Date.now() - this.startTime.getTime();
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      // Determina status geral
      let overallHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
      
      if (syncErrorRate > 50 || errorRate > 20) {
        overallHealth = 'CRITICAL';
      } else if (syncErrorRate > 20 || errorRate > 10 || avgResponseTime > 2000) {
        overallHealth = 'WARNING';
      }

      return {
        totalUsers: userCount,
        totalProducts: productCount,
        totalSales: saleCount,
        totalRevenue,
        syncStatus: 'HEALTHY',
        lastSyncTime,
        syncErrorRate,
        avgResponseTime,
        apiRequestCount: 0, // Simulado
        errorRate,
        uptime,
        memoryUsage: memoryUsage.heapUsed / 1024 / 1024, // MB
        cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000, // ms
        overallHealth,
      };
    } catch (error) {
      console.error('Failed to calculate system metrics:', error);
      // Retorna métricas padrão em caso de erro
      return {
        totalUsers: 0,
        totalProducts: 0,
        totalSales: 0,
        totalRevenue: 0,
        syncStatus: 'ERROR',
        lastSyncTime: null,
        syncErrorRate: 0,
        avgResponseTime: 0,
        apiRequestCount: 0,
        errorRate: 0,
        uptime: Date.now() - this.startTime.getTime(),
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
        cpuUsage: 0,
        overallHealth: 'CRITICAL',
      };
    }
  }

  /**
   * Analisa métricas e gera alertas se necessário
   */
  private async analyzeMetrics(metrics: SystemMetrics): Promise<void> {
    // Alerta para alta taxa de erro
    if (metrics.errorRate > 10) {
      await this.createAlert({
        type: metrics.errorRate > 20 ? 'CRITICAL' : 'WARNING',
        title: 'High Error Rate Detected',
        message: `Error rate is ${metrics.errorRate.toFixed(2)}%`,
        metadata: { errorRate: metrics.errorRate },
      });
    }

    // Alerta para tempo de resposta alto
    if (metrics.avgResponseTime > 2000) {
      await this.createAlert({
        type: metrics.avgResponseTime > 5000 ? 'ERROR' : 'WARNING',
        title: 'Slow API Response Time',
        message: `Average response time is ${metrics.avgResponseTime.toFixed(0)}ms`,
        metadata: { avgResponseTime: metrics.avgResponseTime },
      });
    }

    // Alerta para alta taxa de erro de sincronização
    if (metrics.syncErrorRate > 20) {
      await this.createAlert({
        type: metrics.syncErrorRate > 50 ? 'CRITICAL' : 'WARNING',
        title: 'High Sync Error Rate',
        message: `Sync error rate is ${metrics.syncErrorRate.toFixed(2)}%`,
        metadata: { syncErrorRate: metrics.syncErrorRate },
      });
    }

    // Alerta para uso alto de memória
    if (metrics.memoryUsage > 500) { // 500MB
      await this.createAlert({
        type: metrics.memoryUsage > 1000 ? 'ERROR' : 'WARNING',
        title: 'High Memory Usage',
        message: `Memory usage is ${metrics.memoryUsage.toFixed(0)}MB`,
        metadata: { memoryUsage: metrics.memoryUsage },
      });
    }
  }

  /**
   * Cria um novo alerta
   */
  private async createAlert(alertData: {
    type: Alert['type'];
    title: string;
    message: string;
    metadata?: any;
  }): Promise<Alert> {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: alertData.type,
      title: alertData.title,
      message: alertData.message,
      timestamp: new Date(),
      resolved: false,
      metadata: alertData.metadata,
    };

    // Verifica se já existe um alerta similar não resolvido
    const existingAlert = this.alerts.find(
      a => !a.resolved && a.title === alert.title
    );

    if (!existingAlert) {
      this.alerts.push(alert);
      
      // Registra o alerta
      console.log('Alert created:', {
        alertId: alert.id,
        type: alert.type,
        title: alert.title,
        message: alert.message,
      });
      
      // Log baseado no tipo
      switch (alert.type) {
        case 'CRITICAL':
          console.error(`CRITICAL ALERT: ${alert.title} - ${alert.message}`, alert.metadata);
          break;
        case 'ERROR':
          console.error(`ERROR ALERT: ${alert.title} - ${alert.message}`, alert.metadata);
          break;
        case 'WARNING':
          console.warn(`WARNING ALERT: ${alert.title} - ${alert.message}`, alert.metadata);
          break;
        default:
          console.info(`INFO ALERT: ${alert.title} - ${alert.message}`, alert.metadata);
      }
    }

    return alert;
  }

  /**
   * Resolve alertas por título
   */
  private async resolveAlerts(titles: string[]): Promise<void> {
    const resolvedAlerts = this.alerts.filter(
      alert => !alert.resolved && titles.includes(alert.title)
    );

    resolvedAlerts.forEach(alert => {
      alert.resolved = true;
      
      console.log('Alert resolved:', {
        alertId: alert.id,
        title: alert.title,
      });
      
      console.info(`Alert resolved: ${alert.title}`);
    });
  }

  /**
   * Obtém alertas ativos
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Obtém todos os alertas
   */
  getAllAlerts(): Alert[] {
    return [...this.alerts];
  }

  /**
   * Obtém métricas atuais
   */
  async getCurrentMetrics(): Promise<SystemMetrics> {
    return await this.calculateSystemMetrics();
  }

  /**
   * Obtém histórico de métricas (simulado)
   */
  async getMetricsHistory(): Promise<{
    timestamp: Date;
    totalUsers: number;
    totalProducts: number;
    totalSales: number;
    totalRevenue: number;
    syncStatus: SystemStatus;
    errorRate: number;
  }[]> {
    // Retorna dados simulados para o histórico
    const now = new Date();
    const history = [];
    
    // Gera pontos de dados simulados
    for (let i = 0; i < 10; i++) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000); // Cada hora
      history.push({
        timestamp,
        totalUsers: Math.floor(Math.random() * 100) + 50,
        totalProducts: Math.floor(Math.random() * 200) + 100,
        totalSales: Math.floor(Math.random() * 50) + 10,
        totalRevenue: Math.floor(Math.random() * 10000) + 5000,
        syncStatus: 'HEALTHY' as SystemStatus,
        errorRate: Math.random() * 5, // 0-5% de erro
      });
    }
    
    return history.reverse(); // Ordem cronológica
  }

  /**
   * Limpa dados antigos de monitoramento
   */
  async cleanup(): Promise<void> {
    // Remove alertas resolvidos antigos
    const initialAlertsCount = this.alerts.length;
    this.alerts = this.alerts.filter(
      alert => !alert.resolved || 
      (Date.now() - alert.timestamp.getTime()) < (7 * 24 * 60 * 60 * 1000) // 7 dias
    );

    console.info(`Monitoring cleanup completed`, {
      alertsRemoved: initialAlertsCount - this.alerts.length,
      alertsRemaining: this.alerts.length,
    });
  }
}

// Instância singleton
export const monitoringService = MonitoringService.getInstance();

// Função para inicializar o monitoramento
export async function initializeMonitoring(): Promise<void> {
  const monitoringEnabled = process.env.MONITORING_ENABLED !== 'false';
  
  if (monitoringEnabled) {
    console.info('Initializing monitoring service...');
    await monitoringService.start();
    console.info('Monitoring service initialized');
  } else {
    console.info('Monitoring service disabled by configuration');
  }
}

// Função para finalizar o monitoramento
export function stopMonitoring(): void {
  monitoringService.stop();
  console.info('Monitoring service stopped');
}

// Cleanup automático ao encerrar o processo
process.on('beforeExit', () => {
  stopMonitoring();
});

process.on('SIGINT', () => {
  stopMonitoring();
});

process.on('SIGTERM', () => {
  stopMonitoring();
});

export default monitoringService;