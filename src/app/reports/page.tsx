"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  FileSpreadsheet,
  Download,
  Printer,
  CheckCircle2,
  Calendar,
  Building2,
  User,
  Search,
  ExternalLink,
} from "lucide-react";

interface EmployeeReportItem {
  id: string;
  healthId: string;
  fullName: string;
  department: string;
  status: string;
  fitnessStatus?: string | null;
}

export default function ReportsCenterPage() {
  const [camps, setCamps] = useState<{ id: string; name: string; campId: string; company: { name: string } }[]>([]);
  const [selectedCampId, setSelectedCampId] = useState<string>("");
  const [employees, setEmployees] = useState<EmployeeReportItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/camps")
      .then((res) => res.json())
      .then((data) => {
        if (data.camps && data.camps.length > 0) {
          setCamps(data.camps);
          setSelectedCampId(data.camps[0].id);
          fetchCampEmployees(data.camps[0].id);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const fetchCampEmployees = (id: string) => {
    setLoading(true);
    fetch(`/api/camps/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.camp && data.camp.employees) {
          const list = data.camp.employees.map((e: { id: string; healthId: string; fullName: string; department: string; status: string; fitnessDecision?: { fitnessStatus: string } }) => ({
            id: e.id,
            healthId: e.healthId,
            fullName: e.fullName,
            department: e.department,
            status: e.status,
            fitnessStatus: e.fitnessDecision?.fitnessStatus,
          }));
          setEmployees(list);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleCampChange = (id: string) => {
    setSelectedCampId(id);
    fetchCampEmployees(id);
  };

  const filtered = employees.filter(
    (e) => !search || e.healthId.toLowerCase().includes(search.toLowerCase()) || e.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <FileText className="w-4 h-4" />
              <span>Medical Report & Export Center</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Medical Dossiers & Company Exports</h1>
            <p className="text-xs text-slate-400 mt-1">
              Generate server-side PDF medical dossiers, CR80 health cards, and consolidated multi-sheet Excel workbooks.
            </p>
          </div>

          {camps.length > 0 && (
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
              <label className="block text-[10px] text-slate-400 font-medium mb-1">Target Medical Camp:</label>
              <select
                value={selectedCampId}
                onChange={(e) => handleCampChange(e.target.value)}
                className="bg-transparent text-xs text-cyan-400 font-bold focus:outline-none cursor-pointer"
              >
                {camps.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {c.company.name} &bull; {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Company Excel Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Excel */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-cyan-950 border border-cyan-800 rounded-xl text-cyan-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">8:00 PM Daily Camp Excel Report</h3>
              <p className="text-xs text-slate-400">Section 16.A requirement</p>
            </div>
          </div>

          <p className="text-xs text-slate-300">
            Generates two formatted sheets: <strong>Sheet 1 (Daily Summary)</strong> with male/female, staff vs contract, and contractor-wise counts; <strong>Sheet 2 (Employees Registered Today)</strong> with timestamp and station progress.
          </p>

          <a
            href={`/api/reports/camps/${selectedCampId}/daily-excel`}
            download
            className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 shadow"
          >
            <Download className="w-4 h-4" />
            <span>Download Daily Excel (.xlsx)</span>
          </a>
        </div>

        {/* Final Master Excel */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-xl text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Final Consolidated Camp Attendance & Medical Excel</h3>
              <p className="text-xs text-slate-400">Section 16.B requirement</p>
            </div>
          </div>

          <p className="text-xs text-slate-300">
            Consolidated workbook covering all camp days with grand total registrations, breakdown by sex, contractor summary, individual attendance, and final fitness decisions.
          </p>

          <a
            href={`/api/reports/camps/${selectedCampId}/final-excel`}
            download
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 shadow"
          >
            <Download className="w-4 h-4" />
            <span>Download Final Master Attendance Excel (.xlsx)</span>
          </a>
        </div>
      </div>

      {/* Individual Employee PDF Download Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
        <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-white text-sm">Employee Medical Dossiers & Health Cards</h3>
            <p className="text-xs text-slate-400">Generate individual A4 medical dossiers or compact printable CR80 cards</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by Health ID or Name..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-3">Health ID</th>
                <th className="px-6 py-3">Employee Name</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Camp Status</th>
                <th className="px-6 py-3">Fitness Decision</th>
                <th className="px-6 py-3 text-right">PDF Outputs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-6 py-3.5 font-mono font-bold text-cyan-400">{emp.healthId}</td>
                  <td className="px-6 py-3.5 font-medium text-white">{emp.fullName}</td>
                  <td className="px-6 py-3.5 text-slate-400">{emp.department}</td>
                  <td className="px-6 py-3.5">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {emp.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    {emp.fitnessStatus ? (
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          emp.fitnessStatus === "FIT"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : emp.fitnessStatus === "UNFIT"
                            ? "bg-rose-950 text-rose-400 border border-rose-800"
                            : "bg-amber-950 text-amber-400 border border-amber-800"
                        }`}
                      >
                        {emp.fitnessStatus.replace(/_/g, " ")}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right space-x-1.5 flex items-center justify-end">
                    <a
                      href={`/api/reports/${emp.healthId}/medical-examination-form`}
                      target="_blank"
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-blue-950 hover:bg-blue-900 border border-blue-700 text-blue-300 rounded text-xs font-semibold transition"
                      title="Download Official 2-Page Medical Examination Report Form"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>2-Page Form (PDF)</span>
                    </a>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/reports/${emp.healthId}/email`, { method: "POST" });
                          const d = await res.json();
                          alert(d.message || "Medical Examination Report Form sent via email!");
                        } catch {
                          alert("Failed to dispatch email.");
                        }
                      }}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded text-xs font-semibold transition"
                      title="Email 2-Page Medical Examination Report Form to Worker"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Email Form</span>
                    </button>

                    <a
                      href={`/api/reports/${emp.healthId}/healthcard-pdf`}
                      target="_blank"
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded text-xs font-semibold transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Health Card</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
