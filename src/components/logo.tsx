"use client";

import { useTheme } from "@/components/theme-provider";

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function Logo({ className = "", size = 32, showText = true }: LogoProps) {
  const { isDark } = useTheme();

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
        <span className="font-bold text-xl">websiter.click</span>
      )}
    </div>
  );
}
