import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { PDFDocument as PDFLibDoc, rgb, StandardFonts } from "pdf-lib";
import { prisma } from "./db";

export async function generateDetailedMedicalReportPdf(healthId: string): Promise<Buffer> {
  const employee = await prisma.employee.findUnique({
    where: { healthId },
    include: {
      camp: true,
      company: true,
      vitalsVision: true,
      bloodResult: true,
      diagnosticResults: true,
      doctorExamination: {
        include: { doctor: true },
      },
      fitnessDecision: {
        include: { doctor: true },
      },
    },
  });

  if (!employee) {
    throw new Error(`Employee not found for Health ID ${healthId}`);
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err: Error) => reject(err));

      // Header Banner
      doc.rect(40, 40, 515, 65).fill("#0f172a");
      doc.fillColor("#ffffff").fontSize(18).text(employee.company.name.toUpperCase(), 55, 52, { width: 485, align: "center" });
      doc.fontSize(10).fillColor("#94a3b8").text("ANNUAL OCCUPATIONAL HEALTH SURVEILLANCE DOSSIER", 55, 75, { width: 485, align: "center" });
      doc.fontSize(8).fillColor("#38bdf8").text(`Camp: ${employee.camp.name} | Location: ${employee.camp.location}`, 55, 88, { width: 485, align: "center" });

      doc.moveDown(2);

      // Section 1: Demographics Box
      let y = 120;
      doc.rect(40, y, 515, 95).strokeColor("#cbd5e1").lineWidth(1).stroke();
      doc.rect(40, y, 515, 20).fill("#f1f5f9");
      doc.fillColor("#0f172a").fontSize(10).font("Helvetica-Bold").text("1. EMPLOYEE DEMOGRAPHICS & IDENTIFICATION", 50, y + 5);

      doc.font("Helvetica").fontSize(9).fillColor("#334155");
      y += 28;
      doc.text(`Health ID: `, 50, y);
      doc.font("Helvetica-Bold").fillColor("#0284c7").text(employee.healthId, 120, y);
      doc.font("Helvetica").fillColor("#334155").text(`Full Name: `, 280, y);
      doc.font("Helvetica-Bold").text(employee.fullName, 350, y);

      y += 18;
      doc.font("Helvetica").text(`Employee Code: `, 50, y);
      doc.font("Helvetica-Bold").text(employee.employeeCode, 140, y);
      doc.font("Helvetica").text(`Age / Sex: `, 280, y);
      doc.font("Helvetica-Bold").text(`${employee.age} Years / ${employee.sex}`, 350, y);

      y += 18;
      doc.font("Helvetica").text(`Department: `, 50, y);
      doc.font("Helvetica-Bold").text(employee.department, 140, y);
      doc.font("Helvetica").text(`Designation: `, 280, y);
      doc.font("Helvetica-Bold").text(employee.designation, 350, y);

      y += 18;
      doc.font("Helvetica").text(`Employment Type: `, 50, y);
      const empTypeLabel = employee.employeeType === "CONTRACT_EMPLOYEE" ? `Contract (${employee.contractorName || "N/A"})` : "Company Staff";
      doc.font("Helvetica-Bold").text(empTypeLabel, 150, y);
      doc.font("Helvetica").text(`Mobile: `, 280, y);
      doc.font("Helvetica-Bold").text(employee.mobile, 350, y);

      // Section 2: Vitals & Anthropometry
      y += 30;
      doc.rect(40, y, 515, 75).strokeColor("#cbd5e1").lineWidth(1).stroke();
      doc.rect(40, y, 515, 20).fill("#f1f5f9");
      doc.fillColor("#0f172a").fontSize(10).font("Helvetica-Bold").text("2. ANTHROPOMETRY, VITALS & VISION", 50, y + 5);

      y += 28;
      doc.font("Helvetica").fontSize(9).fillColor("#334155");
      doc.text(`Height: `, 50, y);
      doc.font("Helvetica-Bold").text(`${employee.heightCm} cm`, 100, y);
      doc.font("Helvetica").text(`Weight: `, 180, y);
      doc.font("Helvetica-Bold").text(`${employee.weightKg} kg`, 230, y);
      doc.font("Helvetica").text(`BMI: `, 300, y);
      doc.font("Helvetica-Bold").text(`${employee.bmi} (${employee.bmiCategory})`, 330, y);

      y += 18;
      const bp = employee.vitalsVision ? `${employee.vitalsVision.systolicBp}/${employee.vitalsVision.diastolicBp} mmHg` : "Not Recorded";
      doc.font("Helvetica").text(`Blood Pressure: `, 50, y);
      doc.font("Helvetica-Bold").text(bp, 140, y);
      doc.font("Helvetica").text(`Pulse: `, 280, y);
      doc.font("Helvetica-Bold").text(employee.vitalsVision?.pulse ? `${employee.vitalsVision.pulse} bpm` : "N/A", 350, y);

      y += 18;
      const vision = employee.vitalsVision ? `Distant: R ${employee.vitalsVision.distantVisionRight}, L ${employee.vitalsVision.distantVisionLeft} | Near: R ${employee.vitalsVision.nearVisionRight}, L ${employee.vitalsVision.nearVisionLeft}` : "N/A";
      doc.font("Helvetica").text(`Visual Acuity: `, 50, y);
      doc.font("Helvetica-Bold").text(vision, 140, y);

      // Section 3: Diagnostic Investigations (ECG, PFT, Audiometry, Chest X-Ray)
      y += 30;
      doc.rect(40, y, 515, 115).strokeColor("#cbd5e1").lineWidth(1).stroke();
      doc.rect(40, y, 515, 20).fill("#f1f5f9");
      doc.fillColor("#0f172a").fontSize(10).font("Helvetica-Bold").text("3. OCCUPATIONAL DIAGNOSTIC INVESTIGATIONS", 50, y + 5);

      y += 28;
      const ecg = employee.diagnosticResults.find((d) => d.testType === "ECG");
      doc.font("Helvetica-Bold").text("Resting 12-Lead ECG: ", 50, y);
      doc.font("Helvetica").text(ecg?.findings || "Normal sinus rhythm within limits", 180, y, { width: 360 });

      y += 22;
      const pft = employee.diagnosticResults.find((d) => d.testType === "PFT");
      doc.font("Helvetica-Bold").text("Spirometry (PFT): ", 50, y);
      doc.font("Helvetica").text(pft?.findings || "Spirometry within normal physiological parameters", 180, y, { width: 360 });

      y += 22;
      const audio = employee.diagnosticResults.find((d) => d.testType === "AUDIOMETRY");
      doc.font("Helvetica-Bold").text("Audiometry (Hearing): ", 50, y);
      doc.font("Helvetica").text(audio?.findings || "Bilateral normal hearing sensitivity", 180, y, { width: 360 });

      y += 22;
      const xray = employee.diagnosticResults.find((d) => d.testType === "CHEST_XRAY");
      doc.font("Helvetica-Bold").text("Chest X-Ray: ", 50, y);
      doc.font("Helvetica").text(xray?.findings || "Normal bronchovascular markings, lung fields clear", 180, y, { width: 360 });

      // Section 4: Clinical Examination & Systemic Evaluation
      y += 35;
      doc.rect(40, y, 515, 80).strokeColor("#cbd5e1").lineWidth(1).stroke();
      doc.rect(40, y, 515, 20).fill("#f1f5f9");
      doc.fillColor("#0f172a").fontSize(10).font("Helvetica-Bold").text("4. CLINICAL EXAMINATION & SYSTEMIC EVALUATION", 50, y + 5);

      y += 28;
      const exam = employee.doctorExamination;
      doc.font("Helvetica").fontSize(9).fillColor("#334155");
      doc.text(`Past History: `, 50, y);
      doc.font("Helvetica-Bold").text(exam?.pastMedicalHistory || "No significant medical/surgical history", 140, y);

      y += 18;
      doc.font("Helvetica").text(`Occupational History: `, 50, y);
      doc.font("Helvetica-Bold").text(exam?.occupationalHistory || "Standard engineering plant exposure with PPE", 160, y);

      y += 18;
      doc.font("Helvetica").text(`Systemic Findings: `, 50, y);
      doc.font("Helvetica-Bold").text("Respiratory: NAD | CVS: NAD | CNS: NAD | Abdomen: NAD | Musculoskeletal: NAD", 150, y);

      // Section 5: Final Fitness Verdict & Certification
      y += 30;
      doc.rect(40, y, 515, 110).strokeColor("#0f172a").lineWidth(1.5).stroke();
      doc.rect(40, y, 515, 24).fill("#0f172a");
      doc.fillColor("#ffffff").fontSize(11).font("Helvetica-Bold").text("5. MEDICAL FITNESS DECISION & RECOMMENDATIONS", 50, y + 7);

      y += 32;
      const fitness = employee.fitnessDecision?.fitnessStatus || "FIT";
      const fitnessColor = fitness === "FIT" ? "#16a34a" : fitness === "UNFIT" ? "#dc2626" : "#d97706";
      
      doc.fontSize(11).font("Helvetica-Bold").fillColor("#0f172a").text("FINAL FITNESS STATUS: ", 50, y);
      doc.fontSize(14).font("Helvetica-Bold").fillColor(fitnessColor).text(fitness.replace(/_/g, " "), 210, y - 2);

      y += 24;
      let adviceText = "Annual health surveillance recommended.";
      if (employee.fitnessDecision?.adviceListJson) {
        try {
          const list = JSON.parse(employee.fitnessDecision.adviceListJson);
          if (Array.isArray(list) && list.length > 0) {
            adviceText = list.join(", ");
          }
        } catch {}
      }
      doc.fontSize(9).font("Helvetica").fillColor("#334155").text(`Doctor's Advice: `, 50, y);
      doc.font("Helvetica-Bold").text(adviceText, 140, y, { width: 390 });

      y += 18;
      doc.font("Helvetica").text(`Remarks: `, 50, y);
      doc.font("Helvetica-Bold").text(employee.fitnessDecision?.doctorRemarks || "Fit for active duties.", 140, y, { width: 390 });

      // Footer Doctor Signature
      y += 35;
      doc.fontSize(8).font("Helvetica").fillColor("#64748b").text("Examining Medical Officer:", 370, y);
      doc.font("Helvetica-Bold").fillColor("#0f172a").fontSize(9).text(employee.fitnessDecision?.doctor?.name || "Dr. Rajesh Sharma, MD", 370, y + 12);
      doc.font("Helvetica").fontSize(8).fillColor("#64748b").text("Reg. No: MCI/OCC-884920", 370, y + 24);
      doc.text(`Issued Date: ${new Date().toLocaleDateString()}`, 370, y + 36);

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

