// app/api/chat/route.ts
// 🌱 SmartGrowth AI - Business & Marketing SaaS Backend
// Supports OpenAI + Gemini with tier-based feature gating

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { StreamingTextResponse, streamText } from "ai";
import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  Firestore,
} from "firebase/firestore";
import { getAuth, signInWithCustomToken, signInAnonymously } from "firebase/auth";

// These global variables are provided by the environment.
// Do not modify them.
declare const __firebase_config: string;
declare const const __app_id: string;
declare const __initial_auth_token: string;

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
  pro: [
    "Predictive ROI analytics",
    "Customer Lifetime Value (CLTV) modeling",
    "Competitor benchmarking",
    "AI marketing recommendations",
    // New: Advanced Campaign Automation for Pro tier
    "AI-guided campaign automation",
    "Automated social media ad campaigns (Instagram, Facebook)",
    "Email marketing campaign generation",
  ],
  enterprise: [
    "Multi-team dashboards",
    "API access for integrations",
    "Multi-channel auto-optimization",
    "Ad fraud detection",
    "Compliance & audit logs",
  ],
};

// ---------------------------
// 🌐 Firebase Initialization
// ---------------------------
let app: FirebaseApp;
let db: Firestore;
let auth: any;
let userId: string | null = null;

const initializeFirebase = async () => {
  if (db) return; // Already initialized

  try {
    const firebaseConfig = JSON.parse(__firebase_config);
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    if (typeof __initial_auth_token !== 'undefined') {
      const userCredential = await signInWithCustomToken(auth, __initial_auth_token);
      userId = userCredential.user.uid;
    } else {
      const userCredential = await signInAnonymously(auth);
      userId = userCredential.user.uid;
    }
    
    if (!userId) {
      userId = "anonymous-user";
    }
  } catch (e) {
    console.error("Firebase initialization failed:", e);
    db = null as any;
  }
};

// ---------------------------
// 📡 POST Handler
// ---------------------------
export async function POST(req: Request) {
  await initializeFirebase();
  if (!db) {
    return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
  }
  
  try {
    const { messages, provider } = await req.json();

    // Fetch the user's plan from Firestore
    const userDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/dashboard/metrics`);
    const userDocSnap = await getDoc(userDocRef);
    const userPlan = userDocSnap.exists() ? userDocSnap.data()?.plan : 'free';
    const tier = userPlan?.toLowerCase() || 'free';

    // ---------------------------
    // 🛡️ Enforce Feature Gating
    // ---------------------------
    const activeFeatures = FEATURES[tier] || FEATURES["free"];

    messages.push({
      role: "system",
      content: `You are SmartGrowth AI, a marketing SaaS assistant.
      The active tier is: ${tier}.
      Available features: ${activeFeatures.join(", ")}.
      For premium users, if they ask to create or automate a campaign, ask for the following details before generating a plan:
      1. Target audience (e.g., age, interests, location).
      2. Campaign goal (e.g., brand awareness, lead generation, sales).
      3. Budget and duration.
      4. Specific social media platform (e.g., Instagram, Facebook, LinkedIn).
      Once these details are provided, generate a detailed campaign plan including ad copy, visual ideas, and a schedule.
      Always give insights relevant to business growth, marketing ROI, customer engagement, and campaign optimization.`,
    });

    // ---------------------------
    // ⚡ OpenAI (Primary)
    // ---------------------------
    if (provider === "openai" && openai) {
      try {
        const response = await streamText({
          model: "gpt-4o-mini",
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
  // Correctly format messages for the Gemini API
  const formattedMessages = messages.map(m => ({
    role: m.role,
    parts: [{ text: m.content }]
  }));
  const result = await model.generateContentStream({ contents: formattedMessages });
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
