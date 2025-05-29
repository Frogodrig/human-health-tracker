import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@/lib/generated/prisma";
import type { APIErrorResponse, APISuccessResponse } from "@/types";

const prisma = new PrismaClient();

// GET /api/users - Get all users (admin only)
export async function GET(request: NextRequest) {
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

    // Check if the user is an admin (you would implement this based on your requirements)
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

    // For now, users can only access their own data
    const successResponse: APISuccessResponse = {
      data: [currentUser],
      message: "User data retrieved successfully",
    };

    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("Error fetching users:", error);

    const errorResponse: APIErrorResponse = {
      error: "Internal server error",
      code: "INTERNAL_ERROR",
      status: 500,
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// POST /api/users - Create a new user (handled by Clerk webhook)
export async function POST(request: NextRequest) {
  const errorResponse: APIErrorResponse = {
    error: "User creation is handled through Clerk authentication",
    code: "METHOD_NOT_ALLOWED",
    status: 405,
  };
  return NextResponse.json(errorResponse, { status: 405 });
}

// DELETE /api/users - Delete current user
export async function DELETE(request: NextRequest) {
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

    // Find and delete user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      const errorResponse: APIErrorResponse = {
        error: "User not found",
        code: "USER_NOT_FOUND",
        status: 404,
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Delete user and all related data (cascade delete is set in schema)
    await prisma.user.delete({
      where: { id: user.id },
    });

    const successResponse: APISuccessResponse = {
      data: { message: "User deleted successfully" },
      message: "Account deleted",
    };

    return NextResponse.json(successResponse);
  } catch (error) {
    console.error("Error deleting user:", error);

    const errorResponse: APIErrorResponse = {
      error: "Failed to delete user",
      code: "DELETE_ERROR",
      status: 500,
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
