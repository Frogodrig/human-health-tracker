import type { ProductData } from "@/types";
import { normalizeBarcode } from "@/lib/utils/barcode";

// Helper to get value from either dash or underscore
function getNutriment(nutriments: Record<string, unknown>, key: string) {
  return (
    nutriments[key] ??
    nutriments[key.replace(/_/g, "-")] ??
    nutriments[key.replace(/-/g, "_")]
  );
}

// Helper to get per serving value if available, else fallback to base key
function getNutrimentPerServing(
  nutriments: Record<string, unknown>,
  key: string
) {
  return (
    nutriments[`${key}_serving`] ??
    nutriments[`${key.replace(/_/g, "-")}_serving`] ??
    nutriments[`${key.replace(/-/g, "_")}_serving`] ??
    getNutriment(nutriments, key)
  );
}

/**
 * Fetch product data from Open Food Facts by barcode and map to ProductData.
 * Returns null if not found or nutrition data is missing.
 */
export async function openFoodFactsBarcodeLookup(
  barcode: string
): Promise<ProductData | null> {
  const normalizedBarcode = normalizeBarcode(barcode);
  // Use correct API v0 endpoint as per official documentation
  const url = `https://world.openfoodfacts.org/api/v0/product/${normalizedBarcode}.json`;
  let res;
  try {
    // Add required User-Agent header as per OpenFoodFacts API documentation
    res = await fetch(url, {
      headers: {
        'User-Agent': 'Health Tracker MVP/1.0 (https://github.com/health-tracker; contact@health-tracker.app)'
      }
    });
  } catch (err) {
    console.error("[OFF] Network error for URL:", url, err);
    return null;
  }
  if (!res.ok) {
    let errorText = "";
    try {
      errorText = await res.text();
    } catch {
      errorText = "[Could not read response body]";
    }
    console.error(
      `[OFF] API error: ${res.status} ${res.statusText} for URL: ${url}. Response:`,
      errorText
    );
    return null;
  }
  let data;
  try {
    data = await res.json();
  } catch (err) {
    console.error("[OFF] Failed to parse JSON for URL:", url, err);
    return null;
  }
  if (data.status !== 1 || !data.product) {
    console.warn(
      `[OFF] Product not found or missing product field for barcode: ${barcode} (normalized: ${normalizedBarcode}). Response:`,
      data
    );
    return null;
  }
  const p = data.product;
  const nutriments: Record<string, unknown> = p.nutriments || {};

  // Extract nutrition values - energy is in kJ by default, convert to kcal
  const energyKj = getNutrimentPerServing(nutriments, "energy");
  const energyKcal = getNutrimentPerServing(nutriments, "energy_kcal");
  // Convert kJ to kcal if kcal not available (multiply by 0.23900573614)
  const calories = typeof energyKcal === "number" ? energyKcal : 
                   typeof energyKj === "number" ? energyKj * 0.23900573614 : null;
  
  const protein = getNutrimentPerServing(nutriments, "proteins");
  const carbohydrates = getNutrimentPerServing(nutriments, "carbohydrates");
  const fat = getNutrimentPerServing(nutriments, "fat");
  const fiber = getNutrimentPerServing(nutriments, "fiber");
  const sodium = getNutrimentPerServing(nutriments, "sodium");
  const sugars = getNutrimentPerServing(nutriments, "sugars");
  const saturatedFat = getNutrimentPerServing(nutriments, "saturated_fat");
  const cholesterol = getNutrimentPerServing(nutriments, "cholesterol");
  const transFat = getNutrimentPerServing(nutriments, "trans_fat");
  const monounsaturatedFat = getNutrimentPerServing(
    nutriments,
    "monounsaturated_fat"
  );
  const polyunsaturatedFat = getNutrimentPerServing(
    nutriments,
    "polyunsaturated_fat"
  );
  const salt = getNutrimentPerServing(nutriments, "salt");
  const potassium = getNutrimentPerServing(nutriments, "potassium");
  const calcium = getNutrimentPerServing(nutriments, "calcium");
  const iron = getNutrimentPerServing(nutriments, "iron");
  const vitaminA = getNutrimentPerServing(nutriments, "vitamin_a");
  const vitaminC = getNutrimentPerServing(nutriments, "vitamin_c");
  const vitaminD = getNutrimentPerServing(nutriments, "vitamin_d");
  const vitaminB6 = getNutrimentPerServing(nutriments, "vitamin_b6");
  const vitaminB12 = getNutrimentPerServing(nutriments, "vitamin_b12");
  const vitaminE = getNutrimentPerServing(nutriments, "vitamin_e");
  const magnesium = getNutrimentPerServing(nutriments, "magnesium");
  const zinc = getNutrimentPerServing(nutriments, "zinc");
  const sucrose = getNutrimentPerServing(nutriments, "sucrose");
  const fructose = getNutrimentPerServing(nutriments, "fructose");
  const lactose = getNutrimentPerServing(nutriments, "lactose");
  const starch = getNutrimentPerServing(nutriments, "starch");
  const alcohol = getNutrimentPerServing(nutriments, "alcohol");

  // Fallback/critical field check
  const missingCritical: string[] = [];
  if (typeof calories !== "number") missingCritical.push("calories");
  if (typeof protein !== "number") missingCritical.push("protein");
  if (typeof carbohydrates !== "number") missingCritical.push("carbohydrates");
  if (typeof fat !== "number") missingCritical.push("fat");

  // Parse serving size (e.g., "100g" or "30 ml")
  let servingSize = 100;
  let servingUnit = "g";
  if (typeof p.serving_size === "string") {
    const match = p.serving_size.match(/([\d.]+)\s*(\w+)/);
    if (match) {
      servingSize = parseFloat(match[1]);
      servingUnit = match[2];
    }
  }

  // Parse net weight or quantity (e.g., '500g', '1kg', '0.5 L')
  let netWeight: number | undefined = undefined;
  if (typeof p.quantity === "string") {
    // Try to parse e.g. '500g', '1kg', '0.5 L'
    const match = p.quantity.match(/([\d.]+)\s*(g|kg|ml|l)/i);
    if (match) {
      let value = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      if (unit === "kg") value *= 1000;
      if (unit === "l") value *= 1000;
      // ml stays as is, g stays as is
      netWeight = value;
    }
  } else if (typeof p.net_weight === "number") {
    netWeight = p.net_weight;
  }

  const product: ProductData = {
    id: `off-${barcode}`,
    barcode,
    name: p.product_name || "Unknown product",
    brand: p.brands || undefined,
    serving: { size: servingSize, unit: servingUnit },
    calories: typeof calories === "number" ? Math.round(calories) : undefined,
    protein: typeof protein === "number" ? protein : undefined,
    carbohydrates:
      typeof carbohydrates === "number" ? carbohydrates : undefined,
    fat: typeof fat === "number" ? fat : undefined,
    fiber: typeof fiber === "number" ? fiber : undefined,
    sodium: typeof sodium === "number" ? sodium : undefined,
    sugars: typeof sugars === "number" ? sugars : undefined,
    saturatedFat: typeof saturatedFat === "number" ? saturatedFat : undefined,
    cholesterol: typeof cholesterol === "number" ? cholesterol : undefined,
    transFat: typeof transFat === "number" ? transFat : undefined,
    monounsaturatedFat:
      typeof monounsaturatedFat === "number" ? monounsaturatedFat : undefined,
    polyunsaturatedFat:
      typeof polyunsaturatedFat === "number" ? polyunsaturatedFat : undefined,
    salt: typeof salt === "number" ? salt : undefined,
    potassium: typeof potassium === "number" ? potassium : undefined,
    calcium: typeof calcium === "number" ? calcium : undefined,
    iron: typeof iron === "number" ? iron : undefined,
    vitaminA: typeof vitaminA === "number" ? vitaminA : undefined,
    vitaminC: typeof vitaminC === "number" ? vitaminC : undefined,
    vitaminD: typeof vitaminD === "number" ? vitaminD : undefined,
    vitaminB6: typeof vitaminB6 === "number" ? vitaminB6 : undefined,
    vitaminB12: typeof vitaminB12 === "number" ? vitaminB12 : undefined,
    vitaminE: typeof vitaminE === "number" ? vitaminE : undefined,
    magnesium: typeof magnesium === "number" ? magnesium : undefined,
    zinc: typeof zinc === "number" ? zinc : undefined,
    sucrose: typeof sucrose === "number" ? sucrose : undefined,
    fructose: typeof fructose === "number" ? fructose : undefined,
    lactose: typeof lactose === "number" ? lactose : undefined,
    starch: typeof starch === "number" ? starch : undefined,
    alcohol: typeof alcohol === "number" ? alcohol : undefined,
    nutriGrade:
      Array.isArray(p.nutrition_grades_tags) && p.nutrition_grades_tags[0]
        ? p.nutrition_grades_tags[0].toUpperCase()
        : undefined,
    imageUrl: p.image_url || undefined,
    verified: false,
    ecoscore:
      typeof p.ecoscore_score === "number" && !isNaN(p.ecoscore_score)
        ? p.ecoscore_score
        : undefined,
    ecoscoreGrade:
      typeof p.ecoscore_grade === "string" ? p.ecoscore_grade : undefined,
    novaGroup:
      typeof p.nova_group === "number" && !isNaN(p.nova_group)
        ? p.nova_group
        : undefined,
    ingredientsText:
      typeof p.ingredients_text === "string" ? p.ingredients_text : undefined,
    tracesTags: Array.isArray(p.traces_tags) ? p.traces_tags : undefined,
    packagingTags: Array.isArray(p.packaging_tags)
      ? p.packaging_tags
      : undefined,
    originsTags: Array.isArray(p.origins_tags) ? p.origins_tags : undefined,
    netWeight,
    // Optionally, add a field for missingCritical if you want to surface it in the UI
    // missingCritical,
  };
  return product;
}
