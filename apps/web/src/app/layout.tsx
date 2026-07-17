import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { Providers } from '@/providers/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'TaskFlow',
  description:
    'Internal work item management and timeline tool',
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-950 antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}