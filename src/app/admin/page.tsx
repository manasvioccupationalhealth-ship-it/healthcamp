"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Tent,
  Database,
  ShieldCheck,
  Plus,
  CheckCircle2,
  AlertCircle,
  Download,
  Calendar,
  Layers,
} from "lucide-react";

interface Company {
  id: string;
  name: string;
  codePrefix: string;
  city: string;
  registeredEmail: string;
  hrContactName: string;
  _count: { employees: number };
}

interface Camp {
  id: string;
  campId: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  company: { name: string };
  _count: { employees: number };
}

export default function AdminManagementPage() {
  const [tab, setTab] = useState<"COMPANIES" | "CAMPS" | "BACKUP">("COMPANIES");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);

  // New Company Form
  const [compName, setCompName] = useState("");
  const [codePrefix, setCodePrefix] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [hrName, setHrName] = useState("");
  const [hrMobile, setHrMobile] = useState("");

  // New Camp Form
  const [campName, setCampName] = useState("");
  const [selectedCompId, setSelectedCompId] = useState("");
  const [campLocation, setCampLocation] = useState("");
  const [campStart, setCampStart] = useState("2026-11-01");
  const [campEnd, setCampEnd] = useState("2026-11-05");

  // Backup State
  const [backupResult, setBackupResult] = useState<{ fileName: string; path: string; size: number } | null>(null);

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchData = () => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then((d) => {
        if (d.companies) {
          setCompanies(d.companies);
          if (d.companies.length > 0 && !selectedCompId) {
            setSelectedCompId(d.companies[0].id);
          }
        }
      });

    fetch("/api/camps")
      .then((r) => r.json())
      .then((d) => {
        if (d.camps) setCamps(d.camps);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: compName,
          codePrefix,
          address,
          city,
          registeredEmail: email,
          hrContactName: hrName,
          hrMobile,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ text: `Company ${compName} created successfully!`, type: "success" });
        setCompName("");
        setCodePrefix("");
        setAddress("");
        setCity("");
        setEmail("");
        setHrName("");
        setHrMobile("");
        fetchData();
      } else {
        setFeedback({ text: data.error || "Failed to create company", type: "error" });
      }
    } catch {
      setFeedback({ text: "Error connecting to server", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/camps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campName,
          companyId: selectedCompId,
          location: campLocation,
          startDate: campStart,
          endDate: campEnd,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ text: `Camp ${campName} created with 9 configured medical counters!`, type: "success" });
        setCampName("");
        setCampLocation("");
        fetchData();
      } else {
        setFeedback({ text: data.error || "Failed to create camp", type: "error" });
      }
    } catch {
      setFeedback({ text: "Error connecting to server", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerBackup = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/backup");
      const data = await res.json();
      if (res.ok && data.success) {
        setBackupResult({
          fileName: data.backupFileName,
          path: data.backupFilePath,
          size: data.fileSizeBytes,
        });
        setFeedback({ text: "SQLite database snapshot successfully created!", type: "success" });
      } else {
        setFeedback({ text: data.error || "Backup failed", type: "error" });
      }
    } catch {
      setFeedback({ text: "Error triggering backup", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow">
        <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Super Admin Operations</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Companies, Camps & Local Backups</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage onboarded corporate clients, configure check-up camps with counter workflows, and create database snapshots.
        </p>

        {/* Tab Controls */}
        <div className="flex space-x-2 mt-6">
          <button
            onClick={() => setTab("COMPANIES")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              tab === "COMPANIES"
                ? "bg-cyan-600 text-white shadow"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Companies ({companies.length})</span>
          </button>

          <button
            onClick={() => setTab("CAMPS")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              tab === "CAMPS"
                ? "bg-cyan-600 text-white shadow"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Tent className="w-4 h-4" />
            <span>Medical Camps ({camps.length})</span>
          </button>

          <button
            onClick={() => setTab("BACKUP")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              tab === "BACKUP"
                ? "bg-cyan-600 text-white shadow"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Local Database Backup</span>
          </button>
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

      {/* TAB 1: COMPANIES */}
      {tab === "COMPANIES" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Company Form */}
          <form onSubmit={handleCreateCompany} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Register New Company</span>
            </h2>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Company Full Name *</label>
              <input
                type="text"
                required
                value={compName}
                onChange={(e) => setCompName(e.target.value)}
                placeholder="e.g. Larsen & Toubro Heavy Eng"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Health ID Prefix (3-4 Letters) *</label>
              <input
                type="text"
                required
                maxLength={5}
                value={codePrefix}
                onChange={(e) => setCodePrefix(e.target.value.toUpperCase())}
                placeholder="e.g. LNT"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs font-mono font-bold text-cyan-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">City & Address *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Industrial Area, Powai"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">HR Contact Person</label>
                <input
                  type="text"
                  required
                  value={hrName}
                  onChange={(e) => setHrName(e.target.value)}
                  placeholder="Mr. Sharma"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">HR Mobile</label>
                <input
                  type="tel"
                  required
                  value={hrMobile}
                  onChange={(e) => setHrMobile(e.target.value)}
                  placeholder="+91 98..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Registered Company Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hr@lnt.com"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs shadow transition"
            >
              Save Company
            </button>
          </form>

          {/* Companies List */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
            <div className="p-4 border-b border-slate-800">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">Registered Client Companies</h3>
            </div>
            <div className="divide-y divide-slate-800 text-xs">
              {companies.map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">{c.name}</span>
                      <span className="px-2 py-0.5 bg-slate-950 border border-slate-700 text-cyan-400 font-mono rounded text-[11px]">
                        Prefix: {c.codePrefix}
                      </span>
                    </div>
                    <div className="text-slate-400 mt-1">
                      HR: {c.hrContactName} &bull; Email: {c.registeredEmail}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-cyan-400 font-mono font-bold text-sm">{c._count.employees}</span>
                    <div className="text-[10px] text-slate-500">Employees Registered</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CAMPS */}
      {tab === "CAMPS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Camp Form */}
          <form onSubmit={handleCreateCamp} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Launch New Medical Camp</span>
            </h2>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Company *</label>
              <select
                value={selectedCompId}
                onChange={(e) => setSelectedCompId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.codePrefix})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Camp Name *</label>
              <input
                type="text"
                required
                value={campName}
                onChange={(e) => setCampName(e.target.value)}
                placeholder="e.g. Annual Medical Camp 2026 Phase 1"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Location / Venue *</label>
              <input
                type="text"
                required
                value={campLocation}
                onChange={(e) => setCampLocation(e.target.value)}
                placeholder="Main Plant OHC / Medical Room"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={campStart}
                  onChange={(e) => setCampStart(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={campEnd}
                  onChange={(e) => setCampEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-400">
              <strong className="text-cyan-400">Auto-configured Counters:</strong> Registration, Vitals & Vision, Blood, ECG, PFT, Audiometry, X-Ray, Doctor Exam, Back Office.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs shadow transition"
            >
              Launch Camp
            </button>
          </form>

          {/* Camps List */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
            <div className="p-4 border-b border-slate-800">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">All Medical Camps</h3>
            </div>
            <div className="divide-y divide-slate-800 text-xs">
              {camps.map((camp) => (
                <div key={camp.id} className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">{camp.name}</span>
                      <span className="px-2 py-0.5 bg-cyan-950 text-cyan-400 font-mono rounded text-[11px]">
                        {camp.campId}
                      </span>
                    </div>
                    <div className="text-slate-400 mt-1">
                      {camp.company.name} &bull; {camp.location}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-emerald-400 font-mono font-bold text-sm">{camp._count.employees}</span>
                    <div className="text-[10px] text-slate-500">Employees</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BACKUP */}
      {tab === "BACKUP" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow space-y-6 max-w-2xl">
          <div>
            <h3 className="font-bold text-white text-base">Local Database Snapshot & Backup</h3>
            <p className="text-xs text-slate-400 mt-1">
              Creates an atomic file snapshot of SQLite database (<code className="text-cyan-400">dev.db</code>) with full camp rosters, attachments, and doctor reviews.
            </p>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Database Engine:</span>
              <span className="font-mono text-white">SQLite 3 (WAL Mode Enabled)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Network Concurrency:</span>
              <span className="text-emerald-400 font-semibold">LAN Multi-User Supported</span>
            </div>
          </div>

          {backupResult && (
            <div className="p-4 bg-emerald-950/70 border border-emerald-800 rounded-xl text-xs space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Backup Created Successfully!</span>
              </div>
              <div className="text-slate-300 font-mono text-[11px]">File: {backupResult.fileName}</div>
              <div className="text-slate-400 font-mono text-[10px] break-all">Path: {backupResult.path}</div>
              <div className="text-slate-400">Size: {(backupResult.size / 1024).toFixed(1)} KB</div>
            </div>
          )}

          <button
            type="button"
            onClick={handleTriggerBackup}
            disabled={loading}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-cyan-950 transition flex items-center justify-center space-x-2"
          >
            <Database className="w-4 h-4" />
            <span>Create Instant Database Snapshot Now</span>
          </button>
        </div>
      )}
    </div>
  );
}
