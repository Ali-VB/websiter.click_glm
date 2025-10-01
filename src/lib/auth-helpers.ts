import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { Role } from './middleware';

export type { Role } from './middleware';

/**
 * Gets the current user from the request headers
 * This assumes that the middleware has already authenticated the user
 * and added user info to the request headers
 */
export function getCurrentUser(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const userEmail = request.headers.get('x-user-email');
  const userRole = request.headers.get('x-user-role') as Role | null;

  if (!userId || !userRole) {
    return null;
  }

  return {
    id: userId,
    email: userEmail,
    role: userRole,
  };
}

/**
 * Checks if the current user is an admin
 * Returns a 401 response if not authenticated or not an admin
 */
export function requireAdminUser(request: NextRequest) {
  const user = getCurrentUser(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  return null; // No error, user is authorized
}

/**
 * Checks if the current user is authenticated (any role)
 * Returns a 401 response if not authenticated
 */
export function requireAuthenticatedUser(request: NextRequest) {
  const user = getCurrentUser(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return null; // No error, user is authorized
}

/**
 * Gets the current user from the database using the JWT token
 * This is useful for cases where middleware might not have run
 */
export async function getUserFromToken(request: NextRequest) {
  // Get the authorization header
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  // Create Supabase client with bearer token
  const supabase = createServerClient(token);

  // Verify the token and get the user
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Get the user's role from the clients table
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('role')
    .eq('id', user.id)
    .single();

  if (clientError || !client) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: client.role as Role,
  };
}

/**
 * Checks if the user is an admin using the JWT token
 * This is useful for cases where middleware might not have run
 */
export async function requireAdminFromToken(request: NextRequest) {
  const user = await getUserFromToken(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  return null; // No error, user is authorized
}