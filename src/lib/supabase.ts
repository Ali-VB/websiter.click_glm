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
export function createServerClient(request?: NextRequest) {
  if (request) {
    // For middleware usage with request context
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          // Forward cookies from the request to the server client
          cookie: request.headers.get('cookie') || '',
        },
      },
    });
  }
  
  // For API routes usage
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}