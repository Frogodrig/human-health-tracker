// Extended type definitions for dashboard components
import type {
  NutritionalInfo,
  Achievement as BaseAchievement,
  NutriGrade,
  MealType,
  DetectionMethod,
} from "./index";

// Re-export NutritionalInfo for convenience
export type { NutritionalInfo };

// Achievement Types with proper typing
export interface AchievementWithProgress extends BaseAchievement {
  unlocked: boolean;
  unlockedAt?: Date;
  progress: number;
  condition: {
    type:
      | "meals_logged"
      | "barcodes_scanned"
      | "streak"
      | "macro_goals_met"
      | "ai_scans"
      | "unique_scans";
    target: number;
    current?: number;
  };
}

// Analytics Types
export interface DailyAnalyticsData {
  date: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sodium: number;
  water: number;
  caloriesGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  waterGoal: number;
  goalAchievement: number;
  mealCount: number;
}

export interface WeeklyAnalyticsData extends DailyAnalyticsData {
  weekNumber: number;
  weekStartDate: string;
  weekEndDate: string;
}

export interface AnalyticsSummary {
  dailyAverage: number;
  goalAchievement: number;
  totalFoodsLogged: number;
  weeklyTrend: number;
  topFoods: Array<{
    name: string;
    count: number;
    averageCalories: number;
  }>;
  macroDistribution: {
    protein: number;
    carbohydrates: number;
    fat: number;
  };
}

export interface StreakData {
  current: number;
  longest: number;
  thisWeek: number;
  thisMonth: number;
  history: Array<{
    date: string;
    hasEntry: boolean;
    caloriesLogged: number;
  }>;
}

export interface GoalProgress {
  name: string;
  current: number;
  target: number;
  percentage: number;
  remaining: number;
  unit: string;
  type: "calories" | "protein" | "carbohydrates" | "fat" | "water" | "exercise";
  trend: "up" | "down" | "stable";
}

// Chart Data Types
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface NutritionChartData {
  date: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  caloriesGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}

export interface MacroDistributionData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface RadarChartData {
  nutrient: string;
  current: number;
  goal: number;
  percentage: number;
}

// Food Entry Types
export interface FoodEntryWithDetails {
  id: string;
  foodProduct?: {
    id: string;
    name: string;
    brand?: string;
    nutriGrade?: NutriGrade;
    imageUrl?: string;
  };
  customFood?: {
    id: string;
    name: string;
    brand?: string;
  };
  quantity: number;
  unit: string;
  mealType: MealType;
  consumedAt: Date;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  detectedBy: DetectionMethod;
  confidence?: number;
}

export interface MealSummary {
  mealType: MealType;
  entries: FoodEntryWithDetails[];
  totalCalories: number;
  totalProtein: number;
  totalCarbohydrates: number;
  totalFat: number;
  itemCount: number;
}

// Settings Types
export interface NotificationPreferences {
  mealReminders: boolean;
  goalAchievements: boolean;
  weeklyReports: boolean;
  productUpdates: boolean;
  reminderTimes?: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
  };
}

export interface ProfileFormData {
  name: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
  height?: number;
  weight?: number;
  dateOfBirth?: Date | string;
  activityLevel: "SEDENTARY" | "LIGHT" | "MODERATE" | "ACTIVE" | "VERY_ACTIVE";
  dietaryGoals: "WEIGHT_LOSS" | "MUSCLE_GAIN" | "MAINTENANCE" | "BULKING";
}

// API Response Types with proper generics
export interface DailyIntakeResponse {
  dailyIntake: {
    id?: string;
    date: Date | string;
    totalCalories: number;
    totalProtein: number;
    totalCarbohydrates: number;
    totalFat: number;
    entries: FoodEntryWithDetails[];
  };
  goals: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
  } | null;
  goalsMet: {
    calories: boolean;
    protein: boolean;
    carbohydrates?: boolean;
    fat?: boolean;
  };
}

export interface AchievementsResponse {
  achievements: AchievementWithProgress[];
  totalUnlocked: number;
  totalAvailable: number;
  recentUnlocks?: AchievementWithProgress[];
  categories: {
    [key: string]: {
      total: number;
      unlocked: number;
    };
  };
}

// Utility Types
export type ChartTimeRange = "7d" | "30d" | "90d" | "1y";
export type MealTimeSlot = "breakfast" | "lunch" | "dinner" | "snack";
export type ThemeMode = "light" | "dark" | "system";

// Component Props Types
export interface DashboardCardProps {
  title: string;
  value: number | string;
  target?: number;
  unit?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  color?: "green" | "blue" | "orange" | "purple" | "red";
}

export interface NutritionCardProps {
  title: string;
  current: number;
  target: number;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface MealRowProps {
  meal: string;
  hasItems: boolean;
  calories: number;
}

export interface StatRowProps {
  label: string;
  value: string | number;
  variant?: "default" | "secondary" | "outline";
  icon?: React.ReactNode;
}

// Form Types
export interface GoalFormData {
  targetCalories: number;
  targetProtein: number;
  targetCarbohydrates: number;
  targetFat: number;
  targetWater?: number;
}

// Hook Return Types
export interface UseAchievementsReturn {
  achievements: AchievementWithProgress[];
  userAchievements: AchievementWithProgress[];
  totalUnlocked: number;
  totalAvailable: number;
  recentUnlocks: AchievementWithProgress[];
  loading: boolean;
  checkAchievements: () => Promise<void>;
  unlockAchievement: (achievementId: string) => Promise<void>;
}

export interface UseAnalyticsReturn {
  analyticsData: AnalyticsSummary | null;
  weeklyData: DailyAnalyticsData[] | null;
  monthlyData: DailyAnalyticsData[] | null;
  streakData: StreakData;
  goalProgress: GoalProgress[];
  loading: boolean;
  error: string | null;
  fetchAnalytics: () => Promise<void>;
}

export interface UseUserProfileReturn {
  profile: ProfileFormData | null;
  loading: boolean;
  error: string | null;
  updateProfile: (data: Partial<ProfileFormData>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}
