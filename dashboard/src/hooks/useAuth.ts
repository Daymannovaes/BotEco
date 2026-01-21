import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

interface User {
  id: string;
  email: string;
  status: string;
  phone_number: string | null;
  daily_chars_used: number;
  daily_chars_limit: number;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const isAuthenticated = !!user;

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    const { data, error } = await api.auth.me();
    if (data?.user) {
      setUser(data.user);
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    setError(null);
    const { data, error } = await api.auth.login(email, password);

    if (error) {
      setError(error);
      return false;
    }

    if (data) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setUser(data.user);
      navigate('/dashboard');
      return true;
    }

    return false;
  };

  const register = async (email: string, password: string) => {
    setError(null);
    const { data, error } = await api.auth.register(email, password);

    if (error) {
      setError(error);
      return false;
    }

    if (data) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setUser(data.user);
      navigate('/connect');
      return true;
    }

    return false;
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    navigate('/login');
  };

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
  };
}
