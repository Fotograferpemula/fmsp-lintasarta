'use client';
import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Trash2, Edit3, RefreshCw, Calendar, AlertTriangle } from 'lucide-react';

interface MaintenanceScheduleItem {
  id: string; assetId: string; title: string; intervalDays: number;
  lastPerformed: string; nextDue: string; assignedTo: string | null;
  status: string; notes: string | null;
  asset?: { name: string; location: string };
}

export default function MaintenanceView({ isDark, token }: { isDark: boolean; token: string }) {
  const c_card = isDark ? 'bg-zinc-900/30 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm';
  const c_input = isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-800';
  const c_modal = isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-800';
  const c_text = isDark ? 'text-white' : 'text-zinc-800';
  const c_sub = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const c_tbl_h = isDark ? 'bg-zinc-950/40 text-zinc-400' : 'bg-zinc-100 text-zinc-600';
  const c_tbl_r = isDark ? 'hover:bg-zinc-900/10 border-zinc-800/60' : 'hover:bg-zinc-50 border-zinc-200';

  const [items, setItems] = useState<MaintenanceScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ assetId: '', title: '', intervalDays: '90', lastPerformed: '', assignedTo: '', notes: '' });
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/management/maintenance', { headers });
      const data = await res.json();
      if (data.success) setItems(data.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/management/maintenance', { method: 'POST', headers, body: JSON.stringify(form) });
    setShowModal(false);
    setForm({ assetId: '', title: '', intervalDays: '90', lastPerformed: '', assignedTo: '', notes: '' });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus jadwal maintenance ini?')) return;
    await fetch('/api/management/maintenance', { method: 'DELETE', headers, body: JSON.stringify({ id }) });
    fetchData();
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      scheduled: 'bg-[#1769FF]/10 text-blue-400 border-blue-500/20',
      overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
      completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };
    return map[s] || map.scheduled;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-bold ${c_text}`}>Preventive Maintenance Schedule</h2>
          <p className={`text-xs ${c_sub}`}>Jadwal perawatan rutin aset — BRD §2.3</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className={`p-2 rounded-lg border ${c_card}`}><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1769FF] hover:bg-[#4A8AFF] text-white rounded-lg text-xs font-semibold"><Plus className="w-3.5 h-3.5" /> Tambah Jadwal</button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Jadwal', val: items.length, color: 'text-blue-400' },
          { label: 'Overdue', val: items.filter(i => i.status === 'overdue').length, color: 'text-red-400' },
          { label: 'Selesai', val: items.filter(i => i.status === 'completed').length, color: 'text-emerald-400' },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl p-4 border ${c_card}`}>
            <span className={`text-xs font-semibold ${c_sub}`}>{s.label}</span>
            <h3 className={`text-2xl font-bold mt-1 ${s.color}`}>{s.val}</h3>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className={`border rounded-xl overflow-hidden ${c_card}`}>
        <table className="w-full text-xs">
          <thead><tr className={c_tbl_h}>
            <th className="px-4 py-3 text-left font-semibold">Judul</th>
            <th className="px-4 py-3 text-left font-semibold">Aset</th>
            <th className="px-4 py-3 text-left font-semibold">Interval</th>
            <th className="px-4 py-3 text-left font-semibold">Terakhir</th>
            <th className="px-4 py-3 text-left font-semibold">Selanjutnya</th>
            <th className="px-4 py-3 text-left font-semibold">Status</th>
            <th className="px-4 py-3 text-left font-semibold">Aksi</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="text-center py-8"><RefreshCw className="w-5 h-5 mx-auto animate-spin text-[#1769FF]" /></td></tr> :
            items.length === 0 ? <tr><td colSpan={7} className={`text-center py-8 ${c_sub}`}>Belum ada jadwal maintenance.</td></tr> :
            items.map(item => (
              <tr key={item.id} className={`border-t ${c_tbl_r}`}>
                <td className={`px-4 py-3 font-semibold ${c_text}`}>{item.title}</td>
                <td className={`px-4 py-3 ${c_sub}`}>{item.asset?.name || '-'}</td>
                <td className="px-4 py-3">{item.intervalDays} hari</td>
                <td className="px-4 py-3">{new Date(item.lastPerformed).toLocaleDateString('id-ID')}</td>
                <td className="px-4 py-3">{new Date(item.nextDue).toLocaleDateString('id-ID')}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full border text-[10px] font-bold uppercase ${statusBadge(item.status)}`}>{item.status}</span></td>
                <td className="px-4 py-3"><button onClick={() => handleDelete(item.id)} className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md border p-6 rounded-2xl shadow-2xl space-y-4 ${c_modal}`}>
            <div className="flex items-center justify-between"><h3 className="text-base font-bold">Tambah Jadwal Maintenance</h3><button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-red-500 text-xs">Tutup</button></div>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div><label className={`block mb-1 ${c_sub}`}>Judul Perawatan *</label><input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${c_input}`} placeholder="Overhaul AC Presisi" /></div>
              <div><label className={`block mb-1 ${c_sub}`}>Asset ID *</label><input required value={form.assetId} onChange={e => setForm({...form, assetId: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${c_input}`} placeholder="ID aset terkait" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={`block mb-1 ${c_sub}`}>Interval (hari) *</label><input type="number" required value={form.intervalDays} onChange={e => setForm({...form, intervalDays: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${c_input}`} /></div>
                <div><label className={`block mb-1 ${c_sub}`}>Terakhir Dilakukan *</label><input type="date" required value={form.lastPerformed} onChange={e => setForm({...form, lastPerformed: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${c_input}`} /></div>
              </div>
              <div><label className={`block mb-1 ${c_sub}`}>Teknisi (NIP)</label><input value={form.assignedTo} onChange={e => setForm({...form, assignedTo: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${c_input}`} placeholder="Opsional" /></div>
              <div><label className={`block mb-1 ${c_sub}`}>Catatan</label><input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${c_input}`} /></div>
              <button type="submit" className="w-full py-2.5 bg-[#1769FF] hover:bg-[#4A8AFF] text-white rounded-lg font-semibold mt-2">Simpan Jadwal</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
