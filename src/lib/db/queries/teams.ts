import { db } from '@/db';
import { teams } from '@/db/schema';
import { desc } from 'drizzle-orm';

export const getTeams = async () => {
  const t = await db.select().from(teams);
  return t;
};

export const getLastUpdateTimestamp = async () => {
  const result = await db
    .select({ lastUpdated: teams.lastUpdated })
    .from(teams)
    .orderBy(desc(teams.lastUpdated))
    .limit(1);
  
  return result.length > 0 ? result[0].lastUpdated : null;
};
