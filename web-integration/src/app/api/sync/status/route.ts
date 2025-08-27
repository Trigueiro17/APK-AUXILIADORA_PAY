import { NextRequest, NextResponse } from 'next/server';
import { syncService } from '@/lib/sync-service';

export async function GET() {
  try {
    const status = await syncService.getStatus();
    
    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Erro ao obter status de sincronização:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'start':
        syncService.startAutoSync();
        break;
      case 'stop':
        syncService.stopAutoSync();
        break;
      case 'force':
        await syncService.forcSync();
        break;
      default:
        return NextResponse.json(
          { error: 'Ação inválida' },
          { status: 400 }
        );
    }
    
    const status = await syncService.getStatus();
    
    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Erro ao executar ação de sincronização:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}