"use client";

import { cn } from "@/lib/utils";

interface LoadingIndicatorProps {
  message?: string;
  className?: string;
}

export const LoadingIndicator = ({
  message = "Processing...",
  className,
}: LoadingIndicatorProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-6 animate-fade-in",
        className
      )}
    >
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-muted border-t-foreground animate-spin" />
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-lg font-medium">{message}</p>
      </div>
    </div>
  );
};
