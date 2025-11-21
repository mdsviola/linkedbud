"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, X, CheckCircle2, Trash2, Loader2, Sparkles } from "lucide-react";
import { useFormSubmission } from "@/hooks/useFormSubmission";
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";
import { LinkedInOrganizationDB } from "@/lib/linkedin";

interface VoiceProfile {
  id: number;
  profile_type: "personal" | "organization";
  organization_id: string | null;
  voice_description: string;
  voice_data?: any;
  source_posts: string[];
  created_at: string;
  updated_at: string;
}

interface VoiceCustomizationTabContentProps {
  organizations: LinkedInOrganizationDB[];
}

export function VoiceCustomizationTabContent({
  organizations,
}: VoiceCustomizationTabContentProps) {
  const [personalPosts, setPersonalPosts] = useState([""]);
  const [orgPosts, setOrgPosts] = useState<Record<string, string[]>>({});
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<{
    type: "personal" | "organization";
    orgId?: string | null;
  } | null>(null);
  const [generatingPersonalVoice, setGeneratingPersonalVoice] = useState(false);
  const [generatingOrgVoice, setGeneratingOrgVoice] = useState<Record<string, boolean>>({});
  const [personalVoiceResult, setPersonalVoiceResult] = useState<{
    voice_description: string;
    voice_data: any;
  } | null>(null);
  const [orgVoiceResults, setOrgVoiceResults] = useState<Record<string, {
    voice_description: string;
    voice_data: any;
  }>>({});
  const [personalError, setPersonalError] = useState("");
  const [orgError, setOrgError] = useState("");
  const [publishedPostsCount, setPublishedPostsCount] = useState<{
    personal: number;
    organizations: Record<string, number>;
  }>({ personal: 0, organizations: {} });

  const personalForm = useFormSubmission();
  const orgForm = useFormSubmission();
  const deleteForm = useFormSubmission();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingProfile, setDeletingProfile] = useState<{
    type: "personal" | "organization";
    orgId?: string | null;
  } | null>(null);

  // Initialize org posts for each organization
  useEffect(() => {
    const initialOrgPosts: Record<string, string[]> = {};
    organizations.forEach((org) => {
      if (!orgPosts[org.linkedin_org_id]) {
        initialOrgPosts[org.linkedin_org_id] = [""];
      }
    });
    if (Object.keys(initialOrgPosts).length > 0) {
      setOrgPosts((prev) => ({ ...prev, ...initialOrgPosts }));
    }
  }, [organizations]);

  // Fetch voice profiles and published posts count
  useEffect(() => {
    const fetchVoiceProfiles = async () => {
      try {
        const response = await fetch("/api/voice/profiles");
        const result = await response.json();
        if (response.ok) {
          setVoiceProfiles(result.voice_profiles || []);
        }
      } catch (err) {
        console.error("Error fetching voice profiles:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchPublishedPostsCount = async () => {
      try {
        // Fetch personal published posts count
        const personalResponse = await fetch("/api/posts?status=PUBLISHED&limit=10&type=personal");
        if (personalResponse.ok) {
          const personalData = await personalResponse.json();
          const personalPosts = personalData.posts || [];
          const personalCount = personalPosts.filter((p: any) =>
            p.publish_target === "personal" || !p.publish_target
          ).length;
          setPublishedPostsCount((prev) => ({
            ...prev,
            personal: personalCount,
          }));
        }

        // Fetch organization published posts count for each org
        if (organizations.length > 0) {
          const orgCounts: Record<string, number> = {};
          for (const org of organizations) {
            try {
              const orgResponse = await fetch(
                `/api/posts?status=PUBLISHED&limit=10&type=organization`
              );
              if (orgResponse.ok) {
                const orgData = await orgResponse.json();
                const orgPosts = orgData.posts || [];
                // Filter posts by organization ID (check both publish_target and linkedin_posts)
                const orgPostsFiltered = orgPosts.filter((p: any) => {
                  if (p.publish_target === org.linkedin_org_id) return true;
                  // Also check linkedin_posts for organization_id
                  if (p.linkedin_posts && Array.isArray(p.linkedin_posts)) {
                    return p.linkedin_posts.some((lp: any) => lp.organization_id === org.linkedin_org_id);
                  }
                  return false;
                });
                orgCounts[org.linkedin_org_id] = orgPostsFiltered.length;
              }
            } catch (orgErr) {
              console.error(`Error fetching posts for org ${org.linkedin_org_id}:`, orgErr);
              orgCounts[org.linkedin_org_id] = 0;
            }
          }
          setPublishedPostsCount((prev) => ({
            ...prev,
            organizations: { ...prev.organizations, ...orgCounts },
          }));
        }
      } catch (err) {
        console.error("Error fetching published posts count:", err);
      }
    };

    fetchVoiceProfiles();
    fetchPublishedPostsCount();
  }, [organizations]);

  const addPostField = (type: "personal" | "organization", orgId?: string) => {
    if (type === "personal") {
      setPersonalPosts([...personalPosts, ""]);
    } else if (orgId) {
      setOrgPosts((prev) => ({
        ...prev,
        [orgId]: [...(prev[orgId] || [""]), ""],
      }));
    }
  };

  const removePostField = (
    type: "personal" | "organization",
    index: number,
    orgId?: string
  ) => {
    if (type === "personal") {
      if (personalPosts.length > 1) {
        setPersonalPosts(personalPosts.filter((_, i) => i !== index));
      }
    } else if (orgId) {
      const posts = orgPosts[orgId] || [];
      if (posts.length > 1) {
        setOrgPosts((prev) => ({
          ...prev,
          [orgId]: posts.filter((_, i) => i !== index),
        }));
      }
    }
  };

  const updatePost = (
    type: "personal" | "organization",
    index: number,
    value: string,
    orgId?: string
  ) => {
    if (type === "personal") {
      const updated = [...personalPosts];
      updated[index] = value;
      setPersonalPosts(updated);
    } else if (orgId) {
      const posts = orgPosts[orgId] || [];
      const updated = [...posts];
      updated[index] = value;
      setOrgPosts((prev) => ({
        ...prev,
        [orgId]: updated,
      }));
    }
  };

  const getVoiceProfile = (
    type: "personal" | "organization",
    orgId?: string | null
  ): VoiceProfile | undefined => {
    return voiceProfiles.find(
      (vp) =>
        vp.profile_type === type &&
        (orgId ? vp.organization_id === orgId : !vp.organization_id)
    );
  };

  const handleSubmitPersonal = async () => {
    const postsArray = personalPosts
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    // Clear any previous errors
    setPersonalError("");

    // Validation: Only require posts if there are no published posts
    const hasPublishedPosts = publishedPostsCount.personal > 0;
    const hasSubmittedPosts = postsArray.length > 0;

    if (!hasPublishedPosts && !hasSubmittedPosts) {
      setPersonalError("Please provide at least 1 post to generate your voice profile");
      return;
    }

    setGeneratingPersonalVoice(true);
    setPersonalVoiceResult(null);

    await personalForm.submit(async () => {
      const response = await fetch("/api/voice/customize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile_type: "personal",
          posts: postsArray,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Use user-friendly error message from API
        throw new Error(data.error || "Failed to customize voice profile. Please try again.");
      }

      // Store the voice profile data for display
      if (data.voice_profile) {
        setPersonalVoiceResult({
          voice_description: data.voice_profile.voice_description,
          voice_data: data.voice_profile.voice_data || {},
        });
      }

      // Refresh voice profiles
      const profilesResponse = await fetch("/api/voice/profiles");
      const profilesResult = await profilesResponse.json();
      if (profilesResponse.ok) {
        setVoiceProfiles(profilesResult.voice_profiles || []);
      }

      // Reset form
      setPersonalPosts([""]);
    }, "Personal voice profile customized successfully!");

    setGeneratingPersonalVoice(false);
  };

  const handleSubmitOrg = async (orgId: string) => {
    const posts = orgPosts[orgId] || [];
    const postsArray = posts
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    // Clear any previous errors
    setOrgError("");

    // Validation: Only require posts if there are no published posts
    const hasPublishedPosts = publishedPostsCount.organizations[orgId] > 0;
    const hasSubmittedPosts = postsArray.length > 0;

    if (!hasPublishedPosts && !hasSubmittedPosts) {
      setOrgError("Please provide at least 1 post to generate your voice profile");
      return;
    }

    setGeneratingOrgVoice((prev) => ({ ...prev, [orgId]: true }));
    setOrgVoiceResults((prev) => ({ ...prev, [orgId]: undefined as any }));

    await orgForm.submit(async () => {
      const response = await fetch("/api/voice/customize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile_type: "organization",
          organization_id: orgId,
          posts: postsArray, // These will be combined with existing published posts on the server
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Use user-friendly error message from API
        throw new Error(data.error || "Failed to customize voice profile. Please try again.");
      }

      // Store the voice profile data for display
      if (data.voice_profile) {
        setOrgVoiceResults((prev) => ({
          ...prev,
          [orgId]: {
            voice_description: data.voice_profile.voice_description,
            voice_data: data.voice_profile.voice_data || {},
          },
        }));
      }

      // Refresh voice profiles
      const profilesResponse = await fetch("/api/voice/profiles");
      const profilesResult = await profilesResponse.json();
      if (profilesResponse.ok) {
        setVoiceProfiles(profilesResult.voice_profiles || []);
      }

      // Reset form for this org
      setOrgPosts((prev) => ({ ...prev, [orgId]: [""] }));
    }, "Organization voice profile customized successfully!");

    setGeneratingOrgVoice((prev) => ({ ...prev, [orgId]: false }));
  };

  const handleDeleteProfile = async () => {
    if (!deletingProfile) return;

    await deleteForm.submit(async () => {
      const response = await fetch("/api/voice/customize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile_type: deletingProfile.type,
          organization_id: deletingProfile.orgId || null,
          delete_profile: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Use user-friendly error message from API
        throw new Error(data.error || "Failed to delete voice profile. Please try again.");
      }

      // Refresh voice profiles
      const profilesResponse = await fetch("/api/voice/profiles");
      const profilesResult = await profilesResponse.json();
      if (profilesResponse.ok) {
        setVoiceProfiles(profilesResult.voice_profiles || []);
      }

      setDeleteModalOpen(false);
      setDeletingProfile(null);
    }, "Voice profile deleted successfully!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const personalVoice = getVoiceProfile("personal");

  return (
    <div className="space-y-6">
      {/* Personal Voice */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Personal Voice</CardTitle>
              <CardDescription>
                Customize your personal writing voice by submitting your past
                LinkedIn posts
              </CardDescription>
            </div>
            {personalVoice && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Active ({personalVoice.source_posts?.length || 0} posts)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDeletingProfile({ type: "personal" });
                    setDeleteModalOpen(true);
                  }}
                  disabled={deleteForm.status === "submitting"}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
                  {(personalVoice || personalVoiceResult) && (
                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-4">
                      {personalVoice && (
                        <p className="text-sm text-green-800 dark:text-green-200">
                          <strong>Last updated:</strong>{" "}
                          {new Date(personalVoice.updated_at).toLocaleDateString()}
                        </p>
                      )}
                      {(() => {
                        const displayVoice = personalVoiceResult || (personalVoice ? {
                          voice_description: personalVoice.voice_description,
                          voice_data: personalVoice.voice_data || {},
                        } : null);

                        if (!displayVoice) return null;

                        return (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
                              <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">
                                Your Writing Voice
                              </h4>
                            </div>

                            {/* Voice Description */}
                            <div>
                              <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-2">
                                Voice Description:
                              </p>
                              <p className="text-sm text-green-900 dark:text-green-100 leading-relaxed whitespace-pre-wrap">
                                {displayVoice.voice_description}
                              </p>
                            </div>

                            {/* Voice Characteristics */}
                            {displayVoice.voice_data && (
                              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-green-200 dark:border-green-800">
                                <div>
                                  <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                                    Tone:
                                  </p>
                                  <p className="text-sm text-green-900 dark:text-green-100">
                                    {displayVoice.voice_data.tone || "Not specified"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                                    Formality:
                                  </p>
                                  <p className="text-sm text-green-900 dark:text-green-100 capitalize">
                                    {displayVoice.voice_data.formality || "Not specified"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                                    Sentence Length:
                                  </p>
                                  <p className="text-sm text-green-900 dark:text-green-100 capitalize">
                                    {displayVoice.voice_data.sentence_length || "Not specified"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                                    Vocabulary:
                                  </p>
                                  <p className="text-sm text-green-900 dark:text-green-100 capitalize">
                                    {displayVoice.voice_data.vocabulary_complexity || "Not specified"}
                                  </p>
                                </div>
                                {(displayVoice.voice_data.uses_emojis || displayVoice.voice_data.uses_questions || displayVoice.voice_data.uses_statistics) && (
                                  <div className="col-span-2">
                                    <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                                      Style Features:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {displayVoice.voice_data.uses_emojis && (
                                        <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 rounded-full">
                                          Uses Emojis
                                        </span>
                                      )}
                                      {displayVoice.voice_data.uses_questions && (
                                        <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 rounded-full">
                                          Uses Questions
                                        </span>
                                      )}
                                      {displayVoice.voice_data.uses_statistics && (
                                        <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 rounded-full">
                                          Uses Statistics
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {displayVoice.voice_data.engagement_tactics && displayVoice.voice_data.engagement_tactics.length > 0 && (
                                  <div className="col-span-2">
                                    <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                                      Engagement Tactics:
                                    </p>
                                    <p className="text-sm text-green-900 dark:text-green-100">
                                      {displayVoice.voice_data.engagement_tactics.join(", ")}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

          <div className="space-y-2">
            <Label>
              {publishedPostsCount.personal > 0
                ? "Submit Additional LinkedIn Posts (Optional)"
                : "Submit LinkedIn Posts"}
            </Label>
            {publishedPostsCount.personal > 0 && (
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                ✓ Using {publishedPostsCount.personal} published {publishedPostsCount.personal === 1 ? 'post' : 'posts'} for voice extraction
              </p>
            )}
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {publishedPostsCount.personal > 0
                ? "Add additional posts to enhance your voice profile (up to 10 posts total)"
                : "Provide at least 1 post to extract your writing voice. Existing published posts will also be used if available."}
            </p>
            {personalPosts.map((post, index) => (
              <div key={index} className="flex gap-2">
                <Textarea
                  value={post}
                  onChange={(e) =>
                    updatePost("personal", index, e.target.value)
                  }
                  placeholder={`Post ${index + 1}...`}
                  className="flex-1"
                  rows={3}
                />
                {personalPosts.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePostField("personal", index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addPostField("personal")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Post
            </Button>
          </div>

          {(personalError || (personalForm.status === "error" && personalForm.message)) && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{personalError || personalForm.message}</p>
            </div>
          )}

                  <Button
                    onClick={handleSubmitPersonal}
                    disabled={personalForm.status === "submitting" || generatingPersonalVoice}
                  >
                    {(personalForm.status === "submitting" || generatingPersonalVoice) ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Customizing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Customize Personal Voice
                      </>
                    )}
                  </Button>
        </CardContent>
      </Card>

      {/* Organization Voices */}
      {organizations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Organization Voices</h3>
          {organizations.map((org) => {
            const orgVoice = getVoiceProfile("organization", org.linkedin_org_id);
            const posts = orgPosts[org.linkedin_org_id] || [""];

            return (
              <Card key={org.linkedin_org_id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{org.org_name || `Organization ${org.linkedin_org_id}`}</CardTitle>
                      <CardDescription>
                        Customize the voice for posts published to this organization
                      </CardDescription>
                    </div>
                    {orgVoice && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          Active ({orgVoice.source_posts?.length || 0} posts)
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeletingProfile({
                              type: "organization",
                              orgId: org.linkedin_org_id,
                            });
                            setDeleteModalOpen(true);
                          }}
                          disabled={deleteForm.status === "submitting"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(orgVoice || orgVoiceResults[org.linkedin_org_id]) && (
                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-4">
                      {orgVoice && (
                        <p className="text-sm text-green-800 dark:text-green-200">
                          <strong>Last updated:</strong>{" "}
                          {new Date(orgVoice.updated_at).toLocaleDateString()}
                        </p>
                      )}
                      {(() => {
                        const displayVoice = orgVoiceResults[org.linkedin_org_id] || (orgVoice ? {
                          voice_description: orgVoice.voice_description,
                          voice_data: orgVoice.voice_data || {},
                        } : null);

                        if (!displayVoice) return null;

                        return (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
                              <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">
                                Organization Writing Voice
                              </h4>
                            </div>

                            {/* Voice Description */}
                            <div>
                              <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-2">
                                Voice Description:
                              </p>
                              <p className="text-sm text-green-900 dark:text-green-100 leading-relaxed whitespace-pre-wrap">
                                {displayVoice.voice_description}
                              </p>
                            </div>

                            {/* Voice Characteristics */}
                            {displayVoice.voice_data && (
                              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-green-200 dark:border-green-800">
                                <div>
                                  <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                                    Tone:
                                  </p>
                                  <p className="text-sm text-green-900 dark:text-green-100">
                                    {displayVoice.voice_data.tone || "Not specified"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                                    Formality:
                                  </p>
                                  <p className="text-sm text-green-900 dark:text-green-100 capitalize">
                                    {displayVoice.voice_data.formality || "Not specified"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                                    Sentence Length:
                                  </p>
                                  <p className="text-sm text-green-900 dark:text-green-100 capitalize">
                                    {displayVoice.voice_data.sentence_length || "Not specified"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                                    Vocabulary:
                                  </p>
                                  <p className="text-sm text-green-900 dark:text-green-100 capitalize">
                                    {displayVoice.voice_data.vocabulary_complexity || "Not specified"}
                                  </p>
                                </div>
                                {(displayVoice.voice_data.uses_emojis || displayVoice.voice_data.uses_questions || displayVoice.voice_data.uses_statistics) && (
                                  <div className="col-span-2">
                                    <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                                      Style Features:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {displayVoice.voice_data.uses_emojis && (
                                        <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 rounded-full">
                                          Uses Emojis
                                        </span>
                                      )}
                                      {displayVoice.voice_data.uses_questions && (
                                        <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 rounded-full">
                                          Uses Questions
                                        </span>
                                      )}
                                      {displayVoice.voice_data.uses_statistics && (
                                        <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 rounded-full">
                                          Uses Statistics
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {displayVoice.voice_data.engagement_tactics && displayVoice.voice_data.engagement_tactics.length > 0 && (
                                  <div className="col-span-2">
                                    <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                                      Engagement Tactics:
                                    </p>
                                    <p className="text-sm text-green-900 dark:text-green-100">
                                      {displayVoice.voice_data.engagement_tactics.join(", ")}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>
                      {publishedPostsCount.organizations[org.linkedin_org_id] > 0
                        ? "Submit Additional LinkedIn Posts (Optional)"
                        : "Submit LinkedIn Posts"}
                    </Label>
                    {publishedPostsCount.organizations[org.linkedin_org_id] > 0 && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        ✓ Using {publishedPostsCount.organizations[org.linkedin_org_id]} published {publishedPostsCount.organizations[org.linkedin_org_id] === 1 ? 'post' : 'posts'} for voice extraction
                      </p>
                    )}
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {publishedPostsCount.organizations[org.linkedin_org_id] > 0
                        ? "Add additional posts to enhance your voice profile (up to 10 posts total)"
                        : "Provide at least 1 post to extract your writing voice. Existing published posts will also be used if available."}
                    </p>
                    {posts.map((post, index) => (
                      <div key={index} className="flex gap-2">
                        <Textarea
                          value={post}
                          onChange={(e) =>
                            updatePost("organization", index, e.target.value, org.linkedin_org_id)
                          }
                          placeholder={`Post ${index + 1}...`}
                          className="flex-1"
                          rows={3}
                        />
                        {posts.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              removePostField("organization", index, org.linkedin_org_id)
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addPostField("organization", org.linkedin_org_id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Post
                    </Button>
                  </div>

                  {(orgError || (orgForm.status === "error" && orgForm.message)) && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <p className="text-sm text-red-800 dark:text-red-200">{orgError || orgForm.message}</p>
                    </div>
                  )}

                  <Button
                    onClick={() => handleSubmitOrg(org.linkedin_org_id)}
                    disabled={orgForm.status === "submitting" || generatingOrgVoice[org.linkedin_org_id]}
                  >
                    {(orgForm.status === "submitting" || generatingOrgVoice[org.linkedin_org_id]) ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Customizing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Customize {org.org_name || "Organization"} Voice
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingProfile(null);
        }}
        onConfirm={handleDeleteProfile}
        title="Delete Voice Profile"
        description="Are you sure you want to delete this voice profile? You can recreate it by submitting posts again."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteForm.status === "submitting"}
      />
    </div>
  );
}

