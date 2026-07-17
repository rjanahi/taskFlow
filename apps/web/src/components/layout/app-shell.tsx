'use client';

import Link from 'next/link';
import {
  usePathname,
} from 'next/navigation';
import { ReactNode } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { Role } from '@/types/auth';

interface AppShellProps {
  children: ReactNode;
}

interface NavigationItem {
  label: string;
  href: string;
  roles?: Role[];
}

const navigationItems:
  NavigationItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
    },
    {
      label: 'Work items',
      href: '/work-items',
    },
    {
      label: 'Phase board',
      href: '/board',
    },
    {
      label: 'Timeline',
      href: '/timeline',
    },
    {
      label: 'Create item',
      href: '/work-items/new',
      roles: ['MANAGER'],
    },
  ];

export function AppShell({
  children,
}: AppShellProps) {
  const pathname = usePathname();

  const {
    user,
    logout,
  } = useAuth();

  if (!user) {
    return null;
  }

  const visibleNavigationItems =
    navigationItems.filter(
      (item) =>
        !item.roles ||
        item.roles.includes(user.role),
    );

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="text-xl font-bold tracking-tight"
          >
            TaskFlow
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">
                {user.name}
              </p>

              <p className="text-xs text-slate-500">
                {user.role === 'MANAGER'
                  ? 'Manager'
                  : 'Member'}
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-[220px_1fr]">
        <aside className="border-b border-slate-200 bg-white p-4 md:min-h-[calc(100vh-73px)] md:border-b-0 md:border-r">
          <nav className="space-y-1">
            {visibleNavigationItems.map(
              (item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(
                    `${item.href}/`,
                  );

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={
                      isActive
                        ? 'page'
                        : undefined
                    }
                    className={[
                      'block rounded-md px-3 py-2 text-sm font-medium',
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-100',
                    ].join(' ')}
                  >
                    {item.label}
                  </Link>
                );
              },
            )}
          </nav>
        </aside>

        <main className="min-w-0 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}