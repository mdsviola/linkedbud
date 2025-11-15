"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Building2 } from "lucide-react";

interface Organization {
  id: number;
  linkedin_org_id: string;
  org_name: string;
  org_vanity_name: string | null;
}

interface PostContextSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  organizations: Organization[];
  className?: string;
}

/**
 * Shared component for selecting between Personal and Organization contexts
 * for viewing posts. Displays tabs for "Personal" and each organization.
 */
export function PostContextSelector({
  value,
  onValueChange,
  organizations,
  className = "",
}: PostContextSelectorProps) {
  return (
    <Tabs value={value} onValueChange={onValueChange} className={`w-full ${className}`}>
      <TabsList className="flex flex-col h-auto sm:inline-flex sm:h-10 sm:flex-row flex-wrap">
        <TabsTrigger value="personal" className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-center">
          <User className="h-4 w-4" />
          Personal
        </TabsTrigger>
        {organizations.map((org) => (
          <TabsTrigger
            key={org.linkedin_org_id}
            value={org.linkedin_org_id}
            className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-center"
          >
            <Building2 className="h-4 w-4" />
            {org.org_name || org.linkedin_org_id}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
