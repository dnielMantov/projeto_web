import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch } from '../lib/api';

export type Role = 'cliente' | 'gerente' | 'admin';

/** Papéis que operam a loja. Espelha User::PAPEIS_GERENCIA no backend. */
export const PAPEIS_GERENCIA: Role[] = ['gerente', 'admin'];

interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

interface UsuarioApi {
  id: number;
  nome: string;
  email: string;
  papel: Role;
}

interface AuthContextValue {
  user: User | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapUsuario(u: UsuarioApi): User {
  return { id: u.id, name: u.nome, email: u.email, role: u.papel };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ usuario: UsuarioApi }>('/me')
      .then((data) => setUser(mapUsuario(data.usuario)))
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const data = await apiFetch<{ usuario: UsuarioApi }>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha: password }),
    });
    setUser(mapUsuario(data.usuario));
  }

  async function register(name: string, email: string, password: string) {
    const data = await apiFetch<{ usuario: UsuarioApi }>('/registro', {
      method: 'POST',
      body: JSON.stringify({ nome: name, email, senha: password }),
    });
    setUser(mapUsuario(data.usuario));
  }

  async function logout() {
    try {
      await apiFetch('/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, authLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
