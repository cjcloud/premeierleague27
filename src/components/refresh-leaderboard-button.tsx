'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function RefreshLeaderboardButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // Add timestamp to avoid any caching issues
      const timestamp = Date.now();
      
      // Show initial loading toast
      toast({
        title: "Checking data freshness",
        description: "Checking if an update is needed...",
      });
      
      // Use the API endpoint to check if data needs updating
      const checkResponse = await fetch(`/api/v1/teams/check-update?t=${timestamp}`);
      const checkResult = await checkResponse.json();
      const needsUpdate = checkResult.needsUpdate;
      
      if (needsUpdate) {
        // Show updating toast
        toast({
          title: "Refreshing data",
          description: "Fetching the latest Premier League standings...",
        });
        
        // Use the API endpoint instead of directly calling the function
        const updateResponse = await fetch('/api/v1/teams/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const result = await updateResponse.json();
        console.log('Update response:', result);
        
        // Show success or error toast based on the result
        if (result.success) {
          // Check if we got a dataFreshness object, which means the data was already fresh
          if (result.dataFreshness) {
            // Use minutes ago value directly to avoid timezone issues
            const minutesAgo = result.dataFreshness.minutesAgo.toFixed(1);
            const nextUpdateIn = result.dataFreshness.nextUpdateAvailableIn.toFixed(1);
            
            toast({
              title: "DATA UP TO DATE",
              description: `Premier League data was updated ${minutesAgo} minutes ago. Next update available in ${nextUpdateIn} minutes.`,
              variant: "default",
              className: "bg-pink-300"
            });
          } else {
            toast({
              title: "Success",
              description: "Premier League data has been refreshed successfully!",
              variant: "default"
            });
            
            // Only revalidate and show UI update when data was actually refreshed
            // Instead of reloading the page which can bypass the freshness check,
            // use Next.js's router refresh capabilities
            setTimeout(() => {
              // Use Next.js cache revalidation instead of a full page reload
              fetch('/api/v1/revalidate?path=/leaderboard', { method: 'POST' })
                .then(() => {
                  toast({
                    title: "UI Updated",
                    description: "The leaderboard has been refreshed with the latest data.",
                    variant: "default"
                  });
                })
                .catch(() => {
                  // Fall back to window reload if revalidation fails
                  window.location.reload();
                });
            }, 1000); // Give toast time to display before refresh
          }
        } else {
          toast({
            title: "Refresh failed",
            description: result.error || "Unable to refresh the Premier League data",
            variant: "destructive"
          });
        }
      } else {
        // Data is already fresh - no update needed
        // Use minutes ago value which is calculated on the server and avoids timezone issues
        const minutesAgo = checkResult.lastUpdatedMinutesAgo ? 
          `${checkResult.lastUpdatedMinutesAgo} minutes ago` : 'recently';
        
        // Calculate next available update time based on the minutes ago value
        const nextUpdateIn = Math.max(0, 5-checkResult.lastUpdatedMinutesAgo).toFixed(1);
          
        toast({
          title: "DATA UP TO DATE",
          description: `Premier League data was updated ${minutesAgo}. Next update available in ${nextUpdateIn} minutes.`,
          variant: "default",
          className: "bg-pink-300"
        });
          
        // Even though the data hasn't changed, the user expects some feedback
        // We'll update the UI state to show we've completed the refresh action
        setIsRefreshing(false);
      }
    } catch (error) {
      console.error('Error refreshing leaderboard:', error);
      // Provide more specific error information when possible
      const errorMessage = error instanceof Error ? 
        error.message : 
        "Unable to refresh the leaderboard data";
      
      toast({
        title: "Refresh failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="flex items-center gap-1"
    >
      <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
      <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
    </Button>
  );
}
