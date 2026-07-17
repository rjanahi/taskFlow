'use client';

import {
  ReactNode,
  useEffect,
} from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({
  children,
}: AuthGuardProps) {
  const router = useRouter();

  const {
    user,
    isLoading,
  } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [
    isLoading,
    router,
    user,
  ]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />

          <p className="mt-4 text-sm text-slate-600">
            Loading TaskFlow...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return children;
}