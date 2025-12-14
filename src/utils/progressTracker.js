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

// Function to update progress tracking - USER-SPECIFIC
export const updateProgressTracking = (pageName, stepCompleted = false) => {
  // Get the current user from localStorage
  const storedUser = localStorage.getItem('user');
  if (!storedUser) {
    console.error('No user found in localStorage for progress tracking');
    return;
  }
  
  try {
    const user = JSON.parse(storedUser);
    const userId = user._id || user.id;
    
    if (!userId) {
      console.error('No user ID found for progress tracking');
      return;
    }
    
    // Use user-specific key
    const storageKey = `userProgress_${userId}`;
    const currentProgress = JSON.parse(localStorage.getItem(storageKey) || '{}');
    
    // Initialize if empty
    currentProgress.lastVisitedPage = pageName;
    currentProgress.lastVisitedTime = new Date().toISOString();
    
    // Initialize highest page if not exists
    if (!currentProgress.highestPageVisited) {
      currentProgress.highestPageVisited = 'unlock-access';
    }
    
    // Get current page order
    const currentPageOrder = PAGE_ORDER[pageName] || 1;
    const currentHighestOrder = PAGE_ORDER[currentProgress.highestPageVisited] || 1;
    
    // Update highest page visited - only if current page is higher in hierarchy
    if (currentPageOrder > currentHighestOrder) {
      currentProgress.highestPageVisited = pageName;
      console.log('Updated highest page to:', pageName);
    }
    
    // Update last completed page if step is completed
    if (stepCompleted) {
      currentProgress.lastCompletedPage = pageName;
      currentProgress.completedSteps = currentProgress.completedSteps || [];
      if (!currentProgress.completedSteps.includes(pageName)) {
        currentProgress.completedSteps.push(pageName);
      }
      
      // When a step is completed, also update highest page to the next one
      // This ensures if user completes a page, they move forward
      if (currentPageOrder < 7) { // 7 is the last page
        // Find the next page
        const nextPage = Object.keys(PAGE_ORDER).find(
          key => PAGE_ORDER[key] === currentPageOrder + 1
        );
        if (nextPage) {
          currentProgress.highestPageVisited = nextPage;
          console.log('Step completed, moving highest page to:', nextPage);
        }
      }
    }
    
    localStorage.setItem(storageKey, JSON.stringify(currentProgress));
    console.log('Progress updated for user', userId, ':', currentProgress);
    
    // Also sync with backend if available (optional)
    syncProgressWithBackend(userId, currentProgress);
  } catch (error) {
    console.error('Error updating progress tracking:', error);
  }
};

