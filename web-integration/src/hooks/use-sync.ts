'use client';


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface SyncStatus {
  isRunning: boolean;
  lastSync: Date | null;
  errorCount: number;
  status: 'idle' | 'syncing' | 'error' | 'success';
}

export function useSync() {
  const queryClient = useQueryClient();

  // Buscar status da sincronização
  const { data: syncStatus, isLoading } = useQuery({
    queryKey: ['sync-status'],
    queryFn: async (): Promise<SyncStatus> => {
      const response = await fetch('/api/sync/start');
      if (!response.ok) {
        throw new Error('Erro ao buscar status da sincronização');
      }
      const data = await response.json();
      return {
        isRunning: data.isRunning || false,
        lastSync: data.lastSync ? new Date(data.lastSync) : null,
        errorCount: data.errorCount || 0,
        status: data.status || 'idle',
      };
    },
    refetchInterval: 5000, // Verificar a cada 5 segundos
  });

  // Iniciar sincronização
  const startSyncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/sync/start', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Erro ao iniciar sincronização');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Sincronização iniciada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao iniciar sincronização: ${error.message}`);
    },
  });

  // Parar sincronização
  const stopSyncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/sync/stop', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Erro ao parar sincronização');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Sincronização parada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao parar sincronização: ${error.message}`);
    },
  });

  // Forçar sincronização de uma entidade específica
  const forceSyncMutation = useMutation({
    mutationFn: async (entity: string) => {
      const response = await fetch(`/api/sync/force/${entity}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`Erro ao forçar sincronização de ${entity}`);
      }
      return response.json();
    },
    onSuccess: (_, entity) => {
      toast.success(`Sincronização de ${entity} iniciada`);
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
    },
    onError: (error: Error, entity) => {
      toast.error(`Erro ao sincronizar ${entity}: ${error.message}`);
    },
  });

  return {
    syncStatus: syncStatus || {
      isRunning: false,
      lastSync: null,
      errorCount: 0,
      status: 'idle' as const,
    },
    isLoading,
    startSync: startSyncMutation.mutate,
    stopSync: stopSyncMutation.mutate,
    forceSync: forceSyncMutation.mutate,
    isStarting: startSyncMutation.isPending,
    isStopping: stopSyncMutation.isPending,
    isForcing: forceSyncMutation.isPending,
  };
}