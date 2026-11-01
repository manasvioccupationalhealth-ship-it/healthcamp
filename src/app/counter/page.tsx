"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useOffline } from "@/context/OfflineContext";
import { queueOfflineOperation, queueOfflineAttachment } from "@/lib/offline-store";
import { calculateBmi, calculateAge } from "@/lib/bmi";
import {
  Upload,
  CheckCircle2,
  Search,
  User,
  Clock,
  AlertCircle,
  Stethoscope,
  Building2,
  Layers,
  RefreshCw,
  ArrowRight,
  Check,
  Plus,
  X,
  UserCheck,
  Eye,
  Activity,
  HeartPulse,
  Wind,
  Volume2,
} from "lucide-react";

interface CampSummary {
  id: string;
  campId: string;
  name: string;
  location: string;
  operatingStatus: string;
  company: {
    name: string;
    codePrefix: string;
  };
  counters: CampCounterInfo[];
}

interface CampCounterInfo {
  id: string;
  counterNo: number;
  name: string;
  code: string;
  counterType: string;
  isMandatory: boolean;
  allowsUpload: boolean;
  assignments?: {
    userId: string;
    user: { id: string; name: string; email: string; role: string };
  }[];
}

interface VisitItem {
  id: string;
  status: string;
  isReady?: boolean;
  prerequisiteMessage?: string;
  completedAt?: string | null;
  employee: {
    id: string;
    healthId: string;
    employeeCode: string;
    fullName: string;
    age: number;
    sex: string;
    department: string;
    designation: string;
    employeeType: string;
    heightCm: number;
    weightKg: number;
    bmi: number;
    bmiCategory: string;
    mobile?: string | null;
    photoUrl?: string | null;
    vitalsVision?: {
      systolicBp: number;
      diastolicBp: number;
      pulse?: number | null;
      distantVisionRight?: string;
      distantVisionLeft?: string;
      nearVisionRight?: string;
      nearVisionLeft?: string;
      colorVision?: string;
    } | null;
  };
}

