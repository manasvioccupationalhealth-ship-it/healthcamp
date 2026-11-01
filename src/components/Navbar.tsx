"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useOffline } from "@/context/OfflineContext";
import {
  Activity,
  UserPlus,
  Stethoscope,
  FileSpreadsheet,
  CheckCircle2,
  BellRing,
  RefreshCw,
  LogOut,
  Tent,
  FileText,
  UserCheck,
  Menu,
  X,
  ChevronDown,
  ExternalLink,
} from "lucide-react";

interface CampSummary {
  id: string;
  campId: string;
  name: string;
  company: { name: string; codePrefix: string };
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, login } = useAuth();
  const { isOnline, pendingCount, isSyncing, triggerSync } = useOffline();
  const [camps, setCamps] = useState<CampSummary[]>([]);
  const [selectedCampId, setSelectedCampId] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetch("/api/camps")
        .then((res) => res.json())
        .then((data) => {
          if (data.camps && data.camps.length > 0) {
            setCamps(data.camps);
            const saved = localStorage.getItem("active_camp_id");
            if (saved && data.camps.some((c: CampSummary) => c.id === saved)) {
              setSelectedCampId(saved);
            } else {
              setSelectedCampId(data.camps[0].id);
              localStorage.setItem("active_camp_id", data.camps[0].id);
            }
          } else {
            setCamps([]);
            setSelectedCampId("");
          }
        })
        .catch(() => {});
    } else {
      setCamps([]);
      setSelectedCampId("");
    }
  }, [user]);

  const handleCampChange = (id: string) => {
    setSelectedCampId(id);
    localStorage.setItem("active_camp_id", id);
    window.dispatchEvent(new CustomEvent("campChanged", { detail: id }));
    if (pathname.startsWith("/camps/")) {
      router.push(`/camps/${id}`);
    }
  };

  const navLinks = [
    { label: user?.role === "COMPANY_HR" ? "Company Camps" : "All Camps", href: "/", icon: Activity, roles: ["SUPER_ADMIN", "COMPANY_HR"] },
    { label: "Registration Desk", href: "/registration", icon: UserPlus, roles: ["SUPER_ADMIN", "REGISTRATION_DESK"] },
    {
      label:
        user?.role === "DOCTOR_ASSISTANT"
          ? "Counter 2 (Vitals & Vision)"
          : user?.role === "REGISTRATION_DESK"
          ? "Counter 1 (Registration)"
          : user?.role === "COUNTER_STAFF"
          ? "My Station"
          : "Counters",
      href: "/counter",
      icon: Stethoscope,
      roles: ["SUPER_ADMIN", "COUNTER_STAFF", "DOCTOR_ASSISTANT", "REGISTRATION_DESK"],
    },
    { label: "Doctor Exam", href: "/doctor/examination", icon: Stethoscope, roles: ["SUPER_ADMIN", "DOCTOR"] },
    { label: "Master Review", href: "/doctor/master-review", icon: FileSpreadsheet, roles: ["SUPER_ADMIN", "DOCTOR"] },
    { label: "Back Office", href: "/backoffice", icon: CheckCircle2, roles: ["SUPER_ADMIN", "BACK_OFFICE"] },
    { label: "Reports", href: "/reports", icon: FileText, roles: ["SUPER_ADMIN", "BACK_OFFICE", "COMPANY_HR"] },
    { label: "Notifications", href: "/notifications", icon: BellRing, roles: ["SUPER_ADMIN", "BACK_OFFICE"] },
    { label: "Admin", href: "/admin", icon: Tent, roles: ["SUPER_ADMIN"] },
  ];

  const filteredLinks = user
    ? navLinks.filter((link) => user.role === "SUPER_ADMIN" || link.roles.includes(user.role))
    : [];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand & Camp Selector */}
          <div className="flex items-center space-x-3">
            <Link
              href={
                user?.role === "DOCTOR_ASSISTANT" ||
                user?.role === "COUNTER_STAFF" ||
                user?.role === "REGISTRATION_DESK"
                  ? "/counter"
                  : user?.role === "DOCTOR"
                  ? "/doctor/master-review"
                  : "/"
              }
              className="flex items-center space-x-2 text-slate-900 font-bold text-base tracking-tight"
            >
              <span className="w-6 h-6 bg-slate-900 text-white rounded flex items-center justify-center text-xs font-black">
                H
              </span>
              <span>HealthCamp</span>
            </Link>

            {/* Camp Selector */}
            {user && camps.length > 0 && (
              <div className="hidden md:flex items-center bg-slate-100 px-2.5 py-1 rounded border border-slate-200 text-xs">
                <span className="text-slate-400 mr-1.5 font-medium">Camp:</span>
                <select
                  value={selectedCampId}
                  onChange={(e) => handleCampChange(e.target.value)}
                  className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer max-w-[200px] truncate"
                >
                  {camps.map((camp) => (
                    <option key={camp.id} value={camp.id}>
                      {camp.company.codePrefix} — {camp.name}
                    </option>
                  ))}
                </select>
                {selectedCampId && user.role === "SUPER_ADMIN" && (
                  <Link
                    href={`/camps/${selectedCampId}`}
                    className="ml-1.5 text-slate-400 hover:text-slate-800"
                    title="View Camp Details & Counters"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center space-x-1">
            {filteredLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2.5 py-1.5 rounded text-xs transition ${
                    isActive
                      ? "bg-slate-900 text-white font-medium"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Status & User */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Status Indicator */}
            <div className="flex items-center space-x-1.5 bg-slate-100 border border-slate-200 px-2 py-1 rounded text-xs text-slate-700">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                }`}
              />
              <span className="hidden sm:inline font-medium">
                {isOnline ? "Online" : `Offline (${pendingCount})`}
              </span>

              {pendingCount > 0 && (
                <button
                  onClick={triggerSync}
                  disabled={isSyncing}
                  className="ml-1 text-[11px] underline text-slate-900 font-semibold disabled:opacity-50"
                >
                  {isSyncing ? "Syncing..." : "Sync"}
                </button>
              )}
            </div>

            {/* User Session & Role Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                  className="flex items-center space-x-1.5 text-xs bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1 rounded transition text-slate-800"
                >
                  <span className="font-semibold">{user.name.split(" ")[0]}</span>
                  <span className="text-slate-400">({user.role})</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {roleMenuOpen && (
                  <div className="absolute right-0 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-xs">
                    <div className="px-3 py-1.5 border-b border-slate-100">
                      <p className="font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">
                        {user.role}
                      </span>
                    </div>

                    {user.companyName && (
                      <div className="px-3 py-1.5 border-b border-slate-100 bg-slate-50/50">
                        <p className="text-[10px] text-slate-500">Assigned Company</p>
                        <p className="font-semibold text-slate-800 truncate">{user.companyName}</p>
                      </div>
                    )}

                    <div className="py-1">
                      <Link
                        href="/terms"
                        onClick={() => setRoleMenuOpen(false)}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                      >
                        <span>Terms & Medical NDA</span>
                        <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">Active</span>
                      </Link>
                      <Link
                        href="/privacy"
                        onClick={() => setRoleMenuOpen(false)}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 block"
                      >
                        Privacy & Data Security
                      </Link>
                    </div>
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={async () => {
                          await logout();
                          setRoleMenuOpen(false);
                          router.push("/login");
                        }}
                        className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3 py-1 rounded transition"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Menu Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-slate-200 py-2 space-y-1">
            {camps.length > 0 && (
              <div className="px-2 py-1.5 mb-2 bg-slate-50 rounded border border-slate-200">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Active Camp:</label>
                <select
                  value={selectedCampId}
                  onChange={(e) => handleCampChange(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-900 font-medium focus:outline-none"
                >
                  {camps.map((camp) => (
                    <option key={camp.id} value={camp.id}>
                      {camp.company.codePrefix} — {camp.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-1">
              {filteredLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded text-xs transition ${
                      isActive
                        ? "bg-slate-900 text-white font-medium"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
