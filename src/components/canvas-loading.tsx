"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Color palette matching ideas showcase
const colorPalette = [
  "text-yellow-500/60 dark:text-yellow-400/50",
  "text-blue-500/60 dark:text-blue-400/50",
  "text-purple-500/60 dark:text-purple-400/50",
  "text-green-500/60 dark:text-green-400/50",
  "text-pink-500/60 dark:text-pink-400/50",
  "text-orange-500/60 dark:text-orange-400/50",
  "text-teal-500/60 dark:text-teal-400/50",
  "text-amber-500/60 dark:text-amber-400/50",
  "text-cyan-500/60 dark:text-cyan-400/50",
  "text-lime-500/60 dark:text-lime-400/50",
  "text-sky-500/60 dark:text-sky-400/50",
  "text-indigo-500/60 dark:text-indigo-400/50",
  "text-violet-500/60 dark:text-violet-400/50",
  "text-fuchsia-500/60 dark:text-fuchsia-400/50",
  "text-rose-500/60 dark:text-rose-400/50",
  "text-emerald-500/60 dark:text-emerald-400/50",
];

const loadingMessages = [
  "Generating awesome insights...",
  "Elevating your potential...",
  "Metrics are key for success...",
  "Analyzing your performance...",
  "Crunching the numbers...",
  "Unlocking growth opportunities...",
  "Discovering hidden patterns...",
  "Transforming data into insights...",
  "Building your success story...",
  "Measuring what matters...",
  "Connecting the dots...",
  "Revealing your impact...",
  "Charting your progress...",
  "Optimizing your strategy...",
  "Tracking your journey...",
  "Amplifying your results...",
  "Visualizing your achievements...",
  "Calculating your wins...",
  "Mapping your growth...",
  "Enhancing your visibility...",
  "Maximizing your reach...",
  "Boosting your engagement...",
  "Scaling your influence...",
  "Refining your approach...",
  "Elevating your brand...",
  "Expanding your audience...",
  "Strengthening your presence...",
  "Accelerating your growth...",
  "Unleashing your potential...",
  "Igniting your momentum...",
  "Fueling your success...",
  "Powering your progress...",
  "Driving your results...",
  "Catalyzing your growth...",
  "Amplifying your voice...",
  "Magnifying your impact...",
  "Intensifying your reach...",
  "Escalating your influence...",
  "Propelling your brand...",
  "Advancing your goals...",
  "Enhancing your metrics...",
  "Improving your analytics...",
  "Refining your insights...",
  "Perfecting your strategy...",
  "Mastering your data...",
  "Dominating your niche...",
  "Leading your industry...",
  "Shaping your future...",
  "Crafting your legacy...",
  "Building your empire...",
  "Creating your breakthrough...",
  "Achieving your milestones...",
  "Reaching new heights...",
  "Breaking new ground...",
  "Setting new records...",
  "Making your mark...",
  "Leaving your footprint...",
  "Writing your story...",
  "Defining your success...",
  "Celebrating your wins...",
  "Honoring your progress...",
];

const sizeClasses = ["text-lg", "text-xl", "text-2xl", "text-3xl", "text-4xl"];

interface Message {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  size: string;
  visibleDuration: number; // Individual visible duration for this message
  quadrant: number; // Which quadrant this message is in (0-3)
}

// Quadrant definitions:
// 0: Top-left (0-50% x, 0-50% y)
// 1: Top-right (50-100% x, 0-50% y)
// 2: Bottom-left (0-50% x, 50-100% y)
// 3: Bottom-right (50-100% x, 50-100% y)

// Adjacent quadrants mapping
const adjacentQuadrants: Record<number, number[]> = {
  0: [1, 2], // Top-left adjacent to: Top-right, Bottom-left
  1: [0, 3], // Top-right adjacent to: Top-left, Bottom-right
  2: [0, 3], // Bottom-left adjacent to: Top-left, Bottom-right
  3: [1, 2], // Bottom-right adjacent to: Top-right, Bottom-left
};

interface CanvasLoadingProps {
  className?: string;
  fadeInDuration?: number;
  visibleDuration?: number;
  fadeOutDuration?: number;
  messageChangeInterval?: number;
}

