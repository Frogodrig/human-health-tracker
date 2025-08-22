// !!! WARNING: This file is server-only. Never import or use in client components, hooks, or any code that runs in the browser.
import { PrismaClient } from "@/lib/generated/prisma";
import { isValidBarcode } from "@/lib/utils/utils";
import { fatSecretBarcodeLookup, fatSecretSearch } from "@/lib/api/fatsecret";
import { openFoodFactsBarcodeLookup } from "@/lib/api/openfoodfacts";
import type { ProductData } from "@/types";

const prisma = new PrismaClient();

// Helper for NutriGrade enum validation
// Only include allowed values from your Prisma schema
const VALID_NUTRI_GRADES = ["A", "B", "C", "D"];
function toNutriGradeEnum(val: unknown): "A" | "B" | "C" | "D" | undefined {
  if (typeof val === "string") {
    const upper = val.toUpperCase();
    if (VALID_NUTRI_GRADES.includes(upper))
      return upper as "A" | "B" | "C" | "D";
  }
  return undefined;
}

export async function searchProductByBarcode(
  barcode: string
): Promise<ProductData | null> {
  console.log(`[Barcode Lookup] Start: ${barcode}`);
  // Validate barcode format
  if (!barcode || !isValidBarcode(barcode)) {
    console.warn(`[Barcode Lookup] Invalid barcode format: ${barcode}`);
    throw new Error("Invalid barcode format");
  }

  // 1. Try internal DB
  const internalProduct = await prisma.foodProduct.findFirst({
    where: { barcode },
  });
  if (internalProduct) {
    console.log(`[Barcode Lookup] Found in DB: ${barcode}`);
    // Map Prisma FoodProduct to ProductData
    const mappedProduct: ProductData = {
      id: internalProduct.id,
      barcode: internalProduct.barcode || undefined,
      name: internalProduct.name,
      brand: internalProduct.brand || undefined,
      serving: {
        size: internalProduct.servingSize,
        unit: internalProduct.servingUnit,
      },
      calories: internalProduct.calories,
      protein: internalProduct.protein,
      carbohydrates: internalProduct.carbohydrates,
      sugars: internalProduct.sugars ?? undefined,
      fat: internalProduct.fat,
      saturatedFat: internalProduct.saturatedFat ?? undefined,
      fiber: internalProduct.fiber ?? undefined,
      sodium: internalProduct.sodium ?? undefined,
      cholesterol: internalProduct.cholesterol ?? undefined,
      transFat: internalProduct.transFat ?? undefined,
      monounsaturatedFat: internalProduct.monounsaturatedFat ?? undefined,
      polyunsaturatedFat: internalProduct.polyunsaturatedFat ?? undefined,
      salt: internalProduct.salt ?? undefined,
      potassium: internalProduct.potassium ?? undefined,
      calcium: internalProduct.calcium ?? undefined,
      iron: internalProduct.iron ?? undefined,
      vitaminA: internalProduct.vitaminA ?? undefined,
      vitaminC: internalProduct.vitaminC ?? undefined,
      vitaminD: internalProduct.vitaminD ?? undefined,
      vitaminB6: internalProduct.vitaminB6 ?? undefined,
      vitaminB12: internalProduct.vitaminB12 ?? undefined,
      vitaminE: internalProduct.vitaminE ?? undefined,
      magnesium: internalProduct.magnesium ?? undefined,
      zinc: internalProduct.zinc ?? undefined,
      sucrose: internalProduct.sucrose ?? undefined,
      fructose: internalProduct.fructose ?? undefined,
      lactose: internalProduct.lactose ?? undefined,
      starch: internalProduct.starch ?? undefined,
      alcohol: internalProduct.alcohol ?? undefined,
      nutriGrade: toNutriGradeEnum(internalProduct.nutriGrade),
      imageUrl: internalProduct.imageUrl ?? undefined,
      verified: internalProduct.verified,
      ecoscore: internalProduct.ecoscore ?? undefined,
      ecoscoreGrade: internalProduct.ecoscoreGrade ?? undefined,
      novaGroup: internalProduct.novaGroup ?? undefined,
      ingredientsText: internalProduct.ingredientsText ?? undefined,
      tracesTags: internalProduct.tracesTags ?? undefined,
      packagingTags: internalProduct.packagingTags ?? undefined,
      originsTags: internalProduct.originsTags ?? undefined,
    };
    return mappedProduct;
  } else {
    console.log(`[Barcode Lookup] Not found in DB: ${barcode}`);
  }

  // 2. Try FatSecret
  try {
    const fatSecretProduct = await fatSecretBarcodeLookup(barcode);
    if (fatSecretProduct) {
      console.log(`[Barcode Lookup] Found in FatSecret: ${barcode}`);
      // Cache in DB
      await prisma.foodProduct.create({
        data: {
          ...fatSecretProduct,
          servingSize: fatSecretProduct.serving.size,
          servingUnit: fatSecretProduct.serving.unit,
          nutriGrade: toNutriGradeEnum(fatSecretProduct.nutriGrade),
          calories: fatSecretProduct.calories ?? 0,
          protein: fatSecretProduct.protein ?? 0,
          carbohydrates: fatSecretProduct.carbohydrates ?? 0,
          fat: fatSecretProduct.fat ?? 0,
          cholesterol: fatSecretProduct.cholesterol,
          transFat: fatSecretProduct.transFat,
          monounsaturatedFat: fatSecretProduct.monounsaturatedFat,
          polyunsaturatedFat: fatSecretProduct.polyunsaturatedFat,
          salt: fatSecretProduct.salt,
          potassium: fatSecretProduct.potassium,
          calcium: fatSecretProduct.calcium,
          iron: fatSecretProduct.iron,
          vitaminA: fatSecretProduct.vitaminA,
          vitaminC: fatSecretProduct.vitaminC,
          vitaminD: fatSecretProduct.vitaminD,
          vitaminB6: fatSecretProduct.vitaminB6,
          vitaminB12: fatSecretProduct.vitaminB12,
          vitaminE: fatSecretProduct.vitaminE,
          magnesium: fatSecretProduct.magnesium,
          zinc: fatSecretProduct.zinc,
          sucrose: fatSecretProduct.sucrose,
          fructose: fatSecretProduct.fructose,
          lactose: fatSecretProduct.lactose,
          starch: fatSecretProduct.starch,
          alcohol: fatSecretProduct.alcohol,
          ecoscore: fatSecretProduct.ecoscore,
          ecoscoreGrade: fatSecretProduct.ecoscoreGrade,
          novaGroup: fatSecretProduct.novaGroup,
          ingredientsText: fatSecretProduct.ingredientsText,
          tracesTags: fatSecretProduct.tracesTags,
          packagingTags: fatSecretProduct.packagingTags,
          originsTags: fatSecretProduct.originsTags,
        },
      });
      return fatSecretProduct;
    } else {
      console.log(`[Barcode Lookup] Not found in FatSecret: ${barcode}`);
    }
  } catch (err) {
    console.warn(
      `[Barcode Lookup] FatSecret lookup failed for ${barcode}:`,
      err
    );
  }

  // 3. Fallback: Local Open Food Facts cache
  const localOFFProduct = await prisma.foodProduct.findFirst({
    where: {
      barcode,
      source: "MANUAL",
    },
  });
  if (localOFFProduct) {
    console.log(`[Barcode Lookup] Found in local OFF cache: ${barcode}`);
    // Map Prisma FoodProduct to ProductData
    const mappedProduct: ProductData = {
      id: localOFFProduct.id,
      barcode: localOFFProduct.barcode || undefined,
      name: localOFFProduct.name,
      brand: localOFFProduct.brand || undefined,
      serving: {
        size: localOFFProduct.servingSize,
        unit: localOFFProduct.servingUnit,
      },
      calories: localOFFProduct.calories,
      protein: localOFFProduct.protein,
      carbohydrates: localOFFProduct.carbohydrates,
      sugars: localOFFProduct.sugars ?? undefined,
      fat: localOFFProduct.fat,
      saturatedFat: localOFFProduct.saturatedFat ?? undefined,
      fiber: localOFFProduct.fiber ?? undefined,
      sodium: localOFFProduct.sodium ?? undefined,
      cholesterol: localOFFProduct.cholesterol ?? undefined,
      transFat: localOFFProduct.transFat ?? undefined,
      monounsaturatedFat: localOFFProduct.monounsaturatedFat ?? undefined,
      polyunsaturatedFat: localOFFProduct.polyunsaturatedFat ?? undefined,
      salt: localOFFProduct.salt ?? undefined,
      potassium: localOFFProduct.potassium ?? undefined,
      calcium: localOFFProduct.calcium ?? undefined,
      iron: localOFFProduct.iron ?? undefined,
      vitaminA: localOFFProduct.vitaminA ?? undefined,
      vitaminC: localOFFProduct.vitaminC ?? undefined,
      vitaminD: localOFFProduct.vitaminD ?? undefined,
      vitaminB6: localOFFProduct.vitaminB6 ?? undefined,
      vitaminB12: localOFFProduct.vitaminB12 ?? undefined,
      vitaminE: localOFFProduct.vitaminE ?? undefined,
      magnesium: localOFFProduct.magnesium ?? undefined,
      zinc: localOFFProduct.zinc ?? undefined,
      sucrose: localOFFProduct.sucrose ?? undefined,
      fructose: localOFFProduct.fructose ?? undefined,
      lactose: localOFFProduct.lactose ?? undefined,
      starch: localOFFProduct.starch ?? undefined,
      alcohol: localOFFProduct.alcohol ?? undefined,
      nutriGrade: toNutriGradeEnum(localOFFProduct.nutriGrade),
      imageUrl: localOFFProduct.imageUrl ?? undefined,
      verified: localOFFProduct.verified,
      ecoscore: localOFFProduct.ecoscore ?? undefined,
      ecoscoreGrade: localOFFProduct.ecoscoreGrade ?? undefined,
      novaGroup: localOFFProduct.novaGroup ?? undefined,
      ingredientsText: localOFFProduct.ingredientsText ?? undefined,
      tracesTags: localOFFProduct.tracesTags ?? undefined,
      packagingTags: localOFFProduct.packagingTags ?? undefined,
      originsTags: localOFFProduct.originsTags ?? undefined,
    };
    return mappedProduct;
  } else {
    console.log(`[Barcode Lookup] Not found in local OFF cache: ${barcode}`);
  }

  // 4. Fallback: Open Food Facts API
  try {
    const offProduct = await openFoodFactsBarcodeLookup(barcode);
    if (offProduct) {
      console.log(`[Barcode Lookup] Found in Open Food Facts API: ${barcode}`);
      // Exclude 'serving' from the DB create call
      const { serving, ...dbProduct } = offProduct;
      await prisma.foodProduct.create({
        data: {
          ...dbProduct,
          servingSize: serving.size,
          servingUnit: serving.unit,
          nutriGrade: toNutriGradeEnum(offProduct.nutriGrade),
          calories: offProduct.calories ?? 0,
          protein: offProduct.protein ?? 0,
          carbohydrates: offProduct.carbohydrates ?? 0,
          fat: offProduct.fat ?? 0,
          cholesterol: offProduct.cholesterol,
          transFat: offProduct.transFat,
          monounsaturatedFat: offProduct.monounsaturatedFat,
          polyunsaturatedFat: offProduct.polyunsaturatedFat,
          salt: offProduct.salt,
          potassium: offProduct.potassium,
          calcium: offProduct.calcium,
          iron: offProduct.iron,
          vitaminA: offProduct.vitaminA,
          vitaminC: offProduct.vitaminC,
          vitaminD: offProduct.vitaminD,
          vitaminB6: offProduct.vitaminB6,
          vitaminB12: offProduct.vitaminB12,
          vitaminE: offProduct.vitaminE,
          magnesium: offProduct.magnesium,
          zinc: offProduct.zinc,
          sucrose: offProduct.sucrose,
          fructose: offProduct.fructose,
          lactose: offProduct.lactose,
          starch: offProduct.starch,
          alcohol: offProduct.alcohol,
          ecoscore: offProduct.ecoscore,
          ecoscoreGrade: offProduct.ecoscoreGrade,
          novaGroup: offProduct.novaGroup,
          ingredientsText: offProduct.ingredientsText,
          tracesTags: offProduct.tracesTags,
          packagingTags: offProduct.packagingTags,
          originsTags: offProduct.originsTags,
        },
      });
      return offProduct;
    } else {
      console.log(
        `[Barcode Lookup] Not found in Open Food Facts API: ${barcode}`
      );
    }
  } catch (err) {
    console.warn(
      `[Barcode Lookup] Open Food Facts API fallback failed for ${barcode}:`,
      err
    );
  }

  console.log(`[Barcode Lookup] Product not found in any source: ${barcode}`);
  return null;
}

export async function searchProductsByName(
  query: string,
  limit: number = 20
): Promise<ProductData[]> {
  if (!query || query.trim().length < 2) {
    throw new Error("Search query must be at least 2 characters");
  }

  // 1. Try FatSecret search
  try {
    const fatSecretProducts = await fatSecretSearch(query, limit);
    if (fatSecretProducts.length > 0) {
      return fatSecretProducts;
    }
  } catch (err) {
    console.warn("FatSecret search failed:", err);
  }

  return [];
}
