"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown, Image, Calendar, Clock, Sparkles } from "lucide-react";

interface LinkedInPostModalProps {
  draftText: string;
  userName?: string;
  userInitials?: string;
  startTypingDelay?: number;
  typingSpeed?: number;
}

export function LinkedInPostModal({
  draftText,
  userName = "Erlich Bachman",
  userInitials = "EB",
  startTypingDelay = 1000,
  typingSpeed = 30,
}: LinkedInPostModalProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Start typing animation after initial delay
    const startTimer = setTimeout(() => {
      setIsTyping(true);
      setDisplayedText("");
    }, startTypingDelay);

    return () => clearTimeout(startTimer);
  }, [startTypingDelay]);

  useEffect(() => {
    if (!isTyping || displayedText.length >= draftText.length) {
      setIsTyping(false);
      return;
    }

    const timer = setTimeout(() => {
      setDisplayedText(draftText.slice(0, displayedText.length + 1));
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [displayedText, draftText, isTyping, typingSpeed]);

  // Cursor blink animation
  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);

    return () => clearInterval(cursorTimer);
  }, []);

  // Hide cursor when typing is complete
  useEffect(() => {
    if (!isTyping && displayedText.length >= draftText.length) {
      const hideCursorTimer = setTimeout(() => {
        setShowCursor(false);
      }, 1000);
      return () => clearTimeout(hideCursorTimer);
    }
  }, [isTyping, displayedText.length, draftText.length]);

  const hasText = displayedText.length > 0;

  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          {/* Profile Picture */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
            {userInitials}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {userName}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Post to Anyone
            </span>
          </div>
        </div>
        <button className="rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
          <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </button>
      </div>

      {/* Text Input Area */}
      <div className="min-h-[280px] px-4 py-4">
        <div className="relative">
          {!hasText && !isTyping ? (
            <div className="absolute inset-0 flex items-start pt-2">
              <span className="text-[15px] text-slate-400">
                What do you want to talk about?
              </span>
            </div>
          ) : null}
          <div className="relative min-h-[200px] text-[15px] leading-[1.5] text-slate-900 dark:text-slate-100">
            {hasText && (
              <div className="whitespace-pre-wrap break-words">
                {displayedText}
                {showCursor && (
                  <span className="ml-0.5 inline-block h-[18px] w-[2px] animate-pulse bg-blue-600 align-middle" />
                )}
              </div>
            )}
            {!hasText && isTyping && (
              <span className="ml-0.5 inline-block h-[18px] w-[2px] animate-pulse bg-blue-600 align-middle" />
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Emoji Icon */}
            <button className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              😊
            </button>

            {/* Rewrite with AI Button */}
            <button className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
              <Sparkles className="h-3.5 w-3.5" />
              Rewrite with AI
            </button>

            {/* Media Icons */}
            <div className="flex items-center gap-1">
              <button
                aria-label="Add image"
                className="flex h-8 w-8 items-center justify-center rounded text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <Image className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                aria-label="Add calendar event"
                className="flex h-8 w-8 items-center justify-center rounded text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <Calendar className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Post Button */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <button
              disabled={!hasText}
              className="rounded-md bg-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-400 transition disabled:cursor-not-allowed enabled:bg-blue-600 enabled:text-white enabled:hover:bg-blue-700 dark:enabled:bg-blue-600"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
