import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("healthcamp_session")?.value;

  // Static files, Next.js internals, and API routes pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // e.g. favicon.ico, images, static files
  ) {
    return NextResponse.next();
  }

  // Allow login page
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // All page routes require an active session
  // If not signed in, redirect directly to /login
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Extract session role to strictly lock counter operators to /counter only
  try {
    const parts = sessionCookie.split(".");
    if (parts.length >= 2) {
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const json = atob(base64);
      const session = JSON.parse(json);
      const role = session.role;

      // Strictly lock Counter 2 operator (and other counter operators) to /counter ONLY
      if (
        role === "DOCTOR_ASSISTANT" ||
        role === "COUNTER_STAFF" ||
        role === "REGISTRATION_DESK"
      ) {
        if (pathname !== "/counter") {
          return NextResponse.redirect(new URL("/counter", request.url));
        }
      } else if (role === "DOCTOR") {
        if (pathname === "/" || pathname === "/counter") {
          return NextResponse.redirect(new URL("/doctor/master-review", request.url));
        }
      } else if (role === "COMPANY_HR") {
        // Client company HR can ONLY access camps directory, camp employee details, and reports
        if (
          pathname.startsWith("/doctor") ||
          pathname.startsWith("/counter") ||
          pathname.startsWith("/admin") ||
          pathname.startsWith("/backoffice") ||
          pathname.startsWith("/assistant") ||
          pathname.startsWith("/registration")
        ) {
          return NextResponse.redirect(new URL("/", request.url));
        }
      }
    }
  } catch {
    // If decoding fails, let the page level auth handle it
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
