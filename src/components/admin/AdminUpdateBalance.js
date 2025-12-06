import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import './AdminUpdateBalance.css';

const AdminUpdateBalance = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [balance, setBalance] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [directBalanceEdit, setDirectBalanceEdit] = useState('');
  const [selectedUserForEdit, setSelectedUserForEdit] = useState('');

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
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch users first
        const usersResponse = await api.get('/admin/users');
        setUsers(usersResponse.data);
        
        // Then fetch pending deposits
        const depositsResponse = await api.get('/admin/pending-deposits');
        // Make sure deposits have user info populated
        const depositsWithUserInfo = await Promise.all(
          depositsResponse.data.map(async (deposit) => {
            try {
              // If deposit.user is just an ID, fetch the user details
              if (typeof deposit.user === 'string') {
                try {
                  const userResponse = await api.get(`/admin/user/${deposit.user}`);
                  return {
                    ...deposit,
                    user: userResponse.data || { name: 'Loading...', email: 'N/A' }
                  };
                } catch (userError) {
                  console.error('Error fetching user for deposit:', userError);
                  // Try to find user in the users array
                  const foundUser = usersResponse.data.find(u => u._id === deposit.user);
                  return {
                    ...deposit,
                    user: foundUser || { name: 'User Not Found', email: 'N/A' }
                  };
                }
              }
              // If deposit.user is already an object, return as is
              return deposit;
            } catch (error) {
              console.error('Error processing deposit:', error);
              return {
                ...deposit,
                user: { name: 'User Not Found', email: 'N/A' }
              };
            }
          })
        );
        setPendingDeposits(depositsWithUserInfo);
      } catch (error) {
        console.error('Error fetching data:', error);
        if (error.response?.data?.message) {
          alert('Failed to fetch data: ' + error.response.data.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array since we're fetching everything in one go

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

  const fetchPendingDeposits = async () => {
    try {
      const response = await api.get('/admin/pending-deposits');
      // Make sure deposits have user info populated
      const depositsWithUserInfo = await Promise.all(
        response.data.map(async (deposit) => {
          try {
            // If deposit.user is just an ID, fetch the user details
            if (typeof deposit.user === 'string') {
              try {
                const userResponse = await api.get(`/admin/user/${deposit.user}`);
                return {
                  ...deposit,
                  user: userResponse.data || { name: 'Loading...', email: 'N/A' }
                };
              } catch (userError) {
                console.error('Error fetching user for deposit:', userError);
                // Try to find user in the users array
                const foundUser = users.find(u => u._id === deposit.user);
                return {
                  ...deposit,
                  user: foundUser || { name: 'User Not Found', email: 'N/A' }
                };
              }
            }
            // If deposit.user is already an object, return as is
            return deposit;
          } catch (error) {
            console.error('Error processing deposit:', error);
            return {
              ...deposit,
              user: { name: 'User Not Found', email: 'N/A' }
            };
          }
        })
      );
      setPendingDeposits(depositsWithUserInfo);
    } catch (error) {
      console.error('Error fetching pending deposits:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert('Failed to fetch pending deposits: ' + (error.response?.data?.message || error.message));
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
      await api.post(`/admin/balance/${selectedUser}`, { 
        balance: parseFloat(balance) 
      });
      alert('Balance updated successfully');
      setBalance('');
      // Refresh users list to get updated balances
      fetchUsers();
    } catch (error) {
      console.error('Error updating balance:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert('Failed to update balance: ' + (error.response?.data?.message || error.message));
    } finally {
      setUpdating(false);
    }
  };

  const handleDirectBalanceUpdate = async () => {
    if (!selectedUserForEdit) {
      alert('Please select a user first');
      return;
    }

    if (!directBalanceEdit || isNaN(directBalanceEdit) || parseFloat(directBalanceEdit) < 0) {
      alert('Please enter a valid balance amount');
      return;
    }

    try {
      setUpdating(true);
      console.log('Updating balance for user:', selectedUserForEdit);
      console.log('New balance:', directBalanceEdit);
      
      // Try multiple endpoint formats to ensure compatibility
      let response;
      try {
        // First try the standard endpoint
        response = await api.post(`/admin/balance/${selectedUserForEdit}`, { 
          balance: parseFloat(directBalanceEdit) 
        });
      } catch (firstError) {
        console.log('First endpoint failed, trying alternative...');
        // Try alternative endpoint
        response = await api.post(`/admin/update-balance/${selectedUserForEdit}`, { 
          balance: parseFloat(directBalanceEdit) 
        });
      }
      
      console.log('Update response:', response.data);
      alert('Balance updated successfully');
      setDirectBalanceEdit('');
      // Refresh users list to get updated balances
      fetchUsers();
    } catch (error) {
      console.error('Error updating balance:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      
      let errorMessage = 'Failed to update balance: ';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage += `Route not found (${error.config?.url}). Please check if the backend server has the /admin/balance/:userId route configured.`;
        } else if (error.response.status === 400) {
          errorMessage += error.response.data?.message || 'Bad request';
        } else if (error.response.status === 500) {
          errorMessage += 'Server error. Please check backend logs.';
        } else {
          errorMessage += error.response.data?.message || `Error ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage += 'No response from server. Please check if the backend is running.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
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

  const handleApproveDeposit = async (depositId, userId) => {
    try {
      const response = await api.post(`/admin/approve-deposit/${depositId}`);
      if (response.data.success) {
        alert('Deposit approved successfully');
        // Refresh deposits and users
        fetchPendingDeposits();
        fetchUsers();
      }
    } catch (error) {
      console.error('Error approving deposit:', error);
      alert('Failed to approve deposit: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRejectDeposit = async (depositId, depositAmount, userName) => {
    // Ask for rejection reason
    const reason = prompt(`Enter rejection reason for ${userName}'s deposit (R${depositAmount.toFixed(2)}):`, 'Payment proof unclear or incomplete');
    
    if (reason === null) {
      // User cancelled the prompt
      return;
    }

    if (!reason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      const response = await api.post(`/admin/reject-deposit/${depositId}`, {
        reason: reason.trim()
      });
      
      if (response.data.success) {
        alert(`Deposit rejected successfully. User's balance remains unchanged.`);
        // Refresh deposits
        fetchPendingDeposits();
      } else {
        alert('Failed to reject deposit: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error rejecting deposit:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert('Failed to reject deposit: ' + (error.response?.data?.message || error.message));
    }
  };

  const selectedUserData = users.find(user => user._id === selectedUser);

  return (
    <div className="admin-update-balance-container">
      <h2 className="page-title">Update User Balance and Plans</h2>

      {/* Direct Balance Edit Section */}
      <div className="direct-balance-container">
        <h3 className="section-title direct-balance-title">💰 Direct Balance Editor</h3>
        
        <div className="direct-balance-controls">
          <div className="user-select-container">
            <label className="control-label">Select User: </label>
            <select 
              value={selectedUserForEdit} 
              onChange={(e) => setSelectedUserForEdit(e.target.value)}
              className="user-select"
              disabled={loading}
            >
              <option value="">Select User</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.name} - {user.email} (R{user.balance || 0})
                </option>
              ))}
            </select>
          </div>
          
          <div className="balance-input-container">
            <input
              type="number"
              value={directBalanceEdit}
              onChange={(e) => setDirectBalanceEdit(e.target.value)}
              placeholder="Enter new balance (ZAR)"
              className="balance-input"
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="update-button-container">
            <button 
              className="update-button"
              onClick={handleDirectBalanceUpdate}
              disabled={updating || !selectedUserForEdit || !directBalanceEdit}
            >
              {updating ? 'Updating...' : '💾 Update Balance'}
            </button>
          </div>
        </div>
        
        <div className="balance-note">
          <strong>Note:</strong> This will directly set the user's balance. The updated balance will be reflected on the user's dashboard.
        </div>
      </div>

      {/* Pending Deposits Section */}
      <div className="pending-deposits-container">
        <h3 className="section-title pending-deposits-title">⏳ Pending Deposit Approvals</h3>
        
        {pendingDeposits.length === 0 ? (
          <div className="no-deposits-message">
            No pending deposits to approve.
          </div>
        ) : (
          <div className="deposits-table-container">
            <table className="deposits-table">
              <thead>
                <tr>
                  <th className="table-header">User</th>
                  <th className="table-header">Amount (ZAR)</th>
                  <th className="table-header">Payment Method</th>
                  <th className="table-header">Proof</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingDeposits.map((deposit) => {
                  // Get user info - either from populated deposit.user or find in users array
                  let userInfo = deposit.user;
                  if (typeof deposit.user === 'string') {
                    // If it's just an ID, try to find in users array
                    userInfo = users.find(u => u._id === deposit.user) || { 
                      name: 'Loading...', 
                      email: 'N/A' 
                    };
                  }
                  
                  return (
                    <tr key={deposit._id} className="deposit-row">
                      <td className="table-cell user-cell">
                        <div className="user-info">
                          <div className="user-name">{userInfo.name || 'User Not Found'}</div>
                          <div className="user-email">{userInfo.email || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="table-cell amount-cell">
                        <span className="amount-value">R {deposit.amount?.toFixed(2) || '0.00'}</span>
                      </td>
                      <td className="table-cell method-cell">
                        {deposit.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 
                         deposit.paymentMethod === 'cryptocurrency' ? 'Cryptocurrency' : 'Unknown'}
                      </td>
                      <td className="table-cell proof-cell">
                        {deposit.proofUrl ? (
                          <a 
                            href={deposit.proofUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="proof-link"
                          >
                            View Proof
                          </a>
                        ) : 'No proof uploaded'}
                      </td>
                      <td className="table-cell date-cell">
                        {deposit.createdAt ? new Date(deposit.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="table-cell actions-cell">
                        <div className="action-buttons">
                          <button 
                            className="approve-button"
                            onClick={() => handleApproveDeposit(deposit._id, deposit.user?._id || deposit.user)}
                          >
                            Approve
                          </button>
                          <button 
                            className="reject-button"
                            onClick={() => handleRejectDeposit(
                              deposit._id, 
                              deposit.amount, 
                              userInfo.name || 'User'
                            )}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Original Balance Update and Plan Activation Section */}
      <div className="user-select-section">
        <label className="user-select-label">Select User: </label>
        <select 
          value={selectedUser} 
          onChange={(e) => setSelectedUser(e.target.value)}
          className="main-user-select"
          disabled={loading}
        >
          <option value="">Select User</option>
          {users.map(user => (
            <option key={user._id} value={user._id}>
              {user.name} - {user.email} (Balance: R{user.balance || 0})
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="loading-message">Loading users...</div>}

      {selectedUser && selectedUserData && (
        <div className="management-sections">
          {/* Balance Update Section */}
          <div className="balance-section">
            <h3 className="section-title balance-title">💵 Update Balance</h3>
            <div className="current-balance">
              <strong>Current Balance:</strong> R{selectedUserData.balance || 0}
            </div>
            <div className="balance-input-wrapper">
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="Enter new balance"
                className="balance-update-input"
                min="0"
                step="0.01"
              />
            </div>
            <button 
              className="update-balance-button"
              onClick={handleUpdateBalance}
              disabled={updating}
            >
              {updating ? 'Updating...' : '💾 Update Balance'}
            </button>
          </div>

          {/* Plan Activation Section */}
          <div className="plan-section">
            <h3 className="section-title plan-title">📋 Activate Plan</h3>
            <div className="current-plans">
              <strong>Current Plans:</strong> {selectedUserData.plans?.length > 0 ? selectedUserData.plans.join(', ') : 'None'}
            </div>
            <div className="plan-select-wrapper">
              <select 
                value={selectedPlan} 
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="plan-select"
              >
                <option value="">Select Plan</option>
                {plans.map(plan => (
                  <option key={plan} value={plan}>{plan}</option>
                ))}
              </select>
            </div>
            <button 
              className="activate-plan-button"
              onClick={handleActivatePlan}
              disabled={updating || !selectedPlan}
            >
              {updating ? 'Activating...' : '🚀 Activate Plan'}
            </button>
          </div>
        </div>
      )}

      {!selectedUser && !loading && (
        <div className="select-user-prompt">
          Please select a user to manage their balance and plans
        </div>
      )}
    </div>
  );
};

export default AdminUpdateBalance;