import { NextResponse } from "next/server";
import OpenAI from "openai";
import { readFile } from "fs/promises";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "no messages found" }, { status: 500 });
    }

    const systemPromptPath = path.join(
      process.cwd(),
      "public",
      "sys_prompt.txt"
    );
    const systemPrompt = await readFile(systemPromptPath, "utf-8");

    const messagesWithSystem = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messagesWithSystem,
    });
    const responseText = completion.choices[0]?.message?.content || "";
    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error("error:", error);
    return NextResponse.json(
      { error: "chat response retrieval failed" },
      { status: 500 }
    );
  }
}
