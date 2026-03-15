'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface AuthState {
  token: string;
  did: string;
  expiresAt: string;
}

interface AuthContextValue {
  auth: AuthState | null;
  setAuth: (state: AuthState) => void;
  clearAuth: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuthState] = useState<AuthState | null>(null);

  const setAuth = useCallback((state: AuthState) => {
    setAuthState(state);
  }, []);

  const clearAuth = useCallback(() => {
    setAuthState(null);
  }, []);

  const isAuthenticated =
    auth !== null && Date.now() < Date.parse(auth.expiresAt);

  return (
    <AuthContext.Provider
      value={{ auth, setAuth, clearAuth, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
