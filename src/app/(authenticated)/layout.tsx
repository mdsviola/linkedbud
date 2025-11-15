import { AuthenticatedLayoutClient } from "./authenticated-layout-client";
import { AdminProvider } from "@/contexts/admin-context";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin-auth";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (user) {
    const userIsAdmin = await isAdmin(user.id);
    if (userIsAdmin) {
      redirect("/admin");
    }
  }

  return (
    <AdminProvider>
      <AuthenticatedLayoutClient>{children}</AuthenticatedLayoutClient>
    </AdminProvider>
  );
}
