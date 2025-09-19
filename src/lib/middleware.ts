import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import type { NextRequest } from 'next/server';

export type Role = 'client' | 'admin';

interface AuthSuccess {
  success: true;
  user: {
    id: string;
    email: string | undefined;
    role: Role;
  };
}

interface AuthFailure {
  success: false;
  error: string;
}

type AuthResult = (AuthSuccess | AuthFailure) & { response: NextResponse };

export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  // Try to get the authorization header first
  const authHeader = request.headers.get('authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // If we have a bearer token, use it directly
    const token = authHeader.substring(7);
    const supabase = createServerClient();
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { success: false, error: 'Unauthorized' };
    }
    
    // Get the user's role from the clients table
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (clientError || !client) {
      return { success: false, error: 'User not found', response };
    }
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: client.role as Role
      }
    };
  }
  
  // Fall back to cookie-based authentication
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
  const supabase = createMiddlewareClient({ req: request, res: response });
  
  // Try to get the user from the session
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { success: false, error: 'Unauthorized', response };
  }
  
  // Get the user's role from the clients table
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (clientError || !client) {
    return { success: false, error: 'User not found' };
  }
  
  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      role: client.role as Role
    }
  };
}

export async function requireRole(request: NextRequest, requiredRole: Role): Promise<AuthResult> {
  const authResult = await requireAuth(request);
  
  if (!authResult.success) {
    return authResult;
  }
  
  if (authResult.user.role !== requiredRole) {
    return { success: false, error: 'Insufficient permissions' };
  }
  
  return authResult;
}

export function createAuthMiddleware(requiredRole?: Role) {
  return async function middleware(request: NextRequest) {
    const authResult = requiredRole 
      ? await requireRole(request, requiredRole)
      : await requireAuth(request);
    
    if (!authResult.success) {
      // For API routes, return a JSON response
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: authResult.error },
          { status: 401 }
        );
      }
      
      // For UI routes, redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Add user info to request headers for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', authResult.user.id);
      requestHeaders.set('x-user-email', authResult.user.email || '');
      requestHeaders.set('x-user-role', authResult.user.role);
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
    
    return NextResponse.next();
  };
}

// Specialized middleware for admin routes
export const adminAuth = createAuthMiddleware('admin');

// Specialized middleware for authenticated routes (any role)
export const userAuth = createAuthMiddleware();

/**
 * Checks if a user has an ongoing project
 * @param userId The ID of the user to check
 * @returns Promise<boolean> True if the user has an ongoing project, false otherwise
 */
export async function hasOngoingProject(userId: string): Promise<boolean> {
  const supabase = createServerClient();
  
  const { data: ongoingProject } = await supabase
    .from('projects')
    .select('id')
    .eq('client_id', userId)
    .eq('status', 'ongoing')
    .single();
  
  return !!ongoingProject;
}

/**
 * Middleware to prevent users with ongoing projects from accessing onboarding
 * Redirects authenticated users with ongoing projects to the dashboard
 * Allows guest users and authenticated users without ongoing projects to proceed
 */
export async function onboardingAccessControl(request: NextRequest) {
  // First check if the user is authenticated
  const authResult = await requireAuth(request);
  
  if (authResult.success) {
    // User is authenticated, check if they have an ongoing project
    const hasOngoing = await hasOngoingProject(authResult.user.id);
    
    if (hasOngoing) {
      // User has an ongoing project, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  // User is either not authenticated or doesn't have an ongoing project, allow access
  return NextResponse.next();
}
