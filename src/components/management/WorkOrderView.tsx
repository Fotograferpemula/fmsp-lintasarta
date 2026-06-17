'use client';
import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Trash2, RefreshCw, AlertTriangle, Clock } from 'lucide-react';

interface WorkOrderItem {
  id: string; ticketNumber: string; title: string; description: string;
  priority: string; category: string; assetId: string | null; assignedTo: string | null;
  reportedBy: string; status: string; slaDeadline: string | null;
  resolvedAt: string | null; createdAt: string;
  asset?: { name: string; location: string } | null;
}

export default function WorkOrderView({ isDark, token }: { isDark: boolean; token: string }) {
  const c_card = isDark ? 'bg-zinc-900/30 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm';
  const c_input = isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-800';
  const c_modal = isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-800';
  const c_text = isDark ? 'text-white' : 'text-zinc-800';
  const c_sub = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const c_tbl_h = isDark ? 'bg-zinc-950/40 text-zinc-400' : 'bg-zinc-100 text-zinc-600';
  const c_tbl_r = isDark ? 'hover:bg-zinc-900/10 border-zinc-800/60' : 'hover:bg-zinc-50 border-zinc-200';

  const [items, setItems] = useState<WorkOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', category: 'electrical', assetId: '', assignedTo: '', slaDeadline: '' });
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchData = async () => { setLoading(true); try { const res = await fetch('/api/management/workorder', { headers }); const data = await res.json(); if (data.success) setItems(data.data); } catch(e){} setLoading(false); };
  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/management/workorder', { method: 'POST', headers, body: JSON.stringify(form) });
    setShowModal(false); setForm({ title: '', description: '', priority: 'medium', category: 'electrical', assetId: '', assignedTo: '', slaDeadline: '' }); fetchData();
  };
  const handleDelete = async (id: string) => { if (!confirm('Hapus Work Order ini?')) return; await fetch('/api/management/workorder', { method: 'DELETE', headers, body: JSON.stringify({ id }) }); fetchData(); };
  const handleStatusChange = async (id: string, status: string) => {
    await fetch('/api/management/workorder', { method: 'PUT', headers, body: JSON.stringify({ id, status }) }); fetchData();
  };

  const priorityBadge = (p: string) => {
    const m: Record<string, string> = { critical: 'bg-red-500/10 text-red-400 border-red-500/20', high: 'bg-orange-500/10 text-orange-400 border-orange-500/20', medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20', low: 'bg-[#1769FF]/10 text-blue-400 border-blue-500/20' };
    return m[p] || m.medium;
  };
  const statusBadge = (s: string) => {
    const m: Record<string, string> = { open: 'bg-[#1769FF]/10 text-blue-400 border-blue-500/20', in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/20', resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', closed: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' };
    return m[s] || m.open;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className={`text-lg font-bold ${c_text}`}>Work Order & Ticket Management</h2><p className={`text-xs ${c_sub}`}>Sistem tiket kerja — Visi CMMS</p></div>
        <div className="flex gap-2">
          <button onClick={fetchData} className={`p-2 rounded-lg border ${c_card}`}><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1769FF] hover:bg-[#4A8AFF] text-white rounded-lg text-xs font-semibold"><Plus className="w-3.5 h-3.5" /> Buat Work Order</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { l: 'Open', v: items.filter(i => i.status === 'open').length, c: 'text-blue-400' },
          { l: 'In Progress', v: items.filter(i => i.status === 'in_progress').length, c: 'text-amber-400' },
          { l: 'Resolved', v: items.filter(i => i.status === 'resolved').length, c: 'text-emerald-400' },
          { l: 'Critical', v: items.filter(i => i.priority === 'critical').length, c: 'text-red-400' },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl p-4 border ${c_card}`}><span className={`text-xs font-semibold ${c_sub}`}>{s.l}</span><h3 className={`text-2xl font-bold mt-1 ${s.c}`}>{s.v}</h3></div>
        ))}
      </div>

      <div className={`border rounded-xl overflow-hidden ${c_card}`}>
        <table className="w-full text-xs">
          <thead><tr className={c_tbl_h}>
            <th className="px-4 py-3 text-left font-semibold">Tiket</th>
            <th className="px-4 py-3 text-left font-semibold">Judul</th>
            <th className="px-4 py-3 text-left font-semibold">Prioritas</th>
            <th className="px-4 py-3 text-left font-semibold">Kategori</th>
            <th className="px-4 py-3 text-left font-semibold">Aset</th>
            <th className="px-4 py-3 text-left font-semibold">Status</th>
            <th className="px-4 py-3 text-left font-semibold">Tanggal</th>
            <th className="px-4 py-3 text-left font-semibold">Aksi</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={8} className="text-center py-8"><RefreshCw className="w-5 h-5 mx-auto animate-spin text-[#1769FF]" /></td></tr> :
            items.length === 0 ? <tr><td colSpan={8} className={`text-center py-8 ${c_sub}`}>Belum ada work order.</td></tr> :
            items.map(item => (
              <tr key={item.id} className={`border-t ${c_tbl_r}`}>
                <td className="px-4 py-3 font-mono text-blue-400">{item.ticketNumber}</td>
                <td className={`px-4 py-3 font-semibold ${c_text}`}>{item.title}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full border text-[10px] font-bold uppercase ${priorityBadge(item.priority)}`}>{item.priority}</span></td>
                <td className="px-4 py-3 capitalize">{item.category}</td>
                <td className={`px-4 py-3 ${c_sub}`}>{item.asset?.name || '-'}</td>
                <td className="px-4 py-3">
                  <select value={item.status} onChange={e => handleStatusChange(item.id, e.target.value)} className={`px-2 py-1 rounded-lg border text-[10px] font-bold ${statusBadge(item.status)} ${c_input} cursor-pointer`}>
                    <option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
                  </select>
                </td>
                <td className={`px-4 py-3 ${c_sub}`}>{new Date(item.createdAt).toLocaleDateString('id-ID')}</td>
                <td className="px-4 py-3"><button onClick={() => handleDelete(item.id)} className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg border p-6 rounded-2xl shadow-2xl space-y-4 ${c_modal}`}>
            <div className="flex items-center justify-between"><h3 className="text-base font-bold">Buat Work Order Baru</h3><button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-red-500 text-xs">Tutup</button></div>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div><label className={`block mb-1 ${c_sub}`}>Judul *</label><input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${c_input}`} placeholder="AC Presisi DC01 tidak dingin" /></div>
              <div><label className={`block mb-1 ${c_sub}`}>Deskripsi *</label><textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${c_input}`} rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={`block mb-1 ${c_sub}`}>Prioritas *</label><select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${c_input}`}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>
                <div><label className={`block mb-1 ${c_sub}`}>Kategori *</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${c_input}`}><option value="hvac">HVAC</option><option value="electrical">Electrical</option><option value="plumbing">Plumbing</option><option value="structural">Structural</option><option value="safety">Safety</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={`block mb-1 ${c_sub}`}>Asset ID</label><input value={form.assetId} onChange={e => setForm({...form, assetId: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${c_input}`} placeholder="Opsional" /></div>
                <div><label className={`block mb-1 ${c_sub}`}>SLA Deadline</label><input type="datetime-local" value={form.slaDeadline} onChange={e => setForm({...form, slaDeadline: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${c_input}`} /></div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-[#1769FF] hover:bg-[#4A8AFF] text-white rounded-lg font-semibold mt-2">Buat Work Order</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
