// src/components/admin/AdminUpdateBalance.js
import React, { useState, useEffect } from 'react';
import api from '../../config/api';

const AdminUpdateBalance = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [balance, setBalance] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const plans = [
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Failed to fetch users: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBalance = async () => {
    if (!selectedUser) {
      alert('Please select a user first');
      return;
    }

    if (!balance || isNaN(balance) || parseFloat(balance) < 0) {
      alert('Please enter a valid balance amount');
      return;
    }

    try {
      setUpdating(true);
      await api.post(`/admin/update-balance/${selectedUser}`, { 
        balance: parseFloat(balance) 
      });
      alert('Balance updated successfully');
      setBalance('');
      // Refresh users list to get updated balances
      fetchUsers();
    } catch (error) {
      console.error('Error updating balance:', error);
      alert('Failed to update balance: ' + (error.response?.data?.message || error.message));
    } finally {
      setUpdating(false);
    }
  };

  const handleActivatePlan = async () => {
    if (!selectedUser) {
      alert('Please select a user first');
      return;
    }

    if (!selectedPlan) {
      alert('Please select a plan first');
      return;
    }

    try {
      setUpdating(true);
      await api.post(`/admin/activate-plan/${selectedUser}`, { 
        plan: selectedPlan 
      });
      alert('Plan activated successfully');
      setSelectedPlan('');
      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Error activating plan:', error);
      alert('Failed to activate plan: ' + (error.response?.data?.message || error.message));
    } finally {
      setUpdating(false);
    }
  };

  const selectedUserData = users.find(user => user._id === selectedUser);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Update User Balance and Plans</h2>

      <div style={{ 
        marginBottom: '30px', 
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Select User: </label>
        <select 
          value={selectedUser} 
          onChange={(e) => setSelectedUser(e.target.value)}
          style={{ 
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            minWidth: '250px'
          }}
          disabled={loading}
        >
          <option value="">Select User</option>
          {users.map(user => (
            <option key={user._id} value={user._id}>
              {user.name} - {user.email} (Balance: ${user.balance || 0})
            </option>
          ))}
        </select>
      </div>

      {loading && <div>Loading users...</div>}

      {selectedUser && selectedUserData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {/* Balance Update Section */}
          <div style={{ 
            padding: '25px',
            border: '2px solid #3498db',
            borderRadius: '10px',
            backgroundColor: 'white'
          }}>
            <h3 style={{ color: '#3498db', marginBottom: '20px' }}>💵 Update Balance</h3>
            <div style={{ marginBottom: '15px' }}>
              <strong>Current Balance:</strong> ${selectedUserData.balance || 0}
            </div>
            <div style={{ marginBottom: '20px' }}>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="Enter new balance"
                style={{ 
                  width: '100%', 
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
                min="0"
                step="0.01"
              />
            </div>
            <button 
              style={{
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: updating ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                width: '100%',
                opacity: updating ? 0.6 : 1
              }} 
              onClick={handleUpdateBalance}
              disabled={updating}
            >
              {updating ? 'Updating...' : '💾 Update Balance'}
            </button>
          </div>

          {/* Plan Activation Section */}
          <div style={{ 
            padding: '25px',
            border: '2px solid #9b59b6',
            borderRadius: '10px',
            backgroundColor: 'white'
          }}>
            <h3 style={{ color: '#9b59b6', marginBottom: '20px' }}>📋 Activate Plan</h3>
            <div style={{ marginBottom: '15px' }}>
              <strong>Current Plans:</strong> {selectedUserData.plans?.length > 0 ? selectedUserData.plans.join(', ') : 'None'}
            </div>
            <div style={{ marginBottom: '20px' }}>
              <select 
                value={selectedPlan} 
                onChange={(e) => setSelectedPlan(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              >
                <option value="">Select Plan</option>
                {plans.map(plan => (
                  <option key={plan} value={plan}>{plan}</option>
                ))}
              </select>
            </div>
            <button 
              style={{
                backgroundColor: '#e67e22',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: updating ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                width: '100%',
                opacity: updating ? 0.6 : 1
              }} 
              onClick={handleActivatePlan}
              disabled={updating || !selectedPlan}
            >
              {updating ? 'Activating...' : '🚀 Activate Plan'}
            </button>
          </div>
        </div>
      )}

      {!selectedUser && !loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#7f8c8d',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          Please select a user to manage their balance and plans
        </div>
      )}
    </div>
  );
};

export default AdminUpdateBalance;