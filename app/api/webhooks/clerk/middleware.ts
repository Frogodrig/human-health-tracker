// Protect routes with Clerk
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Routes that don't require authentication
  publicRoutes: [
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhooks/clerk",
    "/api/products/(.*)", // Allow product lookups without auth for testing
  ],

  // Routes that require authentication
  ignoredRoutes: [
    "/api/webhooks/clerk", // Webhook endpoint
  ],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
