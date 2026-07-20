import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { authService } from '../services';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDentist: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = authService.getToken();
      if (token) {
        const userData = await authService.getMe();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      authService.logout();
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = authService.getToken();
        if (token) {
          const storedUser = authService.getUser();
          if (storedUser) {
            setUser(storedUser);
          }
          // Verify token is still valid
          await refreshUser();
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    setUser(response.user);
  };

  const logout = () => {
    setUser(null);
    authService.logout();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isDentist: user?.role === 'DENTIST',
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

