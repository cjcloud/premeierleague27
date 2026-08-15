import { shouldUpdateStandings, getLastUpdateTime } from '@/lib/api';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Add timestamp to avoid any caching issues
    const timestamp = Date.now();
    
    // Get the last update timestamp first
    const lastUpdateInfo = await getLastUpdateTime();
    
    // Check if update is needed
    const needsUpdate = await shouldUpdateStandings(`api-check-${timestamp}`);
    
    // Calculate how many minutes ago the data was updated
    let lastUpdatedMinutesAgo = null;
    if (lastUpdateInfo && lastUpdateInfo.lastUpdated) {
      // Create a new Date object for the current time
      const now = new Date();
      
      // Log timestamps for debugging
      console.log(`[check-update] DB last update time: ${lastUpdateInfo.lastUpdated}`);
      console.log(`[check-update] Current time: ${now}`);
      console.log(`[check-update] Current time (UTC): ${now.toUTCString()}`);
      
      // Calculate time difference in milliseconds using getTime() which returns milliseconds since epoch
      // This is timezone-independent as both timestamps are converted to milliseconds
      const diffMs = now.getTime() - lastUpdateInfo.lastUpdated.getTime();
      
      // Convert to minutes and round to 1 decimal place
      lastUpdatedMinutesAgo = Math.round((diffMs / (1000 * 60)) * 10) / 10;
      
      console.log(`[check-update] Minutes since last update: ${lastUpdatedMinutesAgo}`);
    }
    
    return NextResponse.json({ 
      needsUpdate,
      lastUpdated: lastUpdateInfo?.lastUpdated?.toISOString(),
      lastUpdatedMinutesAgo
    });
  } catch (error) {
    console.error('Error checking team standings update:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An error occurred while checking if update is needed'
    }, { 
      status: 500 
    });
  }
}
