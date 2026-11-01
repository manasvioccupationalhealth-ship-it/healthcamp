import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password, mobile, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Full name, email address, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in." },
        { status: 409 }
      );
    }

    // Check if this is the very first user in the system; if so, grant SUPER_ADMIN
    const userCount = await prisma.user.count();
    const assignedRole = userCount === 0 ? "SUPER_ADMIN" : role || "COUNTER_STAFF";

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        mobile: mobile ? mobile.trim() : null,
        role: assignedRole,
        isActive: true,
      },
    });

    // Record forensic audit entry
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        entityType: "USER",
        entityId: user.id,
        action: "USER_REGISTERED",
        afterJson: JSON.stringify({
          role: assignedRole,
          registeredAt: new Date().toISOString(),
          isFirstAdmin: userCount === 0,
        }),
      },
    });

    // Set authenticated session cookie
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      termsAcceptedAt: null,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Registration failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
