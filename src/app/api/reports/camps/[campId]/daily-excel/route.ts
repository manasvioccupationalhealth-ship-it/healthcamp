import { NextRequest, NextResponse } from "next/server";
import { generateDailyCampExcel } from "@/lib/excel-generator";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ campId: string }> }
) {
  try {
    const { campId } = await context.params;
    const excelBuffer = await generateDailyCampExcel(campId);

    return new NextResponse(excelBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Daily_Camp_Report_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error generating Daily Excel";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
