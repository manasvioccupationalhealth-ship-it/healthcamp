import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    const body = await req.json();

    const {
      employeeId,
      pastMedicalHistory,
      occupationalHistory,
      presentComplaints,
      nadFlags,
      abnormalFindings,
      physicalExamNotes,
      generalAdvice,
      isDraft,
    } = body;

    if (!employeeId) {
      return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
    }

    const exam = await prisma.doctorExamination.upsert({
      where: { employeeId },
      create: {
        employeeId,
        doctorId: session?.userId || null,
        pastMedicalHistory: pastMedicalHistory || null,
        occupationalHistory: occupationalHistory || null,
        presentComplaints: presentComplaints || null,
        nadFlagsJson: nadFlags ? JSON.stringify(nadFlags) : null,
        abnormalFindingsJson: abnormalFindings ? JSON.stringify(abnormalFindings) : null,
        physicalExamNotes: physicalExamNotes || null,
        generalAdvice: generalAdvice || null,
        isDraft: !!isDraft,
      },
      update: {
        doctorId: session?.userId || undefined,
        pastMedicalHistory: pastMedicalHistory || undefined,
        occupationalHistory: occupationalHistory || undefined,
        presentComplaints: presentComplaints || undefined,
        nadFlagsJson: nadFlags ? JSON.stringify(nadFlags) : undefined,
        abnormalFindingsJson: abnormalFindings ? JSON.stringify(abnormalFindings) : undefined,
        physicalExamNotes: physicalExamNotes || undefined,
        generalAdvice: generalAdvice || undefined,
        isDraft: !!isDraft,
      },
    });

    return NextResponse.json({ success: true, exam });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error saving examination";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
