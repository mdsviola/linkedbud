import { PageWrapper } from "@/components/ui/page-wrapper";
import { AuthenticatedNotFoundContent } from "@/components/not-found-content";

export default function AuthenticatedNotFound() {
  return (
    <PageWrapper maxWidth="4xl" padding="lg">
      <AuthenticatedNotFoundContent />
    </PageWrapper>
  );
}
