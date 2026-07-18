import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load: Check localStorage
    const savedToken = localStorage.getItem('rental_token');
    const savedUser = localStorage.getItem('rental_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { data } = response.data;
      
      setUser(data.user);
      setToken(data.token);
      
      localStorage.setItem('rental_token', data.token);
      localStorage.setItem('rental_user', JSON.stringify(data.user));
      
      return data.user;
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed';
      throw new Error(msg);
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { data } = response.data;
      
      setUser(data.user);
      setToken(data.token);
      
      localStorage.setItem('rental_token', data.token);
      localStorage.setItem('rental_user', JSON.stringify(data.user));
      
      return data.user;
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed';
      throw new Error(msg);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('rental_token');
    localStorage.removeItem('rental_user');
  };

  const forgotPassword = async (email) => {
    try {
      await api.post('/auth/forgot-password', { email });
    } catch (error) {
      const msg = error.response?.data?.message || 'Forgot password request failed';
      throw new Error(msg);
    }
  };

  return (
    // setUser is exposed so the Profile page can refresh the cached user after a save
    <AuthContext.Provider value={{ user, setUser, token, loading, login, register, logout, forgotPassword }}>
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
