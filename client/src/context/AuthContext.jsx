import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authApi } from '../api/auth.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, try to restore session via refresh or access token.
  // Strategy:
  //  1. No token stored → skip getMe(), go straight to refresh (one round-trip).
  //  2. Token stored → try getMe() first; on 401, try refresh (may be two round-trips,
  //     but avoids a wasted refresh call when the token is still valid).
  //  Either way, resolve isLoading as fast as possible so the UI can render.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        // No stored token – attempt a cookie-based silent refresh.
        try {
          const result = await authApi.refresh();
          if (!cancelled) setUser(result.user);
        } catch {
          // No valid session at all – resolve immediately so login page shows.
          if (!cancelled) setUser(null);
        }
      } else {
        // Token exists – validate it with /auth/me (fast path, single hop).
        try {
          const result = await authApi.getMe();
          if (!cancelled) setUser(result.user);
        } catch {
          // Token expired – attempt silent refresh before giving up.
          try {
            const result = await authApi.refresh();
            if (!cancelled) setUser(result.user);
          } catch {
            localStorage.removeItem('accessToken');
            if (!cancelled) setUser(null);
          }
        }
      }

      if (!cancelled) setIsLoading(false);
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (payload) => {
    const result = await authApi.login(payload);
    setUser(result.user);
  }, []);

  const register = useCallback(async (payload) => {
    const result = await authApi.register(payload);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

