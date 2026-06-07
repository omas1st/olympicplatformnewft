// src/components/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // --- Forgot Password Modal States ---
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState('email'); // 'email' | 'reset' | 'message'
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Final message shown before redirect
  const [finalMessage, setFinalMessage] = useState('');
  const [finalMessageType, setFinalMessageType] = useState(''); // 'success' or 'error'
  const [redirectPath, setRedirectPath] = useState(null); // where to go after OK

  // --- Login handlers (unchanged) ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    const processedValue = name === 'email' ? value.toLowerCase() : value;
    setFormData({ ...formData, [name]: processedValue });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const loginData = {
        ...formData,
        email: formData.email.toLowerCase().trim()
      };

      const response = await api.post('/auth/login', loginData);

      if (response.data.user.role === 'admin') {
        login(response.data.user, response.data.token);
        navigate('/admin');
      } else {
        login(response.data.user, response.data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message ||
        'Login failed. Please try again.' ||
        err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Forgot Password Handlers ---
  const openForgotModal = () => {
    setShowForgotModal(true);
    setForgotStep('email');
    setForgotEmail('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError('');
    setForgotSuccess('');
    setFinalMessage('');
    setFinalMessageType('');
    setRedirectPath(null);
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
  };

  // Step 1: Request reset code
  const handleForgotEmailSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      const response = await api.post('/auth/forgot-password', {
        email: forgotEmail.toLowerCase().trim()
      });

      setForgotSuccess(response.data.message || 'Reset code sent!');
      setForgotStep('reset');
    } catch (err) {
      const msg = err.response?.data?.message || 'Request failed';

      // Email not registered -> show final message, OK -> register page
      if (err.response?.status === 404 && err.response?.data?.redirect === '/register') {
        setFinalMessage('Email not found. Please register first.');
        setFinalMessageType('error');
        setRedirectPath('/register');
        setForgotStep('message');
      } else {
        // Other errors (network, server) remain on this step
        setForgotError(msg);
      }
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Verify code & set new password
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetCode || !newPassword || !confirmPassword) {
      setForgotError('All fields are required');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      await api.post('/auth/reset-password', {
        email: forgotEmail.toLowerCase().trim(),
        code: resetCode,
        newPassword
      });

      // Success -> show final message, OK -> login page
      setFinalMessage('Password reset successfully!');
      setFinalMessageType('success');
      setRedirectPath('/');
      setForgotStep('message');
    } catch (err) {
      const msg = err.response?.data?.message || 'Reset failed';

      // Invalid or expired code -> show final message, OK -> login page
      if (msg.includes('Invalid reset code') || msg.includes('expired')) {
        setFinalMessage('Incorrect code. Please try again later.');
        setFinalMessageType('error');
        setRedirectPath('/');
        setForgotStep('message');
      } else {
        // Other errors (validation, server) stay on this step
        setForgotError(msg);
      }
    } finally {
      setForgotLoading(false);
    }
  };

  // User clicks OK on the final message -> redirect to saved path, then close modal
  const handleFinalOk = () => {
    closeForgotModal();
    if (redirectPath) {
      navigate(redirectPath);
    }
  };

  return (
    <div className="form-container">
      <h2>Login to Olympic Platform</h2>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email or Username:</label>
          <input
            type="text"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Enter your email or admin username"
            autoComplete="email"
            style={{ textTransform: 'lowercase' }}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
            autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          className="cta-button"
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {/* Forgot Password link */}
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <button
          type="button"
          className="link-button"
          onClick={openForgotModal}
        >
          Forgot Password?
        </button>
      </div>

      <p style={{ textAlign: 'center', marginTop: '15px' }}>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>

      {/* --- Forgot Password Modal --- */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={closeForgotModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <span className="modal-close" onClick={closeForgotModal}>&times;</span>

            {/* Step 1: Enter email */}
            {forgotStep === 'email' && (
              <>
                <h3>Reset Your Password</h3>
                <form onSubmit={handleForgotEmailSubmit}>
                  <div className="form-group">
                    <label htmlFor="forgotEmail">Enter your registered email:</label>
                    <input
                      type="email"
                      id="forgotEmail"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      required
                      disabled={forgotLoading}
                      placeholder="your@email.com"
                    />
                  </div>
                  {forgotError && <div className="error-message">{forgotError}</div>}
                  {forgotSuccess && <div className="success-message">{forgotSuccess}</div>}
                  <button
                    type="submit"
                    className="cta-button"
                    disabled={forgotLoading}
                    style={{ width: '100%' }}
                  >
                    {forgotLoading ? 'Sending...' : 'Continue'}
                  </button>
                </form>
              </>
            )}

            {/* Step 2: Enter code & new password */}
            {forgotStep === 'reset' && (
              <>
                <h3>Reset Your Password</h3>
                <form onSubmit={handleResetSubmit}>
                  <p style={{ textAlign: 'center' }}>
                    A 5‑digit code was sent to <strong>{forgotEmail}</strong>.
                  </p>
                  <div className="form-group">
                    <label htmlFor="resetCode">Enter Reset Code:</label>
                    <input
                      type="text"
                      id="resetCode"
                      value={resetCode}
                      onChange={e => setResetCode(e.target.value)}
                      required
                      disabled={forgotLoading}
                      maxLength="5"
                      placeholder="12345"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password (min 6 characters):</label>
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      disabled={forgotLoading}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password:</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      disabled={forgotLoading}
                    />
                  </div>
                  {forgotError && <div className="error-message">{forgotError}</div>}
                  {forgotSuccess && <div className="success-message">{forgotSuccess}</div>}
                  <button
                    type="submit"
                    className="cta-button"
                    disabled={forgotLoading}
                    style={{ width: '100%' }}
                  >
                    {forgotLoading ? 'Resetting...' : 'Continue'}
                  </button>
                </form>
              </>
            )}

            {/* Step 3: Final message + OK button */}
            {forgotStep === 'message' && (
              <>
                <h3>{finalMessageType === 'success' ? 'Success' : 'Notice'}</h3>
                <div className={finalMessageType === 'success' ? 'success-message' : 'error-message'}>
                  {finalMessage}
                </div>
                <button
                  onClick={handleFinalOk}
                  className="cta-button"
                  style={{ width: '100%' }}
                >
                  OK
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
