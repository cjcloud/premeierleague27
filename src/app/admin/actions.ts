'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { updateTeamStandings } from '@/lib/api';

export async function updateAccessCode(userId: number, newCode: string) {
  if (!newCode || newCode.length < 6) {
    return { error: 'Access code must be at least 6 characters long.' };
  }

  try {
    await db.update(users).set({ accessCode: newCode }).where(eq(users.id, userId));
    revalidatePath('/admin');
    return { success: 'Access code updated successfully.' };
  } catch (error) {
    // Error handled silently to prevent logging sensitive information
    return { error: 'An unexpected error occurred.' };
  }
}

export async function forceRefreshStandings() {
  try {
    // Force refreshing team standings
    const result = await updateTeamStandings();
    
    // Revalidate both the admin page and the leaderboard page
    revalidatePath('/admin');
    revalidatePath('/leaderboard');
    
    if (result.success) {
      return { success: 'Team standings updated successfully.' };
    } else {
      return { error: result.error || 'Failed to update team standings.' };
    }
  } catch (error) {
    // Error handled silently to prevent logging sensitive information
    return { error: 'An unexpected error occurred while refreshing data.' };
  }
}
