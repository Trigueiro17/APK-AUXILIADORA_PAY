import { NextResponse } from 'next/server';
import { auxiliadoraApiClient } from '@/lib/api-client';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Buscar dados reais da API externa com medição de tempo
    const [salesResult, usersResult, productsResult, cashRegistersResult] = await Promise.allSettled([
      auxiliadoraApiClient.getSales(),
      auxiliadoraApiClient.getUsers(),
      auxiliadoraApiClient.getProducts(),
      auxiliadoraApiClient.getCashRegisters()
    ]);

    const apiResponseTime = Date.now() - startTime;
    
    const salesData = salesResult.status === 'fulfilled' ? salesResult.value : [];
    const usersData = usersResult.status === 'fulfilled' ? usersResult.value : [];
    const productsData = productsResult.status === 'fulfilled' ? productsResult.value : [];
    const cashRegistersData = cashRegistersResult.status === 'fulfilled' ? cashRegistersResult.value : [];

    // Calcular métricas de tempo
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Filtrar vendas por período
    const todaySales = salesData.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= today && sale.status === 'COMPLETED';
    });

    const weekSales = salesData.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= thisWeek && sale.status === 'COMPLETED';
    });

    const monthSales = salesData.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= thisMonth && sale.status === 'COMPLETED';
    });

    // Calcular taxa de erro baseada nos resultados das chamadas
    const totalCalls = 4;
    const failedCalls = [salesResult, usersResult, productsResult, cashRegistersResult]
      .filter(result => result.status === 'rejected').length;
    const errorRate = failedCalls / totalCalls;

    // Determinar status da sincronização
    const syncStatus = errorRate === 0 ? 'success' : errorRate < 0.5 ? 'warning' : 'error';
    
    // Calcular estatísticas de crescimento
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // Vendas da semana anterior para comparação
    const lastWeekStart = new Date(thisWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekSales = salesData.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= lastWeekStart && saleDate < thisWeek && sale.status === 'COMPLETED';
    });

    const stats = {
      users: {
        total: usersData.length,
        active: usersData.filter(user => user.active).length,
        inactive: usersData.filter(user => !user.active).length,
        growth: {
          week: 0 // TODO: Implementar quando houver dados históricos
        }
      },
      products: {
        total: productsData.length,
        active: productsData.filter(product => product.active).length,
        inactive: productsData.filter(product => !product.active).length,
        lowStock: 0, // API não tem campo de estoque
        categories: [...new Set(productsData.map(p => p.category).filter(Boolean))].length
      },
      sales: {
        total: salesData.filter(sale => sale.status === 'COMPLETED').length,
        today: todaySales.length,
        week: weekSales.length,
        thisMonth: monthSales.length,
        growth: {
          week: calculateGrowth(weekSales.length, lastWeekSales.length)
        },
        averageTicket: weekSales.length > 0 ? 
          weekSales.reduce((sum, sale) => {
            const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total;
            return sum + total;
          }, 0) / weekSales.length : 0
      },
      revenue: {
        total: salesData
          .filter(sale => sale.status === 'COMPLETED')
          .reduce((sum, sale) => {
            const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total;
            return sum + total;
          }, 0),
        today: todaySales.reduce((sum, sale) => {
          const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total;
          return sum + total;
        }, 0),
        week: weekSales.reduce((sum, sale) => {
          const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total;
          return sum + total;
        }, 0),
        thisMonth: monthSales.reduce((sum, sale) => {
          const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total;
          return sum + total;
        }, 0),
        growth: {
          week: calculateGrowth(
            weekSales.reduce((sum, sale) => {
              const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total;
              return sum + total;
            }, 0),
            lastWeekSales.reduce((sum, sale) => {
              const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total;
              return sum + total;
            }, 0)
          )
        }
      },
      cashRegisters: {
        total: cashRegistersData.length,
        open: cashRegistersData.filter(register => register.status === 'OPEN').length,
        closed: cashRegistersData.filter(register => register.status === 'CLOSED').length
      },
      system: {
        apiResponseTime,
        errorRate,
        syncStatus,
        lastSync: new Date().toISOString(),
        dataQuality: {
          salesAvailable: salesResult.status === 'fulfilled',
          usersAvailable: usersResult.status === 'fulfilled',
          productsAvailable: productsResult.status === 'fulfilled',
          cashRegistersAvailable: cashRegistersResult.status === 'fulfilled'
        }
      },
      metadata: {
        lastUpdated: new Date().toISOString(),
        dataPoints: {
          sales: salesData.length,
          users: usersData.length,
          products: productsData.length,
          cashRegisters: cashRegistersData.length
        }
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}