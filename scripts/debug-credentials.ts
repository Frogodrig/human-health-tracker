// Debug script to check credentials format
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

async function debugCredentials() {
  console.log("🔍 Debugging FatSecret Credentials");
  console.log("=".repeat(50));
  
  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;
  
  console.log("Client ID length:", clientId?.length || 0);
  console.log("Client ID first 4 chars:", clientId?.substring(0, 4) || "NONE");
  console.log("Client ID last 4 chars:", clientId?.substring(clientId.length - 4) || "NONE");
  console.log("Client Secret length:", clientSecret?.length || 0);
  console.log("Client Secret first 4 chars:", clientSecret?.substring(0, 4) || "NONE");
  
  // Test the base64 encoding that's sent to FatSecret
  if (clientId && clientSecret) {
    const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    console.log("Base64 encoded length:", encoded.length);
    console.log("Base64 first 10 chars:", encoded.substring(0, 10));
  }
  
  // Test the actual HTTP request
  console.log("\n🌐 Testing OAuth Token Request...");
  
  const formData = new URLSearchParams();
  formData.append("grant_type", "client_credentials");
  formData.append("scope", "basic");

  try {
    const response = await fetch("https://oauth.fatsecret.com/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: formData.toString(),
    });

    console.log("Response Status:", response.status);
    console.log("Response Headers:", Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log("Response Body:", responseText);
    
    if (response.ok) {
      console.log("✅ SUCCESS: Credentials are valid!");
    } else {
      console.log("❌ FAILED: Check your credentials in FatSecret dashboard");
    }
    
  } catch (error) {
    console.error("Network Error:", error);
  }
}

debugCredentials();