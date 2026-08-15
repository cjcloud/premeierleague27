'use client';

import { useState, useEffect } from 'react';
import { ClockIcon } from 'lucide-react';

interface LastUpdatedIndicatorProps {
  timestamp: Date | null;
}

export function LastUpdatedIndicator({ timestamp }: LastUpdatedIndicatorProps) {
  const [status, setStatus] = useState<'fresh' | 'stale'>('fresh');
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    // Update time ago immediately
    updateTimeAgo();
    
    // Set up interval to update every 15 seconds
    const interval = setInterval(updateTimeAgo, 15000);
    
    return () => clearInterval(interval);
  }, [timestamp]);

  function updateTimeAgo() {
    if (!timestamp) {
      setTimeAgo('Never');
      setStatus('stale');
      return;
    }
    
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    
    // Update stale status
    setStatus(diffMinutes > 3 ? 'stale' : 'fresh');
    
    // Format time ago
    if (diffMinutes < 1) {
      setTimeAgo('Just now');
    } else if (diffMinutes < 60) {
      setTimeAgo(`${Math.floor(diffMinutes)} minute${Math.floor(diffMinutes) !== 1 ? 's' : ''} ago`);
    } else {
      const hours = Math.floor(diffMinutes / 60);
      setTimeAgo(`${hours} hour${hours !== 1 ? 's' : ''} ago`);
    }
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <ClockIcon className="h-4 w-4" />
      <span>Last updated: </span>
      <span 
        className={`font-medium ${
          status === 'stale' ? 'text-amber-500 dark:text-amber-400' : 'text-green-600 dark:text-green-500'
        }`}
      >
        {timeAgo}
      </span>
      {timestamp && (
        <span className="text-xs text-muted-foreground">
          ({timestamp.toLocaleString()})
        </span>
      )}
    </div>
  );
}
