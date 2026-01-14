"use client";

import { MicIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MicrophoneVisualizerProps {
  isRecording: boolean;
  onClick: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const MicrophoneVisualizer = ({
  isRecording,
  onClick,
  size = "lg",
  className,
}: MicrophoneVisualizerProps) => {
  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-20 w-20",
  };

  const iconSizes = {
    sm: "size-5",
    md: "size-7",
    lg: "size-9",
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Main button */}
      <button
        onClick={onClick}
        className={cn(
          sizeClasses[size],
          "relative z-10 transition-all duration-200 rounded-2xl",
          "flex items-center justify-center border-2",
          isRecording
            ? "bg-red-500 hover:bg-red-600 border-red-600"
            : "bg-primary hover:bg-primary/90 border-foreground/20 hover:border-foreground/30"
        )}
      >
        <MicIcon className={cn(iconSizes[size], "text-primary-foreground")} />
      </button>
    </div>
  );
};
