'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Save, RefreshCw, Shield, Bell, Globe, Key, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    timezone: string;
    language: string;
    maintenanceMode: boolean;
    debugMode: boolean;
  };
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    rateLimit: number;
    enableCaching: boolean;
    cacheTimeout: number;
  };
  // database: removido - não usa mais banco local
  security: {
    jwtExpiration: number;
    passwordMinLength: number;
    enableTwoFactor: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    enableAuditLog: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    webhookUrl: string;
    alertThresholds: {
      errorRate: number;
      responseTime: number;
      cpuUsage: number;
      memoryUsage: number;
    };
  };
  sync: {
    autoSync: boolean;
    syncInterval: number;
    batchSize: number;
    enableRetry: boolean;
    maxRetries: number;
    retryDelay: number;
  };
}

interface ConfigurationItem {
  key: string;
  value: string;
  description: string;
  category: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  required: boolean;
  sensitive: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();

  // Query para configurações do sistema
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async (): Promise<SystemSettings> => {
      // Dados simulados
      return {
        general: {
          siteName: 'Auxiliadora Pay Integration',
          siteDescription: 'Sistema de integração com API Auxiliadora Pay',
          timezone: 'America/Sao_Paulo',
          language: 'pt-BR',
          maintenanceMode: false,
          debugMode: false
        },
        api: {
          baseUrl: 'https://www.auxiliadorapay.shop/api',
          timeout: 30000,
          retryAttempts: 3,
          rateLimit: 1000,
          enableCaching: true,
          cacheTimeout: 300
        },
        // database: removido - não usa mais banco local
        security: {
          jwtExpiration: 3600,
          passwordMinLength: 8,
          enableTwoFactor: false,
          sessionTimeout: 1800,
          maxLoginAttempts: 5,
          enableAuditLog: true
        },
        notifications: {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
          webhookUrl: '',
          alertThresholds: {
            errorRate: 5.0,
            responseTime: 1000,
            cpuUsage: 80,
            memoryUsage: 85
          }
        },
        sync: {
          autoSync: true,
          syncInterval: 300,
          batchSize: 100,
          enableRetry: true,
          maxRetries: 3,
          retryDelay: 5000
        }
      };
    }
  });

  // Query para configurações avançadas
  const { data: configurations, isLoading: configurationsLoading } = useQuery({
    queryKey: ['system-configurations'],
    queryFn: async (): Promise<ConfigurationItem[]> => {
      // Dados simulados
      return [
        {
          key: 'AUXILIADORA_API_KEY',
          value: '*********************',
          description: 'Chave de API para autenticação com Auxiliadora Pay',
          category: 'API',
          type: 'string',
          required: true,
          sensitive: true
        },
        // DATABASE_URL removido - não usa mais banco local
        {
          key: 'REDIS_URL',
          value: 'redis://localhost:6379',
          description: 'URL de conexão com Redis para cache',
          category: 'Cache',
          type: 'string',
          required: false,
          sensitive: false
        },
        {
          key: 'JWT_SECRET',
          value: '*********************',
          description: 'Chave secreta para assinatura de tokens JWT',
          category: 'Security',
          type: 'string',
          required: true,
          sensitive: true
        },
        {
          key: 'WEBHOOK_SECRET',
          value: '*********************',
          description: 'Chave secreta para validação de webhooks',
          category: 'Webhooks',
          type: 'string',
          required: false,
          sensitive: true
        },
        {
          key: 'LOG_LEVEL',
          value: 'info',
          description: 'Nível de log do sistema (debug, info, warn, error)',
          category: 'Logging',
          type: 'string',
          required: false,
          sensitive: false
        },
        {
          key: 'MAX_FILE_SIZE',
          value: '10485760',
          description: 'Tamanho máximo de arquivo em bytes (10MB)',
          category: 'Upload',
          type: 'number',
          required: false,
          sensitive: false
        },
        {
          key: 'ENABLE_METRICS',
          value: 'true',
          description: 'Habilitar coleta de métricas do sistema',
          category: 'Monitoring',
          type: 'boolean',
          required: false,
          sensitive: false
        }
      ];
    }
  });

  // Mutation para salvar configurações
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<SystemSettings>) => {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      return newSettings;
    },
    onSuccess: () => {
      toast.success('Configurações salvas com sucesso!');
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
    onError: () => {
      toast.error('Erro ao salvar configurações');
    }
  });

  // Mutation para salvar configuração individual
  const saveConfigurationMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 500));
      return { key, value };
    },
    onSuccess: () => {
      toast.success('Configuração atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['system-configurations'] });
    },
    onError: () => {
      toast.error('Erro ao atualizar configuração');
    }
  });

  const handleSaveSettings = () => {
    if (settings) {
      saveSettingsMutation.mutate(settings);
    }
  };

  const handleConfigurationChange = (key: string, value: string) => {
    saveConfigurationMutation.mutate({ key, value });
  };

  const updateSettings = (section: keyof SystemSettings, field: string, value: any) => {
    if (settings) {
      const newSettings = {
        ...settings,
        [section]: {
          ...settings[section],
          [field]: value
        }
      };
      queryClient.setQueryData(['system-settings'], newSettings);
      setHasChanges(true);
    }
  };

  const updateNestedSettings = (section: keyof SystemSettings, subsection: string, field: string, value: any) => {
    if (settings) {
      const newSettings = {
        ...settings,
        [section]: {
          ...settings[section],
          [subsection]: {
            ...(settings[section] as any)[subsection],
            [field]: value
          }
        }
      };
      queryClient.setQueryData(['system-settings'], newSettings);
      setHasChanges(true);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'api': return <Globe className="h-4 w-4" />;
      // case 'database': removido
      case 'security': return <Shield className="h-4 w-4" />;
      case 'cache': return <Zap className="h-4 w-4" />;
      case 'webhooks': return <Bell className="h-4 w-4" />;
      case 'logging': return <Settings className="h-4 w-4" />;
      case 'upload': return <Settings className="h-4 w-4" />;
      case 'monitoring': return <Settings className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'api': return 'bg-blue-100 text-blue-800';
      // case 'database': removido
      case 'security': return 'bg-red-100 text-red-800';
      case 'cache': return 'bg-purple-100 text-purple-800';
      case 'webhooks': return 'bg-yellow-100 text-yellow-800';
      case 'logging': return 'bg-gray-100 text-gray-800';
      case 'upload': return 'bg-orange-100 text-orange-800';
      case 'monitoring': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const groupedConfigurations = configurations?.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, ConfigurationItem[]>) || {};

  if (settingsLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Carregando configurações...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['system-settings'] });
              queryClient.invalidateQueries({ queryKey: ['system-configurations'] });
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Recarregar
          </Button>
          {hasChanges && (
            <Button 
              onClick={handleSaveSettings}
              disabled={saveSettingsMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {saveSettingsMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="sync">Sincronização</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>

        {/* Configurações Gerais */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configurações básicas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nome do Site</Label>
                  <Input
                    id="siteName"
                    value={settings?.general.siteName || ''}
                    onChange={(e) => updateSettings('general', 'siteName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <select
                    id="timezone"
                    value={settings?.general.timezone || ''}
                    onChange={(e) => updateSettings('general', 'timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="America/Sao_Paulo">América/São Paulo</option>
                    <option value="America/New_York">América/Nova York</option>
                    <option value="Europe/London">Europa/Londres</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Descrição do Site</Label>
                <Textarea
                  id="siteDescription"
                  value={settings?.general.siteDescription || ''}
                  onChange={(e) => updateSettings('general', 'siteDescription', e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo de Manutenção</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar modo de manutenção do sistema
                  </p>
                </div>
                <Switch
                  checked={settings?.general.maintenanceMode || false}
                  onCheckedChange={(checked) => updateSettings('general', 'maintenanceMode', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo Debug</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar logs detalhados para desenvolvimento
                  </p>
                </div>
                <Switch
                  checked={settings?.general.debugMode || false}
                  onCheckedChange={(checked) => updateSettings('general', 'debugMode', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações de API */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de API</CardTitle>
              <CardDescription>
                Configurações de conexão com a API Auxiliadora Pay
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="baseUrl">URL Base da API</Label>
                <Input
                  id="baseUrl"
                  value={settings?.api.baseUrl || ''}
                  onChange={(e) => updateSettings('api', 'baseUrl', e.target.value)}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (ms)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={settings?.api.timeout || 0}
                    onChange={(e) => updateSettings('api', 'timeout', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retryAttempts">Tentativas de Retry</Label>
                  <Input
                    id="retryAttempts"
                    type="number"
                    value={settings?.api.retryAttempts || 0}
                    onChange={(e) => updateSettings('api', 'retryAttempts', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rateLimit">Rate Limit (req/min)</Label>
                  <Input
                    id="rateLimit"
                    type="number"
                    value={settings?.api.rateLimit || 0}
                    onChange={(e) => updateSettings('api', 'rateLimit', parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cache Habilitado</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar cache para requisições da API
                  </p>
                </div>
                <Switch
                  checked={settings?.api.enableCaching || false}
                  onCheckedChange={(checked) => updateSettings('api', 'enableCaching', checked)}
                />
              </div>
              {settings?.api.enableCaching && (
                <div className="space-y-2">
                  <Label htmlFor="cacheTimeout">Timeout do Cache (segundos)</Label>
                  <Input
                    id="cacheTimeout"
                    type="number"
                    value={settings?.api.cacheTimeout || 0}
                    onChange={(e) => updateSettings('api', 'cacheTimeout', parseInt(e.target.value))}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações do banco de dados removidas - usando apenas API externa */}

        {/* Configurações de Segurança */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>
                Configurações de autenticação e segurança
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="jwtExpiration">Expiração JWT (segundos)</Label>
                  <Input
                    id="jwtExpiration"
                    type="number"
                    value={settings?.security.jwtExpiration || 0}
                    onChange={(e) => updateSettings('security', 'jwtExpiration', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Timeout de Sessão (segundos)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings?.security.sessionTimeout || 0}
                    onChange={(e) => updateSettings('security', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Tamanho Mínimo da Senha</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={settings?.security.passwordMinLength || 0}
                    onChange={(e) => updateSettings('security', 'passwordMinLength', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Máximo de Tentativas de Login</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={settings?.security.maxLoginAttempts || 0}
                    onChange={(e) => updateSettings('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Autenticação de Dois Fatores</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilitar 2FA para todos os usuários
                  </p>
                </div>
                <Switch
                  checked={settings?.security.enableTwoFactor || false}
                  onCheckedChange={(checked) => updateSettings('security', 'enableTwoFactor', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Log de Auditoria</Label>
                  <p className="text-sm text-muted-foreground">
                    Registrar todas as ações dos usuários
                  </p>
                </div>
                <Switch
                  checked={settings?.security.enableAuditLog || false}
                  onCheckedChange={(checked) => updateSettings('security', 'enableAuditLog', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações de Notificações */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificações</CardTitle>
              <CardDescription>
                Configurações de alertas e notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações por Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar alertas por email
                    </p>
                  </div>
                  <Switch
                    checked={settings?.notifications.emailEnabled || false}
                    onCheckedChange={(checked) => updateSettings('notifications', 'emailEnabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações por SMS</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar alertas por SMS
                    </p>
                  </div>
                  <Switch
                    checked={settings?.notifications.smsEnabled || false}
                    onCheckedChange={(checked) => updateSettings('notifications', 'smsEnabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações Push</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar notificações push
                    </p>
                  </div>
                  <Switch
                    checked={settings?.notifications.pushEnabled || false}
                    onCheckedChange={(checked) => updateSettings('notifications', 'pushEnabled', checked)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">URL do Webhook</Label>
                <Input
                  id="webhookUrl"
                  value={settings?.notifications.webhookUrl || ''}
                  onChange={(e) => updateSettings('notifications', 'webhookUrl', e.target.value)}
                  placeholder="https://exemplo.com/webhook"
                />
              </div>
              <div className="space-y-4">
                <h4 className="font-medium">Limites de Alerta</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="errorRate">Taxa de Erro (%)</Label>
                    <Input
                      id="errorRate"
                      type="number"
                      step="0.1"
                      value={settings?.notifications.alertThresholds.errorRate || 0}
                      onChange={(e) => updateNestedSettings('notifications', 'alertThresholds', 'errorRate', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responseTime">Tempo de Resposta (ms)</Label>
                    <Input
                      id="responseTime"
                      type="number"
                      value={settings?.notifications.alertThresholds.responseTime || 0}
                      onChange={(e) => updateNestedSettings('notifications', 'alertThresholds', 'responseTime', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpuUsage">Uso de CPU (%)</Label>
                    <Input
                      id="cpuUsage"
                      type="number"
                      value={settings?.notifications.alertThresholds.cpuUsage || 0}
                      onChange={(e) => updateNestedSettings('notifications', 'alertThresholds', 'cpuUsage', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="memoryUsage">Uso de Memória (%)</Label>
                    <Input
                      id="memoryUsage"
                      type="number"
                      value={settings?.notifications.alertThresholds.memoryUsage || 0}
                      onChange={(e) => updateNestedSettings('notifications', 'alertThresholds', 'memoryUsage', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações de Sincronização */}
        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Sincronização</CardTitle>
              <CardDescription>
                Configurações do sistema de sincronização
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sincronização Automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Executar sincronização automaticamente
                  </p>
                </div>
                <Switch
                  checked={settings?.sync.autoSync || false}
                  onCheckedChange={(checked) => updateSettings('sync', 'autoSync', checked)}
                />
              </div>
              {settings?.sync.autoSync && (
                <div className="space-y-2">
                  <Label htmlFor="syncInterval">Intervalo de Sincronização (segundos)</Label>
                  <Input
                    id="syncInterval"
                    type="number"
                    value={settings?.sync.syncInterval || 0}
                    onChange={(e) => updateSettings('sync', 'syncInterval', parseInt(e.target.value))}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="batchSize">Tamanho do Lote</Label>
                <Input
                  id="batchSize"
                  type="number"
                  value={settings?.sync.batchSize || 0}
                  onChange={(e) => updateSettings('sync', 'batchSize', parseInt(e.target.value))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Retry Habilitado</Label>
                  <p className="text-sm text-muted-foreground">
                    Tentar novamente em caso de falha
                  </p>
                </div>
                <Switch
                  checked={settings?.sync.enableRetry || false}
                  onCheckedChange={(checked) => updateSettings('sync', 'enableRetry', checked)}
                />
              </div>
              {settings?.sync.enableRetry && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="maxRetries">Máximo de Tentativas</Label>
                    <Input
                      id="maxRetries"
                      type="number"
                      value={settings?.sync.maxRetries || 0}
                      onChange={(e) => updateSettings('sync', 'maxRetries', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="retryDelay">Delay entre Tentativas (ms)</Label>
                    <Input
                      id="retryDelay"
                      type="number"
                      value={settings?.sync.retryDelay || 0}
                      onChange={(e) => updateSettings('sync', 'retryDelay', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações Avançadas */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Avançadas</CardTitle>
              <CardDescription>
                Variáveis de ambiente e configurações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {configurationsLoading ? (
                  <div className="text-center text-muted-foreground">Carregando configurações...</div>
                ) : (
                  Object.entries(groupedConfigurations).map(([category, configs]) => (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(category)}
                        <h4 className="font-medium">{category}</h4>
                        <Badge className={getCategoryColor(category)}>
                          {configs.length} {configs.length === 1 ? 'item' : 'itens'}
                        </Badge>
                      </div>
                      <div className="space-y-3 pl-6">
                        {configs.map((config) => (
                          <div key={config.key} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{config.key}</span>
                                {config.required && (
                                  <Badge variant="destructive">Obrigatório</Badge>
                                )}
                                {config.sensitive && (
                                  <Badge variant="secondary">
                                    <Key className="h-3 w-3 mr-1" />
                                    Sensível
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{config.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                value={config.sensitive ? '*********************' : config.value}
                                onChange={(e) => {
                                  if (!config.sensitive) {
                                    handleConfigurationChange(config.key, e.target.value);
                                  }
                                }}
                                className="w-48"
                                type={config.sensitive ? 'password' : 'text'}
                                disabled={saveConfigurationMutation.isPending}
                              />
                              {config.sensitive && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newValue = prompt(`Digite o novo valor para ${config.key}:`);
                                    if (newValue !== null) {
                                      handleConfigurationChange(config.key, newValue);
                                    }
                                  }}
                                >
                                  Editar
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}