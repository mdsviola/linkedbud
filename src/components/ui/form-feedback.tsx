import { FormStatus } from "@/hooks/useFormSubmission";
import {
  Message,
  ErrorMessage,
  SuccessMessage,
  InfoMessage,
} from "@/components/ui/message";

interface FormFeedbackProps {
  status: FormStatus;
  message: string;
  className?: string;
}

export function FormFeedback({
  status,
  message,
  className = "",
}: FormFeedbackProps) {
  if (status === "idle" || !message) return null;

  switch (status) {
    case "error":
      return <ErrorMessage className={className}>{message}</ErrorMessage>;
    case "success":
      return <SuccessMessage className={className}>{message}</SuccessMessage>;
    case "submitting":
      return <InfoMessage className={className}>{message}</InfoMessage>;
    default:
      return null;
  }
}
