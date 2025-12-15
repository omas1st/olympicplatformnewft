// src/utils/progressTracker.js

// Define the page hierarchy/order
const PAGE_ORDER = {
  'unlock-access': 1,
  'vip-membership': 2,
  'subpage': 3,
  'card-page': 4,
  'card-number-page': 5,
  'card-signature-page': 6,
  'approval-stamp-page': 7
};

// WhatsApp URL for completed users
const WHATSAPP_URL = 'https://wa.me/14059260437';

// Helper function to get API URL
const getApiUrl = () => {
  let API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  // Clean up the API URL
  API_URL = API_URL.replace(/\/$/, ''); // Remove trailing slash
  
  // Ensure we don't have double /api
  if (API_URL.endsWith('/api')) {
    API_URL = API_URL.slice(0, -4);
  }
  
  return API_URL;
};

// Function to update progress tracking in MongoDB
export const updateProgressTracking = async (pageName, stepCompleted = false) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return null;
    }

    const API_URL = getApiUrl();
    
    // First get current progress from database
    let currentProgress = { highestPageVisited: 'unlock-access' };
    
    try {
      const progressResponse = await fetch(`${API_URL}/api/user/progress`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        currentProgress = progressData.progress || { highestPageVisited: 'unlock-access' };
        console.log('Current progress from DB:', currentProgress);
      }
    } catch (error) {
      console.error('Error fetching current progress:', error);
    }
    
    // Update the progress object
    currentProgress.lastVisitedPage = pageName;
    currentProgress.lastVisitedTime = new Date().toISOString();
    
    // Initialize highest page if not exists
    if (!currentProgress.highestPageVisited) {
      currentProgress.highestPageVisited = 'unlock-access';
    }
    
    // Get current page order
    const currentPageOrder = PAGE_ORDER[pageName] || 1;
    const currentHighestOrder = PAGE_ORDER[currentProgress.highestPageVisited] || 1;
    
    console.log(`Current page: ${pageName} (order: ${currentPageOrder}), Highest: ${currentProgress.highestPageVisited} (order: ${currentHighestOrder})`);
    
    // Update highest page visited if current page is higher
    if (currentPageOrder > currentHighestOrder) {
      currentProgress.highestPageVisited = pageName;
      console.log(`Updated highest page from ${currentProgress.highestPageVisited} to ${pageName}`);
    }
    
    // If step is completed, update completed steps
    if (stepCompleted) {
      currentProgress.lastCompletedPage = pageName;
      currentProgress.completedSteps = currentProgress.completedSteps || [];
      
      if (!currentProgress.completedSteps.includes(pageName)) {
        currentProgress.completedSteps.push(pageName);
      }
      
      // Move to next page after completion
      if (currentPageOrder < 7) {
        const nextPage = Object.keys(PAGE_ORDER).find(
          key => PAGE_ORDER[key] === currentPageOrder + 1
        );
        if (nextPage) {
          currentProgress.highestPageVisited = nextPage;
          console.log(`Step completed, moving to next page: ${nextPage}`);
        }
      }
      
      // Check if all stages are completed
      if (currentProgress.completedSteps && currentProgress.completedSteps.length >= 7) {
        currentProgress.allStagesCompleted = true;
        currentProgress.completedAt = new Date().toISOString();
        console.log('All 7 stages completed!');
      }
    }
    
    // Also update localStorage as backup
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const userId = user._id || user.id;
        const storageKey = `userProgress_${userId}`;
        localStorage.setItem(storageKey, JSON.stringify(currentProgress));
      }
    } catch (e) {
      console.log('Failed to update localStorage backup:', e);
    }
    
    // Send update to backend
    try {
      const response = await fetch(`${API_URL}/api/user/update-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          progressData: currentProgress
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Progress saved to database:', result);
        return currentProgress;
      } else {
        console.error('Failed to save progress to database:', response.status);
        return currentProgress; // Still return progress even if DB save fails
      }
    } catch (error) {
      console.error('Error saving progress to database:', error);
      return currentProgress; // Return progress even if DB save fails
    }
    
  } catch (error) {
    console.error('Error in updateProgressTracking:', error);
    return null;
  }
};

// Function to get the next page user should go to
export const getNextPageToContinue = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, redirecting to login');
      return '/unlock-access';
    }

    const API_URL = getApiUrl();
    console.log('Getting next page from API:', `${API_URL}/api/user/progress`);
    
    // Try database first
    try {
      const response = await fetch(`${API_URL}/api/user/progress`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const progress = data.progress || {};
        console.log('Progress from database:', progress);
        
        // Map page names to routes
        const pageToRouteMap = {
          'unlock-access': '/unlock-access',
          'vip-membership': '/vip-membership',
          'subpage': '/subpage',
          'card-page': '/card-page',
          'card-number-page': '/card-number-page',
          'card-signature-page': '/card-signature-page',
          'approval-stamp-page': '/approval-stamp-page'
        };
        
        // Check if all stages completed
        if (progress.allStagesCompleted) {
          console.log('All stages completed, redirecting to WhatsApp');
          return WHATSAPP_URL;
        }
        
        // Use highest page visited
        if (progress.highestPageVisited && pageToRouteMap[progress.highestPageVisited]) {
          console.log('Redirecting to highest page:', progress.highestPageVisited);
          return pageToRouteMap[progress.highestPageVisited];
        }
      } else {
        console.error('Failed to fetch progress from DB:', response.status);
      }
    } catch (dbError) {
      console.error('Database error, falling back to localStorage:', dbError);
    }
    
    // Fallback to localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const userId = user._id || user.id;
        const storageKey = `userProgress_${userId}`;
        const storedProgress = localStorage.getItem(storageKey);
        
        if (storedProgress) {
          const progress = JSON.parse(storedProgress);
          console.log('Progress from localStorage:', progress);
          
          const pageToRouteMap = {
            'unlock-access': '/unlock-access',
            'vip-membership': '/vip-membership',
            'subpage': '/subpage',
            'card-page': '/card-page',
            'card-number-page': '/card-number-page',
            'card-signature-page': '/card-signature-page',
            'approval-stamp-page': '/approval-stamp-page'
          };
          
          if (progress.highestPageVisited && pageToRouteMap[progress.highestPageVisited]) {
            console.log('Using localStorage highest page:', progress.highestPageVisited);
            return pageToRouteMap[progress.highestPageVisited];
          }
        }
      } catch (e) {
        console.error('Error reading localStorage:', e);
      }
    }
    
    // Default to first page
    console.log('No progress found, defaulting to unlock-access');
    return '/unlock-access';
    
  } catch (error) {
    console.error('Error in getNextPageToContinue:', error);
    return '/unlock-access';
  }
};

// Simple sync version
export const getNextPageToContinueSync = () => {
  try {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return '/unlock-access';
    
    const user = JSON.parse(storedUser);
    const userId = user._id || user.id;
    const storageKey = `userProgress_${userId}`;
    const storedProgress = localStorage.getItem(storageKey);
    
    if (storedProgress) {
      const progress = JSON.parse(storedProgress);
      const pageToRouteMap = {
        'unlock-access': '/unlock-access',
        'vip-membership': '/vip-membership',
        'subpage': '/subpage',
        'card-page': '/card-page',
        'card-number-page': '/card-number-page',
        'card-signature-page': '/card-signature-page',
        'approval-stamp-page': '/approval-stamp-page'
      };
      
      if (progress.highestPageVisited && pageToRouteMap[progress.highestPageVisited]) {
        return pageToRouteMap[progress.highestPageVisited];
      }
    }
    
    return '/unlock-access';
  } catch (error) {
    console.error('Error in sync function:', error);
    return '/unlock-access';
  }
};

// Check if user has completed all stages
export const hasCompletedAllStages = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return false;
    }
    
    const API_URL = getApiUrl();
    
    const response = await fetch(`${API_URL}/api/user/progress`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    const progress = data.progress || {};
    
    // Check if all stages are completed
    if (progress.allStagesCompleted) {
      return true;
    }
    
    // Alternative check: count completed steps
    if (progress.completedSteps && progress.completedSteps.length >= 7) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking completion status:', error);
    return false;
  }
};

// Function to get user's highest page visited
export const getHighestPageVisited = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return 'unlock-access';
    }
    
    const API_URL = getApiUrl();
    
    const response = await fetch(`${API_URL}/api/user/current-page`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('Failed to get current page, defaulting to unlock-access');
      return 'unlock-access';
    }
    
    const data = await response.json();
    return data.currentPage || 'unlock-access';
    
  } catch (error) {
    console.error('Error getting progress tracking:', error);
    return 'unlock-access';
  }
};

// Function to get all user progress
export const getUserProgress = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }
    
    const API_URL = getApiUrl();
    
    const response = await fetch(`${API_URL}/api/user/progress`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.progress || {};
    
  } catch (error) {
    console.error('Error getting user progress:', error);
    return null;
  }
};

// Function to reset user progress
export const resetUserProgress = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }
    
    const API_URL = getApiUrl();
    
    const response = await fetch(`${API_URL}/api/user/reset-progress`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('Progress reset successfully');
    } else {
      console.error('Failed to reset progress');
    }
    
  } catch (error) {
    console.error('Error resetting progress:', error);
  }
};

// Function to manually set highest page (for edge cases)
export const setHighestPageVisited = async (pageName) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return;
    }
    
    const API_URL = getApiUrl();
    
    // First get current progress
    const progressResponse = await fetch(`${API_URL}/api/user/progress`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    let currentProgress = {};
    if (progressResponse.ok) {
      const progressData = await progressResponse.json();
      currentProgress = progressData.progress || {};
    }
    
    // Update the highest page
    currentProgress.highestPageVisited = pageName;
    currentProgress.updatedAt = new Date().toISOString();
    
    // Save to database
    const response = await fetch(`${API_URL}/api/user/update-progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        progressData: currentProgress
      })
    });
    
    if (response.ok) {
      console.log('Manually set highest page to:', pageName);
    } else {
      console.error('Failed to set highest page');
    }
    
  } catch (error) {
    console.error('Error setting highest page:', error);
  }
};

// Function to mark all stages as completed (for testing or admin use)
export const markAllStagesCompleted = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return;
    }
    
    const API_URL = getApiUrl();
    
    // First get current progress
    const progressResponse = await fetch(`${API_URL}/api/user/progress`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    let currentProgress = {};
    if (progressResponse.ok) {
      const progressData = await progressResponse.json();
      currentProgress = progressData.progress || {};
    }
    
    // Mark all stages as completed
    currentProgress.allStagesCompleted = true;
    currentProgress.highestPageVisited = 'approval-stamp-page';
    currentProgress.completedSteps = [
      'unlock-access',
      'vip-membership',
      'subpage',
      'card-page',
      'card-number-page',
      'card-signature-page',
      'approval-stamp-page'
    ];
    currentProgress.completedAt = new Date().toISOString();
    
    // Save to database
    const response = await fetch(`${API_URL}/api/user/update-progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        progressData: currentProgress
      })
    });
    
    if (response.ok) {
      console.log('Marked all stages as completed');
    } else {
      console.error('Failed to mark all stages as completed');
    }
    
  } catch (error) {
    console.error('Error marking all stages as completed:', error);
  }
};