// Fixed with proper auth import
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { getCurrentUser, updateUserProfile, ensureUserExists } from "@/lib/auth";
import type {
  APIErrorResponse,
  APISuccessResponse,
  UserProfile,
} from "@/types";

const prisma = new PrismaClient();

// GET /api/users/profile - Get current user profile
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      const errorResponse: APIErrorResponse = {
        error: "Unauthorized",
        code: "UNAUTHORIZED",
        status: 401,
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Ensure user exists in database (creates if doesn't exist)
    const user = await ensureUserExists();

    if (!user) {
      const errorResponse: APIErrorResponse = {
        error: "Failed to create or retrieve user",
        code: "USER_CREATION_FAILED",
        status: 500,
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const successResponse: APISuccessResponse<UserProfile> = {
      data: {
        ...user,
        name: user.name || "User",
        avatar: user.avatar || undefined,
        dateOfBirth: user.dateOfBirth || undefined,
        gender: user.gender || undefined,
        height: user.height || undefined,
        weight: user.weight || undefined,
        dietaryGoals: user.dietaryGoals as
          | "WEIGHT_LOSS"
          | "MUSCLE_GAIN"
          | "MAINTENANCE",
        goals: {
          dailyCalories: 2000,
          dailyProtein: 150,
          dailyCarbs: 250,
          dailyFat: 67,
          waterIntake: 2000,
        },
      },
      message: "Profile retrieved successfully",
    };

    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("Error getting user profile:", error);

    const errorResponse: APIErrorResponse = {
      error: "Internal server error",
      code: "INTERNAL_ERROR",
      status: 500,
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// POST /api/users/profile - Create/Update user profile
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      const errorResponse: APIErrorResponse = {
        error: "Unauthorized",
        code: "UNAUTHORIZED",
        status: 401,
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      gender,
      height,
      weight,
      activityLevel,
      dietaryGoals,
      dateOfBirth,
    } = body;

    // Validate required fields
    if (
      !name ||
      !gender ||
      !height ||
      !weight ||
      !activityLevel ||
      !dietaryGoals
    ) {
      const errorResponse: APIErrorResponse = {
        error: "Missing required fields",
        code: "VALIDATION_ERROR",
        status: 400,
        details: {
          required: [
            "name",
            "gender",
            "height",
            "weight",
            "activityLevel",
            "dietaryGoals",
          ],
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Calculate basic nutritional goals
    const { dailyCalories, dailyProtein, dailyCarbs, dailyFat } =
      calculateNutritionalGoals({
        weight,
        height,
        gender,
        activityLevel,
        dietaryGoals,
        age: dateOfBirth
          ? new Date().getFullYear() - new Date(dateOfBirth).getFullYear()
          : 25,
      });

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { clerkId: userId },
      data: {
        name,
        gender,
        height,
        weight,
        activityLevel,
        dietaryGoals,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        updatedAt: new Date(),
      },
    });

    // Create or update goals
    await prisma.goal.upsert({
      where: {
        userId_type: {
          userId: updatedUser.id,
          type: "DAILY_CALORIES",
        },
      },
      update: {
        targetCalories: dailyCalories,
        targetProtein: dailyProtein,
        targetCarbohydrates: dailyCarbs,
        targetFat: dailyFat,
        updatedAt: new Date(),
      },
      create: {
        userId: updatedUser.id,
        type: "DAILY_CALORIES",
        targetCalories: dailyCalories,
        targetProtein: dailyProtein,
        targetCarbohydrates: dailyCarbs,
        targetFat: dailyFat,
        isActive: true,
      },
    });

    const successResponse: APISuccessResponse<UserProfile> = {
      data: {
        ...updatedUser,
        name: updatedUser.name || "User",
        avatar: updatedUser.avatar || undefined,
        dateOfBirth: updatedUser.dateOfBirth || undefined,
        gender: updatedUser.gender || undefined,
        height: updatedUser.height || undefined,
        weight: updatedUser.weight || undefined,
        dietaryGoals: updatedUser.dietaryGoals as
          | "WEIGHT_LOSS"
          | "MUSCLE_GAIN"
          | "MAINTENANCE",
        goals: {
          dailyCalories: 2000,
          dailyProtein: 150,
          dailyCarbs: 250,
          dailyFat: 67,
          waterIntake: 2000,
        },
      },
      message: "Profile updated successfully",
    };

    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("Error updating user profile:", error);

    const errorResponse: APIErrorResponse = {
      error: "Failed to update profile",
      code: "UPDATE_ERROR",
      status: 500,
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Helper function to calculate nutritional goals
function calculateNutritionalGoals(params: {
  weight: number;
  height: number;
  gender: string;
  activityLevel: string;
  dietaryGoals: string;
  age: number;
}) {
  const { weight, height, gender, activityLevel, dietaryGoals, age } = params;

  // Calculate BMR using Mifflin-St Jeor Equation
  let bmr: number;
  if (gender === "MALE") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // Activity multipliers
  const activityMultipliers = {
    SEDENTARY: 1.2,
    LIGHT: 1.375,
    MODERATE: 1.55,
    ACTIVE: 1.725,
    VERY_ACTIVE: 1.9,
  };

  const tdee =
    bmr *
    activityMultipliers[activityLevel as keyof typeof activityMultipliers];

  // Goal adjustments
  const goalAdjustments = {
    WEIGHT_LOSS: -500,
    MAINTENANCE: 0,
    MUSCLE_GAIN: 300,
  };

  const dailyCalories = Math.round(
    tdee + goalAdjustments[dietaryGoals as keyof typeof goalAdjustments]
  );

  // Macro splits based on goals
  const macroSplits = {
    WEIGHT_LOSS: { protein: 0.3, carbs: 0.35, fat: 0.35 },
    MAINTENANCE: { protein: 0.25, carbs: 0.45, fat: 0.3 },
    MUSCLE_GAIN: { protein: 0.3, carbs: 0.5, fat: 0.2 },
  };

  const split = macroSplits[dietaryGoals as keyof typeof macroSplits];

  return {
    dailyCalories,
    dailyProtein: Math.round((dailyCalories * split.protein) / 4),
    dailyCarbs: Math.round((dailyCalories * split.carbs) / 4),
    dailyFat: Math.round((dailyCalories * split.fat) / 9),
  };
}
