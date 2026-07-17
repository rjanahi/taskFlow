'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '@/lib/auth-storage';
import {
  AuthenticatedUser,
  AuthResponse,
  LoginInput,
  RegisterInput,
} from '@/types/auth';

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isLoading: boolean;

  login(
    input: LoginInput,
  ): Promise<AuthenticatedUser>;

  register(
    input: RegisterInput,
  ): Promise<AuthenticatedUser>;

  logout(): void;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext =
  createContext<
    AuthContextValue | undefined
  >(undefined);

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const router = useRouter();

  const [user, setUser] =
    useState<AuthenticatedUser | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const clearSession =
    useCallback(() => {
      clearAccessToken();
      setUser(null);
    }, []);

  const loadCurrentUser =
    useCallback(async () => {
      const token = getAccessToken();

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser =
          await apiRequest<AuthenticatedUser>(
            '/auth/me',
          );

        setUser(currentUser);
      } catch {
        clearSession();
      } finally {
        setIsLoading(false);
      }
    }, [clearSession]);

  useEffect(() => {
  let cancelled = false;

  const initializeAuth = async () => {
    // Defer the auth state update until after the effect has completed.
    await Promise.resolve();

    if (!cancelled) {
      await loadCurrentUser();
    }
  };

  void initializeAuth();

  return () => {
    cancelled = true;
  };
}, [loadCurrentUser]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
      router.replace('/login');
    };

    window.addEventListener(
      'taskflow:unauthorized',
      handleUnauthorized,
    );

    return () => {
      window.removeEventListener(
        'taskflow:unauthorized',
        handleUnauthorized,
      );
    };
  }, [clearSession, router]);

  const login = useCallback(
    async (
      input: LoginInput,
    ): Promise<AuthenticatedUser> => {
      const response =
        await apiRequest<AuthResponse>(
          '/auth/login',
          {
            method: 'POST',
            body: JSON.stringify(input),
          },
        );

      setAccessToken(
        response.accessToken,
      );

      setUser(response.user);

      return response.user;
    },
    [],
  );

  const register = useCallback(
    async (
      input: RegisterInput,
    ): Promise<AuthenticatedUser> => {
      const response =
        await apiRequest<AuthResponse>(
          '/auth/register',
          {
            method: 'POST',
            body: JSON.stringify(input),
          },
        );

      setAccessToken(
        response.accessToken,
      );

      setUser(response.user);

      return response.user;
    },
    [],
  );

  const logout = useCallback(() => {
    clearSession();
    router.replace('/login');
  }, [clearSession, router]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      register,
      logout,
    }),
    [
      user,
      isLoading,
      login,
      register,
      logout,
    ],
  );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider',
    );
  }

  return context;
}