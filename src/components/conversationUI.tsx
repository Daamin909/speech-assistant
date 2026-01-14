/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai/message";
import {
  CopyIcon,
  RefreshCcwIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai/conversation";
import { MicrophoneVisualizer } from "@/components/microphone-visualizer";

const ConversationUI = ({
  messages,
  StartRecordingBtn,
  isRecording,
  onStartRecording,
  onStopRecording,
}: {
  messages: any[];
  StartRecordingBtn: any;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}) => {
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [disliked, setDisliked] = useState<Record<string, boolean>>({});

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleRetry = () => {
    console.log("Retrying...");
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
              <h1 className="text-3xl md:text-4xl font-bold">
                speech-assistant
              </h1>
            </div>
            <div className="mt-8">
              <StartRecordingBtn />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message, id) => (
              <div key={id} className="animate-slide-up">
                <Message from={message.role}>
                  <MessageContent>
                    {message.role === "assistant" ? (
                      <MessageResponse>{message.content}</MessageResponse>
                    ) : (
                      message.content
                    )}
                  </MessageContent>

                  {message.role === "assistant" && (
                    <MessageActions>
                      <MessageAction
                        label="Retry"
                        onClick={handleRetry}
                        tooltip="Regenerate response"
                      >
                        <RefreshCcwIcon className="size-4" />
                      </MessageAction>

                      <MessageAction
                        label="Like"
                        onClick={() =>
                          setLiked((prev) => ({
                            ...prev,
                            [id]: !prev[id],
                          }))
                        }
                        tooltip="Like this response"
                      >
                        <ThumbsUpIcon
                          className="size-4"
                          fill={liked[id] ? "currentColor" : "none"}
                        />
                      </MessageAction>

                      <MessageAction
                        label="Dislike"
                        onClick={() =>
                          setDisliked((prev) => ({
                            ...prev,
                            [id]: !prev[id],
                          }))
                        }
                        tooltip="Dislike this response"
                      >
                        <ThumbsDownIcon
                          className="size-4"
                          fill={disliked[id] ? "currentColor" : "none"}
                        />
                      </MessageAction>

                      <MessageAction
                        label="Copy"
                        onClick={() => handleCopy(message.content)}
                        tooltip="Copy to clipboard"
                      >
                        <CopyIcon className="size-4" />
                      </MessageAction>
                    </MessageActions>
                  )}
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
