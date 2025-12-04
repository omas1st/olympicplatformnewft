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
  const [searchTerm, setSearchTerm] = useState(''); // For search functionality

  useEffect(() => {
    fetchUsers();
    fetchAccessPin();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      
      // Sort users by createdAt in descending order (newest first)
      const sortedUsers = response.data.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.updatedAt || 0);
        const dateB = new Date(b.createdAt || b.updatedAt || 0);
        return dateB - dateA; // Newest first
      });
      
      setUsers(sortedUsers);
      
      // Initialize selected plans from user data
      const initialPlans = {};
      sortedUsers.forEach(user => {
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

  const handleSetUserPin = async (userId, userName) => {
    const userPin = prompt(`Enter a 5-digit PIN for user ${userName}:`);
    if (userPin) {
      // Validate PIN format
      if (userPin.length !== 5 || !/^\d+$/.test(userPin)) {
        alert('PIN must be exactly 5 digits');
        return;
      }
      
      try {
        const response = await api.post(`/admin/set-user-pin/${userId}`, { pin: userPin });
        if (response.data.success) {
          alert('User PIN set successfully');
          // Refresh users to show updated info
          fetchUsers();
        } else {
          alert('Failed to set user PIN: ' + (response.data.message || 'Unknown error'));
        }
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

  const handleRefreshUsers = () => {
    fetchUsers();
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.name && user.name.toLowerCase().includes(searchLower)) ||
      (user.email && user.email.toLowerCase().includes(searchLower)) ||
      (user.whatsapp && user.whatsapp.includes(searchTerm)) ||
      (user.country && user.country.toLowerCase().includes(searchLower))
    );
  });

  const planOptions = [
    '1 Day - (3 numbers + bonus lunchtime only) - R700',
    '1 Day - (3 numbers + bonus teatime only) - R700',
    '1 Day - (4 numbers + bonus - Powerball) - R1000',
    '3 Days - (3 numbers + bonus lunchtime) - R2000',
    '3 Days - (3 numbers + bonus teatime) - R2000',
    '7 Days - (3 numbers + bonus lunchtime) - R4500',
    '7 Days - (3 numbers + bonus teatime) - R4500',
    '4 numbers (Russian Goslotto) - R700',
    '7 days lunchtime and teatime - R2000'
  ];

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
      <div style={{ 
        marginBottom: '20px', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ color: '#666' }}>
          Total Users: {users.length} | Showing: {filteredUsers.length}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              width: '250px'
            }}
          />
          <button 
            style={{...buttonStyle, backgroundColor: '#3498db'}}
            onClick={handleRefreshUsers}
          >
            Refresh List
          </button>
        </div>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '18px', color: '#666' }}>Loading users...</div>
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>#</th>
                  <th style={tableHeaderStyle}>Registered</th>
                  <th style={tableHeaderStyle}>Name</th>
                  <th style={tableHeaderStyle}>Email</th>
                  <th style={tableHeaderStyle}>WhatsApp</th>
                  <th style={tableHeaderStyle}>Country</th>
                  <th style={tableHeaderStyle}>Status</th>
                  <th style={tableHeaderStyle}>Current Plan</th>
                  <th style={tableHeaderStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr key={user._id} style={{ 
                    backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9',
                    borderBottom: '1px solid #eee'
                  }}>
                    <td style={{...tableCellStyle, textAlign: 'center', fontWeight: 'bold'}}>
                      {index + 1}
                    </td>
                    <td style={{...tableCellStyle, fontSize: '0.85rem', color: '#666'}}>
                      {formatDate(user.createdAt)}
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ fontWeight: '500' }}>{user.name}</div>
                      {user.personalPin && (
                        <div style={{ fontSize: '0.8rem', color: '#27ae60', marginTop: '2px' }}>
                          <strong>PIN:</strong> {user.personalPin}
                        </div>
                      )}
                    </td>
                    <td style={tableCellStyle}>{user.email}</td>
                    <td style={tableCellStyle}>{user.whatsapp}</td>
                    <td style={tableCellStyle}>{user.country}</td>
                    <td style={tableCellStyle}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        backgroundColor: user.isVerified ? '#d4edda' : '#f8d7da',
                        color: user.isVerified ? '#155724' : '#721c24'
                      }}>
                        {user.isVerified ? 'Verified' : 'Not Verified'}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      {user.plans && user.plans.length > 0 ? (
                        <div style={{ 
                          backgroundColor: '#e8f4fc',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.85rem'
                        }}>
                          {user.plans[0]}
                        </div>
                      ) : (
                        <span style={{ color: '#999', fontStyle: 'italic' }}>No plan</span>
                      )}
                    </td>
                    <td style={{...tableCellStyle, minWidth: '250px'}}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button 
                            style={{...buttonStyle, backgroundColor: '#3498db', flex: 1}}
                            onClick={() => setSelectedUser(user)}
                            title="Send message"
                          >
                            Message
                          </button>
                          <button 
                            style={{...buttonStyle, backgroundColor: '#e67e22', flex: 1}}
                            onClick={() => handleSetUserPin(user._id, user.name)}
                            title="Set personal PIN"
                          >
                            Set PIN
                          </button>
                        </div>
                        <div>
                          <select
                            value={selectedPlans[user._id] || ''}
                            onChange={(e) => {
                              const newPlan = e.target.value;
                              if (newPlan) {
                                handleSetUserPlan(user._id, newPlan);
                              }
                            }}
                            style={{
                              padding: '8px',
                              borderRadius: '4px',
                              border: '1px solid #ddd',
                              width: '100%',
                              fontSize: '0.85rem',
                              backgroundColor: '#fff'
                            }}
                          >
                            <option value="">Select Plan</option>
                            {planOptions.map((plan, index) => (
                              <option key={index} value={plan}>{plan}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && !loading && (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#666',
              border: '1px dashed #ddd',
              borderRadius: '5px',
              marginTop: '20px'
            }}>
              {searchTerm ? 'No users found matching your search' : 'No users found'}
            </div>
          )}
        </>
      )}

      {selectedUser && (
        <div style={{ 
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{ 
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Send Message to {selectedUser.name}</h3>
              <button 
                onClick={() => {
                  setSelectedUser(null);
                  setMessage('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="6"
              placeholder="Type your message here..."
              style={{ 
                width: '100%', 
                marginBottom: '20px', 
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                style={{...buttonStyle, backgroundColor: '#27ae60', flex: 1, padding: '12px'}}
                onClick={() => handleMessageSend(selectedUser._id)}
              >
                Send Message
              </button>
              <button 
                style={{...buttonStyle, backgroundColor: '#95a5a6', flex: 1, padding: '12px'}}
                onClick={() => {
                  setSelectedUser(null);
                  setMessage('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const tableHeaderStyle = {
  border: '1px solid #ddd',
  padding: '12px',
  backgroundColor: '#2c3e50',
  color: 'white',
  textAlign: 'left',
  fontSize: '0.9rem',
  fontWeight: '600',
  whiteSpace: 'nowrap'
};

const tableCellStyle = {
  border: '1px solid #ddd',
  padding: '12px',
  textAlign: 'left',
  fontSize: '0.9rem',
  verticalAlign: 'top'
};

const buttonStyle = {
  color: 'white',
  border: 'none',
  padding: '8px 12px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.85rem',
  fontWeight: '500',
  transition: 'background-color 0.2s'
};

export default AdminUserInfo;