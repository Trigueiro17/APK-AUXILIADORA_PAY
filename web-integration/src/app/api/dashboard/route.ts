import { NextResponse } from 'next/server';
import { auxiliadoraApiClient } from '@/lib/api-client';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Buscar todos os dados necessários em paralelo
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
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filtrar vendas por período
    const completedSales = salesData.filter(sale => sale.status === 'COMPLETED');
    const todaySales = completedSales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= today;
    });

    const weekSales = completedSales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= thisWeek;
    });

    const monthSales = completedSales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= thisMonth;
    });

    // Calcular receitas
    const todayRevenue = todaySales.reduce((sum, sale) => {
      const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total;
      return sum + (total || 0);
    }, 0);

    const weekRevenue = weekSales.reduce((sum, sale) => {
      const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total;
      return sum + (total || 0);
    }, 0);

    const monthRevenue = monthSales.reduce((sum, sale) => {
      const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total;
      return sum + (total || 0);
    }, 0);

    const totalRevenue = completedSales.reduce((sum, sale) => {
      const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total;
      return sum + (total || 0);
    }, 0);

    // Preparar dados para gráficos de vendas (últimos 7 dias)
    const salesChartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const daySales = completedSales.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= dayStart && saleDate < dayEnd;
      });
      
      salesChartData.push({
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        value: daySales.length
      });
    }

    // Preparar dados para gráficos de receita (últimos 7 dias)
    const revenueChartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const daySales = completedSales.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= dayStart && saleDate < dayEnd;
      });
      
      const dayRevenue = daySales.reduce((sum, sale) => {
        const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total;
        return sum + (total || 0);
      }, 0);
      
      revenueChartData.push({
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        value: dayRevenue
      });
    }

    // Preparar dados semanais (últimas 4 semanas)
    const weeklyChartData = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      
      const weekSalesCount = completedSales.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= weekStart && saleDate < weekEnd;
      }).length;
      
      const weekRevenueAmount = completedSales.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= weekStart && saleDate < weekEnd;
      }).reduce((sum, sale) => {
        const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total;
        return sum + (total || 0);
      }, 0);
      
      weeklyChartData.push({
        week: `Sem ${4 - i}`,
        sales: weekSalesCount,
        revenue: weekRevenueAmount
      });
    }

    // Atividades recentes
    const activities = [];
    
    // Adicionar vendas recentes
    const recentSales = completedSales
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    recentSales.forEach(sale => {
      const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total;
      activities.push({
        id: `sale-${sale.id}`,
        type: 'sale',
        title: 'Nova Venda',
        description: `Venda realizada - R$ ${total.toFixed(2).replace('.', ',')}`,
        timestamp: sale.createdAt,
        status: 'success',
        user: sale.user?.name || 'Usuário não identificado',
        details: `${sale.items.length} item(s) - ${sale.paymentMethod}`,
        amount: total
      });
    });

    // Adicionar usuários recentes
    const recentUsers = usersData
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);

    recentUsers.forEach(user => {
      activities.push({
        id: `user-${user.id}`,
        type: 'user',
        title: 'Novo Usuário',
        description: `Usuário ${user.name} foi criado`,
        timestamp: user.createdAt,
        status: 'info',
        user: user.name,
        details: `Email: ${user.email} - Função: ${user.role}`
      });
    });

    // Ordenar atividades por data
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Calcular usuários ativos
    const activeUsers = usersData.filter(user => user.active);
    const activeProducts = productsData.filter(product => product.active);
    const openCashRegisters = cashRegistersData.filter(register => register.status === 'OPEN');

    // Montar resposta completa
    const dashboardData = {
      metrics: {
        totalSales: completedSales.length,
        totalRevenue: totalRevenue,
        dailyGoal: 1000, // Meta diária fixa por enquanto
        salesGrowth: 0, // TODO: Calcular crescimento
        revenueGrowth: 0, // TODO: Calcular crescimento
        goalProgress: (todayRevenue / 1000) * 100
      },
      stats: {
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
        sales: {
          total: completedSales.length,
          today: todaySales.length,
          week: weekSales.length,
          thisMonth: monthSales.length
        },
        revenue: {
          total: totalRevenue,
          today: todayRevenue,
          week: weekRevenue,
          thisMonth: monthRevenue
        },
        system: {
          apiResponseTime,
          errorRate: 0, // TODO: Calcular taxa de erro
          syncStatus: 'healthy',
          lastSync: new Date().toISOString()
        }
      },
      charts: {
        sales: {
          labels: salesChartData.map(item => item.date),
          datasets: [{
            label: 'Vendas',
            data: salesChartData.map(item => item.value),
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }],
          summary: {
            total: salesChartData.reduce((sum, item) => sum + item.value, 0),
            average: salesChartData.reduce((sum, item) => sum + item.value, 0) / salesChartData.length,
            peak: Math.max(...salesChartData.map(item => item.value)),
            trend: 'up' // TODO: Calcular tendência real
          }
        },
        revenue: {
          labels: revenueChartData.map(item => item.date),
          datasets: [{
            label: 'Receita (R$)',
            data: revenueChartData.map(item => item.value),
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }],
          summary: {
            total: revenueChartData.reduce((sum, item) => sum + item.value, 0),
            average: revenueChartData.reduce((sum, item) => sum + item.value, 0) / revenueChartData.length,
            peak: Math.max(...revenueChartData.map(item => item.value)),
            trend: 'up' // TODO: Calcular tendência real
          }
        },
        weekly: {
          labels: weeklyChartData.map(item => item.week),
          datasets: [
            {
              label: 'Vendas',
              data: weeklyChartData.map(item => item.sales),
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              borderColor: 'rgb(139, 92, 246)',
              borderWidth: 2,
              yAxisID: 'y'
            },
            {
              label: 'Receita (R$)',
              data: weeklyChartData.map(item => item.revenue),
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              borderColor: 'rgb(245, 158, 11)',
              borderWidth: 2,
              yAxisID: 'y1'
            }
          ],
          summary: {
            totalSales: weeklyChartData.reduce((sum, item) => sum + item.sales, 0),
            totalRevenue: weeklyChartData.reduce((sum, item) => sum + item.revenue, 0),
            averageSalesPerWeek: weeklyChartData.reduce((sum, item) => sum + item.sales, 0) / weeklyChartData.length,
            averageRevenuePerWeek: weeklyChartData.reduce((sum, item) => sum + item.revenue, 0) / weeklyChartData.length
          }
        },
        paymentMethods: null // TODO: Implementar quando houver dados de métodos de pagamento
      },
      activities: activities.slice(0, 10),
      metadata: {
        lastUpdated: new Date().toISOString(),
        dataPoints: {
          sales: salesData.length,
          users: usersData.length,
          products: productsData.length,
          cashRegisters: cashRegistersData.length
        },
        period: {
          start: thisWeek.toISOString(),
          end: now.toISOString(),
          days: 7
        }
      }
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching complete dashboard data:', error);
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