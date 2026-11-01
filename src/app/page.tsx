"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  Building2,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  FileText,
  UserPlus,
  Stethoscope,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Download,
  Plus,
  Search,
  ChevronRight,
  X,
  ExternalLink,
  Layers,
} from "lucide-react";

interface CounterAssignment {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface CampCounter {
  id: string;
  counterNo: number;
  name: string;
  code: string;
  counterType: string;
  isMandatory: boolean;
  assignments: CounterAssignment[];
}

interface CampSummary {
  id: string;
  campId: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  operatingStatus: string;
  company: {
    id: string;
    name: string;
    codePrefix: string;
  };
  counters: CampCounter[];
  stats: {
    totalRegistered: number;
    finalized: number;
    pendingDoctor: number;
    inProgress: number;
  };
}

interface CompanyOption {
  id: string;
  name: string;
  codePrefix: string;
  registeredEmail?: string;
  hrContactName?: string;
}

export default function SuperAdminCampsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [camps, setCamps] = useState<CampSummary[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Role-based routing: Counter operators only see their counter station, doctors see review portal
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/login");
      } else if (
        user.role === "DOCTOR_ASSISTANT" ||
        user.role === "COUNTER_STAFF" ||
        user.role === "REGISTRATION_DESK"
      ) {
        router.replace("/counter");
      } else if (user.role === "DOCTOR") {
        router.replace("/doctor/master-review");
      }
    }
  }, [authLoading, user, router]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Camp Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [campName, setCampName] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [creatingCamp, setCreatingCamp] = useState(false);

  // Inline Add Company Form
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyPrefix, setNewCompanyPrefix] = useState("");
  const [newCompanyAddress, setNewCompanyAddress] = useState("");
  const [newCompanyEmail, setNewCompanyEmail] = useState("");
  const [newCompanyHrName, setNewCompanyHrName] = useState("");
  const [newCompanyHrMobile, setNewCompanyHrMobile] = useState("");
  const [creatingCompany, setCreatingCompany] = useState(false);

  const fetchCampsAndCompanies = async () => {
    try {
      setLoading(true);
      const [campsRes, compRes] = await Promise.all([
        fetch("/api/camps"),
        fetch("/api/companies"),
      ]);

      if (campsRes.ok) {
        const campsData = await campsRes.json();
        setCamps(campsData.camps || []);
      }

      if (compRes.ok) {
        const compData = await compRes.json();
        setCompanies(compData.companies || []);
        if (compData.companies?.length > 0 && !selectedCompanyId) {
          setSelectedCompanyId(compData.companies[0].id);
        }
      }
    } catch (e) {
      console.error("Error fetching camps:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCampsAndCompanies();
      setStartDate(new Date().toISOString().split("T")[0]);
      setEndDate(
        new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      );
    }
  }, [user]);

  const handleCreateCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName || !selectedCompanyId || !location || !startDate || !endDate) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setCreatingCamp(true);
      const res = await fetch("/api/camps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campName,
          companyId: selectedCompanyId,
          location,
          startDate,
          endDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create camp");

      setCreateModalOpen(false);
      setCampName("");
      setLocation("");
      await fetchCampsAndCompanies();
      router.push(`/camps/${data.camp.id}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error creating camp");
    } finally {
      setCreatingCamp(false);
    }
  };

  const handleCreateCompanyInline = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingCompany(true);
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCompanyName,
          codePrefix: newCompanyPrefix,
          address: newCompanyAddress || "Client Campus",
          registeredEmail: newCompanyEmail,
          hrContactName: newCompanyHrName,
          hrMobile: newCompanyHrMobile,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create company");

      await fetchCampsAndCompanies();
      setSelectedCompanyId(data.company.id);
      setShowAddCompany(false);
      setNewCompanyName("");
      setNewCompanyPrefix("");
      setNewCompanyEmail("");
      setNewCompanyHrName("");
      setNewCompanyHrMobile("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error creating company");
    } finally {
      setCreatingCompany(false);
    }
  };

  // Filter camps based on search and status
  const filteredCamps = camps.filter((camp) => {
    const matchesSearch =
      searchTerm === "" ||
      camp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camp.campId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camp.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camp.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || camp.operatingStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (authLoading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-900 border-t-transparent" />
        <p className="mt-3 text-xs text-slate-500 font-medium">Checking authorization...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Calculate high-level aggregates
  const totalCampsCount = camps.length;
  const activeCampsCount = camps.filter((c) => c.operatingStatus === "ACTIVE").length;
  const totalEmployees = camps.reduce((acc, c) => acc + (c.stats?.totalRegistered || 0), 0);
  const totalFinalized = camps.reduce((acc, c) => acc + (c.stats?.finalized || 0), 0);
  const totalInProgress = camps.reduce((acc, c) => acc + (c.stats?.inProgress || 0), 0);

  return (
    <div className="space-y-6">
      {/* Super Admin Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Health Surveillance Camps
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {user?.role === "COMPANY_HR"
              ? "Viewing occupational health surveillance camps for your company"
              : user?.role === "DOCTOR"
              ? "Viewing active occupational health camps and worker clinical surveillance"
              : "Active and scheduled occupational health check-up camps, client sites, and station counters"}
          </p>
        </div>

        {user?.role === "SUPER_ADMIN" && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center px-3.5 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Create New Camp
            </button>
          </div>
        )}
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Active Camps</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">
            {activeCampsCount}{" "}
            <span className="text-xs font-normal text-slate-500">of {totalCampsCount} total</span>
          </p>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Registered Workforce</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{totalEmployees}</p>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">In Station Queues</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{totalInProgress}</p>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Fitness Certified</p>
          <p className="text-xl font-bold text-emerald-700 mt-0.5">{totalFinalized}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search camp name, company, ID, or location..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          {["ALL", "ACTIVE", "COMPLETED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors ${
                statusFilter === st
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {st === "ALL" ? "All Camps" : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Camp Cards */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-900 border-t-transparent" />
          <p className="mt-3 text-xs text-slate-500">Loading camps directory...</p>
        </div>
      ) : filteredCamps.length === 0 ? (
        <div className="bg-white rounded border border-slate-200 p-12 text-center">
          <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Camps Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? "No camps match your search query."
              : "No occupational health surveillance camps currently configured."}
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="mt-4 inline-flex items-center px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Create First Camp
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCamps.map((camp) => {
            const registered = camp.stats?.totalRegistered || 0;
            const finalized = camp.stats?.finalized || 0;
            const pendingDoc = camp.stats?.pendingDoctor || 0;
            const inProgress = camp.stats?.inProgress || 0;
            const percent = registered > 0 ? Math.round((finalized / registered) * 100) : 0;

            // Assigned operator count
            const assignedCountersCount = camp.counters.filter(
              (c) => c.assignments && c.assignments.length > 0
            ).length;

            return (
              <div
                key={camp.id}
                className="bg-white rounded border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                {/* Card Header & Body */}
                <div className="p-4 space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-mono font-bold rounded border border-slate-200">
                      {camp.company.codePrefix}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[11px] font-mono text-slate-500">
                        {camp.campId}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${
                          camp.operatingStatus === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {camp.operatingStatus}
                      </span>
                    </div>
                  </div>

                  {/* Camp Name */}
                  <div>
                    <Link
                      href={`/camps/${camp.id}`}
                      className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors tracking-tight line-clamp-1"
                    >
                      {camp.name}
                    </Link>
                    <p className="text-xs text-slate-500 flex items-center mt-1">
                      <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{camp.company.name}</span>
                    </p>
                  </div>

                  {/* Location & Dates */}
                  <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                    <p className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{camp.location}</span>
                    </p>
                    <p className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                      <span>
                        {new Date(camp.startDate).toLocaleDateString()} &ndash;{" "}
                        {new Date(camp.endDate).toLocaleDateString()}
                      </span>
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Certification Progress</span>
                      <span className="font-semibold text-slate-900">
                        {finalized} / {registered} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* 4-Cell Stats Grid inside Card */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1 text-center bg-slate-50 p-2 rounded border border-slate-100">
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Registered</p>
                      <p className="text-sm font-bold text-slate-900">{registered}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">In Queue</p>
                      <p className="text-sm font-bold text-slate-900">{inProgress}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Doctor</p>
                      <p className="text-sm font-bold text-amber-700">{pendingDoc}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Certified</p>
                      <p className="text-sm font-bold text-emerald-700">{finalized}</p>
                    </div>
                  </div>

                  {/* Counters Summary */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span className="flex items-center font-medium text-slate-700">
                      <Layers className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {camp.counters.length} Counters
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {assignedCountersCount} of {camp.counters.length} operators active
                    </span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-200 flex flex-col gap-2">
                  <Link
                    href={`/camps/${camp.id}`}
                    className="w-full inline-flex items-center justify-center px-3 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm group"
                  >
                    <span>Enter Camp & View All Info</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    {user?.role === "SUPER_ADMIN" ? (
                      <Link
                        href={`/registration?campId=${camp.id}`}
                        className="text-slate-600 hover:text-slate-900 font-medium"
                      >
                        + Register Worker
                      </Link>
                    ) : (
                      <span className="text-slate-500 font-medium">
                        {camp.company.codePrefix} Workplace
                      </span>
                    )}
                    <a
                      href={`/api/reports/camps/${camp.id}/final-excel`}
                      download
                      className="text-slate-600 hover:text-slate-900 font-medium flex items-center"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Export Excel
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE NEW CAMP MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded border border-slate-300 shadow-xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Create New Health Camp</h3>
                <p className="text-xs text-slate-500">
                  Set up a new occupational health check-up camp for an enterprise client
                </p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!showAddCompany ? (
              <form onSubmit={handleCreateCamp} className="space-y-3">
                {/* Select Company */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Client Company</label>
                    <button
                      type="button"
                      onClick={() => setShowAddCompany(true)}
                      className="text-[11px] font-semibold text-slate-900 hover:underline inline-flex items-center"
                    >
                      <Plus className="w-3 h-3 mr-0.5" />
                      Add New Company
                    </button>
                  </div>
                  <select
                    required
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="w-full py-2 px-3 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:border-slate-500"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.codePrefix})
                      </option>
                    ))}
                  </select>

                  {/* Display HR Login info for selected company */}
                  {(() => {
                    const selected = companies.find((c) => c.id === selectedCompanyId);
                    if (!selected?.registeredEmail) return null;
                    return (
                      <div className="mt-1.5 p-2 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-800">HR Contact Email:</span>{" "}
                          <span className="font-mono text-slate-900">{selected.registeredEmail}</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">Active Company</span>
                      </div>
                    );
                  })()}
                </div>

                {/* Camp Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Camp Title / Name
                  </label>
                  <input
                    type="text"
                    required
                    value={campName}
                    onChange={(e) => setCampName(e.target.value)}
                    placeholder="e.g. Annual Occupational Health Check-Up 2026"
                    className="w-full p-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-500"
                  />
                </div>

                {/* Venue / Location */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plant / Venue Location
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Building 4, OHC First Floor, Pune Facility"
                    className="w-full p-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-500"
                  />
                </div>

                {/* Start & End Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-500"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">Automatic Station Provisioning</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    This camp will automatically be configured with the standard 9 counters (Registration, Vitals/Vision, Blood Lab, ECG, PFT, Audiometry, X-Ray, Doctor Exam, Back Office). You can customize and assign operators inside the camp.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingCamp}
                    className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 disabled:opacity-50"
                  >
                    {creatingCamp ? "Creating Camp..." : "Create Camp & Enter"}
                  </button>
                </div>
              </form>
            ) : (
              /* Inline Form to add new client company */
              <form onSubmit={handleCreateCompanyInline} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">New Client Company Details</h4>
                  <button
                    type="button"
                    onClick={() => setShowAddCompany(false)}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    &larr; Back to Camp
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Company Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      placeholder="e.g. Bharat Petroleum Corp"
                      className="w-full p-2 text-xs border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Code Prefix
                    </label>
                    <input
                      type="text"
                      required
                      value={newCompanyPrefix}
                      onChange={(e) => setNewCompanyPrefix(e.target.value.toUpperCase())}
                      placeholder="BPCL"
                      className="w-full p-2 text-xs border border-slate-300 rounded font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Official Email
                  </label>
                  <input
                    type="email"
                    required
                    value={newCompanyEmail}
                    onChange={(e) => setNewCompanyEmail(e.target.value)}
                    placeholder="hr@bpcl.in"
                    className="w-full p-2 text-xs border border-slate-300 rounded"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      HR / Coordinator Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newCompanyHrName}
                      onChange={(e) => setNewCompanyHrName(e.target.value)}
                      placeholder="Mr. Suresh Rao"
                      className="w-full p-2 text-xs border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      HR Mobile Number
                    </label>
                    <input
                      type="text"
                      required
                      value={newCompanyHrMobile}
                      onChange={(e) => setNewCompanyHrMobile(e.target.value)}
                      placeholder="+91 98000 11122"
                      className="w-full p-2 text-xs border border-slate-300 rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Plant Address
                  </label>
                  <input
                    type="text"
                    value={newCompanyAddress}
                    onChange={(e) => setNewCompanyAddress(e.target.value)}
                    placeholder="Refinery Complex, Mahul, Chembur, Mumbai"
                    className="w-full p-2 text-xs border border-slate-300 rounded"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCompany(false)}
                    className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingCompany}
                    className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 disabled:opacity-50"
                  >
                    {creatingCompany ? "Adding Company..." : "Save Company"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
