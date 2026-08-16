import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('checking'); // checking | authenticated | unauthenticated

  const bootstrap = useCallback(async () => {
    if (!getToken()) {
      setStatus('unauthenticated');
      return;
    }
    try {
      const u = await api.validateSession();
      setUser(u);
      setStatus('authenticated');
    } catch {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (email, password, remember) => {
    const u = await api.login({ email, password, remember });
    setUser(u);
    setStatus('authenticated');
    return u;
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    setStatus('unauthenticated');
    // Cegah user kembali ke dashboard hanya dengan tombol Back browser
    window.history.pushState(null, '', '/login');
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, login, logout, refreshSession: bootstrap }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
