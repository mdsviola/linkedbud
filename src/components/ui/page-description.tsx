import { ReactNode } from "react";

interface PageDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function PageDescription({
  children,
  className = "",
}: PageDescriptionProps) {
  return <p className={`text-gray-600 mt-2 ${className}`}>{children}</p>;
}
