import { ProductData } from "@/types";

// Add type definition for FatSecret food objects
interface FatSecretFood {
  food_id: number;
  food_name: string;
  brand_name?: string;
  serving_size?: number;
  serving_unit?: string;
  calories?: number;
  protein?: number;
  carbohydrate?: number;
  fat?: number;
  fiber?: number;
  sodium?: number;
  sugar?: number;
  saturated_fat?: number;
  food_image?: string;
}

// FatSecret API response validation schemas
interface FatSecretTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface FatSecretBarcodeResponse {
  barcode?: {
    food_id: number;
    food_name: string;
    brand_name?: string;
    serving_size?: number;
    serving_unit?: string;
    calories?: number;
    protein?: number;
    carbohydrate?: number;
    fat?: number;
    fiber?: number;
    sodium?: number;
    sugar?: number;
    saturated_fat?: number;
    food_image?: string;
  };
  error?: {
    message: string;
    code: number;
  };
}

interface FatSecretSearchResponse {
  foods?: {
    food: FatSecretFood | FatSecretFood[];
  };
  error?: {
    message: string;
    code: number;
  };
}

// Token management with retry logic
let fatSecretToken: { access_token: string; expires_at: number } | null = null;
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

// Environment variable validation
function validateEnvironmentVariables(): void {
  const requiredEnvVars = ['FATSECRET_CLIENT_ID', 'FATSECRET_CLIENT_SECRET'];
  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

// Premier access validation
function validatePremierAccess(): void {
  if (!process.env.FATSECRET_PREMIER_ACCESS || process.env.FATSECRET_PREMIER_ACCESS !== 'true') {
    console.warn('⚠️  Barcode scanning requires FatSecret Premier access. Set FATSECRET_PREMIER_ACCESS=true if you have Premier tier.');
  }
}

// Rate limiting implementation
function checkRateLimit(endpoint: string, maxRequests: number = 100, windowMs: number = 60000): void {
  const now = Date.now();
  const key = endpoint;
  const limit = rateLimiter.get(key);
  
  if (!limit || now > limit.resetTime) {
    rateLimiter.set(key, { count: 1, resetTime: now + windowMs });
    return;
  }
  
  if (limit.count >= maxRequests) {
    throw new Error(`Rate limit exceeded for ${endpoint}. Try again later.`);
  }
  
  limit.count++;
}

// Response validation
function validateTokenResponse(data: any): data is FatSecretTokenResponse {
  return data && 
         typeof data.access_token === 'string' && 
         typeof data.token_type === 'string' && 
         typeof data.expires_in === 'number';
}

function validateBarcodeResponse(data: any): data is FatSecretBarcodeResponse {
  return data && (data.barcode || data.error);
}

function validateSearchResponse(data: any): data is FatSecretSearchResponse {
  return data && (data.foods || data.error);
}

export async function getFatSecretToken(): Promise<string> {
  // Validate environment variables first
  validateEnvironmentVariables();
  
  // Check if we have a valid cached token
  if (fatSecretToken && fatSecretToken.expires_at > Date.now()) {
    return fatSecretToken.access_token;
  }

  // Rate limiting
  checkRateLimit('token', 10, 60000); // 10 requests per minute for token endpoint

  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      console.log(`Requesting FatSecret access token... (attempt ${retryCount + 1}/${maxRetries})`);

      // Determine scope based on environment configuration
      const hasBarcode = process.env.FATSECRET_PREMIER_ACCESS === 'true';
      const scope = hasBarcode ? 'basic barcode' : 'basic';
      
      const formData = new URLSearchParams();
      formData.append("grant_type", "client_credentials");
      formData.append("scope", scope);

      const clientId = process.env.FATSECRET_CLIENT_ID!;
      const clientSecret = process.env.FATSECRET_CLIENT_SECRET!;

      const res = await fetch("https://oauth.fatsecret.com/connect/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${clientId}:${clientSecret}`
          ).toString("base64")}`,
        },
        body: formData.toString(),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("FatSecret token request failed:", res.status, errorText);
        
        // Don't retry on authentication errors
        if (res.status === 401 || res.status === 403) {
          throw new Error(
            `FatSecret authentication failed: ${res.status} ${errorText}. Check your Client ID and Secret.`
          );
        }
        
        // Retry on other errors
        if (retryCount < maxRetries - 1) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000)); // Exponential backoff
          continue;
        }
        
        throw new Error(
          `Failed to get FatSecret token after ${maxRetries} attempts: ${res.status} ${errorText}`
        );
      }

      const data = await res.json();
      
      // Validate response
      if (!validateTokenResponse(data)) {
        throw new Error('Invalid token response format from FatSecret');
      }
      
      console.log("FatSecret token response:", {
        token_type: data.token_type,
        expires_in: data.expires_in,
        scope: data.scope,
        has_access_token: !!data.access_token,
      });

      // Cache token with 1 minute buffer
      fatSecretToken = {
        access_token: data.access_token,
        expires_at: Date.now() + (data.expires_in - 60) * 1000,
      };
      
      return fatSecretToken.access_token;
    } catch (error) {
      if (retryCount === maxRetries - 1) {
        console.error("FatSecret token request error:", error);
        throw error instanceof Error ? error : new Error("Failed to get FatSecret token");
      }
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
    }
  }
  
  throw new Error(`Failed to get FatSecret token after ${maxRetries} attempts`);
}

export async function fatSecretBarcodeLookup(
  barcode: string
): Promise<ProductData | null> {
  try {
    // Validate Premier access for barcode scanning
    validatePremierAccess();
    
    // Rate limiting for barcode endpoint
    checkRateLimit('barcode', 50, 60000); // 50 requests per minute
    
    const token = await getFatSecretToken();

    // Use correct method name as per FatSecret documentation
    const formData = new URLSearchParams();
    formData.append("method", "food.find_id_for_barcode");
    formData.append("barcode", barcode);
    formData.append("format", "json");

    const url = "https://platform.fatsecret.com/rest/server.api";

    console.log("Making FatSecret barcode API request to:", url);
    console.log("Barcode:", barcode);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${token}`,
      },
      body: formData.toString(),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("FatSecret API error:", res.status, errorText);
      
      // Handle specific error cases
      if (res.status === 401) {
        // Token might be expired, clear cache and retry once
        fatSecretToken = null;
        throw new Error(`FatSecret authentication failed: ${errorText}`);
      }
      
      if (res.status === 403) {
        throw new Error(`FatSecret access denied - check Premier access: ${errorText}`);
      }
      
      throw new Error(`FatSecret API error: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    console.log("FatSecret API response:", JSON.stringify(data, null, 2));

    // Handle API errors in response
    if (data.error) {
      console.log(`FatSecret API error: ${data.error.message} (code: ${data.error.code})`);
      return null;
    }

    // Check different response formats from FatSecret
    let foodId: string | null = null;
    
    // Format 1: {"barcode": {"food_id": 123, ...}} (old format)
    if (data.barcode && data.barcode.food_id) {
      foodId = data.barcode.food_id.toString();
    }
    // Format 2: {"food_id": {"value": "123"}} (new format)
    else if (data.food_id && data.food_id.value) {
      foodId = data.food_id.value.toString();
      // If food_id is "0", it means no product found
      if (foodId === "0") {
        console.log("No product found in FatSecret response for barcode:", barcode);
        return null;
      }
    }
    
    if (!foodId) {
      console.log("No product found in FatSecret response for barcode:", barcode);
      return null;
    }

    console.log(`Found food ID ${foodId} for barcode ${barcode}, fetching details...`);
    
    // Now fetch the full food details using the food ID
    return await fetchFoodDetails(foodId, barcode);
  } catch (error) {
    console.error("FatSecret barcode lookup error:", error);
    throw error;
  }
}

export async function fatSecretSearch(
  searchExpression: string,
  maxResults: number = 20
): Promise<ProductData[]> {
  try {
    // Rate limiting for search endpoint
    checkRateLimit('search', 100, 60000); // 100 requests per minute
    
    const token = await getFatSecretToken();

    // Use basic search method (v1) as v3 requires premier scope
    const formData = new URLSearchParams();
    formData.append("method", "foods.search");
    formData.append("search_expression", searchExpression);
    formData.append("max_results", Math.min(maxResults, 50).toString()); // Cap at 50
    formData.append("format", "json");

    const url = "https://platform.fatsecret.com/rest/server.api";

    console.log("Making FatSecret search API request to:", url);
    console.log("Search expression:", searchExpression);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${token}`,
      },
      body: formData.toString(),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("FatSecret search API error:", res.status, errorText);
      
      // Handle specific error cases
      if (res.status === 401) {
        fatSecretToken = null; // Clear cached token
        throw new Error(`FatSecret authentication failed: ${errorText}`);
      }
      
      throw new Error(`FatSecret search API error: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    console.log(
      "FatSecret search API response:",
      JSON.stringify(data, null, 2)
    );

    // Validate response format
    if (!validateSearchResponse(data)) {
      throw new Error('Invalid response format from FatSecret search API');
    }
    
    // Handle API errors in response
    if (data.error) {
      console.log(`FatSecret search API error: ${data.error.message} (code: ${data.error.code})`);
      return [];
    }

    // Check if foods were found
    if (!data.foods || !data.foods.food) {
      console.log("No foods found in FatSecret search response for:", searchExpression);
      return [];
    }

    // Handle both single food and array of foods
    const foods = Array.isArray(data.foods.food)
      ? data.foods.food
      : [data.foods.food];

    // Map FatSecret foods to ProductData array with better validation
    const products: ProductData[] = foods
      .map((food: FatSecretFood) => {
        // Validate required fields
        if (!food.food_id || !food.food_name) {
          console.warn('Skipping invalid food item:', food);
          return null;
        }

        return {
          id: food.food_id.toString(),
          barcode: undefined, // Search results don't include barcodes
          name: food.food_name.trim(),
          brand: food.brand_name?.trim() || undefined,
          serving: {
            size: food.serving_size || 100,
            unit: food.serving_unit || "g",
          },
          calories: Math.max(0, food.calories || 0),
          protein: Math.max(0, food.protein || 0),
          carbohydrates: Math.max(0, food.carbohydrate || 0),
          fat: Math.max(0, food.fat || 0),
          fiber: food.fiber ? Math.max(0, food.fiber) : undefined,
          sodium: food.sodium ? Math.max(0, food.sodium) : undefined,
          sugars: food.sugar ? Math.max(0, food.sugar) : undefined,
          saturatedFat: food.saturated_fat ? Math.max(0, food.saturated_fat) : undefined,
          nutriGrade: undefined,
          imageUrl: food.food_image || undefined,
          verified: true,
        } as ProductData;
      })
      .filter(
        (product: ProductData | null): product is ProductData =>
          product !== null
      );

    console.log(`Mapped ${products.length} FatSecret products from search`);
    return products;
  } catch (error) {
    console.error("FatSecret search error:", error);
    throw error;
  }
}

// Fetch detailed food information by food ID
async function fetchFoodDetails(foodId: string, barcode?: string): Promise<ProductData | null> {
  try {
    const token = await getFatSecretToken();

    const formData = new URLSearchParams();
    formData.append("method", "food.get.v4");
    formData.append("food_id", foodId);
    formData.append("format", "json");

    const url = "https://platform.fatsecret.com/rest/server.api";

    console.log("Fetching food details for ID:", foodId);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${token}`,
      },
      body: formData.toString(),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("FatSecret food details API error:", res.status, errorText);
      throw new Error(`FatSecret food details API error: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    console.log("FatSecret food details response:", JSON.stringify(data, null, 2));

    // Handle API errors
    if (data.error) {
      console.log(`FatSecret food details error: ${data.error.message} (code: ${data.error.code})`);
      return null;
    }

    // Extract food data from response
    const food = data.food;
    if (!food || !food.food_name) {
      console.log("Invalid food details response for ID:", foodId);
      return null;
    }

    // Get the first serving (usually per 100g)
    const servings = food.servings?.serving;
    const serving = Array.isArray(servings) ? servings[0] : servings;

    const product: ProductData = {
      id: foodId,
      barcode: barcode,
      name: food.food_name || "Unknown Product",
      brand: food.brand_name || undefined,
      serving: {
        size: parseFloat(serving?.metric_serving_amount || "100"),
        unit: serving?.metric_serving_unit || "g",
      },
      calories: parseFloat(serving?.calories || "0"),
      protein: parseFloat(serving?.protein || "0"),
      carbohydrates: parseFloat(serving?.carbohydrate || "0"),
      fat: parseFloat(serving?.fat || "0"),
      fiber: serving?.fiber ? parseFloat(serving.fiber) : undefined,
      sodium: serving?.sodium ? parseFloat(serving.sodium) : undefined,
      sugars: serving?.sugar ? parseFloat(serving.sugar) : undefined,
      saturatedFat: serving?.saturated_fat ? parseFloat(serving.saturated_fat) : undefined,
      nutriGrade: undefined,
      imageUrl: food.food_images?.food_image?.image_url || undefined,
      verified: true,
    };

    console.log("Mapped FatSecret food details:", product);
    return product;
    
  } catch (error) {
    console.error("FatSecret food details error:", error);
    throw error;
  }
}

// Additional utility functions
export function clearFatSecretTokenCache(): void {
  fatSecretToken = null;
  console.log('FatSecret token cache cleared');
}

export function getFatSecretApiStatus(): { hasToken: boolean; expiresAt: number | null; hasBarcode: boolean } {
  return {
    hasToken: !!fatSecretToken,
    expiresAt: fatSecretToken?.expires_at || null,
    hasBarcode: process.env.FATSECRET_PREMIER_ACCESS === 'true'
  };
}
