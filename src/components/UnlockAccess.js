import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UnlockAccess.css';

const UnlockAccess = () => {
  const [pin, setPin] = useState('');
  const [proofOfPayment, setProofOfPayment] = useState(null);
  const [pinError, setPinError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const navigate = useNavigate();

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
        localStorage.setItem('isVerified', 'true');
        localStorage.setItem('pinType', response.data.pinType || 'global');
        localStorage.setItem('pinVerifiedAt', new Date().toISOString());
        
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.isVerified = true;
        localStorage.setItem('user', JSON.stringify(user));
        
        navigate('/vip-membership');
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

  const handleProofUpload = async () => {
    if (!proofOfPayment) {
      alert('Please select a proof of payment file');
      return;
    }

    const formData = new FormData();
    formData.append('proof', proofOfPayment);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You are not logged in. Please log in first.');
        navigate('/login');
        return;
      }

      console.log('Uploading to:', `${apiUrl}/api/user/upload-proof`);
      
      await axios.post(`${apiUrl}/api/user/upload-proof`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Proof of payment uploaded successfully.');
      setProofOfPayment(null);
      const fileInput = document.querySelector('.file-upload');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload proof. Please try again.');
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
            <li>Make a payment of R300 to the account details below.</li>
            <li>
              After payment, send a message on WhatsApp to the Admin/Agent at:
              <br />
              <strong>+1 405 926 0437</strong>
              <br />
              <strong>+44 739 887 1333</strong>
            </li>
            <li>Upload your payment receipt below to receive your 5-digit registration PIN.</li>
          </ol>
          <div className="important-note">
            <strong>Note:</strong> TRANSFER is not allowed for those using CAPITEC BANK APP ONLY, 
            kindly use ATM DEPOSIT or any other banking app which is not CAPITEC instead.
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

        <div className="unlock-card">
          <h3>Banking Details</h3>
          <div className="banking-details">
            <p><strong>Beneficiary Name:</strong> MAMA PTY</p>
            <p><strong>Account Number:</strong> 62509963139</p>
            <p><strong>Recipient/Beneficiary Reference:</strong> 0651623286</p>
            <p><strong>Bank:</strong> FNB</p>
            <p><strong>Branch Code:</strong> 250655</p>
            <p><strong>Payment Type:</strong> Immediate Payment</p>
          </div>
          <div className="important-note">
            <strong>Important:</strong> Always include "0651623286" as the reference number when making your payment. 
            Your payment won't be processed if you fail to add "0651623286" as the reference.
          </div>
        </div>

        <div className="unlock-card">
          <h3>Upload Proof of Payment</h3>
          <input
            type="file"
            onChange={(e) => setProofOfPayment(e.target.files[0])}
            className="file-upload"
            accept=".jpg,.jpeg,.png,.pdf"
          />
          <button 
            className="unlock-button" 
            onClick={handleProofUpload}
            disabled={!proofOfPayment}
          >
            Send Proof of Payment
          </button>
          <div className="important-note" style={{ marginTop: '10px' }}>
            After uploading, please wait for verification. You will receive your PIN via WhatsApp.
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnlockAccess;