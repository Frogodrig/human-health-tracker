import type { ProductData, NutritionalInfo } from "@/types";

// Custom error classes
export class APIError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = "APIError";
  }
}

export class NetworkError extends Error {
  constructor(message: string = "Network request failed") {
    super(message);
    this.name = "NetworkError";
  }
}

// FoodData Central API fallback
const FDC_API_KEY = process.env.NEXT_PUBLIC_FDC_API_KEY || "DEMO_KEY";
const FDC_API_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";

export async function searchFoodDataCentral(
  foodName: string
): Promise<NutritionalInfo | null> {
  try {
    console.log("Searching FoodData Central for:", foodName);

    const res = await fetch(`${FDC_API_URL}?api_key=${FDC_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: foodName, pageSize: 1 }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("FoodData Central API error:", res.status, errorText);
      throw new Error(`FoodData Central API error: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    console.log("FoodData Central response:", JSON.stringify(data, null, 2));

    const food = data.foods?.[0];
    if (!food) {
      console.log("No food found in FoodData Central response");
      return null;
    }

    // Map FDC nutrients to NutritionalInfo
    const n = food.foodNutrients || [];
    const get = (name: string) =>
      n.find((x: unknown) =>
        (x as { nutrientName?: string })?.nutrientName
          ?.toLowerCase()
          .includes(name)
      )?.value || 0;

    const nutrition: NutritionalInfo = {
      calories: get("energy") || get("calories"),
      protein: get("protein"),
      carbohydrates: get("carbohydrate"),
      fat: get("fat") || get("total lipid"),
      fiber: get("fiber"),
      sodium: get("sodium"),
      sugars: get("sugar"),
      saturatedFat: get("saturated"),
    };

    console.log("Mapped FoodData Central nutrition:", nutrition);
    return nutrition;
  } catch (error) {
    console.error("FoodData Central search error:", error);
    throw error; // Re-throw the error so it can be handled by the calling function
  }
}

// Food recognition using Clarifai API
export async function recognizeFood(imageData: string): Promise<Array<{ name: string; confidence: number }>> {
  try {
    console.log("Recognizing food with Clarifai API...");
    
    const response = await fetch("/api/food-recognition", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: imageData }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.error || `Food recognition failed: ${response.status}`,
        response.status,
        "FOOD_RECOGNITION_ERROR"
      );
    }

    const data = await response.json();
    console.log("Food recognition results:", data.results);
    
    return data.results || [];
  } catch (error) {
    console.error("Food recognition error:", error);
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError("Failed to recognize food", 500, "FOOD_RECOGNITION_ERROR");
  }
}

// Export types and utilities
export type { ProductData };
