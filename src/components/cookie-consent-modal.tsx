"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cookie, Info, Settings, X } from "lucide-react";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import * as DialogPrimitive from "@radix-ui/react-dialog";

export function CookieConsentModal() {
  const { shouldShowBanner, acceptCookies, rejectCookies, isLoading } =
    useCookieConsent();
  const [open, setOpen] = useState(false);

  // Update modal state when consent status changes
  useEffect(() => {
    // Only show modal if we're not loading and consent is required
    if (!isLoading) {
      setOpen(shouldShowBanner);
    }
  }, [shouldShowBanner, isLoading]);

  const handleAccept = () => {
    acceptCookies();
    setOpen(false);
  };

  const handleReject = () => {
    rejectCookies();
    setOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    // Prevent closing without making a choice on first visit
    if (!isOpen && shouldShowBanner) {
      return;
    }
    setOpen(isOpen);
  };

  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      {/* Backdrop overlay - rendered separately to ensure visibility with modal={false} */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[45] bg-black/20"
          />
        )}
      </AnimatePresence>
      <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange} modal={false}>
        <DialogPrimitive.Portal>
        {/* Mobile: Full width modal at bottom, Desktop: Bottom-right corner */}
        <DialogPrimitive.Content
          asChild
          onInteractOutside={(e) => {
            // Prevent closing by clicking outside when consent is required
            if (shouldShowBanner) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            // Prevent closing with Escape key when consent is required
            if (shouldShowBanner) {
              e.preventDefault();
            }
          }}
        >
          <motion.div
            initial={isMobile ? { opacity: 0, y: 100 } : { opacity: 0, y: 0 }}
            animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            exit={isMobile ? { opacity: 0, y: 100 } : { opacity: 0, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn(
              // Mobile: Full width, bottom slide-up with side margins
              "fixed inset-x-0 bottom-0 z-[50] w-full max-w-none rounded-xl border bg-background shadow-lg max-h-[85vh] overflow-y-auto px-4 pb-4 pointer-events-auto",
              // Desktop: Bottom-right corner (existing behavior)
              "sm:inset-x-auto sm:bottom-4 sm:right-4 sm:left-auto sm:top-auto sm:translate-x-0 sm:translate-y-0 sm:max-w-lg sm:rounded-lg sm:px-0 sm:pb-0"
            )}
          >
          <div className="p-6 sm:p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <Cookie className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold leading-none tracking-tight">
                Cookie Consent
              </h2>
            </div>

            <p className="text-sm text-muted-foreground">
              We use cookies to enhance your experience and provide essential
              functionality.
            </p>

            <Tabs defaultValue="consent" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger
                  value="consent"
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Consent
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="flex items-center gap-2"
                >
                  <Info className="h-4 w-4" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="about" className="flex items-center gap-2">
                  <Cookie className="h-4 w-4" />
                  About
                </TabsTrigger>
              </TabsList>

              <TabsContent value="consent" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    We use cookies to provide authentication and maintain your
                    session. These are essential for the application to function
                    properly.
                  </p>

                  <div className="bg-muted rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold text-sm">What you can do:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Accept all cookies to use all features</li>
                      <li>Reject non-essential cookies (if any are added)</li>
                      <li>Learn more about our cookie usage below</li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button onClick={handleAccept} className="flex-1">
                      Accept All Cookies
                    </Button>
                    <Button
                      onClick={handleReject}
                      variant="outline"
                      className="flex-1"
                    >
                      Reject Non-Essential
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <h3 className="font-semibold">Cookies We Collect</h3>

                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">
                          Essential Cookies
                        </h4>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          Required
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        These cookies are necessary for the website to function
                        and cannot be switched off.
                      </p>
                      <div className="mt-3 space-y-2">
                        <div className="text-xs space-y-1">
                          <p className="font-medium">Authentication Cookies</p>
                          <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                            <li>
                              <strong>Purpose:</strong> Maintains your
                              authenticated session
                            </li>
                            <li>
                              <strong>Duration:</strong> Session-based
                            </li>
                            <li>
                              <strong>Type:</strong> HTTP-only cookies
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">
                          Preference Cookies
                        </h4>
                        <span className="text-xs bg-secondary px-2 py-1 rounded">
                          Optional
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Currently, we do not use any preference or analytics
                        cookies. If we add any in the future, you&apos;ll be
                        able to manage them here.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="about" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <h3 className="font-semibold">What Are Cookies?</h3>

                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      Cookies are small text files that are placed on your
                      device when you visit a website. They are widely used to
                      make websites work more efficiently and provide
                      information to website owners.
                    </p>

                    <div className="bg-muted rounded-lg p-4 space-y-2">
                      <h4 className="font-semibold text-foreground">
                        How We Use Cookies
                      </h4>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>
                          <strong>Authentication:</strong> To keep you logged in
                          and maintain your session
                        </li>
                        <li>
                          <strong>Security:</strong> To protect your account and
                          prevent unauthorized access
                        </li>
                        <li>
                          <strong>Functionality:</strong> To remember your
                          preferences and settings
                        </li>
                      </ul>
                    </div>

                    <div className="bg-muted rounded-lg p-4 space-y-2">
                      <h4 className="font-semibold text-foreground">
                        Your Cookie Choices
                      </h4>
                      <p>
                        You can control cookies through your browser settings.
                        However, disabling essential cookies may prevent the
                        application from functioning properly, as authentication
                        requires cookies to maintain your session.
                      </p>
                    </div>

                    <div className="bg-muted rounded-lg p-4 space-y-2">
                      <h4 className="font-semibold text-foreground">
                        Third-Party Cookies
                      </h4>
                      <p>
                        We use third-party services for authentication, which
                        set necessary cookies for session management. These are
                        essential for the service to function.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
    </>
  );
}
