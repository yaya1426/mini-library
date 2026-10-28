import { AlertTriangle } from "lucide-react";
import type * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface FormFieldProps
  extends Omit<React.ComponentProps<typeof Input>, "id"> {
  id: string;
  label: React.ReactNode;
  error?: string | string[] | null;
  helperText?: React.ReactNode;
  containerClassName?: string;
}

export function FormField({
  id,
  label,
  error,
  helperText,
  containerClassName,
  className,
  ...inputProps
}: FormFieldProps) {
  const errorMessage = Array.isArray(error) ? error[0] : error;
  const hasError = Boolean(errorMessage);
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  const describedBy = [
    hasError ? errorId : null,
    helperText ? helperId : null,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-2 text-start", containerClassName)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy}
        className={className}
        {...inputProps}
      />
      {helperText && !hasError ? (
        <p id={helperId} className="text-sm font-medium text-gray-600">
          {helperText}
        </p>
      ) : null}
      {hasError ? (
        <p
          id={errorId}
          role="alert"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-black"
        >
          <AlertTriangle
            className="size-4 shrink-0"
            strokeWidth={2.5}
            aria-hidden="true"
          />
          <span>{errorMessage}</span>
        </p>
      ) : null}
    </div>
  );
}
