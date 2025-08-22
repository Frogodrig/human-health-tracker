// Enhanced toast hook that works with existing store
import * as React from "react";
import { useUIStore } from "@/store";
import type { NotificationType } from "@/types";

export interface ToastAction {
  altText: string;
  onClick: () => void;
  label: string;
}

export interface ToastOptions {
  title: string;
  description?: string;
  action?: ToastAction;
  duration?: number;
  variant?: NotificationType;
}

export function useToast() {
  const {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    addNotification,
    removeNotification,
  } = useUIStore();

  const toast = React.useCallback(
    ({ title, description, variant = "info", duration = 5000, action }: ToastOptions) => {
      const id = crypto.randomUUID();
      
      // Add to notification store
      addNotification({
        type: variant,
        title,
        message: description || "",
      });

      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }

      return id;
    },
    [addNotification, removeNotification]
  );

  // Convenience methods
  const success = React.useCallback(
    (title: string, description?: string, duration?: number) => {
      showSuccess(title, description || "");
      return toast({ title, description, variant: "success", duration });
    },
    [showSuccess, toast]
  );

  const error = React.useCallback(
    (title: string, description?: string, duration?: number) => {
      showError(title, description || "");
      return toast({ title, description, variant: "error", duration });
    },
    [showError, toast]
  );

  const info = React.useCallback(
    (title: string, description?: string, duration?: number) => {
      showInfo(title, description || "");
      return toast({ title, description, variant: "info", duration });
    },
    [showInfo, toast]
  );

  const warning = React.useCallback(
    (title: string, description?: string, duration?: number) => {
      showWarning(title, description || "");
      return toast({ title, description, variant: "warning", duration });
    },
    [showWarning, toast]
  );

  const dismiss = React.useCallback(
    (id: string) => {
      removeNotification(id);
    },
    [removeNotification]
  );

  return {
    toast,
    success,
    error,
    info,
    warning,
    dismiss,
  };
}

// API-specific toast helpers
export function useApiToast() {
  const { success, error, info } = useToast();

  const apiSuccess = React.useCallback(
    (operation: string, details?: string) => {
      return success(
        "Success",
        details || `${operation} completed successfully`
      );
    },
    [success]
  );

  const apiError = React.useCallback(
    (operation: string, errorMessage: string, details?: string) => {
      return error(
        `${operation} Failed`,
        details || errorMessage,
        8000 // Longer duration for errors
      );
    },
    [error]
  );

  const apiLoading = React.useCallback(
    (operation: string) => {
      return info(
        `${operation}...`,
        "Please wait while we process your request"
      );
    },
    [info]
  );

  // Food-specific toasts
  const foodScanned = React.useCallback(
    (foodName: string) => {
      return success(
        "Food Detected",
        `Successfully identified: ${foodName}`
      );
    },
    [success]
  );

  const foodAdded = React.useCallback(
    (foodName: string, calories: number) => {
      return success(
        "Food Added",
        `${foodName} (${calories} cal) added to your diary`
      );
    },
    [success]
  );

  const barcodeScanned = React.useCallback(
    (productName: string) => {
      return success(
        "Product Found",
        `Scanned: ${productName}`
      );
    },
    [success]
  );

  const scanError = React.useCallback(
    (type: "barcode" | "food", error: string) => {
      const title = type === "barcode" ? "Scan Failed" : "Recognition Failed";
      return apiError(title, error);
    },
    [apiError]
  );

  const goalProgress = React.useCallback(
    (goalType: string, percentage: number) => {
      if (percentage >= 100) {
        return success(
          "Goal Achieved! 🎉",
          `You've reached your daily ${goalType} goal`
        );
      } else if (percentage >= 80) {
        return info(
          "Almost There!",
          `You're ${percentage}% towards your ${goalType} goal`
        );
      }
    },
    [success, info]
  );

  return {
    apiSuccess,
    apiError,
    apiLoading,
    foodScanned,
    foodAdded,
    barcodeScanned,
    scanError,
    goalProgress,
  };
}