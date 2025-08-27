import { NextResponse } from 'next/server';

// Estado simulado da sincronização
let syncState = {
  isRunning: false,
  lastSync: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min atrás
  errorCount: 2,
  status: 'idle' as 'idle' | 'syncing' | 'error' | 'success'
};

export async function GET() {
  try {
    return NextResponse.json(syncState);
  } catch (error) {
    console.error('Error getting sync status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    if (syncState.isRunning) {
      return NextResponse.json(
        { 
          error: 'Sincronização já está em execução',
          isRunning: true 
        },
        { status: 409 }
      );
    }

    // Simular início da sincronização
    syncState.isRunning = true;
    syncState.status = 'syncing';
    
    // Simular conclusão após 5 segundos
    setTimeout(() => {
      syncState.isRunning = false;
      syncState.status = 'success';
      syncState.lastSync = new Date().toISOString();
      syncState.errorCount = Math.max(0, syncState.errorCount - 1);
    }, 5000);

    return NextResponse.json({
      message: 'Sincronização iniciada com sucesso',
      isRunning: true,
      status: 'syncing'
    });
  } catch (error) {
    console.error('Error starting sync:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}