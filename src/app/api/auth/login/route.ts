import { NextResponse } from "next/server";
import { authenticateUser, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      termsAcceptedAt: user.termsAcceptedAt,
    });

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error: unknown) {
    const rawMsg = error instanceof Error ? error.message : "";
    if (rawMsg.includes("DATABASE_URL") || rawMsg.includes("Environment variable not found") || rawMsg.includes("connect")) {
      return NextResponse.json(
        { error: "Database not configured: Please add your DATABASE_URL in your Vercel Project Settings (Environment Variables)." },
        { status: 500 }
      );
    }
    const msg = error instanceof Error ? error.message : "Authentication error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
