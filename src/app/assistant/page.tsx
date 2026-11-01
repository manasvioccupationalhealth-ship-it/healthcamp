"use client";

import React, { useState, useEffect } from "react";
import { useOffline } from "@/context/OfflineContext";
import { queueOfflineOperation } from "@/lib/offline-store";
import {
  Stethoscope,
  Activity,
  Eye,
  CheckCircle2,
  Search,
  User,
  ArrowRight,
} from "lucide-react";

interface EmployeeVisitItem {
  id: string;
  status: string;
  employee: {
    id: string;
    healthId: string;
    fullName: string;
    age: number;
    sex: string;
    department: string;
    employeeType: string;
    vitalsVision?: {
      systolicBp: number;
      diastolicBp: number;
      pulse?: number | null;
      distantVisionRight: string;
      distantVisionLeft: string;
      nearVisionRight: string;
      nearVisionLeft: string;
      withGlasses: boolean;
      colorVision: string;
      notes?: string | null;
    } | null;
  };
}

export default function DoctorAssistantPage() {
  const { isOnline, refreshPendingCount } = useOffline();

  const [counterId, setCounterId] = useState<string>("");
  const [waitingList, setWaitingList] = useState<EmployeeVisitItem[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<EmployeeVisitItem | null>(null);
  const [search, setSearch] = useState("");
  const [loadingQueue, setLoadingQueue] = useState(true);

  // Form Fields
  const [systolicBp, setSystolicBp] = useState<number>(120);
  const [diastolicBp, setDiastolicBp] = useState<number>(80);
  const [pulse, setPulse] = useState<number>(72);
  const [distantVisionRight, setDistantVisionRight] = useState("6/6");
  const [distantVisionLeft, setDistantVisionLeft] = useState("6/6");
  const [nearVisionRight, setNearVisionRight] = useState("N6");
  const [nearVisionLeft, setNearVisionLeft] = useState("N6");
  const [withGlasses, setWithGlasses] = useState(false);
  const [colorVision, setColorVision] = useState("Normal");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/camps")
      .then((res) => res.json())
      .then((data) => {
        if (data.camps && data.camps.length > 0) {
          const camp = data.camps[0];
          const vitalsCounter = camp.counters.find((c: { counterType: string }) => c.counterType === "VITALS_VISION");
          if (vitalsCounter) {
            setCounterId(vitalsCounter.id);
          }
        }
      })
      .catch(() => {});
  }, []);

  const fetchQueue = () => {
    if (!counterId) return;
    setLoadingQueue(true);
    fetch(`/api/counters/${counterId}/queue?search=${encodeURIComponent(search)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.waiting) {
          setWaitingList([...data.inProgress, ...data.waiting]);
          if (!selectedVisit && data.waiting.length > 0) {
            handleSelectEmployee(data.waiting[0]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingQueue(false));
  };

  useEffect(() => {
    fetchQueue();
  }, [counterId, search]);

  const handleSelectEmployee = (visit: EmployeeVisitItem) => {
    setSelectedVisit(visit);
    setSuccessMessage(null);

    if (visit.employee.vitalsVision) {
      const v = visit.employee.vitalsVision;
      setSystolicBp(v.systolicBp);
      setDiastolicBp(v.diastolicBp);
      setPulse(v.pulse || 72);
      setDistantVisionRight(v.distantVisionRight);
      setDistantVisionLeft(v.distantVisionLeft);
      setNearVisionRight(v.nearVisionRight);
      setNearVisionLeft(v.nearVisionLeft);
      setWithGlasses(v.withGlasses);
      setColorVision(v.colorVision);
      setNotes(v.notes || "");
    } else {
      setSystolicBp(120);
      setDiastolicBp(80);
      setPulse(72);
      setDistantVisionRight("6/6");
      setDistantVisionLeft("6/6");
      setNearVisionRight("N6");
      setNearVisionLeft("N6");
      setWithGlasses(false);
      setColorVision("Normal");
      setNotes("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit) return;
    setSubmitting(true);
    setSuccessMessage(null);

    const payload = {
      employeeId: selectedVisit.employee.id,
      healthId: selectedVisit.employee.healthId,
      campCounterId: counterId,
      systolicBp,
      diastolicBp,
      pulse,
      distantVisionRight,
      distantVisionLeft,
      nearVisionRight,
      nearVisionLeft,
      withGlasses,
      colorVision,
      notes,
    };

    try {
      if (!isOnline) {
        await queueOfflineOperation("VITALS", "UPDATE", payload);
        await refreshPendingCount();
        setSuccessMessage(`Saved for ${selectedVisit.employee.healthId} (Queued Offline).`);
      } else {
        const res = await fetch(`/api/counters/${counterId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          setSuccessMessage(`Saved vitals for ${selectedVisit.employee.fullName} (${selectedVisit.employee.healthId}).`);
          fetchQueue();
        }
      }
    } catch {
      setSuccessMessage("Error saving measurements.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-sm">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Counter 2 &bull; Assistant Tablet
        </div>
        <h1 className="text-xl font-bold text-slate-900 mt-1">Doctor Assistant &bull; BP & Vision</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Record blood pressure, pulse, and visual acuity before doctor examination.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Waiting Queue */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs">
            <h2 className="font-bold text-slate-700 uppercase">Queue ({waitingList.length})</h2>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Health ID or Name..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:border-slate-800"
            />
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {waitingList.map((item) => {
              const isSelected = selectedVisit?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectEmployee(item)}
                  className={`w-full text-left p-2.5 rounded transition my-0.5 flex items-start justify-between ${
                    isSelected ? "bg-slate-900 text-white" : "hover:bg-slate-50 text-slate-800"
                  }`}
                >
                  <div>
                    <div className="font-mono text-xs font-bold">{item.employee.healthId}</div>
                    <div className="text-xs font-medium">{item.employee.fullName}</div>
                    <div className={`text-[11px] ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                      {item.employee.age}y / {item.employee.sex.charAt(0)} &bull; {item.employee.department}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      isSelected
                        ? "bg-slate-800 text-slate-200"
                        : item.employee.vitalsVision
                        ? "bg-slate-100 text-slate-700 border border-slate-200"
                        : "text-slate-400"
                    }`}
                  >
                    {item.employee.vitalsVision ? "Done" : "Waiting"}
                  </span>
                </button>
              );
            })}

            {waitingList.length === 0 && !loadingQueue && (
              <div className="text-center py-6 text-xs text-slate-400">Queue is empty.</div>
            )}
          </div>
        </div>

        {/* Right 2 Columns: Tablet Touch Inputs */}
        <div className="lg:col-span-2 space-y-5">
          {selectedVisit ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-500">{selectedVisit.employee.healthId}</span>
                  <h2 className="text-base font-bold text-slate-900">{selectedVisit.employee.fullName}</h2>
                  <p className="text-xs text-slate-500">
                    Dept: {selectedVisit.employee.department} &bull; Age: {selectedVisit.employee.age}
                  </p>
                </div>
              </div>

              {successMessage && (
                <div className="p-3 bg-slate-100 border border-slate-300 text-slate-800 text-xs rounded-lg flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-700 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* BP & Pulse */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  1. Blood Pressure & Pulse
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Systolic */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-xs text-slate-500 font-medium">Systolic (mmHg)</div>
                    <div className="text-3xl font-mono font-bold text-slate-900 my-2">{systolicBp}</div>
                    <div className="flex justify-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setSystolicBp((v) => Math.max(70, v - 2))}
                        className="w-9 h-9 bg-white border border-slate-300 hover:bg-slate-100 font-bold rounded text-slate-800"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setSystolicBp((v) => Math.min(220, v + 2))}
                        className="w-9 h-9 bg-white border border-slate-300 hover:bg-slate-100 font-bold rounded text-slate-800"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Diastolic */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-xs text-slate-500 font-medium">Diastolic (mmHg)</div>
                    <div className="text-3xl font-mono font-bold text-slate-900 my-2">{diastolicBp}</div>
                    <div className="flex justify-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setDiastolicBp((v) => Math.max(40, v - 2))}
                        className="w-9 h-9 bg-white border border-slate-300 hover:bg-slate-100 font-bold rounded text-slate-800"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiastolicBp((v) => Math.min(140, v + 2))}
                        className="w-9 h-9 bg-white border border-slate-300 hover:bg-slate-100 font-bold rounded text-slate-800"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Pulse */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-xs text-slate-500 font-medium">Pulse (bpm)</div>
                    <div className="text-3xl font-mono font-bold text-slate-900 my-2">{pulse}</div>
                    <div className="flex justify-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setPulse((v) => Math.max(40, v - 2))}
                        className="w-9 h-9 bg-white border border-slate-300 hover:bg-slate-100 font-bold rounded text-slate-800"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setPulse((v) => Math.min(160, v + 2))}
                        className="w-9 h-9 bg-white border border-slate-300 hover:bg-slate-100 font-bold rounded text-slate-800"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vision */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  2. Visual Acuity & Color Vision
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Distant Vision (Snellen)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[11px] text-slate-500">Right Eye</span>
                        <select
                          value={distantVisionRight}
                          onChange={(e) => setDistantVisionRight(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold focus:outline-none"
                        >
                          {["6/6", "6/9", "6/12", "6/18", "6/24", "6/36", "6/60"].map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500">Left Eye</span>
                        <select
                          value={distantVisionLeft}
                          onChange={(e) => setDistantVisionLeft(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold focus:outline-none"
                        >
                          {["6/6", "6/9", "6/12", "6/18", "6/24", "6/36", "6/60"].map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Near Vision</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[11px] text-slate-500">Right Eye</span>
                        <select
                          value={nearVisionRight}
                          onChange={(e) => setNearVisionRight(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold focus:outline-none"
                        >
                          {["N6", "N8", "N10", "N12"].map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500">Left Eye</span>
                        <select
                          value={nearVisionLeft}
                          onChange={(e) => setNearVisionLeft(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold focus:outline-none"
                        >
                          {["N6", "N8", "N10", "N12"].map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <label className="flex items-center space-x-2 p-2.5 bg-slate-50 border border-slate-200 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={withGlasses}
                      onChange={(e) => setWithGlasses(e.target.checked)}
                      className="w-4 h-4 rounded text-slate-900 border-slate-300"
                    />
                    <span className="text-xs text-slate-700">Tested With Spectacles</span>
                  </label>

                  <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-xs text-slate-700">Color Vision:</span>
                    <div className="flex space-x-1">
                      <button
                        type="button"
                        onClick={() => setColorVision("Normal")}
                        className={`px-2.5 py-1 rounded text-xs font-semibold ${
                          colorVision === "Normal"
                            ? "bg-slate-900 text-white"
                            : "bg-white text-slate-700 border border-slate-300"
                        }`}
                      >
                        Normal
                      </button>
                      <button
                        type="button"
                        onClick={() => setColorVision("Color Blind")}
                        className={`px-2.5 py-1 rounded text-xs font-semibold ${
                          colorVision === "Color Blind"
                            ? "bg-slate-900 text-white"
                            : "bg-white text-slate-700 border border-slate-300"
                        }`}
                      >
                        Color Blind
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes & Submit */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
                <label className="block text-xs font-semibold text-slate-700">Observations / Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Regular pulse, recommended refractive checkup"
                  rows={2}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded text-xs transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  {submitting ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <span>Save & Advance to Doctor</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-400">
              <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-sm">Select an Employee from the Queue</h3>
              <p className="text-xs text-slate-500 mt-0.5">Click an employee on the left to record measurements.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
