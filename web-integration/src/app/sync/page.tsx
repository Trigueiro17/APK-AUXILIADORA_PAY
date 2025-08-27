'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '@/components/providers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Square, RotateCcw, RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, Zap, ShoppingCart, Activity } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SalesSyncManager from '@/components/SalesSyncManager';
import { DetailedSyncStatus } from '@/components/SyncStatus';

interface SyncStatus {
  isRunning: boolean;
  lastSync: string | null;
  nextSync: string | null;
  progress: number;
  currentEntity: string | null;
  status: 'idle' | 'running' | 'completed' | 'error';
  errorCount: number;
  successCount: number;
  totalEntities: number;
  logs: {
    id: string;
    timestamp: string;
    level: 'info' | 'warning' | 'error' | 'success';
    message: string;
    entity?: string;
  }[];
}

interface SyncEntity {
  name: string;
  displayName: string;
  lastSync: string | null;
  status: 'synced' | 'pending' | 'error';
  recordCount: number;
  errorMessage?: string;
}

export default function SyncPage() {

  const [selectedTab, setSelectedTab] = useState('sales');
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  // Query para buscar status da sincronização
  const { data: syncStatus, isLoading } = useQuery({
    queryKey: ['sync-status'],
    queryFn: async (): Promise<SyncStatus> => {
      const response = await fetch('/api/sync/status');
      if (!response.ok) {
        // Dados simulados em caso de erro
        return {
          isRunning: false,
          lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          nextSync: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          progress: 0,
          currentEntity: null,
          status: 'idle',
          errorCount: 2,
          successCount: 15,
          totalEntities: 5,
          logs: [
            {
              id: '1',
              timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
              level: 'success',
              message: 'Sincronização de produtos concluída com sucesso',
              entity: 'products'
            },
            {
              id: '2',
              timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
              level: 'info',
              message: 'Iniciando sincronização de clientes',
              entity: 'customers'
            },
            {
              id: '3',
              timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
              level: 'error',
              message: 'Erro ao sincronizar vendas: Timeout na conexão',
              entity: 'sales'
            },
            {
              id: '4',
              timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              level: 'warning',
              message: 'Taxa de sincronização alta detectada',
              entity: 'general'
            }
          ]
        };
      }
      return response.json();
    },
    refetchInterval: 5000
  });

  // Query para buscar entidades
  const { data: entities } = useQuery({
    queryKey: ['sync-entities'],
    queryFn: async (): Promise<SyncEntity[]> => {
      // Dados simulados
      return [
        {
          name: 'products',
          displayName: 'Produtos',
          lastSync: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          status: 'synced',
          recordCount: 1250
        },
        {
          name: 'customers',
          displayName: 'Clientes',
          lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'synced',
          recordCount: 3420
        },
        {
          name: 'sales',
          displayName: 'Vendas',
          lastSync: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          status: 'error',
          recordCount: 8750,
          errorMessage: 'Timeout na conexão com a API'
        },
        {
          name: 'inventory',
          displayName: 'Estoque',
          lastSync: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          status: 'synced',
          recordCount: 2100
        },
        {
          name: 'payments',
          displayName: 'Pagamentos',
          lastSync: null,
          status: 'pending',
          recordCount: 0
        }
      ];
    },
    refetchInterval: 30000
  });

  // Mutation para iniciar sincronização
  const startSync = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/sync/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Erro ao iniciar sincronização');
      return response.json();
    },
    onSuccess: () => {
      showSuccess('Sincronização iniciada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
    },
    onError: () => {
      showError('Erro ao iniciar sincronização');
    }
  });

  // Mutation para parar sincronização
  const stopSync = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/sync/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Erro ao parar sincronização');
      return response.json();
    },
    onSuccess: () => {
      showSuccess('Sincronização interrompida');
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
    },
    onError: () => {
      showError('Erro ao parar sincronização');
    }
  });

  // Mutation para sincronização forçada
  const forceSync = useMutation({
    mutationFn: async (entity: string) => {
      const response = await fetch(`/api/sync/force/${entity}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Erro ao forçar sincronização');
      return response.json();
    },
    onSuccess: (_, entity) => {
      showSuccess(`Sincronização forçada de ${entity} iniciada`);
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['sync-entities'] });
    },
    onError: () => {
      showError('Erro ao forçar sincronização');
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'synced': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return `${Math.floor(diffInMinutes / 1440)} dias atrás`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sincronização</h1>
          <p className="text-muted-foreground">
            Gerencie a sincronização entre caixas registradoras e o sistema central
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => stopSync.mutate()}
            disabled={!syncStatus?.isRunning || stopSync.isPending}
          >
            <Square className="mr-2 h-4 w-4" />
            Parar
          </Button>
          <Button
            onClick={() => startSync.mutate()}
            disabled={syncStatus?.isRunning || startSync.isPending}
          >
            <Play className="mr-2 h-4 w-4" />
            Iniciar Sincronização
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Vendas
          </TabsTrigger>
          <TabsTrigger value="entities" className="flex items-center gap-2">
            {/* Database removido */}
            Entidades
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Status Geral
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <SalesSyncManager />
        </TabsContent>

        <TabsContent value="entities" className="space-y-6">

      {/* Status Geral */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            {syncStatus && getStatusIcon(syncStatus.status)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {syncStatus?.status === 'running' ? 'Executando' :
               syncStatus?.status === 'completed' ? 'Concluída' :
               syncStatus?.status === 'error' ? 'Erro' : 'Inativa'}
            </div>
            {syncStatus?.currentEntity && (
              <p className="text-xs text-muted-foreground">
                Sincronizando: {syncStatus.currentEntity}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Sincronização</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {syncStatus?.lastSync ? formatRelativeTime(syncStatus.lastSync) : 'Nunca'}
            </div>
            {syncStatus?.lastSync && (
              <p className="text-xs text-muted-foreground">
                {formatDateTime(syncStatus.lastSync)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sucessos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{syncStatus?.successCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Entidades sincronizadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erros</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{syncStatus?.errorCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Falhas na sincronização
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progresso */}
      {syncStatus?.isRunning && (
        <Card>
          <CardHeader>
            <CardTitle>Progresso da Sincronização</CardTitle>
            <CardDescription>
              {syncStatus.currentEntity ? `Sincronizando ${syncStatus.currentEntity}...` : 'Preparando sincronização...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={syncStatus.progress} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground mt-2">
              <span>{syncStatus.progress}% concluído</span>
              <span>{syncStatus.successCount + syncStatus.errorCount} de {syncStatus.totalEntities} entidades</span>
            </div>
          </CardContent>
        </Card>
      )}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Entidades */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {/* Database removido */}
                  Entidades
                </CardTitle>
                <CardDescription>
                  Status de sincronização por entidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center text-muted-foreground">Carregando...</div>
                  ) : entities ? (
                    entities.map((entity) => (
                      <div key={entity.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{entity.displayName}</h4>
                            <Badge className={getStatusBadgeColor(entity.status)}>
                              {entity.status === 'synced' ? 'Sincronizado' :
                               entity.status === 'pending' ? 'Pendente' : 'Erro'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {entity.recordCount.toLocaleString('pt-BR')} registros
                            {entity.lastSync && (
                              <span> • Última sync: {formatRelativeTime(entity.lastSync)}</span>
                            )}
                          </div>
                          {entity.errorMessage && (
                            <div className="text-sm text-red-600 mt-1">{entity.errorMessage}</div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => forceSync.mutate(entity.name)}
                          disabled={forceSync.isPending || syncStatus?.isRunning}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground">Nenhuma entidade encontrada</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Logs de Sincronização
                </CardTitle>
                <CardDescription>
                  Histórico recente de atividades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {syncStatus?.logs && syncStatus.logs.length > 0 ? (
                    syncStatus.logs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        {getLogIcon(log.level)}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{log.message}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatDateTime(log.timestamp)}
                            {log.entity && ` • ${log.entity}`}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      Nenhum log disponível
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DetailedSyncStatus />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {/* Database removido */}
                  Estatísticas de Sincronização
                </CardTitle>
                <CardDescription>
                  Métricas de performance da sincronização
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Uptime</p>
                    <p className="text-2xl font-bold text-green-600">99.8%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Latência Média</p>
                    <p className="text-2xl font-bold text-blue-600">120ms</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Vendas/Hora</p>
                    <p className="text-2xl font-bold text-purple-600">45</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Taxa de Erro</p>
                    <p className="text-2xl font-bold text-orange-600">0.2%</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t space-y-2">
                  <h4 className="text-sm font-medium">Caixas Ativas</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Caixa Principal</span>
                      <span className="text-green-600">Online</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Caixa Secundário</span>
                      <span className="text-green-600">Online</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Caixa Express</span>
                      <span className="text-red-600">Offline</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}