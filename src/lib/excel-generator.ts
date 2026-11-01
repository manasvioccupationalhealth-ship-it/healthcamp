import ExcelJS from "exceljs";
import { prisma } from "./db";

export async function generateDailyCampExcel(campId: string, targetDate = new Date()): Promise<Buffer> {
  const camp = await prisma.camp.findUnique({
    where: { id: campId },
    include: { company: true },
  });

  if (!camp) {
    throw new Error("Camp not found");
  }

  // Define start and end of target day
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const employeesToday = await prisma.employee.findMany({
    where: {
      campId,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      fitnessDecision: true,
      counterVisits: true,
    },
    orderBy: { healthId: "asc" },
  });

  // Calculate metrics
  const totalEmployees = employeesToday.length;
  const maleCount = employeesToday.filter((e) => e.sex === "MALE").length;
  const femaleCount = employeesToday.filter((e) => e.sex === "FEMALE").length;
  const companyStaffMale = employeesToday.filter((e) => e.employeeType === "COMPANY_STAFF" && e.sex === "MALE").length;
  const companyStaffFemale = employeesToday.filter((e) => e.employeeType === "COMPANY_STAFF" && e.sex === "FEMALE").length;
  const contractMale = employeesToday.filter((e) => e.employeeType === "CONTRACT_EMPLOYEE" && e.sex === "MALE").length;
  const contractFemale = employeesToday.filter((e) => e.employeeType === "CONTRACT_EMPLOYEE" && e.sex === "FEMALE").length;

  // Contractor breakdown
  const contractorCounts: Record<string, number> = {};
  for (const emp of employeesToday) {
    if (emp.employeeType === "CONTRACT_EMPLOYEE" && emp.contractorName) {
      contractorCounts[emp.contractorName] = (contractorCounts[emp.contractorName] || 0) + 1;
    }
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Occupational Health Surveillance System";
  workbook.created = new Date();

  // ---------------- SHEET 1: DAILY SUMMARY ----------------
  const summarySheet = workbook.addWorksheet("Daily Summary", {
    properties: { tabColor: { argb: "0284C7" } },
  });

  summarySheet.columns = [
    { header: "Metric", key: "metric", width: 35 },
    { header: "Count", key: "count", width: 20 },
  ];

  // Header styling
  summarySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
  summarySheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "0F172A" },
  };

  summarySheet.addRows([
    { metric: "Camp Name", count: camp.name },
    { metric: "Company", count: camp.company.name },
    { metric: "Report Date", count: targetDate.toLocaleDateString() },
    { metric: "Total Employees Registered Today", count: totalEmployees },
    { metric: "Total Male", count: maleCount },
    { metric: "Total Female", count: femaleCount },
    { metric: "Company Staff (Male)", count: companyStaffMale },
    { metric: "Company Staff (Female)", count: companyStaffFemale },
    { metric: "Contract Employees (Male)", count: contractMale },
    { metric: "Contract Employees (Female)", count: contractFemale },
  ]);

  // Contractor Section
  summarySheet.addRow({ metric: "", count: "" });
  const contractorHeaderRow = summarySheet.addRow({ metric: "Contractor Breakdown", count: "Count" });
  contractorHeaderRow.font = { bold: true, color: { argb: "FFFFFF" } };
  contractorHeaderRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "0284C7" },
  };

  const contractorEntries = Object.entries(contractorCounts);
  if (contractorEntries.length === 0) {
    summarySheet.addRow({ metric: "None Recorded", count: 0 });
  } else {
    for (const [name, count] of contractorEntries) {
      summarySheet.addRow({ metric: name, count });
    }
  }

  // ---------------- SHEET 2: EMPLOYEES REGISTERED TODAY ----------------
  const empSheet = workbook.addWorksheet("Employees Registered Today", {
    properties: { tabColor: { argb: "10B981" } },
  });

  empSheet.columns = [
    { header: "Health ID", key: "healthId", width: 18 },
    { header: "Employee Name", key: "fullName", width: 26 },
    { header: "Sex", key: "sex", width: 10 },
    { header: "Type", key: "type", width: 18 },
    { header: "Contractor", key: "contractor", width: 25 },
    { header: "Department", key: "department", width: 22 },
    { header: "Registration Time", key: "regTime", width: 20 },
    { header: "Check-up Status", key: "status", width: 22 },
    { header: "Fitness Verdict", key: "fitness", width: 20 },
  ];

  empSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
  empSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "0F172A" },
  };

  for (const emp of employeesToday) {
    empSheet.addRow({
      healthId: emp.healthId,
      fullName: emp.fullName,
      sex: emp.sex,
      type: emp.employeeType === "COMPANY_STAFF" ? "Company Staff" : "Contract",
      contractor: emp.contractorName || "-",
      department: emp.department,
      regTime: new Date(emp.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: emp.status,
      fitness: emp.fitnessDecision?.fitnessStatus?.replace(/_/g, " ") || "Pending Doctor",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

export async function generateFinalCampAttendanceExcel(campId: string): Promise<Buffer> {
  const camp = await prisma.camp.findUnique({
    where: { id: campId },
    include: { company: true },
  });

  if (!camp) {
    throw new Error("Camp not found");
  }

  const allEmployees = await prisma.employee.findMany({
    where: { campId },
    include: {
      fitnessDecision: true,
      vitalsVision: true,
    },
    orderBy: { healthId: "asc" },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Occupational Health Surveillance System";

  // Sheet 1: Master Roster & Fitness
  const masterSheet = workbook.addWorksheet("Master Health & Attendance", {
    properties: { tabColor: { argb: "0F172A" } },
  });

  masterSheet.columns = [
    { header: "Health ID", key: "healthId", width: 18 },
    { header: "Emp ID", key: "empCode", width: 14 },
    { header: "Employee Name", key: "name", width: 26 },
    { header: "Age", key: "age", width: 8 },
    { header: "Sex", key: "sex", width: 8 },
    { header: "Type", key: "type", width: 16 },
    { header: "Contractor", key: "contractor", width: 24 },
    { header: "Department", key: "dept", width: 20 },
    { header: "BMI", key: "bmi", width: 10 },
    { header: "BMI Cat", key: "bmiCat", width: 15 },
    { header: "BP", key: "bp", width: 12 },
    { header: "Fitness Status", key: "fitness", width: 22 },
    { header: "Doctor Advice", key: "advice", width: 35 },
  ];

  masterSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
  masterSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "0F172A" },
  };

  for (const emp of allEmployees) {
    const bp = emp.vitalsVision ? `${emp.vitalsVision.systolicBp}/${emp.vitalsVision.diastolicBp}` : "-";
    let advice = "-";
    if (emp.fitnessDecision?.adviceListJson) {
      try {
        const parsed = JSON.parse(emp.fitnessDecision.adviceListJson);
        if (Array.isArray(parsed)) advice = parsed.join(", ");
      } catch {}
    }

    masterSheet.addRow({
      healthId: emp.healthId,
      empCode: emp.employeeCode,
      name: emp.fullName,
      age: emp.age,
      sex: emp.sex,
      type: emp.employeeType === "COMPANY_STAFF" ? "Company Staff" : "Contract",
      contractor: emp.contractorName || "-",
      dept: emp.department,
      bmi: emp.bmi,
      bmiCat: emp.bmiCategory,
      bp,
      fitness: emp.fitnessDecision?.fitnessStatus?.replace(/_/g, " ") || emp.status,
      advice,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}
