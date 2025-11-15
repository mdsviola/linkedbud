import { requireAdmin } from "@/lib/admin-auth";
import { AdminNav } from "./admin-nav";
import { PageWrapper } from "@/components/ui/page-wrapper";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="pt-24">
        <PageWrapper>{children}</PageWrapper>
      </main>
    </div>
  );
}
