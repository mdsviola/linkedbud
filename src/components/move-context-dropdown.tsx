"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Loader2, User, Building2 } from "lucide-react";
import { LinkedInOrganizationDB } from "@/lib/linkedin";

interface MoveContextDropdownProps {
  organizations: LinkedInOrganizationDB[];
  currentPublishTarget: string | null;
  onMove: (publishTarget: string) => Promise<void>;
  isMoving: boolean;
  disabled?: boolean;
}

export function MoveContextDropdown({
  organizations,
  currentPublishTarget,
  onMove,
  isMoving,
  disabled = false,
}: MoveContextDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = async (publishTarget: string) => {
    // Don't do anything if selecting the current target
    if (publishTarget === (currentPublishTarget || "personal")) {
      setIsOpen(false);
      return;
    }

    try {
      await onMove(publishTarget);
      setIsOpen(false);
    } catch (error) {
      // Error handling is done in the parent component
      console.error("Failed to move context:", error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isMoving}
        className="flex items-center gap-2"
      >
        {isMoving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight className="h-4 w-4" />
        )}
        Move to Context
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md shadow-lg min-w-[200px]">
          <div className="py-1">
            {/* Personal option */}
            <button
              onClick={() => handleSelect("personal")}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center gap-2 ${
                (currentPublishTarget || "personal") === "personal"
                  ? "bg-blue-50 dark:bg-blue-900/20"
                  : ""
              }`}
              disabled={isMoving}
            >
              <User className="h-4 w-4" />
              <span className="flex-1">Personal</span>
              {(currentPublishTarget || "personal") === "personal" && (
                <Check className="h-4 w-4 text-blue-600" />
              )}
            </button>

            {/* Organization options */}
            {organizations.map((org) => {
              const isCurrent =
                currentPublishTarget === org.linkedin_org_id;
              return (
                <button
                  key={org.linkedin_org_id}
                  onClick={() => handleSelect(org.linkedin_org_id)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center gap-2 ${
                    isCurrent ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                  disabled={isMoving}
                >
                  <Building2 className="h-4 w-4" />
                  <span className="flex-1">
                    {org.org_name || `Organization ${org.linkedin_org_id}`}
                  </span>
                  {isCurrent && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

