"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RSS_FEEDS, RSSFeed } from "@/lib/rss-feeds-data";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Plus,
  X,
} from "lucide-react";

interface RssFeedCategorySelectorProps {
  selectedFeeds: Set<string>;
  onToggleFeed: (url: string) => void;
  expandedCategories?: Set<string>;
  onToggleCategory?: (categoryName: string) => void;
  className?: string;
}

export function RssFeedCategorySelector({
  selectedFeeds,
  onToggleFeed,
  expandedCategories: externalExpandedCategories,
  onToggleCategory: externalToggleCategory,
  className = "",
}: RssFeedCategorySelectorProps) {
  // Use internal state if no external control is provided
  const [internalExpandedCategories, setInternalExpandedCategories] = useState<
    Set<string>
  >(new Set());

  const isControlled = externalExpandedCategories !== undefined;
  const expandedCategories = isControlled
    ? externalExpandedCategories
    : internalExpandedCategories;

  const toggleCategory = (categoryName: string) => {
    if (isControlled && externalToggleCategory) {
      externalToggleCategory(categoryName);
    } else {
      const newExpanded = new Set(internalExpandedCategories);
      if (newExpanded.has(categoryName)) {
        newExpanded.delete(categoryName);
      } else {
        newExpanded.add(categoryName);
      }
      setInternalExpandedCategories(newExpanded);
    }
  };

  const isFeedSelected = (url: string) => selectedFeeds.has(url);

  return (
    <div
      className={`space-y-3 max-h-[500px] overflow-y-auto border rounded-lg p-4 ${className}`}
    >
      {RSS_FEEDS.map((category) => {
        const isExpanded = expandedCategories.has(category.name);
        const categoryFeeds = category.feeds;
        const selectedInCategory = categoryFeeds.filter((feed) =>
          isFeedSelected(feed.url)
        ).length;

        return (
          <div
            key={category.name}
            className="border-b last:border-b-0 pb-3 last:pb-0"
          >
            <button
              onClick={() => toggleCategory(category.name)}
              className="w-full flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="font-medium text-gray-900">
                    {category.name}
                  </span>
                </div>
                {selectedInCategory > 0 && (
                  <span className="text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {selectedInCategory} selected
                  </span>
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="space-y-2 ml-6 mt-2">
                {categoryFeeds.map((feed) => {
                  const isSelected = isFeedSelected(feed.url);
                  return (
                    <div
                      key={feed.url}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded transition-colors"
                    >
                      <button
                        onClick={() => onToggleFeed(feed.url)}
                        className="flex items-center gap-2 flex-1 text-left"
                      >
                        <div
                          className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                            isSelected
                              ? "bg-blue-600 border-blue-600"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <Check className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {feed.title}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {feed.url}
                          </div>
                        </div>
                      </button>
                      <a
                        href={feed.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface PersonalRssFeedsManagerProps {
  personalFeeds: string[];
  onAddFeed: (url: string) => void;
  onRemoveFeed: (url: string) => void;
  className?: string;
}

export function PersonalRssFeedsManager({
  personalFeeds,
  onAddFeed,
  onRemoveFeed,
  className = "",
}: PersonalRssFeedsManagerProps) {
  const [newFeedUrl, setNewFeedUrl] = useState("");

  const handleAddFeed = () => {
    if (newFeedUrl.trim() && !personalFeeds.includes(newFeedUrl.trim())) {
      onAddFeed(newFeedUrl.trim());
      setNewFeedUrl("");
    }
  };

  return (
    <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <Label className="text-base font-semibold">
          Personal feeds{" "}
          <span className="text-gray-500 font-normal">(Optional)</span>
        </Label>
        <span className="text-sm text-gray-500">
          {personalFeeds.length} feed{personalFeeds.length !== 1 ? "s" : ""}
        </span>
      </div>

      {personalFeeds.length > 0 && (
        <div className="space-y-2 mb-3">
          {personalFeeds.map((feed, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-white p-2 rounded"
            >
              <Input value={feed} disabled className="flex-1 text-sm" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRemoveFeed(feed)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="https://example.com/rss"
          value={newFeedUrl}
          onChange={(e) => setNewFeedUrl(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleAddFeed()}
          className="flex-1"
        />
        <Button onClick={handleAddFeed} disabled={!newFeedUrl.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Feed
        </Button>
      </div>
      <p className="text-sm text-gray-500 mt-2">
        Add your own RSS feed URLs to include in your news feed
      </p>
    </div>
  );
}

interface RssFeedSelectorProps {
  selectedFeeds: string[];
  onSelectedFeedsChange: (feeds: string[]) => void;
  showPersonalFeeds?: boolean;
  className?: string;
}

export function RssFeedSelector({
  selectedFeeds,
  onSelectedFeedsChange,
  showPersonalFeeds = true,
  className = "",
}: RssFeedSelectorProps) {
  const [selectedFeedsSet, setSelectedFeedsSet] = useState<Set<string>>(
    new Set(selectedFeeds)
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  // Sync selectedFeedsSet with external selectedFeeds prop
  useEffect(() => {
    setSelectedFeedsSet(new Set(selectedFeeds));
  }, [selectedFeeds]);

  // Get all feed URLs from the RSS_FEEDS data
  const getAllFeedUrls = () => {
    return RSS_FEEDS.flatMap((category) =>
      category.feeds.map((feed) => feed.url)
    );
  };

  // Get personal feeds (not in the predefined list)
  const getPersonalFeeds = () => {
    const predefinedUrls = getAllFeedUrls();
    return selectedFeeds.filter((url) => !predefinedUrls.includes(url));
  };

  const toggleFeed = (url: string) => {
    const newSelectedFeeds = new Set(selectedFeedsSet);
    if (newSelectedFeeds.has(url)) {
      newSelectedFeeds.delete(url);
    } else {
      newSelectedFeeds.add(url);
    }
    setSelectedFeedsSet(newSelectedFeeds);
    onSelectedFeedsChange(Array.from(newSelectedFeeds));
  };

  const addPersonalFeed = (url: string) => {
    if (!selectedFeedsSet.has(url)) {
      const newSelectedFeeds = new Set(selectedFeedsSet);
      newSelectedFeeds.add(url);
      setSelectedFeedsSet(newSelectedFeeds);
      onSelectedFeedsChange(Array.from(newSelectedFeeds));
    }
  };

  const removePersonalFeed = (url: string) => {
    const newSelectedFeeds = new Set(selectedFeedsSet);
    newSelectedFeeds.delete(url);
    setSelectedFeedsSet(newSelectedFeeds);
    onSelectedFeedsChange(Array.from(newSelectedFeeds));
  };

  const personalFeeds = getPersonalFeeds();

  return (
    <div className={className}>
      <Label className="text-base font-semibold mb-3 block">
        RSS Feed Sources
      </Label>
      <p className="text-sm text-gray-500 mb-4">
        Select RSS feeds from the categories below to customize your news feed
      </p>

      <RssFeedCategorySelector
        selectedFeeds={selectedFeedsSet}
        onToggleFeed={toggleFeed}
        expandedCategories={expandedCategories}
        onToggleCategory={(categoryName) => {
          const newExpanded = new Set(expandedCategories);
          if (newExpanded.has(categoryName)) {
            newExpanded.delete(categoryName);
          } else {
            newExpanded.add(categoryName);
          }
          setExpandedCategories(newExpanded);
        }}
      />

      {showPersonalFeeds && (
        <div className="mt-4">
          <PersonalRssFeedsManager
            personalFeeds={personalFeeds}
            onAddFeed={addPersonalFeed}
            onRemoveFeed={removePersonalFeed}
          />
        </div>
      )}
    </div>
  );
}
