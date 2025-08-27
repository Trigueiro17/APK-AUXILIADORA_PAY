'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  BarChart3,
  DollarSign,
  Home,
  Package,
  RefreshCw,
  Settings,
  ShoppingCart,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useConnectionStatus, useSync } from '@/components/providers';

interface SidebarProps {
  className?: string;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
    description: 'Visão geral do sistema'
  },
  {
    name: 'Usuários',
    href: '/users',
    icon: Users,
    description: 'Gerenciar usuários'
  },
  {
    name: 'Produtos',
    href: '/products',
    icon: Package,
    description: 'Catálogo de produtos'
  },
  {
    name: 'Vendas',
    href: '/sales',
    icon: ShoppingCart,
    description: 'Histórico de vendas'
  },
  {
    name: 'Caixas Registradoras',
    href: '/cash-registers',
    icon: DollarSign,
    description: 'Gerenciar caixas registradoras'
  },
  {
    name: 'Relatórios',
    href: '/reports',
    icon: BarChart3,
    description: 'Relatórios e análises'
  },
  {
    name: 'Sincronização',
    href: '/sync',
    icon: RefreshCw,
    description: 'Gerenciar sincronização'
  },
  {
    name: 'Monitoramento',
    href: '/monitoring',
    icon: Activity,
    description: 'Logs e monitoramento'
  },
  {
    name: 'Configurações',
    href: '/settings',
    icon: Settings,
    description: 'Configurações do sistema'
  },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { isConnected, isOnline, isApiConnected } = useConnectionStatus();
  const { syncStatus } = useSync();

  return (
    <div className={cn('pb-12 min-h-screen', className)}>
      <div className="space-y-4 py-4">
        {/* Logo e título */}
        <div className="px-3 py-2">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Auxiliadora Pay
              </h2>
              <p className="text-xs text-muted-foreground">
                Sistema de Integração
              </p>
            </div>
          </div>
          
          {/* Status de conexão */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              <span className="text-xs font-medium">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            
            {/* Status de sincronização */}
            {syncStatus.isRunning && (
              <Badge variant="secondary" className="text-xs">
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Sync
              </Badge>
            )}
          </div>
        </div>
        
        {/* Navegação principal */}
        <div className="px-3">
          <div className="space-y-1">
            <h3 className="mb-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Navegação
            </h3>
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start h-auto p-3',
                      isActive && 'bg-secondary font-medium'
                    )}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    <div className="flex-1 text-left">
                      <div className="text-sm">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                    
                    {/* Indicadores especiais */}
                    {item.name === 'Sincronização' && syncStatus.errorCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {syncStatus.errorCount}
                      </Badge>
                    )}
                    
                    {item.name === 'Monitoramento' && !isConnected && (
                      <div className="h-2 w-2 bg-red-500 rounded-full" />
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
        
        {/* Seção de status do sistema */}
        <div className="px-3">
          <div className="space-y-1">
            <h3 className="mb-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Status do Sistema
            </h3>
            
            <div className="px-4 py-2 space-y-2">
              {/* Status da API */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">API Externa:</span>
                <Badge 
                  variant={isApiConnected ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {isApiConnected ? 'OK' : 'Erro'}
                </Badge>
              </div>
              
              {/* Status da sincronização */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Sincronização:</span>
                <Badge 
                  variant={
                    syncStatus.status === 'success' ? 'default' :
                    syncStatus.status === 'error' ? 'destructive' :
                    syncStatus.status === 'syncing' ? 'secondary' : 'outline'
                  }
                  className="text-xs"
                >
                  {syncStatus.status === 'syncing' && 'Ativo'}
                  {syncStatus.status === 'success' && 'OK'}
                  {syncStatus.status === 'error' && 'Erro'}
                  {syncStatus.status === 'idle' && 'Parado'}
                </Badge>
              </div>
              
              {/* Status da rede */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Rede:</span>
                <Badge 
                  variant={isOnline ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        {/* Informações da versão */}
        <div className="px-7">
          <div className="text-xs text-muted-foreground">
            <div>Versão 1.0.0</div>
            <div>© 2024 Auxiliadora Pay</div>
          </div>
        </div>
      </div>
    </div>
  );
}