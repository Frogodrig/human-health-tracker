import fs from "fs";
import zlib from "zlib";
import readline from "readline";
import path from "path";
import fetch from "node-fetch";
import { PrismaClient } from "@/lib/generated/prisma";

const OFF_URL =
  "https://static.openfoodfacts.org/data/openfoodfacts-products.jsonl.gz";
const DATA_DIR = path.join(__dirname, "../data");
const JSONL_GZ = path.join(DATA_DIR, "openfoodfacts-products.jsonl.gz");
const JSONL = path.join(DATA_DIR, "openfoodfacts-products.jsonl");

const prisma = new PrismaClient();

async function downloadFile(url: string, dest: string) {
  if (fs.existsSync(dest)) {
    console.log(`File already exists: ${dest}`);
    return;
  }
  console.log(`Downloading ${url} ...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download: ${res.statusText}`);
  const fileStream = fs.createWriteStream(dest);
  await new Promise<void>((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", () => reject(new Error("Stream error")));
    fileStream.on("finish", () => resolve());
  });
  console.log(`Downloaded to ${dest}`);
}

async function decompressGzip(src: string, dest: string) {
  if (fs.existsSync(dest)) {
    console.log(`Decompressed file already exists: ${dest}`);
    return;
  }
  console.log(`Decompressing ${src} ...`);
  await new Promise<void>((resolve, reject) => {
    const inp = fs.createReadStream(src);
    const out = fs.createWriteStream(dest);
    inp.pipe(zlib.createGunzip()).pipe(out);
    out.on("finish", () => resolve());
    out.on("error", () => reject(new Error("Decompression error")));
  });
  console.log(`Decompressed to ${dest}`);
}

function parseNumber(val: unknown): number | undefined {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = parseFloat(val);
    return isNaN(n) ? undefined : n;
  }
  return undefined;
}

// Helper to validate NutriGrade
const validNutriGrades = ["A", "B", "C", "D"] as const;
type NutriGrade = (typeof validNutriGrades)[number];
function isNutriGrade(val: string): val is NutriGrade {
  return validNutriGrades.includes(val as NutriGrade);
}
function parseNutriGrade(val: unknown): NutriGrade | null {
  if (typeof val === "string") {
    const upper = val.toUpperCase();
    if (isNutriGrade(upper)) return upper;
  }
  return null;
}

