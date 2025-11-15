"use client";

import { ReactNode, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface AuthFormProps {
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string;
  children: ReactNode;
}

export function AuthForm({ onSubmit, loading, error, children }: AuthFormProps) {
  // Show toast when error changes
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error]);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {children}

      <Button 
        type="submit" 
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors" 
        disabled={loading}
      >
        {loading ? "Please wait..." : "Continue"}
      </Button>
    </form>
  );
}

interface AuthFieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
}

export function AuthField({ 
  id, 
  label, 
  type, 
  value, 
  onChange, 
  required = false,
  placeholder 
}: AuthFieldProps) {
  return (
    <div className="space-y-2">
      <Label 
        htmlFor={id} 
        className="text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="h-11 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
      />
    </div>
  );
}
