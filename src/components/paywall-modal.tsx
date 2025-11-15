"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UpgradeButton } from "@/components/upgrade-button";
import { Crown, Check } from "lucide-react";
import { getStarterPricing, formatPrice, getPricingConfig } from "@/lib/pricing-config";

interface PaywallModalProps {
  onClose: () => void;
}

export function PaywallModal({ onClose }: PaywallModalProps) {
  const starterPricing = getStarterPricing();
  const pricingConfig = getPricingConfig();
  const priceDisplay = typeof starterPricing.monthlyPrice === "number"
    ? `${formatPrice(starterPricing.monthlyPrice, pricingConfig.currency)}/month`
    : "Custom";

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Upgrade to {starterPricing.name}
          </DialogTitle>
          <DialogDescription>
            You&apos;ve used your 3 free draft generations. Unlock unlimited drafts
            and more features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">
              {starterPricing.name} Plan Benefits
            </h3>
            <ul className="space-y-1 text-sm text-blue-800">
              {starterPricing.keyFeatures.slice(0, 4).map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {priceDisplay}
            </div>
            <p className="text-sm text-gray-600 mb-4">Cancel anytime</p>
          </div>

          <div className="flex gap-2">
            <UpgradeButton className="flex-1">Upgrade Now</UpgradeButton>
            <Button variant="outline" onClick={onClose}>
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
