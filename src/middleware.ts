import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { sessionOptions, SessionData } from '@/lib/session';
import { unsealData } from 'iron-session';

// Paths that should not be intercepted by middleware (static files and Next.js internal routes)
const publicPaths = [
  /^\/(?!api|admin|predictions).*/, // public pages (not api, admin, or predictions)
  /^\/_next\/static(?:\/.*)?$/, // static files
  /^\/_next\/image(?:\/.*)?$/, // images
  /^\/favicon\.ico$/, // favicon
  /^\/images\/.*$/, // images in public
  /^\/_next\/data\/.*$/, // next.js data
  /\.css$/, // CSS files
  /\.(?:svg|png|jpg|jpeg|gif|webp)$/, // other static assets
];

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files to avoid CSS loading issues
  if (publicPaths.some((path) => path.test(pathname)) || 
      pathname.includes('/api/') ||
      pathname.includes('/static/')) {
    return NextResponse.next();
  }
  
  // Restrict /predictions route to admin users only
  if (pathname.startsWith('/predictions')) {
    // Get session cookie
    const sessionCookie = request.cookies.get(sessionOptions.cookieName);
    
    // Default to not authenticated if no cookie exists
    if (!sessionCookie?.value) {
      // Redirect to home page
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    try {
      // Attempt to unseal the session data
      const session = await unsealData<SessionData>(sessionCookie.value, {
        password: sessionOptions.password,
      });
      
      // Check if user is logged in and is an admin
      if (!session.isLoggedIn || !session.isAdmin) {
        // Redirect non-admin users to the home page
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (error) {
      // Invalid or expired session, redirect to home
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Ensure the admin route exists in production by explicitly handling it
  if (pathname.startsWith('/admin')) {
    // Simply pass through for now, the page itself will handle authentication
    // This ensures the route exists in production
    return NextResponse.next();
  }

  return NextResponse.next();
}

// See https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
