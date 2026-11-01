import { NextResponse } from "next/server";
import { getSession, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { version, agreed } = await req.json();
    if (!agreed) {
      return NextResponse.json({ error: "Terms must be affirmed and accepted." }, { status: 400 });
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const now = new Date();
    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        termsAcceptedAt: now,
        termsAcceptedIp: ip,
        termsVersion: version || "2026.1",
      },
    });

    // Record forensic audit trail
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        entityType: "USER",
        entityId: session.userId,
        action: "STATUTORY_TERMS_ACCEPTED",
        afterJson: JSON.stringify({
          version: version || "2026.1",
          legalUndertaking: "MEDICOLEGAL_NON_DISCLOSURE_AND_DATA_PRIVACY_AGREEMENT",
          agreedAt: now.toISOString(),
          ipAddress: ip,
        }),
        ipAddress: ip,
        userAgent,
      },
    });

    // Refresh session cookie
    await setSessionCookie({
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      companyId: updatedUser.companyId,
      termsAcceptedAt: now.toISOString(),
    });

    return NextResponse.json({
      success: true,
      termsAcceptedAt: now.toISOString(),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to record terms acceptance";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
