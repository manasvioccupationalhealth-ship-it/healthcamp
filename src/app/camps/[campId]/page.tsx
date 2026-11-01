"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  Building2,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Stethoscope,
  UserPlus,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  Plus,
  UserCheck,
  Download,
  Search,
  ExternalLink,
  ChevronRight,
  Filter,
  RefreshCw,
  X,
  CreditCard,
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
  displayOrder: number;
  isMandatory: boolean;
  allowsUpload: boolean;
  allowsForm: boolean;
  assignments: CounterAssignment[];
  _count?: { visits: number };
}

interface Employee {
  id: string;
  healthId: string;
  employeeCode: string;
  fullName: string;
  sex: string;
  age: number;
  department: string;
  designation: string;
  employeeType: string;
  contractorName: string | null;
  status: string;
  bmi: number;
  bmiCategory: string;
  heightCm: number;
  weightKg: number;
  createdAt: string;
  fitnessDecision?: {
    fitnessStatus: string;
    doctorRemarks?: string | null;
    restrictions?: string | null;
  } | null;
  vitalsVision?: {
    systolicBp: number;
    diastolicBp: number;
    pulse?: number | null;
  } | null;
  counterVisits: {
    id: string;
    status: string;
    campCounter: {
      code: string;
      counterNo: number;
    };
  }[];
}

interface CampDetails {
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
    registeredEmail: string;
    hrContactName: string;
    hrMobile: string;
  };
  counters: CampCounter[];
  employees: Employee[];
}

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

