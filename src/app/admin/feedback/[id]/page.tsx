import { requireAdmin } from "@/lib/admin-auth";
import { FeedbackDetailClient } from "./feedback-detail-client";

interface FeedbackDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function FeedbackDetailPage({
  params,
}: FeedbackDetailPageProps) {
  await requireAdmin();
  const { id } = await params;

  return <FeedbackDetailClient feedbackId={id} />;
}

// Force dynamic rendering to always fetch fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