// Sync progress with backend (optional)
const syncProgressWithBackend = async (userId, progress) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    // We'll only try to sync if we have an API URL and token
    const response = await fetch(`${API_URL}/api/user/update-progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        progressData: progress
      })
    });
    
    if (response.ok) {
      console.log('Progress synced with backend');
    }
  } catch (error) {
    // Silent fail - it's okay if backend sync fails
    console.log('Backend sync optional, continuing with local storage');
  }
};

// Function to get user's highest page visited
export const getHighestPageVisited = () => {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) {
    console.error('No user found in localStorage');
    return null;
  }
  
  try {
    const user = JSON.parse(storedUser);
    const userId = user._id || user.id;
    
    if (!userId) {
      console.error('No user ID found');
      return null;
    }
    
    const storageKey = `userProgress_${userId}`;
    const progress = JSON.parse(localStorage.getItem(storageKey) || '{}');
    
    // Return highest page if exists, otherwise last visited page
    return progress.highestPageVisited || progress.lastVisitedPage || null;
  } catch (error) {
    console.error('Error getting progress tracking:', error);
    return null;
  }
};

// Function to get the next page user should go to (based on highest page)
export const getNextPageToContinue = () => {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) {
    console.error('No user found in localStorage');
    return '/unlock-access'; // Default to first page
  }
  
  try {
    const user = JSON.parse(storedUser);
    const userId = user._id || user.id;
    
    if (!userId) {
      console.error('No user ID found');
      return '/unlock-access';
    }
    
    const storageKey = `userProgress_${userId}`;
    const progress = JSON.parse(localStorage.getItem(storageKey) || '{}');
    
    console.log('User progress for user', userId, ':', progress);
    console.log('Highest page visited:', progress.highestPageVisited);
    console.log('Last visited page:', progress.lastVisitedPage);
    console.log('Last completed page:', progress.lastCompletedPage);
    
    // Map page names to actual routes
    const pageToRouteMap = {
      'unlock-access': '/unlock-access',
      'vip-membership': '/vip-membership',
      'subpage': '/subpage',
      'card-page': '/card-page',
      'card-number-page': '/card-number-page',
      'card-signature-page': '/card-signature-page',
      'approval-stamp-page': '/approval-stamp-page'
    };
    
    // FIRST PRIORITY: Use highest page visited
    if (progress.highestPageVisited && pageToRouteMap[progress.highestPageVisited]) {
      console.log('Redirecting to highest page visited:', progress.highestPageVisited);
      return pageToRouteMap[progress.highestPageVisited];
    }
    
    // SECOND PRIORITY: If no highest page, use last visited page
    if (progress.lastVisitedPage && pageToRouteMap[progress.lastVisitedPage]) {
      console.log('Redirecting to last visited page:', progress.lastVisitedPage);
      return pageToRouteMap[progress.lastVisitedPage];
    }
    
    // THIRD PRIORITY: If no last visited page but there's a last completed page, 
    // go to the NEXT page after the last completed one
    if (progress.lastCompletedPage && pageToRouteMap[progress.lastCompletedPage]) {
      // Define the flow order as an array to find the next page
      const flowOrderArray = [
        'unlock-access',
        'vip-membership',
        'subpage',
        'card-page',
        'card-number-page',
        'card-signature-page',
        'approval-stamp-page'
      ];
      
      const currentIndex = flowOrderArray.indexOf(progress.lastCompletedPage);
      if (currentIndex < flowOrderArray.length - 1) {
        const nextPage = flowOrderArray[currentIndex + 1];
        console.log('Redirecting to next page after last completed:', nextPage);
        return pageToRouteMap[nextPage];
      }
    }
    
    // Default to first page
    console.log('No progress found, defaulting to unlock-access');
    return '/unlock-access';
  } catch (error) {
    console.error('Error getting next page:', error);
    return '/unlock-access';
  }
};

// Function to get all user progress
export const getUserProgress = () => {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) {
    return null;
  }
  
  try {
    const user = JSON.parse(storedUser);
    const userId = user._id || user.id;
    
    if (!userId) {
      return null;
    }
    
    const storageKey = `userProgress_${userId}`;
    return JSON.parse(localStorage.getItem(storageKey) || '{}');
  } catch (error) {
    console.error('Error getting user progress:', error);
    return null;
  }
};

// Function to reset user progress
export const resetUserProgress = () => {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) {
    return;
  }
  
  try {
    const user = JSON.parse(storedUser);
    const userId = user._id || user.id;
    
    if (!userId) {
      return;
    }
    
    const storageKey = `userProgress_${userId}`;
    localStorage.removeItem(storageKey);
    console.log('Progress reset for user', userId);
  } catch (error) {
    console.error('Error resetting progress:', error);
  }
};

// Function to manually set highest page (for edge cases)
export const setHighestPageVisited = (pageName) => {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) {
    console.error('No user found in localStorage');
    return;
  }
  
  try {
    const user = JSON.parse(storedUser);
    const userId = user._id || user.id;
    
    if (!userId) {
      console.error('No user ID found');
      return;
    }
    
    const storageKey = `userProgress_${userId}`;
    const currentProgress = JSON.parse(localStorage.getItem(storageKey) || '{}');
    
    currentProgress.highestPageVisited = pageName;
    currentProgress.updatedAt = new Date().toISOString();
    
    localStorage.setItem(storageKey, JSON.stringify(currentProgress));
    console.log('Manually set highest page to:', pageName);
  } catch (error) {
    console.error('Error setting highest page:', error);
  }
};