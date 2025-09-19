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
    // Add authorization header to fetch requests for protected routes
    const originalFetch = window.fetch;
    
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
      // Check if this is a request to a protected route
      const url = typeof input === 'string' ? input : input.toString();
      const isProtectedRoute = url.startsWith('/admin') || url.startsWith('/api/admin');
      
      if (isProtectedRoute) {
        const token = localStorage.getItem('auth_token');
        
        if (token) {
          // Add authorization header
          const headers = new Headers(init?.headers);
          headers.set('Authorization', `Bearer ${token}`);
          
          init = {
            ...init,
            headers,
          };
        }
      }
      
      return originalFetch.call(this, input, init);
    };

    // Cleanup function to restore original fetch
    return () => {
      window.fetch = originalFetch;
    };
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
