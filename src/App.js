// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
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
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;