import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth, onboardingAccessControl } from '@/lib/middleware';

// This middleware protects all admin routes and API routes
export async function middleware(request: NextRequest) {
  // Check if the path is an admin UI route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return adminAuth(request);
  }
  
  // Check if the path is an admin API route
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    return adminAuth(request);
  }
  
  // Check if the path is the onboarding route
  if (request.nextUrl.pathname.startsWith('/onboarding')) {
    return onboardingAccessControl(request);
  }
  
  return NextResponse.next();
}

// Configure the middleware to run on all paths except static files
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};