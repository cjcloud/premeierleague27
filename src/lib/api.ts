import { db } from '@/db';
import { teams } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Returns the most recent update timestamp from the teams table
 */
export async function getLastUpdateTime() {
  try {
    // Get the most recent lastUpdated value from any team
    const result = await db
      .select({ lastUpdated: teams.lastUpdated })
      .from(teams)
      .orderBy(desc(teams.lastUpdated))
      .limit(1);
    
    if (!result.length) {
      return { lastUpdated: null };
    }
    
    return { lastUpdated: result[0].lastUpdated };
  } catch (error) {
    console.error('Error getting last update time:', error);
    return { lastUpdated: null };
  }
}

// Premier League season identifier.
// The PL API labels seasons by their starting year: id "2026" == "Season 2026/2027".
// Bumping this single value moves the whole app to a new season.
export const SEASON_ID = '2026';
export const PL_COMPETITION_ID = '8';

// Direct Premier League API base + standings URL, built from SEASON_ID.
export const PL_API_BASE = `https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v5/competitions/${PL_COMPETITION_ID}/seasons/${SEASON_ID}`;
export const PL_STANDINGS_URL = `${PL_API_BASE}/standings?live=false`;

// Browser-like headers required to avoid the PL API's 403 on non-browser traffic.
export const PL_API_HEADERS = {
  'Origin': 'https://www.premierleague.com',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
  'Referer': 'https://www.premierleague.com/',
  'Content-Type': 'application/json',
  'Accept': 'application/json, text/plain, */*',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
} as const;

// How stale (minutes) standings data may be before we re-fetch. Spec: 3 minutes.
const STALE_MINUTES = 3;

// Use direct Premier League API URL
const API_URL = PL_STANDINGS_URL;

interface ApiTeamEntry {
  team: {
    id: string;
  };
  overall: {
    position: number;
    points: number;
  };
}

interface ApiResponse {
  tables: {
    entries: ApiTeamEntry[];
  }[];
}

/**
 * Checks if the team standings data needs to be updated
 * Data is considered stale if it's older than STALE_MINUTES
 * @param cacheKey Optional parameter to prevent caching of this function call
 */
export async function shouldUpdateStandings(cacheKey?: string): Promise<boolean> {
  // Log the cache key to verify it's being used
  console.log(`shouldUpdateStandings called with cacheKey: ${cacheKey}`);
  try {
    // Get the most recent lastUpdated value from any team
    const result = await db
      .select({ lastUpdated: teams.lastUpdated })
      .from(teams)
      .orderBy(desc(teams.lastUpdated))
      .limit(1);
    
    console.log('Checking if data needs update - Query result:', result);
    
    // If no teams exist yet, we should definitely update
    if (!result.length) {
      console.log('No teams found in database. Update needed.');
      return true;
    }
    
    const lastUpdate = result[0].lastUpdated;
    if (!lastUpdate) {
      console.log('Teams exist but lastUpdated is null. Update needed.');
      return true;
    }
    
    // Ensure we're working with UTC timestamps to avoid timezone issues
    const nowUtc = new Date();
    // Log both local and UTC timestamps for debugging
    console.log(`Last update time from DB: ${lastUpdate}`);
    console.log(`Current time (local): ${nowUtc}`);
    console.log(`Current time (UTC string): ${nowUtc.toUTCString()}`);
    
    // Calculate time difference in milliseconds
    const diffMs = nowUtc.getTime() - lastUpdate.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    
    console.log(`Time difference: ${diffMinutes.toFixed(2)} minutes`);

    // If data is older than STALE_MINUTES, we should update
    const isStale = diffMinutes > STALE_MINUTES;
    console.log(`Is data stale? ${isStale} (threshold: ${STALE_MINUTES} minutes)`);
    // Time-based update check complete
    
    return isStale;
  } catch (error) {
    // Error handled silently to prevent logging sensitive information
    // On error, it's safer to return false to avoid excessive API calls
    return false;
  }
}

/**
 * Updates team standings from the Premier League API
 * @param cacheKey Optional parameter to prevent caching of this function call
 * @param baseUrl Optional base URL to use instead of API_BASE_URL
 */
export async function updateTeamStandings(cacheKey?: string) {
  // No longer using baseUrl parameter since we're going direct to the API
  try {
    console.log('Requesting Premier League API URL:', API_URL);
    
    // Use the direct Premier League API URL
    const response = await fetch(API_URL, {
      headers: PL_API_HEADERS,
      cache: 'no-store',
    });
    
    if (!response.ok) {
      // Add more detailed error information for debugging
      try {
        const errorText = await response.text();
        console.error(`API Error Response (${response.status}):`, errorText);
      } catch (textError) {
        console.error('Could not extract error details from response');
      }
      throw new Error(`Premier League API request failed with status ${response.status}`);
    }

    const data: ApiResponse = await response.json();
    const standings = data.tables[0].entries;

    // Process teams from standings data all at once
    console.log(`Updating all ${standings.length} teams with latest API data`);
    
    // Current timestamp for all records
    const updateTimestamp = new Date();
    
    // Process each team but collect in a batch
    const updatePromises = standings.map(entry => {
      const apiId = parseInt(entry.team.id, 10);
      const position = entry.overall.position;
      const points = entry.overall.points;
      
      // Update regardless of previous values
      return db
        .update(teams)
        .set({ 
          actualPosition: position,
          points: points,
          lastUpdated: updateTimestamp // Same timestamp for all records
        })
        .where(eq(teams.apiId, apiId));
    });
    
    // Execute all updates in parallel
    await Promise.all(updatePromises);
    console.log('All teams updated with the same timestamp:', updateTimestamp);
    
    // Use tag-based revalidation instead of path-based to avoid issues with static generation
    revalidateTag('team-data');
    revalidateTag('leaderboard-data');
    revalidateTag('admin-data');
    revalidateTag('home-data');

    // Successfully updated team standings in the database
    return { success: true, message: `Updated ${standings.length} teams.` };

  } catch (error) {
    // Error handled silently to prevent logging sensitive information
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred' };
  }
}
