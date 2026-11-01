import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const campId = url.searchParams.get("campId");

    if (!campId) {
      return NextResponse.json({ error: "campId is required" }, { status: 400 });
    }

    const { getSession } = await import("@/lib/auth");
    const session = await getSession(req);
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "DOCTOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const employees = await prisma.employee.findMany({
      where: { campId },
      include: {
        vitalsVision: true,
        bloodResult: true,
        diagnosticResults: true,
        doctorExamination: {
          include: { doctor: true },
        },
        fitnessDecision: {
          include: { doctor: true },
        },
        counterVisits: {
          include: { campCounter: true },
        },
      },
      orderBy: { healthId: "asc" },
    });

    // Transform into spreadsheet rows
    const rows = employees.map((emp) => {
      const bp = emp.vitalsVision ? `${emp.vitalsVision.systolicBp}/${emp.vitalsVision.diastolicBp}` : "Pending";
      const vision = emp.vitalsVision ? `R:${emp.vitalsVision.distantVisionRight} L:${emp.vitalsVision.distantVisionLeft}` : "Pending";
      
      let parsedAdvice: string[] = [];
      if (emp.fitnessDecision?.adviceListJson) {
        try {
          parsedAdvice = JSON.parse(emp.fitnessDecision.adviceListJson);
        } catch {}
      }

      const completedCounters = emp.counterVisits.filter((v) => v.status === "COMPLETED").length;
      const totalCounters = emp.counterVisits.length;

      return {
        id: emp.id,
        healthId: emp.healthId,
        fullName: emp.fullName,
        age: emp.age,
        sex: emp.sex,
        employeeType: emp.employeeType,
        contractorName: emp.contractorName || "-",
        department: emp.department,
        designation: emp.designation,
        mobile: emp.mobile,
        heightCm: emp.heightCm,
        weightKg: emp.weightKg,
        bmi: emp.bmi,
        bmiCategory: emp.bmiCategory,
        bp,
        vision,
        bloodStatus: emp.bloodResult ? "Verified" : "Pending",
        diagnosticsCount: emp.diagnosticResults.length,
        examStatus: emp.doctorExamination ? (emp.doctorExamination.isDraft ? "Draft" : "Completed") : "Pending",
        completedCounters,
        totalCounters,
        status: emp.status,
        fitnessStatus: emp.fitnessDecision?.fitnessStatus || "",
        adviceList: parsedAdvice,
        remarks: emp.fitnessDecision?.doctorRemarks || "",
        restrictions: emp.fitnessDecision?.restrictions || "",
        version: emp.fitnessDecision?.version || 1,
        doctorName: emp.fitnessDecision?.doctor?.name || null,
        signedAt: emp.fitnessDecision?.signedAt || null,
      };
    });

    return NextResponse.json({ rows });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching master review data";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
