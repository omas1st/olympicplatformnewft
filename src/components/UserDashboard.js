import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './UserDashboard.css';

const UserDashboard = () => {
  const [showPopup, setShowPopup] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();

  // Get the API URL from environment variables
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  // For debugging - log the API URL
  useEffect(() => {
    console.log('API_URL:', API_URL);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('User from context:', user);
  }, [API_URL, user]);

  // Test API connection
  const testApiConnection = useCallback(async () => {
    try {
      console.log('Testing API connection to:', API_URL);
      const healthResponse = await axios.get(`${API_URL}/health`, { timeout: 5000 });
      console.log('API health check response:', healthResponse.data);
      return true;
    } catch (error) {
      console.log('API health check failed:', error.message);
      
      // Try common health check endpoints
      const endpoints = [
        `${API_URL}/api/health`,
        `${API_URL}/health-check`,
        `${API_URL}/`,
        `${API_URL}/api`
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log('Trying endpoint:', endpoint);
          await axios.get(endpoint, { timeout: 3000 });
          console.log('Success with endpoint:', endpoint);
          return true;
        } catch (err) {
          console.log('Failed with endpoint:', endpoint);
        }
      }
      
      return false;
    }
  }, [API_URL]);

  // Memoize fetchNotifications function
  const fetchNotifications = useCallback(async (userId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found for notifications');
        return;
      }

      console.log('Fetching notifications from:', `${API_URL}/api/user/notifications/${userId}`);
      
      const response = await axios.get(
        `${API_URL}/api/user/notifications/${userId}`, 
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      console.log('Notifications response:', response.data);
      
      if (response.data) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Use mock notifications for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock notifications for development');
        setNotifications([
          {
            _id: 'mock1',
            message: 'Welcome to the platform! Click "Unlock Access" to get started.',
            createdAt: new Date()
          },
          {
            _id: 'mock2',
            message: 'Special offer: Get 20% off on VIP membership this week!',
            createdAt: new Date(Date.now() - 86400000) // 1 day ago
          }
        ]);
      }
    }
  }, [API_URL]);

  // Memoize fetchUserData function
  const fetchUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No authentication token found');
        logout();
        throw new Error('No authentication token found');
      }

      console.log('Fetching user data from:', `${API_URL}/api/user/dashboard`);
      
      const response = await axios.get(`${API_URL}/api/user/dashboard`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('User data response:', response.data);
      
      if (response.data && response.data.user) {
        updateUser(response.data.user);
        return response.data.user;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // If we have user data in localStorage, use it
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        console.log('Using stored user data from localStorage');
        const userData = JSON.parse(storedUser);
        return userData;
      }
      
      throw error;
    }
  }, [API_URL, updateUser, logout]);

  // Main data fetching effect
  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check API connection first
        const isApiConnected = await testApiConnection();
        setApiStatus(isApiConnected ? 'connected' : 'disconnected');
        
        if (!isApiConnected && process.env.NODE_ENV === 'production') {
          setError('Server is currently unavailable. Please try again later.');
          setLoading(false);
          return;
        }

        // Check if user exists in context
        if (!user) {
          console.log('No user in context, redirecting to login');
          navigate('/login');
          return;
        }

        console.log('Fetching dashboard data for user:', user._id);
        
        // Fetch user data first
        const userData = await fetchUserData();
        
        if (isMounted && userData && userData._id) {
          console.log('User data fetched successfully, fetching notifications');
          // Then fetch notifications
          await fetchNotifications(userData._id);
        } else if (isMounted && user && user._id) {
          console.log('Using existing user data, fetching notifications');
          // Fallback to current user ID
          await fetchNotifications(user._id);
        }

        console.log('Dashboard data fetch completed successfully');
        
      } catch (error) {
        if (isMounted) {
          console.error('Dashboard data fetch error:', error);
          
          // More specific error messages
          if (error.code === 'ECONNABORTED') {
            setError('Request timeout. The server is taking too long to respond.');
          } else if (error.code === 'ERR_NETWORK') {
            setError('Network error. Please check your internet connection.');
          } else if (error.response) {
            switch (error.response.status) {
              case 401:
                setError('Session expired. Please login again.');
                logout();
                break;
              case 404:
                setError('Service endpoint not found. Please contact support.');
                break;
              case 500:
                setError('Server error. Please try again later.');
                break;
              default:
                setError('Failed to load data. Please try again.');
            }
          } else if (error.request) {
            setError('No response from server. The backend might be down.');
          } else {
            setError('An unexpected error occurred: ' + error.message);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [navigate, user, fetchUserData, fetchNotifications, logout, testApiConnection]);

  const joinFacebookGroup = () => {
    window.open('https://www.facebook.com/groups/1460227851332998/?ref=share&mibextid=NSMWBT', '_blank');
  };

  const handleUnlockAccess = () => {
    navigate('/unlock-access');
  };

  const handleSendWhatsAppMessage = () => {
    window.open('https://wa.me/447398871333', '_blank');
  };

  const handleRefresh = async () => {
    console.log('Manual refresh triggered');
    setLoading(true);
    setError(null);
    
    try {
      // Test API connection first
      const isApiConnected = await testApiConnection();
      setApiStatus(isApiConnected ? 'connected' : 'disconnected');
      
      if (!isApiConnected && process.env.NODE_ENV === 'production') {
        throw new Error('Server is currently unavailable');
      }

      // Fetch fresh user data
      const userData = await fetchUserData();
      
      if (userData && userData._id) {
        // Fetch fresh notifications
        await fetchNotifications(userData._id);
      }
      
      console.log('Refresh completed successfully');
    } catch (error) {
      console.error('Refresh error:', error);
      setError('Failed to refresh data. The backend server might be down.');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSupport = () => {
    window.location.href = 'mailto:olympicwinningplatform@gmail.com?subject=Dashboard%20Access%20Issue&body=Hello,%20I%20am%20having%20trouble%20accessing%20my%20dashboard.';
  };

  // Loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading your dashboard...</div>
        <div className="api-status">API Status: {apiStatus}</div>
      </div>
    );
  }

  // Error state (with retry option)
  if (error && !user) {
    return (
      <div className="error-container">
        <h2>Unable to Load Dashboard</h2>
        <p className="error-message">{error}</p>
        <p className="debug-info">
          API URL: {API_URL} | Status: {apiStatus}
        </p>
        <div className="error-actions">
          <button onClick={handleRefresh} className="retry-button">
            Try Again
          </button>
          <button onClick={() => navigate('/login')} className="login-button">
            Go to Login
          </button>
          <button onClick={handleContactSupport} className="support-button">
            Contact Support
          </button>
        </div>
      </div>
    );
  }

  // If no user but no error (shouldn't happen, but just in case)
  if (!user) {
    return (
      <div className="loading-container">
        <div className="loading">Session expired. Redirecting to login...</div>
        <button onClick={() => navigate('/login')} className="login-button">
          Go to Login Now
        </button>
      </div>
    );
  }

  const hasPlan = user.plans && user.plans.length > 0;

  // Create display notifications
  const displayNotifications = notifications.length > 0 
    ? notifications 
    : [{
        _id: 'default-notification',
        message: 'Welcome! Click "Unlock Access" to get started with winning numbers.',
        createdAt: new Date()
      }];

  return (
    <div className="container">
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-bar">
          <small>
            Debug: API: {API_URL} | Status: {apiStatus} | User ID: {user._id || 'N/A'}
          </small>
        </div>
      )}

      {/* Popup for Facebook Group */}
      {showPopup && (
        <div className="popup">
          <h3>Join Our Facebook Group</h3>
          <p>Stay updated with the latest news and winning numbers by joining our Facebook group.</p>
          <button className="action-button" onClick={joinFacebookGroup}>
            Join Facebook Group
          </button>
          <button 
            className="action-button close-button"
            onClick={() => setShowPopup(false)}
          >
            Close
          </button>
        </div>
      )}

      {/* Error message (if any) */}
      {error && user && (
        <div className="error-banner">
          <p>{error}</p>
          <div className="error-banner-actions">
            <button onClick={handleRefresh} className="retry-button">
              Retry
            </button>
            <button onClick={handleContactSupport} className="support-button">
              Contact Support
            </button>
          </div>
        </div>
      )}

      <h1 className="welcome-message">Welcome, {user.name || 'User'}!</h1>
      
      {/* API status indicator */}
      {apiStatus === 'disconnected' && (
        <div className="warning-banner">
          ⚠️ Running in offline mode. Some features may be limited.
        </div>
      )}

      <div className="dashboard-grid">
        {/* Unlock Access Button */}
        <div className="card unlock-access-card">
          <h3>Unlock Access</h3>
          <p className="unlock-description">
            Click below to unlock access to winning numbers and VIP content
          </p>
          <button 
            className="unlock-access-button"
            onClick={handleUnlockAccess}
          >
            Unlock Access to Winning Numbers
          </button>
        </div>

        {/* Plans */}
        <div className="card plan-card">
          <h3>Your Plan</h3>
          {hasPlan ? (
            <div className="plan-display">
              <div className="current-plan">
                <strong>{user.plans[0]}</strong>
              </div>
              <p className="plan-info">
                This plan gives you access to the selected lottery results
              </p>
            </div>
          ) : (
            <div className="no-plan">
              <p className="no-plan-message">
                You don't have any plan yet. Click the <strong>Unlock Access to Winning Numbers</strong> button to subscribe for a plan.
              </p>
            </div>
          )}
        </div>

        {/* Contact Admin via WhatsApp */}
        <div className="card">
          <h3>Contact Admin</h3>
          <p className="whatsapp-description">
            Need help or have questions? Message the admin directly on WhatsApp
          </p>
          <button 
            className="whatsapp-button"
            onClick={handleSendWhatsAppMessage}
          >
            <span className="whatsapp-icon">📱</span>
            Send Message via WhatsApp
          </button>
        </div>

        {/* Notifications */}
        <div className="card notifications-card">
          <div className="notifications-header">
            <h3>Notifications</h3>
            <button 
              className="refresh-button"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <div className="notifications-list">
            {displayNotifications.map((notification) => (
              <div key={notification._id} className="notification-item">
                <div className="notification-content">
                  <p className="notification-message">{notification.message}</p>
                  <span className="notification-time">
                    {new Date(notification.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;