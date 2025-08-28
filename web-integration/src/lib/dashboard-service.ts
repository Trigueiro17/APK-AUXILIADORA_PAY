import { auxiliadoraApiClient } from './api-client';
import type { DashboardStats } from '@/types';

// Tipos para os dados do dashboard
export interface DashboardMetrics {
  totalSales: number;
  totalRevenue: number;
  dailyGoal: number;
  salesGrowth: number;
  revenueGrowth: number;
  goalProgress: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ActivityItem {
  id: string;
  type: 'sale' | 'user' | 'product' | 'system';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  status?: 'success' | 'warning' | 'error' | 'info';
  user?: string;
  details?: string;
  metadata?: Record<string, any>;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  charts: {
    sales: ChartDataPoint[];
    revenue: ChartDataPoint[];
    weekly: ChartDataPoint[];
    paymentMethods: ChartDataPoint[];
  };
  activities: ActivityItem[];
  stats: DashboardStats;
}

class DashboardService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data as T;
    }
    return null;
  }

  private setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Busca métricas agregadas do dashboard
   */
  async getMetrics(): Promise<DashboardMetrics> {
    const cacheKey = 'dashboard-metrics';
    const cached = this.getCachedData<DashboardMetrics>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch('/api/dashboard/metrics');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      // Retornar dados padrão em caso de erro
      return {
        totalSales: 0,
        totalRevenue: 0,
        dailyGoal: 0,
        salesGrowth: 0,
        revenueGrowth: 0,
        goalProgress: 0
      };
    }
  }

  /**
   * Busca dados para gráficos
   */
  async getChartData(type: 'sales' | 'revenue' | 'weekly' | 'payment-methods', period: string = '7d'): Promise<any> {
    const cacheKey = `chart-${type}-${period}`;
    const cached = this.getCachedData<any>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`/api/dashboard/charts?type=${type}&period=${period}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Extrair os dados do gráfico da estrutura retornada
      // A API retorna {charts: {sales: {...}}} então acessamos data.charts[type]
      const chartData = data.charts?.[type] || data;
      this.setCachedData(cacheKey, chartData);
      return chartData;
    } catch (error) {
      console.error(`Error fetching chart data for ${type}:`, error);
      return null;
    }
  }

  /**
   * Busca atividades recentes
   */
  async getRecentActivities(limit: number = 10, type?: string): Promise<ActivityItem[]> {
    const cacheKey = `activities-${limit}-${type || 'all'}`;
    const cached = this.getCachedData<ActivityItem[]>(cacheKey);
    if (cached) return cached;

    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (type) params.append('type', type);
      
      const response = await fetch(`/api/dashboard/recent-activities?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.setCachedData(cacheKey, data.activities || []);
      return data.activities || [];
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }

  /**
   * Busca estatísticas do sistema
   */
  async getSystemStats(): Promise<DashboardStats> {
    const cacheKey = 'system-stats';
    const cached = this.getCachedData<DashboardStats>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching system stats:', error);
      // Retornar dados padrão em caso de erro
      return {
        users: { total: 0, active: 0, inactive: 0 },
        products: { total: 0, active: 0, inactive: 0 },
        sales: { total: 0, today: 0, week: 0, thisMonth: 0 },
        revenue: { total: 0, today: 0, week: 0, thisMonth: 0 },
        system: {
          apiResponseTime: 0,
          errorRate: 0,
          syncStatus: 'error',
          lastSync: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Busca todos os dados do dashboard de uma vez usando o endpoint otimizado
   */
  async getDashboardData(): Promise<DashboardData> {
    console.log('🔄 DashboardService: getDashboardData called');
    const cacheKey = 'complete-dashboard-data';
    const cached = this.getCachedData<DashboardData>(cacheKey);
    if (cached) {
      console.log('📦 DashboardService: Returning cached data:', cached);
      return cached;
    }

    try {
      console.log('🌐 DashboardService: Fetching from /api/dashboard');
      const response = await fetch('/api/dashboard');
      console.log('📡 DashboardService: Response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('✅ DashboardService: Data received:', data);
      
      // Cachear os dados por 30 segundos
      this.setCachedData(cacheKey, data, 30000);
      return data;
    } catch (error) {
      console.error('Error fetching complete dashboard data:', error);
      
      // Fallback: tentar buscar dados individuais se o endpoint principal falhar
      console.log('Falling back to individual API calls...');
      try {
        const [metrics, stats, activities, salesChart, revenueChart, weeklyChart, paymentChart] = await Promise.allSettled([
          this.getMetrics(),
          this.getSystemStats(),
          this.getRecentActivities(10),
          this.getChartData('sales', '7d'),
          this.getChartData('revenue', '7d'),
          this.getChartData('weekly', '4w'),
          this.getChartData('payment-methods', '30d')
        ]);

        const fallbackData = {
          metrics: metrics.status === 'fulfilled' ? metrics.value : {
            totalSales: 0,
            totalRevenue: 0,
            dailyGoal: 0,
            salesGrowth: 0,
            revenueGrowth: 0,
            goalProgress: 0
          },
          stats: stats.status === 'fulfilled' ? stats.value : {
            users: { total: 0, active: 0, inactive: 0 },
            products: { total: 0, active: 0, inactive: 0 },
            sales: { total: 0, today: 0, week: 0, thisMonth: 0 },
            revenue: { total: 0, today: 0, week: 0, thisMonth: 0 },
            system: {
              apiResponseTime: 0,
              errorRate: 0,
              syncStatus: 'error',
              lastSync: new Date().toISOString()
            }
          },
          activities: activities.status === 'fulfilled' ? activities.value : [],
          charts: {
            sales: salesChart.status === 'fulfilled' ? salesChart.value : null,
            revenue: revenueChart.status === 'fulfilled' ? revenueChart.value : null,
            weekly: weeklyChart.status === 'fulfilled' ? weeklyChart.value : null,
            paymentMethods: paymentChart.status === 'fulfilled' ? paymentChart.value : null
          }
        };
        
        // Cachear dados do fallback por menos tempo (10 segundos)
        this.setCachedData(cacheKey, fallbackData, 10000);
        return fallbackData;
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        throw error;
      }
    }
  }

  /**
   * Limpa o cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Força atualização dos dados (limpa cache e busca novos dados)
   */
  async refreshData(): Promise<DashboardData> {
    this.clearCache();
    return this.getDashboardData();
  }

  /**
   * Verifica a saúde da API
   */
  async checkApiHealth(): Promise<{ status: 'healthy' | 'degraded' | 'down'; responseTime: number; errors: string[] }> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    try {
      const response = await fetch('/api/health');
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        errors.push(`HTTP ${response.status}: ${response.statusText}`);
        return { status: 'down', responseTime, errors };
      }
      
      const data = await response.json();
      
      if (data.status === 'error') {
        errors.push(...(data.errors || ['Unknown API error']));
        return { status: 'degraded', responseTime, errors };
      }
      
      return { status: 'healthy', responseTime, errors };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      errors.push(error instanceof Error ? error.message : 'Network error');
      return { status: 'down', responseTime, errors };
    }
  }
}

// Instância singleton do serviço
export const dashboardService = new DashboardService();

// Função utilitária para validar dados da API
export function validateApiResponse<T>(data: any, validator: (data: any) => data is T): T | null {
  try {
    return validator(data) ? data : null;
  } catch {
    return null;
  }
}

// Validadores de tipo
export const validators = {
  isDashboardMetrics: (data: any): data is DashboardMetrics => {
    return typeof data === 'object' &&
           typeof data.totalSales === 'number' &&
           typeof data.totalRevenue === 'number' &&
           typeof data.dailyGoal === 'number';
  },
  
  isChartDataPoint: (data: any): data is ChartDataPoint => {
    return typeof data === 'object' &&
           typeof data.date === 'string' &&
           typeof data.value === 'number';
  },
  
  isActivityItem: (data: any): data is ActivityItem => {
    return typeof data === 'object' &&
           typeof data.id === 'string' &&
           typeof data.type === 'string' &&
           typeof data.title === 'string' &&
           typeof data.timestamp === 'string';
  }
};

// Exportar tipos para uso em outros arquivos
export type { DashboardData, DashboardMetrics, ChartDataPoint, ActivityItem };