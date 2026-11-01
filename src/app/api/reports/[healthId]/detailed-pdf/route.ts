import { NextRequest, NextResponse } from "next/server";
import { generateDetailedMedicalReportPdf } from "@/lib/pdf-generator";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ healthId: string }> }
) {
  try {
    const { healthId } = await context.params;
    const { getSession } = await import("@/lib/auth");
    const { prisma } = await import("@/lib/db");
    const session = await getSession(req);

    if (session?.role === "COMPANY_HR" && session.companyId) {
      const emp = await prisma.employee.findUnique({
        where: { healthId },
        select: { companyId: true },
      });
      if (!emp || emp.companyId !== session.companyId) {
        return NextResponse.json(
          { error: "Access denied. You can only view reports for employees of your company." },
          { status: 403 }
        );
      }
    }
    const pdfBuffer = await generateDetailedMedicalReportPdf(healthId);

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Medical_Report_${healthId}.pdf"`,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error generating PDF";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
