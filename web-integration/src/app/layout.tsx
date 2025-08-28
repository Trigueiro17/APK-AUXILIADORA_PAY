import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { ConditionalLayout } from '@/components/layout/ConditionalLayout';

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
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}