import { requireAdmin } from "@/lib/admin-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { PageDescription } from "@/components/ui/page-description";

export default async function AdminSettingsPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <PageTitle>Admin Settings</PageTitle>
        <PageDescription>
          Configure system settings and preferences
        </PageDescription>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Admin settings will be available in a future update
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            This section will allow you to configure system-wide settings,
            manage API keys, and adjust application behavior.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
