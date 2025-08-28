import { NextRequest, NextResponse } from 'next/server';
import { auxiliadoraApiClient } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  try {
    // Obter token do header Authorization
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    // Verificar se é um token offline
    if (token.startsWith('offline-token-')) {
      // Para tokens offline, verificar se ainda está dentro do prazo válido
      const timestamp = token.replace('offline-token-', '');
      const tokenTime = parseInt(timestamp);
      const currentTime = Date.now();
      const tokenAge = currentTime - tokenTime;
      
      // Token offline válido por 24 horas
      if (tokenAge < 24 * 60 * 60 * 1000) {
        return NextResponse.json(
          { valid: true, message: 'Token offline válido' },
          { status: 200 }
        );
      } else {
        return NextResponse.json(
          { error: 'Token offline expirado' },
          { status: 401 }
        );
      }
    }

    try {
      // Para tokens da API, verificar com o servidor
      // Definir o token no cliente da API
      auxiliadoraApiClient.setAuthToken(token);
      
      // Tentar fazer uma requisição simples para verificar se o token é válido
      await auxiliadoraApiClient.getCurrentUser();
      
      return NextResponse.json(
        { valid: true, message: 'Token válido' },
        { status: 200 }
      );
    } catch (apiError: any) {
      console.error('Token verification failed:', apiError);
      
      // Se a API estiver indisponível, aceitar o token temporariamente
      if (apiError.status === 503 || apiError.status === 0) {
        return NextResponse.json(
          { valid: true, message: 'Token aceito (API indisponível)' },
          { status: 200 }
        );
      }
      
      // Token inválido ou expirado
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}