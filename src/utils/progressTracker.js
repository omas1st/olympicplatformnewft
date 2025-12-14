// src/utils/progressTracker.js

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
    
    // Update last visited page
    currentProgress.lastVisitedPage = pageName;
    currentProgress.lastVisitedTime = new Date().toISOString();
    
    // Update last completed page if step is completed
    if (stepCompleted) {
      currentProgress.lastCompletedPage = pageName;
      currentProgress.completedSteps = currentProgress.completedSteps || [];
      if (!currentProgress.completedSteps.includes(pageName)) {
        currentProgress.completedSteps.push(pageName);
      }
    }
    
    localStorage.setItem(storageKey, JSON.stringify(currentProgress));
    console.log('Progress updated for user', userId, ':', currentProgress);
  } catch (error) {
    console.error('Error updating progress tracking:', error);
  }
};

// Function to get user's last visited page
export const getLastVisitedPage = () => {
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
    
    return progress.lastVisitedPage || null;
  } catch (error) {
    console.error('Error getting progress tracking:', error);
    return null;
  }
};

// Function to get the next page user should go to
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
    
    // If there's a last visited page, return it
    if (progress.lastVisitedPage && pageToRouteMap[progress.lastVisitedPage]) {
      console.log('Redirecting to last visited page:', progress.lastVisitedPage);
      return pageToRouteMap[progress.lastVisitedPage];
    }
    
    // If no last visited page but there's a last completed page, 
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