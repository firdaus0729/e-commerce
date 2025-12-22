import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Alert, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/lib/api';
import { User } from '@/types';

const TOKEN_KEY = 'auth_token';

// Helper functions for token storage
const getToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  }
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

const setToken = async (token: string): Promise<void> => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
};

const removeToken = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await getToken();
        if (!token) {
          setLoading(false);
          return;
        }
        const me = await api.get<User>('/auth/me', token);
        setUser({ ...me, token });
      } catch (err: any) {
        setError(err.message);
        // If token is invalid, remove it
        await removeToken();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setError(null);
    const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    // Save token to storage first, then update state
    await setToken(res.token);
    // Verify token was saved
    const savedToken = await getToken();
    if (!savedToken) {
      throw new Error('Failed to save authentication token');
    }
    const nextUser: User = { ...res.user, token: res.token };
    setUser(nextUser);
    return nextUser;
  };

  const register = async (name: string, email: string, password: string): Promise<User> => {
    setError(null);
    try {
      const res = await api.post<{ token: string; user: User }>('/auth/register', {
        name,
        email,
        password,
      });
      await setToken(res.token);
      const nextUser: User = { ...res.user, token: res.token };
      setUser(nextUser);
      return nextUser;
    } catch (err: any) {
      setError(err.message);
      Alert.alert('Register failed', err.message ?? 'Request failed');
      throw err;
    }
  };

  const logout = async () => {
    await removeToken();
    setUser(null);
  };

  const updateUser = async (token: string) => {
    try {
      const me = await api.get<User>('/auth/me', token);
      setUser({ ...me, token });
    } catch (err: any) {
      console.error('Failed to update user:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

