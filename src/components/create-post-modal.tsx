"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  X,
  ChevronDown,
  Image,
  Sparkles,
  Loader2,
  FileText,
  Link as LinkIcon,
  Check,
  ThumbsUp,
  MessageCircle,
  Repeat2,
  Send,
  Globe,
  MoreVertical,
  Heart,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  User,
  Building2,
  Wand2,
  Video,
} from "lucide-react";
import NextImage from "next/image";
import { Avatar } from "@/components/ui/avatar";
import { useLinkedInProfilePicture } from "@/hooks/useLinkedInProfilePicture";

export interface CreatePostFormData {
  topicTitle: string;
  tone: string;
  postType: string;
  customPrompt: string;
  targetAudience: string;
  keyPoints: string;
  callToAction: string;
  includeHashtags: boolean;
  includeSourceArticle: boolean;
  includeEmojis: boolean;
  maxLength: number;
  language?: string;
  articleUrl?: string;
  articleTitle?: string;
  articleContent?: string;
  userName?: string;
  userInitials?: string;
  imageFile?: File;
  imagePreview?: string;
  documentFile?: File;
  documentPreview?: string; // URL for existing document when editing
  videoFile?: File;
  videoPreview?: string; // URL for existing video when editing
}

export interface UserPreferencesConfig {
  tone?: string;
  postType?: string;
  targetAudience?: string;
  maxLength?: number;
  includeHashtags?: boolean;
  includeSourceArticle?: boolean;
  includeEmojis?: boolean;
  userName?: string;
  userInitials?: string;
  language?: string;
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (formData: CreatePostFormData) => Promise<void>;
  isGenerating: boolean;
  error?: string;
  initialFormData?: Partial<CreatePostFormData>;
  userPreferences?: UserPreferencesConfig;
  postId?: number; // For editing existing posts
  publishTarget?: string; // "personal" or organization ID - determines which tab the draft appears in (optional initial value)
  onUpdate?: (
    postId: number,
    content: string,
    files?: {
      imageFile?: File;
      documentFile?: File;
      videoFile?: File;
      removeImage?: boolean;
      removeDocument?: boolean;
      removeVideo?: boolean;
    },
    publishTarget?: string, // Optional publish target to update
    articleData?: {
      articleUrl?: string;
      articleTitle?: string;
      articleContent?: string;
      twoParaSummary?: string;
    }
  ) => Promise<void>; // Callback for updating posts
  onPostCreated?: (postId: number) => void; // Callback when a post is created (for parent to handle navigation)
}

const TONE_OPTIONS = [
  "Professional",
  "Conversational",
  "Authoritative",
  "Friendly",
  "Analytical",
  "Inspirational",
  "Casual",
  "Expert",
];

const POST_TYPE_OPTIONS = [
  "Industry News",
  "Thought Leadership",
  "Personal Experience",
  "Educational",
  "Opinion Piece",
  "Case Study",
  "Trend Analysis",
  "Career Advice",
];

const AUDIENCE_OPTIONS = [
  "Industry Professionals",
  "General Business Audience",
  "C-Level Executives",
  "Mid-Level Managers",
  "Entry-Level Professionals",
  "Entrepreneurs",
  "Students",
  "Mixed Audience",
];

const LANGUAGE_OPTIONS = [
  { value: "English", label: "English" },
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Portuguese (PT)", label: "Portuguese (PT)" },
  { value: "Portuguese (BR)", label: "Portuguese (BR)" },
  { value: "Chinese (Simplified)", label: "Chinese (Simplified)" },
  { value: "Japanese", label: "Japanese" },
  { value: "Korean", label: "Korean" },
  { value: "Arabic", label: "Arabic" },
  { value: "Italian", label: "Italian" },
];

// Move emoji array outside component to prevent recreation on every render
const COMMON_EMOJIS = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😅",
  "🤣",
  "😂",
  "🙂",
  "🙃",
  "😉",
  "😊",
  "😇",
  "🥰",
  "😍",
  "🤩",
  "😘",
  "😗",
  "😚",
  "😙",
  "😋",
  "😛",
  "😜",
  "🤪",
  "😝",
  "🤑",
  "🤗",
  "🤭",
  "🤫",
  "🤔",
  "🤐",
  "🤨",
  "😐",
  "😑",
  "😶",
  "😏",
  "😒",
  "🙄",
  "😬",
  "🤥",
  "😌",
  "😔",
  "😪",
  "🤤",
  "😴",
  "😷",
  "🤒",
  "🤕",
  "🤢",
  "🤮",
  "🤧",
  "🥵",
  "🥶",
  "😶‍🌫️",
  "😵",
  "🤯",
  "🤠",
  "🥳",
  "😎",
  "🤓",
  "🧐",
  "😕",
  "😟",
  "🙁",
  "☹️",
  "😮",
  "😯",
  "😲",
  "😳",
  "🥺",
  "😦",
  "😧",
  "😨",
  "😰",
  "😥",
  "😢",
  "😭",
  "😱",
  "😖",
  "😣",
  "😞",
  "😓",
  "😩",
  "😫",
  "🥱",
  "😤",
  "😡",
  "😠",
  "🤬",
  "😈",
  "👿",
  "💀",
  "☠️",
  "💩",
  "🤡",
  "👹",
  "👺",
  "👻",
  "👽",
  "👾",
  "🤖",
  "😺",
  "😸",
  "😹",
  "😻",
  "😼",
  "😽",
  "🙀",
  "😿",
  "😾",
  "👍",
  "👎",
  "👊",
  "✊",
  "🤛",
  "🤜",
  "🤞",
  "✌️",
  "🤟",
  "🤘",
  "🤙",
  "👌",
  "🤌",
  "🤏",
  "👈",
  "👉",
  "👆",
  "👇",
  "☝️",
  "👋",
  "🤚",
  "🖐",
  "✋",
  "🖖",
  "👏",
  "🙌",
  "🤲",
  "🤝",
  "🙏",
  "✍️",
  "💪",
  "🦾",
  "🦿",
  "🦵",
  "🦶",
  "👂",
  "🦻",
  "👃",
  "🧠",
  "🫀",
  "🫁",
  "🦷",
  "🦴",
  "👀",
  "👁",
  "👅",
  "👄",
  "💋",
  "🩸",
];

export function CreatePostModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
  error,
  initialFormData,
  userPreferences,
  postId,
  publishTarget = "personal", // Default to personal if not specified
  onUpdate,
  onPostCreated,
}: CreatePostModalProps) {
  const router = useRouter();

  // State for organizations (fetched internally)
  const [organizations, setOrganizations] = useState<
    Array<{ linkedin_org_id: string; org_name: string | null }>
  >([]);

  // State for voice profiles (fetched internally)
  const [voiceProfiles, setVoiceProfiles] = useState<
    Array<{
      profile_type: "personal" | "organization";
      organization_id: string | null;
      id: number;
    }>
  >([]);

  // LinkedIn profile picture (cached via hook)
  const {
    profilePicture: linkedInProfilePicture,
    isLoading: isLoadingProfilePicture,
  } = useLinkedInProfilePicture();

  // State for selected publish target (can be changed by user in the modal)
  const [selectedPublishTarget, setSelectedPublishTarget] =
    useState(publishTarget);

  // Fetch organizations and voice profiles when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          // Fetch organizations
          const orgResponse = await fetch("/api/linkedin/organizations");
          const orgResult = await orgResponse.json();
          if (orgResponse.ok) {
            setOrganizations(
              (orgResult.organizations || []).map(
                (org: {
                  linkedin_org_id: string;
                  org_name: string | null;
                }) => ({
                  linkedin_org_id: org.linkedin_org_id,
                  org_name: org.org_name,
                })
              )
            );
          } else {
            console.error("Failed to fetch organizations:", orgResult.error);
            setOrganizations([]);
          }

          // Fetch voice profiles
          const voiceResponse = await fetch("/api/voice/profiles");
          const voiceResult = await voiceResponse.json();
          if (voiceResponse.ok) {
            setVoiceProfiles(voiceResult.voice_profiles || []);
          } else {
            console.error("Failed to fetch voice profiles:", voiceResult.error);
            setVoiceProfiles([]);
          }
        } catch (err) {
          console.error("Error fetching data:", err);
          setOrganizations([]);
          setVoiceProfiles([]);
        }
      };

      fetchData();
      setSelectedPublishTarget(publishTarget);
    }
  }, [isOpen, publishTarget]);

  // Load language preference from localStorage
  const getStoredLanguage = useCallback((): string => {
    if (typeof window === "undefined") return "English";
    try {
      const stored = localStorage.getItem("postLanguage");
      if (stored && LANGUAGE_OPTIONS.some((opt) => opt.value === stored)) {
        return stored;
      }
    } catch (error) {
      console.error("Error reading language from localStorage:", error);
    }
    return "English";
  }, []);

  // Save language preference to localStorage
  const saveLanguagePreference = useCallback((language: string) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("postLanguage", language);
    } catch (error) {
      console.error("Error saving language to localStorage:", error);
    }
  }, []);

  // Get default values: use user preferences first, then fallback to defaults
  const getDefaultFormData = useCallback((): CreatePostFormData => {
    const storedLanguage = getStoredLanguage();
    return {
      topicTitle: "",
      tone: userPreferences?.tone || "Professional",
      postType: userPreferences?.postType || "Thought Leadership",
      customPrompt: "",
      targetAudience:
        userPreferences?.targetAudience || "Industry Professionals",
      keyPoints: "",
      callToAction: "",
      includeHashtags: userPreferences?.includeHashtags ?? false,
      includeSourceArticle: userPreferences?.includeSourceArticle ?? true,
      includeEmojis: userPreferences?.includeEmojis ?? false,
      maxLength: userPreferences?.maxLength || 3000,
      language: userPreferences?.language || storedLanguage,
      userName: userPreferences?.userName,
      userInitials: userPreferences?.userInitials,
    };
  }, [userPreferences, getStoredLanguage]);

  const [formData, setFormData] = useState<CreatePostFormData>(() => ({
    ...getDefaultFormData(),
    ...initialFormData,
  }));

  const [postText, setPostText] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [rewrittenVariants, setRewrittenVariants] = useState<
    Array<{ hook: string; body: string }>
  >([]);
  const [currentVariantIndex, setCurrentVariantIndex] = useState(0);
  const variantSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [twoParaSummary, setTwoParaSummary] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showArticleInput, setShowArticleInput] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [rewriteError, setRewriteError] = useState("");
  const [showPublishTargetDropdown, setShowPublishTargetDropdown] =
    useState(false);
  const [showPolishInput, setShowPolishInput] = useState(false);
  const [polishPrompt, setPolishPrompt] = useState("");
  const [isPolishing, setIsPolishing] = useState(false);
  const polishInputRef = useRef<HTMLDivElement>(null);
  const polishButtonRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const articleInputRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const publishTargetDropdownRef = useRef<HTMLDivElement>(null);
  const settingsPanelRef = useRef<HTMLDivElement>(null);
  const editableAreaRef = useRef<HTMLDivElement>(null);

  // Article loading state
  const [articleUrl, setArticleUrl] = useState("");
  const [isLoadingArticle, setIsLoadingArticle] = useState(false);
  const [articleError, setArticleError] = useState("");
  const [articleSuccess, setArticleSuccess] = useState(false);
  const hasAutoLoadedRef = useRef<string | null>(null); // Track which URL we've auto-loaded

  // Show toast when error prop changes
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error]);

  // Show toast when rewriteError changes
  useEffect(() => {
    if (rewriteError) {
      toast({
        title: "Rewrite Error",
        description: rewriteError,
        variant: "destructive",
      });
    }
  }, [rewriteError]);

  // Show toast when articleError changes
  useEffect(() => {
    if (articleError && formData.articleUrl && !formData.articleContent) {
      toast({
        title: "Article Load Failed",
        description: `Failed to load article: ${articleError}`,
        variant: "destructive",
      });
    }
  }, [articleError, formData.articleUrl, formData.articleContent]);

  // Handle click outside for publish target dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        publishTargetDropdownRef.current &&
        !publishTargetDropdownRef.current.contains(event.target as Node)
      ) {
        setShowPublishTargetDropdown(false);
      }
    };

    if (showPublishTargetDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showPublishTargetDropdown]);

  // Update form data when modal opens - reset to defaults or use initialFormData
  useEffect(() => {
    if (isOpen) {
      const defaults = getDefaultFormData();
      if (initialFormData) {
        setFormData({
          ...defaults,
          ...initialFormData,
        });
        // Always update postText when modal opens, even if topicTitle exists
        if (initialFormData.topicTitle) {
          setPostText(initialFormData.topicTitle);
        } else {
          setPostText("");
        }
      } else {
        // Reset to user preferences/defaults when opening without initialFormData
        setFormData(defaults);
        setPostText("");
      }
      // Reset rewrite state
      setRewriteError("");
      setOriginalText("");
      setIsRewriting(false);
      setRewrittenVariants([]);
      setCurrentVariantIndex(0);
      setTwoParaSummary(""); // Clear summary when modal resets
      setIsNavigating(false); // Reset navigating state
      setShowPolishInput(false); // Reset polish input state
      setPolishPrompt(""); // Reset polish prompt
      setIsPolishing(false); // Reset polishing state
      // Clear variant save timeout
      if (variantSaveTimeoutRef.current) {
        clearTimeout(variantSaveTimeoutRef.current);
        variantSaveTimeoutRef.current = null;
      }
      // Reset auto-load tracking when modal opens
      hasAutoLoadedRef.current = null;
    }
  }, [
    isOpen,
    initialFormData?.topicTitle,
    initialFormData?.articleUrl,
    initialFormData?.articleTitle,
    initialFormData?.articleContent,
    initialFormData?.imagePreview,
    initialFormData?.documentPreview,
    initialFormData?.videoPreview,
    getDefaultFormData,
  ]);

  // Auto-load article when modal opens with articleUrl but no content
  // Skip if articleContent already exists (e.g., when editing a post that was already scraped)
  useEffect(() => {
    // Check if article content already exists in initialFormData or formData
    const hasExistingContent =
      (initialFormData?.articleContent &&
        initialFormData.articleContent.trim().length > 0) ||
      (formData.articleContent && formData.articleContent.trim().length > 0);

    // Only auto-load if:
    // 1. Modal is open
    // 2. Article URL exists
    // 3. Article content does NOT already exist (skip re-scraping)
    // 4. Not currently loading
    // 5. Haven't already auto-loaded this URL
    if (
      isOpen &&
      initialFormData?.articleUrl &&
      !hasExistingContent &&
      !isLoadingArticle &&
      hasAutoLoadedRef.current !== initialFormData.articleUrl
    ) {
      // Mark this URL as being auto-loaded
      hasAutoLoadedRef.current = initialFormData.articleUrl;

      // Automatically load the article
      const loadArticle = async () => {
        setIsLoadingArticle(true);
        setArticleError("");
        setArticleSuccess(false);

        try {
          const response = await fetch("/api/scrape-article", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url: initialFormData.articleUrl }),
          });

          const data = await response.json();

          if (!response.ok) {
            setArticleError(data.error || "Failed to scrape article content");
            return;
          }

          // Update form data with article information
          setFormData((prev) => ({
            ...prev,
            articleUrl: initialFormData.articleUrl,
            articleTitle:
              data.title ||
              initialFormData.articleTitle ||
              prev.articleTitle ||
              "",
            articleContent: data.content || "",
          }));

          setArticleSuccess(true);
          setArticleError("");
        } catch (err) {
          console.error("Error loading article:", err);
          setArticleError("An unexpected error occurred");
        } finally {
          setIsLoadingArticle(false);
        }
      };

      loadArticle();
    }
  }, [
    isOpen,
    initialFormData?.articleUrl,
    initialFormData?.articleContent,
    formData.articleContent,
    isLoadingArticle,
  ]);

  // Cleanup image preview URL on unmount
  useEffect(() => {
    return () => {
      if (formData.imagePreview) {
        URL.revokeObjectURL(formData.imagePreview);
      }
    };
  }, [formData.imagePreview]);

  // Cleanup variant save timeout on unmount
  useEffect(() => {
    return () => {
      if (variantSaveTimeoutRef.current) {
        clearTimeout(variantSaveTimeoutRef.current);
        variantSaveTimeoutRef.current = null;
      }
    };
  }, []);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showEmojiPicker]);

  // Optimized resize with requestAnimationFrame to batch DOM updates
  useEffect(() => {
    if (!isOpen || !textareaRef.current || !editableAreaRef.current) return;

    const resizeTextarea = () => {
      if (textareaRef.current && editableAreaRef.current) {
        // Get available height from the editable area container
        const containerHeight = editableAreaRef.current.clientHeight;
        const maxHeight = containerHeight - 20; // Reserve some padding

        textareaRef.current.style.height = "auto";
        const scrollHeight = textareaRef.current.scrollHeight;
        const newHeight = Math.max(200, Math.min(scrollHeight, maxHeight));
        textareaRef.current.style.height = `${newHeight}px`;

        // Enable scrolling if content exceeds max height
        if (scrollHeight > maxHeight) {
          textareaRef.current.style.overflowY = "auto";
        } else {
          textareaRef.current.style.overflowY = "hidden";
        }
      }
    };

    // Use requestAnimationFrame to batch DOM updates and reduce layout thrashing
    const rafId = requestAnimationFrame(resizeTextarea);
    // Also check on next frame to ensure container has rendered
    setTimeout(() => {
      resizeTextarea();
    }, 0);
    return () => cancelAnimationFrame(rafId);
  }, [postText, isOpen, showSettings]);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 200);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        articleInputRef.current &&
        !articleInputRef.current.contains(event.target as Node)
      ) {
        setShowArticleInput(false);
      }
      if (
        polishInputRef.current &&
        !polishInputRef.current.contains(event.target as Node)
      ) {
        setShowPolishInput(false);
      }
    };

    if (showArticleInput || showPolishInput) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showArticleInput, showPolishInput]);

  // Position polish popover above button on mobile (centered on screen)
  useEffect(() => {
    if (!showPolishInput || !polishButtonRef.current || !polishInputRef.current)
      return;

    const updatePosition = () => {
      if (!polishInputRef.current || !polishButtonRef.current) return;

      const isMobile = window.innerWidth < 640;
      if (!isMobile) {
        // Desktop: let CSS handle positioning
        polishInputRef.current.style.bottom = "";
        return;
      }

      // Mobile: position above button, centered horizontally
      const buttonRect = polishButtonRef.current.getBoundingClientRect();
      polishInputRef.current.style.bottom = `${
        window.innerHeight - buttonRect.top + 8
      }px`;
    };

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [showPolishInput]);

  // Helper function to save text to current variant
  const saveTextToCurrentVariant = useCallback(
    (text: string, variantIndex: number) => {
      const hookBodyMatch = text.match(/^(.+?)\n\n([\s\S]+)$/);
      if (hookBodyMatch) {
        const [, hook, body] = hookBodyMatch;
        setRewrittenVariants((prev) => {
          const updated = [...prev];
          updated[variantIndex] = { hook, body };
          return updated;
        });
      } else {
        setRewrittenVariants((prev) => {
          const updated = [...prev];
          updated[variantIndex] = { hook: "", body: text };
          return updated;
        });
      }
    },
    []
  );

  // Memoize textarea onChange handler to prevent unnecessary re-renders
  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      setPostText(newText);
      // Save edits back to the current variant if we're viewing one
      if (rewrittenVariants.length > 0 && currentVariantIndex >= 0) {
        // Clear any pending save
        if (variantSaveTimeoutRef.current) {
          clearTimeout(variantSaveTimeoutRef.current);
        }
        // Use a small delay to batch updates and avoid excessive state updates
        variantSaveTimeoutRef.current = setTimeout(() => {
          saveTextToCurrentVariant(newText, currentVariantIndex);
          variantSaveTimeoutRef.current = null;
        }, 100);
      }
    },
    [rewrittenVariants.length, currentVariantIndex, saveTextToCurrentVariant]
  );

  // Memoize insertEmoji to prevent recreation on every render
  const insertEmoji = useCallback(
    (emoji: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = postText;
      const newText = text.substring(0, start) + emoji + text.substring(end);

      setPostText(newText);

      // Save to variant if viewing one
      if (rewrittenVariants.length > 0 && currentVariantIndex >= 0) {
        // Clear any pending save
        if (variantSaveTimeoutRef.current) {
          clearTimeout(variantSaveTimeoutRef.current);
        }
        // Save immediately since this is a direct user action
        saveTextToCurrentVariant(newText, currentVariantIndex);
      }

      // Set cursor position after the inserted emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);

      setShowEmojiPicker(false);
    },
    [
      postText,
      rewrittenVariants.length,
      currentVariantIndex,
      saveTextToCurrentVariant,
    ]
  );

  const handleSubmit = async () => {
    if (!postText.trim()) {
      return;
    }

    setIsSaving(true);

    try {
      // Check if image/document was removed (had initial preview but now removed)
      // An image was removed if:
      // 1. There was an initial image preview (editing existing post with image)
      // 2. There's no image preview now (user removed it)
      // 3. There's no new image file selected (user didn't replace it)
      const hadInitialImage =
        initialFormData?.imagePreview !== undefined &&
        initialFormData.imagePreview !== null &&
        initialFormData.imagePreview !== "";
      const hasImageNow =
        formData.imagePreview !== undefined &&
        formData.imagePreview !== null &&
        formData.imagePreview !== "";
      const shouldRemoveImage =
        hadInitialImage && !hasImageNow && !formData.imageFile;

      // Document removal detection
      const hadInitialDocument =
        initialFormData?.documentFile !== undefined ||
        (initialFormData?.documentPreview !== undefined &&
          initialFormData.documentPreview !== null &&
          initialFormData.documentPreview !== "");
      const hasDocumentNow =
        formData.documentFile !== undefined ||
        (formData.documentPreview !== undefined &&
          formData.documentPreview !== null &&
          formData.documentPreview !== "");
      const shouldRemoveDocument = hadInitialDocument && !hasDocumentNow;

      // Video removal detection
      const hadInitialVideo =
        initialFormData?.videoFile !== undefined ||
        (initialFormData?.videoPreview !== undefined &&
          initialFormData.videoPreview !== null &&
          initialFormData.videoPreview !== "");
      const hasVideoNow =
        formData.videoFile !== undefined ||
        (formData.videoPreview !== undefined &&
          formData.videoPreview !== null &&
          formData.videoPreview !== "");
      const shouldRemoveVideo = hadInitialVideo && !hasVideoNow;

      // If editing an existing post, use the onUpdate callback or update API
      if (postId && onUpdate) {
        await onUpdate(
          postId,
          postText.trim(),
          {
            imageFile: formData.imageFile,
            documentFile: formData.documentFile,
            videoFile: formData.videoFile,
            removeImage: shouldRemoveImage,
            removeDocument: shouldRemoveDocument,
            removeVideo: shouldRemoveVideo,
          },
          selectedPublishTarget,
          {
            articleUrl: formData.articleUrl,
            articleTitle: formData.articleTitle,
            articleContent: formData.articleContent,
            twoParaSummary: twoParaSummary,
          }
        );
        // Don't close modal here - let onUpdate handle closing if needed
        // The modal will close when the parent component updates
        return;
      } else if (postId) {
        // Fallback: update directly via API if onUpdate not provided
        const formDataToSend = new FormData();
        formDataToSend.append("content", postText.trim());
        if (formData.articleUrl) {
          formDataToSend.append("source_url", formData.articleUrl);
        }
        if (formData.articleTitle) {
          formDataToSend.append("source_title", formData.articleTitle);
        }
        if (formData.articleContent) {
          formDataToSend.append("source_content", formData.articleContent);
        }
        if (twoParaSummary) {
          formDataToSend.append("two_para_summary", twoParaSummary);
        }

        // Handle image removal
        if (shouldRemoveImage) {
          formDataToSend.append("removeImage", "true");
        } else if (formData.imageFile) {
          formDataToSend.append("imageFile", formData.imageFile);
        }

        // Handle document removal
        if (shouldRemoveDocument) {
          formDataToSend.append("removeDocument", "true");
        } else if (formData.documentFile) {
          formDataToSend.append("documentFile", formData.documentFile);
        }

        // Handle video removal
        if (shouldRemoveVideo) {
          formDataToSend.append("removeVideo", "true");
        } else if (formData.videoFile) {
          formDataToSend.append("videoFile", formData.videoFile);
        }

        // Include publish target when updating
        formDataToSend.append("publish_target", selectedPublishTarget);

        const response = await fetch(`/api/posts/${postId}`, {
          method: "PATCH",
          body: formDataToSend, // Don't set Content-Type header - browser sets it with boundary
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update post");
        }

        handleClose();
        // Refresh the page to show updated content
        window.location.reload();
        return;
      }

      // Otherwise, create a new post
      const formDataToSend = new FormData();
      formDataToSend.append("content", postText.trim());
      if (formData.articleUrl) {
        formDataToSend.append("source_url", formData.articleUrl);
      }
      if (formData.articleTitle) {
        formDataToSend.append("source_title", formData.articleTitle);
      }
      if (formData.articleContent) {
        formDataToSend.append("source_content", formData.articleContent);
      }
      if (twoParaSummary) {
        formDataToSend.append("two_para_summary", twoParaSummary);
      }
      // Include publish target so draft appears in correct tab (personal vs organization)
      formDataToSend.append("publish_target", selectedPublishTarget);

      // Add files if present
      if (formData.imageFile) {
        formDataToSend.append("imageFile", formData.imageFile);
      }
      if (formData.documentFile) {
        formDataToSend.append("documentFile", formData.documentFile);
      }
      if (formData.videoFile) {
        formDataToSend.append("videoFile", formData.videoFile);
      }

      const response = await fetch("/api/posts/create", {
        method: "POST",
        body: formDataToSend, // Don't set Content-Type header - browser sets it with boundary
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Show more user-friendly error messages
        const errorMessage = errorData.error || "Failed to create post";
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Post created successfully - let parent handle navigation if callback provided
      if (data.post && data.post.id) {
        // Set navigating state to show feedback to user
        setIsNavigating(true);
        // Don't close modal yet - keep it open until navigation happens
        // If parent provided callback, use it (parent will handle navigation and closing)
        if (onPostCreated) {
          onPostCreated(data.post.id);
          // Parent will handle closing the modal after navigation
        } else {
          // Fallback: navigate directly if no callback
          // The modal will close naturally when the page navigates away
          router.push(`/posts/${data.post.id}`);
        }
      } else {
        // Fallback: just close modal if no post ID
        handleClose();
      }
    } catch (error) {
      console.error("Error saving post:", error);
      // Reset navigating state on error
      setIsNavigating(false);
      // Show error to user with better formatting
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save post";

      // Show error toast
      if (errorMessage.includes("too large") || errorMessage.includes("size")) {
        toast({
          title: "Video Upload Error",
          description: `${errorMessage}\n\nPlease try:\n• Compressing your video\n• Using a smaller file\n• Converting to a more efficient format (MP4 with H.264)`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRewrite = async () => {
    if (!postText.trim()) {
      return;
    }

    setIsRewriting(true);
    setRewriteError("");
    // Store original text for undo
    setOriginalText(postText);

    try {
      const response = await fetch("/api/generate-custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topicTitle: postText,
          tone: formData.tone,
          postType: formData.postType,
          customPrompt:
            formData.customPrompt ||
            "Rewrite and improve this LinkedIn post while maintaining the core message and improving clarity, engagement, and professionalism.",
          targetAudience: formData.targetAudience,
          keyPoints: formData.keyPoints || "",
          callToAction: formData.callToAction || "",
          includeHashtags: formData.includeHashtags,
          includeSourceArticle: formData.includeSourceArticle,
          includeEmojis: formData.includeEmojis,
          maxLength: formData.maxLength,
          language: formData.language || "English",
          articleUrl: formData.articleUrl,
          articleTitle: formData.articleTitle,
          articleContent: formData.articleContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to rewrite post");
      }

      const data = await response.json();

      // Extract all variants from the new API response format
      if (
        data.variants &&
        Array.isArray(data.variants) &&
        data.variants.length > 0
      ) {
        // Store all variants
        setRewrittenVariants(data.variants);
        // Set to first variant (index 0)
        setCurrentVariantIndex(0);
        // Display first variant
        const firstVariant = data.variants[0];
        const rewrittenText = firstVariant.hook
          ? `${firstVariant.hook}\n\n${firstVariant.body}`
          : firstVariant.body;
        setPostText(rewrittenText);
        // Store the summary if provided
        if (data.twoParaSummary) {
          setTwoParaSummary(data.twoParaSummary);
        }
      } else {
        throw new Error("No generated content received");
      }
    } catch (error) {
      console.error("Error rewriting post:", error);
      setRewriteError(
        error instanceof Error ? error.message : "Failed to rewrite post"
      );
      // Restore original text on error
      setPostText(originalText || postText);
    } finally {
      setIsRewriting(false);
    }
  };

  const handleUndo = () => {
    if (originalText) {
      setPostText(originalText);
      setOriginalText("");
      setRewrittenVariants([]);
      setCurrentVariantIndex(0);
      setTwoParaSummary(""); // Clear summary on undo
    }
  };

  const handlePreviousVariant = () => {
    if (rewrittenVariants.length > 0 && currentVariantIndex > 0) {
      // Clear any pending save timeout
      if (variantSaveTimeoutRef.current) {
        clearTimeout(variantSaveTimeoutRef.current);
        variantSaveTimeoutRef.current = null;
      }

      // Save current edits before switching (synchronously)
      const currentText = postText;
      saveTextToCurrentVariant(currentText, currentVariantIndex);

      // Get updated variants array (we need to read from state, but since we just updated it,
      // we'll create a local copy with the current edits)
      const updatedVariants = [...rewrittenVariants];
      const hookBodyMatch = currentText.match(/^(.+?)\n\n([\s\S]+)$/);
      if (hookBodyMatch) {
        const [, hook, body] = hookBodyMatch;
        updatedVariants[currentVariantIndex] = { hook, body };
      } else {
        updatedVariants[currentVariantIndex] = { hook: "", body: currentText };
      }

      // Switch to previous variant
      const newIndex = currentVariantIndex - 1;
      setCurrentVariantIndex(newIndex);
      const variant = updatedVariants[newIndex];
      const variantText = variant.hook
        ? `${variant.hook}\n\n${variant.body}`
        : variant.body;
      setPostText(variantText);
    }
  };

  const handleNextVariant = () => {
    if (
      rewrittenVariants.length > 0 &&
      currentVariantIndex < rewrittenVariants.length - 1
    ) {
      // Clear any pending save timeout
      if (variantSaveTimeoutRef.current) {
        clearTimeout(variantSaveTimeoutRef.current);
        variantSaveTimeoutRef.current = null;
      }

      // Save current edits before switching (synchronously)
      const currentText = postText;
      saveTextToCurrentVariant(currentText, currentVariantIndex);

      // Get updated variants array (we need to read from state, but since we just updated it,
      // we'll create a local copy with the current edits)
      const updatedVariants = [...rewrittenVariants];
      const hookBodyMatch = currentText.match(/^(.+?)\n\n([\s\S]+)$/);
      if (hookBodyMatch) {
        const [, hook, body] = hookBodyMatch;
        updatedVariants[currentVariantIndex] = { hook, body };
      } else {
        updatedVariants[currentVariantIndex] = { hook: "", body: currentText };
      }

      // Switch to next variant
      const newIndex = currentVariantIndex + 1;
      setCurrentVariantIndex(newIndex);
      const variant = updatedVariants[newIndex];
      const variantText = variant.hook
        ? `${variant.hook}\n\n${variant.body}`
        : variant.body;
      setPostText(variantText);
    }
  };

  const handlePolish = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!postText.trim() || !polishPrompt.trim()) {
      return;
    }

    try {
      setIsPolishing(true);

      const response = await fetch("/api/polish-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: polishPrompt.trim(),
          content: postText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to polish post");
      }

      // Update the textarea with the polished content
      setPostText(data.polishedContent);

      // Save to variant if viewing one
      if (rewrittenVariants.length > 0 && currentVariantIndex >= 0) {
        // Clear any pending save
        if (variantSaveTimeoutRef.current) {
          clearTimeout(variantSaveTimeoutRef.current);
          variantSaveTimeoutRef.current = null;
        }
        // Save immediately since this is a direct user action
        saveTextToCurrentVariant(data.polishedContent, currentVariantIndex);
      }

      setPolishPrompt("");
      setShowPolishInput(false);
    } catch (err) {
      console.error("Error polishing post:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to polish post";
      toast({
        title: "Polish Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsPolishing(false);
    }
  };

  const handleInputChange = (
    field: keyof CreatePostFormData,
    value: string | boolean | number
  ) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };
      // Save language preference to localStorage when it changes
      if (field === "language" && typeof value === "string") {
        saveLanguagePreference(value);
      }
      return updated;
    });
  };

  const resetForm = () => {
    setFormData({
      ...getDefaultFormData(),
      topicTitle: "",
      customPrompt: "",
      keyPoints: "",
      callToAction: "",
    });
    setPostText("");
    setArticleUrl("");
    setArticleError("");
    setArticleSuccess(false);
    setShowSettings(false);
    setShowArticleInput(false);
    setShowEmojiPicker(false);
    // Clean up image preview URL
    if (formData.imagePreview) {
      URL.revokeObjectURL(formData.imagePreview);
    }
    setFormData((prev) => ({
      ...prev,
      imageFile: undefined,
      imagePreview: undefined,
      documentFile: undefined,
      videoFile: undefined,
      videoPreview: undefined,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (documentInputRef.current) {
      documentInputRef.current.value = "";
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleLoadArticle = async () => {
    if (!articleUrl.trim()) {
      setArticleError("Please enter a URL");
      return;
    }

    setIsLoadingArticle(true);
    setArticleError("");
    setArticleSuccess(false);

    try {
      const response = await fetch("/api/scrape-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: articleUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        setArticleError(data.error || "Failed to scrape article content");
        return;
      }

      // Update form data with article information
      setFormData((prev) => ({
        ...prev,
        articleUrl: articleUrl,
        articleTitle: data.title,
        articleContent: data.content,
      }));

      setArticleSuccess(true);
      setArticleError("");
      setArticleUrl("");
      setShowArticleInput(false);
    } catch (err) {
      setArticleError("An unexpected error occurred");
    } finally {
      setIsLoadingArticle(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setArticleUrl(url);
    // Clear previous article data when URL changes
    if (formData.articleUrl) {
      setFormData((prev) => ({
        ...prev,
        articleUrl: undefined,
        articleTitle: undefined,
        articleContent: undefined,
      }));
      setArticleSuccess(false);
    }
    setArticleError("");
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File Type",
        description: "Please select a valid image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);

    // Clear document and video if image is selected (only one at a time)
    if (documentInputRef.current) {
      documentInputRef.current.value = "";
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
    if (formData.videoPreview) {
      URL.revokeObjectURL(formData.videoPreview);
    }

    setFormData((prev) => ({
      ...prev,
      imageFile: file,
      imagePreview: previewUrl,
      documentFile: undefined,
      documentPreview: undefined,
      videoFile: undefined,
      videoPreview: undefined,
    }));
  };

  const handleRemoveImage = () => {
    if (formData.imagePreview) {
      URL.revokeObjectURL(formData.imagePreview);
    }
    setFormData((prev) => ({
      ...prev,
      imageFile: undefined,
      imagePreview: undefined,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDocumentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (e.g., max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    // Clear image and video if document is selected (only one at a time)
    if (formData.imagePreview) {
      URL.revokeObjectURL(formData.imagePreview);
    }
    if (formData.videoPreview) {
      URL.revokeObjectURL(formData.videoPreview);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }

    setFormData((prev) => ({
      ...prev,
      documentFile: file,
      imageFile: undefined,
      imagePreview: undefined,
      videoFile: undefined,
      videoPreview: undefined,
    }));
  };

  const handleRemoveDocument = () => {
    setFormData((prev) => ({
      ...prev,
      documentFile: undefined,
      documentPreview: undefined,
    }));
    if (documentInputRef.current) {
      documentInputRef.current.value = "";
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid File Type",
        description: "Please select a valid video file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 100MB for videos)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      toast({
        title: "Video Too Large",
        description: `Video size must be less than 100MB. Your file is ${fileSizeMB}MB. Please compress your video or use a smaller file.`,
        variant: "destructive",
      });
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);

    // Clear image and document if video is selected (only one at a time)
    if (formData.imagePreview) {
      URL.revokeObjectURL(formData.imagePreview);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (documentInputRef.current) {
      documentInputRef.current.value = "";
    }

    setFormData((prev) => ({
      ...prev,
      videoFile: file,
      videoPreview: previewUrl,
      imageFile: undefined,
      imagePreview: undefined,
      documentFile: undefined,
      documentPreview: undefined,
    }));
  };

  const handleRemoveVideo = () => {
    if (formData.videoPreview) {
      URL.revokeObjectURL(formData.videoPreview);
    }
    setFormData((prev) => ({
      ...prev,
      videoFile: undefined,
      videoPreview: undefined,
    }));
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  // Memoize computed values
  const hasText = useMemo(() => postText.trim().length > 0, [postText]);

  // Memoize organization name lookup to avoid repeated array searches
  const selectedOrgName = useMemo((): string => {
    if (selectedPublishTarget === "personal") {
      return "Personal";
    }
    const org = organizations.find(
      (org) => org.linkedin_org_id === selectedPublishTarget
    );
    return org?.org_name || "Organization";
  }, [selectedPublishTarget, organizations]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full sm:max-w-6xl lg:max-w-5xl bg-transparent border-none shadow-none overflow-hidden max-h-[98vh] min-h-[700px] [&>div]:p-0">
        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900 flex flex-col min-h-[700px] max-h-[98vh]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 pr-12 dark:border-slate-800 dark:bg-slate-900 flex-shrink-0 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              {/* Profile Picture */}
              <Avatar
                imageUrl={
                  selectedPublishTarget === "personal"
                    ? linkedInProfilePicture
                    : null
                }
                name={selectedOrgName}
                type={
                  selectedPublishTarget === "personal"
                    ? "personal"
                    : "organization"
                }
                size="md"
                isLoading={
                  selectedPublishTarget === "personal" &&
                  isLoadingProfilePicture
                }
              />
              <div
                className="flex flex-col relative"
                ref={publishTargetDropdownRef}
              >
                <div
                  className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() =>
                    setShowPublishTargetDropdown(!showPublishTargetDropdown)
                  }
                >
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {selectedOrgName}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                <div
                  className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() =>
                    setShowPublishTargetDropdown(!showPublishTargetDropdown)
                  }
                >
                  Post to anyone
                </div>

                {/* Dropdown Menu */}
                {showPublishTargetDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50 dark:bg-slate-800 dark:border-slate-700">
                    <div className="py-1">
                      {/* Personal Profile Option */}
                      <button
                        onClick={() => {
                          setSelectedPublishTarget("personal");
                          setShowPublishTargetDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 ${
                          selectedPublishTarget === "personal"
                            ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                            : "text-gray-700 dark:text-slate-300"
                        }`}
                      >
                        <User className="h-4 w-4" />
                        Personal
                      </button>

                      {/* Organization Options */}
                      {organizations.length > 0 && (
                        <>
                          <div className="border-t border-gray-100 dark:border-slate-700 my-1"></div>
                          {organizations.map((org) => (
                            <button
                              key={org.linkedin_org_id}
                              onClick={() => {
                                setSelectedPublishTarget(org.linkedin_org_id);
                                setShowPublishTargetDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 ${
                                selectedPublishTarget === org.linkedin_org_id
                                  ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                                  : "text-gray-700 dark:text-slate-300"
                              }`}
                            >
                              <Building2 className="h-4 w-4" />
                              {org.org_name ||
                                `Organization ${org.linkedin_org_id}`}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable content area (editor) */}
          <div className="relative flex-1 flex flex-col min-h-0">
            {/* Text Input Area - LinkedIn Style */}
            <div
              ref={editableAreaRef}
              className="flex flex-col px-4 py-4 flex-1 min-h-[260px] sm:min-h-[400px]"
            >
              {/* Article Reference Section */}
              {isLoadingArticle &&
              formData.articleUrl &&
              !formData.articleContent ? (
                <div className="mb-3 flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-800 dark:bg-blue-950">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Loading article...
                  </span>
                </div>
              ) : articleError &&
                formData.articleUrl &&
                !formData.articleContent ? (
                <div className="mb-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-950">
                  <span className="text-sm font-medium text-red-900 dark:text-red-100">
                    Failed to load article. Please try again or enter a
                    different URL.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setArticleError("");
                      handleUrlChange("");
                    }}
                    className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Dismiss
                  </button>
                </div>
              ) : !formData.articleUrl ? (
                <div className="relative mb-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowArticleInput(!showArticleInput)}
                    className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <LinkIcon className="h-4 w-4" />
                    Load article to write about
                  </button>
                  {/* Article Input Popover */}
                  {showArticleInput && (
                    <div
                      className="absolute top-full left-0 mt-2 z-[100] w-80 rounded-lg border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-800 dark:bg-slate-900"
                      ref={articleInputRef}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          <Label
                            htmlFor="articleUrl-input"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                          >
                            Article URL
                          </Label>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            id="articleUrl-input"
                            type="url"
                            placeholder="https://example.com/article"
                            value={articleUrl}
                            onChange={(e) => handleUrlChange(e.target.value)}
                            className="flex-1 border-slate-300 text-sm dark:border-slate-700"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleLoadArticle();
                              }
                            }}
                          />
                          <Button
                            type="button"
                            onClick={handleLoadArticle}
                            disabled={isLoadingArticle || !articleUrl.trim()}
                            size="sm"
                            className="bg-blue-600 text-white hover:bg-blue-700"
                          >
                            {isLoadingArticle ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Load"
                            )}
                          </Button>
                        </div>

                        {/* Article loading feedback */}
                        {articleError && (
                          <div className="text-xs text-red-600 dark:text-red-400">
                            {articleError}
                          </div>
                        )}

                        {articleSuccess && formData.articleTitle && (
                          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <Check className="h-3 w-3" />
                            <span className="truncate">
                              Loaded: {formData.articleTitle}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-3 flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-800 dark:bg-blue-950">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Article loaded: {formData.articleTitle || "Article"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleUrlChange("");
                      setShowArticleInput(false);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Remove
                  </button>
                </div>
              )}
              <div className="relative flex flex-col flex-1 min-h-0">
                {!hasText &&
                  !formData.imagePreview &&
                  !formData.documentFile &&
                  !formData.documentPreview &&
                  !formData.videoFile &&
                  !formData.videoPreview && (
                    <div className="absolute inset-0 flex items-start pt-0 pointer-events-none">
                      <span className="text-[15px] text-slate-400 leading-[1.5]">
                        What do you want to talk about?
                      </span>
                    </div>
                  )}
                <textarea
                  ref={textareaRef}
                  value={postText}
                  onChange={handleTextareaChange}
                  placeholder=""
                  className="relative w-full text-[15px] leading-[1.5] text-slate-900 dark:text-slate-100 bg-transparent border-none outline-none resize-none focus:outline-none pt-0"
                  style={
                    {
                      fontFamily: "inherit",
                      overflowY: "auto",
                      minHeight: "200px",
                      fieldSizing: "content",
                    } as React.CSSProperties
                  }
                />
              </div>

              {/* Image Preview */}
              {formData.imagePreview && (
                <div className="relative mt-4">
                  <div
                    className="relative inline-block max-w-full"
                    style={{ height: "400px", width: "100%" }}
                  >
                    <NextImage
                      src={formData.imagePreview}
                      alt="Post image preview"
                      fill
                      className="rounded-lg object-contain"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Video Preview */}
              {(formData.videoFile || formData.videoPreview) && (
                <div className="relative mt-4">
                  <div className="relative inline-block max-w-full">
                    <video
                      src={
                        formData.videoPreview ||
                        (formData.videoFile
                          ? URL.createObjectURL(formData.videoFile)
                          : undefined)
                      }
                      controls
                      className="max-w-full max-h-[400px] rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveVideo}
                      className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                      aria-label="Remove video"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Document Preview */}
              {(formData.documentFile || formData.documentPreview) && (
                <div className="relative mt-4">
                  <div className="relative inline-block max-w-full rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {formData.documentFile
                            ? formData.documentFile.name
                            : (() => {
                                // Extract filename from URL (remove query params first)
                                if (!formData.documentPreview)
                                  return "Document";
                                const withoutParams =
                                  formData.documentPreview.split("?")[0];
                                const parts = withoutParams.split("/");
                                const filename = parts[parts.length - 1];
                                try {
                                  return decodeURIComponent(filename);
                                } catch {
                                  return filename || "Document";
                                }
                              })()}
                        </p>
                        {formData.documentFile && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {(formData.documentFile.size / 1024).toFixed(1)} KB
                          </p>
                        )}
                        {formData.documentPreview && !formData.documentFile && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Existing document
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveDocument}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400 transition-colors"
                        aria-label="Remove document"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            className={`absolute inset-0 z-30 transition duration-300 ${
              showSettings ? "pointer-events-auto" : "pointer-events-none"
            }`}
          >
            <div
              className={`absolute inset-0 bg-slate-900/40 transition-opacity duration-300 ${
                showSettings ? "opacity-100" : "opacity-0"
              }`}
              onClick={() => setShowSettings(false)}
            />
            <div
              className={`absolute left-0 right-0 top-0 bottom-0 bg-white dark:bg-slate-900 transform transition-transform duration-300 ${
                showSettings
                  ? "translate-y-0 shadow-2xl"
                  : "-translate-y-full shadow-none"
              }`}
            >
              <div className="absolute left-0 right-0 top-0 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-4 bg-white dark:bg-slate-900">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Rewrite with AI settings
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Adjust rewrite preferences
                  </p>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Close settings"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-col h-full">
                <div
                  ref={settingsPanelRef}
                  className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pt-[100px] pb-20"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="tone"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Writing Tone
                      </Label>
                      <select
                        id="tone"
                        value={formData.tone}
                        onChange={(e) =>
                          handleInputChange("tone", e.target.value)
                        }
                        className="h-11 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                        title={
                          formData.tone.startsWith("Custom -") &&
                          !voiceProfiles.some((vp) => {
                            if (formData.tone === "Custom - Personal") {
                              return (
                                vp.profile_type === "personal" &&
                                !vp.organization_id
                              );
                            }
                            // Extract org ID from tone string (e.g., "Custom - Org 1")
                            const orgIndex =
                              formData.tone.match(/Org (\d+)/)?.[1];
                            if (orgIndex) {
                              const orgId =
                                organizations[parseInt(orgIndex) - 1]
                                  ?.linkedin_org_id;
                              return (
                                vp.profile_type === "organization" &&
                                vp.organization_id === orgId
                              );
                            }
                            return false;
                          })
                            ? "Voice profile not available yet. Publish some posts or customize in Settings."
                            : undefined
                        }
                      >
                        {TONE_OPTIONS.map((tone) => (
                          <option key={tone} value={tone}>
                            {tone}
                          </option>
                        ))}
                        {/* Custom - Personal option */}
                        {(() => {
                          const hasPersonalVoice = voiceProfiles.some(
                            (vp) =>
                              vp.profile_type === "personal" &&
                              !vp.organization_id
                          );
                          return (
                            <option
                              value="Custom - Personal"
                              disabled={!hasPersonalVoice}
                            >
                              Custom - Personal
                              {!hasPersonalVoice ? " (Not Available)" : ""}
                            </option>
                          );
                        })()}
                        {/* Custom - Org options */}
                        {organizations.map((org, index) => {
                          const hasOrgVoice = voiceProfiles.some(
                            (vp) =>
                              vp.profile_type === "organization" &&
                              vp.organization_id === org.linkedin_org_id
                          );
                          const orgDisplayName =
                            org.org_name || `Org ${index + 1}`;
                          return (
                            <option
                              key={org.linkedin_org_id}
                              value={`Custom - ${orgDisplayName}`}
                              disabled={!hasOrgVoice}
                            >
                              Custom - {orgDisplayName}
                              {!hasOrgVoice ? " (Not Available)" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="postType"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Post Type
                      </Label>
                      <select
                        id="postType"
                        value={formData.postType}
                        onChange={(e) =>
                          handleInputChange("postType", e.target.value)
                        }
                        className="h-11 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                      >
                        {POST_TYPE_OPTIONS.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="targetAudience"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Target Audience
                      </Label>
                      <select
                        id="targetAudience"
                        value={formData.targetAudience}
                        onChange={(e) =>
                          handleInputChange("targetAudience", e.target.value)
                        }
                        className="h-11 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                      >
                        {AUDIENCE_OPTIONS.map((audience) => (
                          <option key={audience} value={audience}>
                            {audience}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="maxLength"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Max Character Length
                      </Label>
                      <Input
                        id="maxLength"
                        type="number"
                        value={formData.maxLength}
                        onChange={(e) =>
                          handleInputChange(
                            "maxLength",
                            parseInt(e.target.value) || 3000
                          )
                        }
                        min="500"
                        max="3000"
                        step="100"
                        className="h-11 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="language"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Output Language
                      </Label>
                      <select
                        id="language"
                        value={formData.language || "English"}
                        onChange={(e) =>
                          handleInputChange("language", e.target.value)
                        }
                        className="h-11 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                      >
                        {LANGUAGE_OPTIONS.map((lang) => (
                          <option key={lang.value} value={lang.value}>
                            {lang.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Content Options
                    </Label>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="includeHashtags"
                          checked={formData.includeHashtags}
                          onChange={(e) =>
                            handleInputChange(
                              "includeHashtags",
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 rounded border border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        />
                        <Label
                          htmlFor="includeHashtags"
                          className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                          Include hashtags
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="includeSourceArticle"
                          checked={formData.includeSourceArticle}
                          onChange={(e) =>
                            handleInputChange(
                              "includeSourceArticle",
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 rounded border border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        />
                        <Label
                          htmlFor="includeSourceArticle"
                          className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                          Mention article source
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="includeEmojis"
                          checked={formData.includeEmojis}
                          onChange={(e) =>
                            handleInputChange("includeEmojis", e.target.checked)
                          }
                          className="h-4 w-4 rounded border border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        />
                        <Label
                          htmlFor="includeEmojis"
                          className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                          Include emojis
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute left-0 right-0 bottom-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSettings(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={async () => {
                      setShowSettings(false);
                      await handleRewrite();
                    }}
                    disabled={isRewriting || !hasText}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isRewriting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Rewriting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Rewrite with AI
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 bg-white px-3 py-2.5 sm:px-4 sm:py-3 dark:border-slate-800 dark:bg-slate-900 flex-shrink-0">
            <div className="flex flex-col gap-2.5 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div
                className={`flex ${
                  rewrittenVariants.length > 1
                    ? "flex-row items-center"
                    : "flex-col sm:flex-row sm:items-center"
                } gap-2.5 sm:gap-3 relative min-w-0`}
              >
                {/* First Row: Emoji, Upload Icons */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Emoji Picker Button */}
                  <div className="relative flex-shrink-0" ref={emojiPickerRef}>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      😊
                    </button>

                    {/* Emoji Picker Popover */}
                    {showEmojiPicker && (
                      <div className="absolute bottom-full left-0 mb-2 w-64 h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg p-3 overflow-y-auto z-50">
                        <div className="grid grid-cols-8 gap-1">
                          {COMMON_EMOJIS.map((emoji, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => insertEmoji(emoji)}
                              className="flex h-8 w-8 items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-lg transition-colors"
                              title={emoji}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Upload Icons */}
                  {!formData.imagePreview &&
                    !formData.documentFile &&
                    !formData.documentPreview &&
                    !formData.videoFile &&
                    !formData.videoPreview && (
                      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          aria-label="Upload image"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          aria-label="Add image"
                          className="flex h-8 w-8 items-center justify-center rounded text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 flex-shrink-0"
                          title="Add image"
                        >
                          <Image className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <input
                          ref={documentInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleDocumentSelect}
                          className="hidden"
                          aria-label="Upload document"
                        />
                        <button
                          type="button"
                          onClick={() => documentInputRef.current?.click()}
                          aria-label="Add document"
                          className="flex h-8 w-8 items-center justify-center rounded text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 flex-shrink-0"
                          title="Add document"
                        >
                          <Paperclip className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <input
                          ref={videoInputRef}
                          type="file"
                          accept="video/*"
                          onChange={handleVideoSelect}
                          className="hidden"
                          aria-label="Upload video"
                        />
                        <button
                          type="button"
                          onClick={() => videoInputRef.current?.click()}
                          aria-label="Add video"
                          className="flex h-8 w-8 items-center justify-center rounded text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 flex-shrink-0"
                          title="Add video"
                        >
                          <Video className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                </div>

                {/* Second Row on Mobile: Rewrite, Polish, Variants, Undo */}
                <div
                  className={`flex items-center gap-2 sm:gap-3 ${
                    rewrittenVariants.length > 1 ? "flex-nowrap" : "flex-wrap"
                  } min-w-0`}
                >
                  {/* Rewrite with AI Button */}
                  <button
                    type="button"
                    onClick={() => setShowSettings(true)}
                    disabled={!hasText || isRewriting || isGenerating}
                    className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap flex-shrink-0"
                  >
                    {isRewriting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Rewriting with AI
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        Rewrite with AI
                      </>
                    )}
                  </button>

                  {/* Polish Button */}
                  <div className="relative flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowPolishInput(!showPolishInput)}
                      disabled={
                        !hasText || isRewriting || isGenerating || isPolishing
                      }
                      className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap"
                      title="Polish your post"
                      ref={polishButtonRef}
                    >
                      <Wand2 className="h-3.5 w-3.5 text-purple-600" />
                      Polish
                    </button>

                    {/* Polish Input Popover */}
                    {showPolishInput && (
                      <div
                        className="fixed left-1/2 -translate-x-1/2 z-[100] w-[min(calc(100vw-2rem),400px)] rounded-lg border border-slate-200 bg-white p-4 shadow-lg sm:absolute sm:left-0 sm:bottom-full sm:mb-2 sm:w-80 sm:translate-x-0 dark:border-slate-800 dark:bg-slate-900"
                        ref={polishInputRef}
                      >
                        <form onSubmit={handlePolish} className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Wand2 className="h-4 w-4 text-purple-600" />
                            <Label
                              htmlFor="polish-prompt-input"
                              className="text-sm font-medium text-slate-700 dark:text-slate-300"
                            >
                              What would you like to improve?
                            </Label>
                          </div>
                          <Textarea
                            id="polish-prompt-input"
                            placeholder="e.g., Make it more engaging, add a call-to-action, improve the tone to be more professional, add emojis, make it shorter, include a compelling opening line..."
                            value={polishPrompt}
                            onChange={(e) => setPolishPrompt(e.target.value)}
                            className="min-h-[140px] resize-none text-sm"
                            disabled={isPolishing}
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowPolishInput(false);
                                setPolishPrompt("");
                              }}
                              disabled={isPolishing}
                              size="sm"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={!polishPrompt.trim() || isPolishing}
                              size="sm"
                              className="bg-purple-600 text-white hover:bg-purple-700"
                            >
                              {isPolishing ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Polishing...
                                </>
                              ) : (
                                <>
                                  <Wand2 className="h-4 w-4 mr-2" />
                                  Polish
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>

                  {/* Variant Navigation */}
                  {rewrittenVariants.length > 1 && !isRewriting && (
                    <div className="flex items-center gap-1 rounded-md border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 flex-shrink-0">
                      <button
                        type="button"
                        onClick={handlePreviousVariant}
                        disabled={currentVariantIndex === 0}
                        className="flex items-center justify-center p-1.5 text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-200 dark:hover:bg-slate-800"
                        title="Previous variant"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="px-2 text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        Opt. {currentVariantIndex + 1} of{" "}
                        {rewrittenVariants.length}
                      </span>
                      <button
                        type="button"
                        onClick={handleNextVariant}
                        disabled={
                          currentVariantIndex === rewrittenVariants.length - 1
                        }
                        className="flex items-center justify-center p-1.5 text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-200 dark:hover:bg-slate-800"
                        title="Next variant"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Undo Button */}
                  {originalText && !isRewriting && (
                    <button
                      type="button"
                      onClick={handleUndo}
                      className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap flex-shrink-0"
                      title="Undo rewrite"
                    >
                      <X className="h-3.5 w-3.5" />
                      Undo
                    </button>
                  )}
                </div>
              </div>

              {/* Post Button */}
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!hasText || isSaving || isGenerating || isNavigating}
                size="default"
                className="w-full sm:w-auto flex-shrink-0"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : isNavigating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {postId ? "Edit Post" : "Create Post"}
                  </>
                ) : postId ? (
                  "Edit Post"
                ) : (
                  "Create Post"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
