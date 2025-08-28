import { NextRequest, NextResponse } from 'next/server';
import { auxiliadoraApiClient } from '@/lib/api-client';

export async function POST(request: NextRequest) {
  try {
    // Obter token do header Authorization
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      try {
        // Tentar fazer logout na API externa
        await auxiliadoraApiClient.logout();
      } catch (error) {
        // Se o logout na API falhar, continuar mesmo assim
        console.log('Logout na API externa falhou:', error);
      }
    }

    // Retornar sucesso independentemente do resultado da API externa
    return NextResponse.json(
      { message: 'Logout realizado com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    // Mesmo em caso de erro, retornar sucesso para o cliente
    // pois o logout deve sempre limpar o estado local
    return NextResponse.json(
      { message: 'Logout realizado com sucesso' },
      { status: 200 }
    );
  }
}