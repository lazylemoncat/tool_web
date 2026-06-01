'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { login as apiLogin, logout as apiLogout, getMe, verifyMfa as apiVerifyMfa, ApiError } from '@/lib/api';
import type { AuthUser, LoginResponse, MfaMethod } from '@/lib/types';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<LoginResponse>;
  verifyMfa: (challengeId: string, method: MfaMethod, code: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => {
    throw new ApiError(500, 'AuthProvider 未初始化');
  },
  verifyMfa: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check auth on mount
  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        setUser(me.user ?? null);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setError(null);
    try {
      const res = await apiLogin({ username, password });
      if (res.status === 'mfa_required') {
        return res;
      }
      if (!res.user) {
        throw new ApiError(400, '登录响应缺少用户信息', res);
      }
      setUser(res.user);
      return res;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '登录失败';
      setError(msg);
      throw err;
    }
  }, []);

  const verifyMfa = useCallback(async (challengeId: string, method: MfaMethod, code: string) => {
    setError(null);
    try {
      const res = await apiVerifyMfa({ challenge_id: challengeId, method, code });
      if (!res.user) {
        throw new ApiError(400, 'MFA 验证响应缺少用户信息', res);
      }
      setUser(res.user);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'MFA 验证失败';
      setError(msg);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try { await apiLogout(); } catch { /* ignore */ }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, error, login, verifyMfa, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
