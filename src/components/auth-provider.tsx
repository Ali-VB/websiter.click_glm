"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // DISABLED: AuthProvider fetch interception
    // The dashboard already handles authentication properly with Supabase sessions
    // This was causing network errors with notification APIs
    console.log('AuthProvider: Fetch interception disabled to prevent conflicts with Supabase auth');

    // Add authorization header to fetch requests for protected routes
    // const originalFetch = window.fetch;
    //
    // window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
    //   // Check if this is a request to a protected route
    //   const url = typeof input === 'string' ? input : input.toString();
    //   const isProtectedRoute = (
    //     (url.startsWith('/admin') || url.startsWith('/api/admin') || url.startsWith('/api/notifications')) &&
    //     !url.includes('supabase.co')
    //   ); // Add notification routes to protected routes
    //
    //   if (isProtectedRoute) {
    //     // For Supabase-based auth, we don't need to add auth tokens
    //     // The dashboard already handles this properly
    //     console.log('Protected route detected, but AuthProvider will not interfere:', url);
    //   }
    //
    //   return originalFetch.call(this, input, init);
    // };

    // // Cleanup function to restore original fetch
    // return () => {
    //   window.fetch = originalFetch;
    // };
  }, [pathname]);

  // Check for authentication on protected routes
  useEffect(() => {
    const isProtectedRoute = pathname.startsWith('/admin');
    
    if (isProtectedRoute) {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        // No token found, redirect to login
        router.push('/login');
      }
    }
  }, [pathname, router]);

  return <>{children}</>;
}
