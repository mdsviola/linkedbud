import { requireAdmin } from "@/lib/admin-auth";
import { UsersClient } from "./users-client";
import { PageTitle } from "@/components/ui/page-title";
import { PageDescription } from "@/components/ui/page-description";

export default async function UsersPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <PageTitle>User Management</PageTitle>
        <PageDescription>
          Manage user accounts, subscriptions, and usage
        </PageDescription>
      </div>
      <UsersClient />
    </div>
  );
}
