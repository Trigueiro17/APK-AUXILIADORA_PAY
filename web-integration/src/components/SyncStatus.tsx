'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Loader2,
  Upload,
  Activity
} from 'lucide-react';
import { syncService } from '@/lib/sync-service';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SyncStatusData {
  lastSync: Date;
  pendingOperations: number;
  isOnline: boolean;
  errors: string[];
}

interface SyncStatusProps {
  compact?: boolean;
  showDetails?: boolean;
}

export default function SyncStatus({ compact = false, showDetails = true }: SyncStatusProps) {
  const [status, setStatus] = useState<SyncStatusData>({
    lastSync: new Date(),
    pendingOperations: 0,
    isOnline: true,
    errors: []
  });
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  useEffect(() => {
    // Carregar status inicial
    setStatus(syncService.getStatus());

    // Adicionar listener para mudanças de status
    const handleStatusChange = (newStatus: SyncStatusData) => {
      setStatus(newStatus);
    };

    syncService.addStatusListener(handleStatusChange);

    // Cleanup
    return () => {
      syncService.removeStatusListener(handleStatusChange);
    };
  }, []);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    setSyncProgress(0);
    
    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      await syncService.forcSync();
      
      clearInterval(progressInterval);
      setSyncProgress(100);
      
      // Reset progress after a delay
      setTimeout(() => {
        setSyncProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Erro na sincronização manual:', error);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const getStatusIcon = () => {
    if (!status.isOnline) {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }
    
    if (status.errors.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    
    if (status.pendingOperations > 0) {
      return <Upload className="h-4 w-4 text-blue-500" />;
    }
    
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!status.isOnline) {
      return 'Offline';
    }
    
    if (status.errors.length > 0) {
      return 'Com erros';
    }
    
    if (status.pendingOperations > 0) {
      return 'Sincronizando';
    }
    
    return 'Sincronizado';
  };

  const getStatusColor = () => {
    if (!status.isOnline) {
      return 'destructive';
    }
    
    if (status.errors.length > 0) {
      return 'secondary';
    }
    
    if (status.pendingOperations > 0) {
      return 'default';
    }
    
    return 'default';
  };

  const formatLastSync = () => {
    try {
      return formatDistanceToNow(status.lastSync, {
        addSuffix: true,
        locale: ptBR
      });
    } catch {
      return 'Nunca';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="text-sm text-muted-foreground">
          {getStatusText()}
        </span>
        {status.pendingOperations > 0 && (
          <Badge variant="outline" className="text-xs">
            {status.pendingOperations}
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleManualSync}
          disabled={isManualSyncing || !status.isOnline}
          className="h-6 w-6 p-0"
        >
          {isManualSyncing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle className="text-lg">Status de Sincronização</CardTitle>
          </div>
          <Badge variant={getStatusColor()}>
            {getStatusIcon()}
            <span className="ml-1">{getStatusText()}</span>
          </Badge>
        </div>
        <CardDescription>
          Monitoramento da sincronização com caixas registradoras
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progresso da sincronização */}
        {isManualSyncing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Sincronizando...</span>
              <span>{syncProgress}%</span>
            </div>
            <Progress value={syncProgress} className="h-2" />
          </div>
        )}

        {/* Informações gerais */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <Wifi className={`h-4 w-4 ${status.isOnline ? 'text-green-500' : 'text-red-500'}`} />
              <span className="font-medium">Conexão</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {status.isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Última Sync</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatLastSync()}
            </p>
          </div>
        </div>

        {/* Operações pendentes */}
        {status.pendingOperations > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Upload className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Operações Pendentes</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {status.pendingOperations} operação(ões) aguardando sincronização
              </p>
              <Badge variant="outline">
                {status.pendingOperations}
              </Badge>
            </div>
          </div>
        )}

        {/* Erros */}
        {status.errors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="font-medium">Erros</span>
            </div>
            <div className="space-y-1">
              {status.errors.slice(0, 3).map((error, index) => (
                <p key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </p>
              ))}
              {status.errors.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{status.errors.length - 3} erro(s) adicional(is)
                </p>
              )}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSync}
            disabled={isManualSyncing || !status.isOnline}
            className="flex-1"
          >
            {isManualSyncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sincronizar Agora
              </>
            )}
          </Button>
          
          {status.errors.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncService.clearPendingOperations()}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Limpar Erros
            </Button>
          )}
        </div>

        {/* Detalhes adicionais */}
        {showDetails && (
          <div className="pt-4 border-t space-y-2">
            <h4 className="text-sm font-medium">Detalhes da Sincronização</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Modo:</span>
                <span className="ml-2">
                  {status.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Intervalo:</span>
                <span className="ml-2">5 minutos</span>
              </div>
              <div>
                <span className="text-muted-foreground">Próxima sync:</span>
                <span className="ml-2">
                  {status.isOnline ? 'Automática' : 'Quando online'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <span className="ml-2">
                  {status.pendingOperations === 0 ? 'Atualizado' : 'Pendente'}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente de status compacto para header
export function CompactSyncStatus() {
  return <SyncStatus compact={true} />;
}

// Componente de status detalhado para dashboard
export function DetailedSyncStatus() {
  return <SyncStatus compact={false} showDetails={true} />;
}