// src/components/CardNumberPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { updateProgressTracking } from '../utils/progressTracker';
import './CardNumberPage.css';

const CardNumberPage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trackingNumberGenerated, setTrackingNumberGenerated] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');

  const trackingPrice = 1000;

  useEffect(() => {
    // Update progress tracking when page loads
    const updateProgress = async () => {
      await updateProgressTracking('card-number-page');
    };
    updateProgress();
  }, []);

  const handleGenerateTracking = async () => {
    if (!user?.balance || user.balance < trackingPrice) {
      setError(`Insufficient balance. Please fund your wallet with R${trackingPrice - (user?.balance || 0)} to generate your Tracking ID Card.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      const response = await axios.post(
        `${API_URL}/user/generate-tracking`,
        { amount: trackingPrice },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setError(''); // Clear any previous errors
        setTrackingNumber(response.data.trackingNumber);
        setTrackingNumberGenerated(true);
        updateUser(response.data.user);
        
        // Update progress tracking
        await updateProgressTracking('card-number-page', true);
      } else {
        setError(response.data.message || 'Failed to generate tracking number');
      }
    } catch (error) {
      console.error('Generate tracking error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = async () => {
    // Update progress tracking before navigating
    await updateProgressTracking('card-number-page', true);
    navigate('/card-signature-page');
  };

  return (
    <div className="container">
      <div className="cardnumber-container">
        <h1>Generate Tracking ID</h1>
        
        <div className="cardnumber-content">
          <div className="info-card">
            <div className="info-image">
              <img 
                src="/images/img11.png" 
                alt="Tracking ID" 
                className="info-image-img"
              />
            </div>
            
            <div className="info-text">
              <h3>Complete Your Registration with a Tracking ID</h3>
              <p>
                To finalize your ID card registration and activate all features, you need to generate a 
                unique Tracking ID. This one-time payment of <strong>R1,000</strong> is essential for:
              </p>
              
              <ul className="benefits-list">
                <li>
                  <strong>Permanent Identification:</strong> Your Tracking ID becomes a permanent, 
                  unique identifier embedded in your official ID card
                </li>
                <li>
                  <strong>Enhanced Security:</strong> Enables advanced verification and authentication 
                  features to protect your identity
                </li>
                <li>
                  <strong>Full System Access:</strong> Unlocks all platform capabilities and completes 
                  your registration process
                </li>
                <li>
                  <strong>Lifetime Validity:</strong> One-time payment for a lifetime tracking number 
                  that never expires
                </li>
                <li>
                  <strong>Priority Support:</strong> Access to dedicated customer service and faster 
                  processing times
                </li>
              </ul>
              
              <p className="note">
                <strong>Note:</strong> The Tracking ID is mandatory for all registered users and must 
                be generated before proceeding to the next registration step. Please ensure your wallet 
                is funded with <strong>R1,000</strong> to generate your Tracking ID Card.
              </p>
            </div>
          </div>

          <div className="tracking-info">
            <div className="price-display">
              <p>Tracking ID Price: <strong>R {trackingPrice.toFixed(2)}</strong></p>
              <p>Your Current Balance: <strong>R {user?.balance?.toFixed(2) || '0.00'}</strong></p>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {!trackingNumberGenerated ? (
              <div className="payment-summary">
                <div className="summary-card">
                  <h4>Payment Summary</h4>
                  <div className="summary-details">
                    <div className="summary-row">
                      <span>Tracking ID Generation Fee:</span>
                      <span>R 1,000.00</span>
                    </div>
                    <div className="summary-row">
                      <span>Service Included:</span>
                      <span>Lifetime Tracking Number</span>
                    </div>
                    <div className="summary-row total">
                      <span>Total Amount:</span>
                      <span>R 1,000.00</span>
                    </div>
                  </div>
                </div>

                <button
                  className="cta-button generate-button"
                  onClick={handleGenerateTracking}
                  disabled={loading}
                >
                  {loading ? 'Processing Payment...' : 'Generate Tracking ID Now'}
                </button>
              </div>
            ) : (
              <div className="tracking-result">
                <div className="success-card">
                  <div className="success-icon">✓</div>
                  <h3>Tracking ID Generated Successfully!</h3>
                  <div className="tracking-number-display">
                    <p className="tracking-label">Your Unique Tracking Number:</p>
                    <div className="tracking-number">
                      {trackingNumber}
                    </div>
                    <p className="success-note">
                      This tracking number has been permanently embedded in your ID card and 
                      is now active in the system. You can use this number for verification 
                      and tracking purposes.
                    </p>
                  </div>
                </div>

                <div className="next-steps">
                  <h4>Next Steps:</h4>
                  <p>Proceed to complete the final step of your registration by adding your 
                  digital signature to your ID card.</p>
                  
                  <button
                    className="cta-button proceed-button"
                    onClick={handleProceed}
                  >
                    Continue to Signature Page →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardNumberPage;