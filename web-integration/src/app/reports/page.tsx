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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 dark:from-slate-900 dark:to-slate-800">
      <div className="p-6 space-y-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-3xl blur-3xl" />
          <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Relatórios
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  Análises e insights do negócio
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}