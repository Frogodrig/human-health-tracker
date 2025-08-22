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

    // Validate that at least some data is provided
    if (!name && !gender && !height && !weight && !activityLevel && !dietaryGoals && !dateOfBirth) {
      const errorResponse: APIErrorResponse = {
        error: "No data provided for update",
        code: "VALIDATION_ERROR",
        status: 400,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Get current user for existing data
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!currentUser) {
      const errorResponse: APIErrorResponse = {
        error: "User not found",
        code: "USER_NOT_FOUND",
        status: 404,
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Prepare update data, filtering out undefined values
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (gender !== undefined) updateData.gender = gender;
    if (height !== undefined) updateData.height = Number(height);
    if (weight !== undefined) updateData.weight = Number(weight);
    if (activityLevel !== undefined) updateData.activityLevel = activityLevel;
    if (dietaryGoals !== undefined) updateData.dietaryGoals = dietaryGoals;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    updateData.updatedAt = new Date();

    // Calculate nutritional goals only if we have all required data
    let goalUpdate = null;
    const finalWeight = weight !== undefined ? Number(weight) : currentUser.weight;
    const finalHeight = height !== undefined ? Number(height) : currentUser.height;
    const finalGender = gender !== undefined ? gender : currentUser.gender;
    const finalActivityLevel = activityLevel !== undefined ? activityLevel : currentUser.activityLevel;
    const finalDietaryGoals = dietaryGoals !== undefined ? dietaryGoals : currentUser.dietaryGoals;
    const finalDateOfBirth = dateOfBirth !== undefined 
      ? (dateOfBirth ? new Date(dateOfBirth) : null)
      : currentUser.dateOfBirth;

    if (finalWeight && finalHeight && finalGender && finalActivityLevel && finalDietaryGoals) {
      const { dailyCalories, dailyProtein, dailyCarbs, dailyFat } =
        calculateNutritionalGoals({
          weight: finalWeight,
          height: finalHeight,
          gender: finalGender,
          activityLevel: finalActivityLevel,
          dietaryGoals: finalDietaryGoals,
          age: finalDateOfBirth
            ? new Date().getFullYear() - finalDateOfBirth.getFullYear()
            : 25,
        });

      goalUpdate = {
        targetCalories: dailyCalories,
        targetProtein: dailyProtein,
        targetCarbohydrates: dailyCarbs,
        targetFat: dailyFat,
        updatedAt: new Date(),
      };
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { clerkId: userId },
      data: updateData,
    });

    // Create or update goals if we have the data
    if (goalUpdate) {
      await prisma.goal.upsert({
        where: {
          userId_type: {
            userId: updatedUser.id,
            type: "DAILY_CALORIES",
          },
        },
        update: goalUpdate,
        create: {
          userId: updatedUser.id,
          type: "DAILY_CALORIES",
          ...goalUpdate,
          isActive: true,
        },
      });
    }

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
