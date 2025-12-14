// src/components/VIPMembership.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { updateProgressTracking } from '../utils/progressTracker';

const VIPMembership = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // Get user info from localStorage on component mount
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUserInfo(userData);
      } catch (e) {
        console.error('Error parsing user data:', e);
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setError('Session expired. Please log in again.');
        setTimeout(() => navigate('/login'), 2000);
      }
    } else {
      setError('Please log in to access this page.');
      setTimeout(() => navigate('/login'), 2000);
    }
    
    // Update progress tracking when page loads
    updateProgressTracking('vip-membership');
  }, [navigate]);

  const redirectToSubpage = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('You are not logged in. Please log in first.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // Get user ID
      let userId = null;
      if (userInfo) {
        userId = userInfo.id || userInfo._id;
      }
      
      if (!userId) {
        // Try to get from localStorage directly
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            userId = parsedUser.id || parsedUser._id;
          } catch (e) {
            console.error('Error parsing user:', e);
          }
        }
      }

      if (!userId) {
        setError('Unable to get user information. Please log in again.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      try {
        const response = await axios.post(
          `${API_URL}/api/user/vip-redirect`,
          { userId: userId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.success) {
          // Update progress tracking before navigating
          updateProgressTracking('vip-membership', true);
          navigate('/subpage');
        } else {
          // Even if API returns failure, still go to subpage
          updateProgressTracking('vip-membership', true);
          navigate('/subpage');
        }
      } catch (apiError) {
        console.error('API call failed:', apiError);
        // If API fails, still redirect to subpage
        updateProgressTracking('vip-membership', true);
        navigate('/subpage');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      // Even on unexpected error, still try to redirect
      updateProgressTracking('vip-membership', true);
      navigate('/subpage');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (!userInfo && !error) {
    return (
      <div className="container">
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2>Loading...</h2>
            <p>Please wait while we verify your session.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '20px' }}>VIP Membership</h1>
        
        <div style={{ 
          maxWidth: '600px', 
          margin: '0 auto', 
          backgroundColor: 'white', 
          padding: '40px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>
            Complete Your Registration
          </h2>
          
          <p style={{ marginBottom: '30px', fontSize: '1.1rem', lineHeight: '1.6' }}>
            Thank you for your payment! To complete your VIP membership registration 
            and start receiving winning numbers, please click the Proceed to subscribe button below.
          </p>

          {error && (
            <div style={{ 
              color: '#e74c3c', 
              backgroundColor: '#fde8e8', 
              padding: '15px', 
              borderRadius: '5px',
              marginBottom: '20px',
              textAlign: 'left'
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {!error && userInfo && (
            <div style={{ 
              color: '#27ae60', 
              backgroundColor: '#d4edda', 
              padding: '10px', 
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              {/* Check if this is the test user */}
              {userInfo.name === 'success' && userInfo.email === 'success@gmail.com' ? (
                <span>Welcome! Ready to proceed with your subscription.</span>
              ) : (
                <span>Welcome, {userInfo.name || userInfo.email || 'User'}! Ready to proceed.</span>
              )}
            </div>
          )}

          <button 
            className="cta-button"
            onClick={redirectToSubpage}
            style={{ 
              fontSize: '1.2rem', 
              padding: '15px 30px',
              backgroundColor: loading ? '#95a5a6' : '#3498db',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            disabled={loading || !!error}
          >
            {loading ? 'Processing...' : 'Proceed to subscribe'}
          </button>

          <div style={{ marginTop: '20px', color: '#7f8c8d' }}>
            <p>If you encounter any issues, please contact our support team on WhatsApp.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VIPMembership;