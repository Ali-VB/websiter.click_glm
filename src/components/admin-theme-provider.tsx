"use client";

import { createContext, useContext, useEffect, useState } from "react";

type AdminTheme = "light";

type AdminThemeProviderProps = {
  children: React.ReactNode;
};

type AdminThemeProviderState = {
  theme: AdminTheme;
  isDark: boolean;
};

const initialState: AdminThemeProviderState = {
  theme: "light",
  isDark: false,
};

const AdminThemeProviderContext = createContext<AdminThemeProviderState>(initialState);

export function AdminThemeProvider({
  children,
  ...props
}: AdminThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  // Only run on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const root = window.document.documentElement;

    // Always remove dark theme and ensure light theme for admin
    root.classList.remove("dark");
    root.classList.add("light");
  }, [mounted]);

  const value = {
    theme: "light" as AdminTheme,
    isDark: false,
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <AdminThemeProviderContext.Provider {...props} value={initialState}>
        {children}
      </AdminThemeProviderContext.Provider>
    );
  }

  return (
    <AdminThemeProviderContext.Provider {...props} value={value}>
      {children}
    </AdminThemeProviderContext.Provider>
  );
}

export const useAdminTheme = () => {
  const context = useContext(AdminThemeProviderContext);

  if (context === undefined)
    throw new Error("useAdminTheme must be used within a AdminThemeProvider");

  return context;
};
