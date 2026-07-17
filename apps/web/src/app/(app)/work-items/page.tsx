'use client';

import { useAuth } from '@/providers/auth-provider';

export default function WorkItemsPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold">
        {user?.role === 'MANAGER'
          ? 'All work items'
          : 'Assigned to me'}
      </h1>

      <p className="mt-2 text-slate-600">
        The work item list will be built in
        the next step.
      </p>
    </div>
  );
}