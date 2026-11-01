"use client";

import React, { useState, useEffect } from "react";
import {
  BellRing,
  Mail,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Edit2,
  RefreshCw,
  Search,
} from "lucide-react";

interface NotificationItem {
  id: string;
  channel: string;
  recipient: string;
  messageText: string;
  status: string;
  attempts: number;
  lastAttempt?: string | null;
  errorLog?: string | null;
  createdAt: string;
  employee: {
    healthId: string;
    fullName: string;
    company: { name: string };
  };
}

interface EmailItem {
  id: string;
  reportType: string;
  recipientEmail: string;
  subject: string;
  status: string;
  attempts: number;
  createdAt: string;
  company: { name: string };
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedPhone, setEditedPhone] = useState("");
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchOutbox = () => {
    setLoading(true);
    fetch("/api/notifications/queue")
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data.notifications || []);
        setEmails(data.emails || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOutbox();
  }, []);

  const handleRetry = async (id: string, updatedRecipient?: string) => {
    setRetryingId(id);
    setFeedback(null);
    try {
      const res = await fetch("/api/notifications/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updatedRecipient }),
      });

      if (res.ok) {
        setFeedback("Notification re-queued and dispatched to provider!");
        setEditingId(null);
        fetchOutbox();
      }
    } catch {
      setFeedback("Error retrying notification.");
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <BellRing className="w-4 h-4" />
              <span>Offline Outbox & External Integrations</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Notification Queue & Delivery Log</h1>
            <p className="text-xs text-slate-400 mt-1">
              Persistent queue for employee SMS/WhatsApp completion notices and automated company report emails.
            </p>
          </div>

          <button
            onClick={fetchOutbox}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1 transition self-start"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Outbox</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs font-semibold rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Outbox Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="text-slate-400 text-xs font-medium">Total Messages Queued / Sent</div>
          <div className="text-2xl font-bold text-white mt-2">{notifications.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">SMS & WhatsApp Alerts</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="text-slate-400 text-xs font-medium">Company Report Emails</div>
          <div className="text-2xl font-bold text-cyan-400 mt-2">{emails.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Daily & Consolidated Summaries</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="text-slate-400 text-xs font-medium">Active Provider Mode</div>
          <div className="text-xl font-bold text-emerald-400 mt-2">Local Simulated Mode</div>
          <div className="text-[11px] text-slate-500 mt-1">Zero cloud dependencies required</div>
        </div>
      </div>

      {/* SMS & WhatsApp Messages Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
        <div className="p-5 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm">Employee SMS & WhatsApp Outbox</h3>
          <p className="text-xs text-slate-400">Completion messages dispatched upon passing mandatory counters</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-3">Channel</th>
                <th className="px-6 py-3">Health ID & Name</th>
                <th className="px-6 py-3">Recipient Mobile</th>
                <th className="px-6 py-3">Message Content</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {notifications.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 font-bold text-cyan-400">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{item.channel}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono font-bold text-cyan-400">{item.employee.healthId}</div>
                    <div className="text-white font-medium">{item.employee.fullName}</div>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === item.id ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="text"
                          value={editedPhone}
                          onChange={(e) => setEditedPhone(e.target.value)}
                          className="px-2 py-1 bg-slate-950 border border-cyan-500 rounded text-xs text-white w-32"
                        />
                        <button
                          onClick={() => handleRetry(item.id, editedPhone)}
                          className="px-2 py-1 bg-cyan-600 text-white rounded text-[11px]"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono">{item.recipient}</span>
                        <button
                          onClick={() => {
                            setEditingId(item.id);
                            setEditedPhone(item.recipient);
                          }}
                          className="text-slate-500 hover:text-cyan-400"
                          title="Audit-logged phone correction"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 max-w-sm truncate text-slate-400" title={item.messageText}>
                    {item.messageText}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        item.status === "SENT"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : item.status === "FAILED"
                          ? "bg-rose-950 text-rose-400 border border-rose-800"
                          : "bg-amber-950 text-amber-400 border border-amber-800"
                      }`}
                    >
                      {item.status} ({item.attempts}x)
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleRetry(item.id)}
                      disabled={retryingId === item.id}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-medium flex items-center gap-1 ml-auto transition"
                    >
                      <RotateCcw className="w-3 h-3 text-cyan-400" />
                      <span>Resend</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
