/* eslint-disable @typescript-eslint/no-explicit-any */
interface MessagesType {
  role?: "user" | "assistant";
  content?: string;
}

const processVoiceChat = async (
  audioBlob: Blob,
  setMessages: any,
  messages: any,
  respRef: any,
  setError: any
) => {
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

    setMessages((prev: any) => [
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

    const reader = chatRes.body?.getReader();
    const decoder = new TextDecoder();
    let chatResponse = "";

    if (!reader) {
      throw new Error("No response stream available");
    }

    setMessages((prev: any) => [
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

      setMessages((prev: any) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: "assistant",
          content: chatResponse,
        };
        return newMessages;
      });
    }

    const cleanedText = chatResponse.replace(/\$\$%%/g, "");

    const ttsResponse = await fetch("/api/text-to-speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleanedText }),
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

export { processVoiceChat };
