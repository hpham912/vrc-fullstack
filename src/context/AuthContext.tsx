import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';

export interface DbUser {
  uid: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  dbUser: DbUser | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  dbUser: null,
  isAdmin: false,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  getToken: async () => null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const getToken = async (): Promise<string | null> => {
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken();
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          const res = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            setDbUser(data.user);
          }
        } catch (err) {
          console.error('Error syncing user profile:', err);
        }
      } else {
        setDbUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: any) {
      console.error('Error signing in with Google:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setDbUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  // If logged in via Google sign-in in this church admin demo, they have admin privileges
  const isAdmin = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        dbUser,
        isAdmin,
        loading,
        signInWithGoogle,
        signOut,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
