import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Tipos para autenticação
export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier' | 'viewer';
  permissions: string[];
}

export interface AuthRequest extends NextRequest {
  user?: AuthUser;
}

// Configurações de autenticação
const JWT_SECRET = process.env.JWT_SECRET || 'auxiliadora-pay-secret';
const API_KEY = process.env.AUXILIADORA_API_KEY;

// Permissões por role
const ROLE_PERMISSIONS = {
  admin: ['read', 'write', 'delete', 'manage_users', 'view_reports', 'manage_settings'],
  manager: ['read', 'write', 'view_reports', 'manage_products'],
  cashier: ['read', 'write', 'process_sales'],
  viewer: ['read']
};

// Rotas que não precisam de autenticação
const PUBLIC_ROUTES = [
  '/api/health',
  '/api/auth/login',
  '/api/auth/register'
];

// Rotas que precisam apenas de API key
const API_KEY_ROUTES = [
  '/api/webhook',
  '/api/sync'
];

/**
 * Verifica se a rota é pública
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Verifica se a rota precisa apenas de API key
 */
function isApiKeyRoute(pathname: string): boolean {
  return API_KEY_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Valida API key
 */
function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
  return apiKey === API_KEY;
}

/**
 * Extrai e valida JWT token
 */
function validateJwtToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded.id || !decoded.email || !decoded.role) {
      return null;
    }

    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      permissions: ROLE_PERMISSIONS[decoded.role as keyof typeof ROLE_PERMISSIONS] || []
    };
  } catch (error) {
    console.error('JWT validation error:', error);
    return null;
  }
}

/**
 * Verifica se o usuário tem permissão para acessar a rota
 */
function hasPermission(user: AuthUser, requiredPermission: string): boolean {
  return user.permissions.includes(requiredPermission) || user.role === 'admin';
}

/**
 * Middleware de autenticação principal
 */
export function authMiddleware(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  // Permitir rotas públicas
  if (isPublicRoute(pathname)) {
    return null;
  }

  // Verificar rotas que precisam apenas de API key
  if (isApiKeyRoute(pathname)) {
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }
    return null;
  }

  // Verificar autenticação JWT para outras rotas
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const user = validateJwtToken(token);
  if (!user) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }

  // Verificar permissões específicas por rota
  if (pathname.startsWith('/api/dashboard')) {
    if (!hasPermission(user, 'read')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
  }

  if (pathname.startsWith('/api/users') && request.method !== 'GET') {
    if (!hasPermission(user, 'manage_users')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
  }

  if (pathname.startsWith('/api/products') && request.method !== 'GET') {
    if (!hasPermission(user, 'write')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
  }

  // Adicionar usuário ao request (para uso nas rotas)
  (request as any).user = user;
  
  return null;
}

/**
 * Middleware de validação de dados
 */
export function validateRequest<T>(
  request: NextRequest,
  schema: (data: any) => data is T
): { isValid: boolean; data?: T; error?: string } {
  try {
    const contentType = request.headers.get('content-type');
    
    if (!contentType?.includes('application/json')) {
      return { isValid: false, error: 'Content-Type must be application/json' };
    }

    // Note: Em um middleware real, você precisaria ler o body de forma diferente
    // Este é um exemplo de como a validação funcionaria
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid request format' };
  }
}

/**
 * Função para gerar JWT token
 */
export function generateToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Função para verificar se o usuário está autenticado (para uso em componentes)
 */
export function getAuthUser(request: NextRequest): AuthUser | null {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) return null;
  
  return validateJwtToken(token);
}

/**
 * Rate limiting simples
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  request: NextRequest,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutos
): boolean {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  
  const userLimit = rateLimitMap.get(ip);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= maxRequests) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

/**
 * Middleware combinado
 */
export function createApiMiddleware() {
  return (request: NextRequest) => {
    // Rate limiting
    if (!rateLimit(request)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Autenticação
    const authResult = authMiddleware(request);
    if (authResult) {
      return authResult;
    }

    return null;
  };
}

// Exportar tipos e constantes
export { ROLE_PERMISSIONS, PUBLIC_ROUTES, API_KEY_ROUTES };
export type { AuthRequest };