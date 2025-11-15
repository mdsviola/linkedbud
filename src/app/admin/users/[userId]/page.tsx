import { requireAdmin } from "@/lib/admin-auth";
import { UserDetailClient } from "./user-detail-client";

interface UserPageProps {
  params: { userId: string };
}

export default async function UserPage({ params }: UserPageProps) {
  await requireAdmin();

  return <UserDetailClient userId={params.userId} />;
}

// Force dynamic rendering to always fetch fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;
