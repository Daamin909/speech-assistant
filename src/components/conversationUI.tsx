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

const ConversationUI = ({ messages }: { messages: any[] }) => {
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
      <ConversationContent>
        {messages.length === 0 ? (
          <ConversationEmptyState
            description="Messages will appear here as the conversation progresses."
            icon={<MessageSquareIcon className="size-6" />}
            title="Start a conversation"
          />
        ) : (
          messages.map((message) => (
            <Message from={message.role} key={message.key}>
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
                        [message.key]: !prev[message.key],
                      }))
                    }
                    tooltip="Like this response"
                  >
                    <ThumbsUpIcon
                      className="size-4"
                      fill={liked[message.key] ? "currentColor" : "none"}
                    />
                  </MessageAction>

                  <MessageAction
                    label="Dislike"
                    onClick={() =>
                      setDisliked((prev) => ({
                        ...prev,
                        [message.key]: !prev[message.key],
                      }))
                    }
                    tooltip="Dislike this response"
                  >
                    <ThumbsDownIcon
                      className="size-4"
                      fill={disliked[message.key] ? "currentColor" : "none"}
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
    </Conversation>
  );
};

export default ConversationUI;
