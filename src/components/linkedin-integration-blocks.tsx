"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Building2 } from "lucide-react";
import {
  isTokenExpired,
  isTokenExpiringSoon,
  getDaysUntilExpiration,
} from "@/lib/linkedin-token-utils";
import { formatDateOnly } from "@/lib/utils";
import { LinkedInOrganizationDB } from "@/lib/linkedin";

interface LinkedInAccount {
  id: number;
  linkedin_user_id: string;
  profile_data: {
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  is_active: boolean;
  created_at: string;
  token_expires_at: string | null;
}

interface LinkedInIntegrationBlocksProps {
  linkedinAccount: LinkedInAccount | null;
  communityToken: LinkedInAccount | null;
  organizations: LinkedInOrganizationDB[];
  onPersonalConnect: () => void;
  onCommunityConnect: () => void;
  onPersonalDisconnect?: () => void;
  onCommunityDisconnect?: () => void;
  isDisconnecting?: boolean;
  showRevokeButtons?: boolean;
}

export function LinkedInIntegrationBlocks({
  linkedinAccount,
  communityToken,
  organizations,
  onPersonalConnect,
  onCommunityConnect,
  onPersonalDisconnect,
  onCommunityDisconnect,
  isDisconnecting = false,
  showRevokeButtons = true,
}: LinkedInIntegrationBlocksProps) {
  return (
    <>
      {/* Warning banner when only one step is complete */}
      {((linkedinAccount && !communityToken) ||
        (!linkedinAccount && communityToken)) && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <span className="font-medium text-amber-900 dark:text-amber-100">
              Incomplete Setup
            </span>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            Both personal and community management permissions are required for
            full LinkedIn functionality.
          </p>
        </div>
      )}

      {/* Success banner when both are connected */}
      {linkedinAccount && communityToken && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="font-medium text-green-900 dark:text-green-100">
              LinkedIn Integration Complete
            </span>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300">
            Full access enabled - you can publish to personal pages and fetch
            metrics/publish to organization pages
          </p>
        </div>
      )}

      {/* Unified layout - always show both permission blocks */}
      <div className="space-y-6">
        {/* Personal Permissions Block */}
        <div className="border rounded-lg p-4 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {linkedinAccount &&
              !isTokenExpired(linkedinAccount.token_expires_at) ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              )}
              <span className="font-medium text-gray-900 dark:text-white">
                Personal Permissions
              </span>
            </div>
            {showRevokeButtons && linkedinAccount && onPersonalDisconnect && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPersonalDisconnect}
                disabled={isDisconnecting}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                {isDisconnecting ? "Disconnecting..." : "Revoke"}
              </Button>
            )}
          </div>

          {linkedinAccount ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {linkedinAccount.profile_data?.firstName &&
                  linkedinAccount.profile_data?.lastName
                    ? `${linkedinAccount.profile_data.firstName} ${linkedinAccount.profile_data.lastName}`
                    : "LinkedIn Account Connected"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Connected since {formatDateOnly(linkedinAccount.created_at)}
                </p>
              </div>

              {linkedinAccount.token_expires_at && (
                <div className="pt-3 border-t dark:border-slate-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Expires:</span>{" "}
                    {formatDateOnly(linkedinAccount.token_expires_at)}{" "}
                    {isTokenExpired(linkedinAccount.token_expires_at) ? (
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        (Expired)
                      </span>
                    ) : isTokenExpiringSoon(
                        linkedinAccount.token_expires_at
                      ) ? (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        (Expires in{" "}
                        {getDaysUntilExpiration(
                          linkedinAccount.token_expires_at
                        )}{" "}
                        days)
                      </span>
                    ) : (
                      <span className="text-green-600 dark:text-green-400">
                        (Expires in{" "}
                        {getDaysUntilExpiration(
                          linkedinAccount.token_expires_at
                        )}{" "}
                        days)
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Grant access to publish posts to your personal profile
              </p>
              <Button
                onClick={onPersonalConnect}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Grant Personal Permissions
              </Button>
            </div>
          )}
        </div>

        {/* Community Management Permissions Block */}
        <div className="border rounded-lg p-4 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {communityToken &&
              !isTokenExpired(communityToken.token_expires_at) ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              )}
              <span className="font-medium text-gray-900 dark:text-white">
                Community Management Permissions
              </span>
            </div>
            {showRevokeButtons && communityToken && onCommunityDisconnect && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCommunityDisconnect}
                disabled={isDisconnecting}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                {isDisconnecting ? "Disconnecting..." : "Revoke"}
              </Button>
            )}
          </div>

          {communityToken ? (
            <div className="space-y-3">
              <div>
                {organizations.length > 0 ? (
                  <>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Access to fetch metrics and publish to{" "}
                      {organizations.length} organization
                      {organizations.length !== 1 ? "s" : ""}
                    </p>
                    <div className="mt-2 space-y-2">
                      {organizations.map((org) => (
                        <div
                          key={org.linkedin_org_id}
                          className="flex items-center gap-2"
                        >
                          <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {org.org_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Community Management permissions granted. You can fetch
                    metrics and publish to organization pages you administer.
                  </p>
                )}
              </div>

              {communityToken.token_expires_at && (
                <div className="pt-3 border-t dark:border-slate-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Expires:</span>{" "}
                    {formatDateOnly(communityToken.token_expires_at)}{" "}
                    {isTokenExpired(communityToken.token_expires_at) ? (
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        (Expired)
                      </span>
                    ) : isTokenExpiringSoon(communityToken.token_expires_at) ? (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        (Expires in{" "}
                        {getDaysUntilExpiration(
                          communityToken.token_expires_at
                        )}{" "}
                        days)
                      </span>
                    ) : (
                      <span className="text-green-600 dark:text-green-400">
                        (Expires in{" "}
                        {getDaysUntilExpiration(
                          communityToken.token_expires_at
                        )}{" "}
                        days)
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Grant access to fetch metrics and publish to organization pages
                you administer
              </p>
              <Button
                onClick={onCommunityConnect}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Grant Community Management Permissions
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
