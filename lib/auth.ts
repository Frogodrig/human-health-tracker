// Auth utilities and user management
import { auth, currentUser } from "@clerk/nextjs";
import { PrismaClient } from "@prisma/client";
import type { User } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Get current user from database (synced with Clerk)
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { userId } = auth();

    if (!userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        goals: true,
        achievements: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Ensure user exists in database (create if needed)
 */
export async function ensureUserExists(): Promise<User | null> {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return null;
    }

    // Check if user exists in our database
    let user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
    });

    // Create user if doesn't exist (fallback for webhook failures)
    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          name:
            `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
            "User",
          avatar: clerkUser.imageUrl,
          activityLevel: "MODERATE",
          dietaryGoals: "MAINTENANCE",
        },
      });
    }

    return user;
  } catch (error) {
    console.error("Error ensuring user exists:", error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, data: Partial<User>) {
  try {
    const updatedUser = await prisma.user.update({
      where: { clerkId: userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return updatedUser;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}
