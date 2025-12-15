// src/components/CardPage.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { updateProgressTracking } from '../utils/progressTracker';
import './CardPage.css';

const CardPage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    gender: '',
    dateOfBirth: '',
    selectedPlan: user?.plans?.[0] || '',
    image: null
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [idCardGenerated, setIdCardGenerated] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [cardNumber, setCardNumber] = useState('');

  const idCardRef = useRef(null);
  const idCardPrice = 900;

  // Generate random card number (in production, this should come from backend)
  const generateCardNumber = () => {
    const prefix = 'OWP-';
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${randomNum}${timestamp}`;
  };

  useEffect(() => {
    if (user?.plans?.[0]) {
      setFormData(prev => ({ ...prev, selectedPlan: user.plans[0] }));
    }
    // Generate initial card number
    setCardNumber(generateCardNumber());
    
    // Update progress tracking when page loads
    const updateProgress = async () => {
      await updateProgressTracking('card-page');
    };
    updateProgress();
  }, [user]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateAge = (dateString) => {
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[+]?[\d\s-]{10,}$/;
    return phoneRegex.test(phone);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate image size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size should be less than 10MB');
        return;
      }
      
      // Validate image type
      if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
        setError('Only JPEG and PNG images are allowed');
        return;
      }

      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateCard = async () => {
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'phoneNumber', 'gender', 'dateOfBirth'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        setError(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return;
      }
    }

    // Validate phone number
    if (!validatePhoneNumber(formData.phoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }

    if (!formData.image) {
      setError('Please upload an image');
      return;
    }

    if (!user?.balance || user.balance < idCardPrice) {
      setError(`Insufficient balance. Please fund your wallet with R${(idCardPrice - (user?.balance || 0)).toFixed(2)} to generate your Platform ID Card.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('phoneNumber', formData.phoneNumber);
      formDataToSend.append('gender', formData.gender);
      formDataToSend.append('dateOfBirth', formData.dateOfBirth);
      formDataToSend.append('selectedPlan', formData.selectedPlan);
      formDataToSend.append('image', formData.image);
      formDataToSend.append('amount', idCardPrice);

      const response = await axios.post(
        `${API_URL}/user/generate-id-card`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setIdCardGenerated(true);
        // Store the member ID from the response
        if (response.data.idCard?.memberId) {
          setMemberId(response.data.idCard.memberId);
        }
        updateUser(response.data.user);
        setSuccess('ID Card generated successfully!');
        
        // Generate a new card number for display
        setCardNumber(generateCardNumber());
        
        // Update progress tracking
        await updateProgressTracking('card-page', true);
      } else {
        setError(response.data.message || 'Failed to generate ID card');
      }
    } catch (error) {
      console.error('Generate ID card error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadIDCard = async () => {
    if (!idCardRef.current) return;

    setGeneratingImage(true);
    try {
      const canvas = await html2canvas(idCardRef.current, {
        scale: 3, // Higher scale for better quality
        useCORS: true,
        backgroundColor: null,
        logging: false
      });

      const image = canvas.toDataURL('image/png', 1.0);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.download = `Olympic-Winning-Platform-ID-${memberId || cardNumber}.png`;
      link.href = image;
      link.click();
      
      setSuccess('ID Card downloaded successfully!');
    } catch (error) {
      console.error('Error generating image:', error);
      setError('Failed to download ID card. Please try again.');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleProceed = async () => {
    // Update progress tracking before navigating
    await updateProgressTracking('card-page', true);
    navigate('/card-number-page');
  };

  return (
    <div className="container">
      <div className="cardpage-container">
        <div className="page-header">
          <h1>Platform ID Card</h1>
          <p className="page-subtitle">Generate your official Olympic Winning Platform identification card</p>
        </div>
        
        {!idCardGenerated ? (
          <div className="card-form">
            <div className="form-section">
              <h2 className="section-title">Personal Information</h2>
              <p className="section-subtitle">All fields marked with * are required</p>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter first name"
                    disabled={loading}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter last name"
                    disabled={loading}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="+27 XX XXX XXXX"
                    disabled={loading}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="form-select"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="form-input"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="form-group">
                  <label>Selected Plan</label>
                  <div className="plan-display">
                    <span className="plan-badge">{formData.selectedPlan}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2 className="section-title">Upload Photo</h2>
              <p className="section-subtitle">Requirements: JPG/PNG, Max 10MB, Clear face photo</p>
              
              <div className="image-upload-container">
                <div className="upload-area">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={loading}
                    id="image-upload"
                    className="file-input"
                  />
                  <label htmlFor="image-upload" className="upload-label">
                    <div className="upload-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <p>Click to upload photo</p>
                    <p className="upload-hint">or drag and drop</p>
                  </label>
                </div>
                
                {preview && (
                  <div className="image-preview">
                    <div className="preview-header">
                      <span>Photo Preview</span>
                      <button 
                        type="button" 
                        className="change-photo-btn"
                        onClick={() => document.getElementById('image-upload').click()}
                      >
                        Change
                      </button>
                    </div>
                    <img src={preview} alt="Preview" className="preview-image" />
                  </div>
                )}
              </div>
            </div>

            <div className="payment-section">
              <div className="price-card">
                <h3>Payment Summary</h3>
                <div className="price-row">
                  <span>ID Card Fee</span>
                  <span className="price">R {idCardPrice.toFixed(2)}</span>
                </div>
                <div className="price-row">
                  <span>Your Balance</span>
                  <span className={`balance ${user?.balance >= idCardPrice ? 'sufficient' : 'insufficient'}`}>
                    R {user?.balance?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="price-row total">
                  <span>Remaining Balance</span>
                  <span className="remaining">
                    R {((user?.balance || 0) - idCardPrice).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="alert error">
                <span className="alert-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="form-actions">
              <button
                className={`btn btn-primary generate-btn ${loading ? 'loading' : ''}`}
                onClick={handleGenerateCard}
                disabled={loading || !formData.image || !formData.firstName || !formData.lastName}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  'Generate ID Card'
                )}
              </button>
              
              <p className="terms-notice">
                By generating the ID card, you agree to our 
                <a href="/terms"> Terms of Service</a> and confirm that all information provided is accurate.
              </p>
            </div>
          </div>
        ) : (
          <div className="id-card-preview-container">
            <div className="success-header">
              <div className="success-icon">✓</div>
              <h2>ID Card Generated Successfully!</h2>
              <p className="success-message">Your ID card is ready to download and use</p>
            </div>
            
            <div className="id-card-wrapper">
              <div className="id-card" ref={idCardRef}>
                {/* ID Card Front */}
                <div className="id-card-front">
                  {/* Header with Olympic Theme */}
                  <div className="card-header-olympic">
                    <div className="olympic-rings">
                      <div className="ring blue"></div>
                      <div className="ring yellow"></div>
                      <div className="ring black"></div>
                      <div className="ring green"></div>
                      <div className="ring red"></div>
                    </div>
                    <div className="organization-title">
                      <h2>OLYMPIC WINNING PLATFORM</h2>
                      <p className="org-subtitle">OFFICIAL MEMBER IDENTIFICATION CARD</p>
                    </div>
                    <div className="card-id-number">
                      <span>ID: {memberId || cardNumber}</span>
                    </div>
                  </div>
                  
                  {/* Main Content Area */}
                  <div className="card-body">
                    {/* Left Side: Photo and Basic Info */}
                    <div className="card-left-section">
                      <div className="photo-container">
                        <div className="photo-border">
                          {preview && <img src={preview} alt="Member" className="member-photo" />}
                        </div>
                        <div className="photo-validity">
                          <div className="validity-stamp">
                            <span className="validity-text">VALID</span>
                            <span className="validity-date">12/2026</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="basic-info">
                        <div className="member-name">
                          <h3>{formData.firstName} {formData.lastName}</h3>
                          <p className="member-plan">{formData.selectedPlan} PLAN</p>
                        </div>
                        
                        <div className="member-demographics">
                          <div className="demographic-item">
                            <span className="demographic-label">Gender</span>
                            <span className="demographic-value">{formData.gender}</span>
                          </div>
                          <div className="demographic-item">
                            <span className="demographic-label">Age</span>
                            <span className="demographic-value">{calculateAge(formData.dateOfBirth)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right Side: Detailed Information */}
                    <div className="card-right-section">
                      <div className="detailed-info">
                        <div className="info-row">
                          <span className="info-label">Full Name:</span>
                          <span className="info-value">{formData.firstName} {formData.lastName}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Date of Birth:</span>
                          <span className="info-value">{formatDate(formData.dateOfBirth)}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Gender:</span>
                          <span className="info-value">{formData.gender}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Phone Number:</span>
                          <span className="info-value">{formData.phoneNumber}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Membership Plan:</span>
                          <span className="info-value plan-highlight">{formData.selectedPlan}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Issue Date:</span>
                          <span className="info-value">{new Date().toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Tracking Number:</span>
                          <span className="info-value tracking-blank">____________________</span>
                        </div>
                      </div>
                      
                      {/* Signature Section */}
                      <div className="signature-section">
                        <div className="member-signature">
                          <div className="signature-line"></div>
                          <p className="signature-label">Member Signature</p>
                        </div>
                        <div className="admin-signature">
                          <div className="signature-line"></div>
                          <p className="signature-label">Admin Signature</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Footer with Security Features */}
                  <div className="card-footer">
                    <div className="security-features">
                      <div className="holographic-stripe"></div>
                      <div className="microprint">
                        OLYMPIC WINNING PLATFORM • AUTHENTIC MEMBER ID • SECURE VERIFICATION
                      </div>
                    </div>
                    <div className="card-validity">
                      <div className="chip-section">
                        <div className="emv-chip"></div>
                        <div className="rfid-indicator">RFID ENABLED</div>
                      </div>
                      <div className="validity-dates">
                        <p>Issued: {new Date().toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}</p>
                        <p>Expires: December 31, 2026</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card-actions">
                <button
                  className={`btn btn-download ${generatingImage ? 'loading' : ''}`}
                  onClick={downloadIDCard}
                  disabled={generatingImage}
                >
                  {generatingImage ? (
                    <>
                      <span className="spinner"></span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download ID Card
                    </>
                  )}
                </button>
                
                <div className="additional-actions">
                  <button className="btn btn-secondary" onClick={() => window.print()}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                    Print
                  </button>
                  <button className="btn btn-outline" onClick={handleProceed}>
                    Proceed to Add Tracking Number
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {success && (
                <div className="alert success">
                  <span className="alert-icon">✓</span>
                  {success}
                </div>
              )}
            </div>
            
            <div className="instructions">
              <h3>Important Information</h3>
              <div className="instruction-steps">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Complete Your ID Card</h4>
                    <p>This is your basic ID card. To complete your registration, you need to add a tracking number and signature in the next steps.</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>Tracking Number Required</h4>
                    <p>Your tracking number is essential for participating in Olympic events and accessing member benefits.</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Signature for Authentication</h4>
                    <p>An official signature will be added by platform administrators to authenticate your ID card.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardPage;