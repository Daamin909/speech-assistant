import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "missing OpenAI API key" },
        { status: 500 }
      );
    }

    const { text } = await request.json();

    if (typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "no text found" }, { status: 400 });
    }

    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text.trim(),
      response_format: "mp3",
    });

    const stream = response.body;

    if (!stream) {
      throw new Error("No stream available");
    }

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("error ", error);
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }
}
