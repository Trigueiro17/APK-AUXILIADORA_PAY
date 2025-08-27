'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Download, RefreshCw, Server, Activity, AlertTriangle, CheckCircle, XCircle, Clock, Zap, Wifi } from 'lucide-react';

interface SystemMetrics {
  uptime: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  activeConnections: number;
  requestsPerMinute: number;
  errorRate: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  service: string;
  message: string;
  metadata?: Record<string, any>;
  userId?: string;
  requestId?: string;
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'maintenance';
  uptime: number;
  lastCheck: string;
  responseTime: number;
  errorCount: number;
  description: string;
}

export default function MonitoringPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('1h');

  // Query para métricas do sistema
  const { data: metrics } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: async (): Promise<SystemMetrics> => {
      // Dados simulados
      return {
        uptime: 99.8,
        cpuUsage: 45.2,
        memoryUsage: 68.5,
        diskUsage: 34.7,
        networkLatency: 12.5,
        activeConnections: 156,
        requestsPerMinute: 1247,
        errorRate: 0.3
      };
    },
    refetchInterval: 10000
  });

  // Query para status dos serviços
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['service-status'],
    queryFn: async (): Promise<ServiceStatus[]> => {
      // Dados simulados
      return [
        {
          name: 'API Gateway',
          status: 'healthy',
          uptime: 99.9,
          lastCheck: new Date(Date.now() - 30 * 1000).toISOString(),
          responseTime: 45,
          errorCount: 0,
          description: 'Gateway principal da API'
        },
        // Database removido - não usa mais banco local
        {
          name: 'Redis Cache',
          status: 'warning',
          uptime: 98.5,
          lastCheck: new Date(Date.now() - 45 * 1000).toISOString(),
          responseTime: 8,
          errorCount: 15,
          description: 'Cache Redis para sessões'
        },
        {
          name: 'Sync Service',
          status: 'healthy',
          uptime: 99.2,
          lastCheck: new Date(Date.now() - 20 * 1000).toISOString(),
          responseTime: 234,
          errorCount: 5,
          description: 'Serviço de sincronização'
        },
        {
          name: 'Payment Gateway',
          status: 'error',
          uptime: 95.1,
          lastCheck: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          responseTime: 0,
          errorCount: 45,
          description: 'Gateway de pagamentos'
        }
      ];
    },
    refetchInterval: 30000
  });

  // Query para logs
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['system-logs', searchTerm, selectedLevel, selectedService, timeRange],
    queryFn: async (): Promise<LogEntry[]> => {
      // Dados simulados
      const mockLogs: LogEntry[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          level: 'error',
          service: 'payment-gateway',
          message: 'Falha na conexão com o provedor de pagamento',
          metadata: { provider: 'stripe', errorCode: 'CONN_TIMEOUT' },
          requestId: 'req_123456'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          level: 'warning',
          service: 'redis-cache',
          message: 'Cache miss rate acima do limite (85%)',
          metadata: { missRate: 0.85, threshold: 0.8 }
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          level: 'info',
          service: 'sync-service',
          message: 'Sincronização de produtos concluída com sucesso',
          metadata: { recordsProcessed: 1250, duration: '45s' },
          userId: 'user_789'
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
          level: 'info',
          service: 'api-gateway',
          message: 'Nova sessão de usuário iniciada',
          metadata: { userAgent: 'Mozilla/5.0...', ip: '192.168.1.100' },
          userId: 'user_456',
          requestId: 'req_789012'
        },
        // Database removido - não usa mais banco local
        {
          id: '6',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          level: 'debug',
          service: 'api-gateway',
          message: 'Rate limit aplicado para IP 192.168.1.200',
          metadata: { requests: 1000, window: '1h', limit: 1000 }
        }
      ];

      // Filtrar logs
      let filteredLogs = mockLogs;
      
      if (searchTerm) {
        filteredLogs = filteredLogs.filter(log => 
          log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.service.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (selectedLevel !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.level === selectedLevel);
      }

      if (selectedService !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.service === selectedService);
      }

      return filteredLogs;
    },
    refetchInterval: 15000
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'maintenance': return <Clock className="h-4 w-4 text-blue-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'debug': return <Clock className="h-4 w-4 text-gray-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getLogLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'error': return 'bg-red-100 text-red-700';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'debug': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(1)}%`;
  };

  const getMetricColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  const services_list = ['api-gateway', 'redis-cache', 'sync-service', 'payment-gateway'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitoramento</h1>
          <p className="text-muted-foreground">
            Logs e métricas do sistema em tempo real
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Exportar Logs
          </Button>
        </div>
      </div>

      {/* Métricas do Sistema */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics ? formatUptime(metrics.uptime) : '---'}
            </div>
            <p className="text-xs text-muted-foreground">
              Sistema operacional
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              metrics ? getMetricColor(metrics.cpuUsage, { warning: 70, critical: 90 }) : ''
            }`}>
              {metrics ? `${metrics.cpuUsage.toFixed(1)}%` : '---'}
            </div>
            <p className="text-xs text-muted-foreground">
              Uso do processador
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memória</CardTitle>
            {/* Database removido */}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              metrics ? getMetricColor(metrics.memoryUsage, { warning: 80, critical: 95 }) : ''
            }`}>
              {metrics ? `${metrics.memoryUsage.toFixed(1)}%` : '---'}
            </div>
            <p className="text-xs text-muted-foreground">
              Uso da memória RAM
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latência</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              metrics ? getMetricColor(metrics.networkLatency, { warning: 50, critical: 100 }) : ''
            }`}>
              {metrics ? `${metrics.networkLatency.toFixed(1)}ms` : '---'}
            </div>
            <p className="text-xs text-muted-foreground">
              Latência da rede
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status dos Serviços */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Status dos Serviços
          </CardTitle>
          <CardDescription>
            Monitoramento em tempo real dos serviços
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {servicesLoading ? (
              <div className="col-span-full text-center text-muted-foreground">Carregando...</div>
            ) : services ? (
              services.map((service) => (
                <div key={service.name} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{service.name}</h4>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(service.status)}
                      <Badge className={getStatusBadgeColor(service.status)}>
                        {service.status === 'healthy' ? 'Saudável' :
                         service.status === 'warning' ? 'Atenção' :
                         service.status === 'error' ? 'Erro' : 'Manutenção'}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Uptime:</span>
                      <span className="font-medium">{formatUptime(service.uptime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tempo de resposta:</span>
                      <span className="font-medium">{service.responseTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Erros:</span>
                      <span className="font-medium">{service.errorCount}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-muted-foreground">Nenhum serviço encontrado</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filtros de Logs */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar nos logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="all">Todos os níveis</option>
              <option value="critical">Crítico</option>
              <option value="error">Erro</option>
              <option value="warning">Aviso</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="all">Todos os serviços</option>
              {services_list.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="1h">Última hora</option>
              <option value="6h">Últimas 6 horas</option>
              <option value="24h">Últimas 24 horas</option>
              <option value="7d">Últimos 7 dias</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs do Sistema</CardTitle>
          <CardDescription>
            Histórico detalhado de eventos e erros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {logsLoading ? (
              <div className="text-center text-muted-foreground">Carregando logs...</div>
            ) : logs && logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getLogLevelIcon(log.level)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getLogLevelBadgeColor(log.level)}>
                        {log.level.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-medium">{log.service}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(log.timestamp)}
                      </span>
                    </div>
                    <div className="text-sm">{log.message}</div>
                    {log.metadata && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {Object.entries(log.metadata).map(([key, value]) => (
                          <span key={key} className="mr-3">
                            {key}: {JSON.stringify(value)}
                          </span>
                        ))}
                      </div>
                    )}
                    {(log.userId || log.requestId) && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {log.userId && <span className="mr-3">User: {log.userId}</span>}
                        {log.requestId && <span>Request: {log.requestId}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Nenhum log encontrado para os filtros selecionados.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}