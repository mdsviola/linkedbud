"use client";

import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useContext, useState, useEffect } from "react";
import { AdminContext } from "@/contexts/admin-context";

interface AdminLinkProps {
  userEmail: string;
}

export function AdminLink({ userEmail }: AdminLinkProps) {
  const [mounted, setMounted] = useState(false);

  // Safely use the admin context, with fallback for when AdminProvider is not available
  const adminContext = useContext(AdminContext);

  // Only render on client side to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // If not mounted or AdminProvider is not available, don't render anything
  if (!mounted || !adminContext) {
    return null;
  }

  const { isAdmin, loading } = adminContext;

  if (loading || !isAdmin) {
    return null;
  }

  return (
    <Button variant="outline" asChild>
      <a href="/admin">
        <Settings className="h-4 w-4 mr-2" />
        Admin
      </a>
    </Button>
  );
}
