"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

interface LeaderboardClientProps {
  isLoggedIn: boolean;
  username: string | null;
}

export function LeaderboardClient({ isLoggedIn, username }: LeaderboardClientProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const loggedIn = searchParams.get('loggedin');
    if (loggedIn === 'true' && isLoggedIn && username) {
      toast.success(`Welcome, ${username}!`);
    }
  }, [searchParams, isLoggedIn, username]);

  return null; // This component does not render anything itself
}
