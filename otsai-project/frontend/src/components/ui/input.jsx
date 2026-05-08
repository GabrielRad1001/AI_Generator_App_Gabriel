import React from "react";
import { cn } from "../../lib/utils";

export const Input = React.forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full bg-bg-base border border-line text-ink-primary placeholder-ink-muted px-4 py-3 text-sm",
      "focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors",
      "disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full bg-bg-base border border-line text-ink-primary placeholder-ink-muted px-4 py-3 text-sm",
      "focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors resize-y",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Label({ className, ...props }) {
  return <label className={cn("block text-xs uppercase tracking-[0.18em] text-ink-muted mb-2 font-medium", className)} {...props} />;
}
