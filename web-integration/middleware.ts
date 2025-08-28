import { NextRequest, NextResponse } from 'next/server';
import { createApiMiddleware } from './src/middleware/auth';

// Rotas que não precisam de autenticação
const publicRoutes = ['/login'];

// Rotas que precisam de autenticação
const protectedRoutes = [
  '/',
  '/users',
  '/products',
  '/sales',
  '/cash-registers',
  '/reports',
  '/sync',
  '/monitoring',
  '/settings'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Aplicar middleware de autenticação para rotas da API
  if (pathname.startsWith('/api/')) {
    const apiMiddleware = createApiMiddleware();
    const result = apiMiddleware(request);
    
    if (result) {
      return result;
    }
  }
  
  // Verificar se há token de autenticação para rotas frontend
  const authToken = request.cookies.get('auth_token')?.value || 
                   request.headers.get('authorization')?.replace('Bearer ', '');
  
  // Para arquivos estáticos, permitir passagem
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/favicon.ico') ||
      pathname.includes('.')) {
    return NextResponse.next();
  }
  
  const isPublicRoute = publicRoutes.includes(pathname);
  const isProtectedRoute = protectedRoutes.includes(pathname);
  
  // Se estiver em uma rota pública e tiver token, redirecionar para dashboard
  if (isPublicRoute && authToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Se estiver em uma rota protegida e não tiver token, redirecionar para login
  if (isProtectedRoute && !authToken) {
    // Evitar loops de redirecionamento
    if (pathname !== '/login') {
      const loginUrl = new URL('/login', request.url);
      // Adicionar a URL de retorno como parâmetro
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // Adicionar headers de segurança para todas as rotas
  const response = NextResponse.next();
  
  // Headers de segurança
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CORS para rotas da API
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    response.headers.set('Access-Control-Max-Age', '86400');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }
  }
  
  return response;
}

// Configurar quais rotas o middleware deve processar
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - _rsc (React Server Components requests)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};