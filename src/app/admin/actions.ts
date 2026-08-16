'use server';

import { db } from '@/db';
import { users, predictions } from '@/db/schema';
import { and, eq, ne, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';
import { updateTeamStandings } from '@/lib/api';

type ActionResult =
  | { success: string; error?: undefined }
  | { error: string; success?: undefined };

// Every user-management action must be admin-only. Returns the session when the
// caller is a logged-in admin, otherwise null.
async function requireAdmin() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.isAdmin) {
    return null;
  }
  return session;
}

function validateUserInput(name: string, code: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'Name is required.';
  }
  if (!code || code.length < 6) {
    return 'Access code must be at least 6 characters long.';
  }
  return null;
}

async function countAdmins(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.isAdmin, 1));
  return Number(row?.count ?? 0);
}

export async function addUser(input: {
  name: string;
  accessCode: string;
  isAdmin: boolean;
}): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: 'Not authorised.' };

  const name = input.name?.trim();
  const code = input.accessCode?.trim();
  const invalid = validateUserInput(name, code);
  if (invalid) return { error: invalid };

  try {
    const existing = await db.query.users.findFirst({
      where: eq(users.accessCode, code),
    });
    if (existing) {
      return { error: 'That access code is already in use. Choose another.' };
    }

    await db.insert(users).values({
      name,
      accessCode: code,
      isAdmin: input.isAdmin ? 1 : 0,
    });
    revalidatePath('/admin');
    revalidatePath('/leaderboard');
    return { success: `User "${name}" added.` };
  } catch (error) {
    // Handled quietly to avoid leaking details.
    return { error: 'An unexpected error occurred.' };
  }
}

export async function updateUser(
  userId: number,
  input: { name: string; accessCode: string; isAdmin: boolean }
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: 'Not authorised.' };

  const name = input.name?.trim();
  const code = input.accessCode?.trim();
  const invalid = validateUserInput(name, code);
  if (invalid) return { error: invalid };

  try {
    // Access code must be unique across OTHER users.
    const clash = await db.query.users.findFirst({
      where: and(eq(users.accessCode, code), ne(users.id, userId)),
    });
    if (clash) {
      return { error: 'That access code is already in use by another user.' };
    }

    // Don't allow demoting the last remaining admin.
    if (!input.isAdmin) {
      const target = await db.query.users.findFirst({ where: eq(users.id, userId) });
      if (target?.isAdmin === 1 && (await countAdmins()) <= 1) {
        return {
          error: 'You cannot remove the last admin. Make another user an admin first.',
        };
      }
    }

    await db
      .update(users)
      .set({ name, accessCode: code, isAdmin: input.isAdmin ? 1 : 0 })
      .where(eq(users.id, userId));
    revalidatePath('/admin');
    revalidatePath('/leaderboard');
    return { success: `User "${name}" updated.` };
  } catch (error) {
    return { error: 'An unexpected error occurred.' };
  }
}

export async function deleteUser(userId: number): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: 'Not authorised.' };

  try {
    if (session.id === userId) {
      return { error: 'You cannot delete the account you are logged in with.' };
    }

    const target = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!target) return { error: 'User not found.' };

    if (target.isAdmin === 1 && (await countAdmins()) <= 1) {
      return { error: 'You cannot delete the last admin.' };
    }

    // Predictions reference the user (no ON DELETE CASCADE), so clear them first.
    await db.delete(predictions).where(eq(predictions.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
    revalidatePath('/admin');
    revalidatePath('/leaderboard');
    return { success: `User "${target.name}" deleted.` };
  } catch (error) {
    return { error: 'An unexpected error occurred.' };
  }
}

export async function forceRefreshStandings(): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: 'Not authorised.' };

  try {
    const result = await updateTeamStandings();
    revalidatePath('/admin');
    revalidatePath('/leaderboard');

    if (result.success) {
      return { success: 'Team standings updated successfully.' };
    }
    return { error: result.error || 'Failed to update team standings.' };
  } catch (error) {
    return { error: 'An unexpected error occurred while refreshing data.' };
  }
}
