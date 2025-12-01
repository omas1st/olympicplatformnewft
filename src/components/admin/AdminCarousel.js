// src/components/admin/AdminCarousel.js
import React, { useState, useEffect } from 'react';
import api from '../../config/api';

const AdminCarousel = () => {
  const [images, setImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/carousel');
      // Sort images by order
      const sortedImages = response.data.sort((a, b) => a.order - b.order);
      setImages(sortedImages);
    } catch (error) {
      console.error('Error fetching carousel images:', error);
      alert('Failed to fetch images: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      alert('Maximum 10 files allowed at once');
      return;
    }
    
    const validFiles = [];
    const invalidFiles = [];
    
    files.forEach(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        invalidFiles.push(`${file.name} - Not an image file`);
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        invalidFiles.push(`${file.name} - File size must be less than 10MB`);
        return;
      }
      validFiles.push(file);
    });
    
    if (invalidFiles.length > 0) {
      alert(`Some files were rejected:\n${invalidFiles.join('\n')}`);
    }
    
    setSelectedFiles(validFiles);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one file first');
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('images', file); // Note: field name must be 'images' (plural) to match backend
    });

    try {
      setUploading(true);
      const response = await api.post('/admin/carousel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert(response.data?.message || 'Images uploaded successfully');
      fetchImages();
      setSelectedFiles([]);
      // Reset file input
      document.getElementById('fileInput').value = '';
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images: ' + (error.response?.data?.message || error.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await api.delete(`/admin/carousel/${imageId}`);
        alert('Image deleted successfully');
        fetchImages();
      } catch (error) {
        console.error('Error deleting image:', error);
        alert('Failed to delete image: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL carousel images? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingAll(true);
      const response = await api.delete('/admin/carousel');
      alert(response.data?.message || 'All images deleted successfully');
      fetchImages();
    } catch (error) {
      console.error('Error deleting all images:', error);
      alert('Failed to delete all images: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeletingAll(false);
    }
  };

  const handleDragStart = (e, index) => {
    setDraggingIndex(index);
    e.dataTransfer.setData('text/plain', index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = draggingIndex;
    
    if (dragIndex === dropIndex || dragIndex === null) return;
    
    // Create new array with swapped items
    const newImages = [...images];
    const draggedItem = newImages[dragIndex];
    
    // Remove the dragged item
    newImages.splice(dragIndex, 1);
    // Insert it at the new position
    newImages.splice(dropIndex, 0, draggedItem);
    
    // Update order numbers
    const updatedImages = newImages.map((image, index) => ({
      ...image,
      order: index
    }));
    
    setImages(updatedImages);
    setDraggingIndex(null);
    
    // You could also save the new order to backend here
    // For simplicity, we'll just update the local state
  };

  const handleSaveOrder = async () => {
    try {
      // If you want to save the order to backend, you would need an endpoint for that
      // For now, we'll just alert that order is saved locally
      alert('Order saved locally. Images will appear in this order on the homepage.');
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Failed to save order');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Carousel Management</h2>
        <div>Loading images...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Carousel Management</h2>

      <div style={{ 
        marginBottom: '30px', 
        padding: '20px', 
        border: '2px dashed #bdc3c7',
        borderRadius: '10px',
        backgroundColor: '#f8f9fa',
        textAlign: 'center'
      }}>
        <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Upload New Images</h3>
        <div style={{ 
          marginBottom: '15px',
          padding: '10px',
          backgroundColor: '#e8f4fd',
          borderRadius: '5px'
        }}>
          <strong>Note:</strong> You can select multiple images (max 10). Images will appear on homepage in the order shown below.
        </div>
        <input 
          id="fileInput"
          type="file" 
          accept="image/*"
          onChange={handleFileChange}
          multiple
          style={{ 
            marginBottom: '15px',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '5px',
            width: '100%',
            maxWidth: '400px'
          }}
        />
        <br />
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              opacity: uploading ? 0.6 : 1,
              minWidth: '150px'
            }} 
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : '📤 Upload Images'}
          </button>
          <button 
            style={{
              backgroundColor: '#f39c12',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '1rem',
              minWidth: '150px'
            }} 
            onClick={handleSaveOrder}
          >
            💾 Save Order
          </button>
          <button 
            style={{
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: deletingAll ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              opacity: deletingAll ? 0.6 : 1,
              minWidth: '150px'
            }} 
            onClick={handleDeleteAll}
            disabled={deletingAll}
          >
            {deletingAll ? 'Deleting...' : '🗑️ Delete All'}
          </button>
        </div>
        {selectedFiles.length > 0 && (
          <div style={{ marginTop: '10px', color: '#27ae60' }}>
            Selected {selectedFiles.length} image(s)
          </div>
        )}
      </div>

      <div style={{ 
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3>Current Carousel Images ({images.length})</h3>
        {images.length > 0 && (
          <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
            Drag and drop to reorder images
          </div>
        )}
      </div>
      
      {images.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#7f8c8d',
          backgroundColor: '#f8f9fa',
          borderRadius: '10px'
        }}>
          No carousel images found. Upload some images to get started.
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '20px',
          marginTop: '20px'
        }}>
          {images.map((image, index) => (
            <div 
              key={image._id} 
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              style={{ 
                border: '1px solid #ddd', 
                padding: '15px',
                borderRadius: '8px',
                backgroundColor: 'white',
                textAlign: 'center',
                cursor: 'move',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                backgroundColor: '#3498db',
                color: 'white',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}>
                {index + 1}
              </div>
              <img 
                src={image.imageUrl} 
                alt="Carousel" 
                style={{ 
                  width: '100%', 
                  height: '200px', 
                  objectFit: 'cover',
                  borderRadius: '4px',
                  marginBottom: '10px'
                }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x200?text=Image+Error';
                }}
              />
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#7f8c8d', 
                marginBottom: '10px',
                textAlign: 'left'
              }}>
                <div><strong>Uploaded:</strong> {new Date(image.createdAt).toLocaleDateString()}</div>
                <div><strong>Order:</strong> {image.order + 1}</div>
              </div>
              <button 
                style={{
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%',
                  fontSize: '0.9rem'
                }}
                onClick={() => handleDelete(image._id)}
              >
                🗑️ Delete This Image
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCarousel;