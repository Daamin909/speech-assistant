"use client";

import { ClickablePronunciation } from "@/components/clickable-pronunciation";
import { ComponentProps, ReactNode } from "react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

export type EnhancedMessageResponseProps = ComponentProps<typeof Streamdown>;

export const EnhancedMessageResponse = ({
  className,
  children,
  ...props
}: EnhancedMessageResponseProps) => {
  const processContent = (content: string): ReactNode => {
    const parts: ReactNode[] = [];
    const regex = /\$\$%%\s*(.*?)\s*\$\$%%/g;
    let lastIndex = 0;
    let match;

    const processedContent = content.replace(/\r\n/g, '\n');
    
    while ((match = regex.exec(processedContent)) !== null) {
      if (match.index > lastIndex) {
        const beforeText = processedContent.slice(lastIndex, match.index);
        parts.push(
          <Streamdown
            key={`md-${lastIndex}`}
            className={cn(
              "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
              className
            )}
          >
            {beforeText}
          </Streamdown>
        );
      }

      const exerciseText = match[1];
      parts.push(
        <div
          key={`cp-${match.index}`}
          className="my-2 rounded-md bg-blue-50 p-3 dark:bg-blue-950"
        >
          <ClickablePronunciation text={exerciseText} />
        </div>
      );

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < processedContent.length) {
      const afterText = processedContent.slice(lastIndex);
      parts.push(
        <Streamdown
          key={`md-${lastIndex}`}
          className={cn(
            "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
            className
          )}
        >
          {afterText}
        </Streamdown>
      );
    }

    return parts.length > 0 ? parts : content;
  };

  if (typeof children === "string") {
    const hasSpecialMarkers = /\$\$%%/.test(children);
    
    if (hasSpecialMarkers) {
      return <div className="space-y-2">{processContent(children)}</div>;
    }
  }

  return (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      {...props}
    >
      {children}
    </Streamdown>
  );
};
