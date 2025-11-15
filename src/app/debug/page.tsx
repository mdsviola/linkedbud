"use client";

import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreatePostModal } from "@/components/create-post-modal";
import { CanvasLoading } from "@/components/canvas-loading";

export default function DebugPage() {
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (formData: any) => {
    setIsGenerating(true);
    // Simulate generation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("Generated with data:", formData);
    setIsGenerating(false);
    setShowCreatePostModal(false);
    toast({
      title: "Post Generated",
      description: "Post generated! (Check console for form data)",
      variant: "success",
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Create Post Modal Prototype</h1>

      <Card>
        <CardHeader>
          <CardTitle>Create Post Modal</CardTitle>
          <CardDescription>
            Test the improved Create Post Modal UI/UX
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setShowCreatePostModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Open Create Post Modal
          </Button>
        </CardContent>
      </Card>

      <CreatePostModal
        isOpen={showCreatePostModal}
        onClose={() => setShowCreatePostModal(false)}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        userPreferences={{
          tone: "Conversational",
          postType: "Industry News",
          targetAudience: "Entrepreneurs",
          maxLength: 1500,
          includeHashtags: true,
          userName: "John Doe",
          userInitials: "JD",
        }}
      />

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Canvas Loading Component</CardTitle>
          <CardDescription>
            Test the canvas loading component with random messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[600px] rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <CanvasLoading />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
