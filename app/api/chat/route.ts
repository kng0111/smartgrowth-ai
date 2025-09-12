// app/api/chat/route.ts
// 🌱 SmartGrowth AI - Business & Marketing SaaS Backend
// Supports OpenAI + Gemini with tier-based feature gating

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { StreamingTextResponse, streamText } from "ai";

// ---------------------------
// 🔑 Initialize Providers
// ---------------------------
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// ---------------------------
// 🏷️ Feature Tiers
// ---------------------------
const FEATURES: Record<string, string[]> = {
  free: [
    "Basic analytics",
    "Engagement charts",
    "Forecast previews",
  ],
  premium: [
    "Predictive ROI analytics",
    "Customer Lifetime Value (CLTV) modeling",
    "Competitor benchmarking",
    "AI marketing recommendations",
  ],
  organization: [
    "Multi-team dashboards",
    "API access for integrations",
    "Multi-channel auto-optimization",
    "Ad fraud detection",
    "Compliance & audit logs",
  ],
};

// ---------------------------
// 📡 POST Handler
// ---------------------------
export async function POST(req: Request) {
  try {
    const { messages, provider, tier } = await req.json();

    // ---------------------------
    // 🛡️ Enforce Feature Gating
    // ---------------------------
    const activeFeatures = FEATURES[tier?.toLowerCase()] || FEATURES["free"];

    // Attach feature info into the conversation
    messages.push({
      role: "system",
      content: `You are SmartGrowth AI, a marketing SaaS assistant. 
      The active tier is: ${tier || "free"}.
      Available features: ${activeFeatures.join(", ")}.
      Always give insights relevant to business growth, marketing ROI, customer engagement, and campaign optimization.`,
    });

    // ---------------------------
    // ⚡ OpenAI (Primary)
    // ---------------------------
    if (provider === "openai" && openai) {
      try {
        const response = await streamText({
          model: "gpt-4o-mini", // 🚀 Business-optimized OpenAI model
          messages,
          stream: true,
          api: openai,
        });
        return new StreamingTextResponse(response);
      } catch (err) {
        console.warn("⚠️ OpenAI failed, falling back to Gemini:", err);
        return await handleGemini(messages);
      }
    }

    // ---------------------------
    // ⚡ Gemini (Primary)
    // ---------------------------
    if (provider === "gemini" && genAI) {
      try {
        return await handleGemini(messages);
      } catch (err) {
        console.warn("⚠️ Gemini failed, falling back to OpenAI:", err);
        return await handleOpenAI(messages);
      }
    }

    // ---------------------------
    // ❌ Invalid Provider
    // ---------------------------
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

// ---------------------------
// 🔁 Helper Functions
// ---------------------------
async function handleGemini(messages: any[]) {
  if (!genAI) throw new Error("Gemini not configured.");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const input = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
  const result = await model.generateContentStream(input);
  return new StreamingTextResponse(result);
}

async function handleOpenAI(messages: any[]) {
  if (!openai) throw new Error("OpenAI not configured.");
  const response = await streamText({
    model: "gpt-4o-mini",
    messages,
    stream: true,
    api: openai,
  });
  return new StreamingTextResponse(response);
}
