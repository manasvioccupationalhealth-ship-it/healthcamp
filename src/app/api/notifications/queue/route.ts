import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const notifications = await prisma.notificationQueue.findMany({
    include: {
      employee: {
        include: { company: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const emails = await prisma.emailQueue.findMany({
    include: {
      company: true,
      camp: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ notifications, emails });
}
