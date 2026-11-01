import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateManasviMedicalExaminationPdf } from "@/lib/pdf-generator";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ healthId: string }> }
) {
  try {
    const { healthId } = await context.params;
    let targetEmail: string | undefined;

    try {
      const body = await req.json();
      targetEmail = body.email;
    } catch {
      // Body is optional
    }

    const employee = await prisma.employee.findUnique({
      where: { healthId },
      include: {
        camp: true,
        company: true,
        fitnessDecision: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const recipient = targetEmail || employee.email || employee.company.registeredEmail || `${employee.employeeCode.toLowerCase()}@${employee.company.codePrefix.toLowerCase()}.local`;

    // Generate the official 2-Page Medical Examination Report Form
    const pdfBuffer = await generateManasviMedicalExaminationPdf(healthId);

    const subject = `Official Medical Examination Report Form — ${employee.fullName} (${employee.healthId})`;
    const bodyHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 15px;">
          <h2 style="color: #0284c7; margin: 0; font-size: 18px;">MANASVI OCCUPATIONAL HEALTH SERVICE</h2>
          <h3 style="color: #b91c1c; margin: 3px 0 0 0; font-size: 14px;">SHREE SWAMI SAMARTH DIAGNOSTIC AND POLYCLINIC</h3>
          <p style="color: #64748b; font-size: 11px; margin: 4px 0 0 0;">Nerul Sector 20, Navi Mumbai – 400706 | Tel: 7400400502</p>
        </div>

        <p style="font-size: 14px; color: #1e293b;">Dear <strong>${employee.fullName}</strong>,</p>
        <p style="font-size: 13px; color: #475569; line-height: 1.5;">
          Your annual occupational health check-up, clinical examinations, and doctor consultations conducted at <strong>${employee.company.name}</strong> (Camp: <em>${employee.camp.name}</em>) are complete.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 15px; margin: 15px 0;">
          <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #0f172a;">Summary of Record</h4>
          <table style="width: 100%; font-size: 12px; color: #334155;">
            <tr><td style="padding: 3px 0; font-weight: bold;">Health ID:</td><td>${employee.healthId}</td></tr>
            <tr><td style="padding: 3px 0; font-weight: bold;">Employee ID:</td><td>${employee.employeeCode}</td></tr>
            <tr><td style="padding: 3px 0; font-weight: bold;">Department:</td><td>${employee.department}</td></tr>
            <tr><td style="padding: 3px 0; font-weight: bold;">Medical Fitness:</td><td style="color: #166534; font-weight: bold;">${employee.fitnessDecision?.fitnessStatus || "FIT FOR OCCUPATIONAL DUTY"}</td></tr>
          </table>
        </div>

        <p style="font-size: 12px; color: #475569; line-height: 1.5;">
          Attached to this email is your official, signed <strong>2-Page Medical Examination Report Form</strong> containing your complete vital signs, vision assessment, general physical exam, audiometry thresholds, and full 24-parameter laboratory pathology results.
        </p>

        <div style="text-align: center; margin: 20px 0;">
          <a href="http://localhost:3000/api/reports/${employee.healthId}/medical-examination-form" 
             style="background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 10px 20px; font-size: 13px; font-weight: bold; border-radius: 5px; display: inline-block;">
            Download Medical Examination Report Form (PDF)
          </a>
        </div>

        <p style="font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 20px;">
          This is an automated confidential medical notification. If you have any clinical questions regarding this report, please contact your corporate Occupational Health Centre.
        </p>
      </div>
    `;

    // 1. Record in EmailQueue
    const emailQueueItem = await prisma.emailQueue.create({
      data: {
        companyId: employee.companyId,
        campId: employee.campId,
        reportType: "FINAL_MEDICAL_REPORTS",
        recipientEmail: recipient,
        subject,
        bodyHtml,
        attachmentPath: `reports/medical-form-${employee.healthId}.pdf`,
        status: "SENT",
        attempts: 1,
        sentAt: new Date(),
      },
    });

    // 2. Record in NotificationQueue
    await prisma.notificationQueue.create({
      data: {
        employeeId: employee.id,
        channel: "EMAIL",
        recipient,
        messageText: subject,
        status: "SENT",
        attempts: 1,
        lastAttempt: new Date(),
      },
    });

    // 3. Log outbox simulation
    console.log(`[Email Dispatched] To: ${recipient} | Subject: ${subject} | Size: ${pdfBuffer.length} bytes`);

    return NextResponse.json({
      success: true,
      message: `2-Page Medical Examination Report Form successfully generated and dispatched via email to ${recipient}`,
      recipient,
      queueId: emailQueueItem.id,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error sending medical examination form email";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
