"use client";

import { Users, BarChart3, MessageSquare, ClipboardList } from "lucide-react";
import { SharedNav } from "@/components/shared-nav";

export function AdminNav() {
  const navigation = [
    { name: "Dashboard", href: "/admin", icon: BarChart3 },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Waitlist", href: "/admin/waitlist", icon: ClipboardList },
    { name: "Feedback", href: "/admin/feedback", icon: MessageSquare },
  ];

  return (
    <SharedNav
      logoText="linkedbud"
      logoHref="/admin"
      navigation={navigation}
      settingsHref="/admin/settings"
    />
  );
}
