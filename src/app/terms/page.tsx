import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Statutory Terms & Conditions & Non-Disclosure Undertaking | HealthCamp",
  description: "Statutory medical confidentiality, terms of service, and non-disclosure covenants for occupational health surveillance.",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Workstation
        </Link>
      </div>

      {/* Header */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-800 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-sky-400">
          <ShieldCheck className="w-4 h-4 text-sky-400" />
          <span>Statutory Medicolegal Agreement & Undertaking</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Terms of Service, Medical Confidentiality & Non-Disclosure Agreement
        </h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Governing all Authorized Medical Officers, Clinical Staff, Counter Operators, Back Office Personnel, and Company HR Representatives.
        </p>
        <div className="pt-2 flex items-center space-x-4 text-[11px] text-slate-400 font-mono">
          <span>Version: 2026.1</span>
          <span>&bull;</span>
          <span>Effective Date: 1 November 2026</span>
          <span>&bull;</span>
          <span>Jurisdiction: Republic of India</span>
        </div>
      </div>

      {/* Medicolegal Preamble */}
      <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg text-amber-900 text-xs sm:text-sm leading-relaxed space-y-2">
        <div className="font-bold flex items-center">
          <AlertTriangle className="w-4 h-4 text-amber-600 mr-1.5 flex-shrink-0" />
          CRITICAL STATUTORY NOTICE UNDER INDIAN LAW:
        </div>
        <p className="text-xs text-amber-800">
          Occupational Health Records managed within this portal comprise Sensitive Personal Data or Information (SPDI) under the <strong>Information Technology Act, 2000</strong>, the <strong>Digital Personal Data Protection Act, 2023</strong>, and privileged patient health information under the <strong>Indian Medical Council (Professional Conduct, Etiquette and Ethics) Regulations, 2002</strong>. Any unauthorized disclosure, theft, screenshot, camera capture, or external leakage of worker records—especially serological tests such as <strong>HIV</strong> and <strong>Hepatitis B (HBsAg)</strong>—entails immediate criminal liability, civil damages, and revocation of medical practice credentials.
        </p>
      </div>

      {/* Clause Sections */}
      <div className="space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center">
            <Lock className="w-4 h-4 mr-2 text-blue-600" />
            1. Duty of Strict Medical Confidentiality
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            Every user accessing this software—including Medical Examiners, Doctors, Nurses, Medical Technicians, Registration Operators, and Data Verifiers—agrees that all employee clinical information (vitals, audiometry decibel readings, pulmonary function curves, electrocardiograms, chest X-rays, blood chemistry, and doctor clinical findings) is held in utmost sacred trust.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
            <li>No data shall be disclosed to any co-worker, contractor, or third party without lawful medical warrant.</li>
            <li>Information may solely be utilized for assessing occupational physical fitness and preventive ergonomics under Factory Act guidelines.</li>
          </ul>
        </section>

        <section className="space-y-2 pt-4 border-t border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center">
            <ShieldCheck className="w-4 h-4 mr-2 text-emerald-600" />
            2. Special Protection for Serology & Communicable Disease Tests (HIV, HBsAg)
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            Pursuant to the <strong>HIV and AIDS (Prevention and Control) Act, 2017</strong>:
          </p>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1.5">
            <div className="font-semibold text-slate-900">Mandatory Serology Handling Protocol:</div>
            <p>
              (a) Results of HIV antibody screens, Hepatitis B (HBsAg), Hepatitis C (HCV), and VDRL/Syphilis screenings are accessible exclusively by the certified Examining Medical Officer (Doctor MD) and designated Back Office verifiers.
            </p>
            <p>
              (b) Counter operators and general technicians are strictly prohibited from inspecting, noting down, or querying worker serological status.
            </p>
            <p>
              (c) In accordance with statutory law, a positive screening test must never be used to cause workplace discrimination or stigma against the employee.
            </p>
          </div>
        </section>

        <section className="space-y-2 pt-4 border-t border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center">
            <FileText className="w-4 h-4 mr-2 text-indigo-600" />
            3. Protection of Worker Mobile Numbers & Demographics
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            Employee mobile numbers, identification marks, dates of birth, and home addresses are protected personal identifiers.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
            <li>Mobile numbers are masked within general screens to prevent contact harvesting.</li>
            <li>Staff are strictly forbidden from contacting workers for any purpose outside official health surveillance emergency follow-up.</li>
            <li>Exporting worker contact books to personal SIMs, phones, or external cloud storage is a punishable offense.</li>
          </ul>
        </section>

        <section className="space-y-2 pt-4 border-t border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-rose-600" />
            4. Absolute Prohibition on Screen Capture, Photography & External Transfer
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            To prevent medicolegal exposure and data exfiltration:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-lg">
              <strong className="text-rose-900 block mb-1">No Mobile Photography:</strong>
              Operating staff must never aim mobile phone cameras at workstation or tablet displays to photograph worker test results.
            </div>
            <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-lg">
              <strong className="text-rose-900 block mb-1">No External Flash Drives:</strong>
              Data synchronization occurs solely via authenticated, encrypted server protocols. Plugging unauthorized storage devices is prohibited.
            </div>
          </div>
        </section>

        <section className="space-y-2 pt-4 border-t border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center">
            <Lock className="w-4 h-4 mr-2 text-slate-700" />
            5. Forensic Audit Logging & Criminal Liability
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            All user operations within this platform—including record queries, test entries, report downloads, overrides, and timestamps—are recorded in an immutable forensic <code>AuditLog</code> with IP address and hardware fingerprint. Evidence gathered from this audit log is admissible in legal disciplinary proceedings.
          </p>
        </section>

        <section className="space-y-2 pt-4 border-t border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-blue-600" />
            6. Proprietary Software & Intellectual Property Notice
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            The algorithms, custom digital Form 2 formatting, counter synchronization pipeline, and diagnostic automation workflows implemented in this system are proprietary. Unauthorized reverse-engineering, decompilation, or duplication of software architecture is strictly forbidden.
          </p>
        </section>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
        <div>&copy; 2026 Manasvi Occupational Health Services. All Rights Reserved.</div>
        <div className="space-x-4">
          <Link href="/privacy" className="text-blue-600 hover:underline font-semibold">
            Privacy Policy
          </Link>
          <Link href="/login" className="text-slate-700 hover:underline font-semibold">
            Workstation Login
          </Link>
        </div>
      </div>
    </div>
  );
}
