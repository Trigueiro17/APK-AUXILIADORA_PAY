'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Package,
  RefreshCw,
  Server,
  ShoppingCart,
  TrendingUp,
  Users,
  Wifi,
  WifiOff,
  BarChart3,
  PieChart,
  LineChart,
  Zap,
  Shield,
  Globe,
} from 'lucide-react';
import { useSync, useNotification, useConnectionStatus } from '@/components/providers';
import { cn } from '@/lib/utils';
import { formatCurrency, formatRelativeTime } from '@/lib/format';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import ErrorBoundary, { APIErrorFallback } from '@/components/ui/error-boundary';
import ErrorNotification, { useErrorNotification } from '@/components/ui/error-notification';
import dynamic from 'next/dynamic';

// Importação dos novos gráficos modernos
import ModernSalesChart from '@/components/charts/ModernSalesChart';
import ModernRevenueChart from '@/components/charts/ModernRevenueChart';
import ModernWeeklyChart from '@/components/charts/ModernWeeklyChart';
import { DebugQueryTest } from '@/components/debug-query-test';

// Tipos para os dados do dashboard (usando os tipos do serviço)
interface SystemHealth {
  api: boolean;
  sync: boolean;
  overall: boolean;
}

export default function DashboardPage() {
  const { syncStatus, startSync, stopSync } = useSync();
  const { showSuccess, showError: showNotificationError } = useNotification();
  const { isConnected, isOnline, isApiConnected } = useConnectionStatus();
  const { error: notificationError, isVisible: isErrorVisible, showError: showErrorNotification, hideError } = useErrorNotification();

  // Use custom hook for dashboard data management
  const {
    data: dashboardData,
    metrics,
    activities,
    systemHealth,
    isLoading,
    isError,
    error: dashboardError,
    isRefetching,
    lastUpdated,
    refetch: refetchDashboard,
    retry,
    clearCache,
  } = useDashboardData({ refetchInterval: 30000 });

  // Show error notification when there's an API error
  React.useEffect(() => {
    if (dashboardError && !isErrorVisible) {
      showErrorNotification(dashboardError);
    }
  }, [dashboardError, isErrorVisible, showErrorNotification]);

  const handleManualSync = async () => {
    try {
      await startSync();
      showSuccess('Sincronização iniciada com sucesso');
      // Atualizar todos os dados após sincronização
      await refetchDashboard();
    } catch (error) {
      showNotificationError('Erro ao iniciar sincronização');
      console.error('Sync error:', error);
    }
  };

  const handleRefreshData = async () => {
    try {
      await refetchDashboard();
      showSuccess('Dados atualizados com sucesso');
    } catch (error) {
      showNotificationError('Erro ao atualizar dados');
      console.error('Refresh error:', error);
    }
  };

  // Derivar dados das queries
  const stats = metrics || dashboardData?.stats;
  const chartData = dashboardData?.charts;

  // Debug: Component render check
  console.log('🔍 Dashboard component rendering at:', new Date().toISOString());
  console.log('🔍 Hook states - isLoading:', isLoading, 'isError:', isError);
  
  // Debug: Log chart data to verify API integration
  React.useEffect(() => {
    console.log('=== CHART DATA DEBUG ===');
    console.log('isLoading:', isLoading);
    console.log('isError:', isError);
    console.log('dashboardError:', dashboardError);
    console.log('dashboardData:', dashboardData);
    console.log('chartData:', chartData);
    console.log('chartData?.sales:', chartData?.sales);
    console.log('chartData?.revenue:', chartData?.revenue);
    console.log('chartData?.weekly:', chartData?.weekly);
    console.log('=== END DEBUG ===');
  }, [dashboardData, chartData, isLoading, isError, dashboardError]);
  
  React.useEffect(() => {
    console.log('🚀 Dashboard component mounted!');
  }, []);
  const hasError = isError;

  // Transformar dados da API para os componentes de gráficos
  const transformSalesData = (apiData: any) => {
    console.log('transformSalesData - Input:', apiData);
    // Se há dados da API no formato Chart.js, retornar diretamente
    if (apiData && apiData.labels && apiData.datasets) {
      console.log('transformSalesData - Using API data:', apiData);
      return apiData;
    }
    
    // Se não há dados da API, usar dados das métricas semanais como fallback
    if (stats?.weeklyData) {
      return {
        labels: stats.weeklyData.map((item: any) => item.day),
        datasets: [{
          label: 'Vendas',
          data: stats.weeklyData.map((item: any) => item.sales || 0),
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      };
    }
    
    return {
      labels: [],
      datasets: [{
        label: 'Vendas',
        data: [],
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    };
  };

  const transformRevenueData = (apiData: any) => {
    console.log('transformRevenueData - Input:', apiData);
    // Se há dados da API no formato Chart.js, retornar diretamente
    if (apiData && apiData.labels && apiData.datasets) {
      console.log('transformRevenueData - Using API data:', apiData);
      return apiData;
    }
    
    // Se não há dados da API, usar dados das métricas semanais como fallback
    if (stats?.weeklyData) {
      return {
        labels: stats.weeklyData.map((item: any) => item.day),
        datasets: [{
          label: 'Receita',
          data: stats.weeklyData.map((item: any) => item.revenue || 0),
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      };
    }
    
    return {
      labels: [],
      datasets: [{
        label: 'Receita',
        data: [],
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    };
  };

  const transformWeeklyData = (apiData: any) => {
    console.log('transformWeeklyData - Input:', apiData);
    // Se há dados da API no formato Chart.js, retornar diretamente
    if (apiData && apiData.labels && apiData.datasets) {
      console.log('transformWeeklyData - Using API data:', apiData);
      return apiData;
    }
    
    // Se não há dados da API, usar dados das métricas semanais como fallback
    if (stats?.weeklyData) {
      return {
        labels: stats.weeklyData.map((item: any) => item.day),
        datasets: [{
          label: 'Vendas',
          data: stats.weeklyData.map((item: any) => item.sales || 0),
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          borderColor: 'rgb(168, 85, 247)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }, {
          label: 'Receita',
          data: stats.weeklyData.map((item: any) => item.revenue || 0),
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 2,
          fill: false,
          tension: 0.4
        }]
      };
    }
    
    return {
      labels: [],
      datasets: [{
        label: 'Vendas',
        data: [],
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderColor: 'rgb(168, 85, 247)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    };
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'info':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <ShoppingCart className="h-4 w-4" />;
      case 'sync':
        return <RefreshCw className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'user':
        return <Users className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  // Debug: Log render and hook execution
  console.log('🔍 Dashboard Page: Component rendering');
  console.log('🔍 Dashboard Page: useDashboardData state:', {
    isLoading,
    isError,
    error: dashboardError?.message,
    hasData: !!dashboardData,
    hasMetrics: !!metrics,
    hasActivities: !!activities
  });

  return (
    <ErrorBoundary fallback={APIErrorFallback}>
       <ErrorNotification
         error={notificationError}
         isVisible={isErrorVisible}
         onClose={hideError}
         onRetry={retry}
       />
       <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Header Premium */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-200/20 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-emerald-600/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        <div className="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-6 lg:space-y-0">
              <div className="space-y-2 sm:space-y-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black bg-gradient-to-r from-white via-blue-100 to-emerald-100 bg-clip-text text-transparent tracking-tight leading-none">
                  Dashboard Executivo
                </h1>
                <p className="text-slate-300 text-lg sm:text-xl font-semibold tracking-wide leading-relaxed mt-2">
                  Visão geral do sistema Auxiliadora Pay
                </p>
                <div className="flex items-center space-x-2 text-slate-400">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm font-medium">Sistema integrado em tempo real</span>
                </div>
                {lastUpdated && (
                  <p className="text-xs text-slate-400 font-medium">
                    Última atualização: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 lg:space-x-6 w-full lg:w-auto">
                <div className={cn(
                  "flex items-center space-x-3 px-4 sm:px-6 py-2 sm:py-3 backdrop-blur-md rounded-2xl sm:rounded-3xl border shadow-lg transition-all duration-300",
                  hasError ? "bg-red-500/20 border-red-400/30" :
                  isConnected ? "bg-emerald-500/20 border-emerald-400/30" :
                  "bg-red-500/20 border-red-400/30"
                )}>
                  {hasError ? (
                    <>
                      <div className="relative">
                        <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-400 rounded-full animate-pulse" />
                      </div>
                      <span className="text-red-100 font-bold text-base sm:text-lg">Erro na API</span>
                    </>
                  ) : isConnected ? (
                    <>
                      <div className="relative">
                        <Wifi className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-emerald-400 rounded-full animate-pulse" />
                      </div>
                      <span className="text-emerald-100 font-bold text-base sm:text-lg">Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
                      <span className="text-red-100 font-bold text-base sm:text-lg">Offline</span>
                    </>
                  )}
                </div>
                <Button
                  onClick={hasError ? retry : handleManualSync}
                  disabled={syncStatus === 'syncing' || isRefetching}
                  className={cn(
                    "border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl sm:rounded-3xl px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold hover:scale-105 w-full sm:w-auto",
                    hasError ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600" :
                    "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  )}
                >
                  <RefreshCw className={cn('h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3', (syncStatus === 'syncing' || isRefetching) && 'animate-spin')} />
                  <span className="hidden sm:inline">
                    {hasError ? 'Tentar Novamente' :
                     syncStatus === 'syncing' || isRefetching ? 'Sincronizando...' : 'Sincronizar Agora'}
                  </span>
                  <span className="sm:hidden">
                    {hasError ? 'Retry' :
                     syncStatus === 'syncing' || isRefetching ? 'Sync...' : 'Sync'}
                  </span>
                </Button>
              </div>
            </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 lg:space-y-10">
        {/* Status Cards Premium */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Total de Vendas */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-blue-100/20 border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 group hover:scale-105 transform hover:-translate-y-2 animate-fade-in-up cursor-pointer focus-within:ring-4 focus-within:ring-blue-200/50 focus-within:outline-none" style={{animationDelay: '0ms'}}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/8 to-purple-600/8 transition-opacity duration-500 group-hover:opacity-80" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-16 translate-x-16 transition-transform duration-700 group-hover:scale-125 group-hover:rotate-12" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
            <CardHeader className="relative pb-4">
              <div className="flex items-center justify-between">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-gradient-to-br group-hover:from-blue-400 group-hover:to-purple-500">
                  <ShoppingCart className="h-7 w-7 text-white transition-all duration-500 group-hover:scale-125 group-hover:rotate-12 group-hover:drop-shadow-lg" />
                </div>
                <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg px-3 py-1 text-sm font-bold">
                  +12%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-3">
                <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider leading-tight group-hover:text-slate-800 transition-colors duration-300">Total de Vendas</p>
                {isLoading ? (
                  <div className="relative">
                    <Skeleton className="h-8 sm:h-10 w-24 sm:w-28 animate-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                ) : (
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-none animate-fade-in">
{(stats?.salesMetrics?.total || stats?.totalSales || 0).toLocaleString()}
                  </p>
                )}
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  Hoje: <span className="font-black text-blue-600">{stats?.salesMetrics?.today || 0}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Receita Total */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/30 to-emerald-100/20 border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 group hover:scale-105 transform hover:-translate-y-2 animate-fade-in-up cursor-pointer focus-within:ring-4 focus-within:ring-emerald-200/50 focus-within:outline-none" style={{animationDelay: '100ms'}}>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/8 to-green-600/8 transition-opacity duration-500 group-hover:opacity-80" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-full -translate-y-16 translate-x-16 transition-transform duration-700 group-hover:scale-125 group-hover:rotate-12" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
            <CardHeader className="relative pb-4">
              <div className="flex items-center justify-between">
                <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-gradient-to-br group-hover:from-emerald-400 group-hover:to-green-500">
                  <DollarSign className="h-7 w-7 text-white transition-all duration-500 group-hover:scale-125 group-hover:rotate-12 group-hover:drop-shadow-lg" />
                </div>
                <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-lg px-3 py-1 text-sm font-bold">
                  +8%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-3">
                <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider leading-tight group-hover:text-slate-800 transition-colors duration-300">Receita Total</p>
                {isLoading ? (
                  <div className="relative">
                    <Skeleton className="h-8 sm:h-10 w-28 sm:w-36 animate-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                ) : (
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-none animate-fade-in">
                    {formatCurrency(stats?.revenue?.total || 0)}
                  </p>
                )}
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  Hoje: <span className="font-black text-emerald-600">{formatCurrency(stats?.revenue?.today || 0)}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Total de Produtos */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-white via-purple-50/30 to-purple-100/20 border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 group hover:scale-105 transform hover:-translate-y-2 animate-fade-in-up cursor-pointer focus-within:ring-4 focus-within:ring-purple-200/50 focus-within:outline-none" style={{animationDelay: '200ms'}}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/8 to-pink-600/8 transition-opacity duration-500 group-hover:opacity-80" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full -translate-y-16 translate-x-16 transition-transform duration-700 group-hover:scale-125 group-hover:rotate-12" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
            <CardHeader className="relative pb-4">
              <div className="flex items-center justify-between">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-gradient-to-br group-hover:from-purple-400 group-hover:to-pink-500">
                  <Package className="h-7 w-7 text-white transition-all duration-500 group-hover:scale-125 group-hover:rotate-12 group-hover:drop-shadow-lg" />
                </div>
                <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg px-3 py-1 text-sm font-bold">
                  +5%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-3">
                <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider leading-tight group-hover:text-slate-800 transition-colors duration-300">Total de Produtos</p>
                {isLoading ? (
                  <div className="relative">
                    <Skeleton className="h-8 sm:h-10 w-24 sm:w-28 animate-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                ) : (
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-none animate-fade-in">
                    {stats?.products?.total?.toLocaleString() || '0'}
                  </p>
                )}
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  Ativos no sistema
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Total de Usuários */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-white via-amber-50/30 to-amber-100/20 border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 group hover:scale-105 transform hover:-translate-y-2 animate-fade-in-up cursor-pointer focus-within:ring-4 focus-within:ring-amber-200/50 focus-within:outline-none" style={{animationDelay: '300ms'}}>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-600/8 to-orange-600/8 transition-opacity duration-500 group-hover:opacity-80" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full -translate-y-16 translate-x-16 transition-transform duration-700 group-hover:scale-125 group-hover:rotate-12" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
            <CardHeader className="relative pb-4">
              <div className="flex items-center justify-between">
                <div className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-orange-500">
                  <Users className="h-7 w-7 text-white transition-all duration-500 group-hover:scale-125 group-hover:rotate-12 group-hover:drop-shadow-lg" />
                </div>
                <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 shadow-lg px-3 py-1 text-sm font-bold">
                  +3%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-3">
                <p className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider leading-tight group-hover:text-slate-800 transition-colors duration-300">Total de Usuários</p>
                {isLoading ? (
                  <div className="relative">
                    <Skeleton className="h-8 sm:h-10 w-20 sm:w-24 animate-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                ) : (
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-none animate-fade-in">
                    {stats?.users?.total?.toLocaleString() || '0'}
                  </p>
                )}
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  Usuários ativos
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos e Atividades */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Gráficos */}
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            <Card className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 border-0 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/3 to-purple-600/3" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full -translate-y-32 translate-x-32" />
              <CardHeader className="relative pb-6">
                <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent leading-none">
                  Análise de Performance
                </CardTitle>
                <p className="text-sm sm:text-base text-slate-600 font-medium mt-3 leading-relaxed">Visualização completa dos dados em tempo real</p>
              </CardHeader>
              <CardContent className="relative">
                <Tabs defaultValue="sales" className="space-y-8">
                  <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-slate-100 to-slate-200 p-2 rounded-2xl shadow-lg backdrop-blur-sm">
                    <TabsTrigger 
                      value="sales" 
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 rounded-xl font-bold text-slate-700 transition-all duration-500 hover:scale-105 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md group"
                    >
                      <BarChart3 className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
                      <span className="hidden sm:inline">📊 Vendas</span>
                      <span className="sm:hidden">📊</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="revenue" 
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 rounded-xl font-bold text-slate-700 transition-all duration-500 hover:scale-105 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-md group"
                    >
                      <LineChart className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
                      <span className="hidden sm:inline">💰 Receita</span>
                      <span className="sm:hidden">💰</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="weekly" 
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105 rounded-xl font-bold text-slate-700 transition-all duration-500 hover:scale-105 hover:bg-purple-50 hover:text-purple-700 hover:shadow-md group"
                    >
                      <PieChart className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
                      <span className="hidden sm:inline">📈 Semanal</span>
                      <span className="sm:hidden">📈</span>
                    </TabsTrigger>
                  </TabsList>
              
                  <TabsContent value="sales" className="space-y-4 sm:space-y-6">
                    <div className="h-[350px] sm:h-[400px] lg:h-[450px] bg-gradient-to-br from-white to-blue-50/50 rounded-2xl p-4 sm:p-6 shadow-lg border border-blue-100/50 flex flex-col">
                      <div className="flex items-center mb-4">
                        <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                        <h3 className="text-xl font-bold text-slate-800">Análise de Vendas</h3>
                      </div>
                      <p className="text-slate-600 mb-6">Desempenho de vendas nos últimos 30 dias</p>
                      <div className="flex-1 min-h-0">
                        <React.Suspense fallback={
                          <div className="w-full h-full flex flex-col space-y-4 animate-pulse">
                            <div className="flex justify-between items-center">
                              <div className="relative">
                                <Skeleton className="h-4 w-32" />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                              </div>
                              <div className="relative">
                                <Skeleton className="h-4 w-20" />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ animationDelay: '200ms' }} />
                              </div>
                            </div>
                            <div className="flex-1 flex items-end space-x-2">
                              {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="relative flex-1">
                                  <Skeleton className={`w-full bg-blue-200/50`} style={{ height: `${Math.random() * 80 + 20}%`, animationDelay: `${i * 100}ms` }} />
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ animationDelay: `${i * 150}ms` }} />
                                </div>
                              ))}
                            </div>
                          </div>
                        }>
                          <ModernSalesChart data={transformSalesData(chartData?.sales)} />
                        </React.Suspense>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="revenue" className="space-y-4 sm:space-y-6">
                    <div className="h-[350px] sm:h-[400px] lg:h-[450px] bg-gradient-to-br from-white to-emerald-50/50 rounded-2xl p-4 sm:p-6 shadow-lg border border-emerald-100/50 flex flex-col">
                      <div className="flex items-center mb-4">
                        <DollarSign className="h-5 w-5 mr-2 text-emerald-600" />
                        <h3 className="text-xl font-bold text-slate-800">Análise de Receita</h3>
                      </div>
                      <p className="text-slate-600 mb-6">Evolução da receita ao longo do tempo</p>
                      <div className="flex-1 min-h-0">
                        <React.Suspense fallback={
                          <div className="w-full h-full flex flex-col space-y-4 animate-pulse">
                            <div className="flex justify-between items-center">
                              <div className="relative">
                                <Skeleton className="h-4 w-36" />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                              </div>
                              <div className="relative">
                                <Skeleton className="h-4 w-24" />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ animationDelay: '200ms' }} />
                              </div>
                            </div>
                            <div className="flex-1 relative">
                              <svg className="w-full h-full">
                                <defs>
                                  <linearGradient id="shimmerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="transparent" />
                                    <stop offset="50%" stopColor="rgba(255,255,255,0.3)" />
                                    <stop offset="100%" stopColor="transparent" />
                                    <animateTransform attributeName="gradientTransform" type="translate" values="-100 0;100 0;-100 0" dur="2s" repeatCount="indefinite" />
                                  </linearGradient>
                                </defs>
                                <path d="M0,80 Q50,20 100,60 T200,40 T300,70" stroke="#10b981" strokeWidth="3" fill="none" opacity="0.3" />
                                <rect width="100%" height="100%" fill="url(#shimmerGradient)" />
                              </svg>
                            </div>
                          </div>
                        }>
                          <ModernRevenueChart data={transformRevenueData(chartData?.revenue)} />
                        </React.Suspense>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="weekly" className="space-y-4 sm:space-y-6">
                    <div className="h-[350px] sm:h-[400px] lg:h-[450px] bg-gradient-to-br from-white to-purple-50/50 rounded-2xl p-4 sm:p-6 shadow-lg border border-purple-100/50 flex flex-col">
                      <div className="flex items-center mb-4">
                        <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                        <h3 className="text-xl font-bold text-slate-800">Relatório Semanal</h3>
                      </div>
                      <p className="text-slate-600 mb-6">Distribuição de vendas por dia da semana</p>
                      <div className="flex-1 min-h-0">
                        <React.Suspense fallback={
                          <div className="w-full h-full flex items-center justify-center animate-pulse">
                            <div className="relative">
                              <div className="w-48 h-48 rounded-full border-8 border-purple-200/50">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                              </div>
                              <div className="absolute inset-4 rounded-full border-4 border-purple-300/30">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ animationDelay: '500ms' }} />
                              </div>
                              <div className="absolute inset-8 rounded-full border-2 border-purple-400/20">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" style={{ animationDelay: '1000ms' }} />
                              </div>
                            </div>
                          </div>
                        }>
                          <ModernWeeklyChart data={transformWeeklyData(chartData?.weekly)} />
                        </React.Suspense>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Atividades Recentes e Status do Sistema */}
          <div className="space-y-4 sm:space-y-6">
            {/* Status do Sistema */}
            <Card className="group relative overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/30 border-0 shadow-2xl rounded-3xl hover:shadow-3xl hover:scale-[1.01] transition-all duration-500 focus-within:ring-4 focus-within:ring-emerald-200/50 focus-within:outline-none">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/3 to-blue-600/3 group-hover:from-emerald-600/5 group-hover:to-blue-600/5 transition-all duration-500" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 group-hover:rotate-3 transition-all duration-700" />
              <CardHeader className="relative bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-100 pb-6 group-hover:from-emerald-50/30 group-hover:to-blue-50/50 transition-all duration-500">
                <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 flex items-center tracking-tight leading-none group-hover:text-emerald-900 transition-colors duration-300">
                  <Shield className="h-6 w-6 mr-3 text-emerald-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300" />
                  Status do Sistema
                </CardTitle>
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-2 leading-relaxed group-hover:text-slate-700 transition-colors duration-300">Monitoramento em tempo real</p>
              </CardHeader>
              <CardContent className="relative p-6 space-y-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="group/status flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-2xl border border-emerald-200/50 shadow-lg hover:shadow-xl hover:scale-[1.02] hover:border-emerald-300/60 hover:from-emerald-100/60 hover:to-emerald-200/50 transition-all duration-300 cursor-pointer focus-within:ring-2 focus-within:ring-emerald-200/50 focus-within:outline-none">
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 rounded-full animate-pulse shadow-lg shrink-0 group-hover/status:scale-125 group-hover/status:shadow-xl transition-all duration-300" />
                      <span className="text-sm sm:text-base font-bold text-emerald-800 leading-tight group-hover/status:text-emerald-900 transition-colors duration-300">API Externa</span>
                    </div>
                    <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-lg px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold shrink-0 group-hover/status:from-emerald-400 group-hover/status:to-emerald-500 group-hover/status:scale-105 transition-all duration-300">
                      🟢 Online
                    </Badge>
                  </div>
                  
                  <div className="group/status flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-2xl border border-blue-200/50 shadow-lg hover:shadow-xl hover:scale-[1.02] hover:border-blue-300/60 hover:from-blue-100/60 hover:to-blue-200/50 transition-all duration-300 cursor-pointer focus-within:ring-2 focus-within:ring-blue-200/50 focus-within:outline-none">
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full animate-pulse shadow-lg shrink-0 group-hover/status:scale-125 group-hover/status:shadow-xl transition-all duration-300" />
                      <span className="text-sm sm:text-base font-bold text-blue-800 leading-tight group-hover/status:text-blue-900 transition-colors duration-300">Sincronização</span>
                    </div>
                    <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold shrink-0 group-hover/status:from-blue-400 group-hover/status:to-blue-500 group-hover/status:scale-105 transition-all duration-300">
                      🔄 Ativa
                    </Badge>
                  </div>
                  
                  <div className="group/status flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-2xl border border-purple-200/50 shadow-lg hover:shadow-xl hover:scale-[1.02] hover:border-purple-300/60 hover:from-purple-100/60 hover:to-purple-200/50 transition-all duration-300 cursor-pointer focus-within:ring-2 focus-within:ring-purple-200/50 focus-within:outline-none">
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-purple-500 rounded-full animate-pulse shadow-lg shrink-0 group-hover/status:scale-125 group-hover/status:shadow-xl transition-all duration-300" />
                      <span className="text-sm sm:text-base font-bold text-purple-800 leading-tight group-hover/status:text-purple-900 transition-colors duration-300">Banco de Dados</span>
                    </div>
                    <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold shrink-0 group-hover/status:from-purple-400 group-hover/status:to-purple-500 group-hover/status:scale-105 transition-all duration-300">
                      🗄️ Conectado
                    </Badge>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl shadow-lg">
                    <span className="text-sm font-bold text-slate-700 flex items-center">
                      <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                      Tempo de Resposta da API
                    </span>
                    <span className="text-lg font-black text-emerald-600">{systemHealth?.responseTime || 0}ms</span>
                  </div>
                  <Progress value={85} className="mt-3 h-3 bg-slate-200 rounded-full" />
                </div>
              </CardContent>
            </Card>

            {/* Atividades Recentes */}
            <Card className="group relative overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-purple-50/30 border-0 shadow-2xl rounded-3xl hover:shadow-3xl hover:scale-[1.01] transition-all duration-500 focus-within:ring-4 focus-within:ring-purple-200/50 focus-within:outline-none">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/3 to-pink-600/3 group-hover:from-purple-600/5 group-hover:to-pink-600/5 transition-all duration-500" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 group-hover:rotate-3 transition-all duration-700" />
              <CardHeader className="relative bg-gradient-to-r from-slate-50 to-indigo-50 border-b border-slate-100 pb-6 group-hover:from-purple-50/30 group-hover:to-indigo-50/50 transition-all duration-500">
                <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 flex items-center tracking-tight leading-none group-hover:text-purple-900 transition-colors duration-300">
                  <Activity className="h-6 w-6 mr-3 text-purple-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300" />
                  Atividades Recentes
                </CardTitle>
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-2 leading-relaxed group-hover:text-slate-700 transition-colors duration-300">Últimas ações do sistema</p>
              </CardHeader>
              <CardContent className="relative p-6">
                <div className="space-y-3 sm:space-y-4">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-white rounded-2xl shadow-lg animate-pulse" style={{ animationDelay: `${i * 150}ms` }}>
                        <div className="relative">
                          <Skeleton className="h-10 sm:h-12 w-10 sm:w-12 rounded-2xl" />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer rounded-2xl" />
                        </div>
                        <div className="space-y-2 flex-1">
                          <div className="relative">
                            <Skeleton className="h-3 sm:h-4 w-full" />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                          </div>
                          <div className="relative">
                            <Skeleton className="h-2 sm:h-3 w-2/3" />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ animationDelay: '200ms' }} />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    activities?.map((activity) => (
                      <div key={activity.id} className="group/item flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-white rounded-2xl border border-slate-100 shadow-lg hover:shadow-xl hover:border-slate-200 hover:scale-[1.02] hover:from-purple-50/30 hover:to-white transition-all duration-300 cursor-pointer focus-within:ring-2 focus-within:ring-purple-200/50 focus-within:outline-none">
                        <div className={cn(
                          'p-2 sm:p-3 rounded-2xl shadow-lg shrink-0 group-hover/item:scale-110 group-hover/item:rotate-3 transition-all duration-300',
                          activity.status === 'success' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white' :
                          activity.status === 'warning' ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white' :
                          activity.status === 'error' ? 'bg-gradient-to-br from-red-500 to-red-600 text-white' :
                          'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                        )}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate leading-tight group-hover/item:text-purple-900 transition-colors duration-300">
                            {activity.description}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-xs text-slate-600 font-medium leading-relaxed group-hover/item:text-slate-700 transition-colors duration-300">
                              {formatRelativeTime(activity.timestamp)}
                            </p>
                            {activity.user && (
                              <>
                                <span className="text-xs text-slate-400 group-hover/item:text-slate-500 transition-colors duration-300">•</span>
                                <p className="text-xs text-slate-700 font-bold group-hover/item:text-slate-800 transition-colors duration-300">
                                  {typeof activity.user === 'string' ? activity.user : activity.user.name}
                                </p>
                              </>
                            )}
                          </div>
                          {activity.details && (
                            <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed group-hover/item:text-slate-700 transition-colors duration-300">
                              {typeof activity.details === 'string' ? activity.details : 
                                activity.details.paymentMethod ? `${activity.details.items} item(s) - ${activity.details.paymentMethod}` :
                                activity.details.email ? `Email: ${activity.details.email}` :
                                JSON.stringify(activity.details)
                              }
                            </p>
                          )}
                        </div>
                        <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse shrink-0 group-hover/item:scale-125 transition-transform duration-300" />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </ErrorBoundary>
  );
}