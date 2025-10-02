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
    // COMPLETELY DISABLED: AuthProvider fetch interception
    // All authentication is handled by individual components using Supabase client
    // This was causing network errors with all API calls
    console.log('AuthProvider: All fetch interception disabled - components handle auth individually');

    // Remove fetch interception completely
    // window.fetch = originalFetch;

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
