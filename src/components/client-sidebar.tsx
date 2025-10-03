"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  LayoutDashboard, 
  FolderOpen, 
  FileText, 
  HelpCircle, 
  Settings, 
  Menu,
  X,
  Bell,
  Search,
  Sun,
  Moon,
  Clock,
  Upload,
  User,
  CreditCard
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/theme-provider";
import { Logo } from "@/components/logo";

interface ClientSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  unreadNotifications: number;
  projectsCount?: number;
  invoicesCount?: number;
  onNavigate?: (tab: string) => void;
}

interface UserProfile {
  full_name?: string;
  email?: string;
}

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Projects",
    href: "/dashboard/projects",
    icon: FolderOpen,
  },
  {
    name: "Assets",
    href: "/dashboard/assets",
    icon: Upload,
  },
  {
    name: "Payments",
    href: "/dashboard/payments",
    icon: CreditCard,
  },
  {
    name: "Support",
    href: "/dashboard/support", 
    icon: HelpCircle,
  },
  {
    name: "Account",
    href: "/dashboard/account",
    icon: User,
  },
  {
    name: "Invoices", 
    href: "/dashboard/invoices",
    icon: FileText,
  },
  {
    name: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
  },
];

export function ClientSidebar({ 
  isOpen, 
  onToggle, 
  isDarkMode, 
  onThemeToggle, 
  unreadNotifications,
  projectsCount = 0,
  invoicesCount = 0,
  onNavigate
}: ClientSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [loading, setLoading] = useState(true);

  // Get active tab from URL params
  const activeTab = searchParams.get('tab') || 'projects';

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Get user profile from metadata or fetch from profiles table
          const profile = user.user_metadata || {};
          setUserProfile({
            full_name: profile.full_name || user.email?.split('@')[0] || 'User',
            email: user.email || ''
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleNavigation = (href: string) => {
    // Use Next.js router for navigation
    window.location.href = href;
    
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-full w-64 bg-card border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <Logo size={32} showText={true} />
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* User Profile Section */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback>
                  {loading ? '...' : getInitials(userProfile.full_name || 'User')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {loading ? 'Loading...' : userProfile.full_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {loading ? 'Loading...' : userProfile.email || ''}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="p-4 border-b">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Projects</p>
                <p className="text-lg font-bold">{projectsCount}</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Invoices</p>
                <p className="text-lg font-bold">{invoicesCount}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-left",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-accent-foreground hover:bg-accent"
                  )}
                >
                  <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                  {item.name}
                </button>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onThemeToggle}
              className="w-full justify-start"
            >
              {isDarkMode ? (
                <>
                  <Sun className="mr-3 h-4 w-4" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="mr-3 h-4 w-4" />
                  Dark Mode
                </>
              )}
            </Button>
            
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href="/">
                <LayoutDashboard className="mr-3 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
