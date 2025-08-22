// Fixed with proper imports
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@/lib/generated/prisma";
import type { APIErrorResponse, APISuccessResponse } from "@/types";
import type {
  AchievementsResponse,
  AchievementWithProgress,
} from "@/types/dashboard";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        achievements: {
          include: {
            achievement: true,
          },
          orderBy: { unlockedAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all available achievements
    const allAchievements = await prisma.achievement.findMany({
      orderBy: { category: "asc" },
    });

    // Map user achievements
    const userAchievementIds = user.achievements.map((ua) => ua.achievementId);
    const achievementsWithStatus: AchievementWithProgress[] =
      allAchievements.map((achievement) => ({
        ...achievement,
        category: achievement.category as
          | "STREAK"
          | "MILESTONE"
          | "NUTRITION"
          | "SCANNING",
        unlocked: userAchievementIds.includes(achievement.id),
        unlockedAt: user.achievements.find(
          (ua) => ua.achievementId === achievement.id
        )?.unlockedAt,
        progress:
          user.achievements.find((ua) => ua.achievementId === achievement.id)
            ?.progress || 0,
        condition: {
          type: "meals_logged" as const,
          target: 1,
          current: 0,
        },
      }));

    const successResponse: APISuccessResponse<AchievementsResponse> = {
      data: {
        achievements: achievementsWithStatus,
        totalUnlocked: achievementsWithStatus.filter((a) => a.unlocked).length,
        totalAvailable: achievementsWithStatus.length,
        categories: {
          STREAK: { total: 0, unlocked: 0 },
          MILESTONE: { total: 0, unlocked: 0 },
          NUTRITION: { total: 0, unlocked: 0 },
          SCANNING: { total: 0, unlocked: 0 },
        },
      },
      message: "Achievements retrieved successfully",
    };

    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("Error getting user achievements:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
