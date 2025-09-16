import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
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

type AuthResult = AuthSuccess | AuthFailure;

export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const supabase = createServerClient();
  
  // Get the user from the session
  const { data: { user }, error } = await supabase.auth.getUser();
  
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