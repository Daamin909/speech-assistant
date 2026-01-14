"use client";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from "@/components/ai/message";
import { EnhancedMessageResponse } from "@/components/enhanced-message-response";
import {
  CopyIcon,
  RefreshCcwIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { useState, type ComponentType } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai/conversation";
import { MicrophoneVisualizer } from "@/components/microphone-visualizer";
import type { ChatMessage } from "@/types/chat";

const ConversationUI = ({
  messages,
  StartRecordingBtn,
  isRecording,
  onStartRecording,
  onStopRecording,
  onRetry,
}: {
  messages: ChatMessage[];
  StartRecordingBtn: ComponentType;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onRetry?: (messageIndex: number) => void;
}) => {
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [disliked, setDisliked] = useState<Record<string, boolean>>({});

  const handleCopy = (content: string) => {
    if (!navigator?.clipboard) return;
    void navigator.clipboard.writeText(content).catch(() => {});
  };

  const handleMicrophoneClick = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  return (
    <Conversation className="relative size-full">
      <ConversationContent className="px-4 py-8 md:px-8 md:py-10 max-w-5xl mx-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col justify-center w-full h-full items-center gap-6 pt-[30vh] animate-fade-in">
            <div className="flex flex-col items-center gap-4 text-center">
              <h1 className="text-5xl md:text-6xl font-bold">
                speech-assistant
              </h1>
            </div>
            <div className="mt-8">
              <StartRecordingBtn />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {messages.map((message, index) => (
              <div key={index} className="animate-slide-up">
                <Message from={message.role}>
                  <MessageContent>
                    {message.role === "assistant" ? (
                      <EnhancedMessageResponse>
                        {message.content}
                      </EnhancedMessageResponse>
                    ) : (
                      message.content
                    )}
                  </MessageContent>
                </Message>
              </div>
            ))}
          </div>
        )}
      </ConversationContent>
      <ConversationScrollButton />

      {messages.length > 0 && (
        <aside className="fixed right-8 bottom-8 z-10">
          <MicrophoneVisualizer
            isRecording={isRecording}
            onClick={handleMicrophoneClick}
            size="lg"
            className="scale-125"
          />
        </aside>
      )}
    </Conversation>
  );
};

export default ConversationUI;
