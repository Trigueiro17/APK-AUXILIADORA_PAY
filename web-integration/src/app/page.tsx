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
  CheckCircle2,
  Clock,
  DollarSign,
  Package,
  RefreshCw,
  Server,
  ShoppingCart,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useSync, useNotification, useConnectionStatus } from '@/components/providers';
import { cn } from '@/lib/utils';
import { formatCurrency, formatRelativeTime } from '@/lib/format';

// Tipos para os dados do dashboard
interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalSales: number;
  totalRevenue: number;
  todaySales: number;
  todayRevenue: number;
  syncStatus: 'HEALTHY' | 'WARNING' | 'ERROR';
  lastSyncTime: string | null;
  errorRate: number;
  apiResponseTime: number;
}

interface RecentActivity {
  id: string;
  type: 'sale' | 'sync' | 'error' | 'user';
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
  user?: string;
  details?: string;
}

interface SystemHealth {
  api: boolean;
  sync: boolean;
  overall: boolean;
}

export default function DashboardPage() {
  const { syncStatus, startSync, stopSync } = useSync();
  const { showSuccess, showError } = useNotification();
  const { isConnected, isOnline, isApiConnected } = useConnectionStatus();

  // Query para estatísticas do dashboard
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      return response.json();
    },
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  // Query para atividades recentes
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async (): Promise<RecentActivity[]> => {
      const response = await fetch('/api/dashboard/activities');
      if (!response.ok) {
        throw new Error('Failed to fetch recent activities');
      }
      const result = await response.json();
      return result.data || [];
    },
    refetchInterval: 15000, // Atualiza a cada 15 segundos
  });

  // Query para saúde do sistema
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: async (): Promise<SystemHealth> => {
      const response = await fetch('/api/health');
      if (!response.ok) {
        throw new Error('Failed to fetch system health');
      }
      return response.json();
    },
    refetchInterval: 10000, // Atualiza a cada 10 segundos
  });

  const handleRefresh = async () => {
    try {
      await refetchStats();
      showSuccess('Dados atualizados com sucesso');
    } catch (error) {
      showError('Erro ao atualizar dados');
    }
  };

  const handleSyncToggle = async () => {
    if (syncStatus.isRunning) {
      stopSync();
    } else {
      await startSync();
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Visão geral do sistema de integração Auxiliadora Pay
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Status de conexão */}
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <div className="flex items-center space-x-1 text-green-600">
                <Wifi className="h-4 w-4" />
                <span className="text-sm">Online</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-red-600">
                <WifiOff className="h-4 w-4" />
                <span className="text-sm">
                  {!isOnline ? 'Offline' : 'API Desconectada'}
                </span>
              </div>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={statsLoading}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', statsLoading && 'animate-spin')} />
            Atualizar
          </Button>
          
          <Button
            variant={syncStatus.isRunning ? 'destructive' : 'default'}
            size="sm"
            onClick={handleSyncToggle}
            disabled={!isConnected}
          >
            {syncStatus.isRunning ? (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Parar Sync
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Iniciar Sync
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Alertas de sistema */}
      {!isConnected && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Problema de Conectividade</AlertTitle>
          <AlertDescription>
            {!isOnline 
              ? 'Sem conexão com a internet. Verifique sua conexão de rede.'
              : 'Não foi possível conectar com a API Auxiliadora Pay. Verifique a configuração.'}
          </AlertDescription>
        </Alert>
      )}

      {stats?.syncStatus === 'ERROR' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro de Sincronização</AlertTitle>
          <AlertDescription>
            Há problemas na sincronização de dados. Verifique os logs para mais detalhes.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="sync">Sincronização</TabsTrigger>
          <TabsTrigger value="health">Saúde do Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Cards de estatísticas principais */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Usuários ativos no sistema
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produtos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Produtos cadastrados
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats?.todaySales || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      +{((stats?.todaySales || 0) / (stats?.totalSales || 1) * 100).toFixed(1)}% do total
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Hoje</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {formatCurrency(stats?.todayRevenue || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total: {formatCurrency(stats?.totalRevenue || 0)}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Atividades recentes */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Atividades Recentes</CardTitle>
                <CardDescription>
                  Últimas atividades do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1 flex-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities?.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-3">
                        <div className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center',
                          activity.status === 'success' && 'bg-green-100 text-green-600',
                          activity.status === 'warning' && 'bg-yellow-100 text-yellow-600',
                          activity.status === 'error' && 'bg-red-100 text-red-600',
                          activity.status === 'info' && 'bg-blue-100 text-blue-600'
                        )}>
                          {activity.type === 'sale' && <ShoppingCart className="h-4 w-4" />}
                          {activity.type === 'sync' && <RefreshCw className="h-4 w-4" />}
                          {activity.type === 'error' && <AlertCircle className="h-4 w-4" />}
                          {activity.type === 'user' && <Users className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(new Date(activity.timestamp))}
                          </p>
                        </div>
                      </div>
                    ))}
                    {(!activities || activities.length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma atividade recente
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Status do Sistema</CardTitle>
                <CardDescription>
                  Saúde geral dos componentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {healthLoading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Banco de dados removido - usando apenas API externa */}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Server className="h-4 w-4" />
                        <span className="text-sm">API Externa</span>
                      </div>
                      <Badge variant={health?.api ? 'default' : 'destructive'}>
                        {health?.api ? 'OK' : 'Erro'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="h-4 w-4" />
                        <span className="text-sm">Sincronização</span>
                      </div>
                      <Badge variant={health?.sync ? 'default' : 'destructive'}>
                        {health?.sync ? 'OK' : 'Erro'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4" />
                        <span className="text-sm font-medium">Geral</span>
                      </div>
                      <Badge variant={health?.overall ? 'default' : 'destructive'}>
                        {health?.overall ? 'Saudável' : 'Problemas'}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Status da Sincronização</CardTitle>
                <CardDescription>
                  Estado atual do processo de sincronização
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Estado:</span>
                  <Badge variant={
                    syncStatus.status === 'success' ? 'default' :
                    syncStatus.status === 'error' ? 'destructive' :
                    syncStatus.status === 'syncing' ? 'secondary' : 'outline'
                  }>
                    {syncStatus.status === 'syncing' && 'Sincronizando'}
                    {syncStatus.status === 'success' && 'Sucesso'}
                    {syncStatus.status === 'error' && 'Erro'}
                    {syncStatus.status === 'idle' && 'Parado'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Última Sincronização:</span>
                  <span className="text-sm text-muted-foreground">
                    {syncStatus.lastSyncTime 
                      ? formatRelativeTime(syncStatus.lastSyncTime)
                      : 'Nunca'
                    }
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Erros:</span>
                  <span className="text-sm text-muted-foreground">
                    {syncStatus.errorCount}
                  </span>
                </div>
                
                {stats && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Taxa de Erro:</span>
                      <span className="text-sm text-muted-foreground">
                        {stats.errorRate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={stats.errorRate} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Performance da API</CardTitle>
                <CardDescription>
                  Métricas de performance da API Auxiliadora Pay
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {statsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Tempo de Resposta:</span>
                      <span className="text-sm text-muted-foreground">
                        {stats?.apiResponseTime || 0}ms
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status da API:</span>
                      <Badge variant={isApiConnected ? 'default' : 'destructive'}>
                        {isApiConnected ? 'Conectada' : 'Desconectada'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Última Verificação:</span>
                      <span className="text-sm text-muted-foreground">
                        {stats?.lastSyncTime 
                          ? formatRelativeTime(new Date(stats.lastSyncTime))
                          : 'Nunca'
                        }
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle>Verificação de Saúde do Sistema</CardTitle>
                <CardDescription>
                  Status detalhado de todos os componentes do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {healthLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded">
                        <div className="flex items-center space-x-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Banco de dados removido - usando apenas API externa */}
                    
                    <div className="flex items-center justify-between p-4 border rounded">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center',
                          health?.api ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        )}>
                          <Server className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">API Auxiliadora Pay</p>
                          <p className="text-sm text-muted-foreground">
                            Conectividade com a API externa
                          </p>
                        </div>
                      </div>
                      <Badge variant={health?.api ? 'default' : 'destructive'}>
                        {health?.api ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" />Conectada</>
                        ) : (
                          <><AlertCircle className="h-3 w-3 mr-1" />Desconectada</>
                        )}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center',
                          health?.sync ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        )}>
                          <RefreshCw className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">Sistema de Sincronização</p>
                          <p className="text-sm text-muted-foreground">
                            Engine de sincronização automática
                          </p>
                        </div>
                      </div>
                      <Badge variant={health?.sync ? 'default' : 'destructive'}>
                        {health?.sync ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" />Ativo</>
                        ) : (
                          <><AlertCircle className="h-3 w-3 mr-1" />Inativo</>
                        )}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded bg-muted/50">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center',
                          health?.overall ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        )}>
                          <Activity className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">Status Geral</p>
                          <p className="text-sm text-muted-foreground">
                            Saúde geral do sistema
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={health?.overall ? 'default' : 'destructive'}
                        className="text-sm px-3 py-1"
                      >
                        {health?.overall ? (
                          <><CheckCircle2 className="h-4 w-4 mr-1" />Sistema Saudável</>
                        ) : (
                          <><AlertCircle className="h-4 w-4 mr-1" />Problemas Detectados</>
                        )}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}