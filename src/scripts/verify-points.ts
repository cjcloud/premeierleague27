import { db } from '../db';
import { teams } from '../db/schema';

async function verifyPoints() {
  console.log('Verifying team points in the database...');
  
  // Get all teams ordered by actual position
  const allTeams = await db.select().from(teams).orderBy(teams.actualPosition);
  
  console.log('\nCurrent team standings and points:');
  console.log('=================================');
  console.log('Pos | Team Name                  | Points');
  console.log('------------------------------------');
  
  for (const team of allTeams) {
    // Format the output in a table-like format
    const position = team.actualPosition?.toString().padStart(2, ' ') || '--';
    const name = team.name.padEnd(25, ' ');
    const points = team.points?.toString().padStart(2, ' ') || ' 0';
    
    console.log(`${position} | ${name} | ${points}`);
  }
}

// Execute the function
verifyPoints()
  .then(() => {
    console.log('\nVerification complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
