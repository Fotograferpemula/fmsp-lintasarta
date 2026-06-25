"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Shield,
  Zap,
  Eye,
} from "lucide-react";

interface WoItem {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  status: string;
  reportedBy: string;
  assignedTo: string | null;
  createdAt: string;
  slaDeadline: string | null;
  estimatedCost: number | null;
  actualCost: number | null;
  approvalLevel: number;
  approvedL1By: string | null;
  approvedL1At: string | null;
  approvedL2By: string | null;
  approvedL2At: string | null;
  rejectedBy: string | null;
  rejectedReason: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  escalationLevel: number;
  resolvedAt: string | null;
  asset?: { name: string; location: string } | null;
}

interface Props {
  isDark: boolean;
  token: string;
  currentUserRole?: string;
  currentUserEmail?: string;
}

export default function WoApprovalView({
  isDark,
  token,
  currentUserRole = "viewer",
  currentUserEmail = "",
}: Props) {
  const [items, setItems] = useState<WoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"pending" | "resolved" | "all">("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [verifyNotes, setVerifyNotes] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const c_text = isDark ? "text-white" : "text-zinc-900";
  const c_sub = isDark ? "text-zinc-400" : "text-zinc-500";
  const c_card = isDark
    ? "bg-[#1A1F2E]/80 border-[#373C43]/50"
    : "bg-white/80 border-zinc-200/60";
  const c_input = isDark
    ? "bg-[#0D1117] border-[#373C43] text-white"
    : "bg-white border-zinc-200 text-zinc-800";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/management/workorder?limit=200", { headers });
      const data = await r.json();
      if (data.success) setItems(data.data);
    } catch {
      console.error("Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter items based on active filter
  const filtered = items.filter((item) => {
    if (activeFilter === "pending") {
      return ["pending_approval", "pending_l2", "draft"].includes(item.status);
    }
    if (activeFilter === "resolved") {
      return item.status === "resolved";
    }
    return true;
  });

  // Submit draft → pending_approval
  const handleSubmitDraft = async (id: string) => {
    setProcessing(id);
    try {
      await fetch("/api/management/workorder", {
        method: "PUT",
        headers,
        body: JSON.stringify({ id, status: "pending_approval" }),
      });
      await fetchData();
    } finally {
      setProcessing(null);
    }
  };

  // Approve
  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      const r = await fetch("/api/management/workorder/approve", {
        method: "POST",
        headers,
        body: JSON.stringify({ id, action: "approve" }),
      });
      const data = await r.json();
      if (!data.success) alert(data.error || "Gagal approve");
      await fetchData();
    } finally {
      setProcessing(null);
    }
  };

  // Reject
  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      alert("Alasan penolakan wajib diisi.");
      return;
    }
    setProcessing(id);
    try {
      const r = await fetch("/api/management/workorder/approve", {
        method: "POST",
        headers,
        body: JSON.stringify({ id, action: "reject", reason: rejectionReason }),
      });
      const data = await r.json();
      if (!data.success) alert(data.error || "Gagal reject");
      setRejectionReason("");
      await fetchData();
    } finally {
      setProcessing(null);
    }
  };

  // Verify (resolved → verified/closed OR reopened)
  const handleVerify = async (id: string, verified: boolean) => {
    setProcessing(id);
    try {
      const r = await fetch("/api/management/workorder/verify", {
        method: "POST",
        headers,
        body: JSON.stringify({ id, verified, notes: verifyNotes }),
      });
      const data = await r.json();
      if (!data.success) alert(data.error || "Gagal verifikasi");
      setVerifyNotes("");
      await fetchData();
    } finally {
      setProcessing(null);
    }
  };

  // Escalate
  const handleEscalate = async (id: string) => {
    setProcessing(id);
    try {
      await fetch("/api/management/workorder/escalate", {
        method: "POST",
        headers,
        body: JSON.stringify({ id }),
      });
      await fetchData();
    } finally {
      setProcessing(null);
    }
  };

  const priorityColor = (p: string) => {
    const map: Record<string, string> = {
      critical: "bg-red-500/15 text-red-400 border-red-500/30",
      high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
      medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      low: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    };
    return map[p] || map.medium;
  };

  const statusBadge = (s: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      draft: { label: "📝 Draft", cls: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
      pending_approval: { label: "⏳ Pending L1", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
      pending_l2: { label: "⏳ Pending L2", cls: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
      assigned: { label: "📌 Assigned", cls: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
      in_progress: { label: "⚙️ In Progress", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
      on_hold: { label: "⏸️ On Hold", cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
      resolved: { label: "✅ Resolved", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
      verified: { label: "✔️ Verified", cls: "bg-green-500/15 text-green-400 border-green-500/30" },
      reopened: { label: "🔄 Reopened", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
      rejected: { label: "❌ Rejected", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
      closed: { label: "🔒 Closed", cls: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
    };
    return map[s] || { label: s, cls: "bg-zinc-500/15 text-zinc-400" };
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCost = (v: number | null | undefined) => {
    if (!v) return "—";
    return `Rp ${v.toLocaleString("id-ID")}`;
  };

  // Counts
  const pendingCount = items.filter((i) =>
    ["pending_approval", "pending_l2", "draft"].includes(i.status)
  ).length;
  const resolvedCount = items.filter((i) => i.status === "resolved").length;
  const criticalPending = items.filter(
    (i) =>
      i.priority === "critical" &&
      ["pending_approval", "pending_l2"].includes(i.status)
  ).length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className={`text-lg font-bold ${c_text}`}>
            Approval & Verification Center
          </h2>
          <p className={`text-xs ${c_sub}`}>
            Kelola approval 2-tier, verifikasi, dan eskalasi Work Order
          </p>
        </div>
        <button
          onClick={fetchData}
          className={`p-2 rounded-xl border ${c_card}`}
        >
          <RefreshCw
            className={`w-4 h-4 ${loading ? "animate-spin text-[#3370FF]" : c_sub}`}
          />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            l: "Pending Approval",
            v: pendingCount,
            c: "text-amber-400",
            icon: <Clock className="w-5 h-5" />,
          },
          {
            l: "Perlu Verifikasi",
            v: resolvedCount,
            c: "text-emerald-400",
            icon: <Shield className="w-5 h-5" />,
          },
          {
            l: "Critical Pending",
            v: criticalPending,
            c: "text-red-400",
            icon: <AlertTriangle className="w-5 h-5" />,
          },
          {
            l: "Total WO",
            v: items.length,
            c: "text-blue-400",
            icon: <Eye className="w-5 h-5" />,
          },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl p-4 border ${c_card}`}>
            <div className="flex items-center gap-3">
              <div className={s.c}>{s.icon}</div>
              <div>
                <p className={`text-[10px] font-semibold ${c_sub}`}>{s.l}</p>
                <p className={`text-2xl font-bold ${s.c}`}>{s.v}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(
          [
            { v: "pending" as const, l: `⏳ Pending & Draft (${pendingCount})` },
            { v: "resolved" as const, l: `✅ Perlu Verifikasi (${resolvedCount})` },
            { v: "all" as const, l: "📋 Semua WO" },
          ] as const
        ).map((f) => (
          <button
            key={f.v}
            onClick={() => setActiveFilter(f.v)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeFilter === f.v
                ? "bg-[#3370FF] text-white border-[#3370FF]"
                : `${c_card} ${c_sub}`
            }`}
          >
            {f.l}
          </button>
        ))}
      </div>

      {/* WO Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 animate-spin text-[#3370FF]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className={`text-center py-20 ${c_sub}`}>
          <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-semibold">Tidak ada item yang menunggu aksi.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((wo) => {
            const isExpanded = expandedId === wo.id;
            const badge = statusBadge(wo.status);
            const isProcessing = processing === wo.id;

            return (
              <div
                key={wo.id}
                className={`rounded-xl border overflow-hidden transition-all ${c_card} ${
                  wo.priority === "critical"
                    ? "ring-1 ring-red-500/30"
                    : wo.escalationLevel > 0
                      ? "ring-1 ring-orange-500/30"
                      : ""
                }`}
              >
                {/* Card Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : wo.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-mono font-bold ${c_sub}`}>
                        {wo.ticketNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${priorityColor(wo.priority)}`}
                      >
                        {wo.priority.toUpperCase()}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                      {wo.escalationLevel > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                          ⚡ Escalated L{wo.escalationLevel}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm font-semibold mt-1 truncate ${c_text}`}>
                      {wo.title}
                    </p>
                    <div className={`flex items-center gap-3 mt-1 text-[10px] ${c_sub}`}>
                      <span>📍 {wo.asset?.name || wo.category}</span>
                      <span>👤 {wo.reportedBy.split("@")[0]}</span>
                      <span>📅 {formatDate(wo.createdAt)}</span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className={`w-4 h-4 ${c_sub}`} />
                  ) : (
                    <ChevronDown className={`w-4 h-4 ${c_sub}`} />
                  )}
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className={`border-t px-4 pb-4 pt-3 space-y-4 ${isDark ? "border-[#373C43]/50" : "border-zinc-200/60"}`}>
                    {/* Description */}
                    <p className={`text-xs leading-relaxed ${c_sub}`}>
                      {wo.description}
                    </p>

                    {/* Detail Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <p className={`text-[10px] font-semibold ${c_sub}`}>Kategori</p>
                        <p className={`text-xs font-bold ${c_text}`}>{wo.category}</p>
                      </div>
                      <div>
                        <p className={`text-[10px] font-semibold ${c_sub}`}>Assigned To</p>
                        <p className={`text-xs font-bold ${c_text}`}>{wo.assignedTo || "—"}</p>
                      </div>
                      <div>
                        <p className={`text-[10px] font-semibold ${c_sub}`}>SLA Deadline</p>
                        <p className={`text-xs font-bold ${wo.slaDeadline && new Date(wo.slaDeadline) < new Date() ? "text-red-400" : c_text}`}>
                          {formatDate(wo.slaDeadline)}
                        </p>
                      </div>
                      <div>
                        <p className={`text-[10px] font-semibold ${c_sub}`}>Est. Biaya</p>
                        <p className={`text-xs font-bold ${c_text}`}>{formatCost(wo.estimatedCost)}</p>
                      </div>
                    </div>

                    {/* Approval Timeline */}
                    {(wo.approvalLevel > 0 || wo.rejectedBy) && (
                      <div className={`rounded-lg p-3 border ${isDark ? "bg-[#0D1117] border-[#373C43]/50" : "bg-zinc-50 border-zinc-200"}`}>
                        <p className={`text-[10px] font-bold mb-2 ${c_sub}`}>📋 Approval Timeline</p>
                        <div className="space-y-1.5">
                          {wo.approvedL1By && (
                            <div className="flex items-center gap-2 text-[11px]">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                              <span className={c_text}>
                                <strong>L1</strong> oleh{" "}
                                <span className="text-emerald-400">{wo.approvedL1By.split("@")[0]}</span>
                                {" "}— {formatDate(wo.approvedL1At)}
                              </span>
                            </div>
                          )}
                          {wo.approvedL2By && (
                            <div className="flex items-center gap-2 text-[11px]">
                              <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                              <span className={c_text}>
                                <strong>L2</strong> oleh{" "}
                                <span className="text-blue-400">{wo.approvedL2By.split("@")[0]}</span>
                                {" "}— {formatDate(wo.approvedL2At)}
                              </span>
                            </div>
                          )}
                          {wo.rejectedBy && (
                            <div className="flex items-center gap-2 text-[11px]">
                              <XCircle className="w-3.5 h-3.5 text-red-400" />
                              <span className={c_text}>
                                <strong>Ditolak</strong> oleh{" "}
                                <span className="text-red-400">{wo.rejectedBy.split("@")[0]}</span>
                                {wo.rejectedReason && `: "${wo.rejectedReason}"`}
                              </span>
                            </div>
                          )}
                          {wo.verifiedBy && (
                            <div className="flex items-center gap-2 text-[11px]">
                              <Shield className="w-3.5 h-3.5 text-green-400" />
                              <span className={c_text}>
                                <strong>Verified</strong> oleh{" "}
                                <span className="text-green-400">{wo.verifiedBy.split("@")[0]}</span>
                                {" "}— {formatDate(wo.verifiedAt)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {/* Draft → Submit for Approval */}
                      {wo.status === "draft" && (
                        <button
                          disabled={isProcessing}
                          onClick={() => handleSubmitDraft(wo.id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#3370FF] hover:bg-[#5B8EFF] text-white rounded-xl text-xs font-semibold shadow-lg shadow-[#3370FF]/20 transition-all disabled:opacity-50"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {isProcessing ? "Submitting..." : "Submit untuk Approval"}
                        </button>
                      )}

                      {/* Approve (pending_approval or pending_l2) */}
                      {["pending_approval", "pending_l2"].includes(wo.status) && (
                        <>
                          <button
                            disabled={isProcessing}
                            onClick={() => handleApprove(wo.id)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            {isProcessing ? "Processing..." : `Approve ${wo.status === "pending_l2" ? "L2" : "L1"}`}
                          </button>

                          {/* Reject with reason input */}
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              placeholder="Alasan penolakan..."
                              value={expandedId === wo.id ? rejectionReason : ""}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              className={`px-3 py-2 border rounded-xl text-xs outline-none focus:border-red-400 w-48 ${c_input}`}
                            />
                            <button
                              disabled={isProcessing}
                              onClick={() => handleReject(wo.id)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-red-600/20 transition-all disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        </>
                      )}

                      {/* Verify (resolved → verified/closed or reopened) */}
                      {wo.status === "resolved" && (
                        <>
                          <input
                            type="text"
                            placeholder="Catatan verifikasi (opsional)..."
                            value={expandedId === wo.id ? verifyNotes : ""}
                            onChange={(e) => setVerifyNotes(e.target.value)}
                            className={`px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-400 w-60 ${c_input}`}
                          />
                          <button
                            disabled={isProcessing}
                            onClick={() => handleVerify(wo.id, true)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-green-600/20 transition-all disabled:opacity-50"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            {isProcessing ? "..." : "✅ Verifikasi & Tutup"}
                          </button>
                          <button
                            disabled={isProcessing}
                            onClick={() => handleVerify(wo.id, false)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-orange-600/20 transition-all disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            {isProcessing ? "..." : "🔄 Buka Kembali"}
                          </button>
                        </>
                      )}

                      {/* Escalate */}
                      {["pending_approval", "pending_l2", "assigned", "in_progress"].includes(wo.status) &&
                        wo.escalationLevel < 2 && (
                          <button
                            disabled={isProcessing}
                            onClick={() => handleEscalate(wo.id)}
                            className="flex items-center gap-1.5 px-3 py-2 border border-orange-500/30 text-orange-400 rounded-xl text-xs font-semibold hover:bg-orange-500/10 transition-all disabled:opacity-50"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            Escalate
                          </button>
                        )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
