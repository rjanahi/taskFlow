'use client';

import {
  useEffect,
} from 'react';
import {
  useRouter,
} from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';

export default function NewWorkItemPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (
      user &&
      user.role !== 'MANAGER'
    ) {
      router.replace('/dashboard');
    }
  }, [
    router,
    user,
  ]);

  if (
    !user ||
    user.role !== 'MANAGER'
  ) {
    return null;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">
        Create work item
      </h1>

      <p className="mt-2 text-slate-600">
        The work item creation form will be
        built in the next step.
      </p>
    </div>
  );
}