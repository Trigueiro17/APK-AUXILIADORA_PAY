import { NextResponse } from 'next/server';
import { AuxiliadoraPayApiClient } from '@/lib/api-client';

interface SystemHealth {
  api: boolean;
  sync: boolean;
  overall: boolean;
  apiResponseTime?: number;
  lastError?: string;
}

export async function GET() {
  try {
    const health: SystemHealth = {
      api: false,
      sync: false,
      overall: false
    };

    // Verificar conectividade com a API externa
    const startTime = Date.now();
    try {
      const apiClient = new AuxiliadoraPayApiClient();
      await apiClient.healthCheck();
      health.api = true;
      health.apiResponseTime = Date.now() - startTime;
    } catch (error) {
      console.error('API health check failed:', error);
      health.api = false;
      health.lastError = error instanceof Error ? error.message : 'API connection failed';
    }

    // Verificar status do sistema de sincronização
    try {
      // Verificar se conseguimos acessar dados básicos
      const apiClient = new AuxiliadoraPayApiClient();
      await apiClient.getUsers({ page: 1, limit: 1 });
      health.sync = true;
    } catch (error) {
      console.error('Sync health check failed:', error);
      health.sync = false;
      if (!health.lastError) {
        health.lastError = error instanceof Error ? error.message : 'Sync service failed';
      }
    }

    // Calcular status geral
    health.overall = health.api && health.sync;

    return NextResponse.json({
      status: health.overall ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: health.api ? 'up' : 'down',
          responseTime: health.apiResponseTime || null,
          error: health.api ? null : health.lastError
        },
        sync: {
          status: health.sync ? 'up' : 'down',
          lastSync: new Date().toISOString(),
          error: health.sync ? null : health.lastError
        }
      },
      ...health
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
        api: false,
        sync: false,
        overall: false
      },
      { status: 500 }
    );
  }
}

// Endpoint HEAD para verificações rápidas de balanceadores de carga
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}