// Comprehensive test script for FatSecret API
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import {
  getFatSecretToken,
  fatSecretBarcodeLookup,
  fatSecretSearch,
  getFatSecretApiStatus,
  clearFatSecretTokenCache,
} from "../lib/api/fatsecret";

// Test configuration
const TEST_CONFIG = {
  barcodes: [
    "009800800049", // Known test barcode
    "012000313851", // Coca-Cola
    "028400064057", // Cheerios
    "041196912524", // Invalid/test barcode
  ],
  searchTerms: [
    "apple",
    "chicken breast",
    "brown rice",
    "almonds",
  ],
};

// Utility functions
function formatNutrition(product: any) {
  return {
    Calories: `${product.calories || 0}`,
    Protein: `${product.protein || 0}g`,
    Carbs: `${product.carbohydrates || 0}g`,
    Fat: `${product.fat || 0}g`,
    Fiber: product.fiber ? `${product.fiber}g` : "N/A",
    Sodium: product.sodium ? `${product.sodium}mg` : "N/A",
  };
}

function printTestHeader(title: string, step: number) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${step}. ${title}`);
  console.log('='.repeat(60));
}

function printSuccess(message: string) {
  console.log(`✅ ${message}`);
}

function printError(message: string) {
  console.log(`❌ ${message}`);
}

function printWarning(message: string) {
  console.log(`⚠️  ${message}`);
}

function printInfo(message: string) {
  console.log(`ℹ️  ${message}`);
}

async function testEnvironmentSetup() {
  printTestHeader("Environment Setup Validation", 1);
  
  const requiredEnvVars = {
    'FATSECRET_CLIENT_ID': process.env.FATSECRET_CLIENT_ID,
    'FATSECRET_CLIENT_SECRET': process.env.FATSECRET_CLIENT_SECRET,
    'FATSECRET_PREMIER_ACCESS': process.env.FATSECRET_PREMIER_ACCESS,
  };

  let allValid = true;
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      printError(`Missing environment variable: ${key}`);
      allValid = false;
    } else {
      const displayValue = key.includes('SECRET') ? '[HIDDEN]' : value;
      printSuccess(`${key}: ${displayValue}`);
    }
  }

  const apiStatus = getFatSecretApiStatus();
  printInfo(`API Status: Token cached: ${apiStatus.hasToken}, Barcode access: ${apiStatus.hasBarcode}`);
  
  if (apiStatus.hasToken && apiStatus.expiresAt) {
    const timeLeft = Math.max(0, apiStatus.expiresAt - Date.now());
    printInfo(`Token expires in: ${Math.floor(timeLeft / 1000 / 60)} minutes`);
  }

  return allValid;
}

async function testTokenAcquisition() {
  printTestHeader("OAuth 2.0 Token Acquisition", 2);
  
  try {
    // Clear any existing token to test fresh acquisition
    clearFatSecretTokenCache();
    printInfo("Cleared token cache");
    
    const startTime = Date.now();
    const token = await getFatSecretToken();
    const duration = Date.now() - startTime;
    
    printSuccess(`Token acquired in ${duration}ms`);
    printInfo(`Token type: Bearer`);
    printInfo(`Token length: ${token.length} characters`);
    
    // Test token caching
    const cachedStartTime = Date.now();
    const cachedToken = await getFatSecretToken();
    const cachedDuration = Date.now() - cachedStartTime;
    
    if (token === cachedToken && cachedDuration < 100) {
      printSuccess(`Token caching working (${cachedDuration}ms for cached retrieval)`);
    } else {
      printWarning("Token caching may not be working properly");
    }
    
    return token;
  } catch (error) {
    printError(`Token acquisition failed: ${error instanceof Error ? error.message : error}`);
    throw error;
  }
}

async function testBarcodeScanning() {
  printTestHeader("Barcode Scanning Tests", 3);
  
  const apiStatus = getFatSecretApiStatus();
  if (!apiStatus.hasBarcode) {
    printWarning("Barcode scanning requires Premier access - set FATSECRET_PREMIER_ACCESS=true");
    printInfo("Skipping barcode tests...");
    return;
  }
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const barcode of TEST_CONFIG.barcodes) {
    try {
      printInfo(`Testing barcode: ${barcode}`);
      
      const startTime = Date.now();
      const product = await fatSecretBarcodeLookup(barcode);
      const duration = Date.now() - startTime;
      
      if (product) {
        printSuccess(`Product found in ${duration}ms: ${product.name}`);
        const nutrition = formatNutrition(product);
        Object.entries(nutrition).forEach(([key, value]) => {
          console.log(`    ${key}: ${value}`);
        });
        successCount++;
      } else {
        printInfo(`No product found for barcode ${barcode} (${duration}ms)`);
        failureCount++;
      }
    } catch (error) {
      printError(`Barcode ${barcode} failed: ${error instanceof Error ? error.message : error}`);
      failureCount++;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  printInfo(`Barcode test summary: ${successCount} successful, ${failureCount} failed/not found`);
}

async function testFoodSearch() {
  printTestHeader("Food Search Tests", 4);
  
  let totalResults = 0;
  
  for (const searchTerm of TEST_CONFIG.searchTerms) {
    try {
      printInfo(`Searching for: "${searchTerm}"`);
      
      const startTime = Date.now();
      const products = await fatSecretSearch(searchTerm, 5); // Limit to 5 results for testing
      const duration = Date.now() - startTime;
      
      if (products.length > 0) {
        printSuccess(`Found ${products.length} products in ${duration}ms`);
        products.forEach((product, index) => {
          console.log(`    ${index + 1}. ${product.name}${product.brand ? ` (${product.brand})` : ''}`);
          const nutrition = formatNutrition(product);
          console.log(`       Nutrition: ${nutrition.Calories} cal, ${nutrition.Protein}, ${nutrition.Carbs}, ${nutrition.Fat}`);
        });
        totalResults += products.length;
      } else {
        printWarning(`No products found for "${searchTerm}" (${duration}ms)`);
      }
    } catch (error) {
      printError(`Search for "${searchTerm}" failed: ${error instanceof Error ? error.message : error}`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  printInfo(`Search test summary: ${totalResults} total results across all searches`);
}

async function runComprehensiveTests() {
  console.log("🧪 Starting Comprehensive FatSecret API Test Suite\n");
  console.log(`Test started at: ${new Date().toISOString()}`);
  
  const startTime = Date.now();
  let testsPassed = 0;
  let testsFailed = 0;
  
  try {
    // Test 1: Environment Setup
    const envValid = await testEnvironmentSetup();
    if (envValid) testsPassed++; else testsFailed++;
    
    if (!envValid) {
      printError("Environment setup failed. Please configure required environment variables.");
      printInfo("\n💡 Required environment variables:");
      printInfo("   FATSECRET_CLIENT_ID=your_client_id");
      printInfo("   FATSECRET_CLIENT_SECRET=your_client_secret");
      printInfo("   FATSECRET_PREMIER_ACCESS=true (optional, for barcode scanning)");
      return;
    }
    
    // Test 2: Token Acquisition
    try {
      await testTokenAcquisition();
      testsPassed++;
    } catch (error) {
      testsFailed++;
      printError("Skipping remaining tests due to authentication failure");
      return;
    }
    
    // Test 3: Barcode Scanning
    try {
      await testBarcodeScanning();
      testsPassed++;
    } catch (error) {
      testsFailed++;
      printError(`Barcode scanning tests failed: ${error instanceof Error ? error.message : error}`);
    }
    
    // Test 4: Food Search
    try {
      await testFoodSearch();
      testsPassed++;
    } catch (error) {
      testsFailed++;
      printError(`Food search tests failed: ${error instanceof Error ? error.message : error}`);
    }
    
  } catch (error) {
    printError(`Critical test failure: ${error instanceof Error ? error.message : error}`);
    console.error("Full error:", error);
  } finally {
    const duration = Date.now() - startTime;
    
    printTestHeader("Test Summary", 5);
    console.log(`Total duration: ${duration}ms`);
    console.log(`Tests passed: ${testsPassed}`);
    console.log(`Tests failed: ${testsFailed}`);
    
    if (testsFailed === 0) {
      console.log("\n🎉 All FatSecret API tests passed!");
    } else {
      console.log(`\n⚠️  ${testsFailed} test(s) failed. Check the output above for details.`);
    }
    
    console.log(`\nTest completed at: ${new Date().toISOString()}`);
  }
}

// Run the comprehensive test suite
runComprehensiveTests();
