'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  retry?: () => void;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error!}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isNetworkError = error.message.includes('fetch') || error.message.includes('network');
  const isAPIError = error.message.includes('API') || error.message.includes('500') || error.message.includes('404');

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8 border-red-200 bg-red-50/50">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          {isNetworkError ? (
            <WifiOff className="h-12 w-12 text-red-500" />
          ) : (
            <AlertCircle className="h-12 w-12 text-red-500" />
          )}
        </div>
        <CardTitle className="text-xl font-bold text-red-800">
          {isNetworkError ? 'Problema de Conexão' : 
           isAPIError ? 'Erro na API' : 
           'Algo deu errado'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-red-800">Detalhes do Erro</AlertTitle>
          <AlertDescription className="text-red-700">
            {isNetworkError ? (
              'Não foi possível conectar com o servidor. Verifique sua conexão com a internet.'
            ) : isAPIError ? (
              'Ocorreu um erro ao comunicar com a API. Tente novamente em alguns instantes.'
            ) : (
              error.message || 'Ocorreu um erro inesperado. Nossa equipe foi notificada.'
            )}
          </AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={resetError}
            variant="outline"
            className="flex items-center gap-2 border-red-300 text-red-700 hover:bg-red-50"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar Novamente
          </Button>
          <Button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
          >
            <Wifi className="h-4 w-4" />
            Recarregar Página
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 p-4 bg-gray-100 rounded-lg text-sm">
            <summary className="cursor-pointer font-medium text-gray-700 mb-2">
              Detalhes Técnicos (Desenvolvimento)
            </summary>
            <pre className="whitespace-pre-wrap text-xs text-gray-600 overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

// Hook for handling async errors
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  return {
    error,
    resetError,
    handleError,
  };
}

// API Error component for specific API failures
export function APIErrorFallback({ error, resetError, retry }: ErrorFallbackProps & { retry?: () => void }) {
  return (
    <Alert className="border-amber-200 bg-amber-50">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">Erro ao carregar dados</AlertTitle>
      <AlertDescription className="text-amber-700 space-y-3">
        <p>Não foi possível carregar os dados do dashboard. Isso pode ser temporário.</p>
        <div className="flex gap-2">
          {retry && (
            <Button
              onClick={retry}
              size="sm"
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Tentar Novamente
            </Button>
          )}
          <Button
            onClick={resetError}
            size="sm"
            variant="ghost"
            className="text-amber-700 hover:bg-amber-100"
          >
            Fechar
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

export default ErrorBoundary;
export type { ErrorBoundaryProps, ErrorFallbackProps };