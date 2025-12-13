// src/components/admin/AdminNewPaymentPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminNewPaymentPage.css';

const AdminNewPaymentPage = () => {
  const [paymentPages, setPaymentPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingPage, setEditingPage] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    image: null,
    content: '',
    amount: '',
    nextPage: ''
  });

  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchPaymentPages();
  }, []);

  const fetchPaymentPages = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      const response = await axios.get(
        `${API_URL}/api/admin/payment-pages`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setPaymentPages(response.data.pages);
      }
    } catch (error) {
      console.error('Error fetching payment pages:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.content || !formData.amount) {
      setError('Name, content, and amount are required.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      const data = new FormData();
      data.append('name', formData.name);
      data.append('content', formData.content);
      data.append('amount', formData.amount);
      data.append('nextPage', formData.nextPage || '/dashboard');
      
      if (formData.image) {
        data.append('image', formData.image);
      }

      let response;
      if (editingPage) {
        // Update existing page
        response = await axios.put(
          `${API_URL}/admin/payment-pages/${editingPage._id}`,
          data,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      } else {
        // Create new page
        response = await axios.post(
          `${API_URL}/admin/payment-pages`,
          data,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }

      if (response.data.success) {
        setSuccess(editingPage ? 'Payment page updated successfully!' : 'Payment page created successfully!');
        resetForm();
        fetchPaymentPages();
      } else {
        setError(response.data.message || 'Operation failed.');
      }
    } catch (error) {
      console.error('Save payment page error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (page) => {
    setEditingPage(page);
    setFormData({
      name: page.name,
      image: null,
      content: page.content,
      amount: page.amount,
      nextPage: page.nextPage
    });
    setImagePreview(page.imageUrl || null);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (pageId) => {
    if (!window.confirm('Are you sure you want to delete this payment page?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

      // FIXED: Added '/api' to the delete URL
      const response = await axios.delete(
        `${API_URL}/admin/payment-pages/${pageId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSuccess('Payment page deleted successfully!');
        fetchPaymentPages();
      }
    } catch (error) {
      console.error('Delete payment page error:', error);
      setError('Failed to delete payment page.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      image: null,
      content: '',
      amount: '',
      nextPage: ''
    });
    setImagePreview(null);
    setEditingPage(null);
  };

  return (
    <div className="admin-new-payment-page">
      <h2>{editingPage ? 'Edit Payment Page' : 'Create New Payment Page'}</h2>
      
      <form onSubmit={handleSubmit} className="payment-page-form">
        <div className="form-group">
          <label>Page Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter page name"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Image to Display</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label>Content *</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            placeholder="Enter page content"
            rows="5"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Amount (ZAR) *</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="Enter amount"
            min="1"
            step="0.01"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Next Page (Optional)</label>
          <input
            type="text"
            name="nextPage"
            value={formData.nextPage}
            onChange={handleInputChange}
            placeholder="/dashboard or custom route"
          />
          <small className="help-text">
            Leave empty to redirect to user dashboard
          </small>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {success && (
          <div className="success-message">
            {success}
          </div>
        )}
        
        <div className="form-actions">
          <button
            type="submit"
            className="cta-button"
            disabled={loading}
          >
            {loading ? 'Saving...' : (editingPage ? 'Update Page' : 'Create Page')}
          </button>
          
          {editingPage && (
            <button
              type="button"
              className="cancel-button"
              onClick={resetForm}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>
      
      <div className="payment-pages-list">
        <h3>Existing Payment Pages</h3>
        
        {paymentPages.length === 0 ? (
          <p className="no-pages">No payment pages created yet.</p>
        ) : (
          <div className="pages-grid">
            {paymentPages.map(page => (
              <div key={page._id} className="page-card">
                <div className="page-header">
                  <h4>{page.name}</h4>
                  <div className="page-actions">
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(page)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(page._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {page.imageUrl && (
                  <div className="page-image">
                    <img src={page.imageUrl} alt={page.name} />
                  </div>
                )}
                
                <div className="page-content">
                  <p>{page.content}</p>
                </div>
                
                <div className="page-details">
                  <div className="detail">
                    <strong>Amount:</strong> R {parseFloat(page.amount).toFixed(2)}
                  </div>
                  <div className="detail">
                    <strong>Next Page:</strong> {page.nextPage || '/dashboard'}
                  </div>
                  <div className="detail">
                    <strong>Created:</strong> {new Date(page.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNewPaymentPage;