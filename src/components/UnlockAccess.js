import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { updateProgressTracking } from '../utils/progressTracker';
import './UnlockAccess.css';

const UnlockAccess = () => {
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const navigate = useNavigate();

  // Update progress tracking when page loads
  useEffect(() => {
    const updateProgress = async () => {
      await updateProgressTracking('unlock-access');
    };
    updateProgress();
  }, []);

  // Get API URL from environment variables
  useEffect(() => {
    // IMPORTANT: Check if the URL ends with /api and remove it
    let API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    // Remove trailing slash if exists
    API_URL = API_URL.replace(/\/$/, '');
    
    // Remove /api from the end if it exists (to avoid double /api)
    if (API_URL.endsWith('/api')) {
      API_URL = API_URL.slice(0, -4); // Remove '/api' from the end
    }
    
    console.log('Final API URL:', API_URL);
    setApiUrl(API_URL);
    
    // Test connection
    testConnection(API_URL);
  }, []);

  const testConnection = async (url) => {
    try {
      console.log('Testing connection to:', `${url}/health`);
      const response = await axios.get(`${url}/health`, { timeout: 5000 });
      console.log('Health check successful:', response.data);
    } catch (error) {
      console.warn('Health check failed:', error.message);
    }
  };

  // Update the handlePinSubmit function in UnlockAccess.js
  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setPinError('');
    setIsVerifying(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setPinError('You are not logged in. Please log in first.');
        setIsVerifying(false);
        navigate('/login');
        return;
      }

      console.log('Making request to:', `${apiUrl}/api/user/verify-pin`);
      
      const response = await axios.post(
        `${apiUrl}/api/user/verify-pin`,
        { pin: pin.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      console.log('PIN verification response:', response.data);
      
      if (response.data.verified) {
        // Deduct R300 from user balance
        const deductResponse = await axios.post(
          `${apiUrl}/api/user/deduct-pin-fee`,
          { amount: 300 },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (deductResponse.data.success) {
          localStorage.setItem('isVerified', 'true');
          localStorage.setItem('pinType', response.data.pinType || 'global');
          localStorage.setItem('pinVerifiedAt', new Date().toISOString());
          
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          user.isVerified = true;
          user.balance = deductResponse.data.user.balance;
          localStorage.setItem('user', JSON.stringify(user));
          
          // Update progress tracking before navigating (mark as completed)
          await updateProgressTracking('unlock-access', true);
          navigate('/vip-membership');
        } else {
          setPinError('Failed to process payment. Please contact admin.');
        }
      } else {
        setPinError(response.data.message || 'Invalid PIN. Please contact admin.');
      }
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        url: error.config?.url
      });
      
      if (error.response) {
        switch (error.response.status) {
          case 404:
            setPinError(`Endpoint not found. Please check:\n- Backend URL: ${apiUrl}\n- Endpoint: /api/user/verify-pin`);
            break;
          case 401:
            setPinError('Session expired. Please log in again.');
            break;
          default:
            setPinError(error.response.data.message || 'Error verifying PIN.');
        }
      } else if (error.request) {
        setPinError(`Cannot connect to server at ${apiUrl}. Please check if backend is running.`);
      } else {
        setPinError('Error verifying PIN. Please contact admin.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="container">
      <div className="unlock-container">
        <h1 className="unlock-title">Unlock Access</h1>

        <div className="unlock-card">
          <h2>Instructions</h2>
          <p>To unlock access to the winning numbers:</p>
          <ol className="instructions-list">
            <li>Kindly fund your wallet with R300, then you'll get the 5 digit Pin.</li>
            <li>
              After funding your wallet, send a message on WhatsApp to the Admin/Agent at:
              <br />
              <strong>+1 405 926 0437</strong>
              <br />
              <strong>+44 739 887 1333</strong>
            </li>
            
          </ol>
          <div className="important-note">
            <strong>Note:</strong> Input your 5 digit pin below, if you don't have a pin yet, kindly check your dashboard notification for your pin, or you message the admin.
          </div>
        </div>

        <div className="unlock-card">
          <h3>Enter Your PIN</h3>
          <form onSubmit={handlePinSubmit}>
            <input
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, '').slice(0, 5));
                setPinError('');
              }}
              placeholder="Enter 5-digit PIN"
              maxLength="5"
              pattern="[0-9]{5}"
              className="pin-input"
              disabled={isVerifying}
              required
            />
            <button 
              type="submit" 
              className="unlock-button cta-button"
              disabled={isVerifying || pin.length !== 5}
            >
              {isVerifying ? 'Verifying...' : 'Submit PIN'}
            </button>
          </form>
          {pinError && (
            <div className="pin-error show">
              <div style={{ whiteSpace: 'pre-line' }}>{pinError}</div>
            </div>
          )}
          <div className="contact-admin">
            Don't have a PIN or having issues? <a href="https://wa.me/14059260437" target="_blank" rel="noopener noreferrer">
              Contact Admin on WhatsApp
            </a> for assistance.
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnlockAccess;