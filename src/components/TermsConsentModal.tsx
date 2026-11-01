"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, Lock, CheckCircle2, FileText, ExternalLink } from "lucide-react";
import Link from "next/link";

export function TermsConsentModal() {
  const { user, refresh } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If user is not logged in or has already accepted terms, do not render
  if (!user || user.termsAcceptedAt) {
    return null;
  }

  const handleAccept = async () => {
    if (!agreed) {
      setError("You must acknowledge and accept the statutory declaration to proceed.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/accept-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: "2026.1", agreed: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit acceptance.");
      }

      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center flex-shrink-0 border border-red-500/30">
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Statutory Medical Confidentiality & Non-Disclosure Undertaking
              </h2>
              <p className="text-[11px] text-slate-300">
                Mandatory Medicolegal Declaration under DPDP Act 2023 & Medical Ethics Regulations
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            v2026.1
          </span>
        </div>

        {/* Scrollable Legal Clauses */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 text-xs text-slate-700 leading-relaxed">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-start space-x-2.5">
            <Lock className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
            <div className="text-[11px]">
              <strong className="font-bold">Medicolegal Notice to All Operators & Medical Officers:</strong>{" "}
              All employee demographic, clinical vitals, serological (HIV, HBsAg), diagnostic, and contact records are privileged statutory health records. Unauthorized access, copying, screen photography, or external disclosure triggers criminal liability and immediate dismissal.
            </div>
          </div>

          <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-xs flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              1. Non-Disclosure of Sensitive Serological & Clinical Records
            </h3>
            <p className="text-[11px] text-slate-600 pl-5">
              I agree that serological investigations, including Human Immunodeficiency Virus (HIV), Hepatitis B Surface Antigen (HBsAg), and other infectious screenings, are protected under the HIV and AIDS (Prevention and Control) Act, 2017. Under no circumstances will any diagnostic findings be communicated or divulged to unauthorized persons.
            </p>
          </div>

          <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-xs flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              2. Protection of Employee Mobile Numbers & Identity
            </h3>
            <p className="text-[11px] text-slate-600 pl-5">
              Employee telephone numbers, addresses, and photos must be handled solely for direct occupational health camp logistics. Harvesting, exporting, or saving employee phone numbers to personal devices is strictly prohibited.
            </p>
          </div>

          <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-xs flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              3. Prohibition on Photography & External Data Transfer
            </h3>
            <p className="text-[11px] text-slate-600 pl-5">
              I undertake not to take screenshots, phone photographs of workstation screens, or transfer any data outside this secure portal. Every action within this software is forensically audited with timestamp and IP address.
            </p>
          </div>

          <div className="flex items-center space-x-4 pt-1 text-[11px] text-slate-500">
            <Link
              href="/terms"
              target="_blank"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold underline"
            >
              <FileText className="w-3 h-3 mr-1" />
              Read Full Terms & Conditions
              <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
            </Link>
            <span>&bull;</span>
            <Link
              href="/privacy"
              target="_blank"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold underline"
            >
              <FileText className="w-3 h-3 mr-1" />
              Read Privacy Policy
              <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
            </Link>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-700 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          <label className="flex items-start space-x-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-800 leading-tight">
              I, <span className="font-bold text-blue-900">{user.name}</span> ({user.role}), solemnly affirm that I have read, understood, and will strictly abide by the Statutory Non-Disclosure and Medical Confidentiality Covenants.
            </span>
          </label>

          <button
            type="button"
            disabled={!agreed || loading}
            onClick={handleAccept}
            className="w-full h-12 flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs sm:text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <span>Recording Legal Undertaking...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Accept Terms & Proceed to Workstation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
