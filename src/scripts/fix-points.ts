import { db } from '../db';
import { teams } from '../db/schema';
import { eq } from 'drizzle-orm';

// This script updates team points based on the current standings
// The points values are hardcoded based on the user's request

async function fixPoints() {
  console.log('Fixing team points...');
  
  // Create a map of team abbreviations to their actual points
  const teamPoints = new Map<string, number>([
    ['TOT', 6], // Tottenham - 6 points
    ['CHE', 4], // Chelsea - 4 points
    ['LIV', 3], // Liverpool - 3 points
    // Add other teams with their points
    ['MCI', 3], // Manchester City
    ['ARS', 3], // Arsenal
    ['BRE', 3], // Brentford
    ['NEW', 3], // Newcastle
    ['BHA', 3], // Brighton
    ['MUN', 3], // Manchester United
    ['NFO', 3], // Nottingham Forest
    ['CRY', 1], // Crystal Palace
    ['BOU', 1], // Bournemouth
    ['FUL', 1], // Fulham
    ['AVL', 1], // Aston Villa
    ['EVE', 0], // Everton
    ['WOL', 0], // Wolverhampton
    ['LEE', 0], // Leeds
    ['BUR', 0], // Burnley
    ['WHU', 0], // West Ham
    ['SUN', 0], // Sunderland
  ]);
  
  // Get all teams
  const allTeams = await db.select().from(teams);
  
  // Update each team's points
  for (const team of allTeams) {
    if (team.abbr && teamPoints.has(team.abbr)) {
      const points = teamPoints.get(team.abbr);
      console.log(`Updating ${team.name} (${team.abbr}) points to ${points}`);
      
      await db
        .update(teams)
        .set({ 
          points: points,
          lastUpdated: new Date()
        })
        .where(eq(teams.id, team.id));
    }
  }
  
  console.log('Team points have been fixed!');
}

// Execute the function
fixPoints()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
