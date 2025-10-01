import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

// These environment variables will be set up in the next step
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client for browser use
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})

// Server client for API routes and middleware
export function createServerClient(tokenOrRequest?: NextRequest | string) {
  if (!tokenOrRequest) {
    // For API routes usage without auth context
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  // Support bearer token strings
  if (typeof tokenOrRequest === 'string') {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${tokenOrRequest}`,
        },
      },
    });
  }

  // For middleware usage with request context (NextRequest object)
  const authHeader = tokenOrRequest.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Use bearer token if present
    const token = authHeader.substring(7);
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  }

  // Fall back to cookie-based auth
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        // Forward cookies from the request to the server client
        cookie: tokenOrRequest.headers.get('cookie') || '',
      },
    },
  });
}

// Service role client for admin operations that need to bypass RLS
export function createServiceRoleClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
