import { requireAdmin } from "@/lib/admin-auth";
import { FeedbackClient } from "./feedback-client";
import { PageTitle } from "@/components/ui/page-title";
import { PageDescription } from "@/components/ui/page-description";

export default async function FeedbackPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <PageTitle>Feedback Submissions</PageTitle>
        <PageDescription>
          View and manage user feedback submissions
        </PageDescription>
      </div>
      <FeedbackClient />
    </div>
  );
}

