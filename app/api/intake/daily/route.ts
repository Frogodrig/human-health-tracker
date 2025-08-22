// Fixed with proper imports
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@/lib/generated/prisma";
import type { APISuccessResponse } from "@/types";
import { DailyIntakeResponse } from "@/types/dashboard";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    // Default to today if no date provided
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get daily intake with entries
    const dailyIntake = await prisma.dailyIntake.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: targetDate,
        },
      },
      include: {
        entries: {
          include: {
            foodProduct: true,
            customFood: true,
          },
          orderBy: { consumedAt: "asc" },
        },
      },
    });

    // Get user's goals for comparison
    const activeGoal = await prisma.goal.findFirst({
      where: {
        userId: user.id,
        isActive: true,
        type: "DAILY_CALORIES",
      },
    });

    // Transform the data to match the expected type
    const transformedEntries =
      dailyIntake?.entries.map((entry) => ({
        id: entry.id,
        foodProduct: entry.foodProduct
          ? {
              id: entry.foodProduct.id,
              name: entry.foodProduct.name,
              brand: entry.foodProduct.brand || undefined,
              nutriGrade: entry.foodProduct.nutriGrade as
                | "A"
                | "B"
                | "C"
                | "D"
                | undefined,
              imageUrl: entry.foodProduct.imageUrl || undefined,
            }
          : undefined,
        customFood: entry.customFood
          ? {
              id: entry.customFood.id,
              name: entry.customFood.name,
              brand: entry.customFood.brand || undefined,
            }
          : undefined,
        quantity: entry.quantity,
        unit: entry.unit,
        mealType: entry.mealType as "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK",
        consumedAt: entry.consumedAt,
        calories: entry.calories,
        protein: entry.protein,
        carbohydrates: entry.carbohydrates,
        fat: entry.fat,
        detectedBy: entry.detectedBy as "MANUAL" | "BARCODE" | "ML_VISION",
        confidence: entry.confidence || undefined,
      })) || [];

    const responseData: DailyIntakeResponse = {
      dailyIntake: {
        id: dailyIntake?.id,
        date: dailyIntake?.date || targetDate,
        totalCalories: dailyIntake?.totalCalories || 0,
        totalProtein: dailyIntake?.totalProtein || 0,
        totalCarbohydrates: dailyIntake?.totalCarbohydrates || 0,
        totalFat: dailyIntake?.totalFat || 0,
        entries: transformedEntries,
      },
      goals: activeGoal
        ? {
            calories: activeGoal.targetCalories || 2000,
            protein: activeGoal.targetProtein || 150,
            carbohydrates: activeGoal.targetCarbohydrates || 250,
            fat: activeGoal.targetFat || 67,
          }
        : null,
      goalsMet: {
        calories: dailyIntake
          ? dailyIntake.totalCalories >=
            (activeGoal?.targetCalories || 2000) * 0.9
          : false,
        protein: dailyIntake
          ? dailyIntake.totalProtein >= (activeGoal?.targetProtein || 150) * 0.9
          : false,
      },
    };

    const successResponse: APISuccessResponse<DailyIntakeResponse> = {
      data: responseData,
      message: "Daily intake retrieved successfully",
    };

    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("Error getting daily intake:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
