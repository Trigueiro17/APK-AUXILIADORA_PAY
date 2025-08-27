import { NextResponse } from 'next/server';

interface SystemHealth {
  api: boolean;
  sync: boolean;
  overall: boolean;
}

export async function GET() {
  try {
    const health: SystemHealth = {
      api: true, // Simulado como OK por enquanto
      sync: true, // Simulado como OK por enquanto
      overall: true
    };

    // Calcular status geral
    health.overall = health.api && health.sync;

    return NextResponse.json({
      status: health.overall ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: health.api ? 'up' : 'down',
          responseTime: Math.floor(Math.random() * 200) + 50 // Simulado
        },
        sync: {
          status: health.sync ? 'up' : 'down',
          lastSync: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString() // Última hora
        }
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Endpoint HEAD para verificações rápidas de balanceadores de carga
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}