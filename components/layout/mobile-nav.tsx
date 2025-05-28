// Mobile bottom navigation
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/utils";
import { useUIStore } from "@/store";
import { Home, Camera, BarChart3, Scan, Settings } from "lucide-react";

const mobileNavigation = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Scan", href: "/scan", icon: Scan },
  { name: "Camera", href: "/camera", icon: Camera },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const { sidebarOpen } = useUIStore();

  // Hide mobile nav when sidebar is open
  if (sidebarOpen) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around">
        {mobileNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center py-2 px-3 rounded-lg transition-colors",
                isActive
                  ? "text-green-600 bg-green-50"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 mb-1",
                  isActive ? "text-green-600" : "text-gray-600"
                )}
              />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
