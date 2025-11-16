"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogPortal,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PolishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPolish: (prompt: string) => Promise<void>;
  isLoading?: boolean;
  currentContent?: string | {
    hook: string;
    body: string;
  };
}

export function PolishModal({
  isOpen,
  onClose,
  onPolish,
  isLoading = false,
  currentContent,
}: PolishModalProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    await onPolish(prompt.trim());
    setPrompt("");
  };

  const handleClose = () => {
    setPrompt("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose} modal={false}>
      <DialogPortal>
        {/* Custom backdrop scoped only to this modal */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[55] bg-black/50"
              onClick={handleClose}
            />
          )}
        </AnimatePresence>

        <DialogPrimitive.Content
          asChild
          onInteractOutside={(e) => {
            e.preventDefault();
          }}
          onEscapeKeyDown={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed left-[50%] top-[50%] z-[60] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-purple-600" />
                Polish Your Post
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="polish-prompt" className="text-sm font-medium">
                  What would you like to improve?
                </Label>
                <Textarea
                  id="polish-prompt"
                  placeholder="e.g., Make it more engaging, add a call-to-action, improve the tone to be more professional, add emojis, make it shorter, include a compelling opening line..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px] resize-none"
                  disabled={isLoading}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!prompt.trim() || isLoading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? (
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
              </DialogFooter>
            </form>
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
