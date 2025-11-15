"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackModal } from "@/components/feedback-modal";
import { createClientClient } from "@/lib/supabase-client";

export function FeedbackWidget() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClientClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <>
      {!isModalOpen && (
        <Button
          onClick={() => setIsModalOpen(true)}
          data-feedback-widget
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-md hover:shadow-lg transition-all duration-200"
          size="icon"
          disabled={isCapturing}
        >
        {isCapturing ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
        <span className="sr-only">Give Feedback</span>
      </Button>
      )}
      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCapturingChange={setIsCapturing}
      />
    </>
  );
}

