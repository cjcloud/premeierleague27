import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const getUsersWithPredictions = async () => {
  const u = await db.query.users.findMany({
    with: {
      predictions: true,
    },
  });
  return u;
};
