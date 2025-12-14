// src/components/BackButtonHandler.js
import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Change this import

const BackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth(); // Use useAuth hook instead of useContext
  const hasRun = useRef(false);

  useEffect(() => {
    // Check if user is the particular user (adjust this condition)
    // Example 1: Check by specific email
    const isParticularUser = user && user.email === 'particular@example.com';
    
    // Example 2: Check by user ID (if you have _id field)
    // const isParticularUser = user && user._id === 'specific-user-id';
    
    // Example 3: Check by role (if you have role field)
    // const isParticularUser = user && user.role === 'admin';
    
    // Example 4: Check by username
    // const isParticularUser = user && user.username === 'particularUser';

    if (!isParticularUser) return;

    const handleBackButton = (event) => {
      // Prevent default back behavior
      event.preventDefault();
      
      // Only redirect if not already on home page
      if (location.pathname !== '/') {
        navigate('/', { replace: true });
      } else {
        // If already on home page, allow normal back navigation
        window.history.back();
      }
    };

    // Push a new entry to history to trap the back button
    if (!hasRun.current) {
      window.history.pushState(null, '', window.location.href);
      hasRun.current = true;
    }

    // Add event listener for popstate (back/forward button)
    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [user, navigate, location]);

  return null; // This component doesn't render anything
};

export default BackButtonHandler;