'use server';

import { db } from '@/db';
import { predictions, users } from '@/db/schema';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';

interface TeamPrediction {
  teamId: number;
  position: number;
}

export async function submitPredictions(predictionsList: TeamPrediction[]) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return { error: 'You must be logged in to submit predictions.' };
  }

  const userId = session.id as number;

  try {
    // Verify user exists before proceeding
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) {
      // This can happen if the user's session is stale and the user has been deleted.
      // Clearing the session and forcing a re-login is the best course of action.
      session.destroy();
      return { error: 'Your session is invalid. Please log in again.' };
    }

    // The Neon serverless driver does not support transactions. 
    // We will perform delete and insert operations sequentially.
    
    // 1. Delete existing predictions for the user
    await db.delete(predictions).where(eq(predictions.userId, userId));

    // 2. Prepare the new predictions for insertion
    const newPredictions = predictionsList.map(p => ({
      userId,
      teamId: p.teamId,
      predictedPosition: p.position,
    }));

    // 3. Insert the new predictions
    if (newPredictions.length > 0) {
      await db.insert(predictions).values(newPredictions);
    }

  } catch (error) {
    console.error('Error submitting predictions:', error);
    return { error: 'A database error occurred. Please try again.' };
  }

  // Revalidate paths to ensure fresh data is shown
  revalidatePath('/leaderboard');
  revalidatePath('/predictions');
  // Redirect to the leaderboard after successful submission
  redirect('/leaderboard');
}
