'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, AlertCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorNotificationProps {
  error: Error | null;
  isVisible: boolean;
  onClose: () => void;
  onRetry?: () => void;
  className?: string;
}

export function ErrorNotification({
  error,
  isVisible,
  onClose,
  onRetry,
  className,
}: ErrorNotificationProps) {
  if (!isVisible || !error) return null;

  const isNetworkError = error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch');
  const isAPIError = error.message.includes('API') || error.message.includes('500') || error.message.includes('404');
  const isTimeoutError = error.message.includes('timeout') || error.message.includes('TIMEOUT');

  const getErrorType = () => {
    if (isNetworkError) return 'network';
    if (isAPIError) return 'api';
    if (isTimeoutError) return 'timeout';
    return 'general';
  };

  const getErrorMessage = () => {
    const errorType = getErrorType();
    
    switch (errorType) {
      case 'network':
        return 'Problema de conexão com o servidor. Verifique sua internet.';
      case 'api':
        return 'Erro na API. Tente novamente em alguns instantes.';
      case 'timeout':
        return 'Tempo limite excedido. O servidor pode estar sobrecarregado.';
      default:
        return error.message || 'Ocorreu um erro inesperado.';
    }
  };

  const getErrorIcon = () => {
    const errorType = getErrorType();
    
    switch (errorType) {
      case 'network':
        return <WifiOff className="h-4 w-4" />;
      case 'timeout':
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getErrorColor = () => {
    const errorType = getErrorType();
    
    switch (errorType) {
      case 'network':
        return 'border-orange-200 bg-orange-50 text-orange-800';
      case 'timeout':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      default:
        return 'border-red-200 bg-red-50 text-red-800';
    }
  };

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-2 duration-300",
      className
    )}>
      <Alert className={cn(
        "shadow-lg border-l-4",
        getErrorColor()
      )}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2 flex-1">
            {getErrorIcon()}
            <div className="flex-1">
              <AlertTitle className="text-sm font-semibold mb-1">
                {getErrorType() === 'network' ? 'Problema de Conexão' :
                 getErrorType() === 'api' ? 'Erro na API' :
                 getErrorType() === 'timeout' ? 'Tempo Limite Excedido' :
                 'Erro do Sistema'}
              </AlertTitle>
              <AlertDescription className="text-xs">
                {getErrorMessage()}
              </AlertDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-transparent"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        {onRetry && (
          <div className="mt-3 flex gap-2">
            <Button
              onClick={onRetry}
              size="sm"
              variant="outline"
              className={cn(
                "text-xs h-7",
                getErrorType() === 'network' ? 'border-orange-300 text-orange-700 hover:bg-orange-100' :
                getErrorType() === 'timeout' ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-100' :
                'border-red-300 text-red-700 hover:bg-red-100'
              )}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Tentar Novamente
            </Button>
          </div>
        )}
      </Alert>
    </div>
  );
}

// Hook para gerenciar notificações de erro
export function useErrorNotification() {
  const [error, setError] = React.useState<Error | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  const showError = React.useCallback((error: Error) => {
    setError(error);
    setIsVisible(true);
  }, []);

  const hideError = React.useCallback(() => {
    setIsVisible(false);
    // Delay clearing the error to allow animation to complete
    setTimeout(() => setError(null), 300);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
    setIsVisible(false);
  }, []);

  // Auto-hide after 10 seconds for non-critical errors
  React.useEffect(() => {
    if (isVisible && error) {
      const isNetworkError = error.message.includes('fetch') || error.message.includes('network');
      const isAPIError = error.message.includes('API');
      
      // Don't auto-hide network or API errors as they might need user action
      if (!isNetworkError && !isAPIError) {
        const timer = setTimeout(() => {
          hideError();
        }, 10000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, error, hideError]);

  return {
    error,
    isVisible,
    showError,
    hideError,
    clearError,
  };
}

export default ErrorNotification;