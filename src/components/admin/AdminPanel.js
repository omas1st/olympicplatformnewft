import React, { useState } from 'react';
import AdminUserInfo from './AdminUserInfo';
import AdminEditLotto from './AdminEditLotto';
import AdminEditResult from './AdminEditResult';
import AdminCarousel from './AdminCarousel';
import AdminUpdateBalance from './AdminUpdateBalance';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('userinfo');

  const renderContent = () => {
    switch (activeTab) {
      case 'userinfo':
        return <AdminUserInfo />;
      case 'editlotto':
        return <AdminEditLotto />;
      case 'editresult':
        return <AdminEditResult />;
      case 'carousel':
        return <AdminCarousel />;
      case 'updatebalance':
        return <AdminUpdateBalance />;
      default:
        return <AdminUserInfo />;
    }
  };

  return (
    <div className="admin-panel">
      <div className="container">
        <h1>Admin Panel</h1>
        <div className="admin-nav">
          <button 
            className={activeTab === 'userinfo' ? 'active' : ''} 
            onClick={() => setActiveTab('userinfo')}
          >
            User Info
          </button>
          <button 
            className={activeTab === 'editlotto' ? 'active' : ''} 
            onClick={() => setActiveTab('editlotto')}
          >
            Edit Lotto Numbers
          </button>
          <button 
            className={activeTab === 'editresult' ? 'active' : ''} 
            onClick={() => setActiveTab('editresult')}
          >
            Edit Results
          </button>
          <button 
            className={activeTab === 'carousel' ? 'active' : ''} 
            onClick={() => setActiveTab('carousel')}
          >
            Carousel
          </button>
          <button 
            className={activeTab === 'updatebalance' ? 'active' : ''} 
            onClick={() => setActiveTab('updatebalance')}
          >
            Update Balance
          </button>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminPanel;