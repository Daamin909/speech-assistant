"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import ConversationUI from "../components/conversationUI";
import { MicrophoneVisualizer } from "@/components/microphone-visualizer";
import { processVoiceChat } from "@/utils/processVoiceChat";
import type { ChatMessage } from "@/types/chat";

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const respRef = useRef<HTMLAudioElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  const [hasStarted, setHasStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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
          <MicrophoneVisualizer
            isRecording={true}
            onClick={stopRecording}
            size="lg"
            className="scale-125"
          />
          <p className="text-muted-foreground text-sm">Tap to finish</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <MicrophoneVisualizer
          isRecording={false}
          onClick={startRecording}
          size="lg"
          className="scale-125"
        />
        <p className="text-muted-foreground text-sm">Tap to speak again</p>
      </div>
    );
  };

  const startRecording = async () => {
    try {
      setHasStarted(true);
      setIsRecording(true);
      if (audioRef.current) {
        void audioRef.current.play().catch(() => {});
      }

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
      setError("");
    } catch (err) {
      console.error("recording couldn't start:", err);
      setHasStarted(false);
      setIsRecording(false);
      setError("microphone access denied");
    }
  };

  const stopRecording = () => {
    const mediaRecorder = mediaRecRef.current;
    if (mediaRecorder && isRecording) {
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
        await processVoiceChat({
          audioBlob,
          setMessages,
          getMessages: () => messagesRef.current,
          respRef,
          setError,
        });
      };
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const reset = () => {
    setHasStarted(false);
    setIsRecording(false);
    setError("");
    setMessages([]);
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
                <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center shrink-0 mt-0.5">
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
