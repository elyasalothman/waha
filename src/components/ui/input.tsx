import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Input({ className, dir = "auto", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      dir={dir}
      className={cn(
        "h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg placeholder:text-subtle",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-subtle",
        className,
      )}
      {...props}
    />
  );
}
