"use server";

import { db } from '@/db';
import { users } from '@/db/schema';
import { login as saveLoginSession, getSession } from '@/lib/session';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function login(
  prevState: { error: string } | void | undefined,
  formData: FormData
): Promise<{ error: string } | void> {
  const code = formData.get('code') as string;

  if (!code || code.length === 0) {
    return { error: 'Access code cannot be empty.' };
  }

  let foundUser;
  try {
    foundUser = await db.query.users.findFirst({
      where: eq(users.accessCode, code),
    });
  } catch (error) {
    console.error('Database error during login:', error);
    return { error: 'A database error occurred. Please try again.' };
  }

  if (!foundUser) {
    return { error: 'Invalid access code. Please try again.' };
  }

  try {
    await saveLoginSession(foundUser);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Login error:', error.message);
      return { error: 'An unexpected error occurred. Please try again.' };
    }
    return { error: 'An unknown error occurred.' };
  }

  redirect('/predictions');
}

export async function logout() {
  const session = await getSession();
  await session.destroy();
  redirect('/login');
}
