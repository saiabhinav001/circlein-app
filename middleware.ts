import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Debug logging
    console.log('🔍 Middleware check:', {
      pathname,
      email: token?.email,
      role: token?.role,
      communityId: token?.communityId,
      hasToken: !!token
    });

    // Allow access to setup pages and API routes
    if (pathname.startsWith('/setup/') || 
        pathname.startsWith('/api/')) {
      return NextResponse.next();
    }

    // Admin routes protection
    if (pathname.startsWith('/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Ensure user has a communityId for protected routes
    if (pathname.startsWith('/dashboard') || 
        pathname.startsWith('/amenity') || 
        pathname.startsWith('/bookings') ||
        pathname.startsWith('/profile') ||
        pathname.startsWith('/calendar') ||
        pathname.startsWith('/notifications') ||
        pathname.startsWith('/settings')) {
      
      if (!token?.communityId) {
        console.error('❌ MIDDLEWARE BLOCKING: No communityId in token for:', token?.email);
        console.error('Token data:', JSON.stringify(token, null, 2));
        // Redirect to a community assignment page or contact admin
        return NextResponse.redirect(new URL('/auth/community-required', req.url));
      }

      // Check if user needs to set up flat number (non-admin users only)
      if (token?.role !== 'admin' && !token?.profileCompleted) {
        console.log('Redirecting user to flat number setup:', token?.email);
        return NextResponse.redirect(new URL('/setup/flat-number', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow access to auth pages
        if (pathname.startsWith('/auth')) {
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
    '/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)',
  ],
};