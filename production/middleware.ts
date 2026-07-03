import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "./src/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Protected routes: redirect to login if no session.
  // Role enforcement for /admin and /platform is performed server-side in
  // their respective layouts (getAdminContext / getPlatformContext).
  if (
    (pathname.startsWith("/app") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/platform")) &&
    !user
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Login route: redirect to home if already authenticated
  if (pathname === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/app/home";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Match all request paths except for static files and images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
