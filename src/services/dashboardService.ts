import { apiService } from './apiService';
import { Sale, CashRegister, Product, User } from '../types';
import { AppContextType } from '../contexts/AppContext';

export interface DashboardData {
  // Status do sistema
  cashRegisterStatus: 'open' | 'closed';
  totalProducts: number;
  activeUsers: number;
  
  // Vendas e faturamento
  todaySales: number;
  todayRevenue: number;
  currentCashBalance: number;
  
  // Dados adicionais
  weeklyData: { day: string; sales: number }[];
  lastUpdated: string;
}

export interface DashboardStats {
  totalSalesToday: number;
  totalRevenueToday: number;
  cashBalance: number;
  cashStatus: 'open' | 'closed';
  productsCount: number;
  activeUsersCount: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class DashboardService {
  private updateInterval: NodeJS.Timeout | null = null;
  private listeners: ((data: DashboardData) => void)[] = [];
  private currentData: DashboardData | null = null;
  private appContext: AppContextType | null = null;
  
  // Cache para otimização de performance
  private cache = new Map<string, CacheEntry<any>>();
  private readonly CACHE_DURATION = {
    SALES_TODAY: 30000, // 30 segundos
    WEEKLY_DATA: 300000, // 5 minutos
    PRODUCTS: 600000, // 10 minutos
    USERS: 300000, // 5 minutos
  };
  
  // Controle de delays para operações de caixa (otimizado para maior responsividade)
  private cashOperationDelays = {
    opening: 1000, // 1 segundo para abertura (reduzido de 2s)
    closing: 1500, // 1.5 segundos para fechamento (reduzido de 3s)
    syncDashboard: 500, // 0.5 segundo para sincronização (reduzido de 1s)
  };
  
  // Fila de atualizações para evitar múltiplas requisições simultâneas
  private updateQueue: Promise<any> | null = null;

  // Definir contexto da aplicação
  setAppContext(context: AppContextType) {
    this.appContext = context;
  }

  // Métodos de cache para otimização
  private setCache<T>(key: string, data: T, duration: number): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiry: now + duration
    });
  }

  private getCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  private clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Adicionar listener para atualizações em tempo real
  addListener(callback: (data: DashboardData) => void) {
    this.listeners.push(callback);
    
    // Se já temos dados, enviar imediatamente
    if (this.currentData) {
      callback(this.currentData);
    }
  }

  // Remover listener
  removeListener(callback: (data: DashboardData) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notificar todos os listeners
  private notifyListeners(data: DashboardData) {
    this.currentData = data;
    this.listeners.forEach(listener => listener(data));
  }

  // Gerenciar delays para operações de caixa
  async handleCashOperation<T>(operation: 'opening' | 'closing', callback: () => Promise<T>): Promise<T> {
    const delay = this.cashOperationDelays[operation];
    
    try {
      const result = await callback();
      
      // Aguardar delay específico da operação
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Limpar cache relacionado a vendas e caixa
      this.clearCache('sales');
      this.clearCache('cash');
      
      // Sincronizar dashboard após delay mínimo
      setTimeout(() => {
        this.loadDashboardData(true); // Forçar refresh para garantir dados atualizados
      }, this.cashOperationDelays.syncDashboard);
      
      // Notificar listeners imediatamente com dados atuais (se disponíveis)
      if (this.currentData) {
        this.notifyListeners({
          ...this.currentData,
          lastUpdated: new Date().toISOString()
        });
      }
      
      return result;
      
    } catch (error) {
      console.error(`Erro na operação de caixa (${operation}):`, error);
      throw error;
    }
  }

  // Iniciar atualizações automáticas
  startRealTimeUpdates(intervalMs: number = 15000) { // 15 segundos por padrão (mais responsivo)
    this.stopRealTimeUpdates();
    
    // Carregar dados imediatamente
    this.loadDashboardData();
    
    // Configurar intervalo de atualização
    this.updateInterval = setInterval(() => {
      this.loadDashboardData();
    }, intervalMs);
  }

  // Parar atualizações automáticas
  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Carregar dados do dashboard com otimizações
  async loadDashboardData(forceRefresh: boolean = false): Promise<DashboardData> {
    // Evitar múltiplas requisições simultâneas
    if (this.updateQueue && !forceRefresh) {
      return this.updateQueue;
    }

    this.updateQueue = this._loadDashboardDataInternal(forceRefresh);
    
    try {
      const result = await this.updateQueue;
      return result;
    } finally {
      this.updateQueue = null;
    }
  }

  private async _loadDashboardDataInternal(forceRefresh: boolean): Promise<DashboardData> {
    try {
      // Verificar cache primeiro (exceto se forceRefresh)
      if (!forceRefresh) {
        const cachedData = this.getCache<DashboardData>('dashboard_data');
        if (cachedData) {
          this.notifyListeners(cachedData);
          return cachedData;
        }
      }

      // Buscar dados em paralelo com cache individual
      const [statsData, weeklyData] = await Promise.allSettled([
        this.getDashboardStatsOptimized(forceRefresh),
        this.getWeeklyDataOptimized(forceRefresh)
      ]);

      const stats = statsData.status === 'fulfilled' ? statsData.value : this.getDefaultStats();
      const weekly = weeklyData.status === 'fulfilled' ? weeklyData.value : this.getDefaultWeeklyData();

      const dashboardData: DashboardData = {
        cashRegisterStatus: stats.cashStatus,
        totalProducts: stats.productsCount,
        activeUsers: stats.activeUsersCount,
        todaySales: stats.totalSalesToday,
        todayRevenue: stats.totalRevenueToday,
        currentCashBalance: stats.cashBalance,
        weeklyData: weekly,
        lastUpdated: new Date().toISOString()
      };

      // Cachear resultado por 30 segundos
      this.setCache('dashboard_data', dashboardData, 30000);
      
      this.notifyListeners(dashboardData);
      return dashboardData;
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      
      // Retornar dados padrão em caso de erro
      const defaultData = this.getDefaultDashboardData();
      this.notifyListeners(defaultData);
      return defaultData;
    }
  }

  // Obter estatísticas do dashboard com cache
  private async getDashboardStatsOptimized(forceRefresh: boolean = false): Promise<DashboardStats> {
    const cacheKey = 'dashboard_stats';
    
    if (!forceRefresh) {
      const cached = this.getCache<DashboardStats>(cacheKey);
      if (cached) return cached;
    }

    try {
      // Buscar dados em paralelo com cache individual
      const [cashRegister, products, users, todaySales] = await Promise.allSettled([
        this.getCurrentCashRegister(),
        this.getProductsCountOptimized(forceRefresh),
        this.getActiveUsersCountOptimized(forceRefresh),
        this.getTodaySalesOptimized(forceRefresh)
      ]);

      const cashData = cashRegister.status === 'fulfilled' ? cashRegister.value : null;
      const productsCount = products.status === 'fulfilled' ? products.value : 0;
      const usersCount = users.status === 'fulfilled' ? users.value : 0;
      const salesData = todaySales.status === 'fulfilled' ? todaySales.value : { count: 0, revenue: 0 };

      const stats = {
        totalSalesToday: salesData.count,
        totalRevenueToday: salesData.revenue,
        cashBalance: cashData?.currentBalance || 0,
        cashStatus: cashData?.status || 'closed',
        productsCount,
        activeUsersCount: usersCount
      };

      // Cachear por 30 segundos
      this.setCache(cacheKey, stats, this.CACHE_DURATION.SALES_TODAY);
      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return this.getDefaultStats();
    }
  }

  // Método original mantido para compatibilidade
  private async getDashboardStats(): Promise<DashboardStats> {
    return this.getDashboardStatsOptimized(false);
  }

  // Obter caixa atual
  private async getCurrentCashRegister(): Promise<{ status: 'open' | 'closed'; currentBalance: number } | null> {
    try {
      // Usar o contexto da aplicação se disponível
      if (this.appContext && this.appContext.state.currentCashSession) {
        const currentCashSession = this.appContext.state.currentCashSession;
        return {
          status: currentCashSession.status === 'ACTIVE' ? 'open' : 'closed',
          currentBalance: currentCashSession.openingAmount || 0
        };
      }
      
      // Se não há caixa no contexto, retornar fechado
      return { status: 'closed', currentBalance: 0 };
    } catch (error) {
      // Se não há caixa aberto, retornar fechado
      return { status: 'closed', currentBalance: 0 };
    }
  }

  // Obter contagem de produtos com cache
  private async getProductsCountOptimized(forceRefresh: boolean = false): Promise<number> {
    const cacheKey = 'products_count';
    
    if (!forceRefresh) {
      const cached = this.getCache<number>(cacheKey);
      if (cached !== null) return cached;
    }

    try {
      const products = await apiService.getProducts(true);
      const count = products?.length || 0;
      
      // Cachear por 10 minutos
      this.setCache(cacheKey, count, this.CACHE_DURATION.PRODUCTS);
      return count;
    } catch (error) {
      return 0;
    }
  }

  // Obter contagem de usuários ativos com cache
  private async getActiveUsersCountOptimized(forceRefresh: boolean = false): Promise<number> {
    const cacheKey = 'active_users_count';
    
    if (!forceRefresh) {
      const cached = this.getCache<number>(cacheKey);
      if (cached !== null) return cached;
    }

    try {
      const users = await apiService.getUsers();
      const count = Array.isArray(users) ? users.filter(user => user.active).length : 0;
      
      // Cachear por 5 minutos
      this.setCache(cacheKey, count, this.CACHE_DURATION.USERS);
      return count;
    } catch (error) {
      return 0;
    }
  }

  // Obter vendas de hoje com cache e busca otimizada
  private async getTodaySalesOptimized(forceRefresh: boolean = false): Promise<{ count: number; revenue: number }> {
    const today = new Date().toDateString();
    const cacheKey = `sales_today_${today}`;
    
    if (!forceRefresh) {
      const cached = this.getCache<{ count: number; revenue: number }>(cacheKey);
      if (cached) return cached;
    }

    try {
      const todayDate = new Date();
      const startOfDay = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
      const endOfDay = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() + 1);

      const sales = await apiService.getSales({
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString()
      });

      let result = { count: 0, revenue: 0 };
      
      if (Array.isArray(sales)) {
        result = {
          count: sales.length,
          revenue: sales.reduce((sum, sale) => sum + (sale.total || 0), 0)
        };
      }

      // Cachear por 30 segundos
      this.setCache(cacheKey, result, this.CACHE_DURATION.SALES_TODAY);
      return result;
    } catch (error) {
      return { count: 0, revenue: 0 };
    }
  }

  // Métodos originais mantidos para compatibilidade
  private async getProductsCount(): Promise<number> {
    return this.getProductsCountOptimized(false);
  }

  private async getActiveUsersCount(): Promise<number> {
    return this.getActiveUsersCountOptimized(false);
  }

  private async getTodaySales(): Promise<{ count: number; revenue: number }> {
    return this.getTodaySalesOptimized(false);
  }

  // Obter dados semanais com cache e busca otimizada
  private async getWeeklyDataOptimized(forceRefresh: boolean = false): Promise<{ day: string; sales: number }[]> {
    const today = new Date().toDateString();
    const cacheKey = `weekly_data_${today}`;
    
    if (!forceRefresh) {
      const cached = this.getCache<{ day: string; sales: number }[]>(cacheKey);
      if (cached) return cached;
    }

    try {
      const todayDate = new Date();
      
      // Calcular período de 7 dias de uma vez
      const startDate = new Date(todayDate);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(todayDate);
      endDate.setHours(23, 59, 59, 999);

      // Buscar todas as vendas da semana de uma vez
      const allWeekSales = await apiService.getSales({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const weekData = [];
      
      // Processar dados por dia
      for (let i = 6; i >= 0; i--) {
        const date = new Date(todayDate);
        date.setDate(date.getDate() - i);
        
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        
        // Filtrar vendas do dia específico
        const daySales = Array.isArray(allWeekSales) 
          ? allWeekSales.filter(sale => {
              const saleDate = new Date(sale.createdAt);
              return saleDate >= dayStart && saleDate < dayEnd;
            })
          : [];

        const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
        
        weekData.push({
          day: dayName.charAt(0).toUpperCase() + dayName.slice(1, 3),
          sales: daySales.length
        });
      }

      // Cachear por 5 minutos
      this.setCache(cacheKey, weekData, this.CACHE_DURATION.WEEKLY_DATA);
      return weekData;
    } catch (error) {
      console.error('Erro ao obter dados semanais:', error);
      return this.getDefaultWeeklyData();
    }
  }

  // Método original mantido para compatibilidade
  private async getWeeklyData(): Promise<{ day: string; sales: number }[]> {
    return this.getWeeklyDataOptimized(false);
  }

  // Forçar atualização dos dados
  async refreshData(): Promise<DashboardData> {
    return this.loadDashboardData(true);
  }

  // Atualização instantânea para operações críticas (vendas, etc.)
  async instantUpdate(): Promise<void> {
    try {
      // Limpar cache de vendas para garantir dados frescos
      this.clearCache('sales');
      this.clearCache('cash');
      
      // Carregar dados imediatamente
      const data = await this.loadDashboardData(true);
      
      // Notificar todos os listeners imediatamente
      this.notifyListeners(data);
    } catch (error) {
      console.error('Erro na atualização instantânea:', error);
    }
  }

  // Método para ser chamado após operações de venda
  async onSaleOperation(): Promise<void> {
    // Atualização instantânea após venda
    await this.instantUpdate();
  }

  // Buscar todos os dados de vendas de forma eficiente
  async getAllSalesData(filters?: {
    startDate?: string;
    endDate?: string;
    cashRegisterId?: string;
    userId?: string;
    status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  }): Promise<any[]> {
    const cacheKey = `all_sales_${JSON.stringify(filters || {})}`;
    
    // Verificar cache primeiro
    const cached = this.getCache<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const sales = await apiService.getSales(filters);
      const result = Array.isArray(sales) ? sales : [];
      
      // Cachear por 1 minuto para dados completos
      this.setCache(cacheKey, result, 60000);
      return result;
    } catch (error) {
      console.error('Erro ao buscar todos os dados de vendas:', error);
      return [];
    }
  }

  // Buscar dados de vendas com paginação para grandes volumes
  async getSalesDataPaginated(page: number = 1, limit: number = 100, filters?: any): Promise<{
    data: any[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      // Para implementação futura com API paginada
      // Por enquanto, usar busca completa e paginar localmente
      const allSales = await this.getAllSalesData(filters);
      
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = allSales.slice(startIndex, endIndex);
      
      return {
        data: paginatedData,
        total: allSales.length,
        hasMore: endIndex < allSales.length
      };
    } catch (error) {
      console.error('Erro ao buscar dados paginados:', error);
      return {
        data: [],
        total: 0,
        hasMore: false
      };
    }
  }

  // Invalidar cache específico
  invalidateCache(pattern?: string): void {
    this.clearCache(pattern);
  }

  // Obter estatísticas de performance do cache
  getCacheStats(): {
    totalEntries: number;
    cacheHitRate: number;
    oldestEntry: string | null;
  } {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();
    
    let oldestEntry: string | null = null;
    let oldestTime = now;
    
    entries.forEach(([key, entry]) => {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestEntry = key;
      }
    });
    
    return {
      totalEntries: entries.length,
      cacheHitRate: 0, // Implementar contador de hits/misses se necessário
      oldestEntry
    };
  }

  // Dados padrão em caso de erro
  private getDefaultStats(): DashboardStats {
    return {
      totalSalesToday: 0,
      totalRevenueToday: 0,
      cashBalance: 0,
      cashStatus: 'closed',
      productsCount: 0,
      activeUsersCount: 0
    };
  }

  private getDefaultWeeklyData(): { day: string; sales: number }[] {
    return [
      { day: 'Seg', sales: 0 },
      { day: 'Ter', sales: 0 },
      { day: 'Qua', sales: 0 },
      { day: 'Qui', sales: 0 },
      { day: 'Sex', sales: 0 },
      { day: 'Sáb', sales: 0 },
      { day: 'Dom', sales: 0 }
    ];
  }

  private getDefaultDashboardData(): DashboardData {
    return {
      cashRegisterStatus: 'closed',
      totalProducts: 0,
      activeUsers: 0,
      todaySales: 0,
      todayRevenue: 0,
      currentCashBalance: 0,
      weeklyData: this.getDefaultWeeklyData(),
      lastUpdated: new Date().toISOString()
    };
  }

  // Limpar recursos
  cleanup() {
    this.stopRealTimeUpdates();
    this.listeners = [];
    this.currentData = null;
    this.cache.clear();
    this.updateQueue = null;
  }
}

// Instância singleton
export const dashboardService = new DashboardService();