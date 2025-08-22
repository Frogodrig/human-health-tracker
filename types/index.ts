// Core type definitions for the health tracker
import type { DetectedFood, DetectionMethod } from "./ml";

// Re-export ML types for convenience
export type { DetectedFood, DetectionMethod };

export interface NutritionalInfo {
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  fiber?: number;
  sodium?: number;
  sugars?: number;
  saturatedFat?: number;
  water?: number;
  cholesterol?: number;
  transFat?: number;
  monounsaturatedFat?: number;
  polyunsaturatedFat?: number;
  salt?: number;
  potassium?: number;
  calcium?: number;
  iron?: number;
  vitaminA?: number;
  vitaminC?: number;
  vitaminD?: number;
  vitaminB6?: number;
  vitaminB12?: number;
  vitaminE?: number;
  magnesium?: number;
  zinc?: number;
  sucrose?: number;
  fructose?: number;
  lactose?: number;
  starch?: number;
  alcohol?: number;
}

export interface ServingInfo {
  size: number;
  unit: string;
}

export interface ProductData extends NutritionalInfo {
  id: string;
  barcode?: string;
  name: string;
  brand?: string;
  serving: ServingInfo;
  nutriGrade?: "A" | "B" | "C" | "D";
  imageUrl?: string;
  verified: boolean;
  ecoscore?: number;
  ecoscoreGrade?: string;
  novaGroup?: number;
  ingredientsText?: string;
  tracesTags?: string[];
  packagingTags?: string[];
  originsTags?: string[];
  netWeight?: number; // in grams
}

export interface FoodEntry {
  id: string;
  productId?: string;
  customFoodId?: string;
  quantity: number;
  unit: string;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  consumedAt: Date;
  detectedBy: DetectionMethod;
  nutrition: NutritionalInfo;
}

export interface DailyIntake {
  id: string;
  date: Date;
  entries: FoodEntry[];
  totals: NutritionalInfo & {
    waterIntake: number;
  };
  goalsMet: {
    calories: boolean;
    protein: boolean;
  };
}

export interface UserGoals {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  waterIntake: number;
}

export interface UserProfile {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
  height?: number; // cm
  weight?: number; // kg
  activityLevel: "SEDENTARY" | "LIGHT" | "MODERATE" | "ACTIVE" | "VERY_ACTIVE";
  dietaryGoals: "WEIGHT_LOSS" | "MUSCLE_GAIN" | "MAINTENANCE";
  goals: UserGoals;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: "STREAK" | "MILESTONE" | "NUTRITION" | "SCANNING";
  tier: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
  icon: string;
  unlockedAt?: Date;
  progress: number;
}

// Barcode Scanner Types
export interface BarcodeResult {
  code: string;
  format: string;
  confidence: number;
}

export interface ScannerConfig {
  width: number;
  height: number;
  facing: "environment" | "user";
  formats: string[];
}

// Store Types (Zustand)
export interface AppState {
  user: UserProfile | null;
  currentDate: Date;
  dailyIntake: DailyIntake | null;
  isLoading: boolean;
  error: string | null;
}

export interface ScannerState {
  isScanning: boolean;
  lastScannedCode: string | null;
  scannerError: string | null;
  detectedFoods: DetectedFood[];
}

export interface UIState {
  theme: "light" | "dark";
  sidebarOpen: boolean;
  activeTab: string;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Form Types
export interface FoodSearchForm {
  query: string;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
}

export interface ManualEntryForm {
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  quantity: number;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
}

export interface ProfileSetupForm {
  name: string;
  dateOfBirth: Date;
  gender: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
  height: number;
  weight: number;
  activityLevel: "SEDENTARY" | "LIGHT" | "MODERATE" | "ACTIVE" | "VERY_ACTIVE";
  dietaryGoals: "WEIGHT_LOSS" | "MUSCLE_GAIN" | "MAINTENANCE";
}

// API Error Types
export interface APIErrorResponse {
  error: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

export interface APISuccessResponse<T> {
  data: T;
  message?: string;
  timestamp?: string;
}

// Utility Types
export type NutrientKey = keyof NutritionalInfo;
export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
export type NutriGrade = "A" | "B" | "C" | "D";

// API Endpoints Configuration
export interface APIEndpoints {
  products: {
    search: string;
    barcode: string;
    create: string;
  };
  intake: {
    daily: string;
    entry: string;
    update: string;
  };
  user: {
    profile: string;
    goals: string;
    achievements: string;
  };
  ml: {
    detect: string;
    models: string;
  };
}

// Database operation types
export interface CreateProductRequest {
  name: string;
  brand?: string;
  barcode?: string;
  serving: ServingInfo;
  nutrition: NutritionalInfo;
  imageUrl?: string;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
}

export interface ProductSearchFilters {
  category?: string;
  brand?: string;
  minCalories?: number;
  maxCalories?: number;
  nutriGrade?: NutriGrade[];
  verified?: boolean;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Export commonly used union types
export type ActivityLevel =
  | "SEDENTARY"
  | "LIGHT"
  | "MODERATE"
  | "ACTIVE"
  | "VERY_ACTIVE";
export type DietaryGoal =
  | "WEIGHT_LOSS"
  | "MUSCLE_GAIN"
  | "MAINTENANCE"
  | "BULKING";
export type Gender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
export type AchievementCategory =
  | "STREAK"
  | "MILESTONE"
  | "NUTRITION"
  | "SCANNING";
export type AchievementTier = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
export type NotificationType = "success" | "error" | "warning" | "info";
