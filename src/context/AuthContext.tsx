import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (data: {
    name: string;
    username: string;
    password: string;
    confirmPassword?: string;
    jobTitle?: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  switchQuickRole: (role: UserRole) => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface DemoCredential {
  username: string;
  email: string;
  pass: string;
  label: string;
  roleName: string;
}

export const DEMO_CREDENTIALS: Record<UserRole, DemoCredential> = {
  admin: {
    username: 'Cristiano',
    email: 'cristiano@crservicosgerais.com.br',
    pass: 'Cristiano2026',
    label: 'Cristiano (Administrador)',
    roleName: 'Administrador Geral',
  },
  manager: {
    username: 'gerencia',
    email: 'gerencia@crservicosgerais.com.br',
    pass: '123456',
    label: 'Roberta Silveira',
    roleName: 'Gerente Operacional',
  },
  employee: {
    username: 'func01',
    email: 'func01@crservicosgerais.com.br',
    pass: '123456',
    label: 'Técnico Operacional 01',
    roleName: 'Funcionário',
  },
  technician: {
    username: 'marcos',
    email: 'marcos@crservicosgerais.com.br',
    pass: '123456',
    label: 'Marcos Vinicius',
    roleName: 'Técnico Operacional',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStoredUser() {
      const token = localStorage.getItem('cr_auth_token');
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch {
          localStorage.removeItem('cr_auth_token');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }
    loadStoredUser();
  }, []);

  const login = async (emailOrUsername: string, password?: string) => {
    const res = await api.login(emailOrUsername, password || 'admin');
    localStorage.setItem('cr_auth_token', res.token);
    setUser(res.user);
  };

  const register = async (data: {
    name: string;
    username: string;
    password: string;
    confirmPassword?: string;
    jobTitle?: string;
    phone?: string;
  }) => {
    const res = await api.register(data);
    localStorage.setItem('cr_auth_token', res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('cr_auth_token');
    setUser(null);
  };

  const switchQuickRole = async (role: UserRole) => {
    const cred = DEMO_CREDENTIALS[role];
    try {
      await login(cred.username, cred.pass);
    } catch {
      try {
        await login(cred.email, cred.pass);
      } catch {
        await login(role, cred?.pass || '123456');
      }
    }
  };

  const hasRole = (roles: UserRole[]) => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admin has full access
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, switchQuickRole, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
