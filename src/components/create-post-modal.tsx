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
  Settings2,
  FileText,
  Link as LinkIcon,
  Check,
  Eye,
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
} from "lucide-react";

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

  // State for selected publish target (can be changed by user in the modal)
  const [selectedPublishTarget, setSelectedPublishTarget] =
    useState(publishTarget);

  // Fetch organizations when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchOrganizations = async () => {
        try {
          const response = await fetch("/api/linkedin/organizations");
          const result = await response.json();
          if (response.ok) {
            setOrganizations(
              (result.organizations || []).map(
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
            console.error("Failed to fetch organizations:", result.error);
            setOrganizations([]);
          }
        } catch (err) {
          console.error("Error fetching organizations:", err);
          setOrganizations([]);
        }
      };

      fetchOrganizations();
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
  const getDefaultFormData = useCallback(
    (): CreatePostFormData => {
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
        maxLength: userPreferences?.maxLength || 2000,
        language: userPreferences?.language || storedLanguage,
        userName: userPreferences?.userName,
        userInitials: userPreferences?.userInitials,
      };
    },
    [userPreferences, getStoredLanguage]
  );

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
  const [twoParaSummary, setTwoParaSummary] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showArticleInput, setShowArticleInput] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [rewriteError, setRewriteError] = useState("");
  const [showPublishTargetDropdown, setShowPublishTargetDropdown] =
    useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const articleInputRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textPreviewRef = useRef<HTMLDivElement>(null);
  const publishTargetDropdownRef = useRef<HTMLDivElement>(null);
  const settingsPanelRef = useRef<HTMLDivElement>(null);
  const editableAreaRef = useRef<HTMLDivElement>(null);

  // State for settings scrollability
  const [isSettingsScrollable, setIsSettingsScrollable] = useState(false);
  const [showSettingsShadow, setShowSettingsShadow] = useState(false);

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

  // Check if settings panel is scrollable and show shadow
  useEffect(() => {
    const checkScrollability = () => {
      if (settingsPanelRef.current) {
        const { scrollHeight, clientHeight, scrollTop } = settingsPanelRef.current;
        const isScrollable = scrollHeight > clientHeight;
        setIsSettingsScrollable(isScrollable);
        // Show shadow if scrollable and not at bottom
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5; // 5px threshold
        setShowSettingsShadow(isScrollable && !isAtBottom);
      }
    };

    if (showSettings && settingsPanelRef.current) {
      checkScrollability();
      // Check again after a short delay to account for layout changes
      const timeout = setTimeout(checkScrollability, 100);
      // Also check on scroll
      settingsPanelRef.current.addEventListener('scroll', checkScrollability);
      // Check on resize as well
      window.addEventListener('resize', checkScrollability);

      return () => {
        clearTimeout(timeout);
        settingsPanelRef.current?.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    } else {
      setIsSettingsScrollable(false);
      setShowSettingsShadow(false);
    }
  }, [showSettings, formData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        articleInputRef.current &&
        !articleInputRef.current.contains(event.target as Node)
      ) {
        setShowArticleInput(false);
      }
    };

    if (showArticleInput) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showArticleInput]);

  // Memoize textarea onChange handler to prevent unnecessary re-renders
  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setPostText(e.target.value);
    },
    []
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

      // Set cursor position after the inserted emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);

      setShowEmojiPicker(false);
    },
    [postText]
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
      const newIndex = currentVariantIndex - 1;
      setCurrentVariantIndex(newIndex);
      const variant = rewrittenVariants[newIndex];
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
      const newIndex = currentVariantIndex + 1;
      setCurrentVariantIndex(newIndex);
      const variant = rewrittenVariants[newIndex];
      const variantText = variant.hook
        ? `${variant.hook}\n\n${variant.body}`
        : variant.body;
      setPostText(variantText);
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

  // Memoize text clipping calculations to avoid recalculating on every render
  const shouldClipText = useCallback((text: string): boolean => {
    if (!text || text.length < 180) return false;
    // LinkedIn typically shows 3-4 lines before clipping
    // Approximate: ~180-220 characters per 3-4 lines, or if there are line breaks
    const lineCount = text.split("\n").length;
    // If text has explicit line breaks, check if more than 3 lines
    if (lineCount > 3) return true;
    // For continuous text, clip around 220 characters (approximate 4 lines)
    return text.length > 220;
  }, []);

  const getClippedText = useCallback((text: string): string => {
    // Approximate 3-4 lines: LinkedIn shows around 200-220 chars
    const maxLength = 220;
    if (text.length <= maxLength) return text;
    // Find the last space before maxLength to avoid cutting words
    const clipped = text.substring(0, maxLength);
    const lastSpace = clipped.lastIndexOf(" ");
    const lastNewline = clipped.lastIndexOf("\n");
    // Prefer breaking at newline if it's close
    if (lastNewline > maxLength * 0.7) {
      return text.substring(0, lastNewline);
    }
    return lastSpace > 0 ? clipped.substring(0, lastSpace) : clipped;
  }, []);

  // Memoize computed values
  const hasText = useMemo(() => postText.trim().length > 0, [postText]);
  const shouldShowMoreButton = useMemo(
    () => shouldClipText(postText) && !isTextExpanded,
    [postText, isTextExpanded, shouldClipText]
  );
  const displayText = useMemo(
    () => (shouldShowMoreButton ? getClippedText(postText) : postText),
    [shouldShowMoreButton, postText, getClippedText]
  );

  // Memoize organization name lookup to avoid repeated array searches
  const selectedOrgName = useMemo(() => {
    if (selectedPublishTarget === "personal") return "Personal";
    const org = organizations.find(
      (org) => org.linkedin_org_id === selectedPublishTarget
    );
    return org?.org_name || "Organization";
  }, [selectedPublishTarget, organizations]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl lg:max-w-3xl bg-transparent border-none shadow-none overflow-hidden max-h-[90vh] [&>div]:p-0">
        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900 flex flex-col max-h-[90vh] min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 pr-12 dark:border-slate-800 dark:bg-slate-900 flex-shrink-0">
            {!previewMode && (
              <div className="flex items-center gap-3">
                {/* Profile Picture */}
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                  {formData.userInitials || "U"}
                </div>
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
            )}
            <div
              className={`flex items-center gap-2 ${
                previewMode ? "ml-auto" : ""
              }`}
            >
              <button
                onClick={() => {
                  setPreviewMode(!previewMode);
                  setIsTextExpanded(false);
                }}
                className={`rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 ${
                  previewMode
                    ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                    : ""
                }`}
                title={previewMode ? "Edit" : "Preview"}
              >
                <Eye className="h-4 w-4" />
              </button>
              {!previewMode && (
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Settings"
                >
                  <Settings2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable content area (settings + editable) */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Settings Panel */}
            {showSettings && !previewMode && (
              <div
                ref={settingsPanelRef}
                className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-4 space-y-4 overflow-y-auto relative min-h-[250px]"
              >
              {/* Shadow overlay at bottom when scrollable and not at bottom */}
              {showSettingsShadow && (
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-50 to-transparent dark:from-slate-950 pointer-events-none z-10" />
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tone Selection */}
                <div className="space-y-2">
                  <Label htmlFor="tone">Writing Tone</Label>
                  <select
                    id="tone"
                    value={formData.tone}
                    onChange={(e) => handleInputChange("tone", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {TONE_OPTIONS.map((tone) => (
                      <option key={tone} value={tone}>
                        {tone}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Post Type */}
                <div className="space-y-2">
                  <Label htmlFor="postType">Post Type</Label>
                  <select
                    id="postType"
                    value={formData.postType}
                    onChange={(e) =>
                      handleInputChange("postType", e.target.value)
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                {/* Target Audience */}
                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <select
                    id="targetAudience"
                    value={formData.targetAudience}
                    onChange={(e) =>
                      handleInputChange("targetAudience", e.target.value)
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {AUDIENCE_OPTIONS.map((audience) => (
                      <option key={audience} value={audience}>
                        {audience}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Max Length */}
                <div className="space-y-2">
                  <Label htmlFor="maxLength">Max Character Length</Label>
                  <Input
                    id="maxLength"
                    type="number"
                    value={formData.maxLength}
                    onChange={(e) =>
                      handleInputChange(
                        "maxLength",
                        parseInt(e.target.value) || 2000
                      )
                    }
                    min="500"
                    max="3000"
                    step="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Output Language */}
                <div className="space-y-2">
                  <Label htmlFor="language">Output Language</Label>
                  <select
                    id="language"
                    value={formData.language || "English"}
                    onChange={(e) =>
                      handleInputChange("language", e.target.value)
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includeHashtags"
                    checked={formData.includeHashtags}
                    onChange={(e) =>
                      handleInputChange("includeHashtags", e.target.checked)
                    }
                    className="h-4 w-4 rounded border border-input text-blue-600 focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                  <Label htmlFor="includeHashtags" className="cursor-pointer">
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
                    className="h-4 w-4 rounded border border-input text-blue-600 focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                  <Label
                    htmlFor="includeSourceArticle"
                    className="cursor-pointer"
                  >
                    Mention article source
                  </Label>
                </div>
              </div>
            </div>
          )}

            {previewMode ? (
              /* LinkedIn Feed Preview */
              <div className="bg-white dark:bg-slate-900 flex-1 min-h-0 overflow-y-auto" style={{ minHeight: '200px' }}>
              {/* Post Header - LinkedIn Style */}
              <div className="px-4 py-3 pb-2">
                <div className="flex items-start gap-3">
                  {/* Profile Picture */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-base font-semibold text-white flex-shrink-0">
                    {formData.userInitials || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formData.userName || "You"}
                      </span>
                      {/* Verification Badge */}
                      <div className="h-4 w-4 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        • 1st
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Your Company
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        1w •
                      </span>
                      <Globe className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                      <MoreVertical className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="px-4 pb-3">
                <div
                  ref={textPreviewRef}
                  className="text-sm text-slate-900 dark:text-slate-100 leading-[1.5] whitespace-pre-wrap"
                >
                  {displayText}
                  {shouldShowMoreButton && (
                    <>
                      {" "}
                      <button
                        onClick={() => setIsTextExpanded(true)}
                        className="text-slate-500 dark:text-slate-400 font-medium hover:underline"
                      >
                        ...more
                      </button>
                    </>
                  )}
                  {isTextExpanded && shouldClipText(postText) && (
                    <>
                      <button
                        onClick={() => setIsTextExpanded(false)}
                        className="text-slate-500 dark:text-slate-400 font-medium hover:underline ml-1"
                      >
                        ...less
                      </button>
                    </>
                  )}
                </div>
                {/* Show translation link */}
                {hasText && (
                  <button className="text-xs text-slate-500 dark:text-slate-400 mt-2 hover:underline">
                    Show translation
                  </button>
                )}
              </div>

              {/* Image Preview - LinkedIn Style */}
              {formData.imagePreview && (
                <div className="px-4 pb-3">
                  <div className="relative w-full">
                    <img
                      src={formData.imagePreview}
                      alt="Post image"
                      className="w-full rounded-md object-contain"
                      style={{ maxHeight: "600px" }}
                    />
                  </div>
                </div>
              )}

              {/* Engagement Section */}
              <div className="px-4 pb-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <div className="flex items-center -space-x-1">
                      <div className="h-5 w-5 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                        <ThumbsUp className="h-3 w-3 text-white" />
                      </div>
                      <div className="h-5 w-5 rounded-full bg-red-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                        <Heart className="h-3 w-3 text-white" />
                      </div>
                      <div className="h-5 w-5 rounded-full bg-green-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                        <span className="text-xs">👏</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-400 ml-1">
                      You and X others
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    X comments
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 border-t border-slate-200 dark:border-slate-800 pt-2">
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
                    <ThumbsUp className="h-5 w-5" />
                    <span className="text-sm font-medium">Like</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
                    <MessageCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Comment</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
                    <Repeat2 className="h-5 w-5" />
                    <span className="text-sm font-medium">Repost</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
                    <Send className="h-5 w-5" />
                    <span className="text-sm font-medium">Send</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
              /* Text Input Area - LinkedIn Style */
              <div ref={editableAreaRef} className="flex flex-col px-4 py-4 flex-1 min-h-0 overflow-y-auto" style={{ minHeight: '200px' }}>
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
                  <div className="relative inline-block max-w-full">
                    <img
                      src={formData.imagePreview}
                      alt="Post image preview"
                      className="max-w-full max-h-[400px] rounded-lg object-contain"
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
            )}
          </div>

          {/* Footer */}
          {!previewMode && (
            <div className="border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 flex-shrink-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 relative">
                  {/* Emoji Picker Button */}
                  <div className="relative" ref={emojiPickerRef}>
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

                  {/* Rewrite with AI Button */}
                  <button
                    type="button"
                    onClick={handleRewrite}
                    disabled={!hasText || isRewriting || isGenerating}
                    className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 min-w-[140px]"
                  >
                    {isRewriting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Rewriting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        Rewrite with AI
                      </>
                    )}
                  </button>

                  {/* Variant Navigation */}
                  {rewrittenVariants.length > 1 && !isRewriting && (
                    <div className="flex items-center gap-1 rounded-md border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
                      <button
                        type="button"
                        onClick={handlePreviousVariant}
                        disabled={currentVariantIndex === 0}
                        className="flex items-center justify-center p-1.5 text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-200 dark:hover:bg-slate-800"
                        title="Previous variant"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="px-2 text-xs font-medium text-slate-600 dark:text-slate-400">
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
                      className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      title="Undo rewrite"
                    >
                      <X className="h-3.5 w-3.5" />
                      Undo
                    </button>
                  )}

                  {!formData.imagePreview &&
                    !formData.documentFile &&
                    !formData.documentPreview &&
                    !formData.videoFile &&
                    !formData.videoPreview && (
                      <div className="flex items-center gap-1">
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
                          className="flex h-8 w-8 items-center justify-center rounded text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
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
                          className="flex h-8 w-8 items-center justify-center rounded text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
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
                          className="flex h-8 w-8 items-center justify-center rounded text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                          title="Add video"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                </div>

                {/* Post Button */}
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    !hasText || isSaving || isGenerating || isNavigating
                  }
                  size="default"
                  className="w-full sm:w-auto"
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
