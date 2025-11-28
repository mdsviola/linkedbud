import { AuthenticatedNotFoundContent } from "@/components/not-found-content";

export default function AdminNotFound() {
  return <AuthenticatedNotFoundContent isAdmin />;
}