function CampDetailContent({ params }: { params: Promise<{ campId: string }> }) {
  const resolvedParams = use(params);
  const campId = resolvedParams.campId;
  const router = useRouter();
  const { user } = useAuth();

  const [camp, setCamp] = useState<CampDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Counter operators are locked to /counter only
  useEffect(() => {
    if (!user) return;
    if (
      user.role === "DOCTOR_ASSISTANT" ||
      user.role === "COUNTER_STAFF" ||
      user.role === "REGISTRATION_DESK"
    ) {
      router.replace("/counter");
    }
  }, [user, router]);

  // Staff list for operator assignments
  const [staffList, setStaffList] = useState<StaffUser[]>([]);

  // Search & filter for employees
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fitnessFilter, setFitnessFilter] = useState("ALL");

  // Modal: Assign Operator
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedCounter, setSelectedCounter] = useState<CampCounter | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [assignLoading, setAssignLoading] = useState(false);

  // Quick New Operator form inside assignment modal
  const [showNewStaffForm, setShowNewStaffForm] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("COUNTER_STAFF");
  const [newStaffMobile, setNewStaffMobile] = useState("");
  const [newStaffPassword, setNewStaffPassword] = useState("");
  const [createStaffLoading, setCreateStaffLoading] = useState(false);

  // Modal: Add Custom Counter
  const [addCounterModalOpen, setAddCounterModalOpen] = useState(false);
  const [customCounterNo, setCustomCounterNo] = useState("10");
  const [counterName, setCounterName] = useState("");
  const [counterCode, setCounterCode] = useState("");
  const [counterType, setCounterType] = useState("CUSTOM");
  const [counterMandatory, setCounterMandatory] = useState(true);
  const [counterUpload, setCounterUpload] = useState(true);
  const [addCounterLoading, setAddCounterLoading] = useState(false);

  // Modal: Edit Counter (Super Admin)
  const [editCounterModalOpen, setEditCounterModalOpen] = useState(false);
  const [editingCounter, setEditingCounter] = useState<CampCounter | null>(null);
  const [editCounterNo, setEditCounterNo] = useState("");
  const [editCounterName, setEditCounterName] = useState("");
  const [editCounterCode, setEditCounterCode] = useState("");
  const [editCounterType, setEditCounterType] = useState("CUSTOM");
  const [editCounterMandatory, setEditCounterMandatory] = useState(true);
  const [editCounterUpload, setEditCounterUpload] = useState(true);
  const [editCounterLoading, setEditCounterLoading] = useState(false);

  const fetchCampDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/camps/${campId}`);
      if (!res.ok) throw new Error("Failed to load camp details");
      const data = await res.json();
      setCamp(data.camp);

      // Default next counter number
      if (data.camp?.counters) {
        setCustomCounterNo(String(data.camp.counters.length + 1));
      }

      // Save as active camp in localStorage
      localStorage.setItem("active_camp_id", data.camp.id);
      window.dispatchEvent(new CustomEvent("campChanged", { detail: data.camp.id }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching camp");
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/admin/staff");
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.staff || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCampDetails();
    fetchStaff();
  }, [campId]);

  const handleOpenAssignModal = (counter: CampCounter) => {
    setSelectedCounter(counter);
    setSelectedUserId(counter.assignments?.[0]?.userId || "");
    setShowNewStaffForm(false);
    setAssignModalOpen(true);
  };

  const handleOpenEditCounter = (c: CampCounter) => {
    setEditingCounter(c);
    setEditCounterNo(String(c.counterNo));
    setEditCounterName(c.name);
    setEditCounterCode(c.code);
    setEditCounterType(c.counterType);
    setEditCounterMandatory(c.isMandatory);
    setEditCounterUpload(c.allowsUpload);
    setEditCounterModalOpen(true);
  };

  const handleAssignOperator = async () => {
    if (!selectedCounter) return;
    try {
      setAssignLoading(true);
      const res = await fetch(
        `/api/camps/${campId}/counters/${selectedCounter.id}/assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: selectedUserId || "none" }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to assign operator");
      }
      setAssignModalOpen(false);
      await fetchCampDetails();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Assignment failed");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleCreateStaffInline = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreateStaffLoading(true);
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStaffName,
          email: newStaffEmail,
          role: newStaffRole,
          mobile: newStaffMobile,
          password: newStaffPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create staff account");

      await fetchStaff();
      setSelectedUserId(data.user.id);
      setShowNewStaffForm(false);
      setNewStaffName("");
      setNewStaffEmail("");
      setNewStaffMobile("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setCreateStaffLoading(false);
    }
  };

  const handleAddCustomCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAddCounterLoading(true);
      const res = await fetch(`/api/camps/${campId}/counters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counterNo: customCounterNo,
          name: counterName,
          code: counterCode,
          counterType,
          isMandatory: counterMandatory,
          allowsUpload: counterUpload,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add counter");
      }
      setAddCounterModalOpen(false);
      setCounterName("");
      setCounterCode("");
      await fetchCampDetails();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error adding counter");
    } finally {
      setAddCounterLoading(false);
    }
  };

  const handleUpdateCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCounter) return;
    try {
      setEditCounterLoading(true);
      const res = await fetch(`/api/camps/${campId}/counters/${editingCounter.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counterNo: editCounterNo,
          name: editCounterName,
          code: editCounterCode,
          counterType: editCounterType,
          isMandatory: editCounterMandatory,
          allowsUpload: editCounterUpload,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update counter");
      }
      setEditCounterModalOpen(false);
      await fetchCampDetails();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error updating counter");
    } finally {
      setEditCounterLoading(false);
    }
  };

  const handleDeleteCounter = async () => {
    if (!editingCounter) return;
    if (!confirm(`Are you sure you want to delete Counter #${editingCounter.counterNo} (${editingCounter.name})?`)) return;
    try {
      setEditCounterLoading(true);
      const res = await fetch(`/api/camps/${campId}/counters/${editingCounter.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete counter");
      }
      setEditCounterModalOpen(false);
      await fetchCampDetails();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting counter");
    } finally {
      setEditCounterLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-900 border-t-transparent" />
        <p className="mt-3 text-sm text-slate-500 font-medium">Loading camp information...</p>
      </div>
    );
  }

  if (error || !camp) {
    return (
      <div className="py-16 text-center">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Camp Not Found</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">{error || "Unable to retrieve details for this camp."}</p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 border border-slate-300 rounded text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Camps Directory
        </Link>
      </div>
    );
  }

  // Filtered employees
  const filteredEmployees = camp.employees.filter((emp) => {
    const matchesSearch =
      searchTerm === "" ||
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.healthId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || emp.status === statusFilter;
    const matchesFitness =
      fitnessFilter === "ALL" ||
      (emp.fitnessDecision && emp.fitnessDecision.fitnessStatus === fitnessFilter);

    return matchesSearch && matchesStatus && matchesFitness;
  });

  // KPI calculations
  const totalEmployees = camp.employees.length;
  const finalizedCount = camp.employees.filter((e) => e.status === "FINALIZED").length;
  const pendingDocCount = camp.employees.filter((e) =>
    ["PENDING_DOCTOR", "PENDING_VERIFICATION"].includes(e.status)
  ).length;
  const inProgressCount = camp.employees.filter((e) => e.status === "IN_PROGRESS").length;
  const registeredCount = camp.employees.filter((e) => e.status === "REGISTERED").length;

  const fitCount = camp.employees.filter(
    (e) => e.fitnessDecision?.fitnessStatus === "FIT"
  ).length;
  const fitAdviceCount = camp.employees.filter(
    (e) => e.fitnessDecision?.fitnessStatus === "FIT_WITH_RESTRICTION"
  ).length;
  const unfitCount = camp.employees.filter(
    (e) => e.fitnessDecision?.fitnessStatus === "UNFIT"
  ).length;

  const completionRate =
    totalEmployees > 0 ? Math.round((finalizedCount / totalEmployees) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <Link
            href="/"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 mb-2 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1 group-hover:-translate-x-0.5 transition-transform" />
            Back to All Camps
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {camp.name}
            </h1>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-mono font-bold rounded border border-slate-200">
              {camp.campId}
            </span>
            <span
              className={`px-2 py-0.5 text-xs font-semibold rounded border ${
                camp.operatingStatus === "ACTIVE"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              {camp.operatingStatus}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs text-slate-600">
            <span className="flex items-center font-medium">
              <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
              {camp.company.name} ({camp.company.codePrefix})
            </span>
            <span className="flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
              {camp.location}
            </span>
            <span className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
              {new Date(camp.startDate).toLocaleDateString()} &ndash;{" "}
              {new Date(camp.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Camp Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/reports/camps/${camp.id}/daily-excel`}
            download
            className="inline-flex items-center px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm"
            title="Download Daily 8:00 PM Summary Excel"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            8:00 PM Daily Excel
          </a>
          <a
            href={`/api/reports/camps/${camp.id}/final-excel`}
            download
            className="inline-flex items-center px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm"
            title="Download Final Consolidated Attendance & Fitness Register"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Final Register Excel
          </a>
          {user?.role === "SUPER_ADMIN" && (
            <Link
              href={`/registration?campId=${camp.id}`}
              className="inline-flex items-center px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              Register Worker
            </Link>
          )}
        </div>
      </div>

      {/* Camp KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Total Registered</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{totalEmployees}</p>
          <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-slate-900 h-1 rounded-full" style={{ width: "100%" }} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">In Progress</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{inProgressCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">In station queues</p>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Pending Doctor</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{pendingDocCount}</p>
          <p className="text-[11px] text-amber-700 font-medium mt-1">Awaiting exam/sheet</p>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Fitness Certified</p>
          <p className="text-xl font-bold text-emerald-700 mt-0.5">{finalizedCount}</p>
          <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-1 rounded-full"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Fit / Advice / Unfit</p>
          <p className="text-base font-bold text-slate-900 mt-1">
            <span className="text-emerald-700">{fitCount}</span> /{" "}
            <span className="text-amber-700">{fitAdviceCount}</span> /{" "}
            <span className="text-rose-700">{unfitCount}</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Clinical outcomes</p>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">Counters & Staff</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{camp.counters.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Active test stations</p>
        </div>
      </div>

      {/* Camp Station Workspaces Launchpad (Super Admin only) */}
      {user?.role === "SUPER_ADMIN" && (
        <>
        <div className="bg-white rounded border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Station Launchpad for this Camp</h2>
            <p className="text-xs text-slate-500">
              Direct access to operating workstations pre-filtered for {camp.name}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href={`/registration?campId=${camp.id}`}
            className="p-3 border border-slate-200 rounded hover:border-slate-400 hover:bg-slate-50 transition-colors flex flex-col items-start group"
          >
            <UserPlus className="w-4 h-4 text-slate-700 mb-2" />
            <span className="text-xs font-bold text-slate-900 group-hover:text-slate-950">
              1. Registration
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">Enrollment & Photo</span>
          </Link>

          <Link
            href={`/assistant?campId=${camp.id}`}
            className="p-3 border border-slate-200 rounded hover:border-slate-400 hover:bg-slate-50 transition-colors flex flex-col items-start group"
          >
            <UserCheck className="w-4 h-4 text-slate-700 mb-2" />
            <span className="text-xs font-bold text-slate-900 group-hover:text-slate-950">
              2. Doctor Assistant
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">BP, Pulse & Vision</span>
          </Link>

          <Link
            href={`/counter?campId=${camp.id}`}
            className="p-3 border border-slate-200 rounded hover:border-slate-400 hover:bg-slate-50 transition-colors flex flex-col items-start group"
          >
            <Stethoscope className="w-4 h-4 text-slate-700 mb-2" />
            <span className="text-xs font-bold text-slate-900 group-hover:text-slate-950">
              3. Diagnostic Counters
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">ECG, PFT, Audio, X-Ray</span>
          </Link>

          <Link
            href={`/doctor/examination?campId=${camp.id}`}
            className="p-3 border border-slate-200 rounded hover:border-slate-400 hover:bg-slate-50 transition-colors flex flex-col items-start group"
          >
            <Stethoscope className="w-4 h-4 text-slate-700 mb-2" />
            <span className="text-xs font-bold text-slate-900 group-hover:text-slate-950">
              4. Doctor Exam
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">Clinical Examination</span>
          </Link>

          <Link
            href={`/doctor/master-review?campId=${camp.id}`}
            className="p-3 border border-slate-200 rounded hover:border-slate-400 hover:bg-slate-50 transition-colors flex flex-col items-start group"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-700 mb-2" />
            <span className="text-xs font-bold text-slate-900 group-hover:text-slate-950">
              5. Master Review
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">Fitness & Bulk Signoff</span>
          </Link>

          <Link
            href={`/backoffice?campId=${camp.id}`}
            className="p-3 border border-slate-200 rounded hover:border-slate-400 hover:bg-slate-50 transition-colors flex flex-col items-start group"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-700 mb-2" />
            <span className="text-xs font-bold text-slate-900 group-hover:text-slate-950">
              6. Back Office
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5">Verification & Dossiers</span>
          </Link>
        </div>
      </div>

      {/* Camp Counters & Operator Assignment Management */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center">
              <span>Camp Counters & Staff Operator Logins</span>
              <span className="ml-2 px-2 py-0.5 bg-slate-200 text-slate-800 text-xs rounded-full font-bold">
                {camp.counters.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Each counter operates with its dedicated operator login. Assign staff or configure new counter stations.
            </p>
          </div>
          {user?.role === "SUPER_ADMIN" && (
            <button
              onClick={() => {
                setCustomCounterNo(String(camp.counters.length + 1));
                setAddCounterModalOpen(true);
              }}
              className="inline-flex items-center px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Custom Counter
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-2.5 px-3 w-16">Counter</th>
                <th className="py-2.5 px-3">Counter Name & Station</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Rules</th>
                <th className="py-2.5 px-3">Assigned Operator Login</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {camp.counters.map((c) => {
                const assigned = c.assignments?.[0]?.user;
                return (
                  <tr key={c.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      #{c.counterNo}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-900">{c.name}</span>
                        <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 font-mono text-[10px] rounded border border-slate-200">
                          {c.code}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[11px] text-slate-600 font-medium">
                        {c.counterType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center space-x-1.5 text-[11px]">
                        {c.isMandatory ? (
                          <span className="text-emerald-700 font-medium">Mandatory</span>
                        ) : (
                          <span className="text-slate-400">Optional</span>
                        )}
                        {c.allowsUpload && (
                          <span className="px-1 py-0.2 bg-blue-50 text-blue-700 text-[10px] rounded border border-blue-200 font-medium">
                            Uploads
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      {assigned ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                            {assigned.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 leading-tight">
                              {assigned.name}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {assigned.email} ({assigned.role})
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center text-xs text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {user?.role === "SUPER_ADMIN" ? (
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenEditCounter(c)}
                            className="px-2 py-1 border border-slate-300 rounded text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-colors"
                            title="Edit counter number, test name or code"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleOpenAssignModal(c)}
                            className="inline-flex items-center px-2.5 py-1 border border-slate-300 rounded text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                          >
                            {assigned ? "Change Operator" : "Assign Operator"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {assigned ? assigned.name : "Unassigned"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Camp Employee Roster */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center">
              <span>Camp Employee Roster</span>
              <span className="ml-2 px-2 py-0.5 bg-slate-200 text-slate-800 text-xs rounded-full font-bold">
                {filteredEmployees.length} of {camp.employees.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Workers registered for occupational health check-up in this camp
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search worker name, ID..."
                className="pl-8 pr-3 py-1 text-xs border border-slate-300 rounded w-48 sm:w-56 focus:outline-none focus:border-slate-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1 px-2 text-xs border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:border-slate-500"
            >
              <option value="ALL">All Stages</option>
              <option value="REGISTERED">Registered</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING_DOCTOR">Pending Doctor</option>
              <option value="FINALIZED">Finalized</option>
            </select>

            <select
              value={fitnessFilter}
              onChange={(e) => setFitnessFilter(e.target.value)}
              className="py-1 px-2 text-xs border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:border-slate-500"
            >
              <option value="ALL">All Fitness</option>
              <option value="FIT">Fit</option>
              <option value="FIT_WITH_RESTRICTION">Fit with Advice</option>
              <option value="UNFIT">Unfit</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Health ID</th>
                <th className="py-2.5 px-3">Worker Details</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">BMI / Vitals</th>
                <th className="py-2.5 px-3">Stage</th>
                <th className="py-2.5 px-3">Fitness Outcome</th>
                <th className="py-2.5 px-3 text-right">Reports</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-500">
                    No employees found matching the filters.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {emp.healthId}
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="font-semibold text-slate-900">{emp.fullName}</p>
                      <p className="text-[11px] text-slate-500">
                        {emp.employeeCode} &bull; {emp.sex}, {emp.age}y &bull;{" "}
                        <span className="capitalize">{emp.employeeType.replace("_", " ")}</span>
                        {emp.contractorName ? ` (${emp.contractorName})` : ""}
                      </p>
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="text-slate-900 font-medium">{emp.department}</p>
                      <p className="text-[11px] text-slate-500">{emp.designation}</p>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-slate-900">{emp.bmi}</span>
                        <span
                          className={`px-1.5 py-0.2 text-[10px] font-bold rounded ${
                            emp.bmiCategory === "Normal"
                              ? "bg-emerald-50 text-emerald-700"
                              : emp.bmiCategory === "Overweight"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {emp.bmiCategory}
                        </span>
                      </div>
                      {emp.vitalsVision && (
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          BP: {emp.vitalsVision.systolicBp}/{emp.vitalsVision.diastolicBp} mmHg
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                          emp.status === "FINALIZED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : emp.status === "PENDING_DOCTOR"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : emp.status === "IN_PROGRESS"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {emp.fitnessDecision ? (
                        <span
                          className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                            emp.fitnessDecision.fitnessStatus === "FIT"
                              ? "bg-emerald-100 text-emerald-800"
                              : emp.fitnessDecision.fitnessStatus === "FIT_WITH_RESTRICTION"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {emp.fitnessDecision.fitnessStatus}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Pending Exam</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {(user?.role === "DOCTOR" || user?.role === "SUPER_ADMIN") && (
                          <Link
                            href={`/doctor/examination?campId=${camp.id}&employeeId=${emp.id}`}
                            className="px-2 py-1 bg-slate-900 text-white rounded text-[11px] font-semibold hover:bg-slate-800 transition-colors"
                          >
                            Examine
                          </Link>
                        )}
                        <a
                          href={`/api/reports/${emp.healthId}/medical-examination-form`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-blue-950 text-blue-200 border border-blue-800 rounded text-[11px] font-bold hover:bg-blue-900 transition-colors"
                          title="Official 2-Page Medical Examination Report Form"
                        >
                          2-Page Form
                        </a>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const r = await fetch(`/api/reports/${emp.healthId}/email`, { method: "POST" });
                              const d = await r.json();
                              alert(d.message || "Medical Examination Report Form sent via email!");
                            } catch {
                              alert("Failed to dispatch email.");
                            }
                          }}
                          className="px-2 py-1 bg-white border border-slate-300 rounded text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                          title="Email 2-Page Medical Examination Report Form to Worker"
                        >
                          Email
                        </button>
                        <a
                          href={`/api/reports/${emp.healthId}/healthcard-pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 border border-slate-300 rounded text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                          title="Health Card PDF"
                        >
                          Card
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Assign Operator to Counter */}
      {assignModalOpen && selectedCounter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded border border-slate-300 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Assign Counter Operator
                </h3>
                <p className="text-xs text-slate-500">
                  Counter #{selectedCounter.counterNo} &bull; {selectedCounter.name} ({selectedCounter.code})
                </p>
              </div>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!showNewStaffForm ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Staff Operator Login
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full py-2 px-3 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:border-slate-500"
                  >
                    <option value="none">-- Unassigned (No Operator) --</option>
                    {staffList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.email}) &mdash; {st.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowNewStaffForm(true)}
                    className="text-xs font-semibold text-slate-900 hover:underline inline-flex items-center"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Create New Operator Account
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setAssignModalOpen(false)}
                    className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={assignLoading}
                    onClick={handleAssignOperator}
                    className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 disabled:opacity-50"
                  >
                    {assignLoading ? "Saving..." : "Save Assignment"}
                  </button>
                </div>
              </div>
            ) : (
              /* Inline form to create new operator account */
              <form onSubmit={handleCreateStaffInline} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">
                    New Operator Account Details
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowNewStaffForm(false)}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    &larr; Back to list
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Operator Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="e.g. Ramesh Nair (Lab Tech)"
                    className="w-full p-2 text-xs border border-slate-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Login Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="staff@domain.com"
                    className="w-full p-2 text-xs border border-slate-300 rounded"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Role
                    </label>
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value)}
                      className="w-full p-2 text-xs border border-slate-300 rounded bg-white"
                    >
                      <option value="COUNTER_STAFF">Counter Staff</option>
                      <option value="DOCTOR_ASSISTANT">Doctor Assistant</option>
                      <option value="REGISTRATION_DESK">Registration Desk</option>
                      <option value="DOCTOR">Doctor</option>
                      <option value="BACK_OFFICE">Back Office</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Set Initial Password
                    </label>
                    <input
                      type="password"
                      required
                      value={newStaffPassword}
                      onChange={(e) => setNewStaffPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full p-2 text-xs border border-slate-300 rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Mobile Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={newStaffMobile}
                    onChange={(e) => setNewStaffMobile(e.target.value)}
                    placeholder="+91 98000 00000"
                    className="w-full p-2 text-xs border border-slate-300 rounded"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowNewStaffForm(false)}
                    className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createStaffLoading}
                    className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 disabled:opacity-50"
                  >
                    {createStaffLoading ? "Creating..." : "Create Account & Select"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Add Custom Counter */}
      {addCounterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded border border-slate-300 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Add Custom Camp Counter</h3>
                <p className="text-xs text-slate-500">Configure a new diagnostic or specialty station for {camp.name}</p>
              </div>
              <button
                onClick={() => setAddCounterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomCounter} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Counter #
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={customCounterNo}
                    onChange={(e) => setCustomCounterNo(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded font-mono font-bold focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Counter Name
                  </label>
                  <input
                    type="text"
                    required
                    value={counterName}
                    onChange={(e) => setCounterName(e.target.value)}
                    placeholder="e.g. Dental Examination"
                    className="w-full p-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Station Code
                  </label>
                  <input
                    type="text"
                    required
                    value={counterCode}
                    onChange={(e) => setCounterCode(e.target.value)}
                    placeholder="e.g. DENTAL"
                    className="w-full p-2 text-xs border border-slate-300 rounded font-mono uppercase focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Station Type
                  </label>
                  <select
                    value={counterType}
                    onChange={(e) => setCounterType(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:border-slate-500"
                  >
                    <option value="CUSTOM">Custom Diagnostic</option>
                    <option value="ECG">ECG Station</option>
                    <option value="PFT">PFT / Spirometry</option>
                    <option value="AUDIOMETRY">Audiometry Booth</option>
                    <option value="CHEST_XRAY">X-Ray Van</option>
                    <option value="BLOOD_COLLECTION">Blood / Phlebotomy</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={counterMandatory}
                    onChange={(e) => setCounterMandatory(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-0"
                  />
                  <span>Mandatory for all workers in this camp</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={counterUpload}
                    onChange={(e) => setCounterUpload(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-0"
                  />
                  <span>Allows file / report attachment upload (PDF, PNG, JPG)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddCounterModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addCounterLoading}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 disabled:opacity-50"
                >
                  {addCounterLoading ? "Adding..." : "Add Station"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Counter Station (Super Admin) */}
      {editCounterModalOpen && editingCounter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded border border-slate-300 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Edit Counter #{editingCounter.counterNo}
                </h3>
                <p className="text-xs text-slate-500">
                  Update counter number, station name, code, or test rules
                </p>
              </div>
              <button
                onClick={() => setEditCounterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCounter} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Counter #
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editCounterNo}
                    onChange={(e) => setEditCounterNo(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded font-mono font-bold focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Station Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editCounterName}
                    onChange={(e) => setEditCounterName(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Station Code
                  </label>
                  <input
                    type="text"
                    required
                    value={editCounterCode}
                    onChange={(e) => setEditCounterCode(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded font-mono uppercase focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Station Type
                  </label>
                  <select
                    value={editCounterType}
                    onChange={(e) => setEditCounterType(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:border-slate-500"
                  >
                    <option value="REGISTRATION">Registration</option>
                    <option value="VITALS_VISION">Vitals & Vision</option>
                    <option value="BLOOD_COLLECTION">Blood Collection</option>
                    <option value="ECG">ECG Station</option>
                    <option value="PFT">PFT / Spirometry</option>
                    <option value="AUDIOMETRY">Audiometry Booth</option>
                    <option value="CHEST_XRAY">X-Ray Van</option>
                    <option value="DOCTOR_EXAMINATION">Doctor Exam</option>
                    <option value="BACK_OFFICE">Back Office</option>
                    <option value="CUSTOM">Custom Diagnostic</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editCounterMandatory}
                    onChange={(e) => setEditCounterMandatory(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-0"
                  />
                  <span>Mandatory for all workers in this camp</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editCounterUpload}
                    onChange={(e) => setEditCounterUpload(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-0"
                  />
                  <span>Allows file / report attachment upload</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleDeleteCounter}
                  className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded border border-rose-200 font-semibold transition"
                >
                  Delete Counter
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditCounterModalOpen(false)}
                    className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editCounterLoading}
                    className="px-4 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 disabled:opacity-50"
                  >
                    {editCounterLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CampDetailPage({
  params,
}: {
  params: Promise<{ campId: string }>;
}) {
  return (
    <React.Suspense
      fallback={
        <div className="py-24 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-900 border-t-transparent" />
          <p className="mt-3 text-xs text-slate-500 font-medium">Loading camp details...</p>
        </div>
      }
    >
      <CampDetailContent params={params} />
    </React.Suspense>
  );
}

