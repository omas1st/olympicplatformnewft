// src/components/CardSignaturePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { updateProgressTracking } from '../utils/progressTracker';
import './CardSignaturePage.css';

const CardSignaturePage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signatureGenerated, setSignatureGenerated] = useState(false);

  const signaturePrice = 1500;

  useEffect(() => {
    // Update progress tracking when page loads
    updateProgressTracking('card-signature-page');
  }, []);

  const handleGenerateSignature = async () => {
    if (!user?.balance || user.balance < signaturePrice) {
      setError(`Insufficient balance. Please fund your wallet with R${signaturePrice - (user?.balance || 0)} to generate your card signature.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      const response = await axios.post(
        `${API_URL}/user/generate-signature`,
        { amount: signaturePrice },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setError(''); // Clear any previous errors
        setSignatureGenerated(true);
        updateUser(response.data.user);
        
        // Update progress tracking
        updateProgressTracking('card-signature-page', true);
      } else {
        setError(response.data.message || 'Failed to generate card signature');
      }
    } catch (error) {
      console.error('Generate signature error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    // Update progress tracking before navigating
    updateProgressTracking('card-signature-page', true);
    navigate('/approval-stamp-page');
  };

  return (
    <div className="container">
      <div className="cardsignature-container">
        <h1>Generate Card Signature</h1>
        
        <div className="cardsignature-content">
          <div className="info-card">
            <div className="info-image">
              <img 
                src="/images/img12.png" 
                alt="Card Signature" 
                className="info-image-img"
              />
            </div>
            
            <div className="info-text">
              <p>
                Kindly get an olympic signature to your id card it is needed for the 
                completion of your registration. Olympic card signature is R1,500. 
                kindly fund your wallet with R1500, to generate your card signature.
              </p>
            </div>
          </div>

          <div className="signature-info">
            <div className="price-display">
              <p>Card Signature Price: <strong>R {signaturePrice}</strong></p>
              <p>Your Balance: <strong>R {user?.balance?.toFixed(2) || '0.00'}</strong></p>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {!signatureGenerated ? (
              <button
                className="cta-button generate-button"
                onClick={handleGenerateSignature}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Card Signature'}
              </button>
            ) : (
              <div className="signature-result">
                <div className="signature-preview">
                  <h3>Signature Added to Your ID Card</h3>
                  <div className="signature-image">
                    <img 
                      src="/images/img13.png" 
                      alt="Signature" 
                      className="signature-img"
                    />
                  </div>
                  <p className="note">The signature has been successfully added to your ID card</p>
                </div>

                <button
                  className="cta-button proceed-button"
                  onClick={handleProceed}
                >
                  Proceed
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardSignaturePage;