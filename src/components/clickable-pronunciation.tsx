"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

interface ClickablePronunciationProps {
  text: string;
  className?: string;
}

export const ClickablePronunciation = ({
  text,
  className,
}: ClickablePronunciationProps) => {
  const [activeWord, setActiveWord] = useState<number | null>(null);

  const speakWord = (word: string, index: number) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;
      setActiveWord(index);

      utterance.onend = () => {
        setActiveWord(null);
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const words = text.split(/(\s+)/);

  return (
    <span className={cn("inline", className)}>
      {words.map((word, index) => {
        if (word.trim() === "") {
          return <span key={index}>{word}</span>;
        }

        return (
          <button
            key={index}
            onClick={() => speakWord(word.trim(), index)}
            className={cn(
              "inline-block cursor-pointer rounded px-2 py-1 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900 text-xl",
              activeWord === index && "bg-blue-200 dark:bg-blue-800"
            )}
            type="button"
          >
            {word}
          </button>
        );
      })}
    </span>
  );
};
