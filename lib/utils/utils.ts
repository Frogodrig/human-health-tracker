// Utility functions
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { NutritionalInfo, ProductData } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Nutritional calculations
export function calculateNutritionPerServing(
  nutritionPer100g: NutritionalInfo,
  servingSize: number
): NutritionalInfo {
  const factor = servingSize / 100;

  return {
    calories: Math.round(nutritionPer100g.calories * factor),
    protein: Math.round(nutritionPer100g.protein * factor * 10) / 10,
    carbohydrates:
      Math.round(nutritionPer100g.carbohydrates * factor * 10) / 10,
    fat: Math.round(nutritionPer100g.fat * factor * 10) / 10,
    fiber: nutritionPer100g.fiber
      ? Math.round(nutritionPer100g.fiber * factor * 10) / 10
      : undefined,
    sodium: nutritionPer100g.sodium
      ? Math.round(nutritionPer100g.sodium * factor * 10) / 10
      : undefined,
    sugars: nutritionPer100g.sugars
      ? Math.round(nutritionPer100g.sugars * factor * 10) / 10
      : undefined,
    saturatedFat: nutritionPer100g.saturatedFat
      ? Math.round(nutritionPer100g.saturatedFat * factor * 10) / 10
      : undefined,
  };
}

// Nutri-Grade calculation based on Singapore's system
export function calculateNutriGrade(
  nutrition: NutritionalInfo
): "A" | "B" | "C" | "D" {
  const { sugars = 0, saturatedFat = 0, sodium = 0 } = nutrition;

  // Convert to per 100ml equivalent for drinks or keep per 100g for food
  const sugarScore = sugars <= 5 ? 0 : sugars <= 10 ? 1 : sugars <= 15 ? 2 : 3;
  const fatScore =
    saturatedFat <= 1.5 ? 0 : saturatedFat <= 3 ? 1 : saturatedFat <= 6 ? 2 : 3;
  const sodiumScore =
    sodium <= 120 ? 0 : sodium <= 240 ? 1 : sodium <= 360 ? 2 : 3;

  const totalScore = sugarScore + fatScore + sodiumScore;

  if (totalScore <= 1) return "A";
  if (totalScore <= 3) return "B";
  if (totalScore <= 6) return "C";
  return "D";
}

// Format nutrition values for display
export function formatNutrition(
  value: number,
  unit: string = "g",
  decimals: number = 1
): string {
  return `${value.toFixed(decimals)}${unit}`;
}

// Calculate BMI
export function calculateBMI(weight: number, height: number): number {
  const heightInMeters = height / 100;
  return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
}

// Format date for API calls
export function formatDateForAPI(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Validate barcode format
export function isValidBarcode(barcode: string): boolean {
  // Basic validation for common barcode formats
  return /^[0-9]{8,14}$/.test(barcode);
}
