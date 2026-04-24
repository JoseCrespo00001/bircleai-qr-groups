"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-base text-gray-900 placeholder:text-gray-400",
      "focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20",
      "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
