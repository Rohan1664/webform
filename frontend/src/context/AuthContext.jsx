import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authAPI } from '../api/auth.api';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Define logout with useCallback
  const logout = useCallback(async () => {
    try {
      if (token) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      setUser(null);
      setToken(null);
      toast.success('Logged out successfully');
    }
  }, [token]);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } catch (error) {
          console.error('Error parsing user data:', error);
          await logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [logout]);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await authAPI.login({ email, password });
      const { user, token, refreshToken } = response.data;
      
      // Store tokens and user data
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      setToken(token);
      toast.success(`Welcome back, ${user.firstName}!`);
      return { success: true, user };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authAPI.register(userData);
      const { user, token, refreshToken } = response.data;
      
      // Store tokens and user data
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      setToken(token);
      toast.success(`Welcome, ${user.firstName}!`);
      return { success: true, user };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // OAuth Login function
  const oauthLogin = (userData, token, refreshToken) => {
    setUser(userData);
    setToken(token);
    // Already stored in localStorage in the callback component
  };

  // Update user data
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Check if user is admin
  const isAdmin = useCallback(() => {
    return user?.role === 'admin';
  }, [user]);

  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    return !!user && !!token;
  }, [user, token]);

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    oauthLogin,
    updateUser,
    isAdmin,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};