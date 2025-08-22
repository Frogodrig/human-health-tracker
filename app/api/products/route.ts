import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import type { ProductData } from "@/types";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (query) {
      // Search products by name
      const products = await prisma.product.findMany({
        where: {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        take: limit,
        orderBy: {
          name: "asc",
        },
      });

      return NextResponse.json({ products }, { status: 200 });
    } else {
      // Get all products
      const products = await prisma.product.findMany({
        take: limit,
        orderBy: {
          name: "asc",
        },
      });

      return NextResponse.json({ products }, { status: 200 });
    }
  } catch (error) {
    console.error("Error retrieving products:", error);
    return NextResponse.json(
      { error: "Failed to retrieve products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const productData: ProductData = await request.json();

    // Validate required fields
    if (!productData.name || !productData.id) {
      return NextResponse.json(
        { error: "Missing required fields: name and id" },
        { status: 400 }
      );
    }

    // Check if product already exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productData.id },
    });

    if (existingProduct) {
      // Update existing product
      const updatedProduct = await prisma.product.update({
        where: { id: productData.id },
        data: {
          name: productData.name,
          brand: productData.brand,
          barcode: productData.barcode,
          calories: productData.calories,
          protein: productData.protein,
          carbohydrates: productData.carbohydrates,
          fat: productData.fat,
          fiber: productData.fiber,
          sodium: productData.sodium,
          sugars: productData.sugars,
          saturatedFat: productData.saturatedFat,
          servingSize: productData.serving.size,
          servingUnit: productData.serving.unit,
          imageUrl: productData.imageUrl,
          verified: productData.verified,
          nutriGrade: productData.nutriGrade,
        },
      });

      return NextResponse.json({ product: updatedProduct }, { status: 200 });
    }

    // Create new product
    const newProduct = await prisma.product.create({
      data: {
        id: productData.id,
        name: productData.name,
        brand: productData.brand,
        barcode: productData.barcode,
        calories: productData.calories,
        protein: productData.protein,
        carbohydrates: productData.carbohydrates,
        fat: productData.fat,
        fiber: productData.fiber,
        sodium: productData.sodium,
        sugars: productData.sugars,
        saturatedFat: productData.saturatedFat,
        servingSize: productData.serving.size,
        servingUnit: productData.serving.unit,
        imageUrl: productData.imageUrl,
        verified: productData.verified,
        nutriGrade: productData.nutriGrade,
      },
    });

    console.log(
      "Caching product:",
      productData.name,
      `(${productData.barcode})`
    );

    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error) {
    console.error("Error caching product:", error);
    return NextResponse.json(
      { error: "Failed to cache product" },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
