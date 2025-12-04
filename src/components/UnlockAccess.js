import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UnlockAccess.css';

const UnlockAccess = () => {
  const [pin, setPin] = useState('');
  const [proofOfPayment, setProofOfPayment] = useState(null);
  const [pinError, setPinError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();

  // Get API URL from environment variables (same as UserDashboard)
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setPinError('');
    setIsVerifying(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setPinError('You are not logged in. Please log in first.');
        setIsVerifying(false);
        return;
      }

      // Use environment variable for API URL
      const response = await axios.post(`${API_URL}/api/user/verify-pin`, 
        { pin: pin.trim() }, 
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.verified) {
        // Store verification in localStorage
        localStorage.setItem('isVerified', 'true');
        localStorage.setItem('pinType', response.data.pinType || 'global');
        navigate('/vip-membership');
      } else {
        setPinError(response.data.message || 'Invalid PIN. Please contact admin.');
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      
      if (error.response) {
        setPinError(error.response.data.message || 'Invalid PIN. Please try again.');
      } else if (error.request) {
        setPinError('Network error. Please check your connection and try again.');
      } else {
        setPinError('Error verifying PIN. Please contact admin at +1 405 926 0437 on WhatsApp.');
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
      await axios.post(`${API_URL}/api/user/upload-proof`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Proof of payment uploaded successfully. You will receive your PIN after verification.');
      setProofOfPayment(null);
      const fileInput = document.querySelector('.file-upload');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Error uploading proof:', error);
      alert('Failed to upload proof. Please try again or send directly via WhatsApp.');
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
                setPin(e.target.value);
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
              {pinError}
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
          <button className="unlock-button" onClick={handleProofUpload}>
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