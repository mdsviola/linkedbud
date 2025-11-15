"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface UpgradeButtonProps {
  className?: string;
  children?: React.ReactNode;
  planName?: string; // Plan name like "Creator Pro", "Growth", "Creator Lite" (legacy: "Starter", "Lite" also supported)
}

export function UpgradeButton({
  className,
  children = "Upgrade to Creator Pro",
  planName,
}: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    // Only run on client side
    if (typeof window === "undefined") return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planName: planName, // Pass the plan name to the API
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const data = await response.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Checkout Failed",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleUpgrade} disabled={isLoading} className={className}>
      {isLoading ? "Processing..." : children}
    </Button>
  );
}
