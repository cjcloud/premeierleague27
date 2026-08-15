import { updateTeamStandings } from '@/lib/api';
import { db } from '@/db';
import { teams } from '@/db/schema';
import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';

export async function POST() {
  try {
    // Get current timestamp information for debugging
    const timestamp = Date.now();
    
    // Log critical information for debugging
    console.log(`[Force Update Route] Starting at ${new Date().toISOString()}`);
    
    // Get the most recent lastUpdated value from any team for debugging
    const result = await db
      .select({ lastUpdated: teams.lastUpdated })
      .from(teams)
      .orderBy(desc(teams.lastUpdated))
      .limit(1);
    
    console.log('[Force Update Route] Current DB timestamp:', 
      result.length ? result[0].lastUpdated : 'No teams found');
    
    // Force the update regardless of timestamp
    const updateResult = await updateTeamStandings(`force-update-${timestamp}`);
    
    console.log('[Force Update Route] Update completed with result:', updateResult);
    
    return NextResponse.json({ 
      success: updateResult.success, 
      message: updateResult.message || updateResult.error,
      timestamp: new Date().toISOString(),
      lastDbUpdate: result.length ? result[0].lastUpdated : null
    });
  } catch (error) {
    console.error('[Force Update Route] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An error occurred while forcing team standings update',
      errorDetails: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500 
    });
  }
}