async function importJsonl() {
  await downloadFile(OFF_URL, JSONL_GZ);
  await decompressGzip(JSONL_GZ, JSONL);

  const fileStream = fs.createReadStream(JSONL);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });
  let count = 0;
  let imported = 0;
  for await (const line of rl) {
    count++;
    if (!line.trim()) continue;
    let product: Record<string, unknown>;
    try {
      product = JSON.parse(line);
    } catch {
      console.warn(`Invalid JSON at line ${count}`);
      continue;
    }
    // Only import if barcode and nutrition are present
    if (!product.code || !product.nutriments) continue;
    const barcode = String(product.code);
    const name =
      (product.product_name as string) ||
      (product.generic_name as string) ||
      undefined;
    if (!name) continue;
    const nutr = product.nutriments as Record<string, unknown>;
    const calories = parseNumber(
      nutr["energy-kcal_100g"] || nutr["energy-kcal"] || nutr["energy_100g"]
    );
    const protein = parseNumber(nutr["proteins_100g"]);
    const carbohydrates = parseNumber(nutr["carbohydrates_100g"]);
    const fat = parseNumber(nutr["fat_100g"]);
    if ([calories, protein, carbohydrates, fat].some((v) => v === undefined))
      continue;
    // Optional fields
    const sugars = parseNumber(nutr["sugars_100g"]);
    const fiber = parseNumber(nutr["fiber_100g"]);
    const sodium = parseNumber(nutr["sodium_100g"]);
    const saturatedFat = parseNumber(nutr["saturated-fat_100g"]);
    const servingSize = parseNumber(product.serving_size) || 100;
    let servingUnit = "g";
    if (typeof product.serving_size === "string") {
      const match = product.serving_size.match(/[a-zA-Z]+/);
      if (match) {
        servingUnit = match[0];
      }
    }
    const brand = (product.brands as string) || undefined;
    const nutriGrade = parseNutriGrade(
      Array.isArray(product.nutrition_grades_tags) &&
        product.nutrition_grades_tags[0]
        ? product.nutrition_grades_tags[0]
        : undefined
    );
    const imageUrl = (product.image_url as string) || undefined;

    // --- Extended OFF fields ---
    const ingredients = (product.ingredients_text as string) || undefined;
    const categories = (product.categories as string) || undefined;
    const categoriesTags = Array.isArray(product.categories_tags)
      ? (product.categories_tags as string[])
      : typeof product.categories_tags === "string"
      ? (product.categories_tags as string).split(",")
      : [];
    const allergens = (product.allergens as string) || undefined;
    const allergensTags = Array.isArray(product.allergens_tags)
      ? (product.allergens_tags as string[])
      : typeof product.allergens_tags === "string"
      ? (product.allergens_tags as string).split(",")
      : [];
    const additivesTags = Array.isArray(product.additives_tags)
      ? (product.additives_tags as string[])
      : typeof product.additives_tags === "string"
      ? (product.additives_tags as string).split(",")
      : [];
    const ecoScore = parseNumber(product.ecoscore_score);
    const ecoScoreGrade = (product.ecoscore_grade as string) || undefined;
    const novaGroup = parseNumber(product.nova_group) as number | undefined;
    const labels = (product.labels as string) || undefined;
    const labelsTags = Array.isArray(product.labels_tags)
      ? (product.labels_tags as string[])
      : typeof product.labels_tags === "string"
      ? (product.labels_tags as string).split(",")
      : [];
    const packaging = (product.packaging as string) || undefined;
    const countryOfOrigin = (product.countries as string) || undefined;
    const countryTags = Array.isArray(product.countries_tags)
      ? (product.countries_tags as string[])
      : typeof product.countries_tags === "string"
      ? (product.countries_tags as string).split(",")
      : [];
    const brandOwner = (product.brand_owner as string) || undefined;
    const imageFrontUrl = (product.image_front_url as string) || undefined;
    const imageIngredientsUrl =
      (product.image_ingredients_url as string) || undefined;
    const imageNutritionUrl =
      (product.image_nutrition_url as string) || undefined;
    const expirationDate = (product.expiration_date as string) || undefined;
    const languagesTags = Array.isArray(product.languages_tags)
      ? (product.languages_tags as string[])
      : typeof product.languages_tags === "string"
      ? (product.languages_tags as string).split(",")
      : [];
    // --- end OFF fields ---

    try {
      await prisma.foodProduct.upsert({
        where: { barcode },
        update: {
          name: name as string,
          brand,
          servingSize: servingSize as number,
          servingUnit,
          calories: calories as number,
          protein: protein as number,
          carbohydrates: carbohydrates as number,
          sugars,
          fat: fat as number,
          saturatedFat,
          fiber,
          sodium,
          nutriGrade,
          imageUrl,
          // --- Extended OFF fields ---
          ingredients,
          categories,
          categoriesTags,
          allergens,
          allergensTags,
          additivesTags,
          ecoScore,
          ecoScoreGrade,
          novaGroup,
          labels,
          labelsTags,
          packaging,
          countryOfOrigin,
          countryTags,
          brandOwner,
          imageFrontUrl,
          imageIngredientsUrl,
          imageNutritionUrl,
          expirationDate,
          languagesTags,
          // --- end OFF fields ---
          verified: false,
          source: "MANUAL",
        },
        create: {
          barcode,
          name: name as string,
          brand,
          servingSize: servingSize as number,
          servingUnit,
          calories: calories as number,
          protein: protein as number,
          carbohydrates: carbohydrates as number,
          sugars,
          fat: fat as number,
          saturatedFat,
          fiber,
          sodium,
          nutriGrade,
          imageUrl,
          // --- Extended OFF fields ---
          ingredients,
          categories,
          categoriesTags,
          allergens,
          allergensTags,
          additivesTags,
          ecoScore,
          ecoScoreGrade,
          novaGroup,
          labels,
          labelsTags,
          packaging,
          countryOfOrigin,
          countryTags,
          brandOwner,
          imageFrontUrl,
          imageIngredientsUrl,
          imageNutritionUrl,
          expirationDate,
          languagesTags,
          // --- end OFF fields ---
          verified: false,
          source: "MANUAL",
        },
      });
      imported++;
      if (imported % 1000 === 0)
        console.log(`Imported ${imported} products (processed ${count})`);
    } catch (err) {
      if (imported % 1000 === 0) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`Error importing barcode ${barcode}:`, msg);
      }
    }
  }
  console.log(`Done. Imported ${imported} products from ${count} lines.`);
  await prisma.$disconnect();
}

importJsonl().catch((e) => {
  console.error(e);
  process.exit(1);
});
