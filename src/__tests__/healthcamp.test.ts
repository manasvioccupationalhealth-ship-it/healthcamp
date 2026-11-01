import { describe, it, expect } from "vitest";
import { calculateBmi, calculateAge } from "@/lib/bmi";
import { generateOfflineTempId } from "@/lib/health-id";
import { hasPermission } from "@/lib/auth";
import { generateDetailedMedicalReportPdf, generateHealthCardPdf } from "@/lib/pdf-generator";
import { generateDailyCampExcel, generateFinalCampAttendanceExcel } from "@/lib/excel-generator";
import { prisma } from "@/lib/db";

describe("Occupational Health Surveillance Core Suite", () => {
  // 1. BMI Calculation & Category Tests
  describe("BMI & Age Calculations", () => {
    it("should calculate Normal BMI correctly", () => {
      // 175cm, 70kg -> 70 / (1.75 * 1.75) = 22.86 -> 22.9
      const result = calculateBmi(175, 70);
      expect(result.bmi).toBe(22.9);
      expect(result.category).toBe("Normal");
    });

    it("should classify Underweight (< 18.5)", () => {
      const result = calculateBmi(175, 50);
      expect(result.bmi).toBe(16.3);
      expect(result.category).toBe("Underweight");
    });

    it("should classify Overweight (25.0 to 29.9)", () => {
      const result = calculateBmi(170, 78);
      expect(result.bmi).toBe(27.0);
      expect(result.category).toBe("Overweight");
    });

    it("should classify Obese (>= 30.0)", () => {
      const result = calculateBmi(165, 88);
      expect(result.bmi).toBe(32.3);
      expect(result.category).toBe("Obese");
    });

    it("should calculate Age accurately from date of birth", () => {
      const dob = new Date("1990-06-15");
      const age = calculateAge(dob);
      expect(age).toBeGreaterThanOrEqual(34);
    });
  });

  // 2. Health ID & Offline Temporary ID Tests
  describe("Health ID Generation & Offline Identifiers", () => {
    it("should generate format compliant offline temporary IDs", () => {
      const tempId = generateOfflineTempId("DESK1");
      expect(tempId).toMatch(/^TMP-DESK-[A-Z0-9]+-\d{3}$/);
    });
  });

  // 3. Role-Based Permissions
  describe("RBAC Permissions", () => {
    it("should grant SUPER_ADMIN universal access", () => {
      expect(hasPermission("SUPER_ADMIN", ["DOCTOR"])).toBe(true);
      expect(hasPermission("SUPER_ADMIN", ["BACK_OFFICE"])).toBe(true);
    });

    it("should restrict DOCTOR role to doctor allowed actions", () => {
      expect(hasPermission("DOCTOR", ["DOCTOR", "SUPER_ADMIN"])).toBe(true);
      expect(hasPermission("DOCTOR", ["REGISTRATION_DESK"])).toBe(false);
    });

    it("should enforce COMPANY_HR boundaries", () => {
      expect(hasPermission("COMPANY_HR", ["COMPANY_HR"])).toBe(true);
      expect(hasPermission("COMPANY_HR", ["DOCTOR"])).toBe(false);
    });
  });

  // 4. Server-Side Report Generation (PDF & Excel)
  describe("Report Generation Integrity", () => {
    it("should generate Detailed Medical Dossier PDF buffer for seeded employee", async () => {
      const emp = await prisma.employee.findFirst({
        where: { healthId: "TAS-2026-0001" },
      });
      expect(emp).toBeDefined();

      if (emp) {
        const pdfBuffer = await generateDetailedMedicalReportPdf(emp.healthId);
        expect(pdfBuffer).toBeInstanceOf(Buffer);
        expect(pdfBuffer.length).toBeGreaterThan(1000);
        // PDF magic number check (%PDF-)
        expect(pdfBuffer.subarray(0, 4).toString()).toBe("%PDF");
      }
    });

    it("should generate CR80 Health Card PDF buffer", async () => {
      const emp = await prisma.employee.findFirst({
        where: { healthId: "TAS-2026-0001" },
      });
      expect(emp).toBeDefined();

      if (emp) {
        const cardBuffer = await generateHealthCardPdf(emp.healthId);
        expect(cardBuffer).toBeInstanceOf(Buffer);
        expect(cardBuffer.length).toBeGreaterThan(500);
        expect(cardBuffer.subarray(0, 4).toString()).toBe("%PDF");
      }
    });

    it("should generate 8:00 PM Daily Camp Excel workbook buffer", async () => {
      const camp = await prisma.camp.findFirst();
      expect(camp).toBeDefined();

      if (camp) {
        const excelBuffer = await generateDailyCampExcel(camp.id);
        expect(excelBuffer).toBeInstanceOf(Buffer);
        expect(excelBuffer.length).toBeGreaterThan(2000);
      }
    });

    it("should generate Final Consolidated Camp Attendance Excel workbook", async () => {
      const camp = await prisma.camp.findFirst();
      expect(camp).toBeDefined();

      if (camp) {
        const masterExcelBuffer = await generateFinalCampAttendanceExcel(camp.id);
        expect(masterExcelBuffer).toBeInstanceOf(Buffer);
        expect(masterExcelBuffer.length).toBeGreaterThan(2000);
      }
    });
  });
});
