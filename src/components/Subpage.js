import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { updateProgressTracking } from '../utils/progressTracker';
import './Subpage.css';

const Subpage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userBalance, setUserBalance] = useState(user?.balance || 0);

  const planOptions = [
    '1 Day - (3 numbers + bonus lunchtime only) - R700',
    '1 Day - (3 numbers + bonus teatime only) - R700',
    '1 Day - (3 numbers - Powerball) - R700',
    '3 Days - (3 numbers + bonus lunchtime) - R2000',
    '3 Days - (3 numbers + bonus teatime) - R2000',
    '7 Days - (3 numbers + bonus lunchtime) - R4500',
    '7 Days - (3 numbers + bonus teatime) - R4500',
    '3 numbers (Russian Goslotto) - R700',
    '7 days lunchtime and teatime - R2000'
  ];

  const planPrices = {
    '1 Day - (3 numbers + bonus lunchtime only) - R700': 700,
    '1 Day - (3 numbers + bonus teatime only) - R700': 700,
    '1 Day - (3 numbers - Powerball) - R700': 700,
    '3 Days - (3 numbers + bonus lunchtime) - R2000': 2000,
    '3 Days - (3 numbers + bonus teatime) - R2000': 2000,
    '7 Days - (3 numbers + bonus lunchtime) - R4500': 4500,
    '7 Days - (3 numbers + bonus teatime) - R4500': 4500,
    '3 numbers (Russian Goslotto) - R700': 700,
    '7 days lunchtime and teatime - R2000': 2000
  };

  useEffect(() => {
    if (user?.balance) {
      setUserBalance(user.balance);
    }
    
    // Update progress tracking when page loads
    updateProgressTracking('subpage');
  }, [user]);

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      setError('Please select a subscription plan.');
      return;
    }

    const planPrice = planPrices[selectedPlan];
    
    if (userBalance < planPrice) {
      setError(`Insufficient balance. Please fund your wallet with R${planPrice - userBalance} to subscribe for this plan.`);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      console.log('🔄 Making request to:', `${API_URL}/api/user/subscribe-plan`);
      console.log('Request data:', {
        plan: selectedPlan,
        price: planPrice
      });

      const response = await axios.post(
        `${API_URL}/user/subscribe-plan`,
        { 
          plan: selectedPlan,
          price: planPrice
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      console.log('✅ Backend response:', response.data);

      if (response.data.success) {
        setSuccess('Subscription successful! Redirecting to card page...');
        
        // Update user data
        if (response.data.user) {
          updateUser(response.data.user);
          
          // Also update localStorage
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            const updatedUser = {
              ...parsedUser,
              balance: response.data.user.balance,
              plans: response.data.user.plans
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        }
        
        // Update progress tracking before navigating
        updateProgressTracking('subpage', true);
        
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate('/card-page');
        }, 2000);
      } else {
        setError(response.data.message || 'Subscription failed.');
      }
    } catch (error) {
      console.error('❌ Subscription error:', error);
      
      if (error.code === 'ECONNABORTED') {
        setError('Request timeout. The server is taking too long to respond.');
      } else if (error.response) {
        // Server responded with error status
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
        
        if (error.response.status === 401) {
          setError('Session expired. Please log in again.');
          setTimeout(() => navigate('/login'), 2000);
        } else if (error.response.status === 404) {
          setError(`Endpoint not found (404). Check: 
          1. Backend is running on ${process.env.REACT_APP_API_URL || 'http://localhost:5000'}
          2. Route exists in routes/user.js
          3. No CORS issues`);
        } else if (error.response.status === 400) {
          setError(error.response.data.message || 'Invalid request. Please check your data.');
        } else {
          setError(`Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
        }
      } else if (error.request) {
        // Request made but no response
        console.error('No response received:', error.request);
        setError(`No response from server. Please check:
        1. Backend is running on port 5000
        2. No CORS issues (check browser console)
        3. Network connectivity`);
      } else {
        // Other errors
        setError(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="subpage-container">
        <h1>Subscription Plans</h1>
        
        <div className="subscription-card">
          <h2>Select Your Subscription Plan</h2>
          
          <div className="form-group">
            <label>Subscription Plan</label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="plan-select"
              disabled={loading}
            >
              <option value="">-- Select a Plan --</option>
              {planOptions.map((plan, index) => (
                <option key={index} value={plan}>{plan}</option>
              ))}
            </select>
          </div>

          <div className="balance-info">
            <p>Your Current Balance: <strong>R {userBalance.toFixed(2)}</strong></p>
            {selectedPlan && (
              <p>Selected Plan Cost: <strong>R {planPrices[selectedPlan]}</strong></p>
            )}
          </div>

          <div className="instructions">
            <h3>Instructions:</h3>
            <ol>
              <li>Select your desired subscription plan from the dropdown above</li>
              <li>Ensure your wallet has sufficient balance for the selected plan</li>
              <li>If balance is insufficient, please fund your wallet first</li>
              <li>Click "Subscribe Now" to proceed</li>
            </ol>
          </div>

          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              <strong>Success:</strong> {success}
            </div>
          )}

          <button
            className="cta-button subscribe-button"
            onClick={handleSubscribe}
            disabled={loading || !selectedPlan}
            style={{
              backgroundColor: loading ? '#95a5a6' : '#3498db',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Processing...' : 'Subscribe Now'}
          </button>

          
        </div>
      </div>
    </div>
  );
};

export default Subpage;