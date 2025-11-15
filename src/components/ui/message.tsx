import React from "react";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type MessageVariant = "error" | "success" | "warning" | "info";

interface MessageProps {
  variant: MessageVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showIcon?: boolean;
}

const variantStyles = {
  error: {
    container: "bg-red-50 border-red-200 text-red-800",
    icon: "text-red-500",
    title: "text-red-900",
    IconComponent: AlertCircle,
  },
  success: {
    container: "bg-green-50 border-green-200 text-green-800",
    icon: "text-green-500",
    title: "text-green-900",
    IconComponent: CheckCircle,
  },
  warning: {
    container: "bg-orange-50 border-orange-200 text-orange-800",
    icon: "text-orange-500",
    title: "text-orange-900",
    IconComponent: AlertTriangle,
  },
  info: {
    container: "bg-blue-50 border-blue-200 text-blue-800",
    icon: "text-blue-500",
    title: "text-blue-900",
    IconComponent: Info,
  },
};

export function Message({
  variant,
  title,
  children,
  className,
  showIcon = true,
}: MessageProps) {
  const styles = variantStyles[variant];
  const IconComponent = styles.IconComponent;

  return (
    <div className={cn("rounded-lg border p-4", styles.container, className)}>
      <div className="flex items-start">
        {showIcon && (
          <IconComponent
            className={cn("h-5 w-5 flex-shrink-0 mt-0.5 mr-3", styles.icon)}
            aria-hidden="true"
          />
        )}
        <div className="flex-1">
          {title && (
            <h3 className={cn("font-semibold mb-1", styles.title)}>{title}</h3>
          )}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}

// Convenience components for common use cases
export function ErrorMessage({
  title = "Error",
  children,
  className,
  showIcon = true,
}: Omit<MessageProps, "variant">) {
  return (
    <Message
      variant="error"
      title={title}
      className={className}
      showIcon={showIcon}
    >
      {children}
    </Message>
  );
}

export function SuccessMessage({
  title = "Success",
  children,
  className,
  showIcon = true,
}: Omit<MessageProps, "variant">) {
  return (
    <Message
      variant="success"
      title={title}
      className={className}
      showIcon={showIcon}
    >
      {children}
    </Message>
  );
}

export function WarningMessage({
  title = "Warning",
  children,
  className,
  showIcon = true,
}: Omit<MessageProps, "variant">) {
  return (
    <Message
      variant="warning"
      title={title}
      className={className}
      showIcon={showIcon}
    >
      {children}
    </Message>
  );
}

export function InfoMessage({
  title = "Info",
  children,
  className,
  showIcon = true,
}: Omit<MessageProps, "variant">) {
  return (
    <Message
      variant="info"
      title={title}
      className={className}
      showIcon={showIcon}
    >
      {children}
    </Message>
  );
}
