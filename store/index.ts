// Fixed version with all required methods
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
  AppState,
  ScannerState,
  UIState,
  UserProfile,
  DailyIntake,
  DetectedFood,
  Notification,
} from "@/types";

// Main App Store
interface AppStore extends AppState {
  // Actions
  setUser: (user: UserProfile | null) => void;
  setCurrentDate: (date: Date) => void;
  setDailyIntake: (intake: DailyIntake | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Computed
  isAuthenticated: () => boolean;
  getCurrentDateString: () => string;
}

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        currentDate: new Date(),
        dailyIntake: null,
        isLoading: false,
        error: null,

        // Actions
        setUser: (user) => set({ user }),
        setCurrentDate: (date) => set({ currentDate: date }),
        setDailyIntake: (intake) => set({ dailyIntake: intake }),
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),

        // Computed
        isAuthenticated: () => !!get().user,
        getCurrentDateString: () =>
          get().currentDate.toISOString().split("T")[0],
      }),
      {
        name: "health-tracker-store",
        partialize: (state) => ({
          user: state.user,
          currentDate: state.currentDate,
        }),
      }
    )
  )
);

// Scanner Store
interface ScannerStore extends ScannerState {
  // Actions
  startScanning: () => void;
  stopScanning: () => void;
  setLastScannedCode: (code: string | null) => void;
  setScannerError: (error: string | null) => void;
  setDetectedFoods: (foods: DetectedFood[]) => void;
  addDetectedFood: (food: DetectedFood) => void;
  clearDetectedFoods: () => void;

  // Computed
  hasDetectedFoods: () => boolean;
}

export const useScannerStore = create<ScannerStore>()(
  devtools((set, get) => ({
    // Initial state
    isScanning: false,
    lastScannedCode: null,
    scannerError: null,
    detectedFoods: [],

    // Actions
    startScanning: () => set({ isScanning: true, scannerError: null }),
    stopScanning: () => set({ isScanning: false }),
    setLastScannedCode: (code) => set({ lastScannedCode: code }),
    setScannerError: (error) => set({ scannerError: error }),
    setDetectedFoods: (foods) => set({ detectedFoods: foods }),
    addDetectedFood: (food) =>
      set((state) => ({
        detectedFoods: [...state.detectedFoods, food],
      })),
    clearDetectedFoods: () => set({ detectedFoods: [] }),

    // Computed
    hasDetectedFoods: () => get().detectedFoods.length > 0,
  }))
);

// UI Store with notification methods
interface UIStore extends UIState {
  // Actions
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveTab: (tab: string) => void;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read">
  ) => void;
  markNotificationRead: (id: string) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Toast-like notification methods
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string, error?: any) => void;
  showInfo: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;

  // Computed
  unreadNotificationCount: () => number;
}

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        theme: "light",
        sidebarOpen: false,
        activeTab: "dashboard",
        notifications: [],

        // Actions
        setTheme: (theme) => set({ theme }),
        toggleTheme: () =>
          set((state) => ({
            theme: state.theme === "light" ? "dark" : "light",
          })),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        toggleSidebar: () =>
          set((state) => ({
            sidebarOpen: !state.sidebarOpen,
          })),
        setActiveTab: (tab) => set({ activeTab: tab }),
        addNotification: (notification) => {
          const newNotification: Notification = {
            ...notification,
            id: crypto.randomUUID(),
            timestamp: new Date(),
            read: false,
          };
          set((state) => ({
            notifications: [newNotification, ...state.notifications],
          }));
        },
        markNotificationRead: (id) =>
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
          })),
        removeNotification: (id) =>
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          })),
        clearNotifications: () => set({ notifications: [] }),

        // Toast-like methods
        showSuccess: (title, message) => {
          get().addNotification({ type: "success", title, message });
        },
        showError: (title, message, error) => {
          if (error) console.error(error);
          get().addNotification({ type: "error", title, message });
        },
        showInfo: (title, message) => {
          get().addNotification({ type: "info", title, message });
        },
        showWarning: (title, message) => {
          get().addNotification({ type: "warning", title, message });
        },

        // Computed
        unreadNotificationCount: () =>
          get().notifications.filter((n) => !n.read).length,
      }),
      {
        name: "health-tracker-ui",
        partialize: (state) => ({
          theme: state.theme,
          activeTab: state.activeTab,
        }),
      }
    )
  )
);

