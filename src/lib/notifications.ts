import { prisma } from "./db";

export interface NotificationResult {
  success: boolean;
  messageId: string;
  channel: "SMS" | "WHATSAPP" | "EMAIL";
  recipient: string;
  simulated: boolean;
  status: "SENT" | "QUEUED" | "FAILED";
  error?: string;
}

export class NotificationService {
  /**
   * Queue or send an SMS / WhatsApp message to an employee.
   * If offline or in local development, it records to the persistent NotificationQueue.
   */
  static async sendHealthCheckCompleteNotification(employeeId: string): Promise<NotificationResult> {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { camp: true, company: true },
    });

    if (!employee) {
      throw new Error("Employee not found for notification");
    }

    const message = `Dear ${employee.fullName}, your annual health check-up at ${employee.company.name} (Camp: ${employee.camp.name}) is completed. Your reports will be shared once the doctor's final review is complete. Health ID: ${employee.healthId}.`;

    const queueItem = await prisma.notificationQueue.create({
      data: {
        employeeId: employee.id,
        channel: "WHATSAPP",
        recipient: employee.mobile,
        messageText: message,
        status: "SENT", // In local mode, marked as SENT to simulated provider
        attempts: 1,
        lastAttempt: new Date(),
      },
    });

    console.log(`[Simulated Notification - WHATSAPP] To: ${employee.mobile} | Health ID: ${employee.healthId}`);
    console.log(`Message: ${message}`);

    return {
      success: true,
      messageId: queueItem.id,
      channel: "WHATSAPP",
      recipient: employee.mobile,
      simulated: true,
      status: "SENT",
    };
  }

  /**
   * Enqueue company daily or final report email
   */
  static async queueCompanyReportEmail(params: {
    companyId: string;
    campId: string;
    reportType: "DAILY_SUMMARY" | "FINAL_CAMP_SUMMARY" | "FINAL_MEDICAL_REPORTS";
    recipientEmail: string;
    subject: string;
    bodyHtml: string;
    attachmentPath?: string;
  }) {
    const emailItem = await prisma.emailQueue.create({
      data: {
        companyId: params.companyId,
        campId: params.campId,
        reportType: params.reportType,
        recipientEmail: params.recipientEmail,
        subject: params.subject,
        bodyHtml: params.bodyHtml,
        attachmentPath: params.attachmentPath || null,
        status: "SENT", // Local mode simulated delivery
        attempts: 1,
        sentAt: new Date(),
      },
    });

    console.log(`[Simulated Email Outbox] To: ${params.recipientEmail} | Subject: ${params.subject}`);
    return emailItem;
  }
}
