import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function proxy(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // CRITICAL: Allow ALL /api/ routes through (including cron)
    if (pathname.startsWith('/api/')) {
      return NextResponse.next();
    }

    // Allow access to setup pages (but not for admins on flat-number setup)
    if (pathname.startsWith('/setup/')) {
      // Admins should not access flat-number setup - redirect to dashboard
      if (pathname === '/setup/flat-number' && token?.role === 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      return NextResponse.next();
    }

    // Admin onboarding route - only for admins
    if (pathname === '/admin/onboarding') {
      if (token?.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
      return NextResponse.next();
    }

    // Admin routes protection
    if (pathname.startsWith('/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Ensure user has a communityId for protected routes
    if (pathname.startsWith('/dashboard') || 
      pathname.startsWith('/community') ||
        pathname.startsWith('/amenity') || 
        pathname.startsWith('/bookings') ||
        pathname.startsWith('/profile') ||
        pathname.startsWith('/calendar') ||
        pathname.startsWith('/notifications') ||
        pathname.startsWith('/settings')) {
      
      // CRITICAL: Allow admins through without communityId check
      if (token?.role === 'admin') {
        return NextResponse.next();
      }
      
      if (!token?.communityId) {
        // Redirect to a community assignment page or contact admin
        return NextResponse.redirect(new URL('/auth/community-required', req.url));
      }

      // Check if user needs to set up flat number (non-admin users only)
      if (token?.role !== 'admin' && !token?.profileCompleted) {
        return NextResponse.redirect(new URL('/setup/flat-number', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // CRITICAL: Allow ALL /api/ routes without authentication
        if (pathname.startsWith('/api/')) {
          return true;
        }
        
        // Allow access to public pages (landing page, auth pages, legal pages)
        if (pathname === '/' || 
            pathname.startsWith('/auth') || 
            pathname.startsWith('/landing') ||
            pathname === '/privacy' ||
            pathname === '/terms' ||
            pathname === '/security' ||
            pathname.startsWith('/contact')) {
          return true;
        }
        
        // Require authentication for all other routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!_next|api/auth|api/cron|favicon.ico|manifest.json|manifest.webmanifest|sw.js|workbox-.*\\.js|fallback-.*\\.js|.*\\..*).*)',
  ],
};