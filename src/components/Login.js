// src/components/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import './Login.css'; // Optional: Create a CSS file for login styles

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Convert email to lowercase as user types
    const processedValue = name === 'email' ? value.toLowerCase() : value;
    
    setFormData({
      ...formData,
      [name]: processedValue
    });
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Ensure email is lowercase before sending
      const loginData = {
        ...formData,
        email: formData.email.toLowerCase().trim()
      };

      const response = await api.post('/auth/login', loginData);
      
      if (response.data.user.role === 'admin') {
        // Store admin token and redirect to admin panel
        login(response.data.user, response.data.token);
        navigate('/admin');
      } else {
        // Store user token and redirect to user dashboard
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

  return (
    <div className="form-container">
      <h2>Login to Olympic Platform</h2>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
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
      <p style={{ textAlign: 'center', marginTop: '15px' }}>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
};

export default Login;