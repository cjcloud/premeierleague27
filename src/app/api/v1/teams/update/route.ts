import { updateTeamStandings, shouldUpdateStandings } from '@/lib/api';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { teams } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function POST() {
  try {
    // Add timestamp to avoid any caching issues
    const timestamp = Date.now();
    const currentTime = new Date().toISOString();
    console.log(`[Update Route] Starting update check at ${currentTime}`);
    console.log(`[Update Route] Current time: ${new Date()}`);
    console.log(`[Update Route] Current Unix timestamp: ${Date.now()}`);
    
    // Check if data is stale (older than 5 minutes) before making API call
    console.log('[Update Route] Checking if data needs update...');
    
    // Get the last update time for logging
    const db_result = await db
      .select({ lastUpdated: teams.lastUpdated })
      .from(teams)
      .orderBy(desc(teams.lastUpdated))
      .limit(1);
    
    if (db_result.length) {
      // We know lastUpdated can't be null because of defaultNow() in the schema
      // Using non-null assertion (!) to inform TypeScript that this value is definitely not null
      console.log(`[Update Route] DB last update time: ${db_result[0].lastUpdated!}`);
      const diffMs = Date.now() - db_result[0].lastUpdated!.getTime();
      const diffMinutes = diffMs / (1000 * 60);
      console.log(`[Update Route] Time since last update: ${diffMinutes.toFixed(2)} minutes`);
      console.log(`[Update Route] Should update (> 5 min)? ${diffMinutes > 5}`);
    } else {
      console.log('[Update Route] No previous update timestamp found in DB');
    }
    
    const needsUpdate = await shouldUpdateStandings(`should-update-${timestamp}`);
    console.log(`[Update Route] shouldUpdateStandings result: ${needsUpdate}`);
    
    if (!needsUpdate) {
      // Data is fresh (less than 5 minutes old), no need to update
      console.log('[Update Route] Data is fresh (less than 5 minutes old), returning early');
      
      // Since we're in the !needsUpdate block, we know there's data in the DB
      // TypeScript can't infer this, so we need to be explicit with our type assertions
      const lastUpdated = db_result[0]?.lastUpdated;
      
      // We need to verify lastUpdated exists before using it
      if (!lastUpdated) {
        return NextResponse.json({
          success: false,
          message: 'Unable to determine data freshness.'
        }, { status: 500 });
      }
      
      const now = new Date();
      const diffMs = now.getTime() - lastUpdated.getTime();
      const diffMinutes = diffMs / (1000 * 60);
      const nextUpdateAvailableIn = Math.max(0, 5 - diffMinutes);
      
      return NextResponse.json({
        success: true,
        message: 'Data is already up to date (less than 5 minutes old).',
        dataFreshness: {
          lastUpdated: lastUpdated.toISOString(),
          minutesAgo: parseFloat(diffMinutes.toFixed(2)),
          nextUpdateAvailableIn: parseFloat(nextUpdateAvailableIn.toFixed(1))
        }
      });
    }
    console.log('[Update Route] Data is stale, proceeding with update');
    
    // Data is stale, perform the API update
    const result = await updateTeamStandings(`api-update-${timestamp}`);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    console.log('[Update Route] Successful update, returning result:', result.message);
    return NextResponse.json({ 
      success: true, 
      message: result.message 
    });
  } catch (error) {
    console.error('Error updating team standings:', error);
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      success: false, 
      error: 'An error occurred while updating team standings', 
      details: errorMessage
    }, { 
      status: 500 
    });
  }
}
