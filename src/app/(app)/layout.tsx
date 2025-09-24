"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Determine if the system theme should be forced
  let forceSystemTheme = false;
  if (isClient) {
    const publicPaths = ['/login', '/signup', '/', '/onboarding', '/contact'];
    const isPublicPage = publicPaths.includes(pathname);
    
    // A simple client-side check for an auth token.
    const hasAuthToken = Object.keys(localStorage).some(key => 
      key.startsWith('sb-') && key.endsWith('-auth-token')
    );

    if (isPublicPage && !hasAuthToken) {
      forceSystemTheme = true;
    }
  }

  return (
    <ThemeProvider
      defaultTheme="system"
      storageKey="websiter-theme"
      forceSystemTheme={forceSystemTheme}
    >
      {children}
    </ThemeProvider>
  );
}
