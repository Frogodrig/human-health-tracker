// Fixed with proper imports
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@/lib/generated/prisma";
import type { APISuccessResponse, UserGoals } from "@/types";

const prisma = new PrismaClient();

// GET /api/users/goals - Get user goals
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        goals: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const successResponse: APISuccessResponse<UserGoals> = {
      data: {
        dailyCalories: user.goals[0]?.targetCalories || 2000,
        dailyProtein: user.goals[0]?.targetProtein || 150,
        dailyCarbs: user.goals[0]?.targetCarbohydrates || 250,
        dailyFat: user.goals[0]?.targetFat || 67,
        waterIntake: 2000, // Default water goal since it's not in the database
      },
      message: "Goals retrieved successfully",
    };

    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("Error getting user goals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/users/goals - Update user goals
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { targetCalories, targetProtein, targetCarbohydrates, targetFat } =
      body;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update or create daily calories goal
    const updatedGoal = await prisma.goal.upsert({
      where: {
        userId_type: {
          userId: user.id,
          type: "DAILY_CALORIES",
        },
      },
      update: {
        targetCalories,
        targetProtein,
        targetCarbohydrates,
        targetFat,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        type: "DAILY_CALORIES",
        targetCalories,
        targetProtein,
        targetCarbohydrates,
        targetFat,
        isActive: true,
      },
    });

    const successResponse: APISuccessResponse<UserGoals> = {
      data: {
        dailyCalories: updatedGoal.targetCalories || 2000,
        dailyProtein: updatedGoal.targetProtein || 150,
        dailyCarbs: updatedGoal.targetCarbohydrates || 250,
        dailyFat: updatedGoal.targetFat || 67,
        waterIntake: 2000, // Default water goal since it's not in the database
      },
      message: "Goals updated successfully",
    };

    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("Error updating user goals:", error);
    return NextResponse.json(
      { error: "Failed to update goals" },
      { status: 500 }
    );
  }
}
