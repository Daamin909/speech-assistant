"use client";

import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";

export default function Home() {
  // refs - Remove typing??
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const respRef = useRef<HTMLAudioElement>(null);

  const [hasStarted, setHasStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");

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
    setIsLoading(true);
    setResponse("");

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
      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!chatRes.ok) {
        throw new Error("failed to get chat response");
      }

      const { response: chatResponse } = await chatRes.json();
      setResponse(chatResponse);
      const tts = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: chatResponse }),
      });
      if (!tts.ok) {
        throw new Error("Failed to convert text to speech");
      }

      const audiodata = await tts.blob();
      const audiobloburl = URL.createObjectURL(audiodata);
      if (respRef.current) {
        respRef.current.src = audiobloburl;
        respRef.current.play();
      }
    } catch (err) {
      console.error("error:", err);
      setError(err instanceof Error ? err.message : "error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setHasStarted(false);
    setIsRecording(false);
    setIsLoading(false);
    setResponse("");
    setError("");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black p-8">
      <audio src="/start_sound.mp3" ref={audioRef} />
      <audio ref={respRef} />

      {!hasStarted && (
        <Button
          size={"lg"}
          className="text-7xl w-fit h-fit py-5 px-7"
          onClick={startRecording}
        >
          Start
        </Button>
      )}

      {hasStarted && isRecording && (
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
            <p className="text-xl">Recording...</p>
          </div>
          <Button
            size={"lg"}
            className="text-5xl w-fit h-fit py-4 px-6"
            onClick={stopRecording}
            variant="destructive"
          >
            Stop
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100 rounded-full animate-spin" />
          <p className="text-xl">Processing...</p>
        </div>
      )}

      {response && !isLoading && (
        <div className="max-w-4xl w-full flex flex-col gap-6">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-lg max-h-[70vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-4">Response:</h2>
            <p className="text-lg leading-relaxed">{response}</p>
          </div>
          <Button
            size={"lg"}
            className="text-3xl w-fit h-fit py-3 px-5 mx-auto"
            onClick={reset}
          >
            New Chat
          </Button>
        </div>
      )}

      {error && (
        <div className="max-w-2xl w-full flex flex-col gap-6">
          <div className="bg-red-100 dark:bg-red-900 rounded-lg p-6">
            <p className="text-red-900 dark:text-red-100">{error}</p>
          </div>
          <Button
            size={"lg"}
            className="text-3xl w-fit h-fit py-3 px-5 mx-auto"
            onClick={reset}
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
