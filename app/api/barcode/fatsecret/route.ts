import { NextRequest, NextResponse } from "next/server";
import { fatSecretBarcodeLookup, getFatSecretApiStatus } from "@/lib/api/fatsecret";
import { isValidBarcode } from "@/lib/utils/utils";
import type {
  APIErrorResponse,
  APISuccessResponse,
  ProductData,
} from "@/types";

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      const errorResponse: APIErrorResponse = {
        error: "Invalid JSON in request body",
        code: "INVALID_JSON",
        status: 400,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { barcode } = requestBody;

    // Validate barcode format
    if (!barcode || typeof barcode !== 'string' || !isValidBarcode(barcode)) {
      const errorResponse: APIErrorResponse = {
        error: "Invalid barcode format. Please provide a valid 8-14 digit barcode.",
        code: "INVALID_BARCODE",
        status: 400,
        details: {
          received: barcode,
          expected: "8-14 digit numeric string",
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Check API status before making request
    const apiStatus = getFatSecretApiStatus();
    if (!apiStatus.hasBarcode) {
      const errorResponse: APIErrorResponse = {
        error: "Barcode scanning not available",
        code: "BARCODE_NOT_AVAILABLE",
        status: 503,
        details: {
          message: "Barcode scanning requires FatSecret Premier access. Please contact administrator.",
        },
      };
      return NextResponse.json(errorResponse, { status: 503 });
    }

    console.log(`FatSecret API: Looking up barcode ${barcode}`);

    // Search for product using FatSecret API
    const product = await fatSecretBarcodeLookup(barcode);

    if (!product) {
      const errorResponse: APIErrorResponse = {
        error: "Product not found in FatSecret database",
        code: "PRODUCT_NOT_FOUND",
        status: 404,
        details: {
          barcode,
          suggestion: "Try scanning again, use OpenFoodFacts lookup, or add the product manually",
          alternatives: ["/api/products/route.ts for OpenFoodFacts lookup"],
        },
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Return successful response
    const successResponse: APISuccessResponse<ProductData> = {
      data: product,
      message: "Product found successfully in FatSecret database",
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(successResponse, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
        "X-API-Source": "fatsecret",
      },
    });
  } catch (error) {
    console.error("FatSecret barcode lookup API error:", error);

    // Handle specific error types with better categorization
    if (error instanceof Error) {
      // Authentication errors
      if (error.message.includes("authentication failed") || 
          error.message.includes("Missing required environment variables")) {
        const errorResponse: APIErrorResponse = {
          error: "FatSecret authentication failed",
          code: "FATSECRET_AUTH_ERROR",
          status: 503,
          details: {
            message: "Unable to authenticate with FatSecret API. Check credentials.",
            action: "Contact administrator to verify API credentials",
          },
        };
        return NextResponse.json(errorResponse, { status: 503 });
      }

      // Rate limiting errors
      if (error.message.includes("Rate limit exceeded")) {
        const errorResponse: APIErrorResponse = {
          error: "Too many requests",
          code: "RATE_LIMIT_EXCEEDED",
          status: 429,
          details: {
            message: error.message,
            retryAfter: "60 seconds",
          },
        };
        return NextResponse.json(errorResponse, { status: 429 });
      }

      // Access denied (Premier required)
      if (error.message.includes("access denied") || 
          error.message.includes("Premier access")) {
        const errorResponse: APIErrorResponse = {
          error: "FatSecret access denied",
          code: "FATSECRET_ACCESS_DENIED",
          status: 403,
          details: {
            message: "Barcode scanning requires FatSecret Premier tier access",
            action: "Upgrade to Premier tier or use alternative lookup methods",
          },
        };
        return NextResponse.json(errorResponse, { status: 403 });
      }

      // General API errors
      if (error.message.includes("FatSecret API error")) {
        const errorResponse: APIErrorResponse = {
          error: "FatSecret API temporarily unavailable",
          code: "FATSECRET_API_ERROR",
          status: 503,
          details: {
            message: "External service temporarily unavailable",
            suggestion: "Try again later or use alternative lookup methods",
          },
        };
        return NextResponse.json(errorResponse, { status: 503 });
      }

      // Network/timeout errors
      if (error.message.includes("fetch") || error.message.includes("timeout")) {
        const errorResponse: APIErrorResponse = {
          error: "Network error",
          code: "NETWORK_ERROR",
          status: 503,
          details: {
            message: "Unable to connect to FatSecret API",
            suggestion: "Check network connectivity and try again",
          },
        };
        return NextResponse.json(errorResponse, { status: 503 });
      }
    }

    // Generic error fallback
    const errorResponse: APIErrorResponse = {
      error: "Internal server error",
      code: "INTERNAL_ERROR",
      status: 500,
      details: {
        message: "An unexpected error occurred",
        timestamp: new Date().toISOString(),
      },
    };
    return NextResponse.json(errorResponse, { status: 500 });
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
