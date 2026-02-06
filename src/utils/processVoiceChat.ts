import type { ChatMessage } from "@/types/chat";
import type { Dispatch, RefObject, SetStateAction } from "react";

type ProcessVoiceChatArgs = {
  audioBlob: Blob;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  getMessages: () => ChatMessage[];
  respRef: RefObject<HTMLAudioElement | null>;
  setError: (error: string) => void;
};

const processVoiceChat = async ({
  audioBlob,
  setMessages,
  getMessages,
  respRef,
  setError,
}: ProcessVoiceChatArgs) => {
  try {
    setMessages((prev) =>
      prev.concat({
        role: "user",
        content: "",
        isTranscribing: true,
      }),
    );

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

    if (typeof text !== "string" || text.trim().length === 0) {
      throw new Error("empty transcription");
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: text,
    };

    setMessages((prev) => {
      const next = [...prev];
      next[next.length - 1] = userMessage;
      return next;
    });

    const nextMessages = [...getMessages(), userMessage];

    setMessages((prev) =>
      prev.concat({
        role: "assistant",
        content: "",
        isGenerating: true,
      }),
    );

    const chatRes = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: nextMessages.map(({ role, content }) => ({ role, content })),
      }),
    });

    if (!chatRes.ok) {
      throw new Error("failed to get chat response");
    }

    const reader = chatRes.body?.getReader();
    const decoder = new TextDecoder();
    let chatResponse = "";

    if (!reader) {
      throw new Error("No response stream available");
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      chatResponse += chunk;

      setMessages((prev) => {
        const next = [...prev];
        const lastIndex = next.length - 1;
        if (lastIndex >= 0) {
          next[lastIndex] = { role: "assistant", content: chatResponse };
        }
        return next;
      });
    }

    const cleanedText = chatResponse.replace(/\$\$%%/g, "");

    if (cleanedText.trim().length === 0) {
      return;
    }

    void (async () => {
      try {
        const ttsResponse = await fetch("/api/text-to-speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: cleanedText }),
        });

        if (!ttsResponse.ok || !ttsResponse.body) return;

        const audioEl = respRef.current;
        if (!audioEl) return;

        if (
          typeof window !== "undefined" &&
          "MediaSource" in window &&
          MediaSource.isTypeSupported("audio/mpeg")
        ) {
          const mediaSource = new MediaSource();
          const audioUrl = URL.createObjectURL(mediaSource);

          if (audioEl.src?.startsWith("blob:")) {
            URL.revokeObjectURL(audioEl.src);
          }
          audioEl.src = audioUrl;

          const openPromise = new Promise<void>((resolve) => {
            mediaSource.addEventListener("sourceopen", () => resolve(), {
              once: true,
            });
          });

          await openPromise;

          const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
          const reader = ttsResponse.body.getReader();
          let hasStartedPlaying = false;

          const appendNextChunk = async (chunk: Uint8Array): Promise<void> => {
            return new Promise((resolve, reject) => {
              const onUpdateEnd = () => {
                sourceBuffer.removeEventListener("updateend", onUpdateEnd);
                sourceBuffer.removeEventListener("error", onError);
                resolve();
              };

              const onError = () => {
                sourceBuffer.removeEventListener("updateend", onUpdateEnd);
                sourceBuffer.removeEventListener("error", onError);
                reject(new Error("SourceBuffer error"));
              };

              sourceBuffer.addEventListener("updateend", onUpdateEnd);
              sourceBuffer.addEventListener("error", onError);

              try {
                sourceBuffer.appendBuffer(chunk.slice());
              } catch (e) {
                sourceBuffer.removeEventListener("updateend", onUpdateEnd);
                sourceBuffer.removeEventListener("error", onError);
                reject(e);
              }
            });
          };

          try {
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                if (mediaSource.readyState === "open") {
                  mediaSource.endOfStream();
                }
                break;
              }

              await appendNextChunk(value);

              if (!hasStartedPlaying && sourceBuffer.buffered.length > 0) {
                void audioEl.play().catch(() => {});
                hasStartedPlaying = true;
              }
            }
          } catch (err) {
            console.error("TTS stream error:", err);
          }

          audioEl.onended = () => {
            URL.revokeObjectURL(audioUrl);
          };
        } else {
          const reader = ttsResponse.body.getReader();
          const chunks: Uint8Array[] = [];

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }

          const audioBlob = new Blob(
            chunks.map((chunk) => chunk.slice()),
            { type: "audio/mpeg" },
          );
          const audioUrl = URL.createObjectURL(audioBlob);

          if (audioEl.src?.startsWith("blob:")) {
            URL.revokeObjectURL(audioEl.src);
          }
          audioEl.src = audioUrl;
          void audioEl.play().catch(() => {});

          audioEl.onended = () => {
            URL.revokeObjectURL(audioUrl);
          };
        }
      } catch (err) {
        console.error("TTS error:", err);
      }
    })();
  } catch (err) {
    console.error("error:", err);
    setError(err instanceof Error ? err.message : "error occurred");
  }
};

export { processVoiceChat };
