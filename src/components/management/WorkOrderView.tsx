"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ClipboardList,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Camera,
  X,
  ImageIcon,
  HelpCircle,
} from "lucide-react";
import { hasPermission } from "@/lib/rbac";

interface WorkOrderItem {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  assetId: string | null;
  assignedTo: string | null;
  reportedBy: string;
  status: string;
  slaDeadline: string | null;
  resolvedAt: string | null;
  createdAt: string;
  photos?: string[];
  asset?: { name: string; location: string } | null;
  // v2 2-tier approval
  approvalLevel?: number;
  approvedL1By?: string | null;
  approvedL1At?: string | null;
  approvedL2By?: string | null;
  approvedL2At?: string | null;
  rejectedBy?: string | null;
  rejectedReason?: string | null;
  // v2 verification
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  // v2 cost
  estimatedCost?: number | null;
  actualCost?: number | null;
  // v2 escalation
  escalationLevel?: number;
  // v2 child WOs
  childWos?: { id: string; ticketNumber: string; status: string }[];
}

export default function WorkOrderView({
  isDark,
  token,
  currentUserRole = "viewer",
}: {
  isDark: boolean;
  token: string;
  currentUserRole?: string;
}) {
  const c_card = isDark
    ? "bg-zinc-900/30 border-zinc-800/80"
    : "bg-white border-zinc-200 shadow-sm";
  const c_input = isDark
    ? "bg-[#1B1F26] border-zinc-800 text-white"
    : "bg-white border-zinc-200 text-zinc-800";
  const c_modal = isDark
    ? "bg-[#0F1C33] border-[#373C43] text-white"
    : "bg-white border-zinc-200 text-zinc-800";
  const c_text = isDark ? "text-white" : "text-zinc-800";
  const c_sub = isDark ? "text-zinc-400" : "text-zinc-500";
  const c_th = isDark
    ? "bg-[#1B1F26]/40 text-zinc-400"
    : "bg-zinc-100 text-zinc-600";
  const c_tr = isDark
    ? "hover:bg-zinc-900/10 border-zinc-800/60"
    : "hover:bg-zinc-50 border-zinc-200";

  const [items, setItems] = useState<WorkOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilter] = useState("all");
  const [woCategories, setWoCategories] = useState<{code: string; label: string}[]>([]);

  // Create WO modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "",
    assetId: "",
    slaDeadline: "",
    estimatedCost: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detail modal for viewing WO with photos
  const [detailWO, setDetailWO] = useState<WorkOrderItem | null>(null);

  // Approval modal
  const [approvalModal, setApprovalModal] = useState<WorkOrderItem | null>(
    null,
  );
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">(
    "approve",
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalLoading, setApprovalLoading] = useState(false);

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  const canApprove = hasPermission(currentUserRole, "wo_approve");
  const canDelete = hasPermission(currentUserRole, "wo_delete");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/management/workorder?limit=100", { headers });
      const data = await r.json();
      if (data.success) setItems(data.data);
    } catch {
      console.error("Failed to load WO");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch dynamic WO categories from MasterData
  const fetchCategories = useCallback(async () => {
    try {
      const r = await fetch("/api/management/admin?category=wo_category", { headers });
      const data = await r.json();
      if (data.success && Array.isArray(data.data)) {
        setWoCategories(data.data.filter((d: any) => d.isActive).map((d: any) => ({ code: d.code, label: d.label })));
      }
    } catch { /* fallback to empty */ }
  }, [token]);

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, [fetchData, fetchCategories]);

  const handlePhotoUpload = async (files: FileList) => {
    setUploading(true);
    const newPhotos: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} melebihi 10MB`);
        continue;
      }
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const data = await res.json();
        if (data.success) newPhotos.push(data.data.url);
      } catch {
        console.error("Upload failed for", file.name);
      }
    }
    setUploadedPhotos((prev) => [...prev, ...newPhotos]);
    setUploading(false);
  };

  const removePhoto = (idx: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      ...form,
      photos: uploadedPhotos,
      estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : null,
    };
    await fetch("/api/management/workorder", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    setShowModal(false);
    setForm({
      title: "",
      description: "",
      priority: "medium",
      category: "",
      assetId: "",
      slaDeadline: "",
      estimatedCost: "",
    });
    setUploadedPhotos([]);
    setSubmitting(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus Work Order ini?")) return;
    await fetch("/api/management/workorder", {
      method: "DELETE",
      headers,
      body: JSON.stringify({ id }),
    });
    fetchData();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch("/api/management/workorder", {
      method: "PUT",
      headers,
      body: JSON.stringify({ id, status }),
    });
    fetchData();
  };

  const handleApproval = async () => {
    if (!approvalModal) return;
    setApprovalLoading(true);
    try {
      const r = await fetch("/api/management/workorder/approve", {
        method: "POST",
        headers,
        body: JSON.stringify({
          id: approvalModal.id,
          action: approvalAction,
          reason: rejectionReason,
        }),
      });
      const data = await r.json();
      if (data.success) {
        setApprovalModal(null);
        setRejectionReason("");
        fetchData();
      } else {
        alert(data.error || "Gagal memproses approval");
      }
    } catch {
      alert("Koneksi error");
    } finally {
      setApprovalLoading(false);
    }
  };

  const priorityBadge = (p: string) =>
    (
      ({
        critical: "bg-red-500/10 text-red-400 border-red-500/20",
        high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      }) as any
    )[p] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";

  const statusBadge = (s: string) =>
    (
      ({
        draft: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
        pending_approval: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        approved_l1: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        pending_l2: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        assigned: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
        in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        on_hold: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        verified: "bg-green-500/10 text-green-400 border-green-500/20",
        reopened: "bg-red-500/10 text-red-400 border-red-500/20",
        rejected: "bg-red-500/10 text-red-400 border-red-500/20",
        closed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
      }) as any
    )[s] || "bg-zinc-500/10 text-zinc-400";

  const statusLabel = (s: string) => {
    const labels: Record<string, string> = {
      draft: "Draft", pending_approval: "Pending Approval", approved_l1: "Approved L1",
      pending_l2: "Pending L2", assigned: "Ditugaskan", in_progress: "In Progress",
      on_hold: "Ditunda", resolved: "Resolved", verified: "Verified",
      reopened: "Reopened", rejected: "Ditolak", closed: "Closed",
    };
    return labels[s] || s;
  };

  const filtered =
    filterStatus === "all"
      ? items
      : items.filter((i) => i.status === filterStatus);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className={`text-lg font-bold ${c_text}`}>
            Work Order & Ticket Management
          </h2>
          <p className={`text-xs ${c_sub}`}>
            Kelola permintaan kerja dengan alur approval
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className={`p-2 rounded-xl border ${c_card}`}
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin text-[#3370FF]" : c_sub}`}
            />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#3370FF] hover:bg-[#5B8EFF] text-white rounded-xl text-xs font-semibold shadow-lg shadow-[#3370FF]/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Buat Work Order
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            l: "Draft",
            v: items.filter((i) => i.status === "draft").length,
            c: "text-zinc-400",
            icon: "📝",
          },
          {
            l: "Pending",
            v: items.filter((i) => ["pending_approval", "pending_l2"].includes(i.status)).length,
            c: "text-amber-400",
            icon: "⏳",
          },
          {
            l: "Aktif",
            v: items.filter((i) => ["assigned", "in_progress", "on_hold"].includes(i.status)).length,
            c: "text-blue-400",
            icon: "⚙️",
          },
          {
            l: "Critical",
            v: items.filter((i) => i.priority === "critical" && !["closed", "verified", "rejected"].includes(i.status)).length,
            c: "text-red-400",
            icon: "🚨",
          },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl p-4 border ${c_card}`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{s.icon}</span>
              <div>
                <p className={`text-[10px] font-semibold ${c_sub}`}>{s.l}</p>
                <p className={`text-2xl font-bold ${s.c}`}>{s.v}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { v: "all", l: "Semua" },
          { v: "draft", l: "📝 Draft" },
          { v: "pending_approval", l: "⏳ Pending" },
          { v: "pending_l2", l: "⏳ Pending L2" },
          { v: "assigned", l: "📌 Assigned" },
          { v: "in_progress", l: "⚙️ In Progress" },
          { v: "on_hold", l: "⏸️ Ditunda" },
          { v: "resolved", l: "✅ Resolved" },
          { v: "rejected", l: "❌ Ditolak" },
          { v: "closed", l: "🔒 Closed" },
        ].map((f) => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-semibold border transition-all ${
              filterStatus === f.v
                ? "bg-[#3370FF] text-white border-[#3370FF]"
                : `${c_card} ${c_sub}`
            }`}
          >
            {f.l}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className={`border rounded-xl overflow-hidden ${c_card}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={c_th}>
                <th className="px-4 py-3 text-left font-semibold">Tiket</th>
                <th className="px-4 py-3 text-left font-semibold">Judul</th>
                <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">
                  Prioritas
                </th>
                <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">
                  Aset
                </th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">
                  Approval
                </th>
                <th className="px-4 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    <RefreshCw className="w-5 h-5 mx-auto animate-spin text-[#3370FF]" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`text-center py-10 ${c_sub}`}>
                    Tidak ada work order.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-t transition-colors ${c_tr}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setDetailWO(item)}
                          className="font-mono text-[#3370FF] font-bold hover:underline cursor-pointer"
                        >
                          {item.ticketNumber}
                        </button>
                        {item.photos && item.photos.length > 0 && (
                          <button
                            onClick={() => setDetailWO(item)}
                            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#3370FF]/10 text-[#3370FF] text-[9px] font-bold"
                          >
                            <ImageIcon className="w-3 h-3" />
                            {item.photos.length}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className={`px-4 py-3 max-w-[180px]`}>
                      <p className={`font-semibold truncate ${c_text}`}>
                        {item.title}
                      </p>
                      <p className={`truncate mt-0.5 ${c_sub} text-[10px]`}>
                        {item.reportedBy}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${priorityBadge(item.priority)}`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className={`px-4 py-3 hidden md:table-cell ${c_sub}`}>
                      {item.asset?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusBadge(item.status)}`}
                      >
                        {statusLabel(item.status)}
                      </span>
                      {(item.escalationLevel ?? 0) > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[9px] font-bold">
                          ⚡ L{item.escalationLevel}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {(item.approvalLevel ?? 0) > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="px-2 py-0.5 rounded-full border text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            ✅ L{item.approvalLevel}
                          </span>
                          {item.approvedL1By && (
                            <span className={`text-[9px] ${c_sub}`}>L1: {item.approvedL1By.split("@")[0]}</span>
                          )}
                          {item.approvedL2By && (
                            <span className={`text-[9px] ${c_sub}`}>L2: {item.approvedL2By.split("@")[0]}</span>
                          )}
                        </div>
                      ) : item.status === "rejected" ? (
                        <span className="px-2 py-0.5 rounded-full border text-[10px] font-bold bg-red-500/10 text-red-400 border-red-500/20">❌ Ditolak</span>
                      ) : (
                        <span className={c_sub}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Approve/Reject — on pending WOs */}
                        {canApprove &&
                          ["pending_approval", "pending_l2"].includes(item.status) && (
                            <>
                              <button
                                onClick={() => {
                                  setApprovalModal(item);
                                  setApprovalAction("approve");
                                  setRejectionReason("");
                                }}
                                title="Setujui"
                                className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400 transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setApprovalModal(item);
                                  setApprovalAction("reject");
                                  setRejectionReason("");
                                }}
                                title="Tolak"
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            title="Hapus"
                            className={`p-1.5 rounded-lg transition-colors hover:bg-red-500/10 ${c_sub} hover:text-red-400`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create WO Modal ─────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div
            className={`w-full sm:max-w-lg border rounded-t-2xl sm:rounded-xl shadow-2xl ${c_modal}`}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: isDark ? "#1A2744" : "#E5E7EB" }}
            >
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">Buat Work Order Baru</h3>
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("open-help", {
                        detail: { key: "workorder_create" },
                      }),
                    )
                  }
                  className="p-1 rounded-lg hover:bg-zinc-500/10 text-[#3370FF] hover:text-[#5B8EFF] transition-all"
                  title="Lihat Bantuan Form"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className={`text-xs ${c_sub} hover:text-red-400`}
              >
                ✕ Tutup
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className={`block mb-1 font-semibold ${c_sub}`}>
                  Judul *
                </label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={`w-full px-3 py-2.5 border rounded-xl outline-none focus:border-[#3370FF] ${c_input}`}
                  placeholder="AC Presisi DC01 tidak dingin"
                />
              </div>
              <div>
                <label className={`block mb-1 font-semibold ${c_sub}`}>
                  Deskripsi *
                </label>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className={`w-full px-3 py-2.5 border rounded-xl outline-none focus:border-[#3370FF] ${c_input}`}
                  rows={3}
                  placeholder="Jelaskan masalah atau pekerjaan yang perlu dilakukan..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block mb-1 font-semibold ${c_sub}`}>
                    Prioritas *
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value })
                    }
                    className={`w-full px-3 py-2.5 border rounded-xl outline-none ${c_input}`}
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🟠 High</option>
                    <option value="critical">🔴 Critical</option>
                  </select>
                </div>
                <div>
                  <label className={`block mb-1 font-semibold ${c_sub}`}>
                    Kategori *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className={`w-full px-3 py-2.5 border rounded-xl outline-none ${c_input}`}
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {woCategories.map((cat) => (
                      <option key={cat.code} value={cat.code}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block mb-1 font-semibold ${c_sub}`}>
                    Estimasi Biaya (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.estimatedCost}
                    onChange={(e) =>
                      setForm({ ...form, estimatedCost: e.target.value })
                    }
                    className={`w-full px-3 py-2.5 border rounded-xl outline-none focus:border-[#3370FF] ${c_input}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 font-semibold ${c_sub}`}>
                    SLA Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={form.slaDeadline}
                    onChange={(e) =>
                      setForm({ ...form, slaDeadline: e.target.value })
                    }
                    className={`w-full px-3 py-2.5 border rounded-xl outline-none focus:border-[#3370FF] ${c_input}`}
                  />
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <label className={`block mb-1 font-semibold ${c_sub}`}>
                  Foto Dokumentasi
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) =>
                    e.target.files && handlePhotoUpload(e.target.files)
                  }
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files.length)
                      handlePhotoUpload(e.dataTransfer.files);
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                    isDark
                      ? "border-zinc-700 hover:border-[#3370FF] hover:bg-[#3370FF]/5"
                      : "border-zinc-300 hover:border-[#3370FF] hover:bg-[#3370FF]/5"
                  }`}
                >
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2 py-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#3370FF]" />
                      <span className={c_sub}>Mengupload foto...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 py-1">
                      <Camera className="w-6 h-6 text-[#3370FF]/60" />
                      <span className={`text-[10px] ${c_sub}`}>
                        Klik atau seret foto ke sini
                      </span>
                      <span className={`text-[9px] ${c_sub}`}>
                        PNG, JPG — Maks 10MB per file
                      </span>
                    </div>
                  )}
                </div>

                {/* Photo Previews */}
                {uploadedPhotos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {uploadedPhotos.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative group w-16 h-16 rounded-lg overflow-hidden border border-zinc-700"
                      >
                        <img
                          src={url}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[8px] text-white text-center py-0.5">
                          {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || uploading}
                className="w-full py-2.5 bg-[#3370FF] hover:bg-[#5B8EFF] disabled:opacity-50 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                {submitting && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                Buat Work Order
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Approval Modal ─────────────────────────── */}
      {approvalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-md border rounded-xl shadow-2xl overflow-hidden ${c_modal}`}
          >
            <div
              className={`px-6 py-4 border-b ${approvalAction === "approve" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}
            >
              <div className="flex items-center gap-3">
                {approvalAction === "approve" ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3
                      className={`text-sm font-bold ${approvalAction === "approve" ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {approvalAction === "approve"
                        ? "Setujui Work Order"
                        : "Tolak Work Order"}
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        window.dispatchEvent(
                          new CustomEvent("open-help", {
                            detail: { key: "workorder_approve" },
                          }),
                        )
                      }
                      className="p-0.5 rounded-lg hover:bg-zinc-500/10 text-[#3370FF] hover:text-[#5B8EFF] transition-all"
                      title="Lihat Bantuan Form"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className={`text-[10px] ${c_sub}`}>
                    {approvalModal.ticketNumber} — {approvalModal.title}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div
                className={`p-3 rounded-xl border ${isDark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-zinc-50"}`}
              >
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <p className={c_sub}>Prioritas</p>
                    <p className={`font-bold ${c_text} capitalize`}>
                      {approvalModal.priority}
                    </p>
                  </div>
                  <div>
                    <p className={c_sub}>Kategori</p>
                    <p className={`font-bold ${c_text} capitalize`}>
                      {approvalModal.category}
                    </p>
                  </div>
                  <div>
                    <p className={c_sub}>Aset</p>
                    <p className={`font-bold ${c_text}`}>
                      {approvalModal.asset?.name || "—"}
                    </p>
                  </div>
                  <div>
                    <p className={c_sub}>Dilaporkan</p>
                    <p className={`font-bold ${c_text}`}>
                      {approvalModal.reportedBy}
                    </p>
                  </div>
                </div>
              </div>

              {approvalAction === "reject" && (
                <div>
                  <label className={`block mb-1.5 font-semibold ${c_sub}`}>
                    Alasan Penolakan *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    placeholder="Jelaskan alasan penolakan work order ini..."
                    className={`w-full px-3 py-2.5 border rounded-xl outline-none focus:border-red-500 ${c_input}`}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setApprovalModal(null)}
                  disabled={approvalLoading}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${c_card} ${c_sub}`}
                >
                  Batal
                </button>
                <button
                  onClick={handleApproval}
                  disabled={
                    approvalLoading ||
                    (approvalAction === "reject" && !rejectionReason.trim())
                  }
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-colors ${
                    approvalAction === "approve"
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {approvalLoading && (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {approvalAction === "approve" ? "✅ Setujui" : "❌ Tolak WO"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail / Photo Viewer Modal ─────────────── */}
      {detailWO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-lg border rounded-xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col ${c_modal}`}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: isDark ? "#1A2744" : "#E5E7EB" }}
            >
              <div>
                <h3 className={`text-sm font-bold ${c_text}`}>
                  Detail Work Order
                </h3>
                <p className={`text-[10px] font-mono ${c_sub}`}>
                  {detailWO.ticketNumber}
                </p>
              </div>
              <button
                onClick={() => setDetailWO(null)}
                className={`text-xs ${c_sub} hover:text-red-400`}
              >
                ✕ Tutup
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div>
                <h4 className={`font-bold text-sm ${c_text}`}>
                  {detailWO.title}
                </h4>
                <p className={`mt-1 ${c_sub}`}>{detailWO.description}</p>
              </div>

              <div
                className={`p-3 rounded-xl border ${isDark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-zinc-50"}`}
              >
                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div>
                    <p className={c_sub}>Prioritas</p>
                    <p className={`font-bold ${c_text} capitalize`}>
                      {detailWO.priority}
                    </p>
                  </div>
                  <div>
                    <p className={c_sub}>Kategori</p>
                    <p className={`font-bold ${c_text} capitalize`}>
                      {detailWO.category}
                    </p>
                  </div>
                  <div>
                    <p className={c_sub}>Status</p>
                    <p className={`font-bold ${c_text} capitalize`}>
                      {detailWO.status.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <p className={c_sub}>Aset</p>
                    <p className={`font-bold ${c_text}`}>
                      {detailWO.asset?.name || "—"}
                    </p>
                  </div>
                  <div>
                    <p className={c_sub}>Dilaporkan oleh</p>
                    <p className={`font-bold ${c_text}`}>
                      {detailWO.reportedBy}
                    </p>
                  </div>
                  <div>
                    <p className={c_sub}>SLA Deadline</p>
                    <p className={`font-bold ${c_text}`}>
                      {detailWO.slaDeadline
                        ? new Date(detailWO.slaDeadline).toLocaleDateString(
                            "id-ID",
                          )
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Photos */}
              {detailWO.photos && detailWO.photos.length > 0 ? (
                <div>
                  <label className={`block mb-2 font-semibold ${c_sub}`}>
                    <Camera className="w-3.5 h-3.5 inline mr-1" />
                    Foto Dokumentasi ({detailWO.photos.length})
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {detailWO.photos.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative rounded-xl overflow-hidden border border-zinc-700 hover:ring-2 hover:ring-[#3370FF] transition-all cursor-zoom-in"
                      >
                        <img
                          src={url}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1">
                          <p className="text-[9px] text-white font-bold">
                            Foto {idx + 1}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  className={`text-center py-6 rounded-xl border-2 border-dashed ${
                    isDark
                      ? "border-zinc-800 text-zinc-600"
                      : "border-zinc-200 text-zinc-400"
                  }`}
                >
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-[10px]">Tidak ada foto dokumentasi</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
