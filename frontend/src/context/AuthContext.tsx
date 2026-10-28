import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getStoredToken, setStoredToken } from '../api/client';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    api
      .getMe()
      .then((res) => {
        if (res.success && res.user) {
          setUser(res.user);
        } else {
          setStoredToken(null);
        }
      })
      .catch(() => {
        setStoredToken(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    if (res.success && res.token) {
      setStoredToken(res.token);
      setUser(res.user);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // Ignore
    } finally {
      setStoredToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
