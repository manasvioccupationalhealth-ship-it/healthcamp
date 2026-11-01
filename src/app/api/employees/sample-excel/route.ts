import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function GET() {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Occupational Health Surveillance System";
    workbook.created = new Date();

    // ---------------- SHEET 1: EMPLOYEE ROSTER TEMPLATE ----------------
    const sheet = workbook.addWorksheet("Employee Registration Template", {
      properties: { tabColor: { argb: "0F172A" } },
      views: [{ state: "frozen", ySplit: 1 }],
    });

    sheet.columns = [
      { header: "Employee Code *", key: "employeeCode", width: 18 },
      { header: "Full Name *", key: "fullName", width: 26 },
      { header: "Date of Birth (YYYY-MM-DD) *", key: "dob", width: 28 },
      { header: "Gender (MALE/FEMALE/OTHER) *", key: "gender", width: 30 },
      { header: "Department *", key: "department", width: 25 },
      { header: "Designation *", key: "designation", width: 25 },
      { header: "Employee Type (COMPANY_STAFF / CONTRACT_EMPLOYEE) *", key: "employeeType", width: 44 },
      { header: "Contractor Name (Required if Contract)", key: "contractorName", width: 35 },
      { header: "Mobile Number", key: "mobile", width: 20 },
      { header: "Height (cm)", key: "heightCm", width: 15 },
      { header: "Weight (kg)", key: "weightKg", width: 15 },
    ];

    // Style the header row
    const headerRow = sheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0F172A" }, // Slate-900
      };
      cell.font = {
        name: "Arial",
        size: 11,
        bold: true,
        color: { argb: "FFFFFF" },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin", color: { argb: "334155" } },
        bottom: { style: "medium", color: { argb: "000000" } },
        left: { style: "thin", color: { argb: "334155" } },
        right: { style: "thin", color: { argb: "334155" } },
      };
    });

    // Populate realistic sample rows
    const sampleRows = [
      {
        employeeCode: "EMP-1001",
        fullName: "Rajesh Kumar",
        dob: "1991-04-12",
        gender: "MALE",
        department: "Refinery & Operations",
        designation: "Senior Plant Technician",
        employeeType: "COMPANY_STAFF",
        contractorName: "",
        mobile: "+91 98765 43210",
        heightCm: 174,
        weightKg: 72,
      },
      {
        employeeCode: "EMP-1002",
        fullName: "Sunita Deshmukh",
        dob: "1994-09-23",
        gender: "FEMALE",
        department: "Quality Assurance & Lab",
        designation: "Quality Analyst Lead",
        employeeType: "COMPANY_STAFF",
        contractorName: "",
        mobile: "+91 98765 43211",
        heightCm: 162,
        weightKg: 58,
      },
      {
        employeeCode: "EMP-1003",
        fullName: "Amitabh Patel",
        dob: "1988-11-05",
        gender: "MALE",
        department: "Mechanical Maintenance",
        designation: "Boiler Maintenance Tech",
        employeeType: "CONTRACT_EMPLOYEE",
        contractorName: "Apex Engineering Services",
        mobile: "+91 98765 43212",
        heightCm: 168,
        weightKg: 66,
      },
      {
        employeeCode: "EMP-1004",
        fullName: "Priya Nair",
        dob: "1996-02-18",
        gender: "FEMALE",
        department: "Health, Safety & Environment",
        designation: "Safety Officer",
        employeeType: "COMPANY_STAFF",
        contractorName: "",
        mobile: "+91 98765 43213",
        heightCm: 165,
        weightKg: 60,
      },
      {
        employeeCode: "EMP-1005",
        fullName: "Dinesh Varma",
        dob: "1985-07-30",
        gender: "MALE",
        department: "Logistics & Material Handling",
        designation: "Forklift Operator",
        employeeType: "CONTRACT_EMPLOYEE",
        contractorName: "Global Infra Logistics",
        mobile: "+91 98765 43214",
        heightCm: 171,
        weightKg: 74,
      },
      {
        employeeCode: "EMP-1006",
        fullName: "Vikram Malhotra",
        dob: "1993-12-08",
        gender: "MALE",
        department: "Electrical & Instrumentation",
        designation: "Senior Electrician",
        employeeType: "COMPANY_STAFF",
        contractorName: "",
        mobile: "+91 98765 43215",
        heightCm: 176,
        weightKg: 78,
      },
    ];

    sampleRows.forEach((row, idx) => {
      const addedRow = sheet.addRow(row);
      addedRow.height = 20;
      const isEven = idx % 2 === 0;
      addedRow.eachCell((cell) => {
        cell.font = { name: "Arial", size: 10 };
        cell.alignment = { vertical: "middle", horizontal: "left" };
        if (isEven) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "F8FAFC" }, // Slate-50
          };
        }
        cell.border = {
          top: { style: "thin", color: { argb: "E2E8F0" } },
          bottom: { style: "thin", color: { argb: "E2E8F0" } },
          left: { style: "thin", color: { argb: "E2E8F0" } },
          right: { style: "thin", color: { argb: "E2E8F0" } },
        };
      });
    });

    // ---------------- SHEET 2: INSTRUCTIONS & SPECIFICATION ----------------
    const guideSheet = workbook.addWorksheet("Instructions & Specifications", {
      properties: { tabColor: { argb: "0284C7" } },
    });

    guideSheet.columns = [
      { header: "Field Name", key: "field", width: 25 },
      { header: "Mandatory?", key: "required", width: 15 },
      { header: "Permitted Values / Format", key: "format", width: 35 },
      { header: "Description / Guidance", key: "desc", width: 45 },
    ];

    const guideHeaderRow = guideSheet.getRow(1);
    guideHeaderRow.height = 24;
    guideHeaderRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0369A1" }, // Sky-700
      };
      cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFF" } };
      cell.alignment = { vertical: "middle" };
    });

    const guideData = [
      { field: "Employee Code", required: "Yes", format: "Text (Unique)", desc: "Company employee ID or badge number" },
      { field: "Full Name", required: "Yes", format: "Text", desc: "Worker legal full name as per identity documents" },
      { field: "Date of Birth", required: "Yes", format: "YYYY-MM-DD (e.g. 1992-05-15)", desc: "Used to compute exact age" },
      { field: "Gender", required: "Yes", format: "MALE, FEMALE, or OTHER", desc: "Used for demographic and clinical reference ranges" },
      { field: "Department", required: "Yes", format: "Text", desc: "Operational department, unit, or workshop" },
      { field: "Designation", required: "Yes", format: "Text", desc: "Job title or role" },
      { field: "Employee Type", required: "Yes", format: "COMPANY_STAFF or CONTRACT_EMPLOYEE", desc: "Workforce category classification" },
      { field: "Contractor Name", required: "Conditional", format: "Text", desc: "Mandatory only if Employee Type is CONTRACT_EMPLOYEE" },
      { field: "Mobile Number", required: "No", format: "Phone number with country code", desc: "Used for SMS notifications & dispatch" },
      { field: "Height (cm)", required: "No", format: "Number (e.g. 172)", desc: "In centimeters. Auto-computes BMI if provided" },
      { field: "Weight (kg)", required: "No", format: "Number (e.g. 68)", desc: "In kilograms. Auto-computes BMI if provided" },
    ];

    guideData.forEach((item) => {
      const r = guideSheet.addRow(item);
      r.height = 20;
      r.eachCell((cell) => {
        cell.font = { name: "Arial", size: 10 };
        cell.border = {
          top: { style: "thin", color: { argb: "E2E8F0" } },
          bottom: { style: "thin", color: { argb: "E2E8F0" } },
          left: { style: "thin", color: { argb: "E2E8F0" } },
          right: { style: "thin", color: { argb: "E2E8F0" } },
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="HealthCamp_Employee_Registration_Template.xlsx"',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error generating template";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
