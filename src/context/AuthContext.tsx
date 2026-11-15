import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, getStoredToken, setStoredToken } from '../api';
import { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: { name: string; email: string; phone: string; password: string }) => Promise<User>;
  updateProfile: (payload: { name: string; email: string; phone: string; newPassword?: string }) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((res) => setUser(res.user))
      .catch(() => {
        setStoredToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setStoredToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (payload: { name: string; email: string; phone: string; password: string }) => {
    const res = await api.register(payload);
    setStoredToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const updateProfile = async (payload: { name: string; email: string; phone: string; newPassword?: string }) => {
    const res = await api.updateProfile(payload);
    setStoredToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    setStoredToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
