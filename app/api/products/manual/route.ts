import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");

// Helper to ensure upload directory exists
function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

// Helper to save uploaded file
async function saveFile(file: File, field: string): Promise<string> {
  ensureUploadDir();
  const ext = path.extname(file.name) || ".jpg";
  const filename = `${field}-${uuidv4()}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  const arrayBuffer = await file.arrayBuffer();
  fs.writeFileSync(filepath, Buffer.from(arrayBuffer));
  return `/uploads/products/${filename}`;
}

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    // Extract fields
    const name = formData.get("name") as string;
    const brand = formData.get("brand") as string | undefined;
    const servingSize = parseFloat(formData.get("servingSize") as string);
    const servingUnit = formData.get("servingUnit") as string;
    const calories = parseFloat(formData.get("calories") as string);
    const protein = parseFloat(formData.get("protein") as string);
    const carbohydrates = parseFloat(formData.get("carbohydrates") as string);
    const fat = parseFloat(formData.get("fat") as string);
    const sugars = formData.get("sugars")
      ? parseFloat(formData.get("sugars") as string)
      : undefined;
    const fiber = formData.get("fiber")
      ? parseFloat(formData.get("fiber") as string)
      : undefined;
    const sodium = formData.get("sodium")
      ? parseFloat(formData.get("sodium") as string)
      : undefined;
    const saturatedFat = formData.get("saturatedFat")
      ? parseFloat(formData.get("saturatedFat") as string)
      : undefined;
    const ingredients = formData.get("ingredients") as string | undefined;
    const categories = formData.get("categories") as string | undefined;
    const allergens = formData.get("allergens") as string | undefined;
    const additives = formData.get("additives") as string | undefined;
    const ecoScore = formData.get("ecoScore")
      ? parseFloat(formData.get("ecoScore") as string)
      : undefined;
    const ecoScoreGrade = formData.get("ecoScoreGrade") as string | undefined;
    const novaGroup = formData.get("novaGroup")
      ? parseInt(formData.get("novaGroup") as string)
      : undefined;
    const labels = formData.get("labels") as string | undefined;
    const packaging = formData.get("packaging") as string | undefined;
    const countryOfOrigin = formData.get("countryOfOrigin") as
      | string
      | undefined;
    const brandOwner = formData.get("brandOwner") as string | undefined;
    const expirationDate = formData.get("expirationDate") as string | undefined;

    // Handle images
    let imageFrontUrl, imageIngredientsUrl, imageNutritionUrl;
    const imageFront = formData.get("imageFront");
    if (imageFront && imageFront instanceof File && imageFront.size > 0) {
      imageFrontUrl = await saveFile(imageFront, "front");
    }
    const imageIngredients = formData.get("imageIngredients");
    if (
      imageIngredients &&
      imageIngredients instanceof File &&
      imageIngredients.size > 0
    ) {
      imageIngredientsUrl = await saveFile(imageIngredients, "ingredients");
    }
    const imageNutrition = formData.get("imageNutrition");
    if (
      imageNutrition &&
      imageNutrition instanceof File &&
      imageNutrition.size > 0
    ) {
      imageNutritionUrl = await saveFile(imageNutrition, "nutrition");
    }

    // Save product to DB
    const product = await prisma.foodProduct.create({
      data: {
        name,
        brand,
        servingSize,
        servingUnit,
        calories,
        protein,
        carbohydrates,
        fat,
        sugars,
        fiber,
        sodium,
        saturatedFat,
        ingredients,
        categories,
        allergens,
        additivesTags: additives
          ? additives.split(",").map((s) => s.trim())
          : [],
        ecoScore,
        ecoScoreGrade,
        novaGroup,
        labels,
        packaging,
        countryOfOrigin,
        brandOwner,
        expirationDate,
        imageFrontUrl,
        imageIngredientsUrl,
        imageNutritionUrl,
        verified: false,
        source: "MANUAL",
      },
    });

    return NextResponse.json(
      { product, message: "Product submitted successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Manual product submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit product" },
      { status: 500 }
    );
  }
}
