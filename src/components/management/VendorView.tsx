'use client';
import React, { useState, useEffect } from 'react';
import { FileSignature, Plus, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';

interface VendorContractItem {
  id: string; vendorName: string; contractTitle: string; contractType: string;
  startDate: string; endDate: string; value: number; pic: string;
  status: string; documentUrl: string | null; notes: string | null;
}

export default function VendorView({ isDark, token }: { isDark: boolean; token: string }) {
  const c_card = isDark ? 'bg-zinc-900/30 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm';
  const c_input = isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-800';
  const c_modal = isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-800';
  const c_text = isDark ? 'text-white' : 'text-zinc-800';
  const c_sub = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const c_tbl_h = isDark ? 'bg-zinc-950/40 text-zinc-400' : 'bg-zinc-100 text-zinc-600';
  const c_tbl_r = isDark ? 'hover:bg-zinc-900/10 border-zinc-800/60' : 'hover:bg-zinc-50 border-zinc-200';

  const [items, setItems] = useState<VendorContractItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ vendorName: '', contractTitle: '', contractType: 'maintenance', startDate: '', endDate: '', value: '', pic: '', notes: '' });
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchData = async () => { setLoading(true); try { const res = await fetch('/api/management/vendor', { headers }); const data = await res.json(); if (data.success) setItems(data.data); } catch(e){} setLoading(false); };
  useEffect(() => { fetchData(); }, []);

  const formatRp = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/management/vendor', { method: 'POST', headers, body: JSON.stringify(form) });
    setShowModal(false); setForm({ vendorName: '', contractTitle: '', contractType: 'maintenance', startDate: '', endDate: '', value: '', pic: '', notes: '' }); fetchData();
  };
  const handleDelete = async (id: string) => { if (!confirm('Hapus kontrak ini?')) return; await fetch('/api/management/vendor', { method: 'DELETE', headers, body: JSON.stringify({ id }) }); fetchData(); };

  const statusBadge = (s: string) => {
    const m: Record<string, string> = { active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', expiring: 'bg-amber-500/10 text-amber-400 border-amber-500/20', expired: 'bg-red-500/10 text-red-400 border-red-500/20', terminated: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' };
    return m[s] || m.active;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className={`text-lg font-bold ${c_text}`}>Vendor & Contract Management</h2><p className={`text-xs ${c_sub}`}>Pemantauan kontrak vendor — BRD §2.3</p></div>
        <div className="flex gap-2">
          <button onClick={fetchData} className={`p-2 rounded-lg border ${c_card}`}><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1769FF] hover:bg-[#4A8AFF] text-white rounded-lg text-xs font-semibold"><Plus className="w-3.5 h-3.5" /> Tambah Kontrak</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ l: 'Total Kontrak', v: items.length, c: 'text-blue-400' }, { l: 'Akan Berakhir', v: items.filter(i => i.status === 'expiring').length, c: 'text-amber-400' }, { l: 'Expired', v: items.filter(i => i.status === 'expired').length, c: 'text-red-400' }].map((s, i) => (
          <div key={i} className={`rounded-xl p-4 border ${c_card}`}><span className={`text-xs font-semibold ${c_sub}`}>{s.l}</span><h3 className={`text-2xl font-bold mt-1 ${s.c}`}>{s.v}</h3></div>
        ))}
      </div>

      <div className={`border rounded-xl overflow-hidden ${c_card}`}>
        <table className="w-full text-xs">
          <thead><tr className={c_tbl_h}>
            <th className="px-4 py-3 text-left font-semibold">Vendor</th>
            <th className="px-4 py-3 text-left font-semibold">Kontrak</th>
            <th className="px-4 py-3 text-left font-semibold">Tipe</th>
            <th className="px-4 py-3 text-left font-semibold">Periode</th>
            <th className="px-4 py-3 text-left font-semibold">Nilai</th>
            <th className="px-4 py-3 text-left font-semibold">PIC</th>
            <th className="px-4 py-3 text-left font-semibold">Status</th>
            <th className="px-4 py-3 text-left font-semibold">Aksi</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={8} className="text-center py-8"><RefreshCw className="w-5 h-5 mx-auto animate-spin text-[#1769FF]" /></td></tr> :
            items.length === 0 ? <tr><td colSpan={8} className={`text-center py-8 ${c_sub}`}>Belum ada kontrak vendor.</td></tr> :
            items.map(item => (
              <tr key={item.id} className={`border-t ${c_tbl_r}`}>
                <td className={`px-4 py-3 font-semibold ${c_text}`}>{item.vendorName}</td>
                <td className={`px-4 py-3 ${c_sub}`}>{item.contractTitle}</td>
                <td className="px-4 py-3 capitalize">{item.contractType}</td>
                <td className="px-4 py-3">{new Date(item.startDate).toLocaleDateString('id-ID')} — {new Date(item.endDate).toLocaleDateString('id-ID')}</td>
                <td className="px-4 py-3 font-mono">{formatRp(item.value)}</td>
                <td className={`px-4 py-3 ${c_sub}`}>{item.pic}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full border text-[10px] font-bold uppercase ${statusBadge(item.status)}`}>{item.status}</span></td>
                <td className="px-4 py-3"><button onClick={() => handleDelete(item.id)} className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg border p-6 rounded-2xl shadow-2xl space-y-4 ${c_modal}`}>
            <div className="flex items-center justify-between"><h3 className="text-base font-bold">Tambah Kontrak Vendor</h3><button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-red-500 text-xs">Tutup</button></div>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={`block mb-1 ${c_sub}`}>Nama Vendor *</label><input required value={form.vendorName} onChange={e => setForm({...form, vendorName: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${c_input}`} /></div>
                <div><label className={`block mb-1 ${c_sub}`}>Judul Kontrak *</label><input required value={form.contractTitle} onChange={e => setForm({...form, contractTitle: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${c_input}`} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className={`block mb-1 ${c_sub}`}>Tipe *</label><select value={form.contractType} onChange={e => setForm({...form, contractType: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${c_input}`}><option value="maintenance">Maintenance</option><option value="lease">Lease/Sewa</option><option value="insurance">Insurance</option><option value="service">Service</option></select></div>
                <div><label className={`block mb-1 ${c_sub}`}>Mulai *</label><input type="date" required value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${c_input}`} /></div>
                <div><label className={`block mb-1 ${c_sub}`}>Berakhir *</label><input type="date" required value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${c_input}`} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={`block mb-1 ${c_sub}`}>Nilai Kontrak (Rp) *</label><input type="number" required value={form.value} onChange={e => setForm({...form, value: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${c_input}`} /></div>
                <div><label className={`block mb-1 ${c_sub}`}>PIC Email *</label><input type="email" required value={form.pic} onChange={e => setForm({...form, pic: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${c_input}`} /></div>
              </div>
              <div><label className={`block mb-1 ${c_sub}`}>Catatan</label><input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${c_input}`} /></div>
              <button type="submit" className="w-full py-2.5 bg-[#1769FF] hover:bg-[#4A8AFF] text-white rounded-lg font-semibold mt-2">Simpan Kontrak</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
