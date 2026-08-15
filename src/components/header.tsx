'use client';

import { useState, useRef, useEffect } from 'react';
import { getSession } from '@/lib/session';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/login/actions';
import { Button } from './ui/button';
import Image from 'next/image';

// Define a type for the session for easier usage
type Session = {
  isLoggedIn: boolean;
  isAdmin?: boolean;
};

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

export default function Header({ session }: { session: Session }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleLinkClick = () => {
    setMenuOpen(false);
  };



  const navLinks = (
    <>
      <Link href="/" onClick={handleLinkClick} className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Home</Link>
      <Link href="/leaderboard" onClick={handleLinkClick} className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Leaderboard</Link>
      {session.isLoggedIn && session.isAdmin && (
        <Link href="/admin" onClick={handleLinkClick} className="text-sm font-medium text-emerald-600 dark:text-emerald-400 font-semibold transition-colors hover:text-emerald-800 dark:hover:text-emerald-300">Admin</Link>
      )}
    </>
  );

  return (
    <header className="bg-emerald-50 dark:bg-teal-900 border-b border-emerald-100 dark:border-teal-800 px-4 py-3 sticky top-0 z-50 shadow-sm">
      <div className="container ml-0 mr-0 my-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/" onClick={handleLinkClick}>
            <Image src="/Premier League Square.svg" width={50} height={50} alt="Premier League Logo" className='w-50 h-50 md:w-50 md:h-50 lg:w-189 lg:h-63'/>
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-4">
            {navLinks}
          </nav>
          {session.isLoggedIn ? (
            <form action={logout}>
              <Button variant="outline" size="sm">Logout</Button>
            </form>
          ) : (
            <Link href="/login">
              <Button variant="default" size="sm">Login</Button>
            </Link>
          )}
        </div>

        {/* Mobile Nav Toggle */}
        <div className="md:hidden flex items-center">
          <Button variant="ghost" size="icon" onClick={() => setMenuOpen(!menuOpen)}>
            <MenuIcon className="h-6 w-6" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div ref={menuRef} className="md:hidden pt-2 pb-4">
          <nav className="flex flex-col items-start gap-2 px-4">
            {pathname !== '/' && navLinks}
            <div className="border-t w-full my-2"></div>
            {session.isLoggedIn ? (
              <form action={logout} className="w-full">
                <Button variant="outline" size="sm" className="w-full">Logout</Button>
              </form>
            ) : (
              <Link href="/login" className="w-full">
                <Button variant="default" size="sm" className="w-full">Login</Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
