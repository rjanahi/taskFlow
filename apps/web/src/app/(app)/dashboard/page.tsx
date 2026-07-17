'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const isManager =
    user.role === 'MANAGER';

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-medium text-slate-500">
          Dashboard
        </p>

        <h1 className="mt-1 text-3xl font-bold">
          Welcome, {user.name}
        </h1>

        <p className="mt-2 text-slate-600">
          {isManager
            ? 'Create, assign and monitor work across the team.'
            : 'View your assigned work and keep its progress updated.'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/work-items"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-400"
        >
          <h2 className="font-semibold">
            {isManager
              ? 'All work items'
              : 'Assigned to me'}
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            View work item details,
            priorities and deadlines.
          </p>
        </Link>

        <Link
          href="/board"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-400"
        >
          <h2 className="font-semibold">
            Phase board
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            View items grouped by their
            current workflow phase.
          </p>
        </Link>

        <Link
          href="/timeline"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-400"
        >
          <h2 className="font-semibold">
            Timeline
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Track deadlines, overdue items
            and upcoming work.
          </p>
        </Link>
      </div>

      {isManager ? (
        <div className="mt-6">
          <Link
            href="/work-items/new"
            className="inline-flex rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700"
          >
            Create work item
          </Link>
        </div>
      ) : null}
    </div>
  );
}