import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    // Get API key from environment
    const CLARIFAI_API_KEY = process.env.CLARIFAI_API_KEY;
    const CLARIFAI_MODEL_ID =
      process.env.CLARIFAI_MODEL_ID || "food-item-recognition";
    const CLARIFAI_MODEL_VERSION_ID =
      process.env.CLARIFAI_MODEL_VERSION_ID ||
      "1d5fd481e0cf4826aa72ec3ff049e044";
    const CLARIFAI_USER_ID = process.env.CLARIFAI_USER_ID || "clarifai";
    const CLARIFAI_APP_ID = process.env.CLARIFAI_APP_ID || "main";
    const CLARIFAI_API_URL = `https://api.clarifai.com/v2/models/${CLARIFAI_MODEL_ID}/versions/${CLARIFAI_MODEL_VERSION_ID}/outputs`;

    if (!CLARIFAI_API_KEY) {
      console.error("Clarifai API key not found in environment variables");
      console.error(
        "Available environment variables:",
        Object.keys(process.env).filter((key) => key.includes("CLARIFAI"))
      );
      return NextResponse.json(
        {
          error:
            "Clarifai API key not configured. Please check your .env.local file.",
        },
        { status: 500 }
      );
    }

    // Call Clarifai API
    const response = await fetch(CLARIFAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Key ${CLARIFAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_app_id: {
          user_id: CLARIFAI_USER_ID,
          app_id: CLARIFAI_APP_ID,
        },
        inputs: [
          {
            data: {
              image: { base64: image },
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Clarifai API error:", response.status, errorText);
      return NextResponse.json(
        { error: `Food recognition API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Parse Clarifai response
    const concepts = data.outputs?.[0]?.data?.concepts || [];
    const results = concepts.map((c: { name: string; value: number }) => ({
      name: c.name,
      confidence: c.value,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Food recognition error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
