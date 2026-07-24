'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiFetch } from '../lib/api';

interface User {
  email: string;
  balance: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); 

  async function checkAuth() {
    try {
      const data = await apiFetch('/auth/me');
      setUser(data);
    } catch {
      setUser(null); 
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkAuth();
  }, []);

  async function login(email: string, password: string) {
    await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    await checkAuth();
  }

  async function signup(email: string, password: string) {
    await apiFetch('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password }) });
    await checkAuth();
  }

  async function logout() {
    await apiFetch('/auth/logout', { method: 'POST' });
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}