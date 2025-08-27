'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';

// Configuração do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
      retry: (failureCount, error: any) => {
        // Não tenta novamente para erros 4xx
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Máximo 3 tentativas para outros erros
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Context para configuração da aplicação
 */
interface AppConfig {
  apiBaseUrl: string;
  syncInterval: number;
  enableRealTimeSync: boolean;
  enableNotifications: boolean;
}

const AppConfigContext = React.createContext<AppConfig>({
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://www.auxiliadorapay.shop/api',
  syncInterval: parseInt(process.env.NEXT_PUBLIC_SYNC_INTERVAL || '30000'),
  enableRealTimeSync: process.env.NEXT_PUBLIC_ENABLE_REAL_TIME_SYNC !== 'false',
  enableNotifications: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS !== 'false',
});

export const useAppConfig = () => {
  const context = React.useContext(AppConfigContext);
  if (!context) {
    throw new Error('useAppConfig must be used within AppConfigProvider');
  }
  return context;
};

/**
 * Context para notificações
 */
interface NotificationContextType {
  showNotification: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const NotificationContext = React.createContext<NotificationContextType | null>(null);

export const useNotification = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

/**
 * Provider de notificações
 */
function NotificationProvider({ children }: { children: React.ReactNode }) {
  const showNotification = React.useCallback(
    (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
      // Usando sonner para notificações
      const { toast } = require('sonner');
      
      switch (type) {
        case 'success':
          toast.success(message);
          break;
        case 'error':
          toast.error(message);
          break;
        case 'warning':
          toast.warning(message);
          break;
        default:
          toast.info(message);
      }
    },
    []
  );

  const showSuccess = React.useCallback(
    (message: string) => showNotification(message, 'success'),
    [showNotification]
  );

  const showError = React.useCallback(
    (message: string) => showNotification(message, 'error'),
    [showNotification]
  );

  const showWarning = React.useCallback(
    (message: string) => showNotification(message, 'warning'),
    [showNotification]
  );

  const showInfo = React.useCallback(
    (message: string) => showNotification(message, 'info'),
    [showNotification]
  );

  const value = React.useMemo(
    () => ({
      showNotification,
      showSuccess,
      showError,
      showWarning,
      showInfo,
    }),
    [showNotification, showSuccess, showError, showWarning, showInfo]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Context para status de sincronização
 */
interface SyncStatus {
  isRunning: boolean;
  lastSyncTime: Date | null;
  errorCount: number;
  status: 'idle' | 'syncing' | 'error' | 'success';
}

interface SyncContextType {
  syncStatus: SyncStatus;
  startSync: () => Promise<void>;
  stopSync: () => void;
  forceSyncEntity: (entity: string) => Promise<void>;
}

const SyncContext = React.createContext<SyncContextType | null>(null);

export const useSync = () => {
  const context = React.useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within SyncProvider');
  }
  return context;
};

/**
 * Provider de sincronização
 */
function SyncProvider({ children }: { children: React.ReactNode }) {
  const [syncStatus, setSyncStatus] = React.useState<SyncStatus>({
    isRunning: false,
    lastSyncTime: null,
    errorCount: 0,
    status: 'idle',
  });

  const { showError, showSuccess } = useNotification();

  const startSync = React.useCallback(async () => {
    try {
      setSyncStatus(prev => ({ ...prev, status: 'syncing', isRunning: true }));
      
      // Aqui você faria a chamada para iniciar a sincronização
      const response = await fetch('/api/sync/start', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to start sync');
      }
      
      setSyncStatus(prev => ({
        ...prev,
        status: 'success',
        lastSyncTime: new Date(),
        errorCount: 0,
      }));
      
      showSuccess('Sincronização iniciada com sucesso');
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        status: 'error',
        isRunning: false,
        errorCount: prev.errorCount + 1,
      }));
      
      showError('Erro ao iniciar sincronização');
    }
  }, [showError, showSuccess]);

  const stopSync = React.useCallback(() => {
    setSyncStatus(prev => ({ ...prev, isRunning: false, status: 'idle' }));
    console.log('Sincronização interrompida');
  }, []);

  const forceSyncEntity = React.useCallback(async (entity: string) => {
    try {
      const response = await fetch(`/api/sync/force/${entity}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to sync ${entity}`);
      }
      
      showSuccess(`Sincronização de ${entity} concluída`);
    } catch (error) {
      showError(`Erro ao sincronizar ${entity}`);
    }
  }, [showError, showSuccess]);

  const value = React.useMemo(
    () => ({
      syncStatus,
      startSync,
      stopSync,
      forceSyncEntity,
    }),
    [syncStatus, startSync, stopSync, forceSyncEntity]
  );

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
}

/**
 * Provider principal que combina todos os providers
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AppConfigContext.Provider
          value={{
            apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://www.auxiliadorapay.shop/api',
            syncInterval: parseInt(process.env.NEXT_PUBLIC_SYNC_INTERVAL || '30000'),
            enableRealTimeSync: process.env.NEXT_PUBLIC_ENABLE_REAL_TIME_SYNC !== 'false',
            enableNotifications: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS !== 'false',
          }}
        >
          <NotificationProvider>
            <SyncProvider>
              {children}
              <Toaster
                position="top-right"
                expand={false}
                richColors
                closeButton
                toastOptions={{
                  duration: 5000,
                  style: {
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                  },
                }}
              />
            </SyncProvider>
          </NotificationProvider>
        </AppConfigContext.Provider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

/**
 * Hook para gerenciar estado de loading global
 */
export function useGlobalLoading() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState<string>('');

  const startLoading = React.useCallback((message: string = 'Carregando...') => {
    setLoadingMessage(message);
    setIsLoading(true);
  }, []);

  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
    setLoadingMessage('');
  }, []);

  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
  };
}

/**
 * Hook para gerenciar estado de conexão
 */
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = React.useState(true);
  const [isApiConnected, setIsApiConnected] = React.useState(true);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Verifica conexão com a API periodicamente
  React.useEffect(() => {
    const checkApiConnection = async () => {
      try {
        const response = await fetch('/api/health', {
          method: 'GET',
          cache: 'no-cache',
        });
        setIsApiConnected(response.ok);
      } catch {
        setIsApiConnected(false);
      }
    };

    // Verifica imediatamente
    checkApiConnection();

    // Verifica a cada 30 segundos
    const interval = setInterval(checkApiConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    isOnline,
    isApiConnected,
    isConnected: isOnline && isApiConnected,
  };
}

export default Providers;