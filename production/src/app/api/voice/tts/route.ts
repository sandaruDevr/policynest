import { NextRequest, NextResponse } from "next/server";

const EXPRESS_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const INTERNAL_SECRET = process.env.INTERNAL_SHARED_SECRET;

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!INTERNAL_SECRET) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const body = await request.json();
  const { text, voice } = body;

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  try {
    const res = await fetch(`${EXPRESS_URL}/api/voice/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Token": INTERNAL_SECRET,
      },
      body: JSON.stringify({ text, voice: voice || "nova" }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("TTS error:", errText);
      return NextResponse.json({ error: "Speech synthesis failed" }, { status: res.status });
    }

    const audioBuffer = await res.arrayBuffer();
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("TTS proxy error:", error);
    return NextResponse.json({ error: "Failed to synthesize speech" }, { status: 500 });
  }
}
