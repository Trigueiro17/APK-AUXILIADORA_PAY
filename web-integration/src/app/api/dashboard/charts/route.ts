import { NextRequest, NextResponse } from 'next/server';
import { auxiliadoraApiClient } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chartType = searchParams.get('type') || 'all';
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Buscar dados de vendas
    const salesData = await auxiliadoraApiClient.getSales();
    const completedSales = salesData.filter(sale => sale.status === 'COMPLETED');

    // Calcular período baseado no parâmetro
    const now = new Date();
    let periodStart: Date;
    
    if (startDate && endDate) {
      periodStart = new Date(startDate);
    } else {
      switch (period) {
        case '30d':
          periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          periodStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '7d':
        default:
          periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    const periodEnd = endDate ? new Date(endDate) : now;
    
    // Filtrar vendas do período
    const periodSales = completedSales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= periodStart && saleDate <= periodEnd;
    });

    const charts: any = {};

    // Gráfico de vendas por dia
    if (chartType === 'sales' || chartType === 'all') {
      const salesByDay = generateDailyData(periodSales, periodStart, periodEnd, 'sales');
      charts.sales = {
        labels: salesByDay.map(item => item.label),
        datasets: [{
          label: 'Vendas',
          data: salesByDay.map(item => item.value),
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }],
        summary: {
          total: salesByDay.reduce((sum, item) => sum + item.value, 0),
          average: salesByDay.reduce((sum, item) => sum + item.value, 0) / salesByDay.length,
          peak: Math.max(...salesByDay.map(item => item.value)),
          trend: calculateTrend(salesByDay.map(item => item.value))
        }
      };
    }

    // Gráfico de receita por dia
    if (chartType === 'revenue' || chartType === 'all') {
      const revenueByDay = generateDailyData(periodSales, periodStart, periodEnd, 'revenue');
      charts.revenue = {
        labels: revenueByDay.map(item => item.label),
        datasets: [{
          label: 'Receita (R$)',
          data: revenueByDay.map(item => item.value),
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }],
        summary: {
          total: revenueByDay.reduce((sum, item) => sum + item.value, 0),
          average: revenueByDay.reduce((sum, item) => sum + item.value, 0) / revenueByDay.length,
          peak: Math.max(...revenueByDay.map(item => item.value)),
          trend: calculateTrend(revenueByDay.map(item => item.value))
        }
      };
    }

    // Gráfico semanal (comparação de semanas)
    if (chartType === 'weekly' || chartType === 'all') {
      const weeklyData = generateWeeklyComparison(completedSales, now);
      charts.weekly = {
        labels: weeklyData.map(item => item.label),
        datasets: [
          {
            label: 'Vendas',
            data: weeklyData.map(item => item.sales),
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderColor: 'rgb(139, 92, 246)',
            borderWidth: 2,
            yAxisID: 'y'
          },
          {
            label: 'Receita (R$)',
            data: weeklyData.map(item => item.revenue),
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderColor: 'rgb(245, 158, 11)',
            borderWidth: 2,
            yAxisID: 'y1'
          }
        ],
        summary: {
          totalSales: weeklyData.reduce((sum, item) => sum + item.sales, 0),
          totalRevenue: weeklyData.reduce((sum, item) => sum + item.revenue, 0),
          averageSalesPerWeek: weeklyData.reduce((sum, item) => sum + item.sales, 0) / weeklyData.length,
          averageRevenuePerWeek: weeklyData.reduce((sum, item) => sum + item.revenue, 0) / weeklyData.length
        }
      };
    }

    // Análise de métodos de pagamento
    if (chartType === 'payment-methods' || chartType === 'all') {
      const paymentMethods = analyzePaymentMethods(periodSales);
      charts.paymentMethods = {
        labels: paymentMethods.map(item => item.method),
        datasets: [{
          label: 'Quantidade',
          data: paymentMethods.map(item => item.count),
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(139, 92, 246, 0.8)'
          ],
          borderWidth: 0
        }],
        summary: {
          totalTransactions: paymentMethods.reduce((sum, item) => sum + item.count, 0),
          mostUsed: paymentMethods[0]?.method || 'N/A',
          diversity: paymentMethods.length
        }
      };
    }

    return NextResponse.json({
      charts,
      metadata: {
        period: {
          start: periodStart.toISOString(),
          end: periodEnd.toISOString(),
          days: Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))
        },
        dataPoints: periodSales.length,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch chart data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Função auxiliar para gerar dados diários
function generateDailyData(sales: any[], startDate: Date, endDate: Date, type: 'sales' | 'revenue') {
  const data = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayStart = new Date(current.getFullYear(), current.getMonth(), current.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const daySales = sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= dayStart && saleDate < dayEnd;
    });
    
    let value = 0;
    if (type === 'sales') {
      value = daySales.length;
    } else if (type === 'revenue') {
      value = daySales.reduce((sum, sale) => {
        const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total;
        return sum + (total || 0);
      }, 0);
    }
    
    data.push({
      label: current.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      date: current.toISOString().split('T')[0],
      value
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return data;
}

// Função auxiliar para gerar comparação semanal
function generateWeeklyComparison(sales: any[], currentDate: Date) {
  const weeks = [];
  
  for (let i = 3; i >= 0; i--) {
    const weekEnd = new Date(currentDate.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weekSales = sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= weekStart && saleDate < weekEnd;
    });
    
    const revenue = weekSales.reduce((sum, sale) => {
      const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total;
      return sum + (total || 0);
    }, 0);
    
    weeks.push({
      label: `Semana ${4 - i}`,
      period: `${weekStart.toLocaleDateString('pt-BR')} - ${weekEnd.toLocaleDateString('pt-BR')}`,
      sales: weekSales.length,
      revenue
    });
  }
  
  return weeks;
}

// Função auxiliar para analisar métodos de pagamento
function analyzePaymentMethods(sales: any[]) {
  const methods: { [key: string]: number } = {};
  
  sales.forEach(sale => {
    const method = sale.paymentMethod || 'Não informado';
    methods[method] = (methods[method] || 0) + 1;
  });
  
  return Object.entries(methods)
    .map(([method, count]) => ({ method, count }))
    .sort((a, b) => b.count - a.count);
}

// Função auxiliar para calcular tendência
function calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
  if (values.length < 2) return 'stable';
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  
  const difference = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  if (difference > 5) return 'up';
  if (difference < -5) return 'down';
  return 'stable';
}