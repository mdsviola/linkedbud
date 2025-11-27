"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";

interface AdminContextType {
  isAdmin: boolean;
  loading: boolean;
  checkAdminStatus: () => Promise<void>;
}

export const AdminContext = createContext<AdminContextType | undefined>(
  undefined
);

// Global state to prevent duplicate API calls
let globalAdminState = {
  isAdmin: false,
  loading: true,
  hasChecked: false,
  promise: null as Promise<void> | null,
};

// Function to reset global state (useful for sign out)
export function resetGlobalAdminState() {
  globalAdminState = {
    isAdmin: false,
    loading: true,
    hasChecked: false,
    promise: null,
  };
}

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  // Initialize with default values to prevent hydration mismatch
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const checkAdminStatus = async () => {
    // If already checked, use cached result
    if (globalAdminState.hasChecked) {
      setIsAdmin(globalAdminState.isAdmin);
      setLoading(false);
      return;
    }

    // If a request is already in progress, wait for it
    if (globalAdminState.promise) {
      await globalAdminState.promise;
      if (mountedRef.current) {
        setIsAdmin(globalAdminState.isAdmin);
        setLoading(false);
      }
      return;
    }

    // Create new request promise and assign it synchronously to prevent race conditions
    const requestPromise = (async () => {
      try {
        const response = await fetch("/api/admin/check-status");
        if (response.ok) {
          globalAdminState.isAdmin = true;
        } else {
          globalAdminState.isAdmin = false;
        }
      } catch (error) {
        globalAdminState.isAdmin = false;
      } finally {
        globalAdminState.loading = false;
        globalAdminState.hasChecked = true;
        globalAdminState.promise = null;
      }
    })();

    // Set promise synchronously before awaiting to prevent race conditions
    globalAdminState.promise = requestPromise;
    await requestPromise;

    // Only update state if component is still mounted
    if (mountedRef.current) {
      setIsAdmin(globalAdminState.isAdmin);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only run on client side to prevent hydration issues
    if (typeof window !== "undefined") {
      checkAdminStatus();
    }

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <AdminContext.Provider value={{ isAdmin, loading, checkAdminStatus }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
