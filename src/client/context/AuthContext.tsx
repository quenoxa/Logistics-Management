import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../api/client';
import { Permission, hasPermission as checkPermission, hasRole as checkRole } from '../config/permissions';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  demoLogin: (role: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isDispatcher: boolean;
  isDriver: boolean;
  isViewer: boolean;
  can: (permission: Permission) => boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('nexus_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('nexus_token');
      if (savedToken) {
        try {
          const userProfile = await authApi.getMe();
          setUser(userProfile);
        } catch (err) {
          console.error('Session expired or invalid token');
          localStorage.removeItem('nexus_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const data = await authApi.login(email, pass);
      localStorage.setItem('nexus_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (role: string) => {
    setIsLoading(true);
    try {
      const data = await authApi.demoLogin(role);
      localStorage.setItem('nexus_token', data.token);
      setToken(data.token);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('nexus_token');
    setToken(null);
    setUser(null);
  };

  const role = user?.role;
  const isAdmin = role === 'ADMIN';
  const isDispatcher = role === 'DISPATCHER' || role === 'ADMIN';
  const isDriver = role === 'DRIVER';
  const isViewer = role === 'VIEWER';

  const can = (permission: Permission) => checkPermission(role, permission);
  const hasRoleHelper = (roles: UserRole[]) => checkRole(role, roles);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        demoLogin,
        logout,
        isAdmin,
        isDispatcher,
        isDriver,
        isViewer,
        can,
        hasRole: hasRoleHelper,
      }}
    >
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
