import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Sidebar } from '@/components/sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Auxiliadora Pay - Sistema de Integração',
  description: 'Sistema web para integração e monitoramento da API Auxiliadora Pay',
  keywords: ['auxiliadora', 'pay', 'api', 'integração', 'monitoramento', 'pdv'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Providers>
          <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <div className="hidden md:flex md:w-64 md:flex-col">
              <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-card border-r">
                <Sidebar />
              </div>
            </div>
            
            {/* Main content */}
            <div className="flex flex-col flex-1 overflow-hidden">
              <main className="flex-1 relative overflow-y-auto focus:outline-none">
                {children}
              </main>
             </div>
           </div>
        </Providers>
      </body>
    </html>
  );
}