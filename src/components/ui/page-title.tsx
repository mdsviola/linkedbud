import { ReactNode } from "react";

interface PageTitleProps {
  children: ReactNode;
  className?: string;
}

export function PageTitle({ children, className = "" }: PageTitleProps) {
  return (
    <h1 className={`text-3xl font-bold text-gray-900 ${className}`}>
      {children}
    </h1>
  );
}
