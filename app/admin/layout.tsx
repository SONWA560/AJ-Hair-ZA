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
  const [memberships, user] = await Promise.all([
    client.users.getOrganizationMembershipList({ userId }),
    client.users.getUser(userId),
  ]);

  const isOrgMember = memberships.data.some(
    (m) => m.organization.id === process.env.ADMIN_ORG_ID,
  );

  const adminEmails = (process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const isAdminEmail = user.emailAddresses.some((e) =>
    adminEmails.includes(e.emailAddress.toLowerCase()),
  );

  if (!isOrgMember && !isAdminEmail) {
    redirect("/admin/unauthorized");
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
