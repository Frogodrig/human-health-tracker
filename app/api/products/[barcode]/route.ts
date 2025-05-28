// Updated API route for product lookup
import { NextRequest, NextResponse } from "next/server";
import { productAPI, APIError, NetworkError } from "@/lib/api/api";
import { isValidBarcode } from "@/lib/utils/utils";
import type {
  APIErrorResponse,
  APISuccessResponse,
  ProductData,
} from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { barcode: string } }
) {
  try {
    const { barcode } = params;

    // Validate barcode format
    if (!barcode || !isValidBarcode(barcode)) {
      const errorResponse: APIErrorResponse = {
        error:
          "Invalid barcode format. Please provide a valid 8-14 digit barcode.",
        code: "INVALID_BARCODE",
        status: 400,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    console.log(`API: Looking up barcode ${barcode}`);

    // Search for product
    const product = await productAPI.searchByBarcode(barcode);

    if (!product) {
      const errorResponse: APIErrorResponse = {
        error: "Product not found",
        code: "PRODUCT_NOT_FOUND",
        status: 404,
        details: {
          barcode,
          suggestion: "Try scanning again or add the product manually",
        },
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Return successful response
    const successResponse: APISuccessResponse<ProductData> = {
      data: product,
      message: "Product found successfully",
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(successResponse, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Product lookup API error:", error);

    // Handle specific error types
    if (error instanceof NetworkError) {
      const errorResponse: APIErrorResponse = {
        error: "External service temporarily unavailable",
        code: "SERVICE_UNAVAILABLE",
        status: 503,
      };
      return NextResponse.json(errorResponse, { status: 503 });
    }

    if (error instanceof APIError) {
      const errorResponse: APIErrorResponse = {
        error: error.message,
        code: error.code || "API_ERROR",
        status: error.status || 500,
      };
      return NextResponse.json(errorResponse, { status: error.status || 500 });
    }

    // Generic error fallback
    const errorResponse: APIErrorResponse = {
      error: "Internal server error",
      code: "INTERNAL_ERROR",
      status: 500,
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Handle OPTIONS for CORS if needed
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
