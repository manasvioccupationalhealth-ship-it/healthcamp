import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getSession();
  if (session && session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const staff = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      mobile: true,
      isActive: true,
      counterAssignments: {
        include: {
          camp: { select: { id: true, name: true, campId: true } },
          campCounter: { select: { id: true, counterNo: true, name: true, code: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ staff });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (session && session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { name, email, password, role, mobile } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Name, email, password, and role are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role,
        mobile: mobile ? mobile.trim() : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mobile: true,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error creating staff account";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
