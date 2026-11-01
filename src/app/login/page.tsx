"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  FileText,
} from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  // Mode: "LOGIN" or "REGISTER"
  const [mode, setMode] = useState<"LOGIN" | "REGISTER">("LOGIN");

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Register Fields
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const routeByRole = (role?: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        router.push("/");
        break;
      case "DOCTOR":
        router.push("/doctor/master-review");
        break;
      case "DOCTOR_ASSISTANT":
        router.push("/counter");
        break;
      case "REGISTRATION_DESK":
        router.push("/registration");
        break;
      case "COUNTER_STAFF":
        router.push("/counter");
        break;
      case "BACK_OFFICE":
        router.push("/backoffice");
        break;
      case "COMPANY_HR":
        router.push("/");
        break;
      default:
        router.push("/");
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError("Please enter your username/email and password.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "LOGIN") {
        const result = await login(cleanEmail, password);
        if (result.success) {
          routeByRole(result.user?.role);
        } else {
          setError(result.error || "Invalid username or password.");
        }
      } else {
        // Registration mode
        if (!name.trim()) {
          setError("Please provide your full name.");
          setLoading(false);
          return;
        }

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: cleanEmail,
            password,
            mobile: mobile.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Registration failed.");
        }

        // Auto login with created account
        const loginRes = await login(cleanEmail, password);
        if (loginRes.success) {
          routeByRole(loginRes.user?.role);
        } else {
          setMode("LOGIN");
          setError("Account created! Please sign in with your credentials.");
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication service error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-900 text-sky-400 font-bold rounded-xl shadow-sm border border-slate-800">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            HealthCamp Workstation
          </h1>
          <p className="text-xs text-slate-500">
            Occupational Health Surveillance & Medical Check-Up Portal
          </p>
        </div>

        {/* Tab Toggle: Sign In vs Register (Tablet-friendly 44px touch targets) */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode("LOGIN");
              setError(null);
            }}
            className={`h-11 rounded-lg transition flex items-center justify-center space-x-1.5 ${
              mode === "LOGIN"
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("REGISTER");
              setError(null);
            }}
            className={`h-11 rounded-lg transition flex items-center justify-center space-x-1.5 ${
              mode === "REGISTER"
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Register Account</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2 font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "REGISTER" && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. / Staff Full Name"
                    className="w-full pl-9 pr-3 h-12 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Mobile Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-9 pr-3 h-12 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Username or Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@domain.com"
                className="w-full pl-9 pr-3 h-12 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-11 h-12 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 p-0.5"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{mode === "LOGIN" ? "Sign In to Workstation" : "Create Account & Sign In"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security & Legal Footer */}
        <div className="pt-4 border-t border-slate-200 text-center space-y-2 text-xs text-slate-500">
          <div className="flex items-center justify-center space-x-1">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Encrypted Session &bull; Forensic Audit Active</span>
          </div>
          <div className="flex items-center justify-center space-x-3 text-[11px]">
            <Link href="/terms" className="text-blue-600 hover:underline font-semibold flex items-center">
              <FileText className="w-3 h-3 mr-0.5" />
              Statutory Terms & NDA
            </Link>
            <span>&bull;</span>
            <Link href="/privacy" className="text-blue-600 hover:underline font-semibold">
              Medical Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
