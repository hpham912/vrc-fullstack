import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiUrl } from '../utils/api.ts';
import { AdminUser } from '../types/index.ts';

interface AuthContextType {
  adminUser: AdminUser | null;
  isAdmin: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType>({
  adminUser: null,
  isAdmin: false,
  loading: true,
  login: async () => {},
  logout: () => {},
  getToken: () => null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const getToken = (): string | null => {
    return localStorage.getItem('vrc_admin_token');
  };

  const logout = () => {
    localStorage.removeItem('vrc_admin_token');
    setAdminUser(null);
  };

  const checkCurrentSession = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(apiUrl('/api/auth/me'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setAdminUser(data.user);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Session verification error:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkCurrentSession();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('vrc_admin_token', data.token);
      setAdminUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        adminUser,
        isAdmin: Boolean(adminUser),
        loading,
        login,
        logout,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
