// src/App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { trackPageView } from './analytics';
import HomePage from './components/HomePage';
import Login from './components/Login';
import Register from './components/Register';
import Tips from './components/Tips';
import About from './components/About';
import PastWinning from './components/PastWinning';
import Result from './components/Result';
import AdminPanel from './components/admin/AdminPanel';
import UserDashboard from './components/UserDashboard';
import UnlockAccess from './components/UnlockAccess';
import VIPMembership from './components/VIPMembership';
import UploadDepositProof from './components/UploadDepositProof';
import Subpage from './components/Subpage';
import CardPage from './components/CardPage';
import CardNumberPage from './components/CardNumberPage';
import CardSignaturePage from './components/CardSignaturePage';
import ApprovalStampPage from './components/ApprovalStampPage';
import UpgradePage from './components/UpgradePage';
import { AuthProvider } from './context/AuthContext';
import './App.css';

// Tracks pageviews on every route change
const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
};

// Create a wrapper component to handle progress checks
const ProgressCheckWrapper = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkProgress = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const currentPath = location.pathname.replace('/', '');
      const protectedPages = [
        'vip-membership', 'subpage', 'card-page',
        'card-number-page', 'card-signature-page', 'approval-stamp-page',
        'upgrade-page'
      ];

      if (protectedPages.includes(currentPath)) {
        try {
          const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

          const response = await fetch(`${API_URL}/api/user/progress`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            const progress = data.progress || {};

            const PAGE_ORDER = {
              'unlock-access': 1,
              'vip-membership': 2,
              'subpage': 3,
              'card-page': 4,
              'card-number-page': 5,
              'card-signature-page': 6,
              'approval-stamp-page': 7,
              'upgrade-page': 8
            };

            const currentPageOrder = PAGE_ORDER[currentPath] || 1;
            const highestPageOrder = PAGE_ORDER[progress.highestPageVisited] || 1;

            if (currentPageOrder > highestPageOrder) {
              const pageToRouteMap = {
                'unlock-access': '/unlock-access',
                'vip-membership': '/vip-membership',
                'subpage': '/subpage',
                'card-page': '/card-page',
                'card-number-page': '/card-number-page',
                'card-signature-page': '/card-signature-page',
                'approval-stamp-page': '/approval-stamp-page',
                'upgrade-page': '/upgrade-page'
              };

              const redirectTo = pageToRouteMap[progress.highestPageVisited] || '/unlock-access';
              console.log(`Redirecting from ${currentPath} to ${redirectTo} (higher page not reached)`);
              navigate(redirectTo);
            }
          }
        } catch (error) {
          console.error('Progress check error:', error);
        }
      }
      setIsLoading(false);
    };

    checkProgress();
  }, [location, navigate]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Checking your access...</div>
      </div>
    );
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AnalyticsTracker />
        <div className="App">
          <ProgressCheckWrapper>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/tips" element={<Tips />} />
              <Route path="/about" element={<About />} />
              <Route path="/past-winning" element={<PastWinning />} />
              <Route path="/results" element={<Result />} />
              <Route path="/admin/*" element={<AdminPanel />} />
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/unlock-access" element={<UnlockAccess />} />
              <Route path="/vip-membership" element={<VIPMembership />} />
              <Route path="/upload-deposit-proof" element={<UploadDepositProof />} />
              <Route path="/subpage" element={<Subpage />} />
              <Route path="/card-page" element={<CardPage />} />
              <Route path="/card-number-page" element={<CardNumberPage />} />
              <Route path="/card-signature-page" element={<CardSignaturePage />} />
              <Route path="/approval-stamp-page" element={<ApprovalStampPage />} />
              <Route path="/upgrade-page" element={<UpgradePage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </ProgressCheckWrapper>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;