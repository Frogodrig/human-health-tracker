"use client";

import React from "react";
import { useUIStore } from "@/store";
import { CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

// Fallback toaster that doesn't use Radix UI for now
interface ToastNotification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export function Toaster() {
  const { notifications, removeNotification } = useUIStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "info":
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStyles = (type: string) => {
    switch (type) {
      case "success":
        return "border-green-200 bg-green-50 text-green-900";
      case "error":
        return "border-red-200 bg-red-50 text-red-900";
      case "warning":
        return "border-yellow-200 bg-yellow-50 text-yellow-900";
      case "info":
      default:
        return "border-blue-200 bg-blue-50 text-blue-900";
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 w-full max-w-sm">
      {notifications
        .filter((notification) => !notification.read)
        .slice(0, 3)
        .map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start space-x-3 rounded-lg border p-4 shadow-lg transition-all animate-in slide-in-from-top-2 ${getStyles(notification.type)}`}
          >
            <div className="flex-shrink-0">
              {getIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium">{notification.title}</h4>
              {notification.message && (
                <p className="mt-1 text-sm opacity-90">{notification.message}</p>
              )}
            </div>
            <button
              className="flex-shrink-0 rounded-md p-1 hover:bg-gray-200 transition-colors"
              onClick={() => removeNotification(notification.id)}
            >
              <span className="sr-only">Close</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
    </div>
  );
}

// Sonner-style toast for simple usage
export function toast(message: string, type: "success" | "error" | "info" | "warning" = "info") {
  const { addNotification } = useUIStore.getState();
  
  addNotification({
    type,
    title: message,
    message: "",
  });
}