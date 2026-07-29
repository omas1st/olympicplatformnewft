// src/components/UpgradePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { updateProgressTracking } from '../utils/progressTracker';
import './UpgradePage.css';

// Static plan data moved outside component to avoid re-creation on each render
const newPlans = [
  { name: 'Weekly Plans - (3 numbers + bonus lunchtime only) - R4500', price: 4500 },
  { name: 'Weekly Plans - (3 numbers + bonus teatime only) - R4500', price: 4500 },
  { name: 'VIP Monthly Plans - Lunchtime and Teatime - R36,000', price: 36000 }
];

const UpgradePage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInsufficientPopup, setShowInsufficientPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [difference, setDifference] = useState(0);

  // Old plan prices (same as Subpage)
  const oldPlanPrices = {
    '1 Day - (3 numbers + bonus lunchtime only) - R700': 700,
    '1 Day - (3 numbers + bonus teatime only) - R700': 700,
    '1 Day - (3 numbers - Powerball) - R600': 600,
    '3 Days - (3 numbers + bonus lunchtime) - R2000': 2000,
    '3 Days - (3 numbers + bonus teatime) - R2000': 2000,
    '7 Days - (3 numbers + bonus lunchtime) - R4500': 4500,
    '7 Days - (3 numbers + bonus teatime) - R4500': 4500,
    '3 numbers (Russian Goslotto) - R600': 600,
    '7 days lunchtime and teatime - R2000': 2000
  };

  const currentPlan = user?.plans?.[0] || 'No current plan';
  const currentPlanPrice = oldPlanPrices[currentPlan] || 0;
  const userBalance = user?.balance || 0;

  // Calculate difference when a new plan is selected
  useEffect(() => {
    if (selectedPlan) {
      const selectedPlanObj = newPlans.find(p => p.name === selectedPlan);
      if (selectedPlanObj) {
        const diff = selectedPlanObj.price - currentPlanPrice;
        setDifference(diff > 0 ? diff : 0);
      }
    } else {
      setDifference(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlan, currentPlanPrice]);

  // Check if user already has a new plan (no upgrade needed)
  const hasNewPlan = newPlans.some(p => p.name === currentPlan);

  const handleContinue = async () => {
    if (!selectedPlan) {
      setError('Please select an upgrade plan.');
      return;
    }

    if (hasNewPlan) {
      await finalizeUpgrade();
      return;
    }

    if (difference <= 0) {
      await performUpgrade();
    } else if (userBalance >= difference) {
      await performUpgrade();
    } else {
      setShowInsufficientPopup(true);
    }
  };

  const performUpgrade = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      const selectedPlanObj = newPlans.find(p => p.name === selectedPlan);
      const response = await axios.post(
        `${API_URL}/user/upgrade-plan`,
        {
          newPlan: selectedPlan,
          newPlanPrice: selectedPlanObj.price,
          currentPlanPrice: currentPlanPrice
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        updateUser(response.data.user);
        setShowSuccessPopup(true);
      } else {
        setError(response.data.message || 'Upgrade failed.');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      setError(error.response?.data?.message || 'An error occurred during upgrade.');
    } finally {
      setLoading(false);
    }
  };

  const finalizeUpgrade = async () => {
    await updateProgressTracking('upgrade-page', true);
    window.open('https://wa.me/12297539618', '_blank');
    setTimeout(() => navigate('/dashboard'), 1500);
  };

  const handleDepositNow = () => {
    navigate('/dashboard');
  };

  const handleSuccessOk = () => {
    finalizeUpgrade();
  };

  return (
    <div className="container">
      <div className="upgrade-container">
        <h1>Plan Upgrade Required</h1>

        {/* Section 1: Message */}
        <div className="upgrade-message section">
          <p>
            Your current subscription plan is no longer available. You need to upgrade to 
            one of the weekly or monthly plans to continue.
          </p>
        </div>

        {/* Section 2: Current plan & balance */}
        <div className="current-info section">
          <h3>Your Current Subscription</h3>
          <p><strong>Current Plan:</strong> {currentPlan}</p>
          <p><strong>Amount Paid for Current Plan:</strong> R{currentPlanPrice.toFixed(2)}</p>
          <p><strong>Your Current Balance:</strong> R{userBalance.toFixed(2)}</p>
        </div>

        {/* Section 3: Available upgrade plans */}
        <div className="upgrade-options section">
          <h3>Select an Upgrade Plan</h3>
          <div className="plans-list">
            {newPlans.map((plan, index) => (
              <label key={index} className="plan-option">
                <input
                  type="radio"
                  name="upgradePlan"
                  value={plan.name}
                  checked={selectedPlan === plan.name}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                />
                <span>{plan.name} - R{plan.price.toFixed(2)}</span>
              </label>
            ))}
          </div>

          {selectedPlan && (
            <div className="difference-display">
              {difference > 0 ? (
                <p>You need to add <strong>R{difference.toFixed(2)}</strong> to upgrade to this plan.</p>
              ) : (
                <p>No additional payment required for this upgrade.</p>
              )}
            </div>
          )}
        </div>

        {/* Section 4: Continue button */}
        <div className="action-section section">
          {error && <div className="error-message">{error}</div>}
          <button
            className="cta-button continue-button"
            onClick={handleContinue}
            disabled={loading || !selectedPlan}
          >
            {loading ? 'Processing...' : 'Continue'}
          </button>
        </div>

        {/* Insufficient balance popup */}
        {showInsufficientPopup && (
          <div className="modal-overlay">
            <div className="modal-content popup">
              <h3>Insufficient Balance</h3>
              <p>You need an additional <strong>R{difference.toFixed(2)}</strong> to upgrade to this plan.</p>
              <p>Please deposit the required amount into your wallet.</p>
              <button className="deposit-now-button" onClick={handleDepositNow}>
                Deposit Now
              </button>
              <button className="cancel-button" onClick={() => setShowInsufficientPopup(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Success popup */}
        {showSuccessPopup && (
          <div className="modal-overlay">
            <div className="modal-content popup">
              <h3>Congratulations!</h3>
              <p>Your plan has been upgraded successfully. You will now be redirected to WhatsApp.</p>
              <button className="ok-button" onClick={handleSuccessOk}>
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpgradePage;