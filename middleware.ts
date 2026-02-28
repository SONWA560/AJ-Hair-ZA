import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    // Step 1: must be signed in (redirects to /sign-in if not)
    await auth.protect();

    // Step 2: must be a member of the designated admin organisation
    // We check actual membership (not active session org) so the user
    // doesn't need to manually "switch" to the org in their session.
    const { userId } = await auth();
    const client = await clerkClient();
    const memberships = await client.users.getOrganizationMembershipList({
      userId: userId!,
    });

    const isOrgMember = memberships.data.some(
      (m) => m.organization.id === process.env.ADMIN_ORG_ID,
    );

    if (!isOrgMember) {
      return NextResponse.redirect(new URL("/admin/unauthorized", req.url));
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
