'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

export function DebugQueryTest() {
  console.log('🔍 DebugQueryTest: Componente renderizado');

  const { data, isLoading, error, isError, isSuccess, status, fetchStatus } = useQuery({
    queryKey: ['debug-health'],
    queryFn: async () => {
      console.log('🔍 DebugQueryTest: Iniciando query para /api/health');
      try {
        const response = await fetch('/api/health', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('🔍 DebugQueryTest: Response status:', response.status);
        console.log('🔍 DebugQueryTest: Response ok:', response.ok);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log('🔍 DebugQueryTest: Dados recebidos:', result);
        return result;
      } catch (err) {
        console.error('🔍 DebugQueryTest: Erro na query:', err);
        throw err;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    console.log('🔍 DebugQueryTest: Estado da query:', {
      status,
      fetchStatus,
      isLoading,
      isError,
      isSuccess,
      data,
      error: error?.message
    });
  }, [status, fetchStatus, isLoading, isError, isSuccess, data, error]);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'black', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div>🔍 Debug Query Test</div>
      <div>Status: {status}</div>
      <div>Fetch Status: {fetchStatus}</div>
      <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
      <div>Error: {isError ? error?.message : 'No'}</div>
      <div>Success: {isSuccess ? 'Yes' : 'No'}</div>
      <div>Data: {data ? JSON.stringify(data).substring(0, 100) + '...' : 'None'}</div>
    </div>
  );
}