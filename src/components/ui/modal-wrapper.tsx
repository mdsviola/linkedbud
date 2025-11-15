"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalWrapperProps {
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
  position?: "center" | "bottom-right" | "bottom";
  showCloseButton?: boolean;
  maxWidth?: string;
  maxHeight?: string;
}

export function ModalWrapper({
  children,
  isOpen,
  onOpenChange,
  className,
  position = "center",
  showCloseButton = true,
  maxWidth,
  maxHeight,
}: ModalWrapperProps) {
  const [isMobile, setIsMobile] = React.useState(true);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Determine animation and positioning based on position prop
  const getPositionClasses = () => {
    if (position === "bottom-right") {
      return {
        mobile: "left-4 right-4 bottom-4",
        desktop: "sm:inset-x-auto sm:bottom-6 sm:right-6 sm:left-auto sm:top-auto",
        animation: {
          initial: isMobile ? { opacity: 0, y: 100 } : { opacity: 0, y: 0 },
          animate: isMobile ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 },
          exit: isMobile ? { opacity: 0, y: 100 } : { opacity: 0, y: 0 },
        },
      };
    } else if (position === "bottom") {
      return {
        mobile: "left-4 right-4 bottom-4",
        desktop: "sm:inset-x-auto sm:bottom-auto sm:left-[50%] sm:top-[50%]",
        animation: {
          initial: isMobile
            ? { opacity: 0, y: 100 }
            : { opacity: 0, scale: 0.95, x: "-50%", y: "-50%" },
          animate: isMobile
            ? { opacity: 1, y: 0 }
            : { opacity: 1, scale: 1, x: "-50%", y: "-50%" },
          exit: isMobile
            ? { opacity: 0, y: 100 }
            : { opacity: 0, scale: 0.95, x: "-50%", y: "-50%" },
        },
      };
    } else {
      // center (default)
      return {
        mobile: "left-4 right-4 bottom-4",
        desktop: "sm:inset-x-auto sm:bottom-auto sm:left-[50%] sm:top-[50%]",
        animation: {
          initial: isMobile
            ? { opacity: 0, y: 100 }
            : { opacity: 0, scale: 0.95, x: "-50%", y: "-50%" },
          animate: isMobile
            ? { opacity: 1, y: 0 }
            : { opacity: 1, scale: 1, x: "-50%", y: "-50%" },
          exit: isMobile
            ? { opacity: 0, y: 100 }
            : { opacity: 0, scale: 0.95, x: "-50%", y: "-50%" },
        },
      };
    }
  };

  const positionConfig = getPositionClasses();
  const defaultMaxWidth = position === "bottom-right" ? "sm:max-w-[500px]" : "sm:max-w-lg";

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Backdrop overlay */}
        <DialogPrimitive.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[45] bg-black/50"
          />
        </DialogPrimitive.Overlay>

        {/* Modal content */}
        <DialogPrimitive.Content asChild>
          <motion.div
            initial={positionConfig.animation.initial}
            animate={positionConfig.animation.animate}
            exit={positionConfig.animation.exit}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn(
              "fixed z-[50] rounded-xl border bg-background shadow-lg",
              // Mobile: Full width, bottom slide-up with margins from screen edges
              positionConfig.mobile,
              "max-w-none",
              // Desktop: Position based on position prop
              positionConfig.desktop,
              position === "bottom-right"
                ? "sm:translate-x-0 sm:translate-y-0"
                : "sm:translate-x-[-50%] sm:translate-y-[-50%]",
              defaultMaxWidth,
              "sm:rounded-lg",
              maxHeight && "overflow-y-auto",
              className
            )}
            style={{
              ...(maxHeight && { maxHeight }),
              ...(maxWidth && { maxWidth }),
            }}
          >
            <div className="relative p-6 sm:p-6">
              {showCloseButton && (
                <DialogPrimitive.Close className="absolute right-4 top-6 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
              )}
              {children}
            </div>
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

