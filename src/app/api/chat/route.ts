import { NextResponse } from "next/server";
import OpenAI from "openai";
import { readFile } from "fs/promises";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let cachedSystemPrompt: string | null = null;
let cachedSystemPromptPromise: Promise<string> | null = null;

const getSystemPrompt = async () => {
  if (cachedSystemPrompt) {
    return cachedSystemPrompt;
  }

  if (!cachedSystemPromptPromise) {
    const systemPromptPath = path.join(
      process.cwd(),
      "public",
      "sys_prompt.txt"
    );
    cachedSystemPromptPromise = readFile(systemPromptPath, "utf-8").then(
      (prompt) => {
        cachedSystemPrompt = prompt;
        return prompt;
      }
    );
  }

  return cachedSystemPromptPromise;
};

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "missing OpenAI API key" },
        { status: 500 }
      );
    }

    const { messages } = await request.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "no messages found" }, { status: 400 });
    }

    const isValid = messages.every(
      (message) =>
        typeof message?.role === "string" &&
        typeof message?.content === "string"
    );
    if (!isValid) {
      return NextResponse.json(
        { error: "invalid message format" },
        { status: 400 }
      );
    }

    const normalizedMessages = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const systemPrompt = await getSystemPrompt();

    const messagesWithSystem = [
      { role: "system", content: systemPrompt },
      ...normalizedMessages,
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messagesWithSystem,
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("error:", error);
    return NextResponse.json(
      { error: "chat response retrieval failed" },
      { status: 500 }
    );
  }
}