// Nutrition Store with loadUserGoals
interface NutritionStore {
  dailyGoals: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    water: number;
  };
  goalsLoading: boolean;

  // Actions
  updateDailyGoals: (goals: Partial<NutritionStore["dailyGoals"]>) => void;
  loadUserGoals: () => Promise<void>;
  calculateCalorieNeeds: (profile: UserProfile) => number;
  calculateMacroSplit: (
    calories: number,
    goal: string
  ) => {
    protein: number;
    carbohydrates: number;
    fat: number;
  };

  // Computed
  getProgressPercentage: (current: number, target: number) => number;
  isGoalMet: (current: number, target: number) => boolean;
}

export const useNutritionStore = create<NutritionStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        dailyGoals: {
          calories: 2000,
          protein: 150,
          carbohydrates: 250,
          fat: 67,
          water: 2000,
        },
        goalsLoading: false,

        // Actions
        updateDailyGoals: (goals) =>
          set((state) => ({
            dailyGoals: { ...state.dailyGoals, ...goals },
          })),

        loadUserGoals: async () => {
          set({ goalsLoading: true });
          try {
            const response = await fetch("/api/users/goals");
            if (response.ok) {
              const data = await response.json();
              if (data.data && data.data.length > 0) {
                const goal = data.data[0];
                set({
                  dailyGoals: {
                    calories: goal.targetCalories || 2000,
                    protein: goal.targetProtein || 150,
                    carbohydrates: goal.targetCarbohydrates || 250,
                    fat: goal.targetFat || 67,
                    water: 2000, // Default water goal
                  },
                });
              }
            }
          } catch (error) {
            console.error("Failed to load user goals:", error);
          } finally {
            set({ goalsLoading: false });
          }
        },

        calculateCalorieNeeds: (profile) => {
          if (!profile.height || !profile.weight || !profile.dateOfBirth) {
            return 2000; // Default
          }

          const age =
            new Date().getFullYear() -
            new Date(profile.dateOfBirth).getFullYear();
          let bmr: number;

          // Mifflin-St Jeor Equation
          if (profile.gender === "MALE") {
            bmr = 10 * profile.weight + 6.25 * profile.height - 5 * age + 5;
          } else {
            bmr = 10 * profile.weight + 6.25 * profile.height - 5 * age - 161;
          }

          // Activity factor
          const activityFactors = {
            SEDENTARY: 1.2,
            LIGHT: 1.375,
            MODERATE: 1.55,
            ACTIVE: 1.725,
            VERY_ACTIVE: 1.9,
          };

          const tdee = bmr * activityFactors[profile.activityLevel];

          // Adjust for goals
          const goalAdjustments = {
            WEIGHT_LOSS: -500,
            MAINTENANCE: 0,
            MUSCLE_GAIN: 300,
          };

          return Math.round(tdee + goalAdjustments[profile.dietaryGoals]);
        },

        calculateMacroSplit: (calories, goal) => {
          // Standard macro splits based on goals
          const macroSplits = {
            WEIGHT_LOSS: { protein: 0.3, carbs: 0.35, fat: 0.35 },
            MAINTENANCE: { protein: 0.25, carbs: 0.45, fat: 0.3 },
            MUSCLE_GAIN: { protein: 0.3, carbs: 0.5, fat: 0.2 },
          };

          const split =
            macroSplits[goal as keyof typeof macroSplits] ||
            macroSplits.MAINTENANCE;

          return {
            protein: Math.round((calories * split.protein) / 4), // 4 cal/g
            carbohydrates: Math.round((calories * split.carbs) / 4), // 4 cal/g
            fat: Math.round((calories * split.fat) / 9), // 9 cal/g
          };
        },

        // Computed
        getProgressPercentage: (current, target) =>
          Math.min(Math.round((current / target) * 100), 100),

        isGoalMet: (current, target) => current >= target * 0.9, // 90% threshold
      }),
      {
        name: "health-tracker-nutrition",
      }
    )
  )
);

interface FoodRecognitionStore {
  history: DetectedFood[];
  addResult: (result: DetectedFood) => void;
  clearHistory: () => void;
  hydrate: () => void;
}

const LOCAL_STORAGE_KEY = "food-recognition-history";

export const useFoodRecognitionStore = create<FoodRecognitionStore>(
  (set, get) => ({
    history: [],
    addResult: (result) => {
      const updated = [result, ...get().history].slice(0, 100); // Limit to 100 entries
      set({ history: updated });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    },
    clearHistory: () => {
      set({ history: [] });
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    },
    hydrate: () => {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (data) {
        set({ history: JSON.parse(data) });
      }
    },
  })
);

// Hydrate store on load (for SSR safety, check window)
if (typeof window !== "undefined") {
  useFoodRecognitionStore.getState().hydrate();
}
