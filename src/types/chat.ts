export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  isTranscribing?: boolean;
  isGenerating?: boolean;
};