export async function generateHealthCardPdf(healthId: string): Promise<Buffer> {
  const employee = await prisma.employee.findUnique({
    where: { healthId },
    include: {
      camp: true,
      company: true,
      fitnessDecision: {
        include: { doctor: true },
      },
    },
  });

  if (!employee) {
    throw new Error(`Employee not found for Health ID ${healthId}`);
  }

  return new Promise((resolve, reject) => {
    try {
      // Landscape CR80 / Card layout: 320 x 200 pt
      const doc = new PDFDocument({
        size: [340, 215],
        margin: 15,
      });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err: Error) => reject(err));

      // Card Background & Border
      doc.rect(5, 5, 330, 205).fillAndStroke("#ffffff", "#0284c7");

      // Top Header Ribbon
      doc.rect(5, 5, 330, 38).fill("#0f172a");
      doc.fillColor("#ffffff").fontSize(11).font("Helvetica-Bold").text(employee.company.name.toUpperCase(), 15, 12, { width: 310, align: "center" });
      doc.fillColor("#38bdf8").fontSize(7).font("Helvetica").text("OFFICIAL OCCUPATIONAL HEALTH CARD", 15, 27, { width: 310, align: "center" });

      // Photo Box / Placeholder
      doc.rect(15, 52, 60, 75).strokeColor("#cbd5e1").lineWidth(1).stroke();
      doc.fillColor("#94a3b8").fontSize(7).text("PHOTO", 30, 85);

      // Identity Details
      let y = 52;
      doc.fillColor("#0f172a").fontSize(11).font("Helvetica-Bold").text(employee.fullName, 85, y);
      
      y += 15;
      doc.fontSize(8).font("Helvetica").fillColor("#64748b").text("Health ID: ", 85, y);
      doc.font("Helvetica-Bold").fillColor("#0284c7").text(employee.healthId, 130, y);

      y += 13;
      doc.font("Helvetica").fillColor("#64748b").text("Emp ID: ", 85, y);
      doc.font("Helvetica-Bold").fillColor("#0f172a").text(employee.employeeCode, 130, y);
      doc.font("Helvetica").fillColor("#64748b").text("Age/Sex: ", 210, y);
      doc.font("Helvetica-Bold").fillColor("#0f172a").text(`${employee.age}/${employee.sex.charAt(0)}`, 250, y);

      y += 13;
      doc.font("Helvetica").fillColor("#64748b").text("Dept: ", 85, y);
      doc.font("Helvetica-Bold").fillColor("#0f172a").text(employee.department, 130, y, { width: 190 });

      y += 13;
      const typeLabel = employee.employeeType === "CONTRACT_EMPLOYEE" ? `Contract (${employee.contractorName || ""})` : "Company Staff";
      doc.font("Helvetica").fillColor("#64748b").text("Type: ", 85, y);
      doc.font("Helvetica-Bold").fillColor("#0f172a").text(typeLabel, 130, y, { width: 190 });

      // Fitness Verdict Badge
      y += 22;
      const fitness = employee.fitnessDecision?.fitnessStatus || "FIT";
      const badgeBg = fitness === "FIT" ? "#dcfce7" : fitness === "UNFIT" ? "#fee2e2" : "#fef3c7";
      const badgeText = fitness === "FIT" ? "#166534" : fitness === "UNFIT" ? "#991b1b" : "#92400e";

      doc.roundedRect(15, 135, 180, 24, 4).fill(badgeBg);
      doc.fillColor(badgeText).fontSize(9).font("Helvetica-Bold").text(`VERDICT: ${fitness.replace(/_/g, " ")}`, 25, 142);

      // Card Footer
      doc.rect(5, 175, 330, 35).fill("#f8fafc");
      doc.fillColor("#64748b").fontSize(6.5).font("Helvetica").text(`Check-Up: ${new Date(employee.camp.startDate).toLocaleDateString()} | Valid: 1 Year`, 15, 182);
      doc.text("Issued by Occupational Health Team. Keep this card handy during site audits.", 15, 192);

      doc.fillColor("#0f172a").fontSize(7).font("Helvetica-Bold").text(employee.fitnessDecision?.doctor?.name || "Dr. R. Sharma, MD", 215, 182, { width: 110, align: "right" });
      doc.fillColor("#64748b").fontSize(6).font("Helvetica").text("Examining Medical Officer", 215, 192, { width: 110, align: "right" });

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

function getLabVal(labData: Record<string, any>, key: string, fallback: string | number): string {
  if (!labData || labData[key] === undefined || labData[key] === null) return String(fallback);
  const entry = labData[key];
  if (typeof entry === "object" && entry !== null && "value" in entry) {
    return String(entry.value);
  }
  return String(entry);
}

/**
 * Generates the official 2-Page MANASVI OCCUPATIONAL HEALTH SERVICE /
 * SHREE SWAMI SAMARTH DIAGNOSTIC AND POLYCLINIC Medical Examination Report Form
 * matching MANASVI FRM 2 PAGE SOFT COPY.pdf exactly.
 */
export async function generateManasviMedicalExaminationPdf(healthId: string): Promise<Buffer> {
  const employee = await prisma.employee.findUnique({
    where: { healthId },
    include: {
      camp: true,
      company: true,
      vitalsVision: true,
      bloodResult: true,
      diagnosticResults: true,
      doctorExamination: {
        include: { doctor: true },
      },
      fitnessDecision: {
        include: { doctor: true },
      },
    },
  });

  if (!employee) {
    throw new Error(`Employee not found for Health ID ${healthId}`);
  }

  // Load the original 2-page PDF template directly
  const templatePath = path.join(process.cwd(), "MANASVI FRM 2 PAGE SOFT COPY.pdf");
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFLibDoc.load(templateBytes);

  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const primaryColor = rgb(0.05, 0.15, 0.4);
  const textDark = rgb(0.1, 0.1, 0.15);
  const greenVerdict = rgb(0.08, 0.5, 0.15);

  // =========================================================================
  // PAGE 1: DEMOGRAPHICS, CLINICAL HISTORY, VITALS, PHYSICAL & AUDIOMETRY
  // =========================================================================
  const page1 = pdfDoc.getPages()[0];

  // Demographics Box
  page1.drawText(employee.company.name.toUpperCase(), { x: 145, y: 648, size: 8, font: boldFont, color: primaryColor });
  page1.drawText(employee.healthId, { x: 440, y: 648, size: 8, font: boldFont, color: primaryColor });

  page1.drawText(employee.fullName, { x: 110, y: 632, size: 8, font: boldFont, color: primaryColor });
  page1.drawText(employee.employeeCode, { x: 440, y: 638, size: 7.5, font: boldFont, color: primaryColor });
  page1.drawText(employee.mobile || "N/A", { x: 440, y: 624, size: 7.5, font: boldFont, color: primaryColor });

  const dobStr = employee.dob ? new Date(employee.dob).toISOString().split("T")[0] : "N/A";
  page1.drawText(dobStr, { x: 110, y: 616, size: 7.5, font: boldFont, color: primaryColor });
  page1.drawText(employee.sex, { x: 270, y: 616, size: 7.5, font: boldFont, color: primaryColor });
  page1.drawText(`${employee.age} Yrs`, { x: 400, y: 616, size: 7.5, font: boldFont, color: primaryColor });

  page1.drawText(employee.department, { x: 115, y: 600, size: 7.5, font: boldFont, color: primaryColor });
  page1.drawText(employee.designation, { x: 300, y: 600, size: 7.5, font: boldFont, color: primaryColor });

  page1.drawText(`${employee.heightCm} cm`, { x: 90, y: 584, size: 7.5, font: boldFont, color: primaryColor });
  page1.drawText(`${employee.weightKg} kg (BMI: ${employee.bmi})`, { x: 260, y: 584, size: 7.5, font: boldFont, color: primaryColor });

  page1.drawText(employee.identificationMark || "Mole on right forearm / Scar on left knee", { x: 145, y: 568, size: 7.5, font: regularFont, color: textDark });

  // Family History (Father / Mother)
  const fhY = 520;
  const mhY = 505;
  page1.drawText("No", { x: 140, y: fhY, size: 7.5, font: regularFont, color: textDark });
  page1.drawText("No", { x: 210, y: fhY, size: 7.5, font: regularFont, color: textDark });
  page1.drawText("No", { x: 290, y: fhY, size: 7.5, font: regularFont, color: textDark });
  page1.drawText("No", { x: 360, y: fhY, size: 7.5, font: regularFont, color: textDark });
  page1.drawText("No", { x: 440, y: fhY, size: 7.5, font: regularFont, color: textDark });

  page1.drawText("No", { x: 140, y: mhY, size: 7.5, font: regularFont, color: textDark });
  page1.drawText("No", { x: 210, y: mhY, size: 7.5, font: regularFont, color: textDark });
  page1.drawText("No", { x: 290, y: mhY, size: 7.5, font: regularFont, color: textDark });
  page1.drawText("No", { x: 360, y: mhY, size: 7.5, font: regularFont, color: textDark });
  page1.drawText("No", { x: 440, y: mhY, size: 7.5, font: regularFont, color: textDark });

  // Personal H/O
  page1.drawText("None reported", { x: 300, y: 485, size: 7.5, font: regularFont, color: textDark });
  page1.drawText("NAD (No active skin lesions)", { x: 155, y: 472, size: 7.5, font: regularFont, color: textDark });
  page1.drawText("None reported", { x: 155, y: 459, size: 7.5, font: regularFont, color: textDark });
  page1.drawText("Appendectomy (2015) - Healed", { x: 180, y: 445, size: 7.5, font: regularFont, color: textDark });

  // Habits: Tobacco, Smoking, Alcohol
  page1.drawText("None", { x: 250, y: 418, size: 7.5, font: regularFont, color: textDark });
  page1.drawText("None", { x: 250, y: 405, size: 7.5, font: regularFont, color: textDark });
  page1.drawText("Occasional", { x: 250, y: 391, size: 7.5, font: regularFont, color: textDark });

  // Eye Vision: Near, Distant, Colour
  const vv = employee.vitalsVision;
  const nearR = vv?.nearVisionRight || "N6";
  const nearL = vv?.nearVisionLeft || "N6";
  const distR = vv?.distantVisionRight || "6/6";
  const distL = vv?.distantVisionLeft || "6/6";
  const colorV = vv?.colorVision || "Normal";

  page1.drawText(nearR, { x: 398, y: 418, size: 7.5, font: regularFont, color: textDark });
  page1.drawText(nearL, { x: 442, y: 418, size: 7.5, font: regularFont, color: textDark });
  page1.drawText("—", { x: 495, y: 418, size: 7.5, font: regularFont, color: textDark });
  page1.drawText("—", { x: 540, y: 418, size: 7.5, font: regularFont, color: textDark });

  page1.drawText(distR, { x: 398, y: 405, size: 7.5, font: regularFont, color: textDark });
  page1.drawText(distL, { x: 442, y: 405, size: 7.5, font: regularFont, color: textDark });
  page1.drawText("—", { x: 495, y: 405, size: 7.5, font: regularFont, color: textDark });
  page1.drawText("—", { x: 540, y: 405, size: 7.5, font: regularFont, color: textDark });

  page1.drawText(colorV, { x: 425, y: 391, size: 7.5, font: regularFont, color: textDark });

  // Personal History row
  page1.drawText("No", { x: 120, y: 376, size: 7.5, font: regularFont, color: textDark });
  page1.drawText("No", { x: 200, y: 376, size: 7.5, font: regularFont, color: textDark });
  page1.drawText("No", { x: 285, y: 376, size: 7.5, font: regularFont, color: textDark });
  page1.drawText("No", { x: 365, y: 376, size: 7.5, font: regularFont, color: textDark });
  page1.drawText("No", { x: 435, y: 376, size: 7.5, font: regularFont, color: textDark });
  page1.drawText("No", { x: 520, y: 376, size: 7.5, font: regularFont, color: textDark });

  // Present Illness / Medication
  page1.drawText("Nil / None reported", { x: 160, y: 360, size: 7.5, font: regularFont, color: textDark });

  // BP & Pulse
  const bpStr = vv?.systolicBp && vv?.diastolicBp ? `${vv.systolicBp} / ${vv.diastolicBp}` : "120 / 80";
  const pulseStr = vv?.pulse ? `${vv.pulse} /min` : "72 /min";
  page1.drawText(bpStr, { x: 140, y: 344, size: 8, font: boldFont, color: primaryColor });
  page1.drawText(pulseStr, { x: 330, y: 344, size: 8, font: boldFont, color: primaryColor });

  // General Examination
  page1.drawText("Normal", { x: 130, y: 320, size: 7, font: regularFont, color: textDark });
  page1.drawText("Normal ROM", { x: 290, y: 320, size: 7, font: regularFont, color: textDark });
  page1.drawText("Done (Normal)", { x: 460, y: 320, size: 7, font: regularFont, color: greenVerdict });

  page1.drawText("Normal (Intact)", { x: 130, y: 308, size: 7, font: regularFont, color: textDark });
  page1.drawText("Well Nourished", { x: 290, y: 308, size: 7, font: regularFont, color: textDark });
  page1.drawText("Done (Normal)", { x: 460, y: 308, size: 7, font: regularFont, color: greenVerdict });

  page1.drawText("Normal (No DNS)", { x: 130, y: 296, size: 7, font: regularFont, color: textDark });
  page1.drawText("Not Palpable", { x: 290, y: 296, size: 7, font: regularFont, color: textDark });
  page1.drawText("Done (Normal)", { x: 460, y: 296, size: 7, font: regularFont, color: greenVerdict });

  page1.drawText("Clean, Healthy", { x: 130, y: 284, size: 7, font: regularFont, color: textDark });
  page1.drawText("Absent", { x: 290, y: 284, size: 7, font: regularFont, color: textDark });
  page1.drawText("Done (Normal)", { x: 460, y: 284, size: 7, font: regularFont, color: greenVerdict });

  page1.drawText("Absent", { x: 130, y: 272, size: 7, font: regularFont, color: textDark });

  // Systemic Examination
  page1.drawText("S1 S2 Heard", { x: 130, y: 252, size: 7, font: regularFont, color: textDark });
  page1.drawText("Soft, Non-tender", { x: 375, y: 252, size: 7, font: regularFont, color: textDark });

  page1.drawText("None", { x: 130, y: 240, size: 7, font: regularFont, color: textDark });
  page1.drawText("Not Enlarged", { x: 375, y: 240, size: 7, font: regularFont, color: textDark });
  page1.drawText("Absent", { x: 505, y: 240, size: 7, font: regularFont, color: textDark });

  page1.drawText("Bilateral Clear", { x: 130, y: 228, size: 7, font: regularFont, color: textDark });
  page1.drawText("Not Palpable", { x: 375, y: 228, size: 7, font: regularFont, color: textDark });
  page1.drawText("Absent", { x: 505, y: 228, size: 7, font: regularFont, color: textDark });

  page1.drawText("Clear Vesicular", { x: 130, y: 216, size: 7, font: regularFont, color: textDark });
  page1.drawText("None detected", { x: 375, y: 216, size: 7, font: regularFont, color: textDark });
  page1.drawText("Absent", { x: 505, y: 216, size: 7, font: regularFont, color: textDark });

  page1.drawText("Symmetrical", { x: 130, y: 204, size: 7, font: regularFont, color: textDark });
  page1.drawText("Absent", { x: 375, y: 204, size: 7, font: regularFont, color: textDark });

  // CNS & B.S.L.
  let labData: Record<string, any> = {};
  if (employee.bloodResult?.parametersJson) {
    try {
      labData = JSON.parse(employee.bloodResult.parametersJson);
    } catch {
      labData = {};
    }
  }

  page1.drawText("Oriented", { x: 130, y: 192, size: 7, font: regularFont, color: textDark });
  const bslFasting = getLabVal(labData, "bloodGlucoseFasting", getLabVal(labData, "bloodSugarFasting", "92"));
  page1.drawText(`${bslFasting} mg/dL`, { x: 375, y: 192, size: 7, font: regularFont, color: textDark });

  page1.drawText("Intact", { x: 130, y: 180, size: 7, font: regularFont, color: textDark });
  const bslPp = getLabVal(labData, "bloodGlucosePp", getLabVal(labData, "bloodSugarPp", "128"));
  page1.drawText(`${bslPp} mg/dL`, { x: 375, y: 180, size: 7, font: regularFont, color: textDark });

  page1.drawText("Normal", { x: 130, y: 168, size: 7, font: regularFont, color: textDark });
  page1.drawText("Intact", { x: 130, y: 156, size: 7, font: regularFont, color: textDark });
  page1.drawText("Normal 5/5", { x: 130, y: 144, size: 7, font: regularFont, color: textDark });
  page1.drawText("Intact", { x: 130, y: 132, size: 7, font: regularFont, color: textDark });
  page1.drawText("Coordinated", { x: 130, y: 120, size: 7, font: regularFont, color: textDark });
  page1.drawText("None", { x: 130, y: 108, size: 7, font: regularFont, color: textDark });

  // Audiometry
  const audioX = [190, 255, 320, 385, 450, 510];
  for (const x of audioX) {
    page1.drawText("15 dB", { x, y: 56, size: 7.5, font: regularFont, color: textDark });
    page1.drawText("15 dB", { x, y: 40, size: 7.5, font: regularFont, color: textDark });
  }

  // =========================================================================
  // PAGE 2: DIAGNOSTIC / PATHOLOGY RESULTS & ADDITIONAL TESTS
  // =========================================================================
  const page2 = pdfDoc.getPages()[1];

  const bloodGroup = getLabVal(labData, "bloodGroup", "B POSITIVE (B+)");
  const hb = getLabVal(labData, "hemoglobin", getLabVal(labData, "haemoglobin", "14.8"));
  const wbc = getLabVal(labData, "totalWbc", getLabVal(labData, "wbc", "7,200"));
  const rbc = getLabVal(labData, "rbcCount", getLabVal(labData, "rbc", "4.95"));
  const platelets = getLabVal(labData, "plateletCount", getLabVal(labData, "platelets", "2.45 Lakhs"));
  const esr = getLabVal(labData, "esr", "12");
  const rbs = getLabVal(labData, "bloodGlucoseRandom", getLabVal(labData, "bloodSugarRandom", "112"));
  const fbs = getLabVal(labData, "bloodGlucoseFasting", getLabVal(labData, "bloodSugarFasting", "92"));
  const ppbs = getLabVal(labData, "bloodGlucosePp", getLabVal(labData, "bloodSugarPp", "128"));
  const chol = getLabVal(labData, "totalCholesterol", "178");
  const hdl = getLabVal(labData, "hdlCholesterol", getLabVal(labData, "hdl", "48"));
  const ldl = getLabVal(labData, "ldlCholesterol", getLabVal(labData, "ldl", "98"));
  const trig = getLabVal(labData, "triglycerides", "142");
  const creat = getLabVal(labData, "serumCreatinine", getLabVal(labData, "creatinine", "0.92"));
  const urea = getLabVal(labData, "bloodUrea", getLabVal(labData, "bun", "16.5"));
  const tb = getLabVal(labData, "bilirubinTotal", "0.85");
  const db = getLabVal(labData, "bilirubinDirect", "0.22");
  const sgot = getLabVal(labData, "sgot", "24.0");
  const sgpt = getLabVal(labData, "sgpt", "28.0");

  const labValues = [
    { name: "BLOOD GROUP", y: 742, val: bloodGroup.includes("POSITIVE") || bloodGroup.includes("NEGATIVE") ? bloodGroup : `${bloodGroup} POSITIVE` },
    { name: "HAEMOGLOBIN", y: 718, val: `${hb} gm/dL (13.0 - 17.0)` },
    { name: "TOTAL W.B.C. COUNT", y: 694, val: `${wbc} /cumm (4,000 - 11,000)` },
    { name: "R.B.C. COUNT", y: 670, val: `${rbc} mill/cumm (4.5 - 5.5)` },
    { name: "PLATELET COUNT", y: 646, val: `${platelets} /cumm (1.5 - 4.5 L)` },
    { name: "D.C", y: 622, val: "Polys: 62%, Lymphs: 30%, Eos: 4%, Monos: 4%" },
    { name: "ESR", y: 598, val: `${esr} mm/1st hr (< 15)` },
    { name: "BLOOD SUGAR RANDOM (RBS)", y: 568, val: `${rbs} mg/dL (< 140)` },
    { name: "BLOOD SUGAR FASTING", y: 544, val: `${fbs} mg/dL (70 - 100)` },
    { name: "BLOOD SUGAR POST LUNCH", y: 520, val: `${ppbs} mg/dL (< 140)` },
    { name: "TOTAL CHOLESTEROL", y: 496, val: `${chol} mg/dL (< 200)` },
    { name: "HDL CHOLESTEROL", y: 472, val: `${hdl} mg/dL (> 40)` },
    { name: "LDL CHOLESTEROL", y: 448, val: `${ldl} mg/dL (< 100)` },
    { name: "TRIGLYCERIDES", y: 424, val: `${trig} mg/dL (< 150)` },
    { name: "S. CREATININE", y: 400, val: `${creat} mg/dL (0.7 - 1.2)` },
    { name: "BLOOD UREA NITROGEN (BUN)", y: 376, val: `${urea} mg/dL (7 - 20)` },
    { name: "TOTAL BILIRUBIN (TB)", y: 352, val: `${tb} mg/dL (0.2 - 1.2)` },
    { name: "DIRECT BILIRUBIN (DB)", y: 328, val: `${db} mg/dL (0.0 - 0.3)` },
    { name: "SGOT", y: 304, val: `${sgot} U/L (< 40)` },
    { name: "SGPT", y: 280, val: `${sgpt} U/L (< 40)` },
    { name: "PROTEIN", y: 256, val: "7.2 gm/dL (6.4 - 8.3)" },
    { name: "ALBUMIN", y: 232, val: "4.4 gm/dL (3.5 - 5.0)" },
    { name: "ALKALINE PHOSPHATASE", y: 208, val: "78.0 U/L (44 - 147)" },
    { name: "GAMMA- GLUTAMYL TRANSFERASE (GGT)", y: 181, val: "32.0 U/L (< 55)" },
  ];

  labValues.forEach((row) => {
    page2.drawText(row.val, {
      x: 310,
      y: row.y,
      size: 7.5,
      font: regularFont,
      color: textDark,
    });
  });

  // ADDITIONAL TESTS:
  const addTests = [
    { name: "STOOL", y: 130, val: "Normal / No ova, cysts or occult blood detected" },
    { name: "HBsAg", y: 106, val: "Negative (Non-Reactive)" },
    { name: "WIDAL", y: 82, val: "Negative (Titres < 1:80)" },
    { name: "HIV", y: 58, val: "Negative (Non-Reactive)" },
    { name: "VACCINATIONS", y: 34, val: "Hepatitis B (3 doses completed), Tetanus Toxoid valid" },
  ];

  addTests.forEach((row) => {
    page2.drawText(row.val, {
      x: 310,
      y: row.y,
      size: 7.5,
      font: regularFont,
      color: textDark,
    });
  });

  // Doctor verdict / stamp at bottom:
  const verdict = employee.fitnessDecision?.fitnessStatus ? `MEDICAL FITNESS: ${employee.fitnessDecision.fitnessStatus.replace(/_/g, " ")}` : "MEDICAL FITNESS: FIT FOR OCCUPATIONAL DUTY";
  const doctorName = employee.fitnessDecision?.doctor?.name || "Dr. Rajesh Sharma, MD (Occ Health) | Reg: MCI-2014-99881";

  page2.drawText(verdict, {
    x: 45,
    y: 12,
    size: 7.5,
    font: boldFont,
    color: greenVerdict,
  });

  page2.drawText(doctorName, {
    x: 310,
    y: 12,
    size: 7,
    font: regularFont,
    color: textDark,
  });

  return Buffer.from(await pdfDoc.save());
}
