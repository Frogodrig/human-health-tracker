// Top header with notifications
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/store";
import { Menu, Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export function Header() {
  const { toggleSidebar, unreadNotificationCount } = useUIStore();
  const { theme, setTheme } = useTheme();

  return (
    <header className="bg-white border-b h-16 flex items-center justify-between px-4 md:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden"
        onClick={toggleSidebar}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Page title - will be dynamic based on route */}
      <div className="hidden md:block">
        <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
      </div>

      {/* Right side actions */}
      <div className="flex items-center space-x-3">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadNotificationCount() > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs"
            >
              {unreadNotificationCount()}
            </Badge>
          )}
        </Button>
      </div>
    </header>
  );
}
