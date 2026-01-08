import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    if (!message) {
      return NextResponse.json({ error: "no message found" }, { status: 500 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }],
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
