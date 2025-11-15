import { requireAdmin } from "@/lib/admin-auth";
import { WaitlistClient } from "./waitlist-client";
import { PageTitle } from "@/components/ui/page-title";
import { PageDescription } from "@/components/ui/page-description";

export default async function WaitlistPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <PageTitle>Waitlist</PageTitle>
        <PageDescription>
          View and manage the waitlist of people interested in the platform
        </PageDescription>
      </div>
      <WaitlistClient />
    </div>
  );
}

