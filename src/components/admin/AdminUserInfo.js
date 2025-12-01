import React, { useState, useEffect } from 'react';
import api from '../../config/api';

const AdminUserInfo = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [accessPin, setAccessPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMessage, setPinMessage] = useState('');
  const [selectedPlans, setSelectedPlans] = useState({}); // Store plans per user

  useEffect(() => {
    fetchUsers();
    fetchAccessPin();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.data);
      
      // Initialize selected plans from user data
      const initialPlans = {};
      response.data.forEach(user => {
        if (user.plans && user.plans.length > 0) {
          initialPlans[user._id] = user.plans[0];
        }
      });
      setSelectedPlans(initialPlans);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Failed to fetch users: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchAccessPin = async () => {
    try {
      const response = await api.get('/admin/access-pin');
      setAccessPin(response.data.pin);
    } catch (error) {
      console.error('Error fetching access PIN:', error);
      setAccessPin('68120');
    }
  };

  const handleMessageSend = async (userId) => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    try {
      await api.post(`/admin/message/${userId}`, { message });
      alert('Message sent successfully');
      setMessage('');
      setSelectedUser(null);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSetUserPin = async (userId) => {
    const userPin = prompt(`Enter a PIN for user ${userId}:`);
    if (userPin) {
      try {
        await api.post(`/admin/set-user-pin/${userId}`, { pin: userPin });
        alert('User PIN set successfully');
      } catch (error) {
        console.error('Error setting user PIN:', error);
        alert('Failed to set user PIN: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleSetUserPlan = async (userId, plan) => {
    if (!plan) {
      return; // Don't alert if empty selection
    }

    try {
      const response = await api.post(`/admin/set-user-plan/${userId}`, { plan });
      
      if (response.data.success) {
        // Update local state immediately
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === userId 
              ? { ...user, plans: [plan] }
              : user
          )
        );
        
        // Update selected plans
        setSelectedPlans(prev => ({
          ...prev,
          [userId]: plan
        }));
        
        console.log('Plan updated successfully for user:', userId, plan);
      }
    } catch (error) {
      console.error('Error setting user plan:', error);
      alert('Failed to set user plan: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateAccessPin = async () => {
    if (!accessPin.trim()) {
      setPinMessage('Please enter a PIN');
      return;
    }

    if (accessPin.length !== 5 || !/^\d+$/.test(accessPin)) {
      setPinMessage('PIN must be exactly 5 digits');
      return;
    }

    if (accessPin !== confirmPin) {
      setPinMessage('PINs do not match');
      return;
    }

    try {
      await api.put('/admin/access-pin', { pin: accessPin });
      setPinMessage('Access PIN updated successfully!');
      
      setTimeout(() => {
        setPinMessage('');
        setShowPinModal(false);
        setConfirmPin('');
      }, 3000);
    } catch (error) {
      console.error('Error updating access PIN:', error);
      setPinMessage('Failed to update PIN: ' + (error.response?.data?.message || error.message));
    }
  };

  const planOptions = [
    '3 days lunchtime',
    '3 days teatime',
    '3 days lunchtime and teatime',
    '5 days lunchtime',
    '5 days teatime',
    '5 days lunchtime and teatime',
    '7 days lunchtime',
    '7 days teatime',
    '7 days lunchtime and teatime'
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h2>User Information</h2>
      
      {/* Access PIN Management Section */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '20px', 
        border: '1px solid #ddd',
        backgroundColor: '#f9f9f9',
        borderRadius: '5px'
      }}>
        <h3>Access PIN Management</h3>
        <p><strong>Current Unlock Access PIN:</strong> {accessPin}</p>
        <button 
          style={{...buttonStyle, backgroundColor: '#9b59b6'}}
          onClick={() => setShowPinModal(true)}
        >
          Change Unlock Access PIN
        </button>
        {pinMessage && (
          <div style={{ 
            marginTop: '10px', 
            padding: '10px',
            backgroundColor: pinMessage.includes('success') ? '#d4edda' : '#f8d7da',
            border: pinMessage.includes('success') ? '1px solid #c3e6cb' : '1px solid #f5c6cb',
            borderRadius: '4px',
            color: pinMessage.includes('success') ? '#155724' : '#721c24'
          }}>
            {pinMessage}
          </div>
        )}
      </div>

      {showPinModal && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          minWidth: '400px'
        }}>
          <h3 style={{ marginTop: 0 }}>Change Unlock Access PIN</h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              New 5-digit PIN:
            </label>
            <input
              type="text"
              value={accessPin}
              onChange={(e) => setAccessPin(e.target.value)}
              maxLength="5"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1.1rem',
                textAlign: 'center',
                letterSpacing: '2px',
                fontFamily: 'monospace'
              }}
              placeholder="Enter 5 digits"
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Confirm PIN:
            </label>
            <input
              type="text"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              maxLength="5"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1.1rem',
                textAlign: 'center',
                letterSpacing: '2px',
                fontFamily: 'monospace'
              }}
              placeholder="Confirm 5 digits"
            />
          </div>
          <div>
            <button 
              style={{...buttonStyle, backgroundColor: '#27ae60'}}
              onClick={handleUpdateAccessPin}
            >
              Update PIN
            </button>
            <button 
              style={{...buttonStyle, backgroundColor: '#95a5a6'}}
              onClick={() => {
                setShowPinModal(false);
                setConfirmPin('');
                setPinMessage('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users Table Section */}
      <div style={{ marginBottom: '20px', color: '#666' }}>
        Total Users: {users.length}
      </div>
      
      {loading ? (
        <div>Loading users...</div>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Name</th>
                <th style={tableHeaderStyle}>Email</th>
                <th style={tableHeaderStyle}>WhatsApp</th>
                <th style={tableHeaderStyle}>Country</th>
                <th style={tableHeaderStyle}>Current Plan</th>
                <th style={tableHeaderStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td style={tableCellStyle}>{user.name}</td>
                  <td style={tableCellStyle}>{user.email}</td>
                  <td style={tableCellStyle}>{user.whatsapp}</td>
                  <td style={tableCellStyle}>{user.country}</td>
                  <td style={tableCellStyle}>
                    {user.plans && user.plans.length > 0 ? user.plans[0] : 'No plan'}
                  </td>
                  <td style={tableCellStyle}>
                    <button 
                      style={{...buttonStyle, backgroundColor: '#3498db'}}
                      onClick={() => setSelectedUser(user)}
                    >
                      Message
                    </button>
                    <button 
                      style={{...buttonStyle, backgroundColor: '#e67e22'}}
                      onClick={() => handleSetUserPin(user._id)}
                    >
                      Set User PIN
                    </button>
                    <div style={{ marginTop: '5px' }}>
                      <select
                        value={selectedPlans[user._id] || ''}
                        onChange={(e) => {
                          const newPlan = e.target.value;
                          if (newPlan) {
                            handleSetUserPlan(user._id, newPlan);
                          }
                        }}
                        style={{
                          padding: '5px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          width: '100%',
                          marginTop: '5px'
                        }}
                      >
                        <option value="">Select Plan</option>
                        {planOptions.map((plan, index) => (
                          <option key={index} value={plan}>{plan}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              No users found
            </div>
          )}
        </>
      )}

      {selectedUser && (
        <div style={{ 
          marginTop: '20px', 
          padding: '20px', 
          border: '1px solid #ddd',
          backgroundColor: '#f9f9f9',
          borderRadius: '5px'
        }}>
          <h3>Send Message to {selectedUser.name}</h3>
          <textarea 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows="4"
            placeholder="Type your message here..."
            style={{ 
              width: '100%', 
              marginBottom: '10px', 
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
          <div>
            <button 
              style={{...buttonStyle, backgroundColor: '#27ae60'}}
              onClick={() => handleMessageSend(selectedUser._id)}
            >
              Send Message
            </button>
            <button 
              style={{...buttonStyle, backgroundColor: '#95a5a6'}}
              onClick={() => {
                setSelectedUser(null);
                setMessage('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const tableHeaderStyle = {
  border: '1px solid #ddd',
  padding: '12px',
  backgroundColor: '#34495e',
  color: 'white',
  textAlign: 'left'
};

const tableCellStyle = {
  border: '1px solid #ddd',
  padding: '12px',
  textAlign: 'left'
};

const buttonStyle = {
  color: 'white',
  border: 'none',
  padding: '8px 12px',
  margin: '0 5px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.9rem'
};

export default AdminUserInfo;