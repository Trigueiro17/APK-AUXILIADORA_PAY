import { NextResponse } from 'next/server';
import { auxiliadoraApiClient } from '@/lib/api-client';

export async function GET() {
  try {
    // Buscar dados em paralelo para melhor performance
    const [salesResult, usersResult, productsResult, cashRegistersResult] = await Promise.allSettled([
      auxiliadoraApiClient.getSales(),
      auxiliadoraApiClient.getUsers(),
      auxiliadoraApiClient.getProducts(),
      auxiliadoraApiClient.getCashRegisters()
    ]);

    // Processar dados de vendas
    const salesData = salesResult.status === 'fulfilled' ? salesResult.value : [];
    const completedSales = salesData.filter(sale => sale.status === 'COMPLETED');
    
    // Calcular métricas de tempo
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Filtrar vendas por período
    const todaySales = completedSales.filter(sale => new Date(sale.createdAt) >= today);
    const weekSales = completedSales.filter(sale => new Date(sale.createdAt) >= thisWeek);
    const monthSales = completedSales.filter(sale => new Date(sale.createdAt) >= thisMonth);
    
    // Calcular receitas
    const calculateRevenue = (sales: any[]) => {
      return sales.reduce((sum, sale) => {
        const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total;
        return sum + (total || 0);
      }, 0);
    };
    
    const todayRevenue = calculateRevenue(todaySales);
    const weekRevenue = calculateRevenue(weekSales);
    const monthRevenue = calculateRevenue(monthSales);
    const totalRevenue = calculateRevenue(completedSales);
    
    // Processar dados de usuários
    const usersData = usersResult.status === 'fulfilled' ? usersResult.value : [];
    const activeUsers = usersData.filter(user => user.active);
    
    // Processar dados de produtos
    const productsData = productsResult.status === 'fulfilled' ? productsResult.value : [];
    const activeProducts = productsData.filter(product => product.active);
    
    // Processar dados de caixas
    const cashRegistersData = cashRegistersResult.status === 'fulfilled' ? cashRegistersResult.value : [];
    const openCashRegisters = cashRegistersData.filter(register => register.status === 'OPEN');
    
    // Calcular dados para gráficos semanais
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const daySales = completedSales.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= dayStart && saleDate < dayEnd;
      });
      
      weeklyData.push({
        day: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        date: date.toISOString().split('T')[0],
        sales: daySales.length,
        revenue: calculateRevenue(daySales)
      });
    }
    
    // Calcular crescimento percentual
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };
    
    // Calcular vendas do período anterior para comparação
    const lastWeekStart = new Date(thisWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekSales = completedSales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= lastWeekStart && saleDate < thisWeek;
    });
    
    const lastMonthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 1, 1);
    const lastMonthEnd = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 0);
    const lastMonthSales = completedSales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= lastMonthStart && saleDate <= lastMonthEnd;
    });
    
    const metrics = {
      // Métricas principais
      sales: {
        today: todaySales.length,
        week: weekSales.length,
        month: monthSales.length,
        total: completedSales.length,
        growth: {
          week: calculateGrowth(weekSales.length, lastWeekSales.length),
          month: calculateGrowth(monthSales.length, lastMonthSales.length)
        }
      },
      
      revenue: {
        today: todayRevenue,
        week: weekRevenue,
        month: monthRevenue,
        total: totalRevenue,
        growth: {
          week: calculateGrowth(weekRevenue, calculateRevenue(lastWeekSales)),
          month: calculateGrowth(monthRevenue, calculateRevenue(lastMonthSales))
        }
      },
      
      users: {
        total: usersData.length,
        active: activeUsers.length,
        inactive: usersData.length - activeUsers.length
      },
      
      products: {
        total: productsData.length,
        active: activeProducts.length,
        inactive: productsData.length - activeProducts.length
      },
      
      cashRegisters: {
        total: cashRegistersData.length,
        open: openCashRegisters.length,
        closed: cashRegistersData.length - openCashRegisters.length
      },
      
      // Dados para gráficos
      charts: {
        weekly: weeklyData,
        topProducts: [], // TODO: Implementar quando houver dados de itens de venda
        paymentMethods: [] // TODO: Implementar análise de métodos de pagamento
      },
      
      // Metadados
      lastUpdated: new Date().toISOString(),
      dataQuality: {
        salesDataAvailable: salesResult.status === 'fulfilled',
        usersDataAvailable: usersResult.status === 'fulfilled',
        productsDataAvailable: productsResult.status === 'fulfilled',
        cashRegistersDataAvailable: cashRegistersResult.status === 'fulfilled'
      }
    };
    
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}