import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiUrl } from '../utils/api.ts';
import { AdminUser } from '../types/index.ts';

// The logged-in user — an admin (role 'admin') or a registered member
// (role 'member'). Members can only view; admins see the admin view.
export interface AuthUser {
  id: number;
  username: string;
  displayName: string;
  email: string;
  role: string;
}

interface AuthContextType {
  // The logged-in user, admin or member. Null when logged out.
  currentUser: AuthUser | null;
  // The admin user, only when an admin is logged in (kept for the
  // admin screens that read it; null for members and logged-out users).
  adminUser: AdminUser | null;
  isAdmin: boolean;
  isMember: boolean;
  loading: boolean;
  // One shared login: the identifier may be an admin username, an
  // email, or a US phone number.
  login: (identifier: string, password: string) => Promise<void>;
  // Sets the session from a token + user returned by another endpoint
  // (e.g. registration verify, which logs the member in directly).
  loginWithToken: (token: string, user: AuthUser) => void;
  logout: () => void;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  adminUser: null,
  isAdmin: false,
  isMember: false,
  loading: true,
  login: async () => {},
  loginWithToken: () => {},
  logout: () => {},
  getToken: () => null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const adminUser: AdminUser | null =
    currentUser && currentUser.role === 'admin'
      ? {
          id: currentUser.id,
          username: currentUser.username,
          displayName: currentUser.displayName,
          email: currentUser.email,
          role: currentUser.role,
        }
      : null;

  const getToken = (): string | null => {
    return localStorage.getItem('vrc_admin_token');
  };

  const logout = () => {
    localStorage.removeItem('vrc_admin_token');
    setCurrentUser(null);
  };

  const loginWithToken = (token: string, user: AuthUser) => {
    localStorage.setItem('vrc_admin_token', token);
    setCurrentUser(user);
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
        setCurrentUser(data.user);
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

  const login = async (identifier: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('vrc_admin_token', data.token);
      setCurrentUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        adminUser,
        isAdmin: currentUser?.role === 'admin',
        isMember: currentUser?.role === 'member',
        loading,
        login,
        loginWithToken,
        logout,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
