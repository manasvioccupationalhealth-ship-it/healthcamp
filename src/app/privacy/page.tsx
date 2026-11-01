import React from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Lock, Database, EyeOff, Server, FileCheck } from "lucide-react";

export const metadata = {
  title: "Medical Data Privacy & Security Policy | HealthCamp",
  description: "Statutory medical data protection, encryption, and confidentiality policy for occupational health records.",
};

export default function PrivacyPage() {
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
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Statutory Health Data Protection Standard</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Medical Data Privacy & Information Security Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Compliant with Indian Digital Personal Data Protection (DPDP) Act 2023, IT Act Section 43A, and National Medical Commission Ethics Regulations.
        </p>
        <div className="pt-2 flex items-center space-x-4 text-[11px] text-slate-400 font-mono">
          <span>Security Classification: CONFIDENTIAL & MEDICAL PRIVILEGED</span>
        </div>
      </div>

      {/* Main content */}
      <div className="space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center">
            <Database className="w-4 h-4 mr-2 text-blue-600" />
            1. Nature of Protected Health Information (PHI)
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            This platform processes employee data exclusively for statutory annual and pre-employment health checks under the Factories Act, 1948 and corporate Occupational Health & Safety mandates. Data categories comprise:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
            <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
              <strong className="text-slate-900">Demographic Identifiers:</strong> Name, Employee ID, DOB, Age, Gender, Department, Designation, and Contact Phone.
            </div>
            <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
              <strong className="text-slate-900">Clinical Measurements:</strong> Blood pressure, Pulse, Height, Weight, BMI, Distant & Near Vision, Color Vision.
            </div>
            <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
              <strong className="text-slate-900">Diagnostic Tracings:</strong> Resting ECG rhythms, Audiometry decibel curves, Pulmonary Function Spirometry (FVC/FEV1), Digital Chest X-Rays.
            </div>
            <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
              <strong className="text-slate-900">Pathology & Serology:</strong> Blood sugar (Random/Fasting/PP), Complete Blood Count (CBC), Lipid profile, Renal/Liver function, HIV, HBsAg.
            </div>
          </div>
        </section>

        <section className="space-y-2 pt-4 border-t border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center">
            <EyeOff className="w-4 h-4 mr-2 text-indigo-600" />
            2. Purpose Limitation & Data Masking
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            In strict compliance with the principle of data minimization:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
            <li>Worker contact numbers are automatically masked on operational workstation screens (showing only first 2 and last 2 digits, e.g. <code>98******12</code>) to prevent unauthorized extraction.</li>
            <li>Counter staff cannot access medical assessments outside their immediate station workflow (e.g. ECG operator cannot inspect HIV results or Audiometry records).</li>
            <li>Doctor evaluations and final medical fitness determinations are strictly locked and digitally signed by registered medical practitioners.</li>
          </ul>
        </section>

        <section className="space-y-2 pt-4 border-t border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center">
            <Server className="w-4 h-4 mr-2 text-emerald-600" />
            3. Data Residency & Encryption in Transit and at Rest
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            All database clusters and storage instances reside within certified Indian sovereign data zones. All network traffic between client tablets and servers is protected with TLS 1.3 encryption (HTTPS). Session identifiers are encapsulated inside HTTP-only, SameSite Secure tokens with strict expiration.
          </p>
        </section>

        <section className="space-y-2 pt-4 border-t border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center">
            <Lock className="w-4 h-4 mr-2 text-slate-700" />
            4. Role-Based Access Control (RBAC) Matrix
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            Access privileges are strictly governed by formal role designations:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border border-slate-200 rounded">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2 text-left">Role</th>
                  <th className="p-2 text-left">Permitted Data Scope</th>
                  <th className="p-2 text-left">Serology (HIV/HBsAg)</th>
                  <th className="p-2 text-left">Full Phone No.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr>
                  <td className="p-2 font-bold text-slate-900">Registration Desk</td>
                  <td className="p-2">Worker Demographics & Identification</td>
                  <td className="p-2 text-rose-600 font-bold">No Access</td>
                  <td className="p-2 text-emerald-600 font-bold">Masked in Queue</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-slate-900">Counter Staff (ECG/PFT/Audio)</td>
                  <td className="p-2">Station Test Input & Calibration Tracings</td>
                  <td className="p-2 text-rose-600 font-bold">No Access</td>
                  <td className="p-2 text-slate-400">Hidden</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-slate-900">Examining Doctor (MD)</td>
                  <td className="p-2">Full Clinical Dossier & Master Review</td>
                  <td className="p-2 text-emerald-600 font-bold">Authorized (Clinical)</td>
                  <td className="p-2 text-emerald-600 font-bold">Authorized</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-slate-900">Back Office Quality Verifier</td>
                  <td className="p-2">Diagnostic Data Audit & PDF Generation</td>
                  <td className="p-2 text-amber-700 font-bold">Verification Only</td>
                  <td className="p-2 text-slate-400">Masked</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-slate-900">Client Company HR</td>
                  <td className="p-2">Fitness Summary & Aggregated Camp Reports</td>
                  <td className="p-2 text-rose-600 font-bold">No Individual Access</td>
                  <td className="p-2 text-slate-400">Masked</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-2 pt-4 border-t border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center">
            <FileCheck className="w-4 h-4 mr-2 text-blue-600" />
            5. Incident Reporting & Grievance Officer
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            In case of suspected data exposure, breach attempt, or unauthorized credential sharing, report immediately to the designated Information Security Officer at <code>compliance@manasvihealth.com</code>. All reports trigger forensic review of the <code>AuditLog</code>.
          </p>
        </section>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
        <div>&copy; 2026 Manasvi Occupational Health Services. All Rights Reserved.</div>
        <div className="space-x-4">
          <Link href="/terms" className="text-blue-600 hover:underline font-semibold">
            Terms & Conditions
          </Link>
          <Link href="/login" className="text-slate-700 hover:underline font-semibold">
            Workstation Login
          </Link>
        </div>
      </div>
    </div>
  );
}
