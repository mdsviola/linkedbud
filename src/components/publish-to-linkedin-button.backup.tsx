"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Linkedin, ChevronDown, Loader2 } from "lucide-react";
import { LinkedInOrganizationDB } from "@/lib/linkedin";

interface PublishToLinkedInButtonProps {
  postId: number;
  linkedinProfileConnected: boolean;
  linkedinOrganizations: LinkedInOrganizationDB[];
  onPublish: (publishTarget: string) => void;
  isPublishing: boolean;
}

export function PublishToLinkedInButton({
  postId,
  linkedinProfileConnected,
  linkedinOrganizations,
  onPublish,
  isPublishing,
}: PublishToLinkedInButtonProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleButtonClick = () => {
    if (!linkedinProfileConnected) {
      // Redirect to settings if no LinkedIn connection
      router.push("/settings?tab=integrations#integrations");
      return;
    }

    // Toggle dropdown if LinkedIn is connected
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handlePublishTarget = (publishTarget: string) => {
    onPublish(publishTarget);
    setIsDropdownOpen(false);
  };

  const getButtonText = () => {
    if (!linkedinProfileConnected) {
      return "Publish on LinkedIn";
    }
    return "Publish to LinkedIn";
  };

  const hasOrganizations =
    linkedinOrganizations && linkedinOrganizations.length > 0;

  return (
    <div className="relative" ref={dropdownRef}>
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
        {linkedinProfileConnected && <ChevronDown className="h-4 w-4" />}
      </Button>

      {/* Dropdown Menu */}
      {linkedinProfileConnected && isDropdownOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          <div className="py-1">
            {/* Personal Profile Option */}
            <button
              onClick={() => handlePublishTarget("personal")}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <Linkedin className="h-4 w-4" />
              Publish to Personal Profile
            </button>

            {/* Organization Options */}
            {hasOrganizations && (
              <>
                <div className="border-t border-gray-100 my-1"></div>
                {linkedinOrganizations.map((org) => (
                  <button
                    key={org.linkedin_org_id}
                    onClick={() => handlePublishTarget(org.linkedin_org_id)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Linkedin className="h-4 w-4" />
                    Publish to {org.org_name}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



