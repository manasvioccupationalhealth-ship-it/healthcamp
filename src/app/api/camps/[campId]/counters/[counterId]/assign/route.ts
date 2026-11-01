import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ campId: string; counterId: string }> }
) {
  const session = await getSession();
  if (session && session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized: Super Admin required" }, { status: 403 });
  }

  try {
    const { campId, counterId } = await context.params;
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Check counter exists
    const counter = await prisma.campCounter.findUnique({
      where: { id: counterId },
    });
    if (!counter || counter.campId !== campId) {
      return NextResponse.json({ error: "Counter not found" }, { status: 404 });
    }

    // Remove existing assignments for this counter
    await prisma.counterAssignment.deleteMany({
      where: {
        campCounterId: counterId,
      },
    });

    let assignment = null;
    if (userId && userId !== "none" && userId !== "unassign") {
      assignment = await prisma.counterAssignment.create({
        data: {
          campId,
          campCounterId: counterId,
          userId,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });
    }

    return NextResponse.json({ success: true, assignment });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error assigning operator";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

