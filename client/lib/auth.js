'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read token from localStorage on mount
    try {
      const storedToken = localStorage.getItem('zoning_auth_token');
      if (storedToken) {
        setToken(storedToken);
        authApi.getMe(storedToken)
          .then((userData) => setUser(userData))
          .catch(() => {
            // Token expired or invalid
            localStorage.removeItem('zoning_auth_token');
            setToken(null);
            setUser(null);
          })
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('zoning_auth_token', res.token);
    return res;
  };

  const register = async (name, email, password) => {
    const res = await authApi.register(name, email, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('zoning_auth_token', res.token);
    return res;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('zoning_auth_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

