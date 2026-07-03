import { NextRequest, NextResponse } from "next/server";
import type { StaffFixtureUser } from "@/lib/auth/staff-fixtures";

// Dev-only route: proxies to Express server to create test users.
// Gated by NEXT_PUBLIC_ENABLE_DEV_LOGIN env flag.
export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN !== "true") {
    return NextResponse.json(
      { error: "Dev login is not enabled" },
      { status: 403 },
    );
  }

  const body: StaffFixtureUser = await request.json();
  const expressUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!expressUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_API_URL not configured" },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(`${expressUrl}/api/auth/create-test-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to create test user" },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error calling Express create-test-user:", error);
    return NextResponse.json(
      { error: "Failed to reach backend server" },
      { status: 502 },
    );
  }
}
