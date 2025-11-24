"use client";

import { useState, useEffect } from "react";

const PROFILE_PICTURE_CACHE_KEY = "linkedin_profile_picture";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CachedProfilePicture {
  url: string;
  cachedAt: number;
}

/**
 * Hook to fetch and cache LinkedIn profile picture
 * Uses localStorage to cache the profile picture URL to avoid repeated API calls
 */
export function useLinkedInProfilePicture() {
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProfilePicture = async () => {
      // Check cache first
      try {
        const cached = localStorage.getItem(PROFILE_PICTURE_CACHE_KEY);
        if (cached) {
          const cachedData: CachedProfilePicture = JSON.parse(cached);
          const now = Date.now();

          // Check if cache is still valid (within 24 hours)
          if (now - cachedData.cachedAt < CACHE_DURATION) {
            setProfilePicture(cachedData.url);
            setIsLoading(false);
            return; // Use cached value, no need to fetch
          }
        }
      } catch (error) {
        // If cache is corrupted, continue to fetch
        console.debug("Error reading profile picture cache:", error);
      }

      // Cache expired or doesn't exist, fetch from API
      setIsLoading(true);
      try {
        const response = await fetch("/api/linkedin/status");
        if (response.ok) {
          const data = await response.json();
          if (data.connected && data.profile?.profilePicture) {
            const pictureUrl = data.profile.profilePicture;
            setProfilePicture(pictureUrl);

            // Cache the result
            try {
              const cacheData: CachedProfilePicture = {
                url: pictureUrl,
                cachedAt: Date.now(),
              };
              localStorage.setItem(
                PROFILE_PICTURE_CACHE_KEY,
                JSON.stringify(cacheData)
              );
            } catch (cacheError) {
              console.debug("Error caching profile picture:", cacheError);
            }
          } else {
            setProfilePicture(null);
            // Clear cache if no profile picture available
            try {
              localStorage.removeItem(PROFILE_PICTURE_CACHE_KEY);
            } catch (error) {
              // Ignore localStorage errors
            }
          }
        }
      } catch (error) {
        console.debug("Could not fetch LinkedIn profile picture:", error);
        setProfilePicture(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfilePicture();
  }, []);

  /**
   * Manually refresh the profile picture (clears cache and fetches fresh)
   */
  const refresh = async () => {
    try {
      localStorage.removeItem(PROFILE_PICTURE_CACHE_KEY);
    } catch (error) {
      // Ignore localStorage errors
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/linkedin/status");
      if (response.ok) {
        const data = await response.json();
        if (data.connected && data.profile?.profilePicture) {
          const pictureUrl = data.profile.profilePicture;
          setProfilePicture(pictureUrl);

          // Cache the result
          try {
            const cacheData: CachedProfilePicture = {
              url: pictureUrl,
              cachedAt: Date.now(),
            };
            localStorage.setItem(
              PROFILE_PICTURE_CACHE_KEY,
              JSON.stringify(cacheData)
            );
          } catch (cacheError) {
            console.debug("Error caching profile picture:", cacheError);
          }
        } else {
          setProfilePicture(null);
        }
      }
    } catch (error) {
      console.debug("Could not refresh LinkedIn profile picture:", error);
      setProfilePicture(null);
    } finally {
      setIsLoading(false);
    }
  };

  return { profilePicture, isLoading, refresh };
}

