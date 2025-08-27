import { NextRequest, NextResponse } from 'next/server';

// Estado simulado da sincronização
let syncState = {
  isRunning: false,
  lastSync: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  errorCount: 2,
  status: 'idle' as 'idle' | 'syncing' | 'error' | 'success'
};

export async function POST(
  _request: NextRequest,
  { params }: { params: { entity: string } }
) {
  try {
    const { entity } = params;

    if (!entity) {
      return NextResponse.json(
        { error: 'Entidade é obrigatória' },
        { status: 400 }
      );
    }

    // Validar entidades permitidas
    const allowedEntities = ['customers', 'transactions', 'products', 'orders'];
    if (!allowedEntities.includes(entity)) {
      return NextResponse.json(
        { error: `Entidade '${entity}' não é válida. Entidades permitidas: ${allowedEntities.join(', ')}` },
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
      status: 'syncing',
      estimatedDuration: '3 segundos'
    });
  } catch (error) {
    console.error(`Error forcing sync for entity:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}