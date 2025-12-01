import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UserDashboard.css';

const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const [showPopup, setShowPopup] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(userData);
    fetchNotifications(userData._id);
    fetchUserData(); // Fetch fresh user data
    
    // Set up polling for new notifications every 10 seconds
    const interval = setInterval(() => {
      if (userData._id) {
        fetchNotifications(userData._id);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [navigate]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/user/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.user) {
        // Update localStorage and state with fresh user data
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchNotifications = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/user/notifications/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const joinFacebookGroup = () => {
    window.open('https://www.facebook.com/groups/1460227851332998/?ref=share&mibextid=NSMWBT', '_blank');
  };

  const handleUnlockAccess = () => {
    navigate('/unlock-access');
  };

  const handleSendWhatsAppMessage = () => {
    window.open('https://wa.me/447398871333', '_blank');
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  const hasPlan = user.plans && user.plans.length > 0;

  // Create display notifications - if no notifications, show default message
  const displayNotifications = notifications.length > 0 
    ? notifications 
    : [{
        _id: 'default-notification',
        message: 'Click the "Unlock Access to Winning Numbers" button above to start winning big!',
        createdAt: new Date()
      }];

  return (
    <div className="container">
      {/* Popup for Facebook Group */}
      {showPopup && (
        <div className="popup">
          <h3>Join Our Facebook Group</h3>
          <p>Stay updated with the latest news and winning numbers by joining our Facebook group.</p>
          <button className="action-button" onClick={joinFacebookGroup}>
            Join Facebook Group
          </button>
          <button 
            className="action-button close-button"
            onClick={() => setShowPopup(false)}
          >
            Close
          </button>
        </div>
      )}

      <h1 className="welcome-message">Welcome, {user.name}!</h1>

      <div className="dashboard-grid">
        {/* Unlock Access Button */}
        <div className="card unlock-access-card">
          <h3>Unlock Access</h3>
          <p className="unlock-description">
            Click below to unlock access to winning numbers and VIP content
          </p>
          <button 
            className="unlock-access-button"
            onClick={handleUnlockAccess}
          >
            Unlock Access to Winning Numbers
          </button>
        </div>

        {/* Plans */}
        <div className="card plan-card">
          <h3>Your Plan</h3>
          {hasPlan ? (
            <div className="plan-display">
              <div className="current-plan">
                <strong>{user.plans[0]}</strong>
              </div>
              <p className="plan-info">
                This plan gives you access to the selected lottery results
              </p>
            </div>
          ) : (
            <div className="no-plan">
              <p className="no-plan-message">
                You don't have any plan yet, kindly click the <strong>Unlock Access to Winning Numbers</strong> button below to subscribe for a plan.
              </p>
            </div>
          )}
        </div>

        {/* Contact Admin via WhatsApp */}
        <div className="card">
          <h3>Contact Admin</h3>
          <p className="whatsapp-description">
            Need help or have questions? Message the admin directly on WhatsApp
          </p>
          <button 
            className="whatsapp-button"
            onClick={handleSendWhatsAppMessage}
          >
            <span className="whatsapp-icon">📱</span>
            Send Message via WhatsApp
          </button>
        </div>

        {/* Notifications */}
        <div className="card notifications-card">
          <div className="notifications-header">
            <h3>Notifications</h3>
            <button 
              className="refresh-button"
              onClick={() => {
                user._id && fetchNotifications(user._id);
                fetchUserData();
              }}
            >
              Refresh
            </button>
          </div>
          <div className="notifications-list">
            {displayNotifications.length > 0 ? (
              displayNotifications.map((notification) => (
                <div key={notification._id} className="notification-item">
                  <div className="notification-content">
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-time">
                      {new Date(notification.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No new notifications</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;