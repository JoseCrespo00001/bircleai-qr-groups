"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand disabled:opacity-50 disabled:cursor-not-allowed";

const variantClass: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-[#004a85]",
  secondary:
    "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800",
  ghost:
    "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800",
  danger:
    "border border-red-300 bg-white text-red-600 hover:bg-red-50 dark:border-red-800 dark:bg-gray-900 dark:text-red-300 dark:hover:bg-red-950",
};

const sizeClass: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-base",
  lg: "h-12 px-5 text-base",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(base, variantClass[variant], sizeClass[size], className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