export default function CounterStationPage() {
  const { user } = useAuth();
  const { isOnline, refreshPendingCount } = useOffline();

  // Active Camps
  const [camps, setCamps] = useState<CampSummary[]>([]);
  const [selectedCampId, setSelectedCampId] = useState<string>("");

  // Configured Counters for selected camp
  const [counters, setCounters] = useState<CampCounterInfo[]>([]);
  const [selectedCounterId, setSelectedCounterId] = useState<string>("");

  // Queue state
  const [activeTab, setActiveTab] = useState<"READY" | "PENDING_PREREQUISITE" | "COMPLETED">("READY");
  const [readyWaiting, setReadyWaiting] = useState<VisitItem[]>([]);
  const [pendingWaiting, setPendingWaiting] = useState<VisitItem[]>([]);
  const [completed, setCompleted] = useState<VisitItem[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<VisitItem | null>(null);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Counter 1 Form Inputs (Registration Desk Verification)
  const [heightCm, setHeightCm] = useState("172");
  const [weightKg, setWeightKg] = useState("68");

  // Counter 2 Form Inputs (Doctor Assistant - BP & Vision)
  const [systolicBp, setSystolicBp] = useState("120");
  const [diastolicBp, setDiastolicBp] = useState("80");
  const [pulse, setPulse] = useState("72");
  const [distVisionR, setDistVisionR] = useState("6/6");
  const [distVisionL, setDistVisionL] = useState("6/6");
  const [nearVisionR, setNearVisionR] = useState("N6");
  const [nearVisionL, setNearVisionL] = useState("N6");
  const [colorVision, setColorVision] = useState("Normal");

  // Diagnostic Test Form Inputs (Counters 3 to 7)
  const [findings, setFindings] = useState("Within normal physiological limits");
  const [conclusion, setConclusion] = useState<"Normal" | "Abnormal" | "Borderline">("Normal");
  const [numerical1, setNumerical1] = useState("");
  const [numerical2, setNumerical2] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal: Quick Register Worker at Counter 1
  const [quickRegOpen, setQuickRegOpen] = useState(false);
  const [newEmpCode, setNewEmpCode] = useState("");
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpDob, setNewEmpDob] = useState("1994-06-18");
  const [newEmpSex, setNewEmpSex] = useState<"MALE" | "FEMALE">("MALE");
  const [newEmpDept, setNewEmpDept] = useState("Manufacturing & Assembly");
  const [newEmpDesig, setNewEmpDesig] = useState("Technician Grade 1");
  const [newEmpMobile, setNewEmpMobile] = useState("+91 98765 00000");
  const [newEmpHeight, setNewEmpHeight] = useState("172");
  const [newEmpWeight, setNewEmpWeight] = useState("68");
  const [newEmpType, setNewEmpType] = useState<"COMPANY_STAFF" | "CONTRACT_EMPLOYEE">("COMPANY_STAFF");
  const [newContractorName, setNewContractorName] = useState("");
  const [autoPassOnCreate, setAutoPassOnCreate] = useState(false);
  const [quickRegLoading, setQuickRegLoading] = useState(false);
  const [quickRegError, setQuickRegError] = useState<string | null>(null);

  // Helper to strictly isolate counters: Counter 2 operator sees Counter 2 ONLY!
  const filterCountersForUser = (allCounters: CampCounterInfo[]) => {
    if (!user || user.role === "SUPER_ADMIN") {
      return allCounters;
    }

    // Role-based strict isolation: Counter 2 Operator (DOCTOR_ASSISTANT or assistant email)
    const userEmail = (user.email || "").toLowerCase();
    if (
      user.role === "DOCTOR_ASSISTANT" ||
      userEmail.includes("assistant") ||
      userEmail.includes("vitals")
    ) {
      const c2 = allCounters.find(
        (c) =>
          c.counterNo === 2 ||
          c.code === "VITALS" ||
          c.counterType === "VITALS_VISION"
      );
      return c2 ? [c2] : [];
    }

    // Role-based strict isolation: Counter 1 Operator (REGISTRATION_DESK)
    if (user.role === "REGISTRATION_DESK") {
      const c1 = allCounters.find(
        (c) =>
          c.counterNo === 1 ||
          c.code === "REG" ||
          c.counterType === "REGISTRATION"
      );
      return c1 ? [c1] : [];
    }

    // Assigned operator check in DB
    const assigned = allCounters.find((c) =>
      c.assignments?.some(
        (a) => a.userId === user.id || a.user?.email === user.email
      )
    );
    if (assigned) {
      return [assigned];
    }

    // Email prefix heuristic for other technicians
    const email = user.email.toLowerCase();
    if (email.includes("lab")) {
      const match = allCounters.find((c) => c.counterNo === 3 || c.code === "BLOOD");
      if (match) return [match];
    }
    if (email.includes("ecg")) {
      const match = allCounters.find((c) => c.counterNo === 4 || c.code === "ECG");
      if (match) return [match];
    }
    if (email.includes("pft")) {
      const match = allCounters.find((c) => c.counterNo === 5 || c.code === "PFT");
      if (match) return [match];
    }
    if (email.includes("audio")) {
      const match = allCounters.find((c) => c.counterNo === 6 || c.code === "AUDIO");
      if (match) return [match];
    }
    if (email.includes("xray")) {
      const match = allCounters.find((c) => c.counterNo === 7 || c.code === "XRAY");
      if (match) return [match];
    }

    const targetNo = typeof window !== "undefined" ? localStorage.getItem("target_counter_no") : null;
    if (targetNo) {
      const match = allCounters.find((c) => c.counterNo === parseInt(targetNo, 10));
      if (match) return [match];
    }

    return allCounters.length > 0 ? [allCounters[0]] : [];
  };

  // Fetch Camps
  useEffect(() => {
    fetch("/api/camps")
      .then((res) => res.json())
      .then((data) => {
        if (data.camps && data.camps.length > 0) {
          const activeOnly = data.camps.filter((c: CampSummary) => c.operatingStatus === "ACTIVE");
          const list = activeOnly.length > 0 ? activeOnly : data.camps;
          setCamps(list);

          const savedCamp = localStorage.getItem("active_camp_id");
          const matched = list.find((c: CampSummary) => c.id === savedCamp) || list[0];
          setSelectedCampId(matched.id);

          const allowed = filterCountersForUser(matched.counters || []);
          setCounters(allowed);
          if (allowed.length > 0) {
            setSelectedCounterId(allowed[0].id);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  // When camp changes, update counters
  const handleCampChange = (campId: string) => {
    setSelectedCampId(campId);
    localStorage.setItem("active_camp_id", campId);
    const matched = camps.find((c) => c.id === campId);
    if (matched) {
      const allowed = filterCountersForUser(matched.counters || []);
      setCounters(allowed);
      if (allowed.length > 0) {
        setSelectedCounterId(allowed[0].id);
      }
    }
    setSelectedVisit(null);
    setSuccessMsg(null);
  };

  // Fetch Queue for selected counter
  const fetchQueue = () => {
    if (!selectedCounterId) return;
    fetch(`/api/counters/${selectedCounterId}/queue?search=${encodeURIComponent(search)}`)
      .then((res) => res.json())
      .then((data) => {
        setReadyWaiting(data.readyWaiting || []);
        setPendingWaiting(data.pendingWaiting || []);
        setCompleted(data.completed || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchQueue();
    // Auto poll queue every 3.5 seconds so newly passed workers appear live across counters
    const interval = setInterval(fetchQueue, 3500);
    return () => clearInterval(interval);
  }, [selectedCounterId, search]);

  const activeCounter = counters.find((c) => c.id === selectedCounterId);
  const activeCamp = camps.find((c) => c.id === selectedCampId);

  // Prepopulate test parameters when a visit is selected
  const handleSelectVisit = (visit: VisitItem) => {
    setSelectedVisit(visit);
    setSuccessMsg(null);
    setSelectedFile(null);

    const isC1 = activeCounter?.counterNo === 1 || activeCounter?.code === "REG";
    const isC2 = activeCounter?.counterNo === 2 || activeCounter?.code === "VITALS";

    if (isC1) {
      setHeightCm(String(visit.employee.heightCm || 172));
      setWeightKg(String(visit.employee.weightKg || 68));
      setNotes("Worker verified at Registration Desk");
    } else if (isC2) {
      setSystolicBp("120");
      setDiastolicBp("80");
      setPulse("72");
      setDistVisionR("6/6");
      setDistVisionL("6/6");
      setNearVisionR("N6");
      setNearVisionL("N6");
      setColorVision("Normal");
      setNotes("Vitals and vision within normal occupational baseline");
    } else if (activeCounter?.code === "ECG") {
      setFindings("Normal sinus rhythm, rate 74 bpm, normal axis, no ischemic ST-T changes");
      setConclusion("Normal");
      setNumerical1("74");
      setNumerical2("");
      setNotes("Resting ECG tracing satisfactory");
    } else if (activeCounter?.code === "PFT") {
      setFindings("Spirometry within normal physiological parameters. FVC 96% of predicted.");
      setConclusion("Normal");
      setNumerical1("4.15");
      setNumerical2("3.42");
      setNotes("Good patient effort during forced expiration");
    } else if (activeCounter?.code === "AUDIO") {
      setFindings("Bilateral normal hearing sensitivity. No acoustic notch detected.");
      setConclusion("Normal");
      setNumerical1("15");
      setNumerical2("20");
      setNotes("Standard 500-8000 Hz sweep passed");
    } else if (activeCounter?.code === "BLOOD") {
      setFindings("Fasting blood glucose and lipid panel samples collected.");
      setConclusion("Normal");
      setNumerical1("14.2");
      setNumerical2("94");
      setNotes("Samples labeled and sent to local analyzer");
    } else if (activeCounter?.code === "XRAY") {
      setFindings("Lung fields clear, Bronchovascular markings normal, Cardiac silhouette within normal limits.");
      setConclusion("Normal");
      setNotes("PA view digital radiography verified");
    } else {
      setFindings("Clinical parameters within normal physiological limits.");
      setConclusion("Normal");
      setNotes("Station examination passed");
    }
  };

  // Submit test and mark Pass
  const handleSubmitTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit || !selectedCounterId) return;

    setSubmitting(true);
    setSuccessMsg(null);

    const isC1 = activeCounter?.counterNo === 1 || activeCounter?.code === "REG";
    const isC2 = activeCounter?.counterNo === 2 || activeCounter?.code === "VITALS";

    const payload: Record<string, unknown> = {
      employeeId: selectedVisit.employee.id,
      notes,
    };

    if (isC1) {
      payload.heightCm = heightCm;
      payload.weightKg = weightKg;
    } else if (isC2 || activeCounter?.counterType === "VITALS_VISION") {
      payload.systolicBp = parseInt(systolicBp, 10);
      payload.diastolicBp = parseInt(diastolicBp, 10);
      payload.pulse = pulse ? parseInt(pulse, 10) : 72;
      payload.distantVisionRight = distVisionR;
      payload.distantVisionLeft = distVisionL;
      payload.nearVisionRight = nearVisionR;
      payload.nearVisionLeft = nearVisionL;
      payload.colorVision = colorVision;
    } else if (activeCounter?.code === "BLOOD") {
      payload.bloodParameters = {
        haemoglobin: { value: parseFloat(numerical1 || "14.2"), unit: "g/dL", status: "NORMAL" },
        fastingSugar: { value: parseFloat(numerical2 || "94"), unit: "mg/dL", status: "NORMAL" },
      };
      payload.findings = findings;
      payload.conclusion = conclusion;
    } else {
      payload.testType = activeCounter?.code;
      payload.findings = findings;
      payload.conclusion = conclusion;
      payload.numericalData = numerical1 ? { primaryMetric: numerical1, secondaryMetric: numerical2 } : null;
    }

    try {
      if (!isOnline) {
        const opId = await queueOfflineOperation(
          activeCounter?.code === "VITALS"
            ? "VITALS"
            : activeCounter?.code === "BLOOD"
            ? "BLOOD"
            : "DIAGNOSTIC",
          "UPDATE",
          {
            counterId: selectedCounterId,
            ...payload,
          }
        );
        if (selectedFile) {
          await queueOfflineAttachment(
            opId,
            selectedVisit.employee.healthId,
            activeCounter?.code || "DIAGNOSTIC",
            selectedFile
          );
        }
        await refreshPendingCount();
        setSuccessMsg("Test recorded offline in local outbox queue.");
      } else {
        const res = await fetch(`/api/counters/${selectedCounterId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to submit test");
        }

        if (isC1) {
          setSuccessMsg(
            `Counter #1 passed! Worker advanced to Counter #2 (Doctor Assistant - BP & Vision).`
          );
        } else if (isC2) {
          setSuccessMsg(
            `Counter #2 passed! Worker advanced to Diagnostic Test Stations (Blood, ECG, PFT, Audio, X-Ray).`
          );
        } else {
          setSuccessMsg(
            `Counter #${activeCounter?.counterNo} (${activeCounter?.name}) passed successfully!`
          );
        }
      }

      fetchQueue();
      setSelectedVisit(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error submitting test");
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Registration Handler
  const handleQuickRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampId) return;
    setQuickRegLoading(true);
    setQuickRegError(null);

    const hNum = parseFloat(newEmpHeight);
    const wNum = parseFloat(newEmpWeight);
    const bmiVal = calculateBmi(hNum, wNum);
    const ageVal = calculateAge(newEmpDob);

    try {
      const res = await fetch("/api/employees/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campId: selectedCampId,
          employeeType: newEmpType,
          contractorName: newEmpType === "CONTRACT_EMPLOYEE" ? newContractorName : null,
          employeeCode: newEmpCode.trim(),
          fullName: newEmpName.trim(),
          dob: newEmpDob,
          age: ageVal,
          sex: newEmpSex,
          department: newEmpDept.trim(),
          designation: newEmpDesig.trim(),
          tenureYears: 2,
          tenureMonths: 0,
          mobile: newEmpMobile.trim(),
          heightCm: hNum,
          weightKg: wNum,
          bmi: bmiVal.bmi,
          bmiCategory: bmiVal.category,
          autoPassCounter1: autoPassOnCreate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register worker");
      }

      setQuickRegOpen(false);
      setNewEmpCode("");
      setNewEmpName("");
      fetchQueue();
      setSuccessMsg(
        autoPassOnCreate
          ? `Worker ${data.employee.fullName} registered & passed Counter 1! Moving directly to Counter 2.`
          : `Worker ${data.employee.fullName} registered successfully! Now waiting in Counter 1 queue.`
      );
    } catch (err: unknown) {
      setQuickRegError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setQuickRegLoading(false);
    }
  };

  const isCurrentC1 = activeCounter?.counterNo === 1 || activeCounter?.code === "REG";
  const isCurrentC2 = activeCounter?.counterNo === 2 || activeCounter?.code === "VITALS";

  return (
    <div className="space-y-4">
      {/* Top Station Header & Active Camp Selection */}
      <div className="bg-white p-4 rounded border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Counter Station Operator Workspace
            </h1>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-mono font-bold rounded border border-slate-200">
              {user?.role || "COUNTER_STAFF"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Logged in as: <strong className="text-slate-800">{user?.name}</strong> ({user?.email})
          </p>
        </div>

        {/* Active Camp Selector Dropdown */}
        <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded border border-slate-200">
          <Building2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <div className="text-xs">
            <span className="text-slate-500 font-medium mr-1.5">Active Camp:</span>
            <select
              value={selectedCampId}
              onChange={(e) => handleCampChange(e.target.value)}
              className="font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer max-w-[280px] truncate"
            >
              {camps.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company.codePrefix} &bull; {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Counter Station Header: Super Admin sees station switcher tabs; Counter Operator sees their assigned station ONLY */}
      {user?.role === "SUPER_ADMIN" ? (
        <div className="bg-white rounded border border-slate-200 p-3">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 flex items-center">
              <Layers className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Counter Stations for {activeCamp?.company.codePrefix || "Camp"}:
            </span>
            <span className="text-[11px] text-slate-500">
              {counters.length} configured stations (Super Admin Switcher)
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {counters.map((c) => {
              const isAssignedToUser = c.assignments?.some(
                (a) => a.userId === user?.id || a.user?.email === user?.email
              );
              const isSelected = c.id === selectedCounterId;

              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCounterId(c.id);
                    setSelectedVisit(null);
                    setSuccessMsg(null);
                  }}
                  className={`px-3 py-2 rounded text-xs text-left whitespace-nowrap border transition-all flex flex-col justify-between ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : isAssignedToUser
                      ? "bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between space-x-2">
                    <span className="font-bold">
                      #{c.counterNo} {c.name}
                    </span>
                    <span
                      className={`font-mono text-[10px] px-1 py-0.2 rounded ${
                        isSelected
                          ? "bg-slate-800 text-slate-200"
                          : "bg-white text-slate-600 border border-slate-200"
                      }`}
                    >
                      {c.code}
                    </span>
                  </div>
                  {isAssignedToUser && (
                    <span
                      className={`text-[9px] font-bold mt-0.5 ${
                        isSelected ? "text-blue-300" : "text-blue-700"
                      }`}
                    >
                      Your Station
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded border border-slate-200 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded bg-slate-900 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
              #{activeCounter?.counterNo || 2}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span>{activeCounter?.name || "Counter 2: Doctor Assistant (BP & Vision)"}</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                  {activeCounter?.code || "VITALS"}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Active Station &bull; {activeCounter?.counterType || "VITALS_VISION"} &bull; {activeCamp?.company.name} ({activeCamp?.campId})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded border border-emerald-200 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              Counter #{activeCounter?.counterNo || 2} Operator Only
            </span>
          </div>
        </div>
      )}

      {/* Main Counter Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Live Queue Pipeline (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded border border-slate-200 p-3 space-y-3">
            {/* Station Status Banner & Quick Register Button */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center">
                  <span>Counter #{activeCounter?.counterNo}: {activeCounter?.name}</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Station Code: <code className="font-bold">{activeCounter?.code}</code> &bull;{" "}
                  {activeCounter?.isMandatory ? "Mandatory Checkup" : "Optional Test"}
                </p>
              </div>

              <div className="flex items-center space-x-1.5">
                {isCurrentC1 && (
                  <button
                    onClick={() => setQuickRegOpen(true)}
                    className="inline-flex items-center px-2 py-1 bg-slate-900 text-white rounded text-[11px] font-semibold hover:bg-slate-800 transition shadow-sm"
                    title="Register a new worker at Counter 1"
                  >
                    <Plus className="w-3 h-3 mr-0.5" />
                    Register
                  </button>
                )}
                <button
                  onClick={fetchQueue}
                  title="Refresh Live Queue"
                  className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Queue Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search worker by name, health ID..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-500"
              />
            </div>

            {/* Queue Tabs: Counter 2 operator only sees Waiting for Counter 2 and Passed Counter 2 */}
            <div className="flex border-b border-slate-200 text-xs">
              <button
                onClick={() => setActiveTab("READY")}
                className={`py-1.5 px-3 border-b-2 font-semibold transition-colors flex items-center ${
                  activeTab === "READY"
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <span>
                  {isCurrentC1
                    ? "Waiting Pass"
                    : isCurrentC2
                    ? "Waiting for Counter 2"
                    : "Ready for Test"}
                </span>
                <span className="ml-1.5 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold">
                  {readyWaiting.length}
                </span>
              </button>

              {user?.role === "SUPER_ADMIN" && !isCurrentC1 && (
                <button
                  onClick={() => setActiveTab("PENDING_PREREQUISITE")}
                  className={`py-1.5 px-3 border-b-2 font-semibold transition-colors flex items-center ${
                    activeTab === "PENDING_PREREQUISITE"
                      ? "border-slate-900 text-slate-900"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <span>In Previous Stations</span>
                  <span className="ml-1.5 px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] rounded-full font-bold">
                    {pendingWaiting.length}
                  </span>
                </button>
              )}

              <button
                onClick={() => setActiveTab("COMPLETED")}
                className={`py-1.5 px-3 border-b-2 font-semibold transition-colors flex items-center ${
                  activeTab === "COMPLETED"
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <span>{isCurrentC2 ? "Passed Counter 2" : "Passed"}</span>
                <span className="ml-1.5 px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[10px] rounded-full font-bold">
                  {completed.length}
                </span>
              </button>
            </div>

            {/* Queue List Content */}
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {activeTab === "READY" && readyWaiting.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5 opacity-60" />
                  <p className="font-semibold text-slate-700">No workers waiting right now</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isCurrentC1
                      ? "Register new workers or wait for registrations to arrive."
                      : isCurrentC2
                      ? "Workers will appear here as soon as Counter 1 marks them Pass."
                      : "Workers will appear here immediately once preceding counters mark Pass."}
                  </p>
                </div>
              )}

              {activeTab === "READY" &&
                readyWaiting.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectVisit(item)}
                    className={`w-full p-2.5 rounded border text-left transition-colors flex items-start justify-between ${
                      selectedVisit?.id === item.id
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-xs">{item.employee.fullName}</span>
                        <span
                          className={`text-[10px] font-mono px-1 rounded ${
                            selectedVisit?.id === item.id
                              ? "bg-slate-800 text-slate-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.employee.healthId}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] mt-0.5 ${
                          selectedVisit?.id === item.id ? "text-slate-300" : "text-slate-500"
                        }`}
                      >
                        {item.employee.department} &bull; {item.employee.sex}, {item.employee.age}y
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        selectedVisit?.id === item.id
                          ? "bg-emerald-500 text-white"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      Ready
                    </span>
                  </button>
                ))}

              {activeTab === "PENDING_PREREQUISITE" && (
                <>
                  <div className="bg-amber-50 p-2 rounded border border-amber-200 text-xs text-amber-800">
                    <p className="font-semibold">Sequential Prerequisite Status</p>
                    <p className="text-[11px] mt-0.5">
                      Counter 1 registers &amp; marks pass. Then Counter 2 records BP/Vision &amp; marks pass. Then workers automatically appear in your Ready queue!
                    </p>
                  </div>
                  {pendingWaiting.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded border border-slate-200 bg-slate-50/70 text-xs text-slate-700 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{item.employee.fullName}</span>
                        <span className="font-mono text-[10px] text-slate-500">{item.employee.healthId}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{item.employee.department}</p>
                      <span className="inline-flex items-center text-[10px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        {item.prerequisiteMessage || "Waiting for previous station"}
                      </span>
                    </div>
                  ))}
                </>
              )}

              {activeTab === "COMPLETED" && (
                <>
                  {completed.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">
                      {isCurrentC2
                        ? "No workers have passed Counter 2 yet."
                        : "No completed tests yet for this station."}
                    </p>
                  ) : (
                    completed.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded border border-slate-200 bg-white text-xs flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{item.employee.fullName}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {item.employee.healthId} &bull; {item.employee.department}
                          </p>
                          {isCurrentC2 && item.employee.vitalsVision && (
                            <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                              BP {item.employee.vitalsVision.systolicBp}/{item.employee.vitalsVision.diastolicBp} mmHg &bull; Pulse {item.employee.vitalsVision.pulse || 72} &bull; Vision {item.employee.vitalsVision.distantVisionRight || "6/6"}
                            </p>
                          )}
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded border border-emerald-200 flex items-center">
                          <Check className="w-3 h-3 mr-0.5" /> Passed
                        </span>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Examination & Pass Form (7 cols) */}
        <div className="lg:col-span-7">
          {selectedVisit ? (
            <form onSubmit={handleSubmitTest} className="bg-white rounded border border-slate-200 p-5 space-y-4 shadow-sm">
              {/* Worker Profile Header */}
              <div className="pb-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50 p-3 rounded">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium">Examining Worker</span>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedVisit.employee.fullName}
                  </h3>
                  <p className="text-xs text-slate-600 font-mono mt-0.5">
                    {selectedVisit.employee.healthId} &bull; Code: {selectedVisit.employee.employeeCode}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p className="text-slate-900 font-medium">{selectedVisit.employee.department}</p>
                  <p className="text-slate-500 text-[11px]">
                    {selectedVisit.employee.sex}, {selectedVisit.employee.age}y &bull; BMI: {selectedVisit.employee.bmi} ({selectedVisit.employee.bmiCategory})
                  </p>
                </div>
              </div>

              {/* Success Notification */}
              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded font-medium flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600 flex-shrink-0" />
                  {successMsg}
                </div>
              )}

              {/* Test Specific Form Fields */}
              {isCurrentC1 ? (
                /* Counter 1: Registration Desk Verification Form */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
                      <UserCheck className="w-3.5 h-3.5 mr-1 text-slate-700" />
                      Counter #1: Demographics & Physical Parameters
                    </h4>
                    <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
                      {selectedVisit.employee.healthId}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50/70 p-3 rounded border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Employee Code</span>
                      <strong className="text-slate-900 font-mono">{selectedVisit.employee.employeeCode}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Department</span>
                      <strong className="text-slate-900">{selectedVisit.employee.department}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Designation</span>
                      <strong className="text-slate-900">{selectedVisit.employee.designation}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Age / Sex</span>
                      <strong className="text-slate-900">{selectedVisit.employee.age}y / {selectedVisit.employee.sex}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Type</span>
                      <strong className="text-slate-900">{selectedVisit.employee.employeeType}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Mobile</span>
                      <strong className="text-slate-900">{selectedVisit.employee.mobile || "N/A"}</strong>
                    </div>
                  </div>

                  {/* Physical Parameters Verification */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        className="w-full p-2 text-xs border border-slate-300 rounded font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        className="w-full p-2 text-xs border border-slate-300 rounded font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Computed BMI Preview */}
                  {heightCm && weightKg && (
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900 flex items-center justify-between">
                      <span>Calculated BMI: <strong>{calculateBmi(parseFloat(heightCm), parseFloat(weightKg)).bmi}</strong></span>
                      <span className="font-bold uppercase tracking-wider text-[10px] bg-blue-100 px-2 py-0.5 rounded">
                        {calculateBmi(parseFloat(heightCm), parseFloat(weightKg)).category}
                      </span>
                    </div>
                  )}
                </div>
              ) : isCurrentC2 ? (
                /* Counter 2: Doctor Assistant - BP & Vision Form */
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
                    <Eye className="w-3.5 h-3.5 mr-1 text-slate-700" />
                    Counter #2: Vitals & Vision Examination
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Systolic BP (mmHg)</label>
                      <input
                        type="number"
                        required
                        value={systolicBp}
                        onChange={(e) => setSystolicBp(e.target.value)}
                        className="w-full p-2 text-xs border border-slate-300 rounded font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Diastolic BP (mmHg)</label>
                      <input
                        type="number"
                        required
                        value={diastolicBp}
                        onChange={(e) => setDiastolicBp(e.target.value)}
                        className="w-full p-2 text-xs border border-slate-300 rounded font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Pulse (bpm)</label>
                      <input
                        type="number"
                        value={pulse}
                        onChange={(e) => setPulse(e.target.value)}
                        className="w-full p-2 text-xs border border-slate-300 rounded font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Dist Vision (Right)</label>
                      <select
                        value={distVisionR}
                        onChange={(e) => setDistVisionR(e.target.value)}
                        className="w-full p-1.5 text-xs border border-slate-300 rounded bg-white"
                      >
                        <option value="6/6">6/6 (Normal)</option>
                        <option value="6/9">6/9</option>
                        <option value="6/12">6/12</option>
                        <option value="6/18">6/18</option>
                        <option value="6/24">6/24</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Dist Vision (Left)</label>
                      <select
                        value={distVisionL}
                        onChange={(e) => setDistVisionL(e.target.value)}
                        className="w-full p-1.5 text-xs border border-slate-300 rounded bg-white"
                      >
                        <option value="6/6">6/6 (Normal)</option>
                        <option value="6/9">6/9</option>
                        <option value="6/12">6/12</option>
                        <option value="6/18">6/18</option>
                        <option value="6/24">6/24</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Near Vision (Right)</label>
                      <select
                        value={nearVisionR}
                        onChange={(e) => setNearVisionR(e.target.value)}
                        className="w-full p-1.5 text-xs border border-slate-300 rounded bg-white"
                      >
                        <option value="N6">N6 (Normal)</option>
                        <option value="N8">N8</option>
                        <option value="N10">N10</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Color Vision</label>
                      <select
                        value={colorVision}
                        onChange={(e) => setColorVision(e.target.value)}
                        className="w-full p-1.5 text-xs border border-slate-300 rounded bg-white"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Color Blind">Defective (Color Blind)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : activeCounter?.code === "BLOOD" ? (
                /* Counter 3: Blood Collection & Lab Form */
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
                    <Activity className="w-3.5 h-3.5 mr-1 text-slate-700" />
                    Counter #3: Blood Lab Parameters
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Haemoglobin (g/dL)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={numerical1}
                        onChange={(e) => setNumerical1(e.target.value)}
                        placeholder="e.g. 14.5"
                        className="w-full p-2 text-xs border border-slate-300 rounded font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Fasting Blood Sugar (mg/dL)</label>
                      <input
                        type="number"
                        value={numerical2}
                        onChange={(e) => setNumerical2(e.target.value)}
                        placeholder="e.g. 95"
                        className="w-full p-2 text-xs border border-slate-300 rounded font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Interpretation</label>
                    <select
                      value={conclusion}
                      onChange={(e) => setConclusion(e.target.value as "Normal" | "Abnormal" | "Borderline")}
                      className="w-full p-2 text-xs border border-slate-300 rounded bg-white"
                    >
                      <option value="Normal">Normal / Within Baseline</option>
                      <option value="Borderline">Borderline / Pre-Diabetic</option>
                      <option value="Abnormal">Abnormal / Clinical Alert</option>
                    </select>
                  </div>
                </div>
              ) : (
                /* Diagnostic Test Stations (ECG, PFT, Audio, X-Ray, Custom) */
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Counter #{activeCounter?.counterNo}: {activeCounter?.name} Examination
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Value / Metric</label>
                      <input
                        type="text"
                        value={numerical1}
                        onChange={(e) => setNumerical1(e.target.value)}
                        placeholder="e.g. 74 bpm / 4.15 L / 15 dB"
                        className="w-full p-2 text-xs border border-slate-300 rounded font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Conclusion</label>
                      <select
                        value={conclusion}
                        onChange={(e) => setConclusion(e.target.value as "Normal" | "Abnormal" | "Borderline")}
                        className="w-full p-2 text-xs border border-slate-300 rounded bg-white"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Borderline">Borderline</option>
                        <option value="Abnormal">Abnormal</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Findings &amp; Observations</label>
                    <textarea
                      rows={2}
                      value={findings}
                      onChange={(e) => setFindings(e.target.value)}
                      className="w-full p-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-500"
                    />
                  </div>

                  {activeCounter?.allowsUpload && (
                    <div className="pt-1">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Attach Diagnostic Report / Tracing (Optional)
                      </label>
                      <div className="border border-dashed border-slate-300 p-3 rounded text-center bg-slate-50/50 hover:bg-slate-50 transition">
                        <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          className="text-xs text-slate-600 cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-slate-900 file:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Operator Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operator Station Remarks (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Test performed satisfactorily"
                  className="w-full p-2 text-xs border border-slate-300 rounded"
                />
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedVisit(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-5 py-2 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800 disabled:opacity-50 transition shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" />
                  {submitting
                    ? "Recording & Passing..."
                    : isCurrentC1
                    ? "Mark Pass & Advance to Counter #2 (Vitals & Vision)"
                    : isCurrentC2
                    ? "Mark Pass & Advance to Diagnostic Stations"
                    : `Mark Pass & Complete Counter #${activeCounter?.counterNo}`}
                </button>
              </div>
            </form>
          ) : (
            /* Empty State */
            <div className="bg-white rounded border border-slate-200 p-12 text-center">
              <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No Worker Selected</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {isCurrentC1
                  ? "Select an employee from the Waiting Pass queue on the left or click 'Register' to register a new worker for this camp."
                  : isCurrentC2
                  ? "Select a worker from the Waiting for Counter 2 queue on the left to record Vitals & Vision examination and mark Pass."
                  : "Select an employee from the Ready for Test queue on the left to record examination data and mark Pass for this station."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Quick Register Worker at Counter 1 */}
      {quickRegOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded border border-slate-300 shadow-xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Counter 1: Register New Worker
                </h3>
                <p className="text-xs text-slate-500">
                  Camp: {activeCamp?.company.codePrefix} &bull; {activeCamp?.name}
                </p>
              </div>
              <button
                onClick={() => setQuickRegOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {quickRegError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded">
                {quickRegError}
              </div>
            )}

            <form onSubmit={handleQuickRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={newEmpCode}
                    onChange={(e) => setNewEmpCode(e.target.value)}
                    placeholder="e.g. EMP-9081"
                    className="w-full p-2 text-xs border border-slate-300 rounded font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newEmpName}
                    onChange={(e) => setNewEmpName(e.target.value)}
                    placeholder="e.g. Mahesh Patil"
                    className="w-full p-2 text-xs border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    required
                    value={newEmpDob}
                    onChange={(e) => setNewEmpDob(e.target.value)}
                    className="w-full p-1.5 text-xs border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sex</label>
                  <select
                    value={newEmpSex}
                    onChange={(e) => setNewEmpSex(e.target.value as "MALE" | "FEMALE")}
                    className="w-full p-2 text-xs border border-slate-300 rounded bg-white"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Personnel Type
                  </label>
                  <select
                    value={newEmpType}
                    onChange={(e) => setNewEmpType(e.target.value as "COMPANY_STAFF" | "CONTRACT_EMPLOYEE")}
                    className="w-full p-2 text-xs border border-slate-300 rounded bg-white"
                  >
                    <option value="COMPANY_STAFF">Company Staff</option>
                    <option value="CONTRACT_EMPLOYEE">Contractor</option>
                  </select>
                </div>
              </div>

              {newEmpType === "CONTRACT_EMPLOYEE" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contractor Agency Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newContractorName}
                    onChange={(e) => setNewContractorName(e.target.value)}
                    placeholder="e.g. Apex Security & Facility"
                    className="w-full p-2 text-xs border border-slate-300 rounded"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    required
                    value={newEmpDept}
                    onChange={(e) => setNewEmpDept(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    required
                    value={newEmpDesig}
                    onChange={(e) => setNewEmpDesig(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newEmpHeight}
                    onChange={(e) => setNewEmpHeight(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newEmpWeight}
                    onChange={(e) => setNewEmpWeight(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile
                  </label>
                  <input
                    type="text"
                    value={newEmpMobile}
                    onChange={(e) => setNewEmpMobile(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoPassOnCreate}
                    onChange={(e) => setAutoPassOnCreate(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-0"
                  />
                  <span>Mark Counter 1 as Passed immediately (advance straight to Counter 2)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setQuickRegOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickRegLoading}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 disabled:opacity-50"
                >
                  {quickRegLoading ? "Registering..." : "Register Worker"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
