import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const { id, updatedRecipient } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 });
    }

    const item = await prisma.notificationQueue.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    const recipient = updatedRecipient || item.recipient;

    const updated = await prisma.$transaction(async (tx) => {
      if (updatedRecipient && updatedRecipient !== item.recipient) {
        // Update employee mobile
        await tx.employee.update({
          where: { id: item.employeeId },
          data: { mobile: updatedRecipient },
        });

        // Audit Log
        await tx.auditLog.create({
          data: {
            userId: session?.userId,
            entityType: "EMPLOYEE",
            entityId: item.employeeId,
            action: "UPDATE_MOBILE",
            beforeJson: JSON.stringify({ mobile: item.recipient }),
            afterJson: JSON.stringify({ mobile: updatedRecipient }),
          },
        });
      }

      return await tx.notificationQueue.update({
        where: { id },
        data: {
          recipient,
          status: "SENT",
          attempts: { increment: 1 },
          lastAttempt: new Date(),
          errorLog: null,
        },
      });
    });

    return NextResponse.json({ success: true, notification: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error retrying notification";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
