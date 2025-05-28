// API for daily intake management
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { PrismaClient } from "@prisma/client";
import type { APISuccessResponse } from "@/types";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();

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

    const responseData = {
      dailyIntake: dailyIntake || {
        date: targetDate,
        totalCalories: 0,
        totalProtein: 0,
        totalCarbohydrates: 0,
        totalFat: 0,
        entries: [],
      },
      goals: activeGoal
        ? {
            calories: activeGoal.targetCalories,
            protein: activeGoal.targetProtein,
            carbohydrates: activeGoal.targetCarbohydrates,
            fat: activeGoal.targetFat,
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

    const successResponse: APISuccessResponse = {
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
