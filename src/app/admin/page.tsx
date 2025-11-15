import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { PageDescription } from "@/components/ui/page-description";
import { Users, TrendingUp } from "lucide-react";

export default async function AdminDashboard() {
  await requireAdmin();

  // Fetch dashboard statistics
  const [{ count: usersCount }, { count: postsCount }] = await Promise.all([
    supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "PUBLISHED"),
  ]);

  const stats = [
    {
      title: "Users",
      value: usersCount || 0,
      description: "Registered users",
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Published Posts",
      value: postsCount || 0,
      description: "Total published posts",
      icon: TrendingUp,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <PageTitle>Admin Dashboard</PageTitle>
        <PageDescription>Manage your Linkedbud application</PageDescription>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">Coming Soon</p>
              <p className="text-xs text-gray-400 mt-2">
                Quick actions will be available soon
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system health and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">Coming Soon</p>
              <p className="text-xs text-gray-400 mt-2">
                System status monitoring will be available soon
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
