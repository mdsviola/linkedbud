import { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-server";

const STORAGE_BUCKET = "storage";

/**
 * Generate storage path for a post file
 * @param userId User ID
 * @param postId Post ID
 * @param type 'images', 'docs', or 'videos'
 * @param filename Original filename
 * @returns Storage path string
 */
export function generateStoragePath(
  userId: string,
  postId: number,
  type: "images" | "docs" | "videos",
  filename: string
): string {
  // Sanitize filename to prevent path traversal
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `posts/${userId}/${postId}/${type}/${sanitizedFilename}`;
}

/**
 * Extract file path from Supabase storage URL
 * @param url Full Supabase storage URL
 * @returns File path relative to bucket, or null if URL is invalid
 */
export function extractFilePathFromUrl(url: string): string | null {
  try {
    // Supabase storage URLs have format:
    // https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[path]
    const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Upload a file to Supabase storage
 * @param supabase Supabase client instance
 * @param file File to upload
 * @param storagePath Path in storage bucket
 * @returns Storage path (relative path), or null if upload failed
 */
export async function uploadFileToStorage(
  supabase: SupabaseClient,
  file: File,
  storagePath: string
): Promise<string | null> {
  try {
    // Convert File to ArrayBuffer for server-side compatibility
    // The File object from FormData in Next.js needs to be converted
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Use admin client for storage operations to bypass RLS
    // This is necessary because storage buckets may have RLS policies
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, fileBuffer, {
        cacheControl: "3600",
        upsert: true, // Allow overwriting existing files (useful when updating posts)
        contentType: file.type || "application/octet-stream",
      });

    if (error) {
      console.error("Error uploading file to storage:", error);
      // Check if it's a size-related error
      if (error.message && (error.message.includes("size") || error.message.includes("too large") || error.message.includes("limit"))) {
        throw new Error("File size exceeds the maximum allowed limit");
      }
      return null;
    }

    if (!data) {
      console.error("No data returned from storage upload");
      return null;
    }

    // Return the storage path (relative path) instead of full URL
    return data.path;
  } catch (error) {
    console.error("Exception uploading file to storage:", error);
    // Re-throw size-related errors so they can be caught and handled gracefully
    if (error instanceof Error && (error.message.includes("size") || error.message.includes("too large") || error.message.includes("limit"))) {
      throw error;
    }
    return null;
  }
}

/**
 * Generate a signed URL for a storage path (requires authenticated user)
 * Uses admin client to bypass RLS, which is safe since user authentication
 * is already verified at the API route level
 * @param supabase Supabase client instance (with user authentication)
 * @param storagePath Relative path in storage bucket
 * @param expiresIn Expiration time in seconds (default: 1 hour)
 * @returns Signed URL, or null if generation failed
 */
export async function getSignedStorageUrl(
  supabase: SupabaseClient,
  storagePath: string | null,
  expiresIn: number = 3600
): Promise<string | null> {
  if (!storagePath) return null;

  try {
    // Use admin client for signed URL generation to bypass RLS
    // This is safe because user authentication is verified at the API route level
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      // Log but don't throw - file might not exist (deleted, etc.)
      console.error("Error creating signed URL for path:", storagePath, error);
      return null;
    }

    if (!data?.signedUrl) {
      console.error("No signed URL returned for path:", storagePath);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Exception creating signed URL for path:", storagePath, error);
    return null;
  }
}

/**
 * Download a file from Supabase storage
 * @param supabase Supabase client instance
 * @param storagePath Relative path in storage bucket
 * @returns File buffer, or null if download failed
 */
export async function downloadFileFromStorage(
  supabase: SupabaseClient,
  storagePath: string | null
): Promise<Buffer | null> {
  if (!storagePath) return null;

  try {
    // Use admin client for storage operations to bypass RLS
    // This is safe because user authentication is verified at the API route level
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .download(storagePath);

    if (error) {
      console.error("Error downloading file from storage:", storagePath, error);
      return null;
    }

    if (!data) {
      console.error("No data returned from storage download:", storagePath);
      return null;
    }

    // Convert Blob/ArrayBuffer to Buffer
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("Exception downloading file from storage:", storagePath, error);
    return null;
  }
}

/**
 * Get the full public URL for a storage path (for public buckets)
 * @param storagePath Relative path in storage bucket
 * @returns Full public URL, or null if path is invalid
 */
export function getStorageUrl(storagePath: string | null): string | null {
  if (!storagePath) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error("NEXT_PUBLIC_SUPABASE_URL is not set");
    return null;
  }

  // Construct the full URL: https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[path]
  return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${storagePath}`;
}

/**
 * Delete a file from Supabase storage
 * @param supabase Supabase client instance
 * @param storagePath Path in storage bucket
 * @returns true if deletion succeeded, false otherwise
 */
export async function deleteFileFromStorage(
  supabase: SupabaseClient,
  storagePath: string
): Promise<boolean> {
  try {
    // Use admin client for storage operations to bypass RLS
    const { error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath]);

    if (error) {
      console.error("Error deleting file from storage:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception deleting file from storage:", error);
    return false;
  }
}

/**
 * Delete a file from Supabase storage by URL or path
 * @param supabase Supabase client instance
 * @param urlOrPath Full Supabase storage URL or relative storage path
 * @returns true if deletion succeeded, false otherwise
 */
export async function deleteFileFromStorageByUrl(
  supabase: SupabaseClient,
  urlOrPath: string
): Promise<boolean> {
  // Check if it's already a path (starts with "posts/") or a full URL
  let filePath: string;

  if (urlOrPath.startsWith("posts/")) {
    // It's already a relative path
    filePath = urlOrPath;
  } else {
    // It's a full URL, extract the path
    const extractedPath = extractFilePathFromUrl(urlOrPath);
    if (!extractedPath) {
      console.error("Invalid storage URL or path:", urlOrPath);
      return false;
    }
    filePath = extractedPath;
  }

  return deleteFileFromStorage(supabase, filePath);
}

/**
 * Generate storage path for feedback screenshot
 * @param userId User ID
 * @param feedbackId Feedback submission ID
 * @param timestamp Timestamp for unique filename
 * @param extension File extension (e.g., 'png', 'jpg')
 * @returns Storage path string
 */
export function generateFeedbackScreenshotPath(
  userId: string,
  feedbackId: number,
  timestamp: number,
  extension: string
): string {
  // Sanitize extension to prevent path traversal
  const sanitizedExt = extension.replace(/[^a-zA-Z0-9]/g, "");
  return `feedback/${userId}/${feedbackId}/screenshot_${timestamp}.${sanitizedExt}`;
}
