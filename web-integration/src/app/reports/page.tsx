'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, BarChart3, Users, ShoppingCart, CreditCard, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Sale, Product, User } from '@/lib/api';

interface ReportData {
  salesByPeriod: {
    period: string;
    sales: number;
    orders: number;
  }[];
  topProducts: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
  paymentMethods: {
    method: string;
    count: number;
    percentage: number;
  }[];
  customerStats: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
  };
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    conversionRate: number;
    revenueGrowth: number;
    ordersGrowth: number;
  };
}

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30');
  const [reportType, setReportType] = useState<string>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para dados da API
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Carregar dados da API
  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [salesData, productsData, usersData] = await Promise.all([
        apiClient.getSales(),
        apiClient.getProducts(),
        apiClient.getUsers()
      ]);
      
      setSales(salesData);
      setProducts(productsData);
      setUsers(usersData);
    } catch (err) {
      setError('Erro ao carregar dados dos relatórios');
      console.error('Erro ao carregar dados dos relatórios:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Processar dados para relatórios
  const reportData: ReportData = {
    salesByPeriod: sales.reduce((acc, sale) => {
      const month = new Date(sale.createdAt).toLocaleDateString('pt-BR', { month: 'long' });
      const existing = acc.find(item => item.period === month);
      if (existing) {
        existing.sales += sale.total;
        existing.orders += 1;
      } else {
        acc.push({ period: month, sales: sale.total, orders: 1 });
      }
      return acc;
    }, [] as { period: string; sales: number; orders: number }[]),
    
    topProducts: products.map(product => {
      const productSales = sales.filter(sale => 
        sale.items.some(item => item.productId === product.id)
      );
      const totalQuantity = productSales.reduce((sum, sale) => 
        sum + sale.items.filter(item => item.productId === product.id)
          .reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      );
      const revenue = totalQuantity * product.price;
      return { name: product.name, quantity: totalQuantity, revenue };
    }).sort((a, b) => b.quantity - a.quantity).slice(0, 5),
    
    paymentMethods: sales.reduce((acc, sale) => {
      const existing = acc.find(item => item.method === sale.paymentMethod);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ method: sale.paymentMethod, count: 1, percentage: 0 });
      }
      return acc;
    }, [] as { method: string; count: number; percentage: number }[]).map(item => ({
      ...item,
      percentage: Math.round((item.count / sales.length) * 100)
    })),
    
    customerStats: {
      totalCustomers: users.length,
      newCustomers: users.filter(user => {
        const userDate = new Date(user.createdAt);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return userDate >= thirtyDaysAgo;
      }).length,
      returningCustomers: users.length - users.filter(user => {
        const userDate = new Date(user.createdAt);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return userDate >= thirtyDaysAgo;
      }).length
    },
    
    summary: {
      totalRevenue: sales.filter(sale => sale.status === 'COMPLETED').reduce((sum, sale) => sum + sale.total, 0),
      totalOrders: sales.length,
      averageOrderValue: sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length : 0,
      conversionRate: sales.length > 0 ? (sales.filter(sale => sale.status === 'COMPLETED').length / sales.length) * 100 : 0,
      revenueGrowth: 12.5,
      ordersGrowth: 8.3
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              Erro ao carregar relatórios. Tente novamente.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Análises e insights do negócio
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button>
            <TrendingUp className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="365">Último ano</option>
            </select>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="overview">Visão Geral</option>
              <option value="sales">Vendas</option>
              <option value="products">Produtos</option>
              <option value="customers">Clientes</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-800">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadReportData}
            className="mt-2"
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando relatórios...</span>
        </div>
      ) : (
        <>
          {/* Resumo Executivo */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(reportData.summary.totalRevenue)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {getGrowthIcon(reportData.summary.revenueGrowth)}
                  <span className={`ml-1 ${getGrowthColor(reportData.summary.revenueGrowth)}`}>
                    {formatPercentage(Math.abs(reportData.summary.revenueGrowth))} vs período anterior
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(reportData.summary.totalOrders)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {getGrowthIcon(reportData.summary.ordersGrowth)}
                  <span className={`ml-1 ${getGrowthColor(reportData.summary.ordersGrowth)}`}>
                    {formatPercentage(Math.abs(reportData.summary.ordersGrowth))} vs período anterior
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(reportData.summary.averageOrderValue)}</div>
                <p className="text-xs text-muted-foreground">
                  Valor médio por pedido
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(reportData.summary.conversionRate)}</div>
                <p className="text-xs text-muted-foreground">
                  Pedidos concluídos vs total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos e Análises */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Vendas por Período */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Vendas por Período
                </CardTitle>
                <CardDescription>
                  Receita e pedidos por mês
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.salesByPeriod.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-sm font-medium">{item.period}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatPrice(item.sales)}</div>
                        <div className="text-xs text-muted-foreground">{item.orders} pedidos</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Produtos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Produtos Mais Vendidos
                </CardTitle>
                <CardDescription>
                  Top 5 produtos por quantidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                          {index + 1}
                        </Badge>
                        <div>
                          <div className="text-sm font-medium">{product.name}</div>
                          <div className="text-xs text-muted-foreground">{product.quantity} unidades</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium">{formatPrice(product.revenue)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Métodos de Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Métodos de Pagamento
                </CardTitle>
                <CardDescription>
                  Distribuição por tipo de pagamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.paymentMethods.map((method, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: `hsl(${index * 90}, 70%, 50%)` }}
                        ></div>
                        <span className="text-sm font-medium">{method.method}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{method.count} transações</div>
                        <div className="text-xs text-muted-foreground">{formatPercentage(method.percentage)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas de Clientes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Estatísticas de Clientes
                </CardTitle>
                <CardDescription>
                  Análise da base de clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total de Clientes</span>
                    <span className="text-lg font-bold">{formatNumber(reportData.customerStats.totalCustomers)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Novos Clientes</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">{formatNumber(reportData.customerStats.newCustomers)}</div>
                      <div className="text-xs text-muted-foreground">Este período</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Clientes Recorrentes</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">{formatNumber(reportData.customerStats.returningCustomers)}</div>
                      <div className="text-xs text-muted-foreground">Este período</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Taxa de Retenção</span>
                      <span className="text-sm font-bold text-green-600">
                        {formatPercentage((reportData.customerStats.returningCustomers / (reportData.customerStats.newCustomers + reportData.customerStats.returningCustomers)) * 100)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}