export function CanvasLoading({
  className,
  fadeInDuration = 0.4,
  visibleDuration = 1,
  fadeOutDuration = 0.4,
  messageChangeInterval,
}: CanvasLoadingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const nextIdRef = useRef(0);
  const timeoutRefs = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const lastQuadrantRef = useRef<number | null>(null);
  const quadrantPositionsRef = useRef<
    Map<number, Array<{ x: number; y: number }>>
  >(new Map());
  const maxMessages = 5;

  const generateMessage = (): Message => {
    // Random message
    const messageText =
      loadingMessages[Math.floor(Math.random() * loadingMessages.length)];

    // Random color
    const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];

    // Random size
    const size = sizeClasses[Math.floor(Math.random() * sizeClasses.length)];

    const sizeIndex = sizeClasses.indexOf(size);
    const textLength = messageText.length;

    // Choose quadrant - must be adjacent to previous one
    let quadrant: number;
    if (lastQuadrantRef.current === null) {
      // First message - choose random quadrant
      quadrant = Math.floor(Math.random() * 4);
    } else {
      // Choose an adjacent quadrant
      const adjacent = adjacentQuadrants[lastQuadrantRef.current];
      quadrant = adjacent[Math.floor(Math.random() * adjacent.length)];
    }
    lastQuadrantRef.current = quadrant;

    // Define quadrant bounds with safe padding
    // Each quadrant is 50% x 50%, but we'll use safe padding within each
    const quadrantBounds: Record<
      number,
      { minX: number; maxX: number; minY: number; maxY: number }
    > = {
      0: { minX: 10, maxX: 45, minY: 10, maxY: 45 }, // Top-left
      1: { minX: 55, maxX: 90, minY: 10, maxY: 45 }, // Top-right
      2: { minX: 10, maxX: 45, minY: 55, maxY: 90 }, // Bottom-left
      3: { minX: 55, maxX: 90, minY: 55, maxY: 90 }, // Bottom-right
    };

    const bounds = quadrantBounds[quadrant];

    // Get existing positions in this quadrant to avoid overlap
    const existingPositions = quadrantPositionsRef.current.get(quadrant) || [];

    // Try to find a non-overlapping position
    let x: number, y: number;
    let attempts = 0;
    const maxAttempts = 50;
    const minDistance = 15; // Minimum distance between message centers (in %)

    do {
      x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
      y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
      attempts++;

      // Check if this position is too close to existing messages
      const tooClose = existingPositions.some((pos) => {
        const distance = Math.sqrt(
          Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2)
        );
        return distance < minDistance;
      });

      if (!tooClose || attempts >= maxAttempts) {
        break;
      }
    } while (attempts < maxAttempts);

    // Add this position to the quadrant's position list
    existingPositions.push({ x, y });
    quadrantPositionsRef.current.set(quadrant, existingPositions);

    // Random visible duration between min (visibleDuration) and max (visibleDuration + 2)
    const randomVisibleDuration = visibleDuration + Math.random() * 2;

    return {
      id: nextIdRef.current++,
      text: messageText,
      x,
      y,
      color,
      size,
      visibleDuration: randomVisibleDuration,
      quadrant,
    };
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const removeMessage = (messageId: number) => {
      setMessages((prev) => {
        const message = prev.find((msg) => msg.id === messageId);
        if (message) {
          // Remove position from quadrant tracking
          const quadrantPositions =
            quadrantPositionsRef.current.get(message.quadrant) || [];
          const updatedPositions = quadrantPositions.filter(
            (pos) =>
              Math.abs(pos.x - message.x) > 1 || Math.abs(pos.y - message.y) > 1
          );
          quadrantPositionsRef.current.set(message.quadrant, updatedPositions);
        }
        return prev.filter((msg) => msg.id !== messageId);
      });
      // Clear timeout for this message
      const timeout = timeoutRefs.current.get(messageId);
      if (timeout) {
        clearTimeout(timeout);
        timeoutRefs.current.delete(messageId);
      }
    };

    const scheduleMessageRemoval = (message: Message) => {
      // Calculate when to fade out (after fade in + this message's visible duration)
      const fadeOutTime = (fadeInDuration + message.visibleDuration) * 1000;

      // Schedule fade out
      const timeout = setTimeout(() => {
        removeMessage(message.id);
      }, fadeOutTime);

      timeoutRefs.current.set(message.id, timeout);
    };

    const spawnMessage = () => {
      setMessages((prev) => {
        // Don't spawn if we already have max messages
        if (prev.length >= maxMessages) return prev;

        const newMessage = generateMessage();
        // Schedule removal for the new message
        scheduleMessageRemoval(newMessage);
        return [...prev, newMessage];
      });
    };

    // Spawn initial messages up to max
    const spawnInitialMessages = () => {
      for (let i = 0; i < maxMessages; i++) {
        setTimeout(() => {
          spawnMessage();
        }, i * 200); // Stagger initial spawns by 200ms
      }
    };

    // Function to continuously spawn new messages when we have fewer than max
    const checkAndSpawn = () => {
      setMessages((prev) => {
        if (prev.length < maxMessages) {
          const newMessage = generateMessage();
          scheduleMessageRemoval(newMessage);
          return [...prev, newMessage];
        }
        return prev;
      });
    };

    // Spawn initial messages
    spawnInitialMessages();

    // Set up interval to check and spawn new messages
    const spawnInterval = setInterval(() => {
      checkAndSpawn();
    }, 500); // Check every 500ms

    return () => {
      clearInterval(spawnInterval);
      // Clear all timeouts
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, [fadeInDuration, visibleDuration, fadeOutDuration, messageChangeInterval]);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-full overflow-hidden", className)}
    >
      <AnimatePresence>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              opacity: {
                duration: fadeInDuration,
                ease: "easeOut",
              },
              scale: {
                duration: fadeInDuration,
                ease: "easeOut",
              },
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
              transition: {
                duration: fadeOutDuration,
                ease: "easeIn",
              },
            }}
            className="absolute pointer-events-none select-none"
            style={{
              left: `${message.x}%`,
              top: `${message.y}%`,
              transform: "translate(-50%, -50%) translateZ(0)",
              willChange: "transform",
              backfaceVisibility: "hidden",
              WebkitFontSmoothing: "antialiased",
            }}
          >
            <span
              className={cn(
                "font-medium whitespace-nowrap",
                message.color,
                message.size
              )}
            >
              {message.text}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
