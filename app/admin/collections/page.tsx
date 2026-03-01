import { getAdminCollections } from "@/lib/collection-actions";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CollectionsClient } from "./_components/collections-client";

export default async function AdminCollectionsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/admin/unauthorized");

  const collections = await getAdminCollections();

  return <CollectionsClient collections={collections} />;
}
