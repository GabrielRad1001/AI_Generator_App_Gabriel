import React from "react";
import { cn } from "../../lib/utils";

export const Button = React.forwardRef(({ className, variant = "primary", size = "md", as: Comp = "button", ...props }, ref) => {
  const base = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-50 disabled:cursor-not-allowed select-none";
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
  };
  const variants = {
    primary: "bg-brand text-bg-base hover:bg-brand-hover hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,255,163,0.18)]",
    secondary: "bg-transparent text-ink-primary border border-line hover:border-brand hover:text-brand",
    ghost: "bg-transparent text-ink-secondary hover:text-ink-primary hover:bg-bg-surface",
    danger: "bg-brand-danger text-white hover:bg-red-500",
    outline: "bg-transparent text-ink-primary border border-line/60 hover:border-line-hover",
  };
  return <Comp ref={ref} className={cn(base, sizes[size], variants[variant], className)} {...props} />;
});
Button.displayName = "Button";
