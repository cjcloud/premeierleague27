import 'server-only';
import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';

// Define User type based on the schema
export interface User {
  id: number;
  name: string;
  accessCode: string;
  isAdmin: number;
}

export interface SessionData {
  isLoggedIn: boolean;
  id: number;
  name: string;
  isAdmin: boolean;
}

export type Session = IronSession<SessionData>;

export const sessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD || process.env.SESSION_SECRET as string,
  cookieName: 'session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

export function getSession() {
  return getIronSession<SessionData>(cookies(), sessionOptions);
}

export async function getSafeSession() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  return {
    isLoggedIn: session.isLoggedIn ?? false,
    id: session.id,
    name: session.name,
    isAdmin: session.isAdmin,
  };
}

export async function login(user: User) {
  const session = await getSession();
  session.isLoggedIn = true;
  session.id = user.id;
  session.name = user.name;
  session.isAdmin = user.isAdmin === 1;
  await session.save();
}

export async function logout() {
  const session = await getSession();
  session.destroy();
}
