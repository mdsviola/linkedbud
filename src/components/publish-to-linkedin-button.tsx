"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Linkedin, Loader2 } from "lucide-react";
import { LinkedInOrganizationDB } from "@/lib/linkedin";

interface PublishToLinkedInButtonProps {
  postId: number;
  linkedinProfileConnected: boolean;
  linkedinOrganizations: LinkedInOrganizationDB[];
  onPublish: (publishTarget: string) => void;
  isPublishing: boolean;
  publishTarget: string | null;
}

export function PublishToLinkedInButton({
  postId,
  linkedinProfileConnected,
  linkedinOrganizations,
  onPublish,
  isPublishing,
  publishTarget,
}: PublishToLinkedInButtonProps) {
  const router = useRouter();

  const handleButtonClick = () => {
    if (!linkedinProfileConnected) {
      // Redirect to settings if no LinkedIn connection
      router.push("/settings?tab=integrations#integrations");
      return;
    }

    // Determine the target based on publishTarget prop
    // Default to "personal" if publishTarget is null or "personal"
    const target = publishTarget || "personal";
    onPublish(target);
  };

  const getButtonText = () => {
    if (!linkedinProfileConnected) {
      return "Publish on LinkedIn";
    }

    // If publishTarget is null or "personal", show personal text
    if (!publishTarget || publishTarget === "personal") {
      return "Publish to Personal LinkedIn";
    }

    // Otherwise, find the organization name and show organization text
    const organization = linkedinOrganizations.find(
      (org) => org.linkedin_org_id === publishTarget
    );

    if (organization) {
      return `Publish to ${organization.org_name}'s LinkedIn`;
    }

    // Fallback if organization not found
    return "Publish to LinkedIn";
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleButtonClick}
      disabled={isPublishing}
      className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
    >
      {isPublishing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Linkedin className="h-4 w-4" />
      )}
      {getButtonText()}
    </Button>
  );
}
