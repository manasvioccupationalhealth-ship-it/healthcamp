import { NextRequest, NextResponse } from "next/server";
import { generateFinalCampAttendanceExcel } from "@/lib/excel-generator";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ campId: string }> }
) {
  try {
    const { campId } = await context.params;
    const session = await getSession(req);

    if (session?.role === "COMPANY_HR" && session.companyId) {
      const camp = await prisma.camp.findUnique({
        where: { id: campId },
        select: { companyId: true },
      });
      if (!camp || camp.companyId !== session.companyId) {
        return NextResponse.json(
          { error: "Access denied. You can only export reports for your company." },
          { status: 403 }
        );
      }
    }

    const excelBuffer = await generateFinalCampAttendanceExcel(campId);

    return new NextResponse(excelBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Final_Camp_Attendance_and_Medical_Summary.xlsx"`,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error generating Final Excel";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
