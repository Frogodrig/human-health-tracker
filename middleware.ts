// Place this in the root directory
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: [
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhooks/clerk", // Clerk webhook endpoint
    "/api/products/(.*)", // Allow public product lookups for testing
  ],

  // Routes that should be ignored by the authentication middleware
  ignoredRoutes: [
    "/api/webhooks/clerk", // Webhook endpoint
    "/((?!api|trpc))(_next.*|.+.[w]+$)", // Next.js internals and static files
  ],

  // Custom redirect URLs
  afterAuth(auth, req) {
    // Handle users who aren't authenticated
    if (!auth.userId && !auth.isPublicRoute) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return Response.redirect(signInUrl);
    }

    // Redirect logged in users away from auth pages
    if (auth.userId && req.nextUrl.pathname.startsWith("/sign-")) {
      return Response.redirect(new URL("/dashboard", req.url));
    }
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
