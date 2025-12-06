import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UploadDepositProof.css';

const UploadDepositProof = () => {
  const [proofFile, setProofFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();

  // Get the API URL from environment variables
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Helper function to get the correct API endpoint (same as in UserDashboard)
  const getApiEndpoint = (endpoint) => {
    // Remove any trailing slash from API_URL
    let baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    
    // Check if baseUrl already contains /api
    if (baseUrl.endsWith('/api')) {
      // If it ends with /api, remove it to avoid double /api
      baseUrl = baseUrl.slice(0, -4);
    }
    
    // Construct the full URL
    return `${baseUrl}${endpoint}`;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage('File size too large. Maximum size is 5MB.');
        setMessageType('error');
        return;
      }

      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setMessage('Invalid file type. Please upload JPG, PNG, or PDF files.');
        setMessageType('error');
        return;
      }

      setProofFile(file);
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!proofFile) {
      setMessage('Please select a file to upload');
      setMessageType('error');
      return;
    }

    setUploading(true);
    setMessage('');
    
    const formData = new FormData();
    formData.append('proof', proofFile);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('You are not logged in. Please login first.');
        setMessageType('error');
        setUploading(false);
        navigate('/login');
        return;
      }

      // Use the helper function to get the correct endpoint
      const uploadEndpoint = getApiEndpoint('/api/user/upload-deposit-proof');
      
      console.log('Uploading to endpoint:', uploadEndpoint);
      console.log('File info:', {
        name: proofFile.name,
        size: proofFile.size,
        type: proofFile.type
      });

      const response = await axios.post(
        uploadEndpoint,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000 // 30 second timeout for file upload
        }
      );

      console.log('Upload response:', response.data);

      if (response.data.success) {
        setMessage('Proof of payment uploaded successfully! Admin has been notified and will review your deposit.');
        setMessageType('success');
        setProofFile(null);
        
        // Reset file input
        const fileInput = document.querySelector('.file-upload');
        if (fileInput) fileInput.value = '';
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setMessage(response.data.message || 'Upload failed. Please try again.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });
      
      let errorMessage = 'Failed to upload proof of payment. ';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage += `Route not found (${error.config?.url}). Please check if the backend server is running and has the upload-deposit-proof route configured.`;
        } else if (error.response.status === 401) {
          errorMessage += 'Your session has expired. Please login again.';
          setTimeout(() => navigate('/login'), 2000);
        } else if (error.response.status === 400) {
          errorMessage += error.response.data?.message || 'Bad request. Please check your file.';
        } else if (error.response.status === 500) {
          errorMessage += 'Server error. Please try again later or contact support.';
        } else {
          errorMessage += error.response.data?.message || `Server error (${error.response.status})`;
        }
      } else if (error.request) {
        errorMessage += 'No response from server. Please check if the backend is running at: ' + API_URL;
      } else {
        errorMessage += error.message;
      }
      
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container">
      <div className="upload-container">
        <h1 className="upload-title">Upload Proof of Payment for Deposit</h1>
        
        <div className="upload-card">
          <h3>Instructions</h3>
          <ol className="instructions-list">
            <li>Make your payment using the details provided on the deposit page</li>
            <li>Take a screenshot or photo of your payment confirmation</li>
            <li>Upload the proof below</li>
            <li>Wait for admin approval (you'll receive a notification)</li>
          </ol>
        </div>

        <div className="upload-card">
          <h3>Upload Proof</h3>
          
          <div className="file-upload-section">
            <input
              type="file"
              onChange={handleFileChange}
              className="file-upload"
              accept=".jpg,.jpeg,.png,.pdf"
            />
            
            {proofFile && (
              <div className="file-preview">
                <p><strong>Selected file:</strong> {proofFile.name}</p>
                <p><strong>Size:</strong> {(proofFile.size / 1024).toFixed(2)} KB</p>
                <p><strong>Type:</strong> {proofFile.type}</p>
              </div>
            )}
          </div>

          <button 
            className="upload-button" 
            onClick={handleUpload}
            disabled={!proofFile || uploading}
          >
            {uploading ? 'Uploading...' : 'Send Proof of Payment'}
          </button>

          {message && (
            <div className={`message ${messageType}`}>
              {message}
            </div>
          )}

          <div className="important-note">
            <strong>Note:</strong> 
            <ul>
              <li>Upload clear images or PDF of your payment confirmation</li>
              <li>Make sure the transaction details are visible</li>
              <li>Your deposit will be processed after admin approval</li>
              <li>You will receive a notification when your balance is updated</li>
            </ul>
          </div>
        </div>

        <div className="action-buttons">
          <button 
            className="back-button"
            onClick={() => navigate('/dashboard')}
            disabled={uploading}
          >
            Back to Dashboard
          </button>
          
          <button 
            className="try-again-button"
            onClick={() => {
              setProofFile(null);
              setMessage('');
              const fileInput = document.querySelector('.file-upload');
              if (fileInput) fileInput.value = '';
            }}
            disabled={uploading}
          >
            Clear Selection
          </button>
        </div>

        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="debug-info">
            <small>
              Debug: API URL: {API_URL} | Endpoint: {getApiEndpoint('/api/user/upload-deposit-proof')}
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadDepositProof;