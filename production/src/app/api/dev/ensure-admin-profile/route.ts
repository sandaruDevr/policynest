import { NextRequest, NextResponse } from "next/server";
import type { AdminFixtureUser } from "@/lib/auth/admin-fixtures";

// Dev-only route: proxies to Express to create an admin test user.
// Gated by NEXT_PUBLIC_ENABLE_DEV_LOGIN.
export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN !== "true") {
    return NextResponse.json(
      { error: "Dev login is not enabled" },
      { status: 403 },
    );
  }

  const body: AdminFixtureUser = await request.json();
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
        { error: data.error || "Failed to create admin user" },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error calling Express create-test-user (admin):", error);
    return NextResponse.json(
      { error: "Failed to reach backend server" },
      { status: 502 },
    );
  }
}
