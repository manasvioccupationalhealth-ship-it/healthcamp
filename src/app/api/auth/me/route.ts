import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      company: true,
      counterAssignments: {
        include: {
          campCounter: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      companyName: user.company?.name,
      termsAcceptedAt: user.termsAcceptedAt ? user.termsAcceptedAt.toISOString() : null,
      counterAssignments: user.counterAssignments.map((ca) => ({
        campId: ca.campId,
        counterId: ca.campCounterId,
        counterNo: ca.campCounter.counterNo,
        counterName: ca.campCounter.name,
        counterType: ca.campCounter.counterType,
      })),
    },
  });
}
