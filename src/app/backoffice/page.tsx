"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Send,
  Download,
  Search,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";

interface EmployeeVerificationItem {
  id: string;
  healthId: string;
  fullName: string;
  employeeCode: string;
  department: string;
  employeeType: string;
  contractorName?: string | null;
  status: string;
  vitalsVision?: object | null;
  bloodResult?: object | null;
  diagnosticResults: { testType: string; conclusion: string }[];
  counterVisits: {
    status: string;
    campCounter: { name: string; isMandatory: boolean; counterType: string };
  }[];
}

export default function BackOfficePage() {
  const [campId, setCampId] = useState<string>("");
  const [employees, setEmployees] = useState<EmployeeVerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [overrideMissing, setOverrideMissing] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetch("/api/camps")
      .then((res) => res.json())
      .then((data) => {
        if (data.camps && data.camps.length > 0) {
          const primaryId = data.camps[0].id;
          setCampId(primaryId);
          fetchCampData(primaryId);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const fetchCampData = (id: string) => {
    setLoading(true);
    fetch(`/api/camps/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.camp && data.camp.employees) {
          setEmployees(data.camp.employees);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleVerify = async (empId: string) => {
    setVerifyingId(empId);
    setFeedback(null);
    try {
      const res = await fetch("/api/backoffice/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: empId, overrideMissing }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ text: data.message, type: "success" });
        fetchCampData(campId);
      } else {
        setFeedback({ text: data.error || "Failed to verify employee record", type: "error" });
      }
    } catch {
      setFeedback({ text: "Error connecting to server", type: "error" });
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredEmployees = employees.filter(
    (e) =>
      !search ||
      e.healthId.toLowerCase().includes(search.toLowerCase()) ||
      e.fullName.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Back Office Command & Verification</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Record Verification & Camp Exports</h1>
            <p className="text-xs text-slate-400 mt-1">
              Verify completion of mandatory medical counters, check lab parameters, and route complete records to the Doctor.
            </p>
          </div>

          {/* Excel Export Quick Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`/api/reports/camps/${campId}/daily-excel`}
              download
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>8:00 PM Daily Excel</span>
            </a>

            <a
              href={`/api/reports/camps/${campId}/final-excel`}
              download
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Final Camp Attendance Excel</span>
            </a>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
            feedback.type === "success"
              ? "bg-emerald-950/70 border border-emerald-800 text-emerald-300"
              : "bg-rose-950/70 border border-rose-800 text-rose-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Health ID, Code, Name..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={overrideMissing}
              onChange={(e) => setOverrideMissing(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700 text-indigo-500"
            />
            <span>Allow Authorized Override for Incomplete Records</span>
          </label>
        </div>
      </div>

      {/* Verification Queue Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-3">Health ID</th>
                <th className="px-6 py-3">Employee Name</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Counter Completion</th>
                <th className="px-6 py-3">Missing Checks</th>
                <th className="px-6 py-3">Current Status</th>
                <th className="px-6 py-3 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredEmployees.map((emp) => {
                const missing = emp.counterVisits
                  .filter(
                    (v) =>
                      v.campCounter.isMandatory &&
                      v.campCounter.counterType !== "DOCTOR_EXAMINATION" &&
                      v.campCounter.counterType !== "BACK_OFFICE" &&
                      v.status !== "COMPLETED"
                  )
                  .map((v) => v.campCounter.name);

                const completedCount = emp.counterVisits.filter((v) => v.status === "COMPLETED").length;
                const totalCount = emp.counterVisits.length;
                const isReady = missing.length === 0 || overrideMissing;

                return (
                  <tr key={emp.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-mono font-bold text-cyan-400">{emp.healthId}</td>
                    <td className="px-6 py-4 font-medium text-white">
                      {emp.fullName}
                      <div className="text-[10px] text-slate-500">Code: {emp.employeeCode}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{emp.department}</td>

                    {/* Completion count */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white">{completedCount}/{totalCount}</span>
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full"
                            style={{ width: `${(completedCount / totalCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Missing checklist */}
                    <td className="px-6 py-4">
                      {missing.length === 0 ? (
                        <span className="inline-flex items-center text-emerald-400 text-[11px] font-semibold gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> All Mandatory Tests Done
                        </span>
                      ) : (
                        <span className="text-amber-400 text-[11px] font-medium">
                          Missing: {missing.join(", ")}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {emp.status.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="px-6 py-4 text-right">
                      {emp.status === "FINALIZED" ? (
                        <span className="text-xs text-emerald-400 font-bold">Finalized</span>
                      ) : emp.status === "PENDING_DOCTOR" ? (
                        <span className="text-xs text-purple-400 font-semibold">In Doctor Queue</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleVerify(emp.id)}
                          disabled={verifyingId === emp.id || (!isReady && !overrideMissing)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ml-auto ${
                            isReady
                              ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow"
                              : "bg-slate-800 text-slate-500 cursor-not-allowed"
                          }`}
                        >
                          <Send className="w-3 h-3" />
                          <span>Send to Doctor for Final Review</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
