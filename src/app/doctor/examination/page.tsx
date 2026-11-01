"use client";

import React, { useState, useEffect } from "react";
import {
  Stethoscope,
  Heart,
  Wind,
  Brain,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Save,
  Send,
  Eye,
  Activity,
  User,
  Search,
  Mail,
  FileText,
} from "lucide-react";

interface EmployeeDetailed {
  id: string;
  healthId: string;
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
  email?: string | null;
  vitalsVision?: {
    systolicBp: number;
    diastolicBp: number;
    pulse?: number | null;
    distantVisionRight: string;
    distantVisionLeft: string;
    nearVisionRight: string;
    nearVisionLeft: string;
    withGlasses: boolean;
    colorVision: string;
  } | null;
  bloodResult?: { parametersJson?: string | null } | null;
  diagnosticResults: { testType: string; findings: string; conclusion: string }[];
  doctorExamination?: {
    pastMedicalHistory?: string | null;
    occupationalHistory?: string | null;
    presentComplaints?: string | null;
    nadFlagsJson?: string | null;
    abnormalFindingsJson?: string | null;
    physicalExamNotes?: string | null;
    generalAdvice?: string | null;
    isDraft?: boolean;
  } | null;
}

export default function DoctorExaminationPage() {
  const [employees, setEmployees] = useState<EmployeeDetailed[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<EmployeeDetailed | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Examination Fields
  const [pastHistory, setPastHistory] = useState("No history of diabetes, hypertension or major surgery");
  const [occupationalHistory, setOccupationalHistory] = useState("Industrial engineering exposure; adheres to safety PPE");
  const [presentComplaints, setPresentComplaints] = useState("No active complaints");
  const [physicalExamNotes, setPhysicalExamNotes] = useState("");
  const [generalAdvice, setGeneralAdvice] = useState("Maintain routine hydration and periodic health review.");

  // Fast-entry NAD Flags (Default all NAD)
  const [nadFlags, setNadFlags] = useState<Record<string, "NAD" | "ABNORMAL">>({
    physical: "NAD",
    respiratory: "NAD",
    cardiovascular: "NAD",
    gastrointestinal: "NAD",
    centralNervous: "NAD",
    musculoskeletal: "NAD",
  });

  const [abnormalNotes, setAbnormalNotes] = useState<Record<string, string>>({
    respiratory: "",
    cardiovascular: "",
    gastrointestinal: "",
    centralNervous: "",
    physical: "",
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [emailing, setEmailing] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/camps")
      .then((res) => res.json())
      .then((data) => {
        if (data.camps && data.camps.length > 0) {
          fetch(`/api/camps/${data.camps[0].id}`)
            .then((r) => r.json())
            .then((cd) => {
              if (cd.camp && cd.camp.employees) {
                setEmployees(cd.camp.employees);
                if (cd.camp.employees.length > 0) {
                  handleSelectEmployee(cd.camp.employees[0]);
                }
              }
            });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelectEmployee = (emp: EmployeeDetailed) => {
    setSelectedEmp(emp);
    setSuccessMsg(null);

    if (emp.doctorExamination) {
      const e = emp.doctorExamination;
      setPastHistory(e.pastMedicalHistory || "No significant medical history");
      setOccupationalHistory(e.occupationalHistory || "Plant engineering exposure; wears PPE");
      setPresentComplaints(e.presentComplaints || "No active complaints");
      setPhysicalExamNotes(e.physicalExamNotes || "");
      setGeneralAdvice(e.generalAdvice || "");

      if (e.nadFlagsJson) {
        try {
          setNadFlags(JSON.parse(e.nadFlagsJson));
        } catch {}
      }
      if (e.abnormalFindingsJson) {
        try {
          setAbnormalNotes(JSON.parse(e.abnormalFindingsJson));
        } catch {}
      }
    } else {
      setPastHistory("No history of diabetes, hypertension or major surgery");
      setOccupationalHistory("Industrial engineering exposure; adheres to safety PPE");
      setPresentComplaints("No active complaints");
      setPhysicalExamNotes("");
      setGeneralAdvice("Maintain routine hydration and periodic health review.");
      setNadFlags({
        physical: "NAD",
        respiratory: "NAD",
        cardiovascular: "NAD",
        gastrointestinal: "NAD",
        centralNervous: "NAD",
        musculoskeletal: "NAD",
      });
      setAbnormalNotes({});
    }
  };

  const toggleNad = (system: string, value: "NAD" | "ABNORMAL") => {
    setNadFlags((prev) => ({ ...prev, [system]: value }));
  };

  const handleSave = async (isDraft = false) => {
    if (!selectedEmp) return;
    setSaving(true);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/doctor/examination", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmp.id,
          pastMedicalHistory: pastHistory,
          occupationalHistory,
          presentComplaints,
          nadFlags,
          abnormalFindings: abnormalNotes,
          physicalExamNotes,
          generalAdvice,
          isDraft,
        }),
      });

      if (res.ok) {
        setSuccessMsg(isDraft ? "Examination draft saved." : "Clinical Examination completed and submitted!");
        // If not draft and worker has email, auto-dispatch the 2-page Medical Examination Report Form
        if (!isDraft && selectedEmp.email) {
          handleEmailReport(selectedEmp.healthId);
        }
      }
    } catch {
      setSuccessMsg("Error saving examination.");
    } finally {
      setSaving(false);
    }
  };

  const handleEmailReport = async (healthIdToEmail?: string) => {
    const targetHealthId = healthIdToEmail || selectedEmp?.healthId;
    if (!targetHealthId) return;
    setEmailing(true);
    setEmailStatus(null);
    try {
      const res = await fetch(`/api/reports/${targetHealthId}/email`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setEmailStatus(`2-Page Medical Examination Form sent via email to ${data.recipient || "worker"}`);
      } else {
        setEmailStatus(data.error || "Failed to dispatch email");
      }
    } catch {
      setEmailStatus("Error connecting to email service");
    } finally {
      setEmailing(false);
    }
  };

  const filteredEmployees = employees.filter((e) =>
    search ? e.healthId.toLowerCase().includes(search.toLowerCase()) || e.fullName.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Stethoscope className="w-4 h-4" />
              <span>Counter 8 &bull; Tablet B Interface</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Doctor Clinical Examination</h1>
            <p className="text-xs text-slate-400 mt-1">
              Unified medical history, systemic examination with fast-entry NAD toggles, and clinical advice.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Queue / Employee List */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Camp Roster</h2>
            <span className="px-2 py-0.5 bg-slate-800 text-cyan-400 text-xs font-mono rounded-full">
              {filteredEmployees.length}
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by Health ID or Name..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="divide-y divide-slate-800 max-h-[600px] overflow-y-auto">
            {filteredEmployees.map((emp) => {
              const isSelected = selectedEmp?.id === emp.id;
              return (
                <button
                  key={emp.id}
                  onClick={() => handleSelectEmployee(emp)}
                  className={`w-full text-left p-3 rounded-lg transition my-1 flex items-start justify-between ${
                    isSelected
                      ? "bg-emerald-950/50 border border-emerald-700/60 text-white"
                      : "hover:bg-slate-800/60 text-slate-300"
                  }`}
                >
                  <div>
                    <div className="font-mono text-xs font-bold text-cyan-400">{emp.healthId}</div>
                    <div className="text-xs font-medium text-white">{emp.fullName}</div>
                    <div className="text-[11px] text-slate-400">
                      {emp.age}y / {emp.sex.charAt(0)} &bull; {emp.department}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      emp.doctorExamination
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {emp.doctorExamination ? "Examined" : "Pending"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Unified Examination Form */}
        <div className="lg:col-span-2 space-y-6">
          {selectedEmp ? (
            <div className="space-y-6">
              {/* Patient Dossier Ribbon */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-cyan-400">{selectedEmp.healthId}</span>
                    <h2 className="text-lg font-bold text-white">{selectedEmp.fullName}</h2>
                    <p className="text-xs text-slate-400">
                      {selectedEmp.age} Years &bull; {selectedEmp.sex} &bull; {selectedEmp.department} &bull;{" "}
                      {selectedEmp.designation}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-center">
                      <div className="text-[10px] text-slate-500 font-medium">BMI</div>
                      <div className="font-bold text-white">{selectedEmp.bmi}</div>
                    </div>
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-center">
                      <div className="text-[10px] text-slate-500 font-medium">BP</div>
                      <div className="font-bold text-rose-400">
                        {selectedEmp.vitalsVision
                          ? `${selectedEmp.vitalsVision.systolicBp}/${selectedEmp.vitalsVision.diastolicBp}`
                          : "—"}
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-center">
                      <div className="text-[10px] text-slate-500 font-medium">Vision (R/L)</div>
                      <div className="font-bold text-cyan-400">
                        {selectedEmp.vitalsVision
                          ? `${selectedEmp.vitalsVision.distantVisionRight}/${selectedEmp.vitalsVision.distantVisionLeft}`
                          : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Diagnostic Highlights */}
                {selectedEmp.diagnosticResults && selectedEmp.diagnosticResults.length > 0 && (
                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap gap-2 text-xs">
                    {selectedEmp.diagnosticResults.map((d, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-slate-950 border border-slate-800 text-slate-300 rounded text-[11px]"
                      >
                        <strong className="text-cyan-400">{d.testType}:</strong> {d.conclusion}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {successMsg && (
                <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* History Section */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  1. Clinical History & Present Complaints
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Past Medical History</label>
                    <textarea
                      rows={2}
                      value={pastHistory}
                      onChange={(e) => setPastHistory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Occupational History</label>
                    <textarea
                      rows={2}
                      value={occupationalHistory}
                      onChange={(e) => setOccupationalHistory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Present Complaints</label>
                    <textarea
                      rows={2}
                      value={presentComplaints}
                      onChange={(e) => setPresentComplaints(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Fast-Entry NAD Systemic Examination */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    2. Systemic Clinical Examination (NAD / ABNORMAL Fast Entry)
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setNadFlags({
                        physical: "NAD",
                        respiratory: "NAD",
                        cardiovascular: "NAD",
                        gastrointestinal: "NAD",
                        centralNervous: "NAD",
                        musculoskeletal: "NAD",
                      })
                    }
                    className="text-[10px] text-cyan-400 hover:underline"
                  >
                    Mark All Systems NAD
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Respiratory */}
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <Wind className="w-4 h-4 text-cyan-400" /> Respiratory System
                      </span>
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={() => toggleNad("respiratory", "NAD")}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                            nadFlags.respiratory === "NAD"
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          NAD
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleNad("respiratory", "ABNORMAL")}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                            nadFlags.respiratory === "ABNORMAL"
                              ? "bg-rose-600 text-white"
                              : "bg-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          Abnormal
                        </button>
                      </div>
                    </div>
                    {nadFlags.respiratory === "ABNORMAL" && (
                      <input
                        type="text"
                        placeholder="Findings: e.g. Bilateral rhonchi, prolonged expiration"
                        value={abnormalNotes.respiratory || ""}
                        onChange={(e) => setAbnormalNotes({ ...abnormalNotes, respiratory: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-rose-800 rounded text-xs text-white"
                      />
                    )}
                  </div>

                  {/* Cardiovascular */}
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-rose-400" /> Cardiovascular System
                      </span>
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={() => toggleNad("cardiovascular", "NAD")}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                            nadFlags.cardiovascular === "NAD"
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          NAD
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleNad("cardiovascular", "ABNORMAL")}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                            nadFlags.cardiovascular === "ABNORMAL"
                              ? "bg-rose-600 text-white"
                              : "bg-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          Abnormal
                        </button>
                      </div>
                    </div>
                    {nadFlags.cardiovascular === "ABNORMAL" && (
                      <input
                        type="text"
                        placeholder="Findings: e.g. Systolic murmur, tachycardia"
                        value={abnormalNotes.cardiovascular || ""}
                        onChange={(e) => setAbnormalNotes({ ...abnormalNotes, cardiovascular: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-rose-800 rounded text-xs text-white"
                      />
                    )}
                  </div>

                  {/* Gastrointestinal */}
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">Abdomen / Gastrointestinal</span>
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={() => toggleNad("gastrointestinal", "NAD")}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                            nadFlags.gastrointestinal === "NAD"
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          NAD
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleNad("gastrointestinal", "ABNORMAL")}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                            nadFlags.gastrointestinal === "ABNORMAL"
                              ? "bg-rose-600 text-white"
                              : "bg-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          Abnormal
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Central Nervous System */}
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <Brain className="w-4 h-4 text-purple-400" /> Central Nervous System
                      </span>
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={() => toggleNad("centralNervous", "NAD")}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                            nadFlags.centralNervous === "NAD"
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          NAD
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleNad("centralNervous", "ABNORMAL")}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                            nadFlags.centralNervous === "ABNORMAL"
                              ? "bg-rose-600 text-white"
                              : "bg-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          Abnormal
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advice & Save Actions */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                <label className="block text-xs font-medium text-slate-300">Doctor Advice & Directives</label>
                <textarea
                  rows={2}
                  value={generalAdvice}
                  onChange={(e) => setGeneralAdvice(e.target.value)}
                  placeholder="e.g. Needs spectacles, low salt diet, refer to physician for HTN workup"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />

                {emailStatus && (
                  <div className="p-3 bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-xs rounded-lg flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>{emailStatus}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center space-x-2">
                    <a
                      href={`/api/reports/${selectedEmp.healthId}/medical-examination-form`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold border border-slate-700 transition"
                      title="Download or preview 2-Page Manasvi Medical Examination Report Form PDF"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>2-Page Form (PDF)</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleEmailReport()}
                      disabled={emailing}
                      className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition disabled:opacity-50"
                      title="Email filled 2-page Medical Examination Report Form to worker"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{emailing ? "Sending Email..." : "Email Form to Worker"}</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleSave(true)}
                      disabled={saving}
                      className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Draft</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSave(false)}
                      disabled={saving}
                      className="flex items-center space-x-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-950 transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Complete Examination & Send to Final Review</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
              <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="font-bold text-white text-base">Select an Employee</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Pick an employee from the camp roster to review previous history and conduct systemic examination.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
