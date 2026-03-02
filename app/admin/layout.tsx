import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminLayoutClient } from "./_components/admin-layout-client";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/admin/unauthorized");

  const client = await clerkClient();
  const memberships = await client.users.getOrganizationMembershipList({
    userId,
  });

  const isOrgMember = memberships.data.some(
    (m) => m.organization.id === process.env.ADMIN_ORG_ID,
  );

  if (!isOrgMember) {
    redirect("/admin/unauthorized");
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
