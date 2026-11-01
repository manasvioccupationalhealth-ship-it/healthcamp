import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || (session.role !== "DOCTOR" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Only authorized doctors can finalize fitness decisions" }, { status: 403 });
    }

    const body = await req.json();
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "Updates array is required" }, { status: 400 });
    }

    const successful: string[] = [];
    const failed: { healthId: string; reason: string }[] = [];

    for (const item of updates) {
      const { employeeId, healthId, fitnessStatus, adviceList, remarks, restrictions } = item;

      if (!fitnessStatus) {
        failed.push({ healthId: healthId || employeeId, reason: "Fitness status is required" });
        continue;
      }

      if (!["FIT", "UNFIT", "FIT_WITH_RESTRICTION"].includes(fitnessStatus)) {
        failed.push({ healthId: healthId || employeeId, reason: "Invalid fitness option" });
        continue;
      }

      try {
        await prisma.$transaction(async (tx) => {
          const emp = await tx.employee.findUnique({
            where: { id: employeeId },
            include: { fitnessDecision: true },
          });

          if (!emp) {
            throw new Error("Employee not found");
          }

          const existingDecision = emp.fitnessDecision;
          const nextVersion = existingDecision ? existingDecision.version + 1 : 1;

          await tx.fitnessDecision.upsert({
            where: { employeeId: emp.id },
            create: {
              employeeId: emp.id,
              doctorId: session.userId,
              fitnessStatus,
              adviceListJson: JSON.stringify(adviceList || []),
              doctorRemarks: remarks || null,
              restrictions: fitnessStatus === "FIT_WITH_RESTRICTION" ? restrictions || null : null,
              version: 1,
              signedAt: new Date(),
            },
            update: {
              doctorId: session.userId,
              fitnessStatus,
              adviceListJson: JSON.stringify(adviceList || []),
              doctorRemarks: remarks || null,
              restrictions: fitnessStatus === "FIT_WITH_RESTRICTION" ? restrictions || null : null,
              version: nextVersion,
              signedAt: new Date(),
            },
          });

          await tx.employee.update({
            where: { id: emp.id },
            data: { status: "FINALIZED" },
          });

          // Automatic Email & SMS Notification of Final Medical Examination Report Form
          if (emp.email) {
            await tx.emailQueue.create({
              data: {
                companyId: emp.companyId,
                campId: emp.campId,
                reportType: "MANASVI_MEDICAL_EXAMINATION_REPORT",
                recipientEmail: emp.email,
                subject: `Your Medical Examination Report Form - ${emp.fullName} (${emp.healthId})`,
                bodyHtml: `<p>Dear ${emp.fullName},</p><p>All diagnostic tests and clinical doctor consultations have concluded. Your official 2-Page Medical Examination Report Form is certified.</p><p>Medical Fitness Result: <strong>${fitnessStatus}</strong></p><p>You may view or download your signed copy anytime.</p><p>Regards,<br/><strong>Manasvi Occupational Health Service</strong><br/>Shree Swami Samarth Diagnostic & Polyclinic</p>`,
                attachmentPath: `/api/reports/${emp.healthId}/medical-examination-form`,
                status: "SENT",
                sentAt: new Date(),
              },
            });
          }

          await tx.notificationQueue.create({
            data: {
              employeeId: emp.id,
              channel: emp.email ? "EMAIL" : "SMS",
              recipient: emp.email || emp.mobile,
              messageText: `Your Medical Examination Report Form is finalized and available. Result: ${fitnessStatus}. Health ID: ${emp.healthId}`,
              status: "SENT",
              lastAttempt: new Date(),
            },
          });

          // Audit Log
          await tx.auditLog.create({
            data: {
              userId: session.userId,
              entityType: "FITNESS_DECISION",
              entityId: emp.id,
              action: existingDecision ? "UPDATE" : "CREATE",
              beforeJson: existingDecision ? JSON.stringify(existingDecision) : null,
              afterJson: JSON.stringify({ fitnessStatus, adviceList, remarks, version: nextVersion }),
            },
          });
        });

        successful.push(healthId || employeeId);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Database error";
        failed.push({ healthId: healthId || employeeId, reason: msg });
      }
    }

    return NextResponse.json({
      success: true,
      processed: updates.length,
      successful,
      failed,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Bulk submission failure";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
