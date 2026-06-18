'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Plus, Trash2, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface WorkOrderItem {
  id: string; ticketNumber: string; title: string; description: string;
  priority: string; category: string; assetId: string | null; assignedTo: string | null;
  reportedBy: string; status: string; slaDeadline: string | null;
  resolvedAt: string | null; createdAt: string;
  asset?: { name: string; location: string } | null;
  approvalStatus?: string | null;
  approvedBy?: string | null; approvedAt?: string | null;
  rejectedBy?: string | null; rejectedReason?: string | null;
}

export default function WorkOrderView({ isDark, token, currentUserRole = 'viewer' }: {
  isDark: boolean; token: string; currentUserRole?: string;
}) {
  const c_card  = isDark ? 'bg-zinc-900/30 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm';
  const c_input = isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-800';
  const c_modal = isDark ? 'bg-[#0F1C33] border-[#1A2744] text-white' : 'bg-white border-zinc-200 text-zinc-800';
  const c_text  = isDark ? 'text-white' : 'text-zinc-800';
  const c_sub   = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const c_th    = isDark ? 'bg-zinc-950/40 text-zinc-400' : 'bg-zinc-100 text-zinc-600';
  const c_tr    = isDark ? 'hover:bg-zinc-900/10 border-zinc-800/60' : 'hover:bg-zinc-50 border-zinc-200';

  const [items, setItems]         = useState<WorkOrderItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filterStatus, setFilter] = useState('all');

  // Create WO modal
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState({ title: '', description: '', priority: 'medium', category: 'electrical', assetId: '', slaDeadline: '' });
  const [submitting, setSubmitting] = useState(false);

  // Approval modal
  const [approvalModal, setApprovalModal]     = useState<WorkOrderItem | null>(null);
  const [approvalAction, setApprovalAction]   = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalLoading, setApprovalLoading] = useState(false);

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  const canApprove = ['admin', 'operator'].includes(currentUserRole);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/management/workorder', { headers });
      const data = await res.json();
      if (data.success) setItems(data.data);
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    await fetch('/api/management/workorder', { method: 'POST', headers, body: JSON.stringify(form) });
    setShowModal(false);
    setForm({ title: '', description: '', priority: 'medium', category: 'electrical', assetId: '', slaDeadline: '' });
    setSubmitting(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus Work Order ini?')) return;
    await fetch('/api/management/workorder', { method: 'DELETE', headers, body: JSON.stringify({ id }) });
    fetchData();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch('/api/management/workorder', { method: 'PUT', headers, body: JSON.stringify({ id, status }) });
    fetchData();
  };

  const handleApproval = async () => {
    if (!approvalModal) return;
    setApprovalLoading(true);
    try {
      const r = await fetch('/api/management/workorder/approve', {
        method: 'POST', headers,
        body: JSON.stringify({ id: approvalModal.id, action: approvalAction, reason: rejectionReason }),
      });
      const data = await r.json();
      if (data.success) { setApprovalModal(null); setRejectionReason(''); fetchData(); }
      else { alert(data.error || 'Gagal memproses approval'); }
    } catch { alert('Koneksi error'); }
    finally { setApprovalLoading(false); }
  };

  const priorityBadge = (p: string) => ({
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    high:     'bg-orange-500/10 text-orange-400 border-orange-500/20',
    medium:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low:      'bg-blue-500/10 text-blue-400 border-blue-500/20',
  } as any)[p] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

  const statusBadge = (s: string) => ({
    open:        'bg-blue-500/10 text-blue-400 border-blue-500/20',
    in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    approved:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rejected:    'bg-red-500/10 text-red-400 border-red-500/20',
    resolved:    'bg-teal-500/10 text-teal-400 border-teal-500/20',
    closed:      'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  } as any)[s] || 'bg-zinc-500/10 text-zinc-400';

  const approvalBadge = (a: string | null | undefined) => {
    if (!a) return null;
    const map: Record<string, string> = {
      pending:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
      approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return map[a] || null;
  };

  const filtered = filterStatus === 'all' ? items : items.filter(i => i.status === filterStatus || i.approvalStatus === filterStatus);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className={`text-lg font-bold ${c_text}`}>Work Order & Ticket Management</h2>
          <p className={`text-xs ${c_sub}`}>Kelola permintaan kerja dengan alur approval</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className={`p-2 rounded-xl border ${c_card}`}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#1769FF]' : c_sub}`} />
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1769FF] hover:bg-[#4A8AFF] text-white rounded-xl text-xs font-semibold shadow-lg shadow-[#1769FF]/20 transition-all">
            <Plus className="w-3.5 h-3.5" /> Buat Work Order
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { l: 'Open',       v: items.filter(i => i.status === 'open').length,                 c: 'text-blue-400',    icon: '📋' },
          { l: 'In Progress',v: items.filter(i => i.status === 'in_progress').length,          c: 'text-amber-400',   icon: '⚙️' },
          { l: 'Menunggu',   v: items.filter(i => i.approvalStatus === 'pending').length,      c: 'text-yellow-400',  icon: '⏳' },
          { l: 'Critical',   v: items.filter(i => i.priority === 'critical').length,           c: 'text-red-400',     icon: '🚨' },
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
          { v: 'all', l: 'Semua' }, { v: 'open', l: 'Open' }, { v: 'in_progress', l: 'In Progress' },
          { v: 'pending', l: '⏳ Pending Approval' }, { v: 'approved', l: '✅ Disetujui' },
          { v: 'rejected', l: '❌ Ditolak' }, { v: 'resolved', l: 'Resolved' },
        ].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-semibold border transition-all ${
              filterStatus === f.v ? 'bg-[#1769FF] text-white border-[#1769FF]' : `${c_card} ${c_sub}`
            }`}>{f.l}</button>
        ))}
      </div>

      {/* Table */}
      <div className={`border rounded-2xl overflow-hidden ${c_card}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className={c_th}>
              <th className="px-4 py-3 text-left font-semibold">Tiket</th>
              <th className="px-4 py-3 text-left font-semibold">Judul</th>
              <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">Prioritas</th>
              <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Aset</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">Approval</th>
              <th className="px-4 py-3 text-right font-semibold">Aksi</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10">
                  <RefreshCw className="w-5 h-5 mx-auto animate-spin text-[#1769FF]" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className={`text-center py-10 ${c_sub}`}>Tidak ada work order.</td></tr>
              ) : filtered.map(item => (
                <tr key={item.id} className={`border-t transition-colors ${c_tr}`}>
                  <td className="px-4 py-3 font-mono text-[#1769FF] font-bold">{item.ticketNumber}</td>
                  <td className={`px-4 py-3 max-w-[180px]`}>
                    <p className={`font-semibold truncate ${c_text}`}>{item.title}</p>
                    <p className={`truncate mt-0.5 ${c_sub} text-[10px]`}>{item.reportedBy}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${priorityBadge(item.priority)}`}>{item.priority}</span>
                  </td>
                  <td className={`px-4 py-3 hidden md:table-cell ${c_sub}`}>{item.asset?.name || '—'}</td>
                  <td className="px-4 py-3">
                    {canApprove ? (
                      <select value={item.status} onChange={e => handleStatusChange(item.id, e.target.value)}
                        className={`px-2 py-1 rounded-lg border text-[10px] font-bold cursor-pointer ${statusBadge(item.status)} ${c_input}`}>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusBadge(item.status)}`}>{item.status.replace('_', ' ')}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {item.approvalStatus ? (
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${approvalBadge(item.approvalStatus)}`}>
                        {item.approvalStatus === 'pending' ? '⏳ Menunggu' : item.approvalStatus === 'approved' ? '✅ Disetujui' : '❌ Ditolak'}
                      </span>
                    ) : <span className={c_sub}>—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Approve/Reject — admin & operator only, on pending WOs */}
                      {canApprove && (!item.approvalStatus || item.approvalStatus === 'pending') && (
                        <>
                          <button
                            onClick={() => { setApprovalModal(item); setApprovalAction('approve'); setRejectionReason(''); }}
                            title="Setujui"
                            className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400 transition-colors"
                          ><CheckCircle className="w-4 h-4" /></button>
                          <button
                            onClick={() => { setApprovalModal(item); setApprovalAction('reject'); setRejectionReason(''); }}
                            title="Tolak"
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                          ><XCircle className="w-4 h-4" /></button>
                        </>
                      )}
                      {canApprove && (
                        <button onClick={() => handleDelete(item.id)} title="Hapus"
                          className={`p-1.5 rounded-lg transition-colors hover:bg-red-500/10 ${c_sub} hover:text-red-400`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create WO Modal ─────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className={`w-full sm:max-w-lg border rounded-t-2xl sm:rounded-2xl shadow-2xl ${c_modal}`}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: isDark ? '#1A2744' : '#E5E7EB' }}>
              <h3 className="text-sm font-bold">Buat Work Order Baru</h3>
              <button onClick={() => setShowModal(false)} className={`text-xs ${c_sub} hover:text-red-400`}>✕ Tutup</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className={`block mb-1 font-semibold ${c_sub}`}>Judul *</label>
                <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  className={`w-full px-3 py-2.5 border rounded-xl outline-none focus:border-[#1769FF] ${c_input}`}
                  placeholder="AC Presisi DC01 tidak dingin" />
              </div>
              <div>
                <label className={`block mb-1 font-semibold ${c_sub}`}>Deskripsi *</label>
                <textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className={`w-full px-3 py-2.5 border rounded-xl outline-none focus:border-[#1769FF] ${c_input}`} rows={3}
                  placeholder="Jelaskan masalah atau pekerjaan yang perlu dilakukan..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block mb-1 font-semibold ${c_sub}`}>Prioritas *</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}
                    className={`w-full px-3 py-2.5 border rounded-xl outline-none ${c_input}`}>
                    <option value="low">🟢 Low</option><option value="medium">🟡 Medium</option>
                    <option value="high">🟠 High</option><option value="critical">🔴 Critical</option>
                  </select>
                </div>
                <div>
                  <label className={`block mb-1 font-semibold ${c_sub}`}>Kategori *</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                    className={`w-full px-3 py-2.5 border rounded-xl outline-none ${c_input}`}>
                    <option value="hvac">HVAC</option><option value="electrical">Electrical</option>
                    <option value="plumbing">Plumbing</option><option value="structural">Structural</option>
                    <option value="safety">Safety</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={`block mb-1 font-semibold ${c_sub}`}>SLA Deadline</label>
                <input type="datetime-local" value={form.slaDeadline} onChange={e => setForm({...form, slaDeadline: e.target.value})}
                  className={`w-full px-3 py-2.5 border rounded-xl outline-none focus:border-[#1769FF] ${c_input}`} />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-2.5 bg-[#1769FF] hover:bg-[#4A8AFF] disabled:opacity-50 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Buat Work Order
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Approval Modal ─────────────────────────── */}
      {approvalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md border rounded-2xl shadow-2xl overflow-hidden ${c_modal}`}>
            <div className={`px-6 py-4 border-b ${approvalAction === 'approve' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <div className="flex items-center gap-3">
                {approvalAction === 'approve'
                  ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                  : <XCircle className="w-5 h-5 text-red-400" />}
                <div>
                  <h3 className={`text-sm font-bold ${approvalAction === 'approve' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {approvalAction === 'approve' ? 'Setujui Work Order' : 'Tolak Work Order'}
                  </h3>
                  <p className={`text-[10px] ${c_sub}`}>{approvalModal.ticketNumber} — {approvalModal.title}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className={`p-3 rounded-xl border ${isDark ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-zinc-50'}`}>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div><p className={c_sub}>Prioritas</p><p className={`font-bold ${c_text} capitalize`}>{approvalModal.priority}</p></div>
                  <div><p className={c_sub}>Kategori</p><p className={`font-bold ${c_text} capitalize`}>{approvalModal.category}</p></div>
                  <div><p className={c_sub}>Aset</p><p className={`font-bold ${c_text}`}>{approvalModal.asset?.name || '—'}</p></div>
                  <div><p className={c_sub}>Dilaporkan</p><p className={`font-bold ${c_text}`}>{approvalModal.reportedBy}</p></div>
                </div>
              </div>

              {approvalAction === 'reject' && (
                <div>
                  <label className={`block mb-1.5 font-semibold ${c_sub}`}>Alasan Penolakan *</label>
                  <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows={3}
                    placeholder="Jelaskan alasan penolakan work order ini..."
                    className={`w-full px-3 py-2.5 border rounded-xl outline-none focus:border-red-500 ${c_input}`} />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setApprovalModal(null)} disabled={approvalLoading}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-colors ${c_card} ${c_sub}`}>
                  Batal
                </button>
                <button onClick={handleApproval} disabled={approvalLoading || (approvalAction === 'reject' && !rejectionReason.trim())}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-colors ${
                    approvalAction === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
                  }`}>
                  {approvalLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {approvalAction === 'approve' ? '✅ Setujui' : '❌ Tolak WO'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
