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
            {/* Add a catch-all route for undefined paths */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;