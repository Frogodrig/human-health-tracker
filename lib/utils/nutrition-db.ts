import type { FoodNutritionDB } from "@/types/ml";
import type { NutritionalInfo } from "@/types";
import { searchFoodDataCentral } from "@/lib/api/api";

// Example static nutrition database (expand as needed)
export const FOOD_NUTRITION_DB: FoodNutritionDB = {
  apple: {
    calories: 52,
    protein: 0.3,
    carbohydrates: 14,
    fat: 0.2,
    serving: { size: 100, unit: "g" },
  },
  banana: {
    calories: 89,
    protein: 1.1,
    carbohydrates: 23,
    fat: 0.3,
    serving: { size: 100, unit: "g" },
  },
  "chicken breast": {
    calories: 165,
    protein: 31,
    carbohydrates: 0,
    fat: 3.6,
    serving: { size: 100, unit: "g" },
  },
  "rice, white": {
    calories: 130,
    protein: 2.7,
    carbohydrates: 28,
    fat: 0.3,
    serving: { size: 100, unit: "g" },
  },
  // Add more foods as needed
};

const CACHE_KEY = "food-nutrition-api-cache";

function getCache(): Record<string, NutritionalInfo> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function setCache(foodName: string, nutrition: NutritionalInfo) {
  if (typeof window === "undefined") return;
  const cache = getCache();
  cache[foodName.toLowerCase()] = nutrition;
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

// Async: map recognized food name to nutrition info (static DB, then API fallback)
export async function mapFoodToNutrition(
  foodName: string
): Promise<NutritionalInfo | null> {
  const key = Object.keys(FOOD_NUTRITION_DB).find(
    (k) => k.toLowerCase() === foodName.toLowerCase()
  );
  if (key) {
    const { calories, protein, carbohydrates, fat, serving } =
      FOOD_NUTRITION_DB[key];
    return { calories, protein, carbohydrates, fat };
  }
  // Check cache
  const cache = getCache();
  if (cache[foodName.toLowerCase()]) {
    return cache[foodName.toLowerCase()];
  }
  // API fallback
  const apiResult = await searchFoodDataCentral(foodName);
  if (apiResult) {
    setCache(foodName, apiResult);
    return apiResult;
  }
  return null;
}
