import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { calculateBmi, calculateAge } from "@/lib/bmi";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const campId = formData.get("campId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No Excel or CSV file uploaded" }, { status: 400 });
    }

    if (!campId) {
      return NextResponse.json({ error: "campId is required" }, { status: 400 });
    }

    const camp = await prisma.camp.findUnique({
      where: { id: campId },
      include: {
        company: true,
        counters: { orderBy: { displayOrder: "asc" } },
      },
    });

    if (!camp) {
      return NextResponse.json({ error: "Camp not found" }, { status: 404 });
    }

    const session = await getSession(req);
    if (session?.role === "COMPANY_HR" && session.companyId) {
      if (camp.companyId !== session.companyId) {
        return NextResponse.json(
          { error: "Access denied. You can only upload employees to camps for your company." },
          { status: 403 }
        );
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(buffer as any);
    } catch {
      // Try CSV if xlsx fails
      const { Readable } = await import("stream");
      const stream = Readable.from(buffer);
      await workbook.csv.read(stream);
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return NextResponse.json({ error: "Spreadsheet is empty" }, { status: 400 });
    }

    // Determine highest current sequence for this company prefix and year
    const prefix = camp.company.codePrefix || "CMP";
    const year = new Date(camp.startDate || Date.now()).getFullYear();
    const searchPattern = `${prefix}-${year}-`;

    const existingEmployees = await prisma.employee.findMany({
      where: {
        campId: camp.id,
      },
      select: { employeeCode: true, healthId: true },
    });

    const existingCodes = new Set(existingEmployees.map((e) => e.employeeCode.toLowerCase().trim()));

    let maxSeq = 0;
    const latestHealthIds = await prisma.employee.findMany({
      where: {
        healthId: { startsWith: searchPattern },
      },
      select: { healthId: true },
      orderBy: { healthId: "desc" },
      take: 20,
    });

    for (const emp of latestHealthIds) {
      const parts = emp.healthId.split("-");
      const last = parts[parts.length - 1];
      const seq = parseInt(last, 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }

    let nextSeq = maxSeq + 1;
    const createdEmployees: { healthId: string; fullName: string; employeeCode: string }[] = [];
    const skippedRecords: { employeeCode: string; reason: string }[] = [];

    // Iterate through rows (Row 1 is header)
    const rowCount = worksheet.rowCount;
    for (let rowNumber = 2; rowNumber <= rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      if (!row || !row.hasValues) continue;

      // Extract cells by index or key
      // Columns: 1: Code, 2: Name, 3: DOB, 4: Gender, 5: Dept, 6: Desig, 7: Type, 8: Contractor, 9: Mobile, 10: Height, 11: Weight, 12: Email
      const rawCode = String(row.getCell(1).value || "").trim();
      const rawName = String(row.getCell(2).value || "").trim();
      if (!rawCode || !rawName) continue;

      if (existingCodes.has(rawCode.toLowerCase())) {
        skippedRecords.push({ employeeCode: rawCode, reason: "Already registered in this camp" });
        continue;
      }

      const rawDob = row.getCell(3).value;
      let dobString = "1992-05-15";
      if (rawDob instanceof Date) {
        dobString = rawDob.toISOString().split("T")[0];
      } else if (typeof rawDob === "string" && rawDob.trim()) {
        dobString = rawDob.trim();
      }

      const rawGender = String(row.getCell(4).value || "MALE").toUpperCase().trim();
      const sex = rawGender.includes("FEM") ? "FEMALE" : rawGender.includes("OTH") ? "OTHER" : "MALE";

      const department = String(row.getCell(5).value || "General Operations").trim();
      const designation = String(row.getCell(6).value || "Staff").trim();

      const rawType = String(row.getCell(7).value || "").toUpperCase().trim();
      const employeeType = rawType.includes("CONTRACT") ? "CONTRACT_EMPLOYEE" : "COMPANY_STAFF";
      const contractorName = employeeType === "CONTRACT_EMPLOYEE" ? String(row.getCell(8).value || "Third-Party Contractor").trim() : null;

      const mobile = String(row.getCell(9).value || "+91 98000 00000").trim();
      const heightNum = parseFloat(String(row.getCell(10).value || "170")) || 170;
      const weightNum = parseFloat(String(row.getCell(11).value || "68")) || 68;
      const email = String(row.getCell(12).value || "").trim() || null;
      const idMark = String(row.getCell(13).value || "").trim() || null;

      const bmiResult = calculateBmi(heightNum, weightNum);
      const ageVal = calculateAge(dobString);
      const healthId = `${prefix}-${year}-${String(nextSeq).padStart(4, "0")}`;
      nextSeq++;

      const emp = await prisma.$transaction(async (tx) => {
        const newEmp = await tx.employee.create({
          data: {
            campId: camp.id,
            companyId: camp.companyId,
            healthId,
            employeeCode: rawCode,
            fullName: rawName,
            dob: new Date(dobString),
            age: ageVal,
            sex: sex as "MALE" | "FEMALE" | "OTHER",
            department,
            designation,
            employeeType,
            contractorName,
            mobile,
            email,
            identificationMark: idMark,
            heightCm: heightNum,
            weightKg: weightNum,
            bmi: bmiResult.bmi,
            bmiCategory: bmiResult.category,
            status: "IN_PROGRESS",
          },
        });

        // Initialize Counter Visits
        for (const counter of camp.counters) {
          const isRegCounter =
            counter.counterNo === 1 ||
            counter.code === "REG" ||
            counter.counterType === "REGISTRATION";

          // Registration desk is not an examination counter: mark registration COMPLETED immediately!
          await tx.counterVisit.create({
            data: {
              campId: camp.id,
              campCounterId: counter.id,
              employeeId: newEmp.id,
              status: isRegCounter ? "COMPLETED" : "WAITING",
              completedAt: isRegCounter ? new Date() : null,
              notes: isRegCounter ? "Registered via Excel Roster Automation" : null,
            },
          });
        }

        return newEmp;
      });

      existingCodes.add(rawCode.toLowerCase());
      createdEmployees.push({
        healthId: emp.healthId,
        fullName: emp.fullName,
        employeeCode: emp.employeeCode,
      });
    }

    return NextResponse.json({
      success: true,
      importedCount: createdEmployees.length,
      skippedCount: skippedRecords.length,
      skippedRecords,
      employees: createdEmployees,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error processing Excel roster";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
