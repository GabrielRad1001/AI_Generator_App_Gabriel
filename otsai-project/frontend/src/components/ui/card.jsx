import React from "react";
import { cn } from "../../lib/utils";

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "bg-bg-surface border border-line p-6 transition-all duration-300 hover:border-line-hover",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({ children, variant = "default", className }) {
  const variants = {
    default: "bg-bg-elevated text-ink-secondary border-line",
    brand: "bg-brand/10 text-brand border-brand/40",
    danger: "bg-brand-danger/10 text-brand-danger border-brand-danger/40",
    admin: "bg-brand-accent/30 text-brand border-brand/50",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] border font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}
