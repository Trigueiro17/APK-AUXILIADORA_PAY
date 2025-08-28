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
  LogOut,
  Package,
  RefreshCw,
  Settings,
  ShoppingCart,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useConnectionStatus, useSync } from '@/components/providers';
import { useAuth } from '@/hooks/useAuth';

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
  const { logout, user } = useAuth();

  return (
    <div className={cn('pb-12 min-h-screen', className)}>
      <div className="space-y-4 py-4">
        {/* Logo e título */}
        <div className="px-4 py-3">
          <div className="flex items-center space-x-3 mb-6 p-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg">
            <Activity className="h-8 w-8 text-white" />
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Auxiliadora Pay
              </h2>
              <p className="text-xs text-indigo-100 font-medium">
                Sistema de Integração
              </p>
            </div>
          </div>
          
          {/* Status de conexão */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200/50 dark:border-slate-700/50 shadow-lg backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              {isConnected ? (
                <Wifi className="h-5 w-5 text-emerald-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-rose-600" />
              )}
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            
            {/* Status de sincronização */}
            {syncStatus.isRunning && (
              <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm px-3 py-1 text-xs font-semibold">
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Sync
              </Badge>
            )}
          </div>
        </div>
        
        {/* Navegação principal */}
        <div className="px-4">
          <div className="space-y-2">
            <h3 className="mb-4 px-2 text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
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
                      'w-full justify-start h-auto p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg',
                      isActive 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg font-bold' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    )}
                  >
                    <Icon className={cn(
                      "mr-4 h-5 w-5",
                      isActive ? "text-white" : "text-slate-600 dark:text-slate-400"
                    )} />
                    <div className="flex-1 text-left space-y-1">
                      <div className={cn(
                        "text-sm font-bold",
                        isActive ? "text-white" : "text-slate-900 dark:text-slate-100"
                      )}>{item.name}</div>
                      <div className={cn(
                        "text-xs font-medium",
                        isActive ? "text-indigo-100" : "text-slate-600 dark:text-slate-400"
                      )}>
                        {item.description}
                      </div>
                    </div>
                    
                    {/* Indicadores especiais */}
                    {item.name === 'Sincronização' && syncStatus.errorCount > 0 && (
                      <Badge className="bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-sm px-2 py-1 text-xs font-bold">
                        {syncStatus.errorCount}
                      </Badge>
                    )}
                    
                    {item.name === 'Monitoramento' && !isConnected && (
                      <div className="h-3 w-3 bg-gradient-to-r from-rose-500 to-red-600 rounded-full shadow-lg animate-pulse" />
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
        
        {/* Seção de status do sistema */}
        <div className="px-4">
          <div className="space-y-3">
            <h3 className="mb-4 px-2 text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
              Status do Sistema
            </h3>
            
            <div className="p-4 space-y-3 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg backdrop-blur-sm">
              {/* Status da API */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase">API Externa:</span>
                <Badge 
                  className={isApiConnected 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm px-3 py-1 text-xs font-semibold' 
                    : 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-sm px-3 py-1 text-xs font-semibold'
                  }
                >
                  {isApiConnected ? 'OK' : 'Erro'}
                </Badge>
              </div>
              
              {/* Status da sincronização */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase">Sincronização:</span>
                <Badge 
                  className={
                    syncStatus.status === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm px-3 py-1 text-xs font-semibold' :
                    syncStatus.status === 'error' ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-sm px-3 py-1 text-xs font-semibold' :
                    syncStatus.status === 'syncing' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm px-3 py-1 text-xs font-semibold' : 
                    'bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-sm px-3 py-1 text-xs font-semibold'
                  }
                >
                  {syncStatus.status === 'syncing' && 'Ativo'}
                  {syncStatus.status === 'success' && 'OK'}
                  {syncStatus.status === 'error' && 'Erro'}
                  {syncStatus.status === 'idle' && 'Parado'}
                </Badge>
              </div>
              
              {/* Status da rede */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase">Rede:</span>
                <Badge 
                  className={isOnline 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm px-3 py-1 text-xs font-semibold' 
                    : 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-sm px-3 py-1 text-xs font-semibold'
                  }
                >
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        {/* Seção do usuário e logout */}
        <div className="px-4">
          <div className="space-y-3">
            {user && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200/50 dark:border-slate-700/50 shadow-lg backdrop-blur-sm">
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{user.name}</div>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400">{user.email}</div>
              </div>
            )}
            
            <Button
              variant="ghost"
              className="w-full justify-start h-auto p-4 rounded-2xl text-rose-600 hover:text-rose-700 hover:bg-gradient-to-r hover:from-rose-50 hover:to-red-50 dark:hover:from-rose-900/30 dark:hover:to-red-900/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border border-rose-200/50 dark:border-rose-800/50"
              onClick={logout}
            >
              <LogOut className="mr-4 h-5 w-5" />
              <div className="flex-1 text-left space-y-1">
                <div className="text-sm font-bold">Sair</div>
                <div className="text-xs font-medium text-rose-500 dark:text-rose-400">
                  Fazer logout do sistema
                </div>
              </div>
            </Button>
          </div>
        </div>
        
        {/* Informações da versão */}
        <div className="px-6">
          <div className="text-center p-3 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400">Versão 1.0.0</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-500">© 2024 Auxiliadora Pay</div>
          </div>
        </div>
      </div>
    </div>
  );
}