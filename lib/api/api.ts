import type { ProductData, OpenFoodFactsResponse } from "@/types";
import { isValidBarcode, calculateNutriGrade } from "../utils/utils";

// API Configuration
const OPENFOODFACTS_BASE_URL = "https://world.openfoodfacts.org/api/v2";
const INTERNAL_API_BASE_URL = "/api";

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

// Generic API client with proper error handling
class APIClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  constructor(
    baseURL: string,
    options: { timeout?: number; headers?: Record<string, string> } = {}
  ) {
    this.baseURL = baseURL;
    this.timeout = options.timeout || 10000; // 10 seconds default
    this.defaultHeaders = {
      "Content-Type": "application/json",
      "User-Agent": "HealthTracker/1.0.0",
      ...options.headers,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & { timeout?: number } = {}
  ): Promise<T> {
    const { timeout = this.timeout, ...fetchOptions } = options;
    const url = `${this.baseURL}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...this.defaultHeaders,
          ...fetchOptions.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new APIError(
          `API Error: ${response.status} ${response.statusText} - ${errorText}`,
          response.status,
          response.status.toString()
        );
      }

      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        return await response.json();
      }

      // Handle non-JSON responses
      const text = await response.text();
      return text as unknown as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof APIError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new NetworkError("Request timeout");
        }
        if (error.message.includes("fetch")) {
          throw new NetworkError("Network connection failed");
        }
      }

      throw new APIError("Unexpected error occurred");
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { method: "GET", ...options });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  async put<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE", ...options });
  }
}

// API clients with proper configuration
export const openFoodFactsClient = new APIClient(OPENFOODFACTS_BASE_URL, {
  timeout: 15000, // Longer timeout for external API
  headers: {
    Accept: "application/json",
  },
});

export const internalAPIClient = new APIClient(INTERNAL_API_BASE_URL, {
  timeout: 5000,
});

// Transform OpenFoodFacts response to our ProductData format
export function transformOpenFoodFactsProduct(
  response: OpenFoodFactsResponse
): ProductData | null {
  try {
    if (!response?.product) {
      console.warn("No product data in response:", response);
      return null;
    }

    const product = response.product;
    const nutriments = product.nutriments || {};

    // Validate required fields
    if (!product.code && !product.product_name) {
      console.warn("Missing required product fields:", product);
      return null;
    }

    // Extract nutritional information with proper fallbacks
    const nutrition = {
      calories:
        nutriments["energy-kcal_100g"] || nutriments["energy-kcal"] || 0,
      protein: nutriments["proteins_100g"] || nutriments["proteins"] || 0,
      carbohydrates:
        nutriments["carbohydrates_100g"] || nutriments["carbohydrates"] || 0,
      fat: nutriments["fat_100g"] || nutriments["fat"] || 0,
      fiber: nutriments["fiber_100g"] || nutriments["fiber"] || undefined,
      sodium: nutriments["sodium_100g"] || nutriments["sodium"] || undefined,
      sugars: nutriments["sugars_100g"] || nutriments["sugars"] || undefined,
      saturatedFat:
        nutriments["saturated-fat_100g"] ||
        nutriments["saturated-fat"] ||
        undefined,
    };

    // Calculate serving size with fallbacks
    let servingSize = 100; // Default to 100g
    if (
      product.serving_quantity &&
      typeof product.serving_quantity === "number"
    ) {
      servingSize = product.serving_quantity;
    } else if (product.serving_size) {
      // Try to extract number from serving size string
      const match = product.serving_size.match(/(\d+\.?\d*)/);
      if (match) {
        servingSize = parseFloat(match[1]);
      }
    }

    const transformedProduct: ProductData = {
      id: product.code || `unknown-${Date.now()}`,
      barcode: product.code || undefined,
      name: product.product_name || "Unknown Product",
      brand: product.brands?.split(",")[0]?.trim() || undefined,
      serving: {
        size: servingSize,
        unit: "g",
      },
      ...nutrition,
      nutriGrade: calculateNutriGrade(nutrition),
      imageUrl: product.image_url || product.image_front_url || undefined,
      verified: true,
    };

    console.log("Transformed product:", transformedProduct);
    return transformedProduct;
  } catch (error) {
    console.error("Error transforming OpenFoodFacts product:", error);
    return null;
  }
}

// Product API functions with comprehensive error handling
export const productAPI = {
  /**
   * Search for a product by barcode
   */
  searchByBarcode: async (barcode: string): Promise<ProductData | null> => {
    try {
      // Validate barcode format
      if (!barcode || !isValidBarcode(barcode)) {
        throw new APIError("Invalid barcode format", 400, "INVALID_BARCODE");
      }

      console.log(`Searching for barcode: ${barcode}`);

      // First try our internal API
      try {
        const internalResult = await internalAPIClient.get<{
          product: ProductData;
        }>(`/products/${barcode}`);
        if (internalResult?.product) {
          console.log("Found product in internal database");
          return internalResult.product;
        }
      } catch (internalError) {
        console.log(
          "Product not found in internal database, trying OpenFoodFacts",
          internalError
        );
      }

      // Try OpenFoodFacts API
      const response = await openFoodFactsClient.get<OpenFoodFactsResponse>(
        `/product/${barcode}.json`
      );

      if (response.status === 0) {
        console.log("Product not found in OpenFoodFacts");
        return null;
      }

      const transformedProduct = transformOpenFoodFactsProduct(response);

      // Cache the product in our internal API (fire and forget)
      if (transformedProduct) {
        internalAPIClient
          .post("/products", transformedProduct)
          .catch((error) => {
            console.warn("Failed to cache product:", error);
          });
      }

      return transformedProduct;
    } catch (error) {
      console.error("Error in searchByBarcode:", error);

      if (error instanceof APIError || error instanceof NetworkError) {
        throw error;
      }

      throw new APIError("Failed to search for product");
    }
  },

  /**
   * Search for products by name/query
   */
  searchByName: async (
    query: string,
    limit: number = 20
  ): Promise<ProductData[]> => {
    try {
      if (!query || query.trim().length < 2) {
        throw new APIError(
          "Search query must be at least 2 characters",
          400,
          "INVALID_QUERY"
        );
      }

      console.log(`Searching for products: ${query}`);

      const encodedQuery = encodeURIComponent(query.trim());
      const response = await openFoodFactsClient.get<{
        products: any[];
        count: number;
        page: number;
      }>(
        `/cgi/search.pl?search_terms=${encodedQuery}&json=true&page_size=${limit}&fields=code,product_name,brands,nutriments,serving_quantity,serving_size,image_url,image_front_url`
      );

      if (!response.products || !Array.isArray(response.products)) {
        console.warn("Invalid response format from OpenFoodFacts search");
        return [];
      }

      const transformedProducts = response.products
        .map((product: any) =>
          transformOpenFoodFactsProduct({
            product,
            status: 1,
            status_verbose: "product found",
          })
        )
        .filter(
          (product: ProductData | null): product is ProductData =>
            product !== null
        )
        .slice(0, limit);

      console.log(
        `Found ${transformedProducts.length} products for query: ${query}`
      );
      return transformedProducts;
    } catch (error) {
      console.error("Error in searchByName:", error);

      if (error instanceof APIError || error instanceof NetworkError) {
        throw error;
      }

      throw new APIError("Failed to search for products");
    }
  },

  /**
   * Create a custom product
   */
  createCustomProduct: async (
    productData: Omit<ProductData, "id" | "verified">
  ): Promise<ProductData> => {
    try {
      const response = await internalAPIClient.post<{ product: ProductData }>(
        "/products",
        {
          ...productData,
          verified: false,
        }
      );

      return response.product;
    } catch (error) {
      console.error("Error creating custom product:", error);
      throw new APIError("Failed to create custom product");
    }
  },
};

// Export types and utilities
export type { ProductData, OpenFoodFactsResponse };
