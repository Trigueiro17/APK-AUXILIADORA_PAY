import { NextRequest, NextResponse } from 'next/server';
import { auxiliadoraApiClient } from '@/lib/api-client';
import { LoginRequest, LoginResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // Validar dados de entrada
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    try {
      // Tentar autenticar com a API externa
      const loginResponse = await auxiliadoraApiClient.login(email, password);
      
      if (!loginResponse.user) {
        return NextResponse.json(
          { error: 'Credenciais inválidas' },
          { status: 401 }
        );
      }

      // Preparar resposta de sucesso
      const response: LoginResponse = {
        user: {
          id: loginResponse.user.id,
          email: loginResponse.user.email,
          name: loginResponse.user.name,
          role: loginResponse.user.role,
        },
        token: loginResponse.token || '',
        refreshToken: loginResponse.refreshToken || '',
      };

      return NextResponse.json(response, { status: 200 });
    } catch (apiError: any) {
      console.error('API login error:', apiError);
      
      // Se a API estiver indisponível, tentar modo offline
      if (apiError.status === 503 || apiError.status === 0 || apiError.status === 404 || apiError.status >= 500) {
        console.log('API indisponível, tentando modo offline');
        
        // Modo offline simplificado - credenciais de demonstração
        if (email === 'admin@auxiliadorapay.com' && password === 'admin123') {
          const response: LoginResponse = {
            user: {
              id: 'offline-admin',
              email: 'admin@auxiliadorapay.com',
              name: 'Administrador Offline',
              role: 'ADMIN',
            },
            token: `offline-token-${Date.now()}`,
            refreshToken: `offline-refresh-${Date.now()}`,
          };
          
          console.log('Login offline bem-sucedido para admin');
          return NextResponse.json(response, { status: 200 });
        }
        
        // Tentar buscar usuários se possível
        try {
          const users = await auxiliadoraApiClient.getUsers();
          const user = users.find(u => u.email === email && u.active);
          
          if (user) {
            // Em modo offline, aceitar qualquer senha para usuários existentes
            // NOTA: Em produção, seria necessário implementar validação de senha adequada
            const response: LoginResponse = {
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
              },
              token: `offline-token-${Date.now()}`,
              refreshToken: '',
            };
            
            return NextResponse.json(response, { status: 200 });
          }
        } catch (offlineError) {
          console.error('Busca de usuários offline falhou:', offlineError);
        }
      }
      
      // Retornar erro de credenciais inválidas
      return NextResponse.json(
        { error: 'Credenciais inválidas ou serviço indisponível' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}