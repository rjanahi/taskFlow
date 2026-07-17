'use client';

import Link from 'next/link';
import {
  FormEvent,
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { getErrorMessage } from '@/lib/errors';
import { useAuth } from '@/providers/auth-provider';

export default function LoginPage() {
  const router = useRouter();

  const {
    user,
    isLoading,
    login,
  } = useAuth();

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [error, setError] =
    useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/dashboard');
    }
  }, [
    isLoading,
    router,
    user,
  ]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setError(null);
    setIsSubmitting(true);

    try {
      await login({
        email,
        password,
      });

      router.replace('/dashboard');
    } catch (submitError: unknown) {
      setError(
        getErrorMessage(submitError),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            TaskFlow
          </p>

          <h1 className="mt-2 text-2xl font-bold">
            Sign in
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Sign in to manage and track
            work items.
          </p>
        </div>

        {error ? (
          <div
            role="alert"
            className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value,
                )
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
              placeholder="manager@taskflow.local"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value,
                )
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? 'Signing in...'
              : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Need a Member account?{' '}
          <Link
            href="/register"
            className="font-medium text-slate-950 underline"
          >
            Register
          </Link>
        </p>

        <div className="mt-6 rounded-md bg-slate-100 p-4 text-xs text-slate-600">
          <p className="font-semibold">
            Seeded Manager
          </p>
          <p>
            manager@taskflow.local
          </p>
          <p>Manager123!</p>
        </div>
      </div>
    </main>
  );
}