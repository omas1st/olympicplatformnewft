// src/components/Register.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import './Register.css';
import countryList from '../utils/countries';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    country: '',
    sex: '',
    occupation: '',
    age: '',
    password: '',
    confirmPassword: ''
  });
  const [countries] = useState(countryList);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    specialChar: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Convert email to lowercase as user types
    const processedValue = name === 'email' ? value.toLowerCase() : value;
    
    setFormData({
      ...formData,
      [name]: processedValue
    });

    if (name === 'password') {
      checkPasswordStrength(value);
      checkPasswordRequirements(value);
    }
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const checkPasswordRequirements = (password) => {
    const requirements = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      specialChar: /[!@#$%^&*]/.test(password)
    };
    
    setPasswordRequirements(requirements);
  };

  const checkPasswordStrength = (password) => {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
    const mediumRegex = /^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})/;

    if (strongRegex.test(password)) {
      setPasswordStrength('strong');
    } else if (mediumRegex.test(password)) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('weak');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (formData.age < 18) {
      setError("You must be at least 18 years old to register");
      return;
    }

    // Check if password meets all requirements
    const allRequirementsMet = Object.values(passwordRequirements).every(req => req === true);
    if (!allRequirementsMet) {
      setError("Please ensure your password meets all the requirements listed below");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Ensure email is lowercase before sending
      const registrationData = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        whatsapp: formData.whatsapp.trim(),
        country: formData.country,
        sex: formData.sex,
        occupation: formData.occupation.trim(),
        age: parseInt(formData.age),
        password: formData.password
      };
      
      const response = await api.post('/auth/register', registrationData);
      
      console.log('Registration successful:', response.data);
      alert('Registration successful! Please login with your credentials.');
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      
      // Better error message handling
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.details?.[0] 
        || error.message 
        || 'Registration failed. Please try again.';
      
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Register</h2>
      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '15px' }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            autoComplete="email"
            style={{ textTransform: 'lowercase' }}
          />
        </div>

        <div className="form-group">
          <label>WhatsApp Number:</label>
          <input
            type="tel"
            name="whatsapp"
            value={formData.whatsapp}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Country:</label>
          <select 
            name="country" 
            value={formData.country} 
            onChange={handleChange} 
            required
            disabled={loading}
          >
            <option value="">Select Country</option>
            {countries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Sex:</label>
          <select 
            name="sex" 
            value={formData.sex} 
            onChange={handleChange} 
            required
            disabled={loading}
          >
            <option value="">Select Sex</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div className="form-group">
          <label>Occupation:</label>
          <input
            type="text"
            name="occupation"
            value={formData.occupation}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Age:</label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            min="18"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
          />
          {passwordStrength && (
            <div className={`password-strength ${passwordStrength}`}>
              Password Strength: {passwordStrength}
            </div>
          )}
          
          <div className="password-requirements">
            <small>Password must meet the following requirements:</small>
            <ul className="requirements-list">
              <li className={passwordRequirements.length ? 'met' : 'unmet'}>
                {passwordRequirements.length ? '✓' : '✗'} At least 8 characters long
              </li>
              <li className={passwordRequirements.lowercase ? 'met' : 'unmet'}>
                {passwordRequirements.lowercase ? '✓' : '✗'} At least one lowercase letter (a-z)
              </li>
              <li className={passwordRequirements.uppercase ? 'met' : 'unmet'}>
                {passwordRequirements.uppercase ? '✓' : '✗'} At least one uppercase letter (A-Z)
              </li>
              <li className={passwordRequirements.number ? 'met' : 'unmet'}>
                {passwordRequirements.number ? '✓' : '✗'} At least one number (0-9)
              </li>
              <li className={passwordRequirements.specialChar ? 'met' : 'unmet'}>
                {passwordRequirements.specialChar ? '✓' : '✗'} At least one special character (!@#$%^&*)
              </li>
            </ul>
          </div>
        </div>

        <div className="form-group">
          <label>Confirm Password:</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
          />
          {formData.password && formData.confirmPassword && (
            <div className="password-match">
              {formData.password === formData.confirmPassword 
                ? <span style={{color: '#27ae60'}}>✓ Passwords match</span> 
                : <span style={{color: '#e74c3c'}}>✗ Passwords do not match</span>
              }
            </div>
          )}
        </div>

        <button 
          type="submit" 
          className="cta-button" 
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default Register;