import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== "BACK_OFFICE" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized: Back Office role required" }, { status: 403 });
    }

    const { employeeId, overrideMissing } = await req.json();

    if (!employeeId) {
      return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        counterVisits: {
          include: { campCounter: true },
        },
        bloodResult: true,
        vitalsVision: true,
        diagnosticResults: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Check completeness
    const missingCounters = employee.counterVisits
      .filter((v) => v.campCounter.isMandatory && v.campCounter.counterType !== "DOCTOR_EXAMINATION" && v.campCounter.counterType !== "BACK_OFFICE" && v.status !== "COMPLETED")
      .map((v) => v.campCounter.name);

    if (missingCounters.length > 0 && !overrideMissing) {
      return NextResponse.json(
        {
          error: `Incomplete record. Pending counters: ${missingCounters.join(", ")}`,
          missingCounters,
        },
        { status: 422 }
      );
    }

    // Update status to PENDING_DOCTOR
    await prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id: employeeId },
        data: { status: "PENDING_DOCTOR" },
      });

      // Mark back office counter visit complete
      const backOfficeCounter = await tx.campCounter.findFirst({
        where: { campId: employee.campId, counterType: "BACK_OFFICE" },
      });

      if (backOfficeCounter) {
        await tx.counterVisit.updateMany({
          where: { employeeId: employee.id, campCounterId: backOfficeCounter.id },
          data: {
            status: "COMPLETED",
            operatorId: session.userId,
            completedAt: new Date(),
          },
        });
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          entityType: "EMPLOYEE",
          entityId: employee.id,
          action: "VERIFY",
          afterJson: JSON.stringify({ status: "PENDING_DOCTOR", verifiedBy: session.name }),
        },
      });
    });

    return NextResponse.json({ success: true, message: "Record verified and routed to Doctor Review Queue" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Verification error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
