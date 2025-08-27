import { NextResponse } from 'next/server';

// Estado simulado da sincronização (compartilhado)
let syncState = {
  isRunning: false,
  lastSync: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  errorCount: 2,
  status: 'idle' as 'idle' | 'syncing' | 'error' | 'success'
};

export async function POST() {
  try {
    if (!syncState.isRunning) {
      return NextResponse.json(
        { 
          error: 'Nenhuma sincronização em execução',
          isRunning: false 
        },
        { status: 409 }
      );
    }

    // Simular parada da sincronização
    syncState.isRunning = false;
    syncState.status = 'idle';

    return NextResponse.json({
      message: 'Sincronização parada com sucesso',
      isRunning: false,
      status: 'idle'
    });
  } catch (error) {
    console.error('Error stopping sync:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}