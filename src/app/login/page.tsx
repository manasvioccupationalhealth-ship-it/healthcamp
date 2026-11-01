"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldCheck,
  Stethoscope,
  Lock,
  Mail,
  ArrowRight,
  Building2,
  FileSpreadsheet,
  Layers,
  CheckCircle2,
  Activity,
  HeartPulse,
  Wind,
  Volume2,
  Eye,
  UserCheck,
} from "lucide-react";

interface CampSummary {
  id: string;
  campId: string;
  name: string;
  operatingStatus: string;
  company: {
    name: string;
    codePrefix: string;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  // Mode: "COUNTER" for Counter Station Operators, "CORE" for Super Admin, Doctor, HR
  const [loginMode, setLoginMode] = useState<"COUNTER" | "CORE">("COUNTER");

  // Active Camps
  const [camps, setCamps] = useState<CampSummary[]>([]);
  const [selectedCampId, setSelectedCampId] = useState<string>("");

  // Form state
  const [email, setEmail] = useState("assistant@healthcamp.local");
  const [password, setPassword] = useState("Password@123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch active camps on mount
  useEffect(() => {
    fetch("/api/camps")
      .then((res) => res.json())
      .then((data) => {
        if (data.camps && data.camps.length > 0) {
          const activeOnly = data.camps.filter(
            (c: CampSummary) => c.operatingStatus === "ACTIVE"
          );
          const list = activeOnly.length > 0 ? activeOnly : data.camps;
          setCamps(list);
          const savedCamp = localStorage.getItem("active_camp_id");
          const matched = list.find((c: CampSummary) => c.id === savedCamp) || list[0];
          setSelectedCampId(matched.id);
        }
      })
      .catch(() => {});
  }, []);

  const handleCampChange = (id: string) => {
    setSelectedCampId(id);
    localStorage.setItem("active_camp_id", id);
  };

  const handleOperatorLaunch = async (
    opEmail: string,
    opPass: string,
    counterNo: number
  ) => {
    setError(null);
    setLoading(true);
    try {
      if (selectedCampId) {
        localStorage.setItem("active_camp_id", selectedCampId);
      }
      localStorage.setItem("target_counter_no", String(counterNo));

      const result = await login(opEmail, opPass);
      if (result.success) {
        router.push("/counter");
      } else {
        setError(result.error || "Authentication failed for this counter operator.");
      }
    } catch {
      setError("Unable to connect to local server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (selectedCampId) {
        localStorage.setItem("active_camp_id", selectedCampId);
      }
      const result = await login(email, password);
      if (result.success) {
        const userRole = result.user?.role;
        if (
          userRole === "COUNTER_STAFF" ||
          userRole === "DOCTOR_ASSISTANT" ||
          userRole === "REGISTRATION_DESK"
        ) {
          router.push("/counter");
        } else if (userRole === "DOCTOR") {
          router.push("/doctor/master-review");
        } else if (userRole === "BACK_OFFICE") {
          router.push("/backoffice");
        } else {
          router.push("/");
        }
      } else {
        setError(result.error || "Authentication failed. Check your email or password.");
      }
    } catch {
      setError("Unable to connect to local server.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = async (accEmail: string, accPass: string) => {
    setEmail(accEmail);
    setPassword(accPass);
    setError(null);
    setLoading(true);
    try {
      if (selectedCampId) {
        localStorage.setItem("active_camp_id", selectedCampId);
      }
      const result = await login(accEmail, accPass);
      if (result.success) {
        const userRole = result.user?.role;
        if (
          userRole === "COUNTER_STAFF" ||
          userRole === "DOCTOR_ASSISTANT" ||
          userRole === "REGISTRATION_DESK"
        ) {
          router.push("/counter");
        } else if (userRole === "DOCTOR") {
          router.push("/doctor/master-review");
        } else if (userRole === "BACK_OFFICE") {
          router.push("/backoffice");
        } else {
          router.push("/");
        }
      } else {
        setError(result.error || "Login failed");
      }
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const counterStations = [
    {
      no: 1,
      name: "Registration Desk",
      code: "REG",
      email: "registration@healthcamp.local",
      role: "REGISTRATION_DESK",
      icon: UserCheck,
      desc: "Worker check-in, demographics & photo",
    },
    {
      no: 2,
      name: "Doctor Assistant (BP & Vision)",
      code: "VITALS",
      email: "assistant@healthcamp.local",
      role: "DOCTOR_ASSISTANT",
      icon: Eye,
      desc: "Blood pressure, pulse, distant & near vision",
    },
    {
      no: 3,
      name: "Blood Collection & Lab",
      code: "BLOOD",
      email: "lab@healthcamp.local",
      role: "COUNTER_STAFF",
      icon: Activity,
      desc: "Fasting blood sugar, Hb & lipid collection",
    },
    {
      no: 4,
      name: "Resting 12-Lead ECG",
      code: "ECG",
      email: "ecg@healthcamp.local",
      role: "COUNTER_STAFF",
      icon: HeartPulse,
      desc: "Electrocardiogram recording & tracing",
    },
    {
      no: 5,
      name: "Pulmonary Function Test (PFT)",
      code: "PFT",
      email: "pft@healthcamp.local",
      role: "COUNTER_STAFF",
      icon: Wind,
      desc: "Spirometry, FVC, FEV1 lung assessment",
    },
    {
      no: 6,
      name: "Pure Tone Audiometry",
      code: "AUDIO",
      email: "audio@healthcamp.local",
      role: "COUNTER_STAFF",
      icon: Volume2,
      desc: "Acoustic decibel thresholds & hearing test",
    },
    {
      no: 7,
      name: "Digital Chest X-Ray",
      code: "XRAY",
      email: "xray@healthcamp.local",
      role: "COUNTER_STAFF",
      icon: Layers,
      desc: "Mobile radiography van lung imaging",
    },
  ];

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-5 bg-white border border-slate-200 p-5 sm:p-7 rounded-lg shadow-sm">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-9 h-9 bg-slate-900 text-white font-bold rounded mb-2 text-sm">
            H
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Occupational Health Surveillance Workstation
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Sign in to your counter station, doctor examination room, or corporate portal
          </p>
        </div>

        {/* Top Mode Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setLoginMode("COUNTER");
              setEmail("assistant@healthcamp.local");
              setPassword("Password@123");
              setError(null);
            }}
            className={`py-2 px-3 rounded-md transition flex items-center justify-center space-x-1.5 ${
              loginMode === "COUNTER"
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Counter Operator Workstation</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginMode("CORE");
              setEmail("admin@healthcamp.local");
              setPassword("Admin@1234");
              setError(null);
            }}
            className={`py-2 px-3 rounded-md transition flex items-center justify-center space-x-1.5 ${
              loginMode === "CORE"
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin, Doctor & HR Login</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded text-center font-medium">
            {error}
          </div>
        )}

        {/* TAB 1: COUNTER OPERATOR WORKSTATION */}
        {loginMode === "COUNTER" && (
          <div className="space-y-4">
            {/* Step 1: Select Active Campaign */}
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center">
                  <Building2 className="w-3.5 h-3.5 mr-1 text-slate-600" />
                  Step 1: Select Active Camp Campaign
                </label>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  {camps.length} Active Camps
                </span>
              </div>
              <select
                value={selectedCampId}
                onChange={(e) => handleCampChange(e.target.value)}
                className="w-full p-2 text-xs border border-slate-300 rounded bg-white text-slate-900 font-semibold focus:outline-none focus:border-slate-500"
              >
                {camps.map((camp) => (
                  <option key={camp.id} value={camp.id}>
                    {camp.company.codePrefix} &bull; {camp.name} ({camp.campId})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Station Selection Grid (1-Click Launch) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 flex items-center">
                  <Layers className="w-3.5 h-3.5 mr-1 text-slate-600" />
                  Step 2: Choose Your Counter Station & Sign In
                </label>
                <span className="text-[11px] text-slate-500">Click station to launch</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {counterStations.map((station) => {
                  const Icon = station.icon;
                  return (
                    <button
                      key={station.no}
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        handleOperatorLaunch(station.email, "Password@123", station.no)
                      }
                      className="p-2.5 border border-slate-200 rounded hover:border-slate-400 hover:bg-slate-50 text-left transition flex items-start space-x-2.5 group"
                    >
                      <div className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                        #{station.no}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 group-hover:text-blue-900 truncate">
                            {station.name}
                          </span>
                          <span className="font-mono text-[9px] px-1 bg-slate-100 text-slate-600 rounded border border-slate-200">
                            {station.code}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {station.desc}
                        </p>
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                          {station.email}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Operator Email Login Form */}
            <div className="pt-3 border-t border-slate-200">
              <p className="text-[11px] font-semibold text-slate-600 mb-2">
                Or Sign In with Assigned Custom Operator Credentials:
              </p>
              <form onSubmit={handleSubmit} className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="operator@healthcamp.local"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition flex items-center justify-center space-x-1"
                >
                  <span>Launch Workstation for {email}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: SUPER ADMIN, DOCTOR & COMPANY HR */}
        {loginMode === "CORE" && (
          <div className="space-y-4">
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@healthcamp.local or company HR email"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition disabled:opacity-50"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Quick 1-Click Cards */}
            <div className="pt-3 border-t border-slate-200 space-y-2.5">
              <p className="text-xs font-bold text-slate-900">
                1-Click Quick Access Logins:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill("admin@healthcamp.local", "Admin@1234")}
                  className="p-2 border border-slate-200 rounded hover:bg-slate-50 text-left transition"
                >
                  <div className="font-semibold text-slate-900 text-xs flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-slate-700" />
                    Super Admin
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Camps & Counters Setup
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill("doctor@healthcamp.local", "Password@123")}
                  className="p-2 border border-slate-200 rounded hover:bg-slate-50 text-left transition"
                >
                  <div className="font-semibold text-slate-900 text-xs flex items-center">
                    <Stethoscope className="w-3.5 h-3.5 mr-1 text-slate-700" />
                    Doctor (MD)
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Exams & Master Review
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleQuickFill("backoffice@healthcamp.local", "Password@123")
                  }
                  className="p-2 border border-slate-200 rounded hover:bg-slate-50 text-left transition"
                >
                  <div className="font-semibold text-slate-900 text-xs flex items-center">
                    <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-slate-700" />
                    Back Office
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Verification & Dossiers
                  </div>
                </button>
              </div>

              {/* Company HR Logins */}
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Client Company HR Logins:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickFill(
                        "occupational.health@tataadvanced.com",
                        "Password@123"
                      )
                    }
                    className="p-2 border border-slate-200 rounded hover:bg-slate-50 text-left transition"
                  >
                    <div className="font-semibold text-slate-900 text-xs flex items-center">
                      <Building2 className="w-3.5 h-3.5 mr-1 text-slate-700" />
                      Tata Advanced Systems HR
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate font-mono">
                      occupational.health@tataadvanced.com
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleQuickFill(
                        "health.safety@relianceinfra.com",
                        "Password@123"
                      )
                    }
                    className="p-2 border border-slate-200 rounded hover:bg-slate-50 text-left transition"
                  >
                    <div className="font-semibold text-slate-900 text-xs flex items-center">
                      <Building2 className="w-3.5 h-3.5 mr-1 text-slate-700" />
                      Reliance Infrastructure HR
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate font-mono">
                      health.safety@relianceinfra.com
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
