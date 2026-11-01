import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ campId: string }> }
) {
  try {
    const { campId } = await context.params;

    const counters = await prisma.campCounter.findMany({
      where: { campId },
      include: {
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
      },
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json({ counters });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching counters";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ campId: string }> }
) {
  const session = await getSession();
  if (session && session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized: Super Admin required" }, { status: 403 });
  }

  try {
    const { campId } = await context.params;
    const body = await req.json();
    const {
      name,
      code,
      counterType,
      counterNo,
      isMandatory,
      allowsUpload,
      assignedUserId,
    } = body;

    if (!name || !code) {
      return NextResponse.json({ error: "Counter name and code are required" }, { status: 400 });
    }

    const existingCount = await prisma.campCounter.count({ where: { campId } });
    const orderNo = counterNo ? parseInt(counterNo, 10) : existingCount + 1;

    const counter = await prisma.$transaction(async (tx) => {
      const created = await tx.campCounter.create({
        data: {
          campId,
          counterNo: orderNo,
          name: name.trim(),
          code: code.toUpperCase().trim(),
          counterType: counterType || "CUSTOM",
          displayOrder: orderNo,
          isMandatory: isMandatory !== false,
          allowsUpload: !!allowsUpload,
        },
      });

      if (assignedUserId) {
        await tx.counterAssignment.create({
          data: {
            campId,
            campCounterId: created.id,
            userId: assignedUserId,
          },
        });
      }

      return created;
    });

    return NextResponse.json({ success: true, counter });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error adding counter";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
