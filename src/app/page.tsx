"use client";

import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import ConversationUI from "../components/conversationUI";
import { MicrophoneVisualizer } from "@/components/microphone-visualizer";

interface MessagesType {
  role?: "user" | "assistant";
  content?: string;
}
export default function Home() {
  const [messages, setMessages] = useState<MessagesType[]>([]);

  // refs - Remove typing??
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const respRef = useRef<HTMLAudioElement>(null);

  const [hasStarted, setHasStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState("");

  const StartRecordingBtn = () => {
    if (!hasStarted) {
      return (
        <div className="flex flex-col items-center gap-6 animate-fade-in">
          <MicrophoneVisualizer
            isRecording={false}
            onClick={startRecording}
            size="lg"
            className="scale-125"
          />
          <p className="text-muted-foreground text-sm">Tap to begin</p>
        </div>
      );
    }
    if (hasStarted && isRecording) {
      return (
        <div className="flex flex-col items-center gap-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <p className="text-lg font-medium">Listening...</p>
          </div>
          <MicrophoneVisualizer
            isRecording={true}
            onClick={stopRecording}
            size="lg"
          />
          <p className="text-muted-foreground text-sm">Tap to finish</p>
        </div>
      );
    }
  };

  const startRecording = async () => {
    try {
      setHasStarted(true);
      audioRef.current?.play();
      await new Promise((resolve) => setTimeout(resolve, 500));
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError("");
    } catch (err) {
      console.error("recording couldn't start:", err);
      setError("microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecRef.current && isRecording) {
      mediaRecRef.current.stop();
      setIsRecording(false);
      mediaRecRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        mediaRecRef.current?.stream
          .getTracks()
          .forEach((track) => track.stop());
        await processVoiceChat(audioBlob);
      };
    }
  };

  const processVoiceChat = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      const transcript = await fetch("/api/speech-to-text", {
        method: "POST",
        body: formData,
      });

      if (!transcript.ok) {
        throw new Error("couldn't transcribe audio");
      }
      const { text } = await transcript.json();

      // Add user message immediately
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: text,
        },
      ]);

      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: text }],
        }),
      });

      if (!chatRes.ok) {
        throw new Error("failed to get chat response");
      }

      // Handle streaming response
      const reader = chatRes.body?.getReader();
      const decoder = new TextDecoder();
      let chatResponse = "";

      if (!reader) {
        throw new Error("No response stream available");
      }

      // Add empty assistant message that will be updated
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "",
        },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        chatResponse += chunk;

        // Update the last message (assistant) with streaming content
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: "assistant",
            content: chatResponse,
          };
          return newMessages;
        });
      }

      const ttsResponse = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: chatResponse }),
      });

      if (!ttsResponse.ok) {
        throw new Error("Failed to get TTS response");
      }

      const ttsAudioBlob = await ttsResponse.blob();
      const audioUrl = URL.createObjectURL(ttsAudioBlob);

      if (respRef.current) {
        respRef.current.src = audioUrl;
        respRef.current.play();
      }
    } catch (err) {
      console.error("error:", err);
      setError(err instanceof Error ? err.message : "error occurred");
    }
  };

  const reset = () => {
    setHasStarted(false);
    setIsRecording(false);
    setError("");
  };

  return (
    <div className="flex h-[calc(100vh-4rem-0.05rem)] flex-col items-center justify-center relative overflow-hidden">
      <audio src="/start_sound.mp3" ref={audioRef} />
      <audio ref={respRef} />

      <ConversationUI
        messages={messages}
        StartRecordingBtn={StartRecordingBtn}
        isRecording={isRecording}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
      />

      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-background/95 animate-fade-in">
          <div className="max-w-md w-full mx-4 flex flex-col gap-6">
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-destructive text-sm font-bold">!</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Error</h3>
                  <p className="text-muted-foreground">{error}</p>
                </div>
              </div>
            </div>
            <Button
              size="lg"
              onClick={reset}
              className="w-full rounded-xl transition-all"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
