"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { PageTitle } from "@/components/ui/page-title";
import { PageDescription } from "@/components/ui/page-description";
import { PostContextSelector } from "@/components/post-context-selector";
import {
  Building2,
  User,
} from "lucide-react";
import {
  CreatePostModal,
  CreatePostFormData,
} from "@/components/create-post-modal";
import { PostStatusBadge } from "@/components/post-status-badge";
import { PostCard } from "@/components/post-card";
import { Pagination, PaginationInfo } from "@/components/ui/pagination";
import { WarningMessage } from "@/components/ui/message";
import { LabelWithCount } from "@/components/ui/label-with-count";
import { isTokenExpired } from "@/lib/linkedin-token-utils";

interface Post {
  id: number;
  two_para_summary: string;
  content: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  scheduled_publish_date: string | null;
  publish_target: string | null;
  published_at: string | null;
  created_at: string;
  topics?: {
    title: string;
  };
  linkedin_posts?: {
    linkedin_post_id: string;
    status: string;
    published_at: string;
    organization_id: string | null;
  }[];
}

interface PostsClientProps {
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED";
}

interface Organization {
  id: number;
  linkedin_org_id: string;
  org_name: string;
  org_vanity_name: string | null;
}

export function PostsClient({ status }: PostsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [personalPosts, setPersonalPosts] = useState<Post[]>([]);
  const [organizationPosts, setOrganizationPosts] = useState<Post[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [personalPagination, setPersonalPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [organizationPagination, setOrganizationPagination] =
    useState<PaginationInfo>({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    });
  const [personalPaginationLoading, setPersonalPaginationLoading] =
    useState(false);
  const [organizationPaginationLoading, setOrganizationPaginationLoading] =
    useState(false);
  const [organizationCounts, setOrganizationCounts] = useState<
    Record<string, number>
  >({});
  const [linkedInStatus, setLinkedInStatus] = useState<{
    connected: boolean;
    expiresAt: string | null;
  } | null>(null);
  const [selectedView, setSelectedView] = useState<"personal" | string>("personal");

  useEffect(() => {
    fetchData();
  }, [status]);

  // Update selectedView and pagination when searchParams change (e.g., when navigating back)
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const pageParam = searchParams.get("page");

    if (tabParam && organizations.length > 0) {
      if (tabParam === "personal") {
        setSelectedView("personal");
        // Restore personal pagination if page parameter is provided
        if (pageParam) {
          const page = parseInt(pageParam, 10);
          if (!isNaN(page) && page >= 1) {
            fetchPersonalPosts(page);
          }
        }
      } else {
        // Check if it's a valid organization ID
        const isValidOrg = organizations.some(
          (org) => org.linkedin_org_id === tabParam
        );
        if (isValidOrg) {
          setSelectedView(tabParam);
          // Restore organization pagination if page parameter is provided
          if (pageParam) {
            const page = parseInt(pageParam, 10);
            if (!isNaN(page) && page >= 1) {
              fetchOrganizationPosts(page);
            }
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, organizations]);

  // Sync URL with selectedView changes (when user manually changes tab)
  // Only update URL if it's different from current URL param and organizations are loaded
  useEffect(() => {
    if (organizations.length > 0) {
      const currentTab = searchParams.get("tab");
      const newTab = selectedView;

      // Only update URL if it's different from current URL param
      // Also handle the case where URL has no tab param but selectedView is not "personal"
      if (currentTab !== newTab && (currentTab !== null || newTab !== "personal")) {
        const url = new URL(window.location.href);
        if (newTab === "personal") {
          url.searchParams.set("tab", "personal");
        } else {
          // Validate it's a valid org before setting
          const isValidOrg = organizations.some(
            (org) => org.linkedin_org_id === newTab
          );
          if (isValidOrg) {
            url.searchParams.set("tab", newTab);
          } else {
            url.searchParams.set("tab", "personal");
          }
        }
        // When changing tabs, reset page to 1 (or remove page param)
        url.searchParams.delete("page");
        router.replace(url.pathname + url.search, { scroll: false });
      }
    }
  }, [selectedView, organizations, router, searchParams]);

  useEffect(() => {
    // Check LinkedIn integration status only for DRAFT posts
    if (status === "DRAFT") {
      const checkLinkedInStatus = async () => {
        try {
          const response = await fetch("/api/linkedin/status");
          const data = await response.json();
          setLinkedInStatus({
            connected: data.connected || false,
            expiresAt: data.expiresAt || null,
          });
        } catch (err) {
          console.error("Error checking LinkedIn status:", err);
        }
      };

      checkLinkedInStatus();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch organizations
      const orgsResponse = await fetch("/api/linkedin/organizations");
      const orgsResult = await orgsResponse.json();

      if (!orgsResponse.ok) {
        console.error("Failed to fetch organizations:", orgsResult.error);
        setOrganizations([]);
      } else {
        const fetchedOrgs = orgsResult.organizations || [];
        setOrganizations(fetchedOrgs);

        // Validate and set the selectedView from URL query parameter
        const tabParam = searchParams.get("tab");
        if (tabParam) {
          if (tabParam === "personal") {
            setSelectedView("personal");
          } else {
            // Check if it's a valid organization ID
            const isValidOrg = fetchedOrgs.some(
              (org: Organization) => org.linkedin_org_id === tabParam
            );
            if (isValidOrg) {
              setSelectedView(tabParam);
            } else {
              // Invalid organization ID, default to personal
              setSelectedView("personal");
            }
          }
        }
      }

      // Fetch personal and organization posts in parallel
      await Promise.all([fetchPersonalPosts(1), fetchOrganizationPosts(1)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonalPosts = async (page: number = 1) => {
    try {
      setPersonalPaginationLoading(page > 1);
      const response = await fetch(
        `/api/posts?status=${status}&page=${page}&limit=10&type=personal`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch personal posts");
      }

      setPersonalPosts(result.posts || []);
      setPersonalPagination(
        result.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        }
      );
    } catch (err) {
      console.error("Error fetching personal posts:", err);
    } finally {
      setPersonalPaginationLoading(false);
    }
  };

  const fetchOrganizationPosts = async (page: number = 1) => {
    try {
      setOrganizationPaginationLoading(page > 1);
      const response = await fetch(
        `/api/posts?status=${status}&page=${page}&limit=10&type=organization`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch organization posts");
      }

      setOrganizationPosts(result.posts || []);
      setOrganizationPagination(
        result.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        }
      );

      // Store organization counts if provided
      if (result.organizationCounts) {
        setOrganizationCounts(result.organizationCounts);
      }
    } catch (err) {
      console.error("Error fetching organization posts:", err);
    } finally {
      setOrganizationPaginationLoading(false);
    }
  };

  const handlePersonalPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= personalPagination.totalPages) {
      fetchPersonalPosts(newPage);
      // Update URL with new page number
      const url = new URL(window.location.href);
      if (newPage === 1) {
        url.searchParams.delete("page");
      } else {
        url.searchParams.set("page", newPage.toString());
      }
      router.replace(url.pathname + url.search, { scroll: false });
    }
  };

  const handleOrganizationPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= organizationPagination.totalPages) {
      fetchOrganizationPosts(newPage);
      // Update URL with new page number
      const url = new URL(window.location.href);
      if (newPage === 1) {
        url.searchParams.delete("page");
      } else {
        url.searchParams.set("page", newPage.toString());
      }
      router.replace(url.pathname + url.search, { scroll: false });
    }
  };


  const handleCustomGenerate = async (formData: CreatePostFormData) => {
    setIsGenerating(true);
    setCreateError("");

    try {
      const response = await fetch("/api/generate-custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Error parsing response JSON:", jsonError);
        setCreateError(
          "Received an invalid response from the server. Please try again."
        );
        return;
      }

      if (!response.ok) {
        if (data.requiresUpgrade) {
          setCreateError(data.error || "Upgrade required to generate posts");
        } else {
          setCreateError(data.error || "Failed to generate post");
        }
        return;
      }

      // Success - close modal and redirect to post details
      setShowCustomModal(false);

      // Redirect to the post details page
      if (data.post && data.post.id) {
        router.push(`/posts/${data.post.id}`);
      } else {
        // Fallback: refresh posts if redirect fails
        await fetchData();
      }
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to generate post"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => fetchData()}>Try Again</Button>
        </div>
      </PageWrapper>
    );
  }

  const getStatusInfo = () => {
    switch (status) {
      case "PUBLISHED":
        return {
          title: "Published Posts",
          description: "Your published LinkedIn posts",
        };
      case "SCHEDULED":
        return {
          title: "Scheduled Posts",
          description: "Your posts scheduled for future publishing",
        };
      case "DRAFT":
      default:
        return {
          title: "Draft Posts",
          description: "Your draft posts ready for publishing",
        };
    }
  };

  const { title: statusTitle, description: statusDescription } =
    getStatusInfo();

  return (
    <PageWrapper>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <PageTitle>{statusTitle}</PageTitle>
          <PageDescription>{statusDescription}</PageDescription>
        </div>
        <Button onClick={() => setShowCustomModal(true)} size="lg" className="w-full sm:w-auto">
          Create Post
        </Button>
      </div>

      {status === "DRAFT" &&
        linkedInStatus &&
        (!linkedInStatus.connected ||
          isTokenExpired(linkedInStatus.expiresAt)) && (
          <div className="mb-6">
            <WarningMessage>
              LinkedIn integration is not complete. Automated publishing and
              metric fetching will not work until you connect your LinkedIn
              account.{" "}
              <Link href="/settings" className="underline font-medium">
                Go to Settings
              </Link>
            </WarningMessage>
          </div>
        )}

      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          Context
        </label>
        <PostContextSelector
          value={selectedView}
          onValueChange={setSelectedView}
          organizations={organizations}
        />
      </div>

      {(() => {
        const isPersonal = selectedView === "personal";
        const selectedOrg = organizations.find((org) => org.linkedin_org_id === selectedView);

        if (isPersonal) {
          // Show personal posts
          if (personalPosts.length === 0) {
            return (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <User className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No personal posts yet
                </h3>
                <p className="text-gray-600 mb-4">
                  {status === "PUBLISHED"
                    ? "Publish some drafts to your personal account to see them here"
                    : status === "SCHEDULED"
                    ? "Schedule some drafts to your personal account to see them here"
                    : "Create some posts for your personal account to see them here"}
                </p>
              </div>
            );
          }

          return (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Personal Posts
                </h2>
                <span className="text-sm text-gray-500">
                  ({personalPagination.total})
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {personalPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    status={status}
                    currentTab={selectedView}
                    currentPage={personalPagination.page}
                  />
                ))}
              </div>
              <Pagination
                pagination={personalPagination}
                onPageChange={handlePersonalPageChange}
                loading={personalPaginationLoading}
              />
            </div>
          );
        }

        // Show organization posts
        if (!selectedOrg) {
          return (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Building2 className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Organization not found
              </h3>
            </div>
          );
        }

        // Filter posts for this specific organization
        const orgPosts = organizationPosts.filter((post) => {
          const orgId =
            post.linkedin_posts?.[0]?.organization_id ||
            post.publish_target;
          return orgId === selectedView;
        });

        if (orgPosts.length === 0) {
          return (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Building2 className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {status.toLowerCase()} posts for {selectedOrg.org_name} yet
              </h3>
              <p className="text-gray-600 mb-4">
                {status === "PUBLISHED"
                  ? `Publish some drafts to ${selectedOrg.org_name} to see them here`
                  : status === "SCHEDULED"
                  ? `Schedule some drafts to ${selectedOrg.org_name} to see them here`
                  : `Create some posts for ${selectedOrg.org_name} to see them here`}
              </p>
            </div>
          );
        }

        return (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedOrg.org_name}
              </h2>
              <LabelWithCount
                count={organizationCounts[selectedView] || orgPosts.length}
                unit="posts"
              />
            </div>
            <div className="flex flex-col gap-2">
              {orgPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  status={status}
                  currentTab={selectedView}
                  currentPage={organizationPagination.page}
                />
              ))}
            </div>
            <Pagination
              pagination={organizationPagination}
              onPageChange={handleOrganizationPageChange}
              loading={organizationPaginationLoading}
            />
          </div>
        );
      })()}

      <CreatePostModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onGenerate={handleCustomGenerate}
        isGenerating={isGenerating}
        error={createError}
        publishTarget={selectedView} // Pass the selected tab (personal or organization ID)
      />
    </PageWrapper>
  );
}
