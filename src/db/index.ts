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

// During `next build`, Next imports route modules to collect page data. Throwing at
// import time then would fail the build before env vars are ever used at runtime.
// A missing DATABASE_URL is still a real error at request time, where we fail loudly.
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

if (!databaseURL && !isBuildPhase) {
  throw new Error(
    'DATABASE_URL is not set. Add it to .env.local (and the Vercel project env vars).'
  );
}

// The placeholder is only ever reached during the build phase; real requests use the
// value from the environment.
const sql = neon(databaseURL || 'postgresql://build:build@localhost/build');

export const db = drizzle(sql, { schema });