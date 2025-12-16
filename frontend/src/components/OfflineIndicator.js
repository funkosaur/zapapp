import React, { useState, useEffect } from 'react';
import './OfflineIndicator.css';

/**
 * Displays online/offline status
 */
const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null; // Don't show anything when online
  }

  return (
    <div className="offline-indicator">
      <span className="offline-icon">⚠️</span>
      <span className="offline-text">You are offline. Data will be saved locally.</span>
    </div>
  );
};

export default OfflineIndicator;
