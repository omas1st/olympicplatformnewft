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

  // Function to check if token is valid WITHOUT auto-logout
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
        timeout: 5000 // Reduced timeout to fail faster
      });
      
      return response.data && response.data.user;
    } catch (error) {
      console.log('Token verification failed (non-critical):', error.message);
      // Don't logout, just return false
      // This allows the user to stay logged in even if the server is temporarily down
      return false;
    }
  }, [API_URL]);

  // Wrap updateUser in useCallback to stabilize it
  const updateUser = useCallback((userData) => {
    console.log('Updating user data:', userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

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
            
            // Set user immediately from localStorage to prevent login redirects
            setUser(userData);
            setIsAuthenticated(true);
            
            // Then try to validate the token in the background
            // Don't wait for this to complete - user can stay logged in even if server is down
            checkToken().then(isValid => {
              if (!isValid) {
                console.log('Background token check failed, but keeping user logged in');
                // We don't logout here to allow offline usage
                // The next API call will fail and handle logout if needed
              } else {
                console.log('Background token check passed');
              }
            }).catch(error => {
              console.error('Background token check error:', error);
            });
            
            console.log('Auth initialized from localStorage');
          } catch (parseError) {
            console.error('Error parsing stored user:', parseError);
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          console.log('No stored auth data found');
          // Clear any partial data
          if (token && !storedUser) localStorage.removeItem('token');
          if (!token && storedUser) localStorage.removeItem('user');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // On initialization errors, keep user logged out
        setUser(null);
        setIsAuthenticated(false);
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
        logout(); // Logout if no token
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
      
      // Only logout on 401 Unauthorized (invalid token)
      if (error.response && error.response.status === 401) {
        console.log('Token expired, logging out');
        logout();
      }
      // For other errors (network, server down), keep user logged in
      return null;
    }
  }, [API_URL, updateUser, logout]);

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