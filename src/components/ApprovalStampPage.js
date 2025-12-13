// src/components/ApprovalStampPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './ApprovalStampPage.css';

const ApprovalStampPage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stampGenerated, setStampGenerated] = useState(false);
  const [nextPage, setNextPage] = useState('/dashboard');

  const stampPrice = 2000;

  useEffect(() => {
    // Fetch admin configured next page
    fetchNextPage();
  }, []);

  const fetchNextPage = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      const response = await axios.get(
        `${API_URL}/api/user/next-page`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success && response.data.nextPage) {
        setNextPage(response.data.nextPage);
      }
    } catch (error) {
      console.error('Fetch next page error:', error);
    }
  };

  const handleGenerateStamp = async () => {
    if (!user?.balance || user.balance < stampPrice) {
      setError(`Insufficient balance. Please fund your wallet with R${stampPrice - (user?.balance || 0)} to generate your approval stamp.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      const response = await axios.post(
        `${API_URL}/user/generate-stamp`,
        { amount: stampPrice },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setError(''); // Clear any previous errors
        setStampGenerated(true);
        updateUser(response.data.user);
      } else {
        setError(response.data.message || 'Failed to generate approval stamp');
      }
    } catch (error) {
      console.error('Generate stamp error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    navigate(nextPage);
  };

  return (
    <div className="container">
      <div className="approvalstamp-container">
        <h1>Generate Approval Stamp</h1>
        
        <div className="approvalstamp-content">
          <div className="info-card">
            <div className="info-image">
              <img 
                src="/images/img14.png" 
                alt="Approval Stamp" 
                className="info-image-img"
              />
            </div>
            
            <div className="info-text">
              <p>
                Kindly get an olympic approval stamp to your id card it is needed for the 
                completion of your registration. Olympic approval stamp is R2,000. 
                kindly fund your wallet with R2000, to generate your approval stamp.
              </p>
            </div>
          </div>

          <div className="stamp-info">
            <div className="price-display">
              <p>Approval Stamp Price: <strong>R {stampPrice}</strong></p>
              <p>Your Balance: <strong>R {user?.balance?.toFixed(2) || '0.00'}</strong></p>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {!stampGenerated ? (
              <button
                className="cta-button generate-button"
                onClick={handleGenerateStamp}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Approval Stamp'}
              </button>
            ) : (
              <div className="stamp-result">
                <div className="stamp-preview">
                  <h3>Approval Stamp Added to Your ID Card</h3>
                  <div className="stamp-image">
                    <img 
                      src="/images/img15.png" 
                      alt="Approval Stamp" 
                      className="stamp-img"
                    />
                  </div>
                  <p className="note">The approval stamp has been successfully added to the center top of your ID card</p>
                </div>

                <div className="proceed-section">
                  <p className="redirect-info">
                    You will be redirected to: <strong>{nextPage}</strong>
                  </p>
                  
                  <button
                    className="cta-button proceed-button"
                    onClick={handleProceed}
                  >
                    Proceed
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

export default ApprovalStampPage;