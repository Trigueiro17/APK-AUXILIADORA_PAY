import { NextRequest, NextResponse } from 'next/server';

// Estado simulado da sincronização
let syncState = {
  isRunning: false,
  lastSync: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  errorCount: 2,
  status: 'idle' as 'idle' | 'syncing' | 'error' | 'success'
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entity } = body;

    if (!entity) {
      return NextResponse.json(
        { error: 'Entidade é obrigatória para sincronização forçada' },
        { status: 400 }
      );
    }

    // Simular sincronização forçada
    syncState.isRunning = true;
    syncState.status = 'syncing';
    
    // Simular conclusão após 3 segundos
    setTimeout(() => {
      syncState.isRunning = false;
      syncState.status = 'success';
      syncState.lastSync = new Date().toISOString();
      syncState.errorCount = Math.max(0, syncState.errorCount - 1);
    }, 3000);

    return NextResponse.json({
      message: `Sincronização forçada iniciada para ${entity}`,
      entity,
      isRunning: true,
      status: 'syncing'
    });
  } catch (error) {
    console.error('Error forcing sync:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}