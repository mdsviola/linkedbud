"use client";

import { useState, ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionItemProps {
  title: string | ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

interface AccordionProps {
  children: ReactNode;
  className?: string;
}

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  className,
}: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm bg-white dark:bg-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 focus-within:ring-offset-white dark:focus-within:ring-offset-slate-800",
        className
      )}
    >
      <button
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all duration-200 group focus:outline-none rounded-xl"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-slate-200 transition-colors">
          {title}
        </span>
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 group-hover:bg-gray-200 dark:group-hover:bg-slate-600 flex items-center justify-center transition-colors">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-gray-600 dark:text-slate-300 transition-transform duration-200" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-600 dark:text-slate-300 transition-transform duration-200" />
            )}
          </div>
        </div>
      </button>
      {isOpen && (
        <div className="overflow-hidden transition-all duration-300 ease-in-out">
          <div className="px-6 pb-8 pt-2 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/30">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export function Accordion({ children, className }: AccordionProps) {
  return <div className={cn("space-y-3 pb-4", className)}>{children}</div>;
}
