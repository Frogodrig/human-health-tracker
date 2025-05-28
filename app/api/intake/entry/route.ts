// API for adding food entries
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { PrismaClient } from "@prisma/client";
import type { APIErrorResponse, APISuccessResponse } from "@/types";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      brand,
      servingSize,
      servingUnit,
      quantity,
      mealType,
      nutrition,
      productId,
    } = body;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get or create today's daily intake record
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dailyIntake = await prisma.dailyIntake.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
    });

    if (!dailyIntake) {
      dailyIntake = await prisma.dailyIntake.create({
        data: {
          userId: user.id,
          date: today,
          totalCalories: 0,
          totalProtein: 0,
          totalCarbohydrates: 0,
          totalFat: 0,
          totalFiber: 0,
          totalSodium: 0,
          waterIntake: 0,
        },
      });
    }

    // Create the intake entry
    const intakeEntry = await prisma.intakeEntry.create({
      data: {
        dailyIntakeId: dailyIntake.id,
        foodProductId: productId || null,
        quantity,
        unit: servingUnit,
        mealType,
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbohydrates: nutrition.carbohydrates,
        fat: nutrition.fat,
        detectedBy: productId ? "BARCODE" : "MANUAL",
      },
    });

    // Update daily totals
    await prisma.dailyIntake.update({
      where: { id: dailyIntake.id },
      data: {
        totalCalories: dailyIntake.totalCalories + nutrition.calories,
        totalProtein: dailyIntake.totalProtein + nutrition.protein,
        totalCarbohydrates:
          dailyIntake.totalCarbohydrates + nutrition.carbohydrates,
        totalFat: dailyIntake.totalFat + nutrition.fat,
        updatedAt: new Date(),
      },
    });

    const successResponse: APISuccessResponse = {
      data: intakeEntry,
      message: "Food entry added successfully",
    };

    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("Error adding food entry:", error);

    const errorResponse: APIErrorResponse = {
      error: "Failed to add food entry",
      code: "CREATE_ERROR",
      status: 500,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
