'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/sidebar';


interface ConditionalLayoutProps {
  children: React.ReactNode;
}

// Rotas que não precisam de autenticação
const publicRoutes = ['/login'];

// Rotas que não devem mostrar a sidebar mesmo quando autenticado
const noSidebarRoutes = ['/login'];

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  
  const isPublicRoute = publicRoutes.includes(pathname);
  const shouldShowSidebar = isAuthenticated && !noSidebarRoutes.includes(pathname);

  // Para rotas públicas, renderizar diretamente
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Para rotas protegidas, renderizar com layout apropriado
  // O middleware já cuida da autenticação
  return (
    <>
      {shouldShowSidebar ? (
        <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          {/* Sidebar */}
          <div className="hidden md:flex md:w-72 md:flex-col">
            <div className="flex flex-col flex-grow pt-6 overflow-y-auto bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-r border-slate-200/60 dark:border-slate-700/60 shadow-xl backdrop-blur-sm">
              <Sidebar />
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <main className="flex-1 relative overflow-y-auto focus:outline-none p-6 bg-gradient-to-br from-slate-50/50 via-white/80 to-slate-100/50 dark:from-slate-900/50 dark:via-slate-800/80 dark:to-slate-900/50">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      ) : (
        // Layout sem sidebar para páginas especiais
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          {children}
        </main>
      )}
    </>
  );
}