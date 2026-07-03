import { NextRequest, NextResponse } from "next/server";

const EXPRESS_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const INTERNAL_SECRET = process.env.INTERNAL_SHARED_SECRET;

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!INTERNAL_SECRET) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const formData = await request.formData();
  const audioFile = formData.get("audio");

  if (!audioFile || !(audioFile instanceof File)) {
    return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
  }

  try {
    const forwardForm = new FormData();
    forwardForm.append("file", audioFile, "audio.webm");

    const res = await fetch(`${EXPRESS_URL}/api/voice/stt`, {
      method: "POST",
      headers: {
        "X-Internal-Token": INTERNAL_SECRET,
      },
      body: forwardForm,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("STT error:", text);
      return NextResponse.json({ error: "Transcription failed" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("STT proxy error:", error);
    return NextResponse.json({ error: "Failed to transcribe audio" }, { status: 500 });
  }
}
