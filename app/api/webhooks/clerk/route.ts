// app/api/webhooks/clerk/route.ts - Sync users to database
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { PrismaClient } from "@prisma/client";
import type { WebhookEvent } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  // Get webhook secret from environment
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET to .env.local");
  }

  // Get headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create new Svix instance with secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify webhook
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occurred", {
      status: 400,
    });
  }

  // Handle different event types
  const { type, data } = evt;

  try {
    switch (type) {
      case "user.created":
        await handleUserCreated(data);
        break;
      case "user.updated":
        await handleUserUpdated(data);
        break;
      case "user.deleted":
        await handleUserDeleted(data);
        break;
      default:
        console.log(`Unhandled webhook event: ${type}`);
    }
  } catch (error) {
    console.error(`Error handling webhook ${type}:`, error);
    return new Response("Error processing webhook", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}

// Helper functions for user management
async function handleUserCreated(userData: any) {
  console.log("Creating user:", userData.id);

  try {
    const user = await prisma.user.create({
      data: {
        clerkId: userData.id,
        email: userData.email_addresses[0]?.email_address || "",
        name:
          `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
          "User",
        avatar: userData.image_url,
        activityLevel: "MODERATE",
        dietaryGoals: "MAINTENANCE",
        createdAt: new Date(userData.created_at),
      },
    });

    console.log("User created successfully:", user.id);
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

async function handleUserUpdated(userData: any) {
  console.log("Updating user:", userData.id);

  try {
    await prisma.user.update({
      where: { clerkId: userData.id },
      data: {
        email: userData.email_addresses[0]?.email_address || "",
        name:
          `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
          "User",
        avatar: userData.image_url,
        updatedAt: new Date(),
      },
    });

    console.log("User updated successfully");
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

async function handleUserDeleted(userData: any) {
  console.log("Deleting user:", userData.id);

  try {
    await prisma.user.delete({
      where: { clerkId: userData.id },
    });

    console.log("User deleted successfully");
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}
