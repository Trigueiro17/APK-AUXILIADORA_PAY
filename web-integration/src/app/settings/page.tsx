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
            errorRate: 5,
            responseTime: 2000,
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

  if (settingsLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Carregando configurações...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-3xl blur-3xl" />
          <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                    <Settings className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Configurações do Sistema
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                      Gerencie as configurações da integração
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}