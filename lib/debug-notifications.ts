// Debug utilities for notification system
// Add this to browser console to debug notification issues

export const debugNotificationSystem = () => {
  console.log('🔍 Notification System Debug Info:');
  console.log('📧 Session Storage:', Object.keys(sessionStorage).filter(key => key.includes('welcome')));
  console.log('💾 Local Storage:', Object.keys(localStorage).filter(key => key.includes('notification')));
  
  // Check if notification provider is available
  const notificationElement = document.querySelector('[data-notification-provider]');
  console.log('🔔 Notification Provider Found:', !!notificationElement);
  
  // Check current notifications in storage
  const storedNotifications = localStorage.getItem('circleInNotifications');
  let notificationCount = 0;
  let welcomeNotifications = 0;
  
  if (storedNotifications) {
    try {
      const notifications = JSON.parse(storedNotifications);
      notificationCount = notifications.length;
      welcomeNotifications = notifications.filter((n: any) => 
        n.title.includes('Welcome back') || n.title.includes('Welcome Test')
      ).length;
    } catch (e) {
      console.log('❌ Error parsing stored notifications');
    }
  }
  
  console.log('� Current Notifications:', notificationCount);
  console.log('🏠 Welcome Notifications:', welcomeNotifications);
  console.log('👤 Current Path:', typeof window !== 'undefined' ? window.location.pathname : 'unknown');
  
  return {
    sessionKeys: Object.keys(sessionStorage).filter(key => key.includes('welcome')),
    localKeys: Object.keys(localStorage).filter(key => key.includes('notification')),
    hasProvider: !!notificationElement,
    notificationCount,
    welcomeNotifications,
    currentPath: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
  };
};

// Function to reset welcome notifications for testing
export const resetWelcomeNotifications = () => {
  console.log('🔄 Resetting welcome notifications...');
  
  // Clear session storage
  const keysToRemove = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.includes('welcomeSession_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => sessionStorage.removeItem(key));
  
  console.log('✅ Welcome notifications reset. Refresh page to see welcome notification again.');
  
  return { clearedKeys: keysToRemove };
};

// Force trigger a welcome notification for testing (bypasses all checks)
export const forceWelcomeNotification = () => {
  console.log('🧪 Force triggering welcome notification...');
  
  // Get the notification system from the page context
  const event = new CustomEvent('addNotification', {
    detail: {
      title: '🧪 Forced Welcome Test',
      message: 'This is a forced welcome notification test - bypassing all session checks.',
      type: 'info',
      priority: 'medium',
      category: 'system',
      autoHide: false
    }
  });
  
  window.dispatchEvent(event);
  console.log('✅ Force welcome notification dispatched');
};

// Test signin flow by simulating session changes
export const testSigninFlow = () => {
  console.log('🔄 Testing signin flow...');
  
  // Reset all welcome-related storage
  resetWelcomeNotifications();
  
  // Wait a bit then reload to simulate fresh signin
  setTimeout(() => {
    console.log('🔄 Reloading page to simulate fresh signin...');
    window.location.reload();
  }, 1000);
};

// Monitor session changes in real-time
export const monitorSessionChanges = () => {
  console.log('👀 Starting session monitoring...');
  
  let lastSessionState: boolean | null = null;
  
  const checkSession = () => {
    // Try to access React context data (if available)
    const sessionToken = document.cookie.split(';').find(c => c.includes('next-auth'));
    const currentState = !!sessionToken;
    
    if (currentState !== lastSessionState) {
      console.log('🔄 Session state changed:', currentState ? 'SIGNED IN' : 'SIGNED OUT');
      lastSessionState = currentState;
      
      if (currentState) {
        console.log('✅ User signed in - welcome notification should trigger');
      } else {
        console.log('❌ User signed out - welcome flags should reset');
      }
    }
  };
  
  // Check every 2 seconds
  const interval = setInterval(checkSession, 2000);
  
  console.log('👀 Monitoring started. Use stopSessionMonitoring() to stop.');
  
  // Return a function to stop monitoring
  (window as any).stopSessionMonitoring = () => {
    clearInterval(interval);
    console.log('⏹️ Session monitoring stopped');
  };
};

// Call this in browser console: debugNotificationSystem()
if (typeof window !== 'undefined') {
  (window as any).debugNotificationSystem = debugNotificationSystem;
  (window as any).resetWelcomeNotifications = resetWelcomeNotifications;
  (window as any).forceWelcomeNotification = forceWelcomeNotification;
  (window as any).testSigninFlow = testSigninFlow;
  (window as any).monitorSessionChanges = monitorSessionChanges;
  
  console.log('🛠️ Debug functions loaded:');
  console.log('  - debugNotificationSystem()');
  console.log('  - resetWelcomeNotifications()');
  console.log('  - forceWelcomeNotification()');
  console.log('  - testSigninFlow()');
  console.log('  - monitorSessionChanges()');
}