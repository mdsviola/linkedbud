"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CommaSeparatedInput } from "@/components/ui/comma-separated-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CardTitleWithIcon } from "@/components/ui/card-title-with-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { PageTitle } from "@/components/ui/page-title";
import { PageDescription } from "@/components/ui/page-description";
import { createClientClient } from "@/lib/supabase-client";
import {
  TrendingUp,
  Loader2,
  Settings,
  Newspaper,
  X,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { PaywallModal } from "@/components/paywall-modal";
import {
  CreatePostModal,
  CreatePostFormData,
} from "@/components/create-post-modal";
import { useFormSubmission } from "@/hooks/useFormSubmission";
import {
  saveForYouCache,
  loadForYouCache,
  hasValidForYouCache,
  isForYouCacheExpired,
} from "@/lib/for-you-cache";
import { RssFeedSelector } from "@/components/rss-feed-selector";

interface User {
  id: string;
  email?: string;
}

interface Article {
  title: string;
  link: string;
  pubDate?: string;
  contentSnippet?: string;
  source: string;
  aiReason?: string;
}

interface Preferences {
  topics: string[];
  custom_rss_feeds: string[];
}

interface SourceLoadingState {
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  articles: Article[];
}

// Component for managing article preferences
function PreferencesPanel({
  preferences,
  onUpdatePreferences,
  originalPreferences,
  onSaveSuccess,
}: {
  preferences: Preferences;
  onUpdatePreferences: (prefs: Preferences) => void;
  originalPreferences: Preferences;
  onSaveSuccess: (prefs: Preferences) => void;
}) {
  const { status, message, submit, reset } = useFormSubmission();

  // Check if there are unsaved changes
  const hasUnsavedChanges =
    JSON.stringify(preferences.topics) !==
      JSON.stringify(originalPreferences.topics) ||
    JSON.stringify(preferences.custom_rss_feeds) !==
      JSON.stringify(originalPreferences.custom_rss_feeds);

  const savePreferences = async (prefs: Preferences) => {
    try {
      const response = await fetch("/api/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(prefs),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to save preferences:", error);
        throw new Error(
          error.error || "Failed to save article preferences. Please try again."
        );
      }

      const result = await response.json();
      return result;
    } catch (err) {
      console.error("Error saving preferences:", err);
      if (err instanceof Error) {
        throw err;
      } else {
        throw new Error(
          "Unable to save article preferences. Please check your connection and try again."
        );
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitleWithIcon
          icon={Settings}
          title="Article Preferences"
          description="Customize your article sources and refresh settings"
        />
      </CardHeader>
      <CardContent className="space-y-6">
        <CommaSeparatedInput
          id="topics"
          label="Topics"
          placeholder="renewable energy, sustainability, cleantech"
          value={preferences.topics}
          onChange={(topics) => {
            const updatedPreferences = {
              ...preferences,
              topics,
            };
            onUpdatePreferences(updatedPreferences);
          }}
          description="Comma-separated topics to fetch relevant articles from Google News"
        />

        <RssFeedSelector
          selectedFeeds={preferences.custom_rss_feeds}
          onSelectedFeedsChange={(feeds) => {
            const updatedPreferences = {
              ...preferences,
              custom_rss_feeds: feeds,
            };
            onUpdatePreferences(updatedPreferences);
          }}
        />

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex gap-2">
            {hasUnsavedChanges && (
              <Button
                variant="outline"
                onClick={() => {
                  onUpdatePreferences(originalPreferences);
                  reset();
                }}
                disabled={status === "submitting"}
              >
                Reset Changes
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <span className="text-sm text-amber-600">
                You have unsaved changes
              </span>
            )}
            <Button
              onClick={() =>
                submit(async () => {
                  try {
                    // Save all preferences as a single transaction
                    const result = await savePreferences(preferences);

                    // Update local state with the saved data to ensure consistency
                    if (result.preferences) {
                      onUpdatePreferences(result.preferences);
                      onSaveSuccess(result.preferences);
                    }

                    return result;
                  } catch (error) {
                    // If save fails, the local state remains unchanged
                    // The error will be handled by the useFormSubmission hook
                    throw error;
                  }
                }, "Article preferences saved successfully! Your article feed will be updated.")
              }
              disabled={status === "submitting" || !hasUnsavedChanges}
            >
              {status === "submitting" ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Component for displaying For You recommendations
function ForYouSection({
  articles,
  onGenerateDrafts,
  generatingArticle,
  loading,
  error,
  hasAttempted,
}: {
  articles: Article[];
  onGenerateDrafts: (article: Article) => void;
  generatingArticle: string | null;
  loading: boolean;
  error: boolean;
  hasAttempted: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-medium">For you</h3>
        <span className="text-sm text-gray-500">powered by AI</span>
      </div>

      {loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Finding articles for you...
            </h3>
            <p className="text-gray-500">
              AI is analyzing articles to find the most relevant ones
            </p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-gray-400 mx-auto mb-4">
              <svg
                className="h-12 w-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              For you posts couldn&apos;t be fetched
            </h3>
            <p className="text-gray-500">
              Unable to get AI recommendations at this time. Please try again
              later.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && articles.length > 0 && (
        <div className="grid gap-4">
          {articles.map((article, index) => (
            <Card key={`for-you-${index}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg leading-tight">
                      {article.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {article.pubDate
                        ? new Date(article.pubDate).toLocaleDateString()
                        : "No date"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Read
                      </a>
                    </Button>
                    <Button
                      onClick={() => onGenerateDrafts(article)}
                      disabled={generatingArticle === article.link}
                      size="sm"
                    >
                      {generatingArticle === article.link ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Create Post"
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {article.contentSnippet && (
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {article.contentSnippet}
                  </p>
                )}
                {article.aiReason && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="text-blue-600 text-sm font-medium mb-2">
                      AI Insight:
                    </div>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      {article.aiReason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && hasAttempted && articles.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-gray-400 mx-auto mb-4">
              <svg
                className="h-12 w-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No recommendations yet
            </h3>
            <p className="text-gray-500">
              AI recommendations will appear here once we have articles to
              analyze
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Component for displaying articles
function ArticlesList({
  articles,
  onGenerateDrafts,
  generatingArticle,
  loading,
  onRefresh,
  rssErrors,
  sourceLoadingStates,
  hasAttempted,
}: {
  articles: Article[];
  onGenerateDrafts: (article: Article) => void;
  generatingArticle: string | null;
  loading: boolean;
  onRefresh: () => void;
  rssErrors: string[];
  sourceLoadingStates: Record<string, SourceLoadingState>;
  hasAttempted: boolean;
}) {
  // Group articles by source
  const groupedArticles = articles.reduce((groups, article) => {
    const source = article.source || "Unknown Source";
    if (!groups[source]) {
      groups[source] = [];
    }
    groups[source].push(article);
    return groups;
  }, {} as Record<string, Article[]>);

  // Get all sources that have articles
  const allSources = Object.keys(groupedArticles);
  const sortedSources = allSources.sort();

  // Check if any sources are currently loading
  const hasLoadingSources = Object.values(sourceLoadingStates).some(
    (state) => state.isLoading
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Latest Articles</h3>
        <Button onClick={onRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Show loading spinner if sources are loading and no articles yet */}
      {loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Loading articles...
            </h3>
            <p className="text-gray-500">
              Fetching articles from your configured sources
            </p>
          </CardContent>
        </Card>
      )}

      {/* Show "No articles found" only if no articles and not loading and we've attempted to load */}
      {!loading && hasAttempted && articles.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <Newspaper className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No articles found
            </h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your keywords or adding custom RSS feeds
            </p>
            <Button onClick={onRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      )}

      {rssErrors.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <h4 className="font-medium text-amber-800 mb-2">RSS Feed Issues</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              {rssErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Accordion>
        {/* Show only sources with articles */}
        {sortedSources.map((source) => {
          const sourceState = sourceLoadingStates[source];
          const sourceArticles = groupedArticles[source] || [];
          const hasError = sourceState?.hasError || false;
          const errorMessage = sourceState?.errorMessage;

          return (
            <AccordionItem
              key={source}
              title={
                <span>
                  {source}{" "}
                  <span className="text-gray-500">
                    (
                    <span className="text-gray-700 font-medium">
                      {sourceArticles.length}
                    </span>{" "}
                    articles)
                  </span>
                </span>
              }
              defaultOpen={false}
            >
              <div className="flex flex-col gap-2 mt-4 mb-2">
                {/* Error indicator */}
                {hasError && (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-red-500">⚠️</span>
                        <p className="text-red-800">
                          Failed to load articles from {source}: {errorMessage}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {sourceArticles.map((article, index) => (
                  <Card key={`${source}-${index}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg leading-tight">
                            {article.title}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {article.pubDate
                              ? new Date(article.pubDate).toLocaleDateString()
                              : "No date"}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={article.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Read
                            </a>
                          </Button>
                          <Button
                            onClick={() => onGenerateDrafts(article)}
                            disabled={generatingArticle === article.link}
                            size="sm"
                          >
                            {generatingArticle === article.link ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              "Create Post"
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {article.contentSnippet && (
                      <CardContent>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {article.contentSnippet}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

export function ArticlesClient({ user }: { user: User }) {
  const router = useRouter();
  const [preferences, setPreferences] = useState<Preferences>({
    topics: [],
    custom_rss_feeds: [],
  });
  const [originalPreferences, setOriginalPreferences] =
    useState<Preferences>({
      topics: [],
      custom_rss_feeds: [],
    });
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [generatingArticle, setGeneratingArticle] = useState<string | null>(
    null
  );
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(
    null
  );
  const [modalError, setModalError] = useState("");
  const [rssErrors, setRssErrors] = useState<string[]>([]);
  const [sourceLoadingStates, setSourceLoadingStates] = useState<
    Record<string, SourceLoadingState>
  >({});
  const [forYouArticles, setForYouArticles] = useState<Article[]>([]);
  const [forYouLoading, setForYouLoading] = useState(true); // Always start in loading state
  const [forYouError, setForYouError] = useState(false);
  const forYouAttempted = useRef(false);

  const supabase = createClientClient();

  useEffect(() => {
    fetchPreferences();
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;

    // Reset For You state when preferences change
    forYouAttempted.current = false;
    setForYouError(false);
    setForYouLoading(true);
    setForYouArticles([]); // Clear previous articles

    if (
      preferences.topics.length > 0 ||
      preferences.custom_rss_feeds.length > 0
    ) {
      fetchArticles();
    } else {
      setLoading(false);
      // No topics configured, stop For You loading
      setForYouLoading(false);
      forYouAttempted.current = true;
    }
  }, [preferences, preferencesLoaded]);

  // Handle For You recommendations after article loading completes
  useEffect(() => {
    if (!preferencesLoaded) return;

    const allSourcesFinished = Object.values(sourceLoadingStates).every(
      (state) => !state.isLoading
    );

    // Only proceed if all sources are finished and we haven't attempted For You yet
    if (!allSourcesFinished || forYouAttempted.current) return;

    // Safety check: ensure we have valid state
    if (Object.keys(sourceLoadingStates).length === 0) return;

    // Check if we have the prerequisites for For You recommendations
    const hasTopics = preferences.topics.length > 0;
    const hasArticles = articles.length > 0;

    if (hasTopics && hasArticles) {
      // We have both topics and articles, try to get recommendations
      forYouAttempted.current = true;

      if (hasValidForYouCache()) {
        // Use cached recommendations
        const cachedArticles = loadForYouCache();
        if (cachedArticles) {
          setForYouArticles(cachedArticles);
        }
        setForYouLoading(false);
      } else {
        // Fetch new recommendations
        fetchForYouRecommendations();
      }
    } else {
      // Missing prerequisites, stop loading
      setForYouLoading(false);
      forYouAttempted.current = true;
    }
  }, [articles, sourceLoadingStates, preferencesLoaded, preferences.topics]);

  const fetchPreferences = async () => {
    try {
      const response = await fetch("/api/preferences", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const prefsData = await response.json();
        const prefs = {
          topics: prefsData.topics || [],
          custom_rss_feeds: prefsData.custom_rss_feeds || [],
        };
        setPreferences(prefs);
        setOriginalPreferences(prefs);

        // Show schema error if present
        if (prefsData.schemaError) {
          console.warn("Schema error detected:", prefsData.schemaError);
        }
      } else {
        const errorData = await response.json();
        console.error("Error fetching preferences:", errorData);
      }
    } catch (err) {
      console.error("Failed to load preferences:", err);
    } finally {
      setPreferencesLoaded(true); // Mark preferences as loaded regardless of success/failure
    }
  };

  const fetchArticles = async () => {
    setLoading(true);
    setRssErrors([]);
    setArticles([]);
    setSourceLoadingStates({});

    const sources = [];

    // Add Google News source if topics are provided
    if (preferences.topics.length > 0) {
      sources.push("google_news");
    }

    // Add custom feeds source if custom feeds are provided
    if (preferences.custom_rss_feeds.length > 0) {
      sources.push("custom_feeds");
    }

    if (sources.length === 0) {
      setLoading(false);
      return;
    }

    // Initialize loading states for all sources
    const initialLoadingStates: Record<string, SourceLoadingState> = {};
    sources.forEach((source) => {
      initialLoadingStates[source] = {
        isLoading: true,
        hasError: false,
        articles: [],
      };
    });
    setSourceLoadingStates(initialLoadingStates);

    // Fetch each source individually
    const fetchPromises = sources.map(async (source) => {
      try {
        const response = await fetch("/api/articles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topics: preferences.topics,
            custom_rss_feeds: preferences.custom_rss_feeds,
            source: source,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || `Failed to fetch ${source}`);
        }

        // Update loading state for this source
        setSourceLoadingStates((prev) => ({
          ...prev,
          [source]: {
            isLoading: false,
            hasError: false,
            articles: result.articles || [],
          },
        }));

        // Add articles to the main articles list with deduplication
        setArticles((prev) => {
          const existingLinks = new Set(prev.map((article) => article.link));
          const newArticles = (result.articles || []).filter(
            (article: Article) =>
              article.link && !existingLinks.has(article.link)
          );
          const combinedArticles = [...prev, ...newArticles];

          // Sort by publication date (most recent first)
          return combinedArticles.sort((a, b) => {
            const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
            const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
            return dateB - dateA;
          });
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : `Failed to fetch ${source}`;

        // Update loading state for this source with error
        setSourceLoadingStates((prev) => ({
          ...prev,
          [source]: {
            isLoading: false,
            hasError: true,
            errorMessage,
            articles: [],
          },
        }));

        // Add to RSS errors
        setRssErrors((prev) => [...prev, errorMessage]);
      }
    });

    // Wait for all sources to complete
    await Promise.all(fetchPromises);
    setLoading(false);
  };

  const fetchForYouRecommendations = async () => {
    // Clear previous articles and errors
    setForYouArticles([]);
    setForYouError(false);

    try {
      const response = await fetch("/api/articles/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articles: articles,
          topics: preferences.topics,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to get recommendations");
      }

      const recommendedArticles = result.recommendedArticles || [];
      setForYouArticles(recommendedArticles);

      // Save to localStorage cache
      saveForYouCache(recommendedArticles);
    } catch (err) {
      console.error("Error fetching For You recommendations:", err);
      setForYouError(true);
      setForYouArticles([]);
    } finally {
      setForYouLoading(false);
    }
  };

  const handleGenerateClick = (article: Article) => {
    setSelectedArticle(article);
    setShowGenerateModal(true);
  };

  const generatePosts = async (formData: CreatePostFormData) => {
    if (!selectedArticle) return;

    setGeneratingArticle(selectedArticle.link);
    setModalError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleData: {
            title: selectedArticle.title,
            url: selectedArticle.link,
          },
          tone: formData.tone,
          postType: formData.postType,
          customPrompt: formData.customPrompt,
          targetAudience: formData.targetAudience,
          keyPoints: formData.keyPoints,
          callToAction: formData.callToAction,
          includeHashtags: formData.includeHashtags,
          includeSourceArticle: formData.includeSourceArticle,
          maxLength: formData.maxLength,
        }),
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error("Error parsing response JSON:", jsonError);
        setModalError(
          "Received an invalid response from the server. Please try again."
        );
        return;
      }

      if (!response.ok) {
        if (response.status === 402) {
          setShowPaywall(true);
          return;
        }

        // Handle article parsing errors specifically
        if (
          response.status === 400 &&
          result.error === "Failed to scrape article content"
        ) {
          setModalError("Failed to scrape article content");
          return;
        }

        const errorMessage = result.error || "Failed to generate drafts";
        setModalError(errorMessage);
        return;
      }

      // Close modal and clear state
      setShowGenerateModal(false);
      setSelectedArticle(null);
      setModalError("");

      // Redirect to the post details page
      if (result.post && result.post.id) {
        router.push(`/posts/${result.post.id}`);
      }
    } catch (err) {
      setModalError("An unexpected error occurred");
    } finally {
      setGeneratingArticle(null);
    }
  };

  // Only show loading screen if preferences haven't loaded yet
  if (!preferencesLoaded) {
    return (
      <PageWrapper>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="mb-8">
        <PageTitle>Articles</PageTitle>
        <PageDescription>
          Stay updated with industry articles and create posts from trending topics
        </PageDescription>
      </div>

      <Tabs defaultValue="articles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="articles">
            <Newspaper className="h-4 w-4 mr-2" />
            Article Feed
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Settings className="h-4 w-4 mr-2" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-6">
          <ForYouSection
            articles={forYouArticles}
            onGenerateDrafts={handleGenerateClick}
            generatingArticle={generatingArticle}
            loading={forYouLoading}
            error={forYouError}
            hasAttempted={forYouAttempted.current}
          />
          <ArticlesList
            articles={articles}
            onGenerateDrafts={handleGenerateClick}
            generatingArticle={generatingArticle}
            loading={loading}
            onRefresh={fetchArticles}
            rssErrors={rssErrors}
            sourceLoadingStates={sourceLoadingStates}
            hasAttempted={!loading || articles.length > 0}
          />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <PreferencesPanel
            preferences={preferences}
            onUpdatePreferences={(newPrefs) => {
              setPreferences(newPrefs);
            }}
            originalPreferences={originalPreferences}
            onSaveSuccess={(savedPrefs) => {
              setOriginalPreferences(savedPrefs);
            }}
          />
        </TabsContent>
      </Tabs>

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}

      <CreatePostModal
        isOpen={showGenerateModal}
        onClose={() => {
          setShowGenerateModal(false);
          setSelectedArticle(null);
          setModalError("");
        }}
        onGenerate={generatePosts}
        isGenerating={generatingArticle === selectedArticle?.link}
        error={modalError}
        initialFormData={
          selectedArticle
            ? {
                topicTitle: selectedArticle.title,
                articleUrl: selectedArticle.link,
                articleTitle: selectedArticle.title,
              }
            : undefined
        }
      />
    </PageWrapper>
  );
}

