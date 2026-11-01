"use client";

import React, { useState, useEffect, useRef } from "react";
import { useOffline } from "@/context/OfflineContext";
import { calculateBmi, calculateAge } from "@/lib/bmi";
import { queueOfflineOperation } from "@/lib/offline-store";
import { generateOfflineTempId } from "@/lib/temp-id";
import ExcelJS from "exceljs";
import {
  Camera,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Upload,
  UserPlus,
  Users,
  Search,
  Building2,
  Check,
  FileText,
  Mail,
  ShieldCheck,
} from "lucide-react";

interface Camp {
  id: string;
  name: string;
  campId: string;
  company: { name: string; codePrefix: string };
}

interface RosterEmployee {
  id: string;
  healthId: string;
  employeeCode: string;
  fullName: string;
  age: number;
  sex: string;
  department: string;
  designation: string;
  employeeType: string;
  bmi: number;
  bmiCategory: string;
  createdAt: string;
}

interface ExcelPreviewRow {
  code: string;
  name: string;
  dob: string;
  gender: string;
  department: string;
  designation: string;
  type: string;
  contractor: string;
  mobile: string;
  height: string;
  weight: string;
  email: string;
  idMark: string;
}

export default function RegistrationPage() {
  const { isOnline, refreshPendingCount } = useOffline();

  const [camps, setCamps] = useState<Camp[]>([]);
  const [selectedCampId, setSelectedCampId] = useState<string>("");

  // Mode: Manual Form vs Excel Bulk Automation vs Roster
  const [activeMode, setActiveMode] = useState<"MANUAL" | "EXCEL_BULK" | "ROSTER">("MANUAL");

  // Single Worker Registration Form State
  const [employeeType, setEmployeeType] = useState<"COMPANY_STAFF" | "CONTRACT_EMPLOYEE">("COMPANY_STAFF");
  const [contractorName, setContractorName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("1992-05-15");
  const [age, setAge] = useState(34);
  const [sex, setSex] = useState<"MALE" | "FEMALE">("MALE");
  const [department, setDepartment] = useState("Manufacturing & Assembly");
  const [designation, setDesignation] = useState("Technician Grade 1");
  const [tenureYears, setTenureYears] = useState(3);
  const [tenureMonths, setTenureMonths] = useState(6);
  const [mobile, setMobile] = useState("+91 98765 00000");
  const [email, setEmail] = useState("");
  const [identificationMark, setIdentificationMark] = useState("Mole on right forearm");

  // Medical History from Manasvi Form
  const [hasFatherBp, setHasFatherBp] = useState(false);
  const [hasFatherDm, setHasFatherDm] = useState(false);
  const [hasMotherBp, setHasMotherBp] = useState(false);
  const [hasMotherDm, setHasMotherDm] = useState(false);
  const [tobaccoHabit, setTobaccoHabit] = useState<"None" | "Occasional" | "Frequent" | "Chronic">("None");
  const [alcoholHabit, setAlcoholHabit] = useState<"None" | "Occasional" | "Frequent" | "Chronic">("Occasional");
  const [smokingHabit, setSmokingHabit] = useState<"None" | "Occasional" | "Frequent" | "Chronic">("None");
  const [presentIllness, setPresentIllness] = useState("Nil / None reported");

  const [heightCm, setHeightCm] = useState(172);
  const [weightKg, setWeightKg] = useState(68);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState<{
    healthId: string;
    fullName: string;
    employeeCode: string;
    bmi: number;
    category: string;
    isOfflineQueued?: boolean;
  } | null>(null);

  // Excel Bulk Upload State
  const [selectedExcelFile, setSelectedExcelFile] = useState<File | null>(null);
  const [excelPreviewRows, setExcelPreviewRows] = useState<ExcelPreviewRow[]>([]);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [excelSuccess, setExcelSuccess] = useState<{
    importedCount: number;
    skippedCount: number;
    employees: { healthId: string; fullName: string; employeeCode: string }[];
  } | null>(null);

  // Camp Roster State
  const [roster, setRoster] = useState<RosterEmployee[]>([]);
  const [rosterSearch, setRosterSearch] = useState("");
  const [rosterLoading, setRosterLoading] = useState(false);

  useEffect(() => {
    fetch("/api/camps")
      .then((res) => res.json())
      .then((data) => {
        if (data.camps && data.camps.length > 0) {
          setCamps(data.camps);
          const saved = localStorage.getItem("active_camp_id");
          if (saved && data.camps.some((c: Camp) => c.id === saved)) {
            setSelectedCampId(saved);
          } else {
            setSelectedCampId(data.camps[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (dob) {
      setAge(calculateAge(dob));
    }
  }, [dob]);

  const bmiInfo = calculateBmi(Number(heightCm), Number(weightKg));

  // Load roster when roster tab selected
  const fetchRoster = () => {
    if (!selectedCampId) return;
    setRosterLoading(true);
    fetch(`/api/camps/${selectedCampId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.camp && data.camp.employees) {
          setRoster(data.camp.employees);
        }
      })
      .catch(() => {})
      .finally(() => setRosterLoading(false));
  };

  useEffect(() => {
    if (activeMode === "ROSTER") {
      fetchRoster();
    }
  }, [activeMode, selectedCampId]);

  // Webcam Controls
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 480, facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setError("Unable to access camera. Please allow webcam permissions or upload an image.");
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, 300, 300);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setPhotoDataUrl(dataUrl);

        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        setIsCameraActive(false);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Single Employee Registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (employeeType === "CONTRACT_EMPLOYEE" && !contractorName.trim()) {
      setError("Contractor name is mandatory for contract personnel.");
      setLoading(false);
      return;
    }

    const payload = {
      campId: selectedCampId,
      employeeType,
      contractorName: employeeType === "CONTRACT_EMPLOYEE" ? contractorName : null,
      employeeCode,
      fullName,
      dob,
      age,
      sex,
      department,
      designation,
      tenureYears,
      tenureMonths,
      mobile,
      email: email || null,
      identificationMark: identificationMark || null,
      heightCm,
      weightKg,
      bmi: bmiInfo.bmi,
      bmiCategory: bmiInfo.category,
      photoUrl: photoDataUrl,
      familyHistory: {
        father: { highBp: hasFatherBp, diabetic: hasFatherDm },
        mother: { highBp: hasMotherBp, diabetic: hasMotherDm },
      },
      habits: {
        tobacco: tobaccoHabit,
        smoking: smokingHabit,
        alcohol: alcoholHabit,
      },
      presentIllness,
    };

    try {
      if (!isOnline) {
        const tempHealthId = generateOfflineTempId("DESK1");
        await queueOfflineOperation("REGISTRATION", "CREATE", {
          ...payload,
          healthId: tempHealthId,
        });
        await refreshPendingCount();

        setRegisteredSuccess({
          healthId: tempHealthId,
          fullName,
          employeeCode,
          bmi: bmiInfo.bmi,
          category: bmiInfo.category,
          isOfflineQueued: true,
        });
      } else {
        const res = await fetch("/api/employees/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setRegisteredSuccess({
            healthId: data.employee.healthId,
            fullName: data.employee.fullName,
            employeeCode: data.employee.employeeCode,
            bmi: data.employee.bmi,
            category: data.employee.bmiCategory,
            isOfflineQueued: false,
          });
        } else {
          setError(data.error || "Failed to register employee");
        }
      }
    } catch {
      setError("Network or local database error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRegisteredSuccess(null);
    setEmployeeCode("");
    setFullName("");
    setContractorName("");
    setPhotoDataUrl(null);
  };

  // Handle Excel File Selection & Local Preview
  const handleExcelFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedExcelFile(file);
    setError(null);
    setExcelSuccess(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const sheet = workbook.worksheets[0];

      if (sheet) {
        const previewRows: ExcelPreviewRow[] = [];
        const count = Math.min(sheet.rowCount, 15); // preview first 15
        for (let r = 2; r <= count; r++) {
          const row = sheet.getRow(r);
          if (row.hasValues) {
            const rawCode = String(row.getCell(1).value || "").trim();
            const rawName = String(row.getCell(2).value || "").trim();
            if (rawCode && rawName) {
              const rawDob = row.getCell(3).value;
              const dobVal = rawDob instanceof Date ? rawDob.toISOString().split("T")[0] : String(rawDob || "1992-05-15");
              previewRows.push({
                code: rawCode,
                name: rawName,
                dob: dobVal,
                gender: String(row.getCell(4).value || "MALE"),
                department: String(row.getCell(5).value || "General"),
                designation: String(row.getCell(6).value || "Staff"),
                type: String(row.getCell(7).value || "COMPANY_STAFF"),
                contractor: String(row.getCell(8).value || ""),
                mobile: String(row.getCell(9).value || ""),
                height: String(row.getCell(10).value || "170"),
                weight: String(row.getCell(11).value || "68"),
                email: String(row.getCell(12).value || ""),
                idMark: String(row.getCell(13).value || ""),
              });
            }
          }
        }
        setExcelPreviewRows(previewRows);
      }
    } catch {
      setError("Could not parse Excel preview. The file can still be uploaded directly for backend processing.");
    }
  };

  // Execute Bulk Upload to Server
  const handleBulkUploadSubmit = async () => {
    if (!selectedExcelFile || !selectedCampId) return;

    setUploadingExcel(true);
    setError(null);
    setExcelSuccess(null);

    const formData = new FormData();
    formData.append("file", selectedExcelFile);
    formData.append("campId", selectedCampId);

    try {
      const res = await fetch("/api/employees/bulk-upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process Excel roster");
      }

      setExcelSuccess({
        importedCount: data.importedCount,
        skippedCount: data.skippedCount,
        employees: data.employees || [],
      });
      setSelectedExcelFile(null);
      setExcelPreviewRows([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error uploading Excel roster");
    } finally {
      setUploadingExcel(false);
    }
  };

  // Instant Sample CSV Generator & Downloader (Zero-Latency Local Fallback)
  const downloadSampleCsv = () => {
    const csvContent =
      "Employee Code,Full Name,Date of Birth,Gender,Department,Designation,Employee Type,Contractor Name,Mobile Number,Height (cm),Weight (kg),Email Address,Identification Mark\n" +
      "EMP-2001,Sanjay Singhania,1990-06-15,MALE,Refinery & Petrochemicals,Senior Maintenance Tech,COMPANY_STAFF,,+91 98765 00001,174,72,sanjay.s@reliance.local,Scar on right index finger\n" +
      "EMP-2002,Sunita Verma,1994-03-22,FEMALE,Quality Assurance & QC,Lab Analyst Grade 1,COMPANY_STAFF,,+91 98765 00002,162,56,sunita.v@reliance.local,Mole on left cheek\n" +
      "EMP-2003,Farhan Akhtar,1988-11-10,MALE,Logistics & Warehousing,Heavy Forklift Operator,CONTRACT_EMPLOYEE,Apex Supply Chain,+91 98765 00003,170,68,farhan@apexinfra.local,None\n" +
      "EMP-2004,Pooja Hegde,1995-09-04,FEMALE,HSE & Plant Safety,Junior Safety Inspector,COMPANY_STAFF,,+91 98765 00004,165,60,pooja.h@reliance.local,None\n" +
      "EMP-2005,Dinesh Patel,1986-07-19,MALE,Electrical Substation,Substation Electrician,CONTRACT_EMPLOYEE,PowerGrid Engineers,+91 98765 00005,172,75,dinesh@powergrid.local,Burn scar left forearm\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "HealthCamp_Employee_Registration_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRoster = roster.filter(
    (e) =>
      e.fullName.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      e.healthId.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      e.employeeCode.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      e.department.toLowerCase().includes(rosterSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Top Header & Camp Selector */}
      <div className="bg-white p-4 rounded border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Employee Registration Desk
            </h1>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-800 text-[11px] font-bold rounded border border-blue-200">
              Check-In &amp; Corporate Roster Automation
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Register workers individually or import complete pre-approved corporate rosters in bulk via Excel spreadsheet.
          </p>
        </div>

        {/* Camp Selector */}
        <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded border border-slate-200">
          <Building2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <div className="text-xs">
            <span className="text-slate-500 font-medium mr-1.5">Camp:</span>
            <select
              value={selectedCampId}
              onChange={(e) => {
                setSelectedCampId(e.target.value);
                localStorage.setItem("active_camp_id", e.target.value);
              }}
              className="font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer max-w-[280px] truncate"
            >
              {camps.map((camp) => (
                <option key={camp.id} value={camp.id}>
                  {camp.company.codePrefix} &bull; {camp.name} ({camp.campId})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t border-t border-x px-3 pt-2 space-x-2 text-xs font-semibold">
        <button
          type="button"
          id="tab-single-worker"
          onClick={() => setActiveMode("MANUAL")}
          className={`py-2 px-3 border-b-2 transition flex items-center space-x-1.5 ${
            activeMode === "MANUAL"
              ? "border-slate-900 text-slate-900 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <UserPlus className="w-4 h-4 text-slate-600" />
          <span>Single Worker Check-In</span>
        </button>

        <button
          type="button"
          id="tab-bulk-excel"
          onClick={() => setActiveMode("EXCEL_BULK")}
          className={`py-2 px-3 border-b-2 transition flex items-center space-x-1.5 ${
            activeMode === "EXCEL_BULK"
              ? "border-slate-900 text-slate-900 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Bulk Excel Sheet Automation</span>
          <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold">
            Automated
          </span>
        </button>

        <button
          type="button"
          id="tab-camp-roster"
          onClick={() => setActiveMode("ROSTER")}
          className={`py-2 px-3 border-b-2 transition flex items-center space-x-1.5 ${
            activeMode === "ROSTER"
              ? "border-slate-900 text-slate-900 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4 text-slate-600" />
          <span>Camp Roster &amp; Registered Workers</span>
        </button>
      </div>

      {/* TAB 1: MANUAL SINGLE WORKER REGISTRATION */}
      {activeMode === "MANUAL" && (
        <div className="bg-white p-5 rounded-b border border-slate-200 shadow-sm space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded font-medium flex items-center">
              <AlertCircle className="w-4 h-4 mr-1.5 text-rose-600 flex-shrink-0" />
              {error}
            </div>
          )}

          {registeredSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm">
                  Employee Registered Successfully!
                </h3>
              </div>
              <p className="text-xs text-emerald-800">
                Worker <strong>{registeredSuccess.fullName}</strong> is registered with permanent Health ID:{" "}
                <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-900">
                  {registeredSuccess.healthId}
                </span>{" "}
                and is immediately ready for checkup stations (Doctor Assistant BP &amp; Vision).
              </p>
              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded hover:bg-slate-800"
                >
                  + Register Next Employee
                </button>
                <a
                  href={`/api/reports/${registeredSuccess.healthId}/healthcard-pdf`}
                  target="_blank"
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded hover:bg-slate-50"
                >
                  Print Health Token Card
                </a>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Workforce Category */}
            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                Workforce Category *
              </label>
              <div className="flex items-center space-x-4 text-xs font-semibold text-slate-800">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="employeeType"
                    value="COMPANY_STAFF"
                    checked={employeeType === "COMPANY_STAFF"}
                    onChange={() => setEmployeeType("COMPANY_STAFF")}
                    className="text-slate-900"
                  />
                  <span>Direct Company Employee (On-Roll)</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="employeeType"
                    value="CONTRACT_EMPLOYEE"
                    checked={employeeType === "CONTRACT_EMPLOYEE"}
                    onChange={() => setEmployeeType("CONTRACT_EMPLOYEE")}
                    className="text-slate-900"
                  />
                  <span>Contract / Third-Party Personnel</span>
                </label>
              </div>

              {employeeType === "CONTRACT_EMPLOYEE" && (
                <div className="pt-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Contractor Agency Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={contractorName}
                    onChange={(e) => setContractorName(e.target.value)}
                    placeholder="e.g. Apex Technical Services Ltd"
                    className="w-full sm:w-1/2 p-2 text-xs border border-slate-300 rounded bg-white"
                  />
                </div>
              )}
            </div>

            {/* Demographics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employee ID / Code *
                </label>
                <input
                  type="text"
                  required
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  placeholder="e.g. EMP-1049"
                  className="w-full p-2 text-xs border border-slate-300 rounded font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar Verma"
                  className="w-full p-2 text-xs border border-slate-300 rounded font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department *
                </label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designation *
                </label>
                <input
                  type="text"
                  required
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Age / Gender *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    readOnly
                    value={age}
                    className="w-16 p-2 text-xs border border-slate-200 bg-slate-100 rounded text-center font-bold"
                  />
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value as "MALE" | "FEMALE")}
                    className="flex-1 p-2 text-xs border border-slate-300 rounded bg-white font-semibold"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Mobile *
                </label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded"
                />
              </div>
            </div>

            {/* Email & Identification Mark */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employee Email Address (For Report Delivery)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee@company.com"
                  className="w-full p-2 text-xs border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Identification Mark (As per Manasvi Medical Form)
                </label>
                <input
                  type="text"
                  value={identificationMark}
                  onChange={(e) => setIdentificationMark(e.target.value)}
                  placeholder="e.g. Mole on right forearm / Scar on left knee"
                  className="w-full p-2 text-xs border border-slate-300 rounded"
                />
              </div>
            </div>

            {/* Anthropometry & Computed BMI */}
            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">
                Physical Anthropometry &amp; BMI
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Height (cm) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full p-2 text-xs border border-slate-300 rounded bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full p-2 text-xs border border-slate-300 rounded bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Computed BMI &amp; Category
                  </label>
                  <div className="p-2 bg-white border border-slate-200 rounded text-xs flex items-center justify-between">
                    <span className="font-bold text-slate-900">{bmiInfo.bmi}</span>
                    <span className="font-bold text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                      {bmiInfo.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical History & Habits Accordion */}
            <div className="p-3 bg-slate-50/60 rounded border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">
                Medical History &amp; Habits (For Medical Examination Form)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Family History */}
                <div className="p-2.5 bg-white rounded border border-slate-200 space-y-2">
                  <span className="font-semibold text-slate-800 block text-[11px]">Family Medical History</span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input type="checkbox" checked={hasFatherBp} onChange={(e) => setHasFatherBp(e.target.checked)} />
                      <span>Father: High B/P</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input type="checkbox" checked={hasFatherDm} onChange={(e) => setHasFatherDm(e.target.checked)} />
                      <span>Father: Diabetes</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input type="checkbox" checked={hasMotherBp} onChange={(e) => setHasMotherBp(e.target.checked)} />
                      <span>Mother: High B/P</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input type="checkbox" checked={hasMotherDm} onChange={(e) => setHasMotherDm(e.target.checked)} />
                      <span>Mother: Diabetes</span>
                    </label>
                  </div>
                </div>

                {/* Habits */}
                <div className="p-2.5 bg-white rounded border border-slate-200 space-y-2">
                  <span className="font-semibold text-slate-800 block text-[11px]">Habits &amp; Addictions</span>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Tobacco</span>
                      <select
                        value={tobaccoHabit}
                        onChange={(e) => setTobaccoHabit(e.target.value as any)}
                        className="w-full p-1 border rounded text-[11px]"
                      >
                        <option value="None">None</option>
                        <option value="Occasional">Occasional</option>
                        <option value="Frequent">Frequent</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Smoking</span>
                      <select
                        value={smokingHabit}
                        onChange={(e) => setSmokingHabit(e.target.value as any)}
                        className="w-full p-1 border rounded text-[11px]"
                      >
                        <option value="None">None</option>
                        <option value="Occasional">Occasional</option>
                        <option value="Frequent">Frequent</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Alcohol</span>
                      <select
                        value={alcoholHabit}
                        onChange={(e) => setAlcoholHabit(e.target.value as any)}
                        className="w-full p-1 border rounded text-[11px]"
                      >
                        <option value="None">None</option>
                        <option value="Occasional">Occasional</option>
                        <option value="Frequent">Frequent</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Capture */}
            <div className="p-3 bg-slate-50 rounded border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 rounded border border-slate-300 bg-white flex items-center justify-center overflow-hidden">
                  {photoDataUrl ? (
                    <img src={photoDataUrl} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Worker Photo (Optional)</span>
                  <span className="text-[11px] text-slate-500">Attach photo for token card &amp; medical file</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {!isCameraActive ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3 py-1.5 bg-white border border-slate-300 text-xs font-semibold rounded hover:bg-slate-50"
                  >
                    Use Webcam
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700"
                  >
                    Snap Photo
                  </button>
                )}
                <label className="px-3 py-1.5 bg-white border border-slate-300 text-xs font-semibold rounded hover:bg-slate-50 cursor-pointer">
                  Browse...
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            {isCameraActive && (
              <div className="p-2 bg-slate-900 rounded flex justify-center">
                <video ref={videoRef} className="w-64 h-64 object-cover rounded" />
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded hover:bg-slate-800 disabled:opacity-50 transition shadow-sm"
              >
                {loading ? "Registering Employee..." : "Register & Queue for Health Tests"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: BULK EXCEL SHEET AUTOMATION */}
      {activeMode === "EXCEL_BULK" && (
        <div className="bg-white p-5 rounded-b border border-slate-200 shadow-sm space-y-5">
          {/* Instructions & Template Download Banner */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-sm text-emerald-900">
                  Automated Corporate Excel Sheet Registration
                </h3>
              </div>
              <p className="text-xs text-emerald-800 max-w-xl">
                Upload your company or contractor employee list in Excel format. Our system will automatically calculate BMI, generate collision-safe Health IDs, and queue all workers directly for medical checkups.
              </p>
            </div>

            {/* Download Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
              <a
                href="/api/employees/sample-excel"
                download="HealthCamp_Employee_Registration_Template.xlsx"
                className="inline-flex items-center px-3.5 py-2 bg-emerald-800 text-white rounded text-xs font-bold hover:bg-emerald-900 transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download Sample Excel (.xlsx)
              </a>

              <button
                type="button"
                onClick={downloadSampleCsv}
                className="inline-flex items-center px-3 py-2 bg-white border border-emerald-300 text-emerald-800 rounded text-xs font-semibold hover:bg-emerald-100/50 transition"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download Sample CSV
              </button>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 bg-slate-50/50 transition">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-slate-800 mb-0.5">
              Select or Drop Populated Employee Excel Roster (.xlsx / .csv)
            </h4>
            <p className="text-[11px] text-slate-500 mb-3">
              Supports Microsoft Excel (.xlsx) or Comma-Separated Values (.csv)
            </p>

            <label className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded cursor-pointer hover:bg-slate-800 transition">
              <span>Choose File...</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelFileSelect}
                className="hidden"
              />
            </label>

            {selectedExcelFile && (
              <p className="text-xs font-bold text-blue-700 mt-2">
                Selected: {selectedExcelFile.name} ({(selectedExcelFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded font-medium flex items-center">
              <AlertCircle className="w-4 h-4 mr-1.5 text-rose-600 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Success Banner */}
          {excelSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-sm">
                  Bulk Registration Complete!
                </h4>
              </div>
              <p className="text-xs text-emerald-800">
                Successfully registered <strong>{excelSuccess.importedCount}</strong> employees into this camp! All workers are now ready for Doctor Assistant &amp; Counter tests. (Skipped: {excelSuccess.skippedCount} duplicates).
              </p>
              <div className="pt-1 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setActiveMode("ROSTER")}
                  className="px-3 py-1.5 bg-emerald-800 text-white text-xs font-bold rounded hover:bg-emerald-900"
                >
                  View Camp Roster
                </button>
                <a
                  href="/counter"
                  className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-900 text-xs font-semibold rounded hover:bg-emerald-100/50"
                >
                  Go to Counter Stations &rarr;
                </a>
              </div>
            </div>
          )}

          {/* Live Preview Table */}
          {excelPreviewRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center">
                  <span>Excel Preview: First {excelPreviewRows.length} Workers Detected</span>
                </span>
                <button
                  type="button"
                  disabled={uploadingExcel}
                  onClick={handleBulkUploadSubmit}
                  className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded hover:bg-slate-800 transition disabled:opacity-50 shadow-sm"
                >
                  {uploadingExcel ? "Importing & Queueing Workers..." : "Confirm & Import All Workers"}
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2">Code</th>
                      <th className="p-2">Full Name</th>
                      <th className="p-2">Department</th>
                      <th className="p-2">Designation</th>
                      <th className="p-2">DOB</th>
                      <th className="p-2">Gender</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Mobile</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {excelPreviewRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 font-mono font-bold text-slate-900">{row.code}</td>
                        <td className="p-2 font-medium text-slate-800">{row.name}</td>
                        <td className="p-2 text-slate-600">{row.department}</td>
                        <td className="p-2 text-slate-600">{row.designation}</td>
                        <td className="p-2 text-slate-600">{row.dob}</td>
                        <td className="p-2 text-slate-600">{row.gender}</td>
                        <td className="p-2 text-slate-600">{row.type}</td>
                        <td className="p-2 text-slate-600">{row.mobile}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CAMP ROSTER & REGISTERED WORKERS */}
      {activeMode === "ROSTER" && (
        <div className="bg-white p-5 rounded-b border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Registered Workers in this Camp ({roster.length})
              </h3>
              <p className="text-xs text-slate-500">
                All personnel active in the occupational health surveillance pipeline
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="Search name, health ID, code..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-500"
              />
            </div>
          </div>

          {rosterLoading ? (
            <p className="text-xs text-slate-400 py-8 text-center">Loading camp roster...</p>
          ) : filteredRoster.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No registered employees found matching your search.</p>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2">Health ID</th>
                    <th className="p-2">Code</th>
                    <th className="p-2">Full Name</th>
                    <th className="p-2">Department</th>
                    <th className="p-2">Designation</th>
                    <th className="p-2">Age / Sex</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">BMI</th>
                    <th className="p-2 text-right">Medical Form</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRoster.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="p-2 font-mono font-bold text-blue-900">{emp.healthId}</td>
                      <td className="p-2 font-mono text-slate-700">{emp.employeeCode}</td>
                      <td className="p-2 font-medium text-slate-900">{emp.fullName}</td>
                      <td className="p-2 text-slate-600">{emp.department}</td>
                      <td className="p-2 text-slate-600">{emp.designation}</td>
                      <td className="p-2 text-slate-600">{emp.age}y / {emp.sex}</td>
                      <td className="p-2 text-slate-600">{emp.employeeType}</td>
                      <td className="p-2 text-slate-600">{emp.bmi} ({emp.bmiCategory})</td>
                      <td className="p-2 text-right">
                        <a
                          href={`/api/reports/${emp.healthId}/medical-examination-form`}
                          target="_blank"
                          className="inline-flex items-center px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded hover:bg-slate-800"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          2-Page Form
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
