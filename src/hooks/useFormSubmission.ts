import { useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

export type FormStatus = "idle" | "submitting" | "success" | "error";

export interface FormSubmissionState {
  status: FormStatus;
  message: string;
  submit: (
    submitFn: () => Promise<void>,
    successMessage?: string
  ) => Promise<void>;
  reset: () => void;
}

export function useFormSubmission(): FormSubmissionState {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  const submit = useCallback(
    async (submitFn: () => Promise<void>, successMessage?: string) => {
      setStatus("submitting");
      setMessage("");

      try {
        await submitFn();
        setStatus("success");
        const successMsg = successMessage || "Form submitted successfully!";
        setMessage(successMsg);
        toast({
          title: "Success",
          description: successMsg,
          variant: "success",
        });
      } catch (error) {
        setStatus("error");
        const errorMsg = error instanceof Error ? error.message : "Form submission failed";
        setMessage(errorMsg);
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
      }
    },
    []
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setMessage("");
  }, []);

  return {
    status,
    message,
    submit,
    reset,
  };
}
