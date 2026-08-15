import React from 'react';
import { headers } from 'next/headers';

// Use ISR with tags for revalidation
export const dynamic = 'auto';
export const runtime = 'nodejs';
// Enable tag-based revalidation
export const revalidate = 300; // 5 minutes fallback

import { getUsersWithPredictions } from '@/lib/db/queries/users';
import { getTeams } from '@/lib/db/queries/teams';
import { shouldUpdateStandings, updateTeamStandings } from '@/lib/api';
import RefreshLeaderboardButton from '@/components/refresh-leaderboard-button';
import LeaderboardTable from '@/components/leaderboard-table';

// Helper function to calculate points according to specification
const calculatePoints = (predictedPosition: number | undefined | null, actualPosition: number | null) => {
  let points = 0;
  
  // Return 0 if we don't have valid positions to compare
  if (predictedPosition === undefined || predictedPosition === null || actualPosition === null) {
    return points;
  }
  
  const diff = Math.abs(predictedPosition - actualPosition);
  
  // Helper functions to check if a position is in a special zone
  const inTopFour = (pos: number) => pos >= 1 && pos <= 4;
  const inRelegationZone = (pos: number) => pos >= 18 && pos <= 20;
  
  // Base points
  if (diff === 0) {
    points = 2; // Exact prediction - 2 base points
    
    // Bonus points for correct predictions in key positions
    if (actualPosition === 1) {
      points += 1; // Bonus for correctly predicting champion
    } 
    else if (actualPosition >= 2 && actualPosition <= 4) {
      points += 1; // Bonus for correctly predicting top 4 (not champion)
    } 
    else if (actualPosition >= 18 && actualPosition <= 20) {
      points += 1; // Bonus for correctly predicting relegation zone
    }
  } 
  else if (diff === 1) {
    points = 1; // Off by one - 1 base point
    
    // Bonus points when both positions are in the same special zone
    // Both predicted and actual are in top 4
    if (inTopFour(predictedPosition) && inTopFour(actualPosition)) {
      points += 1;
    }
    // Both predicted and actual are in relegation zone
    else if (inRelegationZone(predictedPosition) && inRelegationZone(actualPosition)) {
      points += 1;
    }
  } 
  else if (diff <= 3) {
    points = 0; // Off by 2 or 3 - normally 0 base points
    
    // Bonus point when both positions are in the same special zone despite being off by 2-3 positions
    // Both predicted and actual are in top 4
    if (inTopFour(predictedPosition) && inTopFour(actualPosition)) {
      points += 1;
    }
    // Both predicted and actual are in relegation zone
    else if (inRelegationZone(predictedPosition) && inRelegationZone(actualPosition)) {
      points += 1;
    }
  }
  else {
    points = 0; // Off by more than three - 0 points
  }
  
  return points;
};

// Function to set cache control headers
export function generateMetadata() {
  // This ensures browsers don't cache the page
  return {
    other: {
      'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  };
}

const LeaderboardPage = async () => {
  // Get users with their predictions
  const users = await getUsersWithPredictions();
  
  // Force a timestamp parameter to ensure we always get a fresh response
  const timestamp = Date.now();
  
  // Check if team standings data is stale (older than 5 minutes)
  const needsUpdate = await shouldUpdateStandings(`timestamp-${timestamp}`);
  
  // If update is needed, fetch fresh data from API
  if (needsUpdate) {
    // Add timestamp to ensure fresh API call
    await updateTeamStandings(`refresh-${timestamp}`);
  }

  // Always get the teams after potential update
  const teams = await getTeams();

  // Create a map of user predictions for easier access
  const userPredictionsMap = new Map<number, Record<number | string, number | null>>();
  
  // Process users and their predictions
  users.forEach((user) => {
    const predictions: Record<number | string, number | null> = {};
    
    // If user has predictions, use them
    if (user.predictions.length > 0) {
      user.predictions.forEach(p => {
        predictions[p.teamId] = p.predictedPosition;
      });
    }
    
    userPredictionsMap.set(user.id, predictions);
  });
  
  // Calculate scores and prepare data for the client component
  const processedUsers = users.map(user => {
    const predictions = userPredictionsMap.get(user.id) || {};
    let totalPoints = 0;
    
    // Calculate points for each prediction
    teams.forEach(team => {
      const predictedPosition = predictions[team.id];
      const points = calculatePoints(predictedPosition, team.actualPosition);
      // Store points for each prediction
      predictions[`${team.id}_points`] = points;
      totalPoints += points;
    });
    
    return { 
      id: user.id, 
      name: user.name, 
      points: totalPoints,
      predictions: predictions
    };
  });
  
  // Sort users by total points
  const sortedUsers = [...processedUsers].sort((a, b) => b.points - a.points);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-center md:text-left">Leaderboard</h1>
        <div className="flex items-center">
          <RefreshLeaderboardButton />
        </div>
      </div>
      
      {/* Use the client component for the table */}
      <LeaderboardTable 
        teams={teams} 
        users={sortedUsers}
      />
    </div>
  );
};

export default LeaderboardPage;
