import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Initialize the database connection
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function main() {
  // Resetting database
  await db.delete(schema.predictions);
  await db.delete(schema.users);
  await db.delete(schema.teams);
  // Database reset complete

  // Seeding database

  // Hardcoded user data as per specifications.
  // NOTE: fresh access codes for the 2026/27 season (see Specifications/codes.md, gitignored).
  const userData = [
    { name: 'Clive', accessCode: 'Cv7&kRm2', isAdmin: 0 },
    { name: 'John', accessCode: 'Jn4!tPw9', isAdmin: 0 },
    { name: 'Dingle', accessCode: 'Dg2#xQs6', isAdmin: 0 },
    { name: 'Chris', accessCode: 'Ch9$zNb3', isAdmin: 1 }, // Chris is the admin
  ];

  // Insert users.
  await db.insert(schema.users).values(userData);

  // Seeding teams

  // Fetch team data from the Premier League API for the 2026/27 season (season id "2026").
  const response = await fetch('https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v5/competitions/8/seasons/2026/standings?live=false', {
    headers: {
      'Origin': 'https://www.premierleague.com',
      'Referer': 'https://www.premierleague.com/',
      'Accept': 'application/json, text/plain, */*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch team data: ${response.statusText}`);
  }

  const data = await response.json();
  // Position lives at entry.overall.position (not entry.position). apiId column is an
  // integer, so parse the API's string id.
  const teamsData = data.tables[0].entries.map((entry: any) => ({
    apiId: parseInt(entry.team.id, 10),
    name: entry.team.name,
    shortName: entry.team.shortName,
    abbr: entry.team.abbr,
    actualPosition: entry.overall?.position ?? null,
  }));

  // Insert teams, and on conflict (based on apiId), do nothing.
  await db.insert(schema.teams).values(teamsData).onConflictDoNothing({ target: schema.teams.apiId });

  // Teams seeded successfully

  // Database seeded successfully
}

main().catch(() => {
  // Silent error handling to prevent logging sensitive information
  process.exit(1);
});
