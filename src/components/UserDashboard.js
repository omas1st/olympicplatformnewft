import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getNextPageToContinue } from '../utils/progressTracker';
import './UserDashboard.css';

const UserDashboard = () => {
  const [showPopup, setShowPopup] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth(); // Removed unused checkToken

  // Get the API URL from environment variables
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  // For debugging - log the API URL
  useEffect(() => {
    console.log('API_URL:', API_URL);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('User from context:', user);
  }, [API_URL, user]);

  // Function to clear redirect URL from server
  const clearRedirectUrl = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      await axios.post(
        `${API_URL}/api/user/clear-redirect`,
        {},
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Redirect URL cleared from server');
    } catch (error) {
      console.error('Error clearing redirect URL:', error);
    }
  }, [API_URL]);

  // Test API connection
  const testApiConnection = useCallback(async () => {
    try {
      console.log('Testing API connection to:', `${API_URL}/health`);
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
        // Ensure the user object has all the required fields
        const userWithDefaults = {
          ...response.data.user,
          idCardGenerated: response.data.user.idCardGenerated || false,
          trackingNumber: response.data.user.trackingNumber || null,
          signatureAdded: response.data.user.signatureAdded || false,
          approvalStampAdded: response.data.user.approvalStampAdded || false
        };
        
        updateUser(userWithDefaults);
        
        // Check if there's a redirect URL set by admin
        if (response.data.user.redirectAfterUnlock) {
          console.log('Found redirect URL set by admin:', response.data.user.redirectAfterUnlock);
          // Clear the redirect URL from server after using it
          await clearRedirectUrl();
          // Redirect the user
          navigate(response.data.user.redirectAfterUnlock);
        }
        
        return userWithDefaults;
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
  }, [API_URL, updateUser, navigate, clearRedirectUrl]);

  // Helper function to get the correct API endpoint
  const getApiEndpoint = (endpoint) => {
    // Remove any trailing slash from API_URL
    let baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    
    // Check if baseUrl already contains /api
    if (baseUrl.endsWith('/api')) {
      // If it ends with /api, remove it to avoid double /api
      baseUrl = baseUrl.slice(0, -4);
    }
    
    // Construct the full URL
    return `${baseUrl}${endpoint}`;
  };

  // Handle deposit submission
  const handleDepositSubmit = async () => {
    if (!depositAmount || isNaN(depositAmount) || parseFloat(depositAmount) <= 0) {
      alert('Please enter a valid deposit amount');
      return;
    }

    if (!paymentMethod) {
      alert('Please select a payment method');
      return;
    }

    setDepositLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You are not logged in. Please login first.');
        navigate('/login');
        return;
      }

      // Use the helper function to get the correct endpoint
      const depositEndpoint = getApiEndpoint('/api/user/submit-deposit');
      
      console.log('Submitting deposit to:', depositEndpoint);
      console.log('Deposit data:', {
        amount: parseFloat(depositAmount),
        paymentMethod: paymentMethod,
        currency: 'ZAR'
      });
      console.log('Auth token present:', !!token);

      const response = await axios.post(
        depositEndpoint,
        {
          amount: parseFloat(depositAmount),
          paymentMethod: paymentMethod,
          currency: 'ZAR'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log('Deposit response:', response.data);

      if (response.data.success) {
        alert('Deposit request submitted successfully! You can now upload your payment proof.');
        setDepositAmount('');
        setPaymentMethod('');
        setShowDepositForm(false);
        
        // Redirect to upload proof page
        navigate('/upload-deposit-proof');
        
        // Refresh user data to show pending deposit
        fetchUserData();
      } else {
        alert('Deposit submission failed: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Deposit submission error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });
      
      let errorMessage = 'Failed to submit deposit request. ';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage += `Route not found (${error.config?.url}). Please check if the backend server has the deposit routes configured in user.js file.`;
        } else if (error.response.status === 401) {
          errorMessage += 'Your session has expired. Please login again.';
          logout();
        } else if (error.response.status === 500) {
          errorMessage += 'Server error. Please check the backend logs.';
        } else {
          errorMessage += error.response.data?.message || `Server error (${error.response.status})`;
        }
      } else if (error.request) {
        errorMessage += 'No response from server. Please check if the backend is running.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setDepositLoading(false);
    }
  };

  // Main data fetching effect
  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if user has a valid token first
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, redirecting to login');
          navigate('/login');
          return;
        }

        // Check API connection
        const isApiConnected = await testApiConnection();
        setApiStatus(isApiConnected ? 'connected' : 'disconnected');
        
        if (!isApiConnected && process.env.NODE_ENV === 'production') {
          setError('Server is currently unavailable. Please try again later.');
          setLoading(false);
          return;
        }

        console.log('Fetching dashboard data...');
        
        // Fetch user data - this will handle redirect if admin set one
        const userData = await fetchUserData();
        
        if (isMounted && userData && userData._id) {
          console.log('User data fetched successfully, fetching notifications');
          // Then fetch notifications
          await fetchNotifications(userData._id);
        } else if (isMounted && !userData) {
          console.log('No user data found, redirecting to login');
          navigate('/login');
          return;
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
                navigate('/login');
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
  }, [navigate, fetchUserData, fetchNotifications, logout, testApiConnection, user]); // Added 'user' back to dependencies

  const joinFacebookGroup = () => {
    window.open('https://www.facebook.com/groups/1460227851332998/?ref=share&mibextid=NSMWBT', '_blank');
  };

  // Updated handleUnlockAccess function to use the new progress tracker
  const handleUnlockAccess = () => {
    // Check if user is logged in
    if (!user) {
      navigate('/login');
      return;
    }

    // Get the next page the user should continue from
    const nextPage = getNextPageToContinue();
    console.log('Redirecting user to:', nextPage);
    navigate(nextPage);
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

  // Banking details
  const bankingDetails = {
    beneficiaryName: 'MAMA PTY',
    accountNumber: '62509963139',
    reference: '0651623286',
    bank: 'FNB',
    branchCode: '250655',
    paymentType: 'Immediate Payment'
  };

  const cryptoDetails = {
    cryptocurrency: 'Bitcoin',
    walletAddress: '3Liim5xHAkLEgUjzfw2DNFqbEkzaXgWWu8'
  };

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
        {/* Balance Section */}
        <div className="card balance-card">
          <h3>Your Balance</h3>
          <div className="balance-display">
            <div className="balance-amount">
              R {user.balance ? parseFloat(user.balance).toFixed(2) : '0.00'}
            </div>
            <div className="balance-currency">
              South African Rand (ZAR)
            </div>
          </div>
          <div className="balance-actions">
            <button 
              className="deposit-button"
              onClick={() => setShowDepositForm(true)}
            >
              Deposit Now
            </button>
          </div>
        </div>

        {/* Deposit Form Modal */}
        {showDepositForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Make a Deposit</h3>
                <button 
                  className="close-modal"
                  onClick={() => setShowDepositForm(false)}
                  disabled={depositLoading}
                >
                  &times;
                </button>
              </div>
              
              <div className="modal-body">
                <div className="form-group">
                  <label>Deposit Amount (ZAR)</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="1"
                    step="0.01"
                    disabled={depositLoading}
                  />
                </div>

                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    disabled={depositLoading}
                  >
                    <option value="">Select Payment Method</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cryptocurrency">Cryptocurrency</option>
                  </select>
                </div>

                {paymentMethod === 'bank_transfer' && (
                  <div className="payment-details">
                    <h4>Banking Details</h4>
                    <div className="banking-note">
                      <strong>Note:</strong> Transfer using Capitec Bank only is not allowed. Capitec users are not allowed to make transfers. Please use Tyme Bank, Nedbank, or any other bank transfer is allowed. Alternatively, you can use ATM deposit for the payment.
                    </div>
                    <div className="banking-info">
                      <p><strong>Beneficiary Name:</strong> {bankingDetails.beneficiaryName}</p>
                      <p><strong>Account Number:</strong> {bankingDetails.accountNumber}</p>
                      <p><strong>Recipient/Beneficiary Reference:</strong> {bankingDetails.reference}</p>
                      <p><strong>Bank:</strong> {bankingDetails.bank}</p>
                      <p><strong>Branch Code:</strong> {bankingDetails.branchCode}</p>
                      <p><strong>Payment Type:</strong> {bankingDetails.paymentType}</p>
                   </div>
                    <div className="important-note">
                      <strong>Important:</strong> Always include "{bankingDetails.reference}" as the reference number when making your payment. Your payment won't be processed if you fail to add "{bankingDetails.reference}" as the reference.
                    </div>
                                       
                  </div>
                )}

                {paymentMethod === 'cryptocurrency' && (
                  <div className="payment-details">
                    <h4>Crypto Details</h4>
                    <div className="crypto-info">
                      <p><strong>Cryptocurrency:</strong> {cryptoDetails.cryptocurrency}</p>
                      <p><strong>Wallet Address:</strong> <code>{cryptoDetails.walletAddress}</code></p>
                    </div>
                  </div>
                )}

                <div className="modal-actions">
                  <button 
                    className="submit-deposit"
                    onClick={handleDepositSubmit}
                    disabled={!depositAmount || !paymentMethod || depositLoading}
                  >
                    {depositLoading ? 'Submitting...' : 'Submit Deposit Request'}
                  </button>
                  <button 
                    className="cancel-deposit"
                    onClick={() => setShowDepositForm(false)}
                    disabled={depositLoading}
                  >
                    Cancel
                  </button>
                </div>

                {depositLoading && (
                  <div className="loading-indicator">
                    <small>Submitting deposit request... Please wait.</small>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
        You have successfully subscribed for this plan
      </p>
      {user.subscriptionDate && (
        <p className="subscription-date">
          Subscribed on: {new Date(user.subscriptionDate).toLocaleDateString()}
        </p>
      )}
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