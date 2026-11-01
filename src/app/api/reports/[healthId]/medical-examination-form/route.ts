import { NextRequest, NextResponse } from "next/server";
import { generateManasviMedicalExaminationPdf } from "@/lib/pdf-generator";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ healthId: string }> }
) {
  try {
    const { healthId } = await context.params;
    if (!healthId) {
      return NextResponse.json({ error: "Health ID is required" }, { status: 400 });
    }

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

    const pdfBuffer = await generateManasviMedicalExaminationPdf(healthId);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Medical_Examination_Report_${healthId}.pdf"`,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error generating medical examination report";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
