import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { StreamingTextResponse, streamText } from "ai";

// Initialize providers
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export async function POST(req: Request) {
  try {
    const { messages, provider } = await req.json();

    // ----- OpenAI -----
    if (provider === "openai" && openai) {
      try {
        const response = await streamText({
          model: openai.chat.completions.create({
            model: "gpt-3.5-mini",
            messages,
            stream: true,
          }),
        });
        return new StreamingTextResponse(response);
      } catch (err) {
        console.warn("⚠️ OpenAI failed, falling back to Gemini:", err);
        if (genAI) {
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          const input = messages.map((m: any) => `${m.role}: ${m.content}`).join("\n");
          const result = await model.generateContentStream(input);
          return new StreamingTextResponse(result);
        }
      }
    }

    // ----- Gemini -----
    if (provider === "gemini" && genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const input = messages.map((m: any) => `${m.role}: ${m.content}`).join("\n");
        const result = await model.generateContentStream(input);
        return new StreamingTextResponse(result);
      } catch (err) {
        console.warn("⚠️ Gemini failed, falling back to OpenAI:", err);
        if (openai) {
          const response = await streamText({
            model: openai.chat.completions.create({
              model: "gpt-3.5-mini",
              messages,
              stream: true,
            }),
          });
          return new StreamingTextResponse(response);
        }
      }
    }

    return NextResponse.json(
      { error: "No valid provider or API key." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("❌ Chat API Error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Try again later." },
      { status: 500 }
    );
  }
}
