// Core type definitions for the health tracker

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  sodium?: number;
  sugars?: number;
  saturatedFat?: number;
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
}

export interface DetectedFood {
  name: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  estimatedPortion: {
    quantity: number;
    unit: string;
  };
  nutrition: NutritionalInfo;
}

export interface FoodEntry {
  id: string;
  productId?: string;
  customFoodId?: string;
  quantity: number;
  unit: string;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  consumedAt: Date;
  detectedBy: "MANUAL" | "BARCODE" | "ML_VISION";
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

export interface MLModelConfig {
  modelUrl: string;
  version: string;
  inputShape: [number, number, number];
  confidenceThreshold: number;
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

// API Response Types - Fixed and comprehensive
export interface OpenFoodFactsNutriments {
  "energy-kcal"?: number;
  "energy-kcal_100g"?: number;
  proteins?: number;
  proteins_100g?: number;
  carbohydrates?: number;
  carbohydrates_100g?: number;
  fat?: number;
  fat_100g?: number;
  fiber?: number;
  fiber_100g?: number;
  sodium?: number;
  sodium_100g?: number;
  sugars?: number;
  sugars_100g?: number;
  "saturated-fat"?: number;
  "saturated-fat_100g"?: number;
  salt?: number;
  salt_100g?: number;
}

export interface OpenFoodFactsProduct {
  code?: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  image_url?: string;
  image_front_url?: string;
  image_front_small_url?: string;
  nutriments?: OpenFoodFactsNutriments;
  serving_quantity?: number | string;
  serving_size?: string;
  quantity?: string;
  categories?: string;
  labels?: string;
  manufacturing_places?: string;
  origins?: string;
  packaging?: string;
  stores?: string;
  countries?: string;
  ingredients_text?: string;
  allergens?: string;
  traces?: string;
  nutrition_grades?: string;
  nova_group?: number;
  ecoscore_grade?: string;
  nutriscore_grade?: string;
}

export interface OpenFoodFactsResponse {
  code?: string;
  product?: OpenFoodFactsProduct;
  status: number;
  status_verbose: string;
}

export interface OpenFoodFactsSearchResponse {
  products: OpenFoodFactsProduct[];
  count: number;
  page: number;
  page_count: number;
  page_size: number;
  skip: number;
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
  details?: any;
}

export interface APISuccessResponse<T = any> {
  data: T;
  message?: string;
  timestamp?: string;
}

// Utility Types
export type NutrientKey = keyof NutritionalInfo;
export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
export type DetectionMethod = "MANUAL" | "BARCODE" | "ML_VISION";
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
export type DietaryGoal = "WEIGHT_LOSS" | "MUSCLE_GAIN" | "MAINTENANCE";
export type Gender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
export type AchievementCategory =
  | "STREAK"
  | "MILESTONE"
  | "NUTRITION"
  | "SCANNING";
export type AchievementTier = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
export type NotificationType = "success" | "error" | "warning" | "info";
