import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Get the API URL from environment variables
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Function to check if token is valid
  const checkToken = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return false;
      }
      
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      return response.data && response.data.user;
    } catch (error) {
      console.error('Token verification failed:', error);
      // Don't logout immediately, just return false
      return false;
    }
  }, [API_URL]);

  // Wrap updateUser in useCallback to stabilize it
  const updateUser = useCallback((userData) => {
    console.log('Updating user data:', userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []); // Empty dependency array because setUser is stable

  // Initialize auth state from localStorage on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        console.log('Auth initialization - Token exists:', !!token);
        console.log('Auth initialization - Stored user exists:', !!storedUser);

        if (token && storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            console.log('Parsed user data:', userData);
            
            // Check if token is still valid
            const isValidToken = await checkToken();
            
            if (isValidToken) {
              // Token is valid, set user
              setUser(userData);
              setIsAuthenticated(true);
              console.log('Auth initialized successfully from localStorage');
            } else {
              console.log('Token is invalid, clearing auth data');
              // Token is invalid, clear storage but don't redirect
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setUser(null);
              setIsAuthenticated(false);
            }
          } catch (parseError) {
            console.error('Error parsing stored user:', parseError);
            localStorage.removeItem('user');
          }
        } else {
          console.log('No stored auth data found');
          // Clear any partial data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Don't clear storage on initialization errors
      } finally {
        setLoading(false);
        console.log('Auth initialization complete, loading:', false);
      }
    };

    initializeAuth();
  }, [checkToken]);

  const login = useCallback((userData, token) => {
    console.log('Login called with user:', userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    console.log('Logout called');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    // Navigate to login
    window.location.href = '/login';
  }, []);

  // Function to refresh user data from server
  const refreshUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found for refresh');
        return null;
      }

      const response = await axios.get(`${API_URL}/api/user/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.data && response.data.user) {
        const userWithDefaults = {
          ...response.data.user,
          idCardGenerated: response.data.user.idCardGenerated || false,
          trackingNumber: response.data.user.trackingNumber || null,
          signatureAdded: response.data.user.signatureAdded || false,
          approvalStampAdded: response.data.user.approvalStampAdded || false
        };
        
        updateUser(userWithDefaults);
        return userWithDefaults;
      }
      return null;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return null;
    }
  }, [API_URL, updateUser]); // Now updateUser is stable

  const value = {
    user,
    isAuthenticated,
    login,
    logout,
    updateUser,
    checkToken,
    refreshUserData,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;