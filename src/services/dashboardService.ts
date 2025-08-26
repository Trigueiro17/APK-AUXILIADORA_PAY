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

class DashboardService {
  private updateInterval: NodeJS.Timeout | null = null;
  private listeners: ((data: DashboardData) => void)[] = [];
  private currentData: DashboardData | null = null;
  private appContext: AppContextType | null = null;

  // Definir contexto da aplicação
  setAppContext(context: AppContextType) {
    this.appContext = context;
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

  // Iniciar atualizações automáticas
  startRealTimeUpdates(intervalMs: number = 30000) { // 30 segundos por padrão
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

  // Carregar dados do dashboard
  async loadDashboardData(): Promise<DashboardData> {
    try {
      const [statsData, weeklyData] = await Promise.allSettled([
        this.getDashboardStats(),
        this.getWeeklyData()
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

  // Obter estatísticas do dashboard
  private async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Buscar dados em paralelo
      const [cashRegister, products, users, todaySales] = await Promise.allSettled([
        this.getCurrentCashRegister(),
        this.getProductsCount(),
        this.getActiveUsersCount(),
        this.getTodaySales()
      ]);

      const cashData = cashRegister.status === 'fulfilled' ? cashRegister.value : null;
      const productsCount = products.status === 'fulfilled' ? products.value : 0;
      const usersCount = users.status === 'fulfilled' ? users.value : 0;
      const salesData = todaySales.status === 'fulfilled' ? todaySales.value : { count: 0, revenue: 0 };

      return {
        totalSalesToday: salesData.count,
        totalRevenueToday: salesData.revenue,
        cashBalance: cashData?.currentBalance || 0,
        cashStatus: cashData?.status || 'closed',
        productsCount,
        activeUsersCount: usersCount
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return this.getDefaultStats();
    }
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

  // Obter contagem de produtos
  private async getProductsCount(): Promise<number> {
    try {
      const products = await apiService.getProducts(true);
      return products?.length || 0;
    } catch (error) {
      return 0;
    }
  }

  // Obter contagem de usuários ativos
  private async getActiveUsersCount(): Promise<number> {
    try {
      const users = await apiService.getUsers();
      if (Array.isArray(users)) {
        return users.filter(user => user.active).length;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  // Obter vendas de hoje
  private async getTodaySales(): Promise<{ count: number; revenue: number }> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const sales = await apiService.getSales({
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString()
      });

      if (Array.isArray(sales)) {
        const count = sales.length;
        const revenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
        return { count, revenue };
      }

      return { count: 0, revenue: 0 };
    } catch (error) {
      return { count: 0, revenue: 0 };
    }
  }

  // Obter dados semanais
  private async getWeeklyData(): Promise<{ day: string; sales: number }[]> {
    try {
      const today = new Date();
      const weekData = [];
      
      // Últimos 7 dias
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

        try {
          const sales = await apiService.getSales({
            startDate: startOfDay.toISOString(),
            endDate: endOfDay.toISOString()
          });

          const salesCount = Array.isArray(sales) ? sales.length : 0;
          const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
          
          weekData.push({
            day: dayName.charAt(0).toUpperCase() + dayName.slice(1, 3),
            sales: salesCount
          });
        } catch (error) {
          // Em caso de erro, adicionar 0 vendas para o dia
          const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
          weekData.push({
            day: dayName.charAt(0).toUpperCase() + dayName.slice(1, 3),
            sales: 0
          });
        }
      }

      return weekData;
    } catch (error) {
      console.error('Erro ao obter dados semanais:', error);
      return this.getDefaultWeeklyData();
    }
  }

  // Forçar atualização dos dados
  async refreshData(): Promise<DashboardData> {
    return this.loadDashboardData();
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
  }
}

// Instância singleton
export const dashboardService = new DashboardService();