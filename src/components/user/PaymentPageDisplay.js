// src/components/user/PaymentPageDisplay.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PaymentPageDisplay.css';

const PaymentPageDisplay = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paymentPage, setPaymentPage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPaymentPage = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      const response = await axios.get(
        `${API_URL}/payment/payment/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setPaymentPage(response.data.page);
      } else {
        setError('Payment page not found');
      }
    } catch (error) {
      console.error('Fetch payment page error:', error);
      setError('Error loading payment page');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPaymentPage();
  }, [fetchPaymentPage]);

  const handlePayment = async () => {
    if (!paymentPage) return;

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      const response = await axios.post(
        `${API_URL}/payment/payment/${id}/process`,
        { amount: paymentPage.amount },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSuccess('Payment successful!');
        // Redirect to next page after delay
        setTimeout(() => {
          navigate(paymentPage.nextPage || '/dashboard');
        }, 2000);
      } else {
        setError(response.data.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.response?.data?.message || 'An error occurred during payment');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="container">Loading payment page...</div>;
  }

  if (error && !paymentPage) {
    return <div className="container error-message">{error}</div>;
  }

  if (!paymentPage) {
    return <div className="container">Payment page not found</div>;
  }

  return (
    <div className="container">
      <div className="payment-page-container">
        <h1>{paymentPage.name}</h1>
        
        <div className="payment-content">
          {paymentPage.imageUrl && (
            <div className="payment-image">
              <img src={paymentPage.imageUrl} alt={paymentPage.name} />
            </div>
          )}
          
          <div className="payment-text">
            <p>{paymentPage.content}</p>
          </div>
          
          <div className="payment-details">
            <div className="amount-display">
              <h2>Amount: R {parseFloat(paymentPage.amount).toFixed(2)}</h2>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <button
              className="cta-button pay-button"
              onClick={handlePayment}
              disabled={processing}
            >
              {processing ? 'Processing...' : `Pay R${parseFloat(paymentPage.amount).toFixed(2)}`}
            </button>
            
            <p className="note">
              After payment, you will be redirected to: {paymentPage.nextPage || 'dashboard'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPageDisplay;