"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface BackButtonProps {
  /**
   * The text to display next to the back arrow
   */
  children: React.ReactNode;
  /**
   * The URL to navigate to when clicked. If not provided, will go back in browser history
   */
  href?: string;
  /**
   * Additional CSS classes to apply to the button
   */
  className?: string;
  /**
   * Callback function to execute when the button is clicked
   */
  onClick?: () => void;
}

export function BackButton({
  children,
  href,
  className = "",
  onClick,
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 group ${className}`}
    >
      <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
      {children}
    </button>
  );
}
