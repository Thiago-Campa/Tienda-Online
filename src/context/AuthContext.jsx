import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api('/api/auth/me');
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const requestCode = useCallback((email) => api('/api/auth/request-code', { method: 'POST', body: { email } }), []);

  const verify = useCallback(async (email, code) => {
    const data = await api('/api/auth/verify', { method: 'POST', body: { email, code } });
    setUser(data.user);
    return data.user;
  }, []);

  const updateProfile = useCallback(async (profile) => {
    const data = await api('/api/auth/me', { method: 'PATCH', body: profile });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, isAdmin: user?.role === 'admin', requestCode, verify, updateProfile, logout, refreshUser }),
    [user, loading, requestCode, verify, updateProfile, logout, refreshUser]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
