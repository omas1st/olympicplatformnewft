import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Define verifyToken with useCallback to avoid infinite re-renders
  const verifyToken = useCallback(async () => {
    try {
      await api.get('/auth/me');
    } catch (error) {
      logout();
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setUser(JSON.parse(userData));
      // Verify token is still valid
      verifyToken();
    }
    setLoading(false);
  }, [verifyToken]); // Added verifyToken to dependency array

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    // navigate to login - using location to force refresh and clear protected routes
    window.location.href = '/login';
  };

  const updateUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Default export kept for backwards compatibility (so imports like `import AuthProvider from '...'` still work)
export default AuthProvider;
