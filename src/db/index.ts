// Properly load environment variables
import dotenv from 'dotenv';

// Load environment variables from all possible .env files
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.development' });
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Database connection setup.
// The connection string MUST come from the environment (DATABASE_URL) — never hardcode
// credentials. Set it in .env.local locally and in the Vercel project settings in prod.
const databaseURL = process.env.DATABASE_URL;

if (!databaseURL) {
  throw new Error('DATABASE_URL is not set. Add it to .env.local (and Vercel env vars).');
}

const sql = neon(databaseURL);

export const db = drizzle(sql, { schema });

// Database connection initialized

