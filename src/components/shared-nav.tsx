"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useLinkedInProfilePicture } from "@/hooks/useLinkedInProfilePicture";
import { createClientClient } from "@/lib/supabase-client";
import { resetGlobalAdminState } from "@/contexts/admin-context";
import type { User } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  LucideIcon,
} from "lucide-react";

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  hasDropdown?: boolean;
  submenu?: Array<{ name: string; href: string }>;
}

interface DropdownItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface SharedNavProps {
  logoText: string;
  logoHref: string;
  navigation: NavigationItem[];
  showBackToApp?: boolean;
  backToAppHref?: string;
  rightActions?: React.ReactNode;
  customDropdownItems?: DropdownItem[];
  showSettings?: boolean;
  settingsHref?: string;
}

export function SharedNav({
  logoText,
  logoHref,
  navigation,
  showBackToApp = false,
  backToAppHref = "/dashboard",
  rightActions,
  customDropdownItems = [],
  showSettings = true,
  settingsHref = "/settings",
}: SharedNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [postsDropdownOpen, setPostsDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const {
    profilePicture: linkedInProfilePicture,
    isLoading: isLoadingProfilePicture,
  } = useLinkedInProfilePicture();
  const pathname = usePathname();
  const router = useRouter();
  const postsDropdownRef = useRef<HTMLDivElement>(null);
  const mobilePostsDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Close mobile menu and dropdown when pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setPostsDropdownOpen(false);
  }, [pathname]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const supabase = createClientClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/auth/signin");
          return;
        }

        setUser(user);
      } catch (error) {
        console.error("Error fetching user data:", error);
        router.push("/auth/signin");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const targetElement = event.target as HTMLElement;

      // Don't close if clicking on a link (let navigation happen)
      if (targetElement.closest("a")) {
        return;
      }

      // Check desktop posts dropdown
      if (
        postsDropdownRef.current &&
        !postsDropdownRef.current.contains(target)
      ) {
        setPostsDropdownOpen(false);
      }
      // Check mobile posts dropdown - only close if clicking truly outside
      // If clicking inside, let the onClick handlers manage state
      if (
        mobilePostsDropdownRef.current &&
        !mobilePostsDropdownRef.current.contains(target)
      ) {
        setPostsDropdownOpen(false);
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(target)
      ) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Show loading state while fetching user data - only render nav skeleton
  if (isLoading || !user) {
    return (
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-md shadow-lg border border-gray-200/50 rounded-2xl">
          <div className="flex justify-between h-16 px-6">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">{logoText}</h1>
            </div>
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Show loading sign during logout but still render nav
  if (isLoggingOut) {
    return (
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-md shadow-lg border border-gray-200/50 rounded-2xl">
          <div className="flex justify-between h-16 px-6">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">{logoText}</h1>
            </div>
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-sm text-gray-600">Signing out...</span>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const isActive = (href: string) => {
    if (href === "/posts") {
      return pathname.startsWith("/posts");
    }
    if (href === "/articles") {
      return pathname.startsWith("/articles");
    }
    if (href === "/settings") {
      return pathname.startsWith("/settings");
    }
    if (href === "/admin/settings") {
      return pathname.startsWith("/admin/settings");
    }
    if (href === "/admin/users") {
      return pathname.startsWith("/admin/users");
    }
    return pathname === href;
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);

    try {
      // Reset global admin state before signing out
      resetGlobalAdminState();

      // Sign out from Supabase to clear the session
      const supabase = createClientClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error during logout:", error);
      }

      // Wait a moment for the session to be fully cleared
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Use window.location.href for a complete page reload to prevent hydration issues
      window.location.href = "/";
    } catch (error) {
      console.error("Error during logout:", error);
      // Still redirect even if there's an error
      window.location.href = "/";
    }
  };

  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white/80 backdrop-blur-md shadow-lg border border-gray-200/50 rounded-2xl">
        <div className="flex justify-between h-16 px-6">
          {/* Logo and main navigation */}
          <div className="flex items-center">
            <Link href={logoHref} className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">{logoText}</h1>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden menu:ml-8 menu:flex menu:space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isItemActive = isActive(item.href);

                if (item.hasDropdown) {
                  return (
                    <div
                      key={item.name}
                      className="relative"
                      ref={postsDropdownRef}
                    >
                      <button
                        onClick={() => setPostsDropdownOpen(!postsDropdownOpen)}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          isItemActive
                            ? "bg-blue-100 text-blue-700"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        <Icon className="mr-2 h-5 w-5" />
                        {item.name}
                        <ChevronDown className="ml-1 h-4 w-4" />
                      </button>

                      {/* Dropdown menu */}
                      {postsDropdownOpen && (
                        <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-40">
                          {item.submenu?.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              className={`block px-4 py-2 text-sm transition-colors ${
                                pathname === subItem.href
                                  ? "bg-blue-50 text-blue-700 font-medium"
                                  : "text-gray-700 hover:bg-gray-100"
                              }`}
                              onClick={() => setPostsDropdownOpen(false)}
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isItemActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="mr-2 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden menu:flex menu:items-center menu:space-x-4">
              {rightActions}
              {showBackToApp && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={backToAppHref}>Back to App</Link>
                </Button>
              )}
            </div>

            {/* User dropdown */}
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Avatar
                  imageUrl={linkedInProfilePicture}
                  name={user?.email || undefined}
                  type="personal"
                  size="sm"
                  alt="Profile"
                  isLoading={isLoadingProfilePicture}
                />
                <span className="ml-2 text-gray-700 hidden menu:block">
                  {user?.email}
                </span>
                <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
              </button>

              {/* User dropdown menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-40">
                  {customDropdownItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <Icon className="inline mr-2 h-4 w-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                  {showSettings && (
                    <Link
                      href={settingsHref}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <Settings className="inline mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      handleSignOut();
                    }}
                    disabled={isLoggingOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LogOut className="inline mr-2 h-4 w-4" />
                    {isLoggingOut ? "Signing out..." : "Sign Out"}
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="menu:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="menu:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isItemActive = isActive(item.href);

                if (item.hasDropdown) {
                  return (
                    <div key={item.name} ref={mobilePostsDropdownRef}>
                      <button
                        onClick={() => setPostsDropdownOpen(!postsDropdownOpen)}
                        className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          isItemActive
                            ? "bg-blue-100 text-blue-700"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                        <ChevronDown className="ml-auto h-4 w-4" />
                      </button>

                      {/* Mobile submenu */}
                      {postsDropdownOpen && (
                        <div
                          className="ml-6 mt-2 space-y-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.submenu?.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                                pathname === subItem.href
                                  ? "bg-blue-50 text-blue-700 font-medium"
                                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                              }`}
                              onClick={(e) => {
                                // Stop propagation to prevent parent button from toggling
                                e.stopPropagation();
                              }}
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isItemActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}

              {/* Mobile user actions */}
              <div className="pt-4 border-t">
                {showBackToApp && (
                  <Link
                    href={backToAppHref}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="mr-3 h-5 w-5" />
                    Back to App
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  disabled={isLoggingOut}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  {isLoggingOut ? "Signing out..." : "Sign Out"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
