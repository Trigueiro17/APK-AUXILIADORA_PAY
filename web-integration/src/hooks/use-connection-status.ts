'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface ConnectionStatus {
  network: boolean;
  api: boolean;
  lastCheck: Date | null;
}

export function useConnectionStatus() {
  const [networkStatus, setNetworkStatus] = useState(true);

  // Verificar status da rede
  useEffect(() => {
    const updateNetworkStatus = () => {
      setNetworkStatus(navigator.onLine);
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  // Verificar status da API
  const { data: apiStatus, isError } = useQuery({
    queryKey: ['api-health'],
    queryFn: async () => {
      const response = await fetch('/api/health');
      if (!response.ok) {
        throw new Error('API não disponível');
      }
      return response.json();
    },
    refetchInterval: 30000, // Verificar a cada 30 segundos
    retry: 3,
    retryDelay: 1000,
  });

  const connectionStatus: ConnectionStatus = {
    network: networkStatus,
    api: !isError && apiStatus?.status === 'healthy',
    lastCheck: new Date(),
  };

  return connectionStatus;
}