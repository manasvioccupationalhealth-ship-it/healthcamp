"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FileSpreadsheet,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Download,
  Send,
  Printer,
  ChevronDown,
  RefreshCw,
  FileText,
  BadgeCheck,
  LayoutGrid,
  Table as TableIcon,
  Heart,
  Eye,
  Activity,
  ShieldCheck,
  Stethoscope,
  Mail,
  User,
} from "lucide-react";

interface ReviewRow {
  id: string; // employeeId
  healthId: string;
  fullName: string;
  age: number;
  sex: string;
  employeeType: string;
  contractorName: string;
  department: string;
  designation: string;
  bmi: number;
  bmiCategory: string;
  bp: string;
  vision: string;
  bloodStatus: string;
  diagnosticsCount: number;
  examStatus: string;
  completedCounters: number;
  totalCounters: number;
  status: string;
  fitnessStatus: string; // FIT, UNFIT, FIT_WITH_RESTRICTION
  adviceList: string[];
  remarks: string;
  restrictions: string;
  version: number;
  doctorName?: string | null;
  signedAt?: string | null;
}

const COMMON_ADVICE = [
  "Annual Health Checkup",
  "Needs Spectacles",
  "Low Salt Diet",
  "Refer to Physician",
  "Follow-up Required",
  "Ergonomic Exercises",
  "Avoid Noise Exposure",
  "Further Investigation",
];

export default function DoctorMasterReviewPage() {
  const [campId, setCampId] = useState<string>("");
  const [availableCamps, setAvailableCamps] = useState<
    { id: string; name: string; campId: string; company?: { name: string } }[]
  >([]);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'table' (Spreadsheet) or 'cards' (Responsive Grid)
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Filters
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedFitness, setSelectedFitness] = useState("ALL");

  // Selection for Bulk Submission
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkFitnessChoice, setBulkFitnessChoice] = useState<string>("FIT");
  const [submittingBulk, setSubmittingBulk] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [emailSendingId, setEmailSendingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/camps")
      .then((res) => res.json())
      .then((data) => {
        if (data.camps && data.camps.length > 0) {
          setAvailableCamps(data.camps);
          const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
          const queryCampId = params?.get("campId");
          const initialCamp =
            queryCampId && data.camps.some((c: any) => c.id === queryCampId)
              ? queryCampId
              : data.camps[0].id;
          setCampId(initialCamp);
          fetchMasterData(initialCamp);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const fetchMasterData = (id: string) => {
    setLoading(true);
    fetch(`/api/doctor/master-review?campId=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.rows) {
          setRows(data.rows);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // Inline Row Edits
  const handleFitnessChange = (rowId: string, val: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, fitnessStatus: val } : r))
    );
  };

  const handleAdviceToggle = (rowId: string, adviceItem: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const exists = r.adviceList.includes(adviceItem);
        const updated = exists ? r.adviceList.filter((a) => a !== adviceItem) : [...r.adviceList, adviceItem];
        return { ...r, adviceList: updated };
      })
    );
  };

  const handleRemarksChange = (rowId: string, val: string) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, remarks: val } : r)));
  };

  // Selection Helpers
  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRows.map((r) => r.id)));
    }
  };

  // Bulk Apply & Submit
  const handleBulkSubmit = async () => {
    if (selectedIds.size === 0) return;
    setSubmittingBulk(true);
    setFeedbackMsg(null);

    const updates = rows
      .filter((r) => selectedIds.has(r.id))
      .map((r) => ({
        employeeId: r.id,
        healthId: r.healthId,
        fitnessStatus: r.fitnessStatus || bulkFitnessChoice,
        adviceList: r.adviceList.length > 0 ? r.adviceList : ["Annual Health Checkup"],
        remarks: r.remarks || "Clinically certified for occupational duties.",
        restrictions: r.restrictions || null,
      }));

    try {
      const res = await fetch("/api/doctor/bulk-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackMsg({
          text: `Successfully finalized and generated certifications for ${data.successful.length} employees!`,
          type: "success",
        });
        setSelectedIds(new Set());
        fetchMasterData(campId);
      } else {
        setFeedbackMsg({
          text: data.error || "Some records failed validation during bulk submission.",
          type: "error",
        });
      }
    } catch {
      setFeedbackMsg({ text: "Error connecting to local server.", type: "error" });
    } finally {
      setSubmittingBulk(false);
    }
  };

  // Email action helper
  const handleSendEmail = async (healthId: string) => {
    setEmailSendingId(healthId);
    try {
      const res = await fetch(`/api/reports/${healthId}/email`, { method: "POST" });
      const d = await res.json();
      alert(d.message || "2-Page Medical Examination Report Form sent via email!");
    } catch {
      alert("Failed to dispatch email.");
    } finally {
      setEmailSendingId(null);
    }
  };

  // Filtered Rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const matchSearch =
        !search ||
        r.healthId.toLowerCase().includes(search.toLowerCase()) ||
        r.fullName.toLowerCase().includes(search.toLowerCase()) ||
        r.contractorName.toLowerCase().includes(search.toLowerCase());

      const matchDept = selectedDept === "ALL" || r.department === selectedDept;
      const matchType = selectedType === "ALL" || r.employeeType === selectedType;
      const matchFitness = selectedFitness === "ALL" || r.fitnessStatus === selectedFitness;

      return matchSearch && matchDept && matchType && matchFitness;
    });
  }, [rows, search, selectedDept, selectedType, selectedFitness]);

  const departments = Array.from(new Set(rows.map((r) => r.department))).filter(Boolean);

  const stats = useMemo(() => {
    const total = rows.length;
    const fitCount = rows.filter((r) => r.fitnessStatus === "FIT").length;
    const restrictionCount = rows.filter((r) => r.fitnessStatus === "FIT_WITH_RESTRICTION").length;
    const unfitCount = rows.filter((r) => r.fitnessStatus === "UNFIT").length;
    return { total, fitCount, restrictionCount, unfitCount };
  }, [rows]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Doctor Master Review &bull; Certified Decision Sheet</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Doctor's Master Review Spreadsheet
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Real-time occupational health decision sheet with frozen identifiers, inline fitness certification,
              customizable clinical advice, and 2-page Manasvi form generation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  viewMode === "table"
                    ? "bg-cyan-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Spreadsheet Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  viewMode === "cards"
                    ? "bg-cyan-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Patient Cards View (Touch & Mobile friendly)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>

            {/* Camp Selector */}
            {availableCamps.length > 0 && (
              <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="text-[11px] font-semibold text-slate-400">Camp:</span>
                <select
                  value={campId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setCampId(newId);
                    setSelectedIds(new Set());
                    fetchMasterData(newId);
                  }}
                  className="bg-transparent text-cyan-300 font-bold text-xs focus:outline-none max-w-[140px] sm:max-w-none truncate"
                >
                  {availableCamps.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                      {c.name} {c.company?.name ? `(${c.company.name})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => fetchMasterData(campId)}
              className="p-2 sm:px-3 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1 transition"
              title="Refresh Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Refresh</span>
            </button>

            <a
              href={`/api/reports/camps/${campId}/final-excel`}
              download
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export Excel</span>
            </a>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800">
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Total In Dossier</div>
            <div className="text-lg font-bold text-white mt-0.5">{stats.total}</div>
          </div>
          <div className="bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-900/30">
            <div className="text-[10px] text-emerald-400 uppercase font-semibold">Fit for Duty</div>
            <div className="text-lg font-bold text-emerald-300 mt-0.5">{stats.fitCount}</div>
          </div>
          <div className="bg-amber-950/20 p-2.5 rounded-lg border border-amber-900/30">
            <div className="text-[10px] text-amber-400 uppercase font-semibold">With Restriction</div>
            <div className="text-lg font-bold text-amber-300 mt-0.5">{stats.restrictionCount}</div>
          </div>
          <div className="bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/30">
            <div className="text-[10px] text-rose-400 uppercase font-semibold">Unfit / Critical</div>
            <div className="text-lg font-bold text-rose-300 mt-0.5">{stats.unfitCount}</div>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
            feedbackMsg.type === "success"
              ? "bg-emerald-950/70 border border-emerald-800 text-emerald-300"
              : "bg-rose-950/70 border border-rose-800 text-rose-300"
          }`}
        >
          {feedbackMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Filter and Bulk Action Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Health ID, Name, Contractor..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="COMPANY_STAFF">Company Staff</option>
              <option value="CONTRACT_EMPLOYEE">Contract Staff</option>
            </select>

            {/* Fitness Filter */}
            <select
              value={selectedFitness}
              onChange={(e) => setSelectedFitness(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Fitness Statuses</option>
              <option value="FIT">Fit</option>
              <option value="FIT_WITH_RESTRICTION">Fit with Restriction</option>
              <option value="UNFIT">Unfit</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.size > 0 && (
          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-cyan-950/20 p-3 rounded-lg border border-cyan-800/40">
            <div className="text-xs font-semibold text-cyan-300">
              {selectedIds.size} {selectedIds.size === 1 ? "Employee" : "Employees"} selected for Doctor Final Review
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">Set Verdict:</span>
              <select
                value={bulkFitnessChoice}
                onChange={(e) => setBulkFitnessChoice(e.target.value)}
                className="px-2.5 py-1 bg-slate-950 border border-cyan-700 text-xs font-bold text-white rounded focus:outline-none"
              >
                <option value="FIT">Fit</option>
                <option value="FIT_WITH_RESTRICTION">Fit with Restriction</option>
                <option value="UNFIT">Unfit</option>
              </select>

              <button
                type="button"
                onClick={handleBulkSubmit}
                disabled={submittingBulk}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold shadow transition flex items-center gap-1.5"
              >
                {submittingBulk ? (
                  <span>Signing & Certifying...</span>
                ) : (
                  <>
                    <BadgeCheck className="w-3.5 h-3.5" />
                    <span>Bulk Certify & Finalize</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* VIEW MODE 1: SPREADSHEET TABLE (Horizontal Scrolling with Pinning) */}
      {viewMode === "table" ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
          {/* Responsive scroll hint */}
          <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              Showing <strong className="text-white">{filteredRows.length}</strong> records &bull; Swipe horizontally to view all clinical parameters
            </span>
            <span className="hidden sm:inline text-cyan-400 font-medium">
              Frozen: Checkbox, Health ID, Name
            </span>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse min-w-[1550px]">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 sticky top-0 z-30">
                <tr>
                  {/* Pin 1: Checkbox */}
                  <th className="p-3 w-12 min-w-[48px] text-center sticky left-0 z-30 bg-slate-950 border-r border-slate-800">
                    <input
                      type="checkbox"
                      checked={selectedIds.size > 0 && selectedIds.size === filteredRows.length}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-cyan-500"
                    />
                  </th>
                  {/* Pin 2: Health ID */}
                  <th className="p-3 w-36 min-w-[144px] sticky left-12 z-30 bg-slate-950 border-r border-slate-800 whitespace-nowrap">
                    Health ID
                  </th>
                  {/* Pin 3: Employee Name */}
                  <th className="p-3 w-52 min-w-[210px] sticky left-48 z-30 bg-slate-950 border-r border-slate-800 shadow-md whitespace-nowrap">
                    Employee Name
                  </th>
                  <th className="p-3 w-16 min-w-[60px]">Sex</th>
                  <th className="p-3 w-28 min-w-[90px]">Type</th>
                  <th className="p-3 w-36 min-w-[140px]">Contractor</th>
                  <th className="p-3 w-28 min-w-[90px]">BMI</th>
                  <th className="p-3 w-28 min-w-[110px]">Blood Pressure</th>
                  <th className="p-3 w-28 min-w-[100px]">Vision</th>
                  <th className="p-3 w-24 min-w-[90px]">Blood</th>
                  <th className="p-3 w-24 min-w-[90px]">Diagnostics</th>
                  <th className="p-3 w-28 min-w-[100px]">Exam</th>
                  <th className="p-3 w-44 min-w-[170px]">Fitness Status</th>
                  <th className="p-3 w-64 min-w-[220px]">Doctor Advice</th>
                  <th className="p-3 w-52 min-w-[180px]">Remarks</th>
                  <th className="p-3 w-48 min-w-[180px] text-right">Official Reports</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredRows.map((row) => {
                  const isChecked = selectedIds.has(row.id);
                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-800/40 transition ${
                        isChecked ? "bg-cyan-950/20" : ""
                      }`}
                    >
                      {/* Checkbox (Pinned) */}
                      <td className="p-3 text-center sticky left-0 z-10 bg-slate-900 border-r border-slate-800">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectRow(row.id)}
                          className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-cyan-500"
                        />
                      </td>

                      {/* Health ID (Pinned) */}
                      <td className="p-3 sticky left-12 z-10 bg-slate-900 font-mono font-bold text-cyan-400 border-r border-slate-800 whitespace-nowrap min-w-[144px]">
                        <div>{row.healthId}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{row.age} Yrs &bull; {row.sex}</div>
                      </td>

                      {/* Employee Name (Pinned) */}
                      <td className="p-3 sticky left-48 z-10 bg-slate-900 font-medium text-white border-r border-slate-800 shadow-md whitespace-nowrap min-w-[210px]">
                        <div className="font-semibold text-white">{row.fullName}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[190px]">{row.department}</div>
                      </td>

                      <td className="p-3 text-slate-400">{row.sex.charAt(0)}</td>
                      <td className="p-3 text-slate-400">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            row.employeeType === "COMPANY_STAFF"
                              ? "bg-slate-800 text-slate-300"
                              : "bg-amber-950/60 text-amber-300 border border-amber-800/40"
                          }`}
                        >
                          {row.employeeType === "COMPANY_STAFF" ? "Staff" : "Contract"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 truncate max-w-[140px]" title={row.contractorName}>
                        {row.contractorName || "—"}
                      </td>

                      {/* BMI */}
                      <td className="p-3">
                        <span className="font-semibold text-white">{row.bmi}</span>
                        <div className="text-[10px] text-slate-500">{row.bmiCategory}</div>
                      </td>

                      {/* BP */}
                      <td className="p-3 font-mono font-medium text-rose-300">{row.bp}</td>

                      {/* Vision */}
                      <td className="p-3 font-mono text-cyan-300 text-[11px]">{row.vision}</td>

                      {/* Blood Status */}
                      <td className="p-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            row.bloodStatus === "Verified" ? "text-emerald-400 bg-emerald-950" : "text-amber-400 bg-amber-950"
                          }`}
                        >
                          {row.bloodStatus}
                        </span>
                      </td>

                      {/* Diagnostic count */}
                      <td className="p-3 font-mono text-slate-300 text-center">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 text-[10px] font-bold">
                          {row.diagnosticsCount} OK
                        </span>
                      </td>

                      {/* Exam Status */}
                      <td className="p-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            row.examStatus === "Completed" ? "text-emerald-400 bg-emerald-950" : "text-slate-400 bg-slate-800"
                          }`}
                        >
                          {row.examStatus}
                        </span>
                      </td>

                      {/* Inline Fitness Decision */}
                      <td className="p-3">
                        <select
                          value={row.fitnessStatus}
                          onChange={(e) => handleFitnessChange(row.id, e.target.value)}
                          className={`w-full px-2 py-1 rounded text-xs font-bold border focus:outline-none cursor-pointer ${
                            row.fitnessStatus === "FIT"
                              ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                              : row.fitnessStatus === "UNFIT"
                              ? "bg-rose-950 text-rose-300 border-rose-700"
                              : row.fitnessStatus === "FIT_WITH_RESTRICTION"
                              ? "bg-amber-950 text-amber-300 border-amber-700"
                              : "bg-slate-950 text-slate-400 border-slate-700"
                          }`}
                        >
                          <option value="">Select Fitness</option>
                          <option value="FIT">Fit for Duty</option>
                          <option value="FIT_WITH_RESTRICTION">Fit with Restriction</option>
                          <option value="UNFIT">Unfit</option>
                        </select>
                      </td>

                      {/* Configurable Advice Tags */}
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 max-w-[240px]">
                          {COMMON_ADVICE.slice(0, 3).map((item) => {
                            const active = row.adviceList.includes(item);
                            return (
                              <button
                                key={item}
                                type="button"
                                onClick={() => handleAdviceToggle(row.id, item)}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition ${
                                  active
                                    ? "bg-cyan-600 text-white font-bold"
                                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                                }`}
                              >
                                {item}
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* Remarks Input */}
                      <td className="p-3">
                        <input
                          type="text"
                          value={row.remarks}
                          onChange={(e) => handleRemarksChange(row.id, e.target.value)}
                          placeholder="Clinical remarks..."
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[11px] text-white focus:outline-none focus:border-cyan-500"
                        />
                      </td>

                      {/* Reports Download */}
                      <td className="p-3 text-right">
                        <div className="inline-flex space-x-1.5 items-center justify-end">
                          <a
                            href={`/api/reports/${row.healthId}/medical-examination-form`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 rounded text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
                            title="Open 2-Page Medical Examination Report Form PDF"
                          >
                            <FileSpreadsheet className="w-3 h-3 text-cyan-400" />
                            <span>2-Page Form</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => handleSendEmail(row.healthId)}
                            disabled={emailSendingId === row.healthId}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded text-[11px] font-medium transition flex items-center gap-1"
                            title="Email 2-Page Medical Examination Form to Worker"
                          >
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{emailSendingId === row.healthId ? "Sending..." : "Email"}</span>
                          </button>

                          <a
                            href={`/api/reports/${row.healthId}/healthcard-pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded text-[11px] font-medium transition"
                            title="Print Health Card"
                          >
                            Card
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: RESPONSIVE CARDS VIEW (Mobile & Tablet Optimized) */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRows.map((row) => {
            const isChecked = selectedIds.has(row.id);
            return (
              <div
                key={row.id}
                className={`bg-slate-900 border rounded-xl p-4 shadow transition space-y-4 ${
                  isChecked
                    ? "border-cyan-500 bg-cyan-950/15 ring-1 ring-cyan-500/50"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Card Top: Checkbox, Health ID, Name, Dept */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelectRow(row.id)}
                      className="mt-1 w-4 h-4 rounded bg-slate-950 border-slate-700 text-cyan-500"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-400">{row.healthId}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            row.employeeType === "COMPANY_STAFF"
                              ? "bg-slate-800 text-slate-300"
                              : "bg-amber-950/80 text-amber-300 border border-amber-800/40"
                          }`}
                        >
                          {row.employeeType === "COMPANY_STAFF" ? "Staff" : "Contract"}
                        </span>
                      </div>
                      <h3 className="font-semibold text-white text-sm mt-0.5">{row.fullName}</h3>
                      <p className="text-[11px] text-slate-400">
                        {row.age} Yrs &bull; {row.sex} &bull; {row.department}
                      </p>
                      {row.contractorName && (
                        <p className="text-[10px] text-slate-500 mt-0.5">Contractor: {row.contractorName}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Clinical Highlights Grid */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">BMI</span>
                    <span className="font-semibold text-white">{row.bmi}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{row.bmiCategory}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">BP</span>
                    <span className="font-mono font-medium text-rose-300">{row.bp}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Vision</span>
                    <span className="font-mono text-cyan-300 text-[11px]">{row.vision}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Blood</span>
                    <span className="text-emerald-400 font-semibold text-[11px]">{row.bloodStatus}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Tests</span>
                    <span className="text-cyan-300 font-semibold text-[11px]">{row.diagnosticsCount} OK</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Exam</span>
                    <span className="text-emerald-400 font-semibold text-[11px]">{row.examStatus}</span>
                  </div>
                </div>

                {/* Inline Fitness Decision */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Fitness Status
                  </label>
                  <select
                    value={row.fitnessStatus}
                    onChange={(e) => handleFitnessChange(row.id, e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold border focus:outline-none cursor-pointer ${
                      row.fitnessStatus === "FIT"
                        ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                        : row.fitnessStatus === "UNFIT"
                        ? "bg-rose-950 text-rose-300 border-rose-700"
                        : row.fitnessStatus === "FIT_WITH_RESTRICTION"
                        ? "bg-amber-950 text-amber-300 border-amber-700"
                        : "bg-slate-950 text-slate-400 border-slate-700"
                    }`}
                  >
                    <option value="">Select Fitness Status</option>
                    <option value="FIT">Fit for Duty</option>
                    <option value="FIT_WITH_RESTRICTION">Fit with Restriction</option>
                    <option value="UNFIT">Unfit</option>
                  </select>
                </div>

                {/* Advice Chips */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Clinical Advice
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {COMMON_ADVICE.slice(0, 4).map((item) => {
                      const active = row.adviceList.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleAdviceToggle(row.id, item)}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                            active
                              ? "bg-cyan-600 text-white font-bold"
                              : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Remarks Input */}
                <div>
                  <input
                    type="text"
                    value={row.remarks}
                    onChange={(e) => handleRemarksChange(row.id, e.target.value)}
                    placeholder="Doctor clinical remarks..."
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <a
                    href={`/api/reports/${row.healthId}/medical-examination-form`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 px-3 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm text-center"
                    title="Open 2-Page Medical Examination Report Form PDF"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                    <span>2-Page Form</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleSendEmail(row.healthId)}
                    disabled={emailSendingId === row.healthId}
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-medium transition flex items-center gap-1"
                    title="Email Form to Worker"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{emailSendingId === row.healthId ? "..." : "Email"}</span>
                  </button>

                  <a
                    href={`/api/reports/${row.healthId}/healthcard-pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-3 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded-lg text-xs font-medium transition text-center"
                    title="Print Health Card"
                  >
                    Card
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
