'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser } from '@/types';
import { auxiliadoraApiClient } from '@/lib/api-client';

interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Verificar autenticação ao carregar
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user');

      if (!token || !userData) {
        setUser(null);
        return false;
      }

      // Verificar se o token ainda é válido fazendo uma requisição à API
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const parsedUser = JSON.parse(userData) as AuthUser;
        setUser(parsedUser);
        // Definir token no api-client
        auxiliadoraApiClient.setAuthToken(token);
        return true;
      } else {
        // Token inválido, limpar dados
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        auxiliadoraApiClient.setAuthToken(null);
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      // Em caso de erro, assumir que não está autenticado
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setUser(null);
      return false;
    }
  }, []);

  // Login
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao fazer login');
      }

      const loginResponse = await response.json();
      
      // Armazenar dados de autenticação
      if (loginResponse.token) {
        localStorage.setItem('auth_token', loginResponse.token);
        localStorage.setItem('user', JSON.stringify(loginResponse.user));
        
        // Também definir cookie para o middleware
        document.cookie = `auth_token=${loginResponse.token}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 dias
        
        // Definir token no api-client para requisições subsequentes
        auxiliadoraApiClient.setAuthToken(loginResponse.token);
      }

      setUser(loginResponse.user);
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async (): Promise<void> => {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        // Fazer logout na API
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Erro ao fazer logout na API:', error);
      // Continuar com logout local mesmo se a API falhar
    } finally {
      // Limpar dados locais
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      
      // Limpar cookie
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // Limpar token do api-client
      auxiliadoraApiClient.setAuthToken(null);
      
      setUser(null);
      
      // Redirecionar para login
      router.push('/login');
    }
  }, [router]);

  // Verificar autenticação ao montar o componente
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await checkAuth();
      setIsLoading(false);
    };

    initAuth();
  }, [checkAuth]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
  };
}