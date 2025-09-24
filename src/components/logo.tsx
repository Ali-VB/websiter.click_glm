"use client";

import { useTheme } from "@/components/theme-provider";

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  forceDark?: boolean;
  forceLight?: boolean;
}

export function Logo({ 
  className = "", 
  size = 32, 
  showText = true, 
  forceDark = false, 
  forceLight = false 
}: LogoProps) {
  const { isDark } = useTheme();

  // Determine if we should use dark mode colors
  const useDarkMode = forceDark || (!forceLight && isDark);

  // Set colors based on mode
  const logoColor = useDarkMode ? "hsl(0 0% 98%)" : "hsl(222.2 84% 4.9%)";
  const textColor = useDarkMode ? "hsl(0 0% 98%)" : "hsl(222.2 84% 4.9%)";

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        className="flex-shrink-0"
        aria-label="Websiter.click logo"
        style={{ color: logoColor }}
      >
        <path
          d="M100 65 L 100 20 L 20 20 L 20 100 L 50 100 L 60 90 L 70 100"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      </svg>
      {showText && (
        <span className="font-bold text-xl" style={{ color: textColor }}>
          websiter.click
        </span>
      )}
    </div>
  );
}
