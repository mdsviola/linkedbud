import React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { PricingPlan, FeatureSection } from "@/marketing/types/marketing";

// PricingCard encapsulates plan presentation and call-to-action handling.
type PricingCardProps = PricingPlan & {
  icon: LucideIcon | LucideIcon[] | string | string[];
  badgeIcon?: LucideIcon | string;
  customButton?: React.ReactNode;
  buttonText?: string;
  customClassName?: string;
};

export function PricingCard({
  icon: Icon,
  name,
  price,
  priceSubtitle,
  description,
  features,
  cta,
  href,
  highlighted,
  badge,
  badgeIcon: BadgeIcon,
  customButton,
  buttonText,
  customClassName,
}: PricingCardProps) {
  const isExternal = href.startsWith("http") || href.startsWith("mailto:");

  return (
    <div
      className={`relative flex h-full flex-col rounded-lg border bg-white p-8 shadow-sm transition dark:bg-slate-900 ${
        customClassName ||
        (highlighted
          ? "border-blue-300 shadow dark:border-blue-600"
          : "border-slate-200 dark:border-slate-800")
      }`}
    >
      {badge ? (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
            {BadgeIcon ? (
              typeof BadgeIcon === "string" ? (
                <span className="text-xs">{BadgeIcon}</span>
              ) : (
                <BadgeIcon className="h-3 w-3" />
              )
            ) : null}
            {badge}
          </span>
        </div>
      ) : null}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {Array.isArray(Icon) ? (
            <div className="flex items-center gap-2">
              {Icon.map((item, index) => {
                if (typeof item === "string") {
                  return (
                    <span key={index} className="text-2xl">
                      {item}
                    </span>
                  );
                }
                const IconComponent = item;
                return (
                  <IconComponent
                    key={index}
                    className={`h-6 w-6 ${highlighted ? "text-blue-600" : "text-slate-600"} dark:text-blue-500`}
                  />
                );
              })}
            </div>
          ) : typeof Icon === "string" ? (
            <span className="text-2xl">{Icon}</span>
          ) : (
            <Icon className={`h-6 w-6 ${highlighted ? "text-blue-600" : "text-slate-600"} dark:text-blue-500`} />
          )}
          <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">{name}</h3>
        </div>
        <div>
          <div className="text-3xl font-semibold text-slate-900 dark:text-white">
            {price.includes("/month") ? (
              <>
                {price.replace("/month", "")}
                <span className="text-xl text-slate-500 dark:text-slate-400 font-normal">/month</span>
              </>
            ) : (
              price
            )}
          </div>
          {priceSubtitle && (
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{priceSubtitle}</div>
          )}
        </div>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{description}</p>
      </div>

      <div className="mt-8 space-y-6 text-sm text-slate-600 dark:text-slate-300">
        {Array.isArray(features) && features.length > 0 && typeof features[0] === "object" && "title" in features[0] ? (
          // Render sections
          (features as FeatureSection[]).map((section) => (
            <div key={section.title} className="space-y-2">
              <h4 className="font-semibold text-slate-900 dark:text-white text-base mb-2">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center flex-shrink-0">
                      <svg
                        aria-hidden="true"
                        className="h-4 w-4 text-blue-600 dark:text-blue-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 0 1 0 1.414l-7.25 7.25a1 1 0 0 1-1.414 0l-3-3a1 1 0 1 1 1.414-1.414L8.5 11.086l6.543-6.543a1 1 0 0 1 1.414 0Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          // Render flat list (backward compatibility)
          <ul className="space-y-3">
            {(features as string[]).map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center">
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4 text-blue-600 dark:text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 0 1 0 1.414l-7.25 7.25a1 1 0 0 1-1.414 0l-3-3a1 1 0 1 1 1.414-1.414L8.5 11.086l6.543-6.543a1 1 0 0 1 1.414 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-auto pt-10">
        {customButton ? (
          customButton
        ) : (
          <Button
            asChild
            size="lg"
            className="w-full rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            {isExternal ? (
              <a href={href}>{buttonText || (name.toLowerCase() === "free" ? "Start for free" : "Subscribe")}</a>
            ) : (
              <Link href={href}>{buttonText || (name.toLowerCase() === "free" ? "Start for free" : "Subscribe")}</Link>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

