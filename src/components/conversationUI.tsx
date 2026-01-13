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
  MessageSquareIcon,
  RefreshCcwIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai/conversation";
import { Button } from "@/components/ui/button";
import { MicIcon } from "lucide-react";

const ConversationUI = ({
  messages,
  StartRecordingBtn,
  isRecording,
  isLoading,
  onStartRecording,
  onStopRecording,
}: {
  messages: any[];
  StartRecordingBtn: any;
  isRecording: boolean;
  isLoading: boolean;
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

  return (
    <Conversation className="relative size-full">
      <ConversationContent className="p-10">
        {messages.length === 0 ? (
          <div className="flex flex-col justify-center w-full h-full items-center gap-4 pt-[35vh]">
            {/* <ConversationEmptyState
              icon={<MessageSquareIcon className="size-6" />}
              title="Start a conversation"
            /> */}
            <StartRecordingBtn />
          </div>
        ) : (
          messages.map((message, id) => (
            <Message from={message.role} key={id}>
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
          ))
        )}
      </ConversationContent>
      <ConversationScrollButton />

      {messages.length > 0 && !isLoading && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          {!isRecording ? (
            <Button
              size="lg"
              onClick={onStartRecording}
              className="rounded-full h-16 w-16 p-0 shadow-lg hover:shadow-xl transition-all"
            >
              <MicIcon className="size-6" />
            </Button>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 bg-background px-4 py-2 rounded-full shadow-lg border">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Recording...</span>
              </div>
              <Button
                size="lg"
                onClick={onStopRecording}
                variant="destructive"
                className="rounded-full h-14 w-14 p-0 shadow-lg"
              >
                <span className="text-xl">■</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </Conversation>
  );
};

export default ConversationUI;
