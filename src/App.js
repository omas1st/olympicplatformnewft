// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
import { AuthProvider } from './context/AuthContext';
import './App.css';

// Create a wrapper component to handle progress checks
const ProgressCheckWrapper = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Check if user is trying to access a page they shouldn't be able to
    const checkProgress = () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const currentPath = location.pathname.replace('/', '');
      const protectedPages = [
        'vip-membership', 'subpage', 'card-page', 
        'card-number-page', 'card-signature-page', 'approval-stamp-page'
      ];
      
      // If user is accessing a protected page, check their progress
      if (protectedPages.includes(currentPath)) {
        try {
          // Get progress from localStorage
          const storedUser = localStorage.getItem('user');
          if (!storedUser) return;
          
          const user = JSON.parse(storedUser);
          const userId = user._id || user.id;
          const storageKey = `userProgress_${userId}`;
          const progress = JSON.parse(localStorage.getItem(storageKey) || '{}');
          
          // Define page hierarchy
          const PAGE_ORDER = {
            'unlock-access': 1,
            'vip-membership': 2,
            'subpage': 3,
            'card-page': 4,
            'card-number-page': 5,
            'card-signature-page': 6,
            'approval-stamp-page': 7
          };
          
          const currentPageOrder = PAGE_ORDER[currentPath] || 1;
          const highestPageOrder = PAGE_ORDER[progress.highestPageVisited] || 1;
          
          // If user hasn't reached this page yet, redirect them to their highest page
          if (currentPageOrder > highestPageOrder) {
            // Map page name to route
            const pageToRouteMap = {
              'unlock-access': '/unlock-access',
              'vip-membership': '/vip-membership',
              'subpage': '/subpage',
              'card-page': '/card-page',
              'card-number-page': '/card-number-page',
              'card-signature-page': '/card-signature-page',
              'approval-stamp-page': '/approval-stamp-page'
            };
            
            const redirectTo = pageToRouteMap[progress.highestPageVisited] || '/unlock-access';
            console.log(`Redirecting from ${currentPath} to ${redirectTo} (higher page not reached)`);
            navigate(redirectTo);
          }
        } catch (error) {
          console.error('Progress check error:', error);
        }
      }
    };
    
    checkProgress();
  }, [location, navigate]);
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
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
              {/* New pages */}
              <Route path="/subpage" element={<Subpage />} />
              <Route path="/card-page" element={<CardPage />} />
              <Route path="/card-number-page" element={<CardNumberPage />} />
              <Route path="/card-signature-page" element={<CardSignaturePage />} />
              <Route path="/approval-stamp-page" element={<ApprovalStampPage />} />
              {/* Add a catch-all route for undefined paths */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </ProgressCheckWrapper>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;