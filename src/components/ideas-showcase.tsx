"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Grid3x3, List, RefreshCw, Clock, ExternalLink, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CardTitleWithIcon } from "@/components/ui/card-title-with-icon";
import { Button } from "@/components/ui/button";
import { LabelWithCount } from "@/components/ui/label-with-count";
import {
  CreatePostModal,
  CreatePostFormData,
} from "@/components/create-post-modal";

export interface Idea {
  title: string;
  description: string;
  topic?: string; // Optional topic for color coding
  source?: string; // Optional source article title if idea was inspired by a specific article
  articleUrl?: string; // Optional article URL for loading the article in the modal
}

/**
 * Format generated time for display
 */
function formatGeneratedTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMins < 1) {
    return "just now";
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  } else {
    // For older dates, show the actual date
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}

/**
 * Format cooldown time for display (simplified to reduce flickering)
 * Uses consistent rounding to prevent value jumping
 */
function formatCooldownTime(remainingMs: number): string {
  // Use consistent Math.floor to prevent flickering from rounding differences
  const remainingSeconds = Math.floor(remainingMs / 1000);
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  const remainingHours = Math.floor(remainingMinutes / 60);
  const remainingDays = Math.floor(remainingHours / 24);

  // Simplify: only show the largest unit to reduce flickering
  // Only update when the displayed unit actually changes
  if (remainingDays > 0) {
    return `${remainingDays} day${remainingDays !== 1 ? "s" : ""}`;
  } else if (remainingHours > 0) {
    return `${remainingHours} hour${remainingHours !== 1 ? "s" : ""}`;
  } else if (remainingMinutes > 0) {
    return `${remainingMinutes} minute${remainingMinutes !== 1 ? "s" : ""}`;
  } else {
    return "less than a minute";
  }
}

type TopicColor = {
  bg: string;
  border: string;
  icon: string;
  burstBg: string;
  burstBorder: string;
  activeGlow: string;
  activeBg: string;
  activeBorder: string;
  activeIcon: string;
  activeRing: string;
};

const colorPalette: readonly TopicColor[] = [
  {
    bg: "bg-yellow-300/20 dark:bg-yellow-400/15",
    border: "border-yellow-400/30 dark:border-yellow-300/25",
    icon: "text-yellow-500/60 dark:text-yellow-400/50",
    burstBg: "bg-yellow-400/20",
    burstBorder: "border-yellow-400/40",
    activeGlow: "bg-yellow-400/40",
    activeBg: "bg-yellow-400/30 dark:bg-yellow-300/25",
    activeBorder: "border-yellow-400/50",
    activeIcon: "text-yellow-600/90 dark:text-yellow-300/80",
    activeRing: "ring-yellow-400/60",
  },
  {
    bg: "bg-blue-300/20 dark:bg-blue-400/15",
    border: "border-blue-400/30 dark:border-blue-300/25",
    icon: "text-blue-500/60 dark:text-blue-400/50",
    burstBg: "bg-blue-400/20",
    burstBorder: "border-blue-400/40",
    activeGlow: "bg-blue-400/40",
    activeBg: "bg-blue-400/30 dark:bg-blue-300/25",
    activeBorder: "border-blue-400/50",
    activeIcon: "text-blue-600/90 dark:text-blue-300/80",
    activeRing: "ring-blue-400/60",
  },
  {
    bg: "bg-purple-300/20 dark:bg-purple-400/15",
    border: "border-purple-400/30 dark:border-purple-300/25",
    icon: "text-purple-500/60 dark:text-purple-400/50",
    burstBg: "bg-purple-400/20",
    burstBorder: "border-purple-400/40",
    activeGlow: "bg-purple-400/40",
    activeBg: "bg-purple-400/30 dark:bg-purple-300/25",
    activeBorder: "border-purple-400/50",
    activeIcon: "text-purple-600/90 dark:text-purple-300/80",
    activeRing: "ring-purple-400/60",
  },
  {
    bg: "bg-green-300/20 dark:bg-green-400/15",
    border: "border-green-400/30 dark:border-green-300/25",
    icon: "text-green-500/60 dark:text-green-400/50",
    burstBg: "bg-green-400/20",
    burstBorder: "border-green-400/40",
    activeGlow: "bg-green-400/40",
    activeBg: "bg-green-400/30 dark:bg-green-300/25",
    activeBorder: "border-green-400/50",
    activeIcon: "text-green-600/90 dark:text-green-300/80",
    activeRing: "ring-green-400/60",
  },
  {
    bg: "bg-pink-300/20 dark:bg-pink-400/15",
    border: "border-pink-400/30 dark:border-pink-300/25",
    icon: "text-pink-500/60 dark:text-pink-400/50",
    burstBg: "bg-pink-400/20",
    burstBorder: "border-pink-400/40",
    activeGlow: "bg-pink-400/40",
    activeBg: "bg-pink-400/30 dark:bg-pink-300/25",
    activeBorder: "border-pink-400/50",
    activeIcon: "text-pink-600/90 dark:text-pink-300/80",
    activeRing: "ring-pink-400/60",
  },
  {
    bg: "bg-orange-300/20 dark:bg-orange-400/15",
    border: "border-orange-400/30 dark:border-orange-300/25",
    icon: "text-orange-500/60 dark:text-orange-400/50",
    burstBg: "bg-orange-400/20",
    burstBorder: "border-orange-400/40",
    activeGlow: "bg-orange-400/40",
    activeBg: "bg-orange-400/30 dark:bg-orange-300/25",
    activeBorder: "border-orange-400/50",
    activeIcon: "text-orange-600/90 dark:text-orange-300/80",
    activeRing: "ring-orange-400/60",
  },
  {
    bg: "bg-teal-300/20 dark:bg-teal-400/15",
    border: "border-teal-400/30 dark:border-teal-300/25",
    icon: "text-teal-500/60 dark:text-teal-400/50",
    burstBg: "bg-teal-400/20",
    burstBorder: "border-teal-400/40",
    activeGlow: "bg-teal-400/40",
    activeBg: "bg-teal-400/30 dark:bg-teal-300/25",
    activeBorder: "border-teal-400/50",
    activeIcon: "text-teal-600/90 dark:text-teal-300/80",
    activeRing: "ring-teal-400/60",
  },
  {
    bg: "bg-amber-300/20 dark:bg-amber-400/15",
    border: "border-amber-400/30 dark:border-amber-300/25",
    icon: "text-amber-500/60 dark:text-amber-400/50",
    burstBg: "bg-amber-400/20",
    burstBorder: "border-amber-400/40",
    activeGlow: "bg-amber-400/40",
    activeBg: "bg-amber-400/30 dark:bg-amber-300/25",
    activeBorder: "border-amber-400/50",
    activeIcon: "text-amber-600/90 dark:text-amber-300/80",
    activeRing: "ring-amber-400/60",
  },
  {
    bg: "bg-cyan-300/20 dark:bg-cyan-400/15",
    border: "border-cyan-400/30 dark:border-cyan-300/25",
    icon: "text-cyan-500/60 dark:text-cyan-400/50",
    burstBg: "bg-cyan-400/20",
    burstBorder: "border-cyan-400/40",
    activeGlow: "bg-cyan-400/40",
    activeBg: "bg-cyan-400/30 dark:bg-cyan-300/25",
    activeBorder: "border-cyan-400/50",
    activeIcon: "text-cyan-600/90 dark:text-cyan-300/80",
    activeRing: "ring-cyan-400/60",
  },
  {
    bg: "bg-lime-300/20 dark:bg-lime-400/15",
    border: "border-lime-400/30 dark:border-lime-300/25",
    icon: "text-lime-500/60 dark:text-lime-400/50",
    burstBg: "bg-lime-400/20",
    burstBorder: "border-lime-400/40",
    activeGlow: "bg-lime-400/40",
    activeBg: "bg-lime-400/30 dark:bg-lime-300/25",
    activeBorder: "border-lime-400/50",
    activeIcon: "text-lime-600/90 dark:text-lime-300/80",
    activeRing: "ring-lime-400/60",
  },
  {
    bg: "bg-sky-300/20 dark:bg-sky-400/15",
    border: "border-sky-400/30 dark:border-sky-300/25",
    icon: "text-sky-500/60 dark:text-sky-400/50",
    burstBg: "bg-sky-400/20",
    burstBorder: "border-sky-400/40",
    activeGlow: "bg-sky-400/40",
    activeBg: "bg-sky-400/30 dark:bg-sky-300/25",
    activeBorder: "border-sky-400/50",
    activeIcon: "text-sky-600/90 dark:text-sky-300/80",
    activeRing: "ring-sky-400/60",
  },
  {
    bg: "bg-indigo-300/20 dark:bg-indigo-400/15",
    border: "border-indigo-400/30 dark:border-indigo-300/25",
    icon: "text-indigo-500/60 dark:text-indigo-400/50",
    burstBg: "bg-indigo-400/20",
    burstBorder: "border-indigo-400/40",
    activeGlow: "bg-indigo-400/40",
    activeBg: "bg-indigo-400/30 dark:bg-indigo-300/25",
    activeBorder: "border-indigo-400/50",
    activeIcon: "text-indigo-600/90 dark:text-indigo-300/80",
    activeRing: "ring-indigo-400/60",
  },
  {
    bg: "bg-violet-300/20 dark:bg-violet-400/15",
    border: "border-violet-400/30 dark:border-violet-300/25",
    icon: "text-violet-500/60 dark:text-violet-400/50",
    burstBg: "bg-violet-400/20",
    burstBorder: "border-violet-400/40",
    activeGlow: "bg-violet-400/40",
    activeBg: "bg-violet-400/30 dark:bg-violet-300/25",
    activeBorder: "border-violet-400/50",
    activeIcon: "text-violet-600/90 dark:text-violet-300/80",
    activeRing: "ring-violet-400/60",
  },
  {
    bg: "bg-fuchsia-300/20 dark:bg-fuchsia-400/15",
    border: "border-fuchsia-400/30 dark:border-fuchsia-300/25",
    icon: "text-fuchsia-500/60 dark:text-fuchsia-400/50",
    burstBg: "bg-fuchsia-400/20",
    burstBorder: "border-fuchsia-400/40",
    activeGlow: "bg-fuchsia-400/40",
    activeBg: "bg-fuchsia-400/30 dark:bg-fuchsia-300/25",
    activeBorder: "border-fuchsia-400/50",
    activeIcon: "text-fuchsia-600/90 dark:text-fuchsia-300/80",
    activeRing: "ring-fuchsia-400/60",
  },
  {
    bg: "bg-rose-300/20 dark:bg-rose-400/15",
    border: "border-rose-400/30 dark:border-rose-300/25",
    icon: "text-rose-500/60 dark:text-rose-400/50",
    burstBg: "bg-rose-400/20",
    burstBorder: "border-rose-400/40",
    activeGlow: "bg-rose-400/40",
    activeBg: "bg-rose-400/30 dark:bg-rose-300/25",
    activeBorder: "border-rose-400/50",
    activeIcon: "text-rose-600/90 dark:text-rose-300/80",
    activeRing: "ring-rose-400/60",
  },
  {
    bg: "bg-emerald-300/20 dark:bg-emerald-400/15",
    border: "border-emerald-400/30 dark:border-emerald-300/25",
    icon: "text-emerald-500/60 dark:text-emerald-400/50",
    burstBg: "bg-emerald-400/20",
    burstBorder: "border-emerald-400/40",
    activeGlow: "bg-emerald-400/40",
    activeBg: "bg-emerald-400/30 dark:bg-emerald-300/25",
    activeBorder: "border-emerald-400/50",
    activeIcon: "text-emerald-600/90 dark:text-emerald-300/80",
    activeRing: "ring-emerald-400/60",
  },
  {
    bg: "bg-stone-300/20 dark:bg-stone-400/15",
    border: "border-stone-400/30 dark:border-stone-300/25",
    icon: "text-stone-500/60 dark:text-stone-400/50",
    burstBg: "bg-stone-400/20",
    burstBorder: "border-stone-400/40",
    activeGlow: "bg-stone-400/40",
    activeBg: "bg-stone-400/30 dark:bg-stone-300/25",
    activeBorder: "border-stone-400/50",
    activeIcon: "text-stone-600/90 dark:text-stone-300/80",
    activeRing: "ring-stone-400/60",
  },
  {
    bg: "bg-slate-300/20 dark:bg-slate-400/15",
    border: "border-slate-400/30 dark:border-slate-300/25",
    icon: "text-slate-500/60 dark:text-slate-400/50",
    burstBg: "bg-slate-400/20",
    burstBorder: "border-slate-400/40",
    activeGlow: "bg-slate-400/40",
    activeBg: "bg-slate-400/30 dark:bg-slate-300/25",
    activeBorder: "border-slate-400/50",
    activeIcon: "text-slate-600/90 dark:text-slate-300/80",
    activeRing: "ring-slate-400/60",
  },
  {
    bg: "bg-red-300/20 dark:bg-red-400/15",
    border: "border-red-400/30 dark:border-red-300/25",
    icon: "text-red-500/60 dark:text-red-400/50",
    burstBg: "bg-red-400/20",
    burstBorder: "border-red-400/40",
    activeGlow: "bg-red-400/40",
    activeBg: "bg-red-400/30 dark:bg-red-300/25",
    activeBorder: "border-red-400/50",
    activeIcon: "text-red-600/90 dark:text-red-300/80",
    activeRing: "ring-red-400/60",
  },
  {
    bg: "bg-neutral-300/20 dark:bg-neutral-400/15",
    border: "border-neutral-400/30 dark:border-neutral-300/25",
    icon: "text-neutral-500/60 dark:text-neutral-400/50",
    burstBg: "bg-neutral-400/20",
    burstBorder: "border-neutral-400/40",
    activeGlow: "bg-neutral-400/40",
    activeBg: "bg-neutral-400/30 dark:bg-neutral-300/25",
    activeBorder: "border-neutral-400/50",
    activeIcon: "text-neutral-600/90 dark:text-neutral-300/80",
    activeRing: "ring-neutral-400/60",
  },
];

const defaultTopicColor = colorPalette[0];

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  spawnTime: number;
  isBursting?: boolean;
  burstStartTime?: number; // Track when bursting animation started
  idea?: Idea;
  topic?: string; // Store topic for color coding
  gridCell?: {
    centerX: number;
    centerY: number;
    maxMovementX: number;
    maxMovementY: number;
    direction?: string; // Direction name (N, S, E, W, etc.)
    biasAmount?: number; // Bias amount for display
    baseCenterX?: number;
    baseCenterY?: number;
    offsetX?: number;
    offsetY?: number;
    offsetXPercent?: number;
    offsetYPercent?: number;
  };
}

type ViewMode = "bubble" | "list";

interface IdeasShowcaseProps {
  ideas: Idea[];
  burstInterval?: number;
  ideaDisplayDuration?: number;
  className?: string;
  title?: string;
  description?: string;
  showDebug?: boolean;
  loading?: boolean;
  cooldownRemaining?: number | null;
  generatedAt?: string | null;
  onRefresh?: () => void;
}

export function IdeasShowcase({
  ideas,
  burstInterval = 4000,
  ideaDisplayDuration = 3000,
  className,
  title = "Content Ideas",
  description = "Click bubbles to discover creative content ideas and inspiration",
  showDebug = false,
  loading = false,
  cooldownRemaining = null,
  generatedAt = null,
  onRefresh,
}: IdeasShowcaseProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("bubble");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [mounted, setMounted] = useState(false);
  const [activeBubbleId, setActiveBubbleId] = useState<number | null>(null);
  const [activeIdeaData, setActiveIdeaData] = useState<{
    idea: Idea;
    bubbleX: number;
    bubbleY: number;
    topic?: string; // Store the bubble's topic for color consistency
  } | null>(null);
  const [bubblePositions, setBubblePositions] = useState<
    Map<number, { x: number; y: number }>
  >(new Map());
  const [gridLayout, setGridLayout] = useState<{
    cols: number;
    rows: number;
    cellWidth: number;
    cellHeight: number;
    padding: number;
  } | null>(null);
  const nextIdRef = useRef<number>(0);
  const initializedRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRefs = useRef<
    Map<number, { showCard?: NodeJS.Timeout; cleanup?: NodeJS.Timeout }>
  >(new Map());
  const router = useRouter();

  // Custom prompt modal state
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [ideaForCreatePost, setIdeaForCreatePost] = useState<Idea | null>(null);

  const topicColorLookup = useMemo<Record<string, TopicColor>>(() => {
    const lookup: Record<string, TopicColor> = {};
    const seen = new Set<string>();
    let paletteIndex = 0;

    ideas.forEach((idea) => {
      const topic = idea.topic?.trim().toLowerCase();
      if (!topic || seen.has(topic)) return;
      lookup[topic] = colorPalette[paletteIndex % colorPalette.length];
      seen.add(topic);
      paletteIndex += 1;
    });

    return lookup;
  }, [ideas]);

  const getTopicColor = useCallback(
    (topic?: string): TopicColor => {
      if (!topic) return defaultTopicColor;
      const normalized = topic.trim().toLowerCase();
      return topicColorLookup[normalized] ?? defaultTopicColor;
    },
    [topicColorLookup]
  );

  // Get unique topics with their original casing for the legend
  const uniqueTopics = useMemo(() => {
    const topicMap = new Map<string, string>(); // normalized -> original
    ideas.forEach((idea) => {
      if (idea.topic) {
        const normalized = idea.topic.trim().toLowerCase();
        const original = idea.topic.trim();
        if (!topicMap.has(normalized)) {
          topicMap.set(normalized, original);
        }
      }
    });
    // Return topics sorted by original name, preserving the order they appear in the lookup
    return Array.from(topicMap.entries())
      .map(([normalized, original]) => ({ normalized, original }))
      .sort((a, b) => a.original.localeCompare(b.original));
  }, [ideas]);

  // Group ideas by topic/category
  const ideasByCategory = useMemo(() => {
    const grouped = new Map<string, Idea[]>();

    ideas.forEach((idea) => {
      const category = idea.topic?.trim() || "General";
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(idea);
    });

    // Sort categories: "General" last, others alphabetically
    const sortedCategories = Array.from(grouped.entries()).sort((a, b) => {
      if (a[0] === "General") return 1;
      if (b[0] === "General") return -1;
      return a[0].localeCompare(b[0]);
    });

    return sortedCategories;
  }, [ideas]);

  const [floatPlans, setFloatPlans] = useState<
    Map<number, { x: number; y: number }>
  >(new Map());
  const totalBubbleCount = Math.max(0, ideas.length);

  // Calculate optimal grid layout for given number of items
  const calculateGridLayout = (
    itemCount: number,
    containerWidth: number,
    containerHeight: number
  ) => {
    // Calculate aspect ratio
    const aspectRatio = containerWidth / containerHeight;

    // Find best grid dimensions (close to square grid, but adjusted for aspect ratio)
    let cols = Math.ceil(Math.sqrt(itemCount * aspectRatio));
    let rows = Math.ceil(itemCount / cols);

    // Ensure rows * cols >= itemCount
    while (cols * rows < itemCount) {
      if (cols <= rows) {
        cols++;
      } else {
        rows++;
      }
    }

    // Calculate cell dimensions with padding
    const padding = 20; // Padding around edges
    const cellWidth = (containerWidth - padding * 2) / cols;
    const cellHeight = (containerHeight - padding * 2) / rows;

    return {
      cols,
      rows,
      cellWidth,
      cellHeight,
      padding,
    };
  };

  // STEP 1: Initialize bubbles ONCE - never recreate them automatically
  useEffect(() => {
    if (totalBubbleCount === 0 || initializedRef.current) return;

    initializedRef.current = true;
    setMounted(true);

    // Wait for container to be available to get dimensions
    const initializeBubbles = () => {
      if (!containerRef.current) {
        // Retry after a short delay if container isn't ready
        setTimeout(initializeBubbles, 100);
        return;
      }

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      // Assign a random idea to each bubble for color coding (bubble keeps its idea when clicked)
      const shuffledIdeasForBubbles = [...ideas];
      for (let i = shuffledIdeasForBubbles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledIdeasForBubbles[i], shuffledIdeasForBubbles[j]] = [
          shuffledIdeasForBubbles[j],
          shuffledIdeasForBubbles[i],
        ];
      }

      // Calculate optimal grid layout
      const grid = calculateGridLayout(
        totalBubbleCount,
        containerWidth,
        containerHeight
      );
      setGridLayout(grid); // Store grid layout for debugging

      const initialBubbles: Bubble[] = [];

      for (let index = 0; index < totalBubbleCount; index++) {
        const assignedIdea =
          shuffledIdeasForBubbles[index % shuffledIdeasForBubbles.length];
        const baseSize = Math.random() * 60 + 80;
        const availableDiameter = Math.max(
          Math.min(grid.cellWidth, grid.cellHeight) - 40,
          20
        );
        const size = Math.min(baseSize, availableDiameter);
        const radius = size / 2;

        // Calculate grid position
        const col = index % grid.cols;
        const row = Math.floor(index / grid.cols);

        // Calculate cell boundaries
        const cellLeft = grid.padding + col * grid.cellWidth;
        const cellRight = cellLeft + grid.cellWidth;
        const cellTop = grid.padding + row * grid.cellHeight;
        const cellBottom = cellTop + grid.cellHeight;

        // Calculate cell center
        const cellCenterX = (cellLeft + cellRight) / 2;
        const cellCenterY = (cellTop + cellBottom) / 2;

        // Maximum movement within cell (ensure bubble doesn't overflow cell bounds)
        const rawMaxMovementX = grid.cellWidth / 2 - radius - 10;
        const rawMaxMovementY = grid.cellHeight / 2 - radius - 10;
        const maxMovementX = Math.max(Math.min(rawMaxMovementX, 50), 0);
        const maxMovementY = Math.max(Math.min(rawMaxMovementY, 50), 0);

        // Allow initial offset up to 3% of container dimensions (limited by available movement)
        const maxOffsetXPx = Math.min(0.03 * containerWidth, rawMaxMovementX);
        const maxOffsetYPx = Math.min(0.03 * containerHeight, rawMaxMovementY);
        const initialOffsetX =
          maxOffsetXPx > 0 ? (Math.random() * 2 - 1) * maxOffsetXPx : 0;
        const initialOffsetY =
          maxOffsetYPx > 0 ? (Math.random() * 2 - 1) * maxOffsetYPx : 0;

        // Apply offset to center and clamp within cell boundaries
        const adjustedCenterX = Math.min(
          Math.max(cellCenterX + initialOffsetX, cellLeft + radius),
          cellRight - radius
        );
        const adjustedCenterY = Math.min(
          Math.max(cellCenterY + initialOffsetY, cellTop + radius),
          cellBottom - radius
        );

        const finalOffsetX = adjustedCenterX - cellCenterX;
        const finalOffsetY = adjustedCenterY - cellCenterY;

        // Convert to positioning values
        const bubbleCenterXPercent = (adjustedCenterX / containerWidth) * 100;
        const bubbleCenterYPercent = (adjustedCenterY / containerHeight) * 100;
        const bubbleLeftPercent =
          ((adjustedCenterX - radius) / containerWidth) * 100;
        const bubbleTopPercent =
          ((adjustedCenterY - radius) / containerHeight) * 100;
        const baseCenterXPercent = (cellCenterX / containerWidth) * 100;
        const baseCenterYPercent = (cellCenterY / containerHeight) * 100;
        const finalOffsetXPercent = (finalOffsetX / containerWidth) * 100;
        const finalOffsetYPercent = (finalOffsetY / containerHeight) * 100;

        const finalOffsetMagnitude = Math.sqrt(
          finalOffsetX * finalOffsetX + finalOffsetY * finalOffsetY
        );
        const offsetHorizontal =
          finalOffsetX > 0 ? "E" : finalOffsetX < 0 ? "W" : "";
        const offsetVertical =
          finalOffsetY > 0 ? "S" : finalOffsetY < 0 ? "N" : "";
        const offsetDirection = offsetVertical + offsetHorizontal || "center";

        initialBubbles.push({
          id: nextIdRef.current++,
          x: bubbleLeftPercent,
          y: bubbleTopPercent,
          size,
          spawnTime: Date.now(),
          idea: assignedIdea,
          topic: assignedIdea?.topic,
          gridCell: {
            centerX: bubbleCenterXPercent,
            centerY: bubbleCenterYPercent,
            maxMovementX: (maxMovementX / containerWidth) * 100,
            maxMovementY: (maxMovementY / containerHeight) * 100,
            direction: offsetDirection,
            biasAmount: finalOffsetMagnitude,
            baseCenterX: baseCenterXPercent,
            baseCenterY: baseCenterYPercent,
            offsetX: finalOffsetX,
            offsetY: finalOffsetY,
            offsetXPercent: finalOffsetXPercent,
            offsetYPercent: finalOffsetYPercent,
          },
        });
      }

      setBubbles(initialBubbles);
    };

    // Initialize bubbles after a short delay to ensure container is rendered
    setTimeout(initializeBubbles, 50);
  }, [ideas, totalBubbleCount]);

  // Safety cleanup: remove any stale bursting bubbles (should have been removed by timeout)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setBubbles((prev) => {
        const now = Date.now();
        // Remove bursting bubbles that have been bursting for more than 600ms (animation is 300ms + buffer)
        const staleBursting = prev.filter(
          (b) =>
            b.isBursting && b.burstStartTime && now - b.burstStartTime > 600
        );
        if (staleBursting.length === 0) return prev;

        // Remove stale bursting bubbles
        return prev.filter(
          (b) =>
            !b.isBursting || !b.burstStartTime || now - b.burstStartTime <= 600
        );
      });
    }, 500); // Check every 500ms

    return () => clearInterval(cleanupInterval);
  }, []);

  // Track which ideas have been used (by index in original ideas array)
  const [usedIdeaIndices, setUsedIdeaIndices] = useState<Set<number>>(
    new Set()
  );

  const getNextIdea = useCallback((): Idea => {
    if (ideas.length === 0) {
      // Fallback if no ideas available
      return { title: "", description: "" };
    }

    // Get available ideas (not yet used)
    const availableIdeas = ideas.filter(
      (_, index) => !usedIdeaIndices.has(index)
    );

    // If all ideas have been used, reset and use all ideas again
    if (availableIdeas.length === 0) {
      setUsedIdeaIndices(new Set());
      const randomIndex = Math.floor(Math.random() * ideas.length);
      setUsedIdeaIndices((prev) => {
        const next = new Set(prev);
        next.add(randomIndex);
        return next;
      });
      return ideas[randomIndex];
    }

    // Pick a random idea from available ones
    const randomIndex = Math.floor(Math.random() * availableIdeas.length);
    const selectedIdea = availableIdeas[randomIndex];

    // Find the index of this idea in the original ideas array and mark it as used
    const originalIndex = ideas.findIndex(
      (idea) =>
        idea.title === selectedIdea.title &&
        idea.description === selectedIdea.description
    );

    if (originalIndex !== -1) {
      setUsedIdeaIndices((prev) => {
        const next = new Set(prev);
        next.add(originalIndex);
        return next;
      });
    }

    return selectedIdea;
  }, [ideas, usedIdeaIndices]);

  // Memoize position update callback to prevent infinite loops
  const handlePositionUpdate = useCallback(
    (id: number, x: number, y: number) => {
      setBubblePositions((prev) => {
        const existing = prev.get(id);
        // Only update if position actually changed (avoid unnecessary re-renders)
        if (
          existing &&
          Math.abs(existing.x - x) < 1 &&
          Math.abs(existing.y - y) < 1
        ) {
          return prev;
        }
        const next = new Map(prev);
        next.set(id, { x, y });
        return next;
      });
    },
    []
  );

  const handleFloatPlanUpdate = useCallback(
    (id: number, plan: { x: number; y: number }) => {
      // setFloatPlans((prev) => { // This line was removed as per the edit hint
      //   const next = new Map(prev);
      //   next.set(id, plan);
      //   return next;
      // });
    },
    []
  );

  useEffect(() => {
    if (!bubbles.length && floatPlans.size === 0) return;
    const activeIds = new Set(bubbles.map((b) => b.id));
    // setFloatPlans((prev) => { // This line was removed as per the edit hint
    //   const next = new Map(prev);
    //   for (const key of Array.from(next.keys())) {
    //     if (!activeIds.has(key)) {
    //       next.delete(key);
    //     }
    //   }
    //   return next;
    // });
  }, [bubbles]);

  // Function to burst a bubble
  const burstBubble = useCallback(
    (bubbleId: number) => {
      setBubbles((prev) => {
        const bubble = prev.find((b) => b.id === bubbleId);
        if (!bubble || bubble.isBursting) return prev;

        // Use the bubble's assigned idea when bursting. Fall back to the next idea only if missing.
        const idea = bubble.idea ?? getNextIdea();
        if (!idea || !idea.title) return prev; // Skip if no valid idea

        // Mark the idea as used (for fallback / analytics tracking)
        const originalIndex = ideas.findIndex(
          (i) => i.title === idea.title && i.description === idea.description
        );
        if (originalIndex !== -1) {
          setUsedIdeaIndices((prev) => {
            const next = new Set(prev);
            next.add(originalIndex);
            return next;
          });
        }

        // Mark as bursting (no replacement bubble - bubbles just disappear)
        return prev.map((b) =>
          b.id === bubbleId
            ? {
                ...b,
                isBursting: true,
                burstStartTime: Date.now(),
                idea,
                topic: idea.topic ?? b.topic,
              }
            : b
        );
      });

      // Clear previous bubble's card and timeouts if exists
      if (activeBubbleId !== null && activeBubbleId !== bubbleId) {
        const prevTimeouts = timeoutRefs.current.get(activeBubbleId);
        if (prevTimeouts) {
          if (prevTimeouts.showCard) clearTimeout(prevTimeouts.showCard);
          if (prevTimeouts.cleanup) clearTimeout(prevTimeouts.cleanup);
          timeoutRefs.current.delete(activeBubbleId);
        }
        // Immediately hide the previous card - this will trigger AnimatePresence exit
        setActiveBubbleId(null);
        setActiveIdeaData(null);
      }

      // Show card quickly after burst starts (300ms - matches burst animation duration)
      const showCardTimeout = setTimeout(() => {
        // Remove the burst bubble from the array and store its data
        setBubbles((prev) => {
          const burstBubble = prev.find((b) => b.id === bubbleId);
          if (burstBubble?.idea) {
            // Store the bubble's idea and position before removing it
            // The bubble's topic now matches the idea's topic after the update
            setActiveIdeaData({
              idea: burstBubble.idea,
              bubbleX: burstBubble.x,
              bubbleY: burstBubble.y,
              topic: burstBubble.topic || burstBubble.idea?.topic,
            });
          }
          // Remove the burst bubble (animation is complete)
          return prev.filter((b) => b.id !== bubbleId);
        });

        // Show card for this bubble
        setActiveBubbleId(bubbleId);

        // Don't auto-close - user must manually close by clicking background
      }, 300); // Match the burst animation duration (0.3s = 300ms)

      // Store the show card timeout
      timeoutRefs.current.set(bubbleId, { showCard: showCardTimeout });
    },
    [activeBubbleId, ideaDisplayDuration, getNextIdea, ideas]
  );

  // Function to close the active idea card
  const closeActiveIdea = useCallback(() => {
    if (activeBubbleId === null) return;

    // Clear any timeouts for the active bubble
    const activeTimeouts = timeoutRefs.current.get(activeBubbleId);
    if (activeTimeouts) {
      if (activeTimeouts.showCard) clearTimeout(activeTimeouts.showCard);
      if (activeTimeouts.cleanup) clearTimeout(activeTimeouts.cleanup);
      timeoutRefs.current.delete(activeBubbleId);
    }

    // Close the card immediately
    setActiveBubbleId(null);
    setActiveIdeaData(null);
  }, [activeBubbleId]);

  // Function to handle custom post generation
  const handleCustomGenerate = useCallback(
    async (formData: CreatePostFormData) => {
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

        // Success - close modal and navigate to drafts page
        setShowCreatePostModal(false);
        setActiveBubbleId(null);
        setActiveIdeaData(null);
        router.push("/posts?status=DRAFT");
      } catch (err) {
        console.error("Error generating post:", err);
        setCreateError("An unexpected error occurred. Please try again.");
      } finally {
        setIsGenerating(false);
      }
    },
    [router]
  );

  // Use stored idea data if available (for removed bubbles), otherwise find from bubbles array
  const activeIdea =
    activeIdeaData?.idea || bubbles.find((b) => b.id === activeBubbleId)?.idea;
  const activeBubblePosition = activeIdeaData
    ? { x: activeIdeaData.bubbleX, y: activeIdeaData.bubbleY }
    : bubbles.find((b) => b.id === activeBubbleId);

  // Function to open create post modal
  const handleCreatePost = useCallback(() => {
    if (!activeIdea) return;
    // Store the idea before closing the bubble modal
    setIdeaForCreatePost(activeIdea);
    // Close the bubble modal
    closeActiveIdea();
    // Modal will automatically load the article if articleUrl is provided
    setShowCreatePostModal(true);
  }, [activeIdea, closeActiveIdea]);

  // Function to open create post modal from list view
  const handleCreatePostFromList = useCallback((idea: Idea) => {
    setActiveIdeaData({ idea, bubbleX: 50, bubbleY: 50, topic: idea.topic });
    // Modal will automatically load the article if articleUrl is provided
    setShowCreatePostModal(true);
  }, []);

  // Calculate card position: center with slight bias toward bubble
  // Must be before conditional return (Rules of Hooks)
  const cardPosition = useMemo(() => {
    const bubblePosition = activeIdeaData
      ? { x: activeIdeaData.bubbleX, y: activeIdeaData.bubbleY }
      : bubbles.find((b) => b.id === activeBubbleId);

    if (!bubblePosition || activeBubbleId === null) {
      // Default to center
      return { left: "50%", top: "50%", offsetX: 0, offsetY: 0 };
    }

    // Container center is at 50%
    const centerX = 50;
    const centerY = 50;

    // Get bubble position as percentage
    const bubbleXPercent = bubblePosition.x;
    const bubbleYPercent = bubblePosition.y;

    // Calculate offset from center (in percentage points)
    const offsetXPercent = bubbleXPercent - centerX;
    const offsetYPercent = bubbleYPercent - centerY;

    // Apply small bias (15% of the offset) - keeps card mostly centered but slightly toward bubble
    const biasFactor = 0.25;
    const biasX = offsetXPercent * biasFactor;
    const biasY = offsetYPercent * biasFactor;

    // Calculate final position: center + bias
    const finalX = centerX + biasX;
    const finalY = centerY + biasY;

    return {
      left: `${finalX}%`,
      top: `${finalY}%`,
      offsetX: 0, // We'll use left/top positioning, not transform offset
      offsetY: 0,
    };
  }, [activeBubbleId, activeIdeaData, bubbles]);

  /*
  // For bubble mode, we need to wait for mount and have ideas
  // For list mode, we can show it immediately (even with empty ideas)
  if (viewMode === "bubble" && (!mounted || ideas.length === 0)) {
    return null;
  } */

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <CardTitleWithIcon
              icon={Lightbulb}
              title={title}
              description={description}
            />
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "bubble" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("bubble")}
                className="gap-2"
              >
                <Grid3x3 className="h-4 w-4" />
                Bubbles
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="gap-2"
              >
                <List className="h-4 w-4" />
                List
              </Button>
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefresh}
                  disabled={loading || (cooldownRemaining !== null && cooldownRemaining > 0)}
                  className="gap-2"
                  title={
                    cooldownRemaining !== null && cooldownRemaining > 0
                      ? `Come back in ${formatCooldownTime(cooldownRemaining)} for more ideas`
                      : "Generate new ideas"
                  }
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              )}
            </div>
            {(generatedAt || (cooldownRemaining !== null && cooldownRemaining > 0)) && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {generatedAt && `Last generated: ${formatGeneratedTime(generatedAt)}`}
                  {generatedAt && cooldownRemaining !== null && cooldownRemaining > 0 && " • "}
                  {cooldownRemaining !== null && cooldownRemaining > 0 && `Come back in ${formatCooldownTime(cooldownRemaining)} for new ideas`}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "bubble" ? (
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className={cn(
              "relative w-full rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-border p-8 md:p-12 h-[450px]",
              activeIdea && "cursor-pointer"
            )}
            onClick={closeActiveIdea}
          >
            {/* Debug Grid - visible grid layout */}
            {showDebug && gridLayout && containerRef.current && (
              <div className="absolute inset-0 pointer-events-none z-0">
                {(() => {
                  const containerWidth =
                    containerRef.current?.getBoundingClientRect().width || 100;
                  const paddingPercent =
                    (gridLayout.padding / containerWidth) * 100;
                  const cellWidthPercent =
                    ((containerWidth - gridLayout.padding * 2) /
                      containerWidth /
                      gridLayout.cols) *
                    100;
                  const containerHeight =
                    containerRef.current?.getBoundingClientRect().height || 100;
                  const cellHeightPercent =
                    ((containerHeight - gridLayout.padding * 2) /
                      containerHeight /
                      gridLayout.rows) *
                    100;

                  return (
                    <>
                      {/* Vertical grid lines */}
                      {Array.from({ length: gridLayout.cols + 1 }).map(
                        (_, i) => (
                          <div
                            key={`v-${i}`}
                            className="absolute top-0 bottom-0 border-l border-red-300/40"
                            style={{
                              left: `${paddingPercent + i * cellWidthPercent}%`,
                            }}
                          />
                        )
                      )}
                      {/* Horizontal grid lines */}
                      {Array.from({ length: gridLayout.rows + 1 }).map(
                        (_, i) => (
                          <div
                            key={`h-${i}`}
                            className="absolute left-0 right-0 border-t border-red-300/40"
                            style={{
                              top: `${paddingPercent + i * cellHeightPercent}%`,
                            }}
                          />
                        )
                      )}
                      {/* Grid cell numbers, bias lines, and bias text for debugging */}
                      {bubbles
                        .filter((b) => !b.isBursting && b.gridCell)
                        .map((bubble, idx) => {
                          const col = idx % gridLayout.cols;
                          const row = Math.floor(idx / gridLayout.cols);

                          // Cell center position
                          const cellCenterXPercent =
                            paddingPercent +
                            col * cellWidthPercent +
                            cellWidthPercent / 2;
                          const cellCenterYPercent =
                            paddingPercent +
                            row * cellHeightPercent +
                            cellHeightPercent / 2;

                          const plan = floatPlans.get(bubble.id);
                          const offsetX = bubble.gridCell?.offsetX ?? 0;
                          const offsetY = bubble.gridCell?.offsetY ?? 0;
                          const offsetMagnitude = bubble.gridCell?.biasAmount
                            ? Math.round(bubble.gridCell.biasAmount)
                            : 0;
                          const offsetDirection =
                            bubble.gridCell?.direction ?? "center";

                          const floatLabel = (() => {
                            if (!plan) return "Float: waiting";
                            const horiz =
                              Math.abs(plan.x) < 1
                                ? ""
                                : plan.x > 0
                                ? "E"
                                : "W";
                            const vert =
                              Math.abs(plan.y) < 1
                                ? ""
                                : plan.y > 0
                                ? "S"
                                : "N";
                            const directionLabel = vert + horiz || "Still";
                            return `Float: ${directionLabel} (x:${Math.round(
                              plan.x
                            )}px, y:${Math.round(plan.y)}px)`;
                          })();

                          return (
                            <React.Fragment key={`debug-${bubble.id}`}>
                              {/* Cell number */}
                              <div
                                className="absolute text-xs text-red-500/60 font-mono font-bold pointer-events-none"
                                style={{
                                  left: `${
                                    paddingPercent + col * cellWidthPercent + 1
                                  }%`,
                                  top: `${
                                    paddingPercent + row * cellHeightPercent + 1
                                  }%`,
                                }}
                              >
                                {idx}
                              </div>
                              {/* Offset and float debug text */}
                              <div
                                className="absolute text-[10px] text-green-700 dark:text-green-300 font-mono font-bold pointer-events-none whitespace-nowrap bg-white/85 dark:bg-gray-900/80 px-1.5 py-1 rounded"
                                style={{
                                  left: `${cellCenterXPercent}%`,
                                  top: `${cellCenterYPercent}%`,
                                  transform: "translate(-50%, -50%)",
                                  zIndex: 5,
                                }}
                              >
                                <div>{`Offset: ${offsetDirection} (x:${Math.round(
                                  offsetX
                                )}px, y:${Math.round(
                                  offsetY
                                )}px, |Δ|:${offsetMagnitude}px)`}</div>
                                <div>{floatLabel}</div>
                              </div>
                            </React.Fragment>
                          );
                        })}
                    </>
                  );
                })()}
              </div>
            )}

            {/* Background bubbles */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              <AnimatePresence>
                {bubbles
                  .filter((bubble) => !bubble.isBursting)
                  .map((bubble) => {
                    // Use idea's topic first (should match bubble.topic after updates), then fall back
                    const topic = bubble.idea?.topic || bubble.topic;
                    const colors = getTopicColor(topic);
                    return (
                      <IdeaBubble
                        key={`${bubble.id}-${topic || "default"}`}
                        bubble={bubble}
                        isActive={bubble.id === activeBubbleId}
                        onPositionUpdate={handlePositionUpdate}
                        onBurst={() => burstBubble(bubble.id)}
                        onFloatPlan={handleFloatPlanUpdate}
                        colors={colors}
                      />
                    );
                  })}
              </AnimatePresence>
              {/* Render bursting bubbles separately - they'll be removed after animation */}
              {bubbles
                .filter((bubble) => bubble.isBursting)
                .map((bubble) => {
                  // Use the new idea's topic (which should match bubble.topic after update)
                  const topic = bubble.idea?.topic || bubble.topic;
                  const colors = getTopicColor(topic);
                  return (
                    <IdeaBubble
                      key={`burst-${bubble.id}-${topic || "default"}`}
                      bubble={bubble}
                      isActive={false}
                      onPositionUpdate={undefined}
                      onBurst={undefined}
                      onFloatPlan={undefined}
                      colors={colors}
                    />
                  );
                })}
            </div>

            {/* Idea card overlay - centered with slight bias toward bubble */}
            <AnimatePresence mode="wait">
              {activeIdea &&
                activeBubbleId !== null &&
                activeBubblePosition && (
                  <>
                    {/* Mobile: Backdrop overlay */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="fixed inset-0 bg-black/50 z-[45] sm:hidden"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeActiveIdea();
                      }}
                    />
                    {/* Mobile: Full width modal at bottom */}
                    <motion.div
                      initial={{ opacity: 0, y: 100 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 100 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="fixed inset-x-0 bottom-0 z-[50] w-full px-4 pb-4 sm:hidden"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <div className="relative rounded-xl bg-white/95 dark:bg-gray-900/95 p-6 shadow-2xl backdrop-blur-sm border border-white/20 dark:border-white/10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            closeActiveIdea();
                          }}
                          className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Close</span>
                        </button>
                        <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">
                          {activeIdea.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400 mb-4">
                          {activeIdea.description}
                        </p>
                        {activeIdea.source && (
                          <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 relative">
                            {activeIdea.articleUrl && (
                              <ExternalLink className="absolute top-2 right-2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            )}
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Inspired by:
                            </p>
                            {activeIdea.articleUrl ? (
                              <a
                                href={activeIdea.articleUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-gray-700 dark:text-gray-300 italic hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors cursor-pointer block pr-6"
                                onClick={(e) => e.stopPropagation()}
                              >
                                &quot;{activeIdea.source}&quot;
                              </a>
                            ) : (
                              <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                                &quot;{activeIdea.source}&quot;
                              </p>
                            )}
                          </div>
                        )}
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreatePost();
                          }}
                          className="w-full"
                          size="sm"
                        >
                          Create Post
                        </Button>
                      </div>
                    </motion.div>

                    {/* Desktop: Centered with bias toward bubble */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        x: "-50%",
                        y: "-50%",
                      }}
                      exit={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50%" }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="hidden sm:block absolute z-20 max-w-sm px-4"
                      style={{
                        left: cardPosition.left,
                        top: cardPosition.top,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <div className="rounded-xl bg-white/95 dark:bg-gray-900/95 p-6 shadow-2xl backdrop-blur-sm border border-white/20 dark:border-white/10">
                      <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">
                        {activeIdea.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400 mb-4">
                        {activeIdea.description}
                      </p>
                      {activeIdea.source && (
                        <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 relative">
                          {activeIdea.articleUrl && (
                            <ExternalLink className="absolute top-2 right-2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                          )}
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Inspired by:
                          </p>
                          {activeIdea.articleUrl ? (
                            <a
                              href={activeIdea.articleUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-gray-700 dark:text-gray-300 italic hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors cursor-pointer block pr-6"
                              onClick={(e) => e.stopPropagation()}
                            >
                              &quot;{activeIdea.source}&quot;
                            </a>
                          ) : (
                            <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                              &quot;{activeIdea.source}&quot;
                            </p>
                          )}
                        </div>
                      )}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreatePost();
                        }}
                        className="w-full"
                        size="sm"
                      >
                        Create Post
                      </Button>
                    </div>
                  </motion.div>
                  </>
                )}
            </AnimatePresence>

            {/* Loading state */}
            <AnimatePresence>
              {loading && ideas.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 flex items-center justify-center z-10 px-8"
                >
                  <div className="text-center max-w-md">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="inline-block mb-4"
                    >
                      <Lightbulb className="h-12 w-12 text-yellow-500 dark:text-yellow-400" />
                    </motion.div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      Generating ideas...
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Creating personalized content ideas based on your interests
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cooldown message in bubble view when no ideas */}
            <AnimatePresence>
              {!loading &&
                ideas.length === 0 &&
                cooldownRemaining !== null &&
                cooldownRemaining > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute inset-0 flex items-center justify-center z-10 px-8"
                  >
                    <div className="text-center max-w-md">
                      <Clock className="h-12 w-12 mx-auto text-yellow-500 dark:text-yellow-400 mb-4" />
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                        Cooldown Active
                      </h2>
                      <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                        Come back in {formatCooldownTime(cooldownRemaining)} to generate new ideas.
                      </p>
                    </div>
                  </motion.div>
                )}
            </AnimatePresence>

            {/* Empty state - all bubbles popped and last idea card closed */}
            <AnimatePresence>
              {!loading &&
                bubbles.length === 0 &&
                !activeIdea &&
                activeBubbleId === null &&
                ideas.length === 0 &&
                !(cooldownRemaining !== null && cooldownRemaining > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute inset-0 flex items-center justify-center z-10 px-8"
                  >
                    <div className="text-center max-w-md">
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                        All ideas explored!
                      </h2>
                      <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                        Come back later for fresh inspiration and new ideas to
                        discover.
                      </p>
                    </div>
                  </motion.div>
                )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="w-full space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {loading && ideas.length === 0 ? (
              <div className="text-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="inline-block mb-4"
                >
                  <Lightbulb className="h-12 w-12 text-yellow-500 dark:text-yellow-400" />
                </motion.div>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Generating ideas...
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Creating personalized content ideas based on your interests
                </p>
              </div>
            ) : ideas.length === 0 ? (
              <div className="text-center py-12">
                <Lightbulb className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No content ideas available
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {cooldownRemaining !== null && cooldownRemaining > 0
                    ? `Come back in ${formatCooldownTime(cooldownRemaining)} for more ideas.`
                    : "Check back later for fresh inspiration."}
                </p>
              </div>
            ) : (
              <>
                {ideasByCategory.map(([category, categoryIdeas], categoryIndex) => {
                  const categoryColors = getTopicColor(category === "General" ? undefined : category);
                  return (
                    <div key={`category-${category}`} className="mb-6 last:mb-0">
                      {/* Category Header */}
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className={cn(
                            "w-1 h-5 rounded-full",
                            categoryColors.bg
                          )}
                        />
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                          {category}
                        </h3>
                        <LabelWithCount
                          count={categoryIdeas.length}
                          className="text-xs"
                          countClassName="text-gray-500 dark:text-gray-400"
                        />
                      </div>

                      {/* Ideas in this category */}
                      <div className="space-y-3">
                        {categoryIdeas.map((idea, ideaIndex) => {
                          const colors = getTopicColor(idea.topic);
                          const globalIndex = ideas.indexOf(idea);
                          return (
                            <motion.div
                              key={`list-idea-${globalIndex}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.3,
                                delay: (categoryIndex * 0.1) + (ideaIndex * 0.05),
                              }}
                              className={cn(
                                "rounded-lg border p-4 transition-colors hover:shadow-md",
                                colors.bg,
                                colors.border
                              )}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Lightbulb
                                      className={cn(
                                        "h-4 w-4 flex-shrink-0",
                                        colors.icon
                                      )}
                                    />
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                      {idea.title}
                                    </h3>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {idea.description}
                                  </p>
                                </div>
                                <Button
                                  onClick={() => handleCreatePostFromList(idea)}
                                  size="sm"
                                  className="ml-4 flex-shrink-0"
                                >
                                  Create Post
                                </Button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* Topic Color Legend */}
        {uniqueTopics.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Topic Colors
            </h4>
            <div className="flex flex-wrap gap-3">
              {uniqueTopics.map(({ normalized, original }) => {
                const colors = getTopicColor(original);
                return (
                  <div key={normalized} className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border",
                        colors.bg,
                        colors.border
                      )}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {original}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreatePostModal}
        onClose={() => {
          setShowCreatePostModal(false);
          setCreateError("");
          setIdeaForCreatePost(null);
        }}
        onGenerate={handleCustomGenerate}
        isGenerating={isGenerating}
        error={createError}
        onPostCreated={(postId) => {
          // Handle navigation from parent component - this will trigger the top loader
          router.push(`/posts/${postId}`);
        }}
        initialFormData={
          ideaForCreatePost
            ? {
                topicTitle: `${ideaForCreatePost.title}\n\n${ideaForCreatePost.description}`,
                keyPoints: ideaForCreatePost.description,
                articleUrl: ideaForCreatePost.articleUrl,
                articleTitle: ideaForCreatePost.source,
                // Don't pass articleContent - let modal load it automatically
              }
            : undefined
        }
      />
    </Card>
  );
}

interface IdeaBubbleProps {
  bubble: Bubble;
  isActive?: boolean;
  onPositionUpdate?: (id: number, x: number, y: number) => void;
  onBurst?: () => void;
  onFloatPlan?: (id: number, plan: { x: number; y: number }) => void;
  colors: TopicColor;
}

function IdeaBubble({
  bubble,
  isActive,
  onPositionUpdate,
  onBurst,
  onFloatPlan,
  colors,
}: IdeaBubbleProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Float animation constrained to grid cell boundaries
  // Note: We'll convert percentages to pixels in useEffect since we need DOM access
  const [pixelOffsets, setPixelOffsets] = React.useState({
    x: 0,
    y: 0,
    duration: 10,
  });

  React.useEffect(() => {
    if (!bubble.gridCell || !containerRef.current) {
      setPixelOffsets({ x: 0, y: 0, duration: 10 });
      onFloatPlan?.(bubble.id, { x: 0, y: 0 });
      return;
    }

    // Get container dimensions to convert percentages to pixels
    const mainContainer = containerRef.current.closest(
      ".relative"
    ) as HTMLElement;
    if (!mainContainer) {
      setPixelOffsets({ x: 0, y: 0, duration: 10 });
      onFloatPlan?.(bubble.id, { x: 0, y: 0 });
      return;
    }

    const containerRect = mainContainer.getBoundingClientRect();

    // Generate offsets within cell boundaries (these are in percentages)
    const maxXPercent = bubble.gridCell.maxMovementX || 5;
    const maxYPercent = bubble.gridCell.maxMovementY || 5;

    // Convert percentages to pixels for Framer Motion
    const maxXPixels = (maxXPercent / 100) * containerRect.width;
    const maxYPixels = (maxYPercent / 100) * containerRect.height;

    // Create a smooth floating pattern within the cell (in pixels)
    const xOffset = (Math.random() - 0.5) * maxXPixels * 2;
    const yOffset = (Math.random() - 0.5) * maxYPixels * 2;

    const randomDuration = 8 + Math.random() * 5; // Slower: 8-13 seconds

    setPixelOffsets({ x: xOffset, y: yOffset, duration: randomDuration });
    onFloatPlan?.(bubble.id, { x: xOffset, y: yOffset });
  }, [bubble.gridCell, bubble.id, onFloatPlan]);

  // Track position for card placement (only update when needed)
  useEffect(() => {
    if (!containerRef.current || !onPositionUpdate) return;

    const updatePosition = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const mainContainer = containerRef.current?.closest(
          ".relative"
        ) as HTMLElement;
        if (mainContainer) {
          const containerRect = mainContainer.getBoundingClientRect();
          const x = rect.left - containerRect.left + rect.width / 2;
          const y = rect.top - containerRect.top + rect.height / 2;
          onPositionUpdate(bubble.id, x, y);
        }
      }
    };

    // Update position periodically (every 500ms should be enough)
    const interval = setInterval(updatePosition, 500);
    // Also update immediately on mount
    updatePosition();

    return () => clearInterval(interval);
  }, [bubble.id, onPositionUpdate]);

  // BURST STATE - show burst animation
  if (bubble.isBursting) {
    // Use the colors prop passed from parent (which uses the new idea's topic)
    return (
      <motion.div
        ref={containerRef}
        key={`burst-${bubble.id}-${bubble.idea?.topic || bubble.topic || "default"}`}
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{
          position: "absolute",
          left: `${bubble.x}%`,
          top: `${bubble.y}%`,
          width: `${bubble.size}px`,
          height: `${bubble.size}px`,
          pointerEvents: "none",
        }}
        className="flex items-center justify-center"
      >
        <div
          className={cn(
            "w-full h-full rounded-full border flex items-center justify-center",
            colors.burstBg,
            colors.burstBorder
          )}
        >
          <Lightbulb className={cn("w-2/3 h-2/3", colors.icon)} />
        </div>
      </motion.div>
    );
  }

  // NORMAL STATE - floating bubble
  return (
    <motion.div
      ref={containerRef}
      key={`bubble-${bubble.id}`}
      style={{
        position: "absolute",
        left: `${bubble.x}%`,
        top: `${bubble.y}%`,
        width: `${bubble.size}px`,
        height: `${bubble.size}px`,
      }}
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        x: [0, pixelOffsets.x, -pixelOffsets.x * 0.7, pixelOffsets.x * 0.5, 0],
        y: [0, pixelOffsets.y, -pixelOffsets.y * 0.8, pixelOffsets.y * 0.4, 0],
      }}
      transition={{
        opacity: { duration: 0.6, ease: "easeOut" },
        x: {
          duration: pixelOffsets.duration,
          repeat: Infinity,
          ease: "easeInOut",
        },
        y: {
          duration: pixelOffsets.duration,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }}
      className={cn(
        "flex items-center justify-center",
        "cursor-pointer hover:scale-110",
        !bubble.isBursting &&
          isActive &&
          "ring-2 ring-offset-2 ring-offset-transparent",
        !bubble.isBursting && isActive && colors.activeRing
      )}
      onClick={(e) => {
        e.stopPropagation();
        if (!bubble.isBursting) {
          onBurst?.();
        }
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Circular container for bubble */}
      <div
        className={cn(
          "w-full h-full rounded-full flex items-center justify-center",
          isActive ? colors.activeBg : colors.bg,
          isActive ? colors.activeBorder : colors.border
        )}
      >
        {/* Ambient glow for active bubble */}
        {isActive && (
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={cn(
              "absolute inset-0 rounded-full blur-md -z-10",
              colors.activeGlow
            )}
          />
        )}
        <Lightbulb
          className={cn(
            "w-2/3 h-2/3 transition-colors",
            isActive ? colors.activeIcon : colors.icon
          )}
        />
      </div>
    </motion.div>
  );
}
