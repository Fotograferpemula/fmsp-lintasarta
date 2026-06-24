'use client';
import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Trash2, RefreshCw, Calendar, AlertTriangle, MapPin, X, Clock, CheckCircle, Eye, HelpCircle } from 'lucide-react';

interface MaintenanceScheduleItem {
  id: string; assetId: string; title: string; intervalDays: number;
  lastPerformed: string; nextDue: string; assignedTo: string | null;
  status: string; notes: string | null;
  asset?: { id: string; name: string; location: string; type: string; status: string; specs?: Record<string, any>; bookValue?: number; purchaseDate?: string; lifecycleStatus?: string; photos?: string[] };
}

export default function MaintenanceView({ isDark, token }: { isDark: boolean; token: string }) {
  const c_card = isDark ? 'bg-zinc-900/30 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm';
  const c_input = isDark ? 'bg-[#1B1F26] border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-800';
  const c_modal = isDark ? 'bg-[#0F1C33] border-[#373C43] text-white' : 'bg-white border-zinc-200 text-zinc-800';
  const c_text = isDark ? 'text-white' : 'text-zinc-800';
  const c_sub = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const c_tbl_h = isDark ? 'bg-[#1B1F26]/40 text-zinc-400' : 'bg-zinc-100 text-zinc-600';
  const c_tbl_r = isDark ? 'hover:bg-zinc-900/10 border-zinc-800/60' : 'hover:bg-zinc-50 border-zinc-200';

  const [items, setItems] = useState<MaintenanceScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ assetId: '', title: '', intervalDays: '90', lastPerformed: '', assignedTo: '', notes: '' });
  const [detailItem, setDetailItem] = useState<MaintenanceScheduleItem | null>(null);
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
      scheduled: 'bg-[#3370FF]/10 text-blue-400 border-blue-500/20',
      overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
      completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };
    return map[s] || map.scheduled;
  };

  const assetStatusBadge = (s: string) => {
    const map: Record<string, { color: string; label: string }> = {
      good: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: '✅ Baik' },
      warning: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: '⚠️ Perlu Perhatian' },
      broken: { color: 'bg-red-500/10 text-red-400 border-red-500/20', label: '🔴 Rusak' },
    };
    return map[s] || map.good;
  };

  const assetTypeLabel = (t: string) => {
    const map: Record<string, string> = {
      land: '🏞️ Tanah', office: '🏢 Gedung', facility: '⚙️ Fasilitas', vehicle: '🚗 Kendaraan',
    };
    return map[t] || t;
  };

  const daysUntil = (dateStr: string) => {
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
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
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#3370FF] hover:bg-[#5B8EFF] text-white rounded-lg text-xs font-semibold"><Plus className="w-3.5 h-3.5" /> Tambah Jadwal</button>
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
            {loading ? <tr><td colSpan={7} className="text-center py-8"><RefreshCw className="w-5 h-5 mx-auto animate-spin text-[#3370FF]" /></td></tr> :
            items.length === 0 ? <tr><td colSpan={7} className={`text-center py-8 ${c_sub}`}>Belum ada jadwal maintenance.</td></tr> :
            items.map(item => (
              <tr key={item.id} className={`border-t ${c_tbl_r}`}>
                <td className={`px-4 py-3 font-semibold ${c_text}`}>{item.title}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setDetailItem(item)}
                    className="text-left group"
                  >
                    <p className="text-[#3370FF] font-semibold hover:underline cursor-pointer flex items-center gap-1">
                      {item.asset?.name || '-'}
                      <Eye className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </p>
                    {item.asset?.location && (
                      <p className={`text-[10px] ${c_sub} flex items-center gap-0.5 mt-0.5`}>
                        <MapPin className="w-2.5 h-2.5" />{item.asset.location}
                      </p>
                    )}
                  </button>
                </td>
                <td className="px-4 py-3">{item.intervalDays} hari</td>
                <td className="px-4 py-3">{new Date(item.lastPerformed).toLocaleDateString('id-ID')}</td>
                <td className="px-4 py-3">
                  <span className={daysUntil(item.nextDue) < 0 ? 'text-red-400 font-bold' : daysUntil(item.nextDue) <= 7 ? 'text-amber-400 font-bold' : ''}>
                    {new Date(item.nextDue).toLocaleDateString('id-ID')}
                  </span>
                </td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full border text-[10px] font-bold uppercase ${statusBadge(item.status)}`}>{item.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setDetailItem(item)} title="Detail" className="p-1.5 text-zinc-400 hover:text-[#3370FF] rounded-lg transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(item.id)} title="Hapus" className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md border p-6 rounded-xl shadow-2xl space-y-4 ${c_modal}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Tambah Jadwal Maintenance</h3>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('open-help', { detail: { key: 'maintenance_add' } }))}
                  className="p-1 rounded-lg hover:bg-zinc-500/10 text-[#3370FF] hover:text-[#5B8EFF] transition-all"
                  title="Lihat Bantuan Form"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-red-500 text-xs">Tutup</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div><label className={`block mb-1 ${c_sub}`}>Judul Perawatan *</label><input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${c_input}`} placeholder="Overhaul AC Presisi" /></div>
              <div><label className={`block mb-1 ${c_sub}`}>Asset ID *</label><input required value={form.assetId} onChange={e => setForm({...form, assetId: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${c_input}`} placeholder="ID aset terkait" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={`block mb-1 ${c_sub}`}>Interval (hari) *</label><input type="number" required value={form.intervalDays} onChange={e => setForm({...form, intervalDays: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${c_input}`} /></div>
                <div><label className={`block mb-1 ${c_sub}`}>Terakhir Dilakukan *</label><input type="date" required value={form.lastPerformed} onChange={e => setForm({...form, lastPerformed: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${c_input}`} /></div>
              </div>
              <div><label className={`block mb-1 ${c_sub}`}>Teknisi (NIP)</label><input value={form.assignedTo} onChange={e => setForm({...form, assignedTo: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${c_input}`} placeholder="Opsional" /></div>
              <div><label className={`block mb-1 ${c_sub}`}>Catatan</label><input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${c_input}`} /></div>
              <button type="submit" className="w-full py-2.5 bg-[#3370FF] hover:bg-[#5B8EFF] text-white rounded-lg font-semibold mt-2">Simpan Jadwal</button>
            </form>
          </div>
        </div>
      )}

      {/* Detail PM + Asset Modal */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg border rounded-xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col ${c_modal}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: isDark ? '#1A2744' : '#E5E7EB' }}>
              <div>
                <h3 className={`text-sm font-bold ${c_text}`}>Detail Preventive Maintenance</h3>
                <p className={`text-[10px] ${c_sub}`}>{detailItem.title}</p>
              </div>
              <button onClick={() => setDetailItem(null)} className={`text-xs ${c_sub} hover:text-red-400 transition-colors`}>✕ Tutup</button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">

              {/* PM Schedule Info */}
              <div>
                <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${c_sub}`}>📅 Jadwal Maintenance</h4>
                <div className={`p-4 rounded-xl border ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className={c_sub}>Judul Perawatan</p>
                      <p className={`font-bold ${c_text}`}>{detailItem.title}</p>
                    </div>
                    <div>
                      <p className={c_sub}>Interval</p>
                      <p className={`font-bold ${c_text}`}>{detailItem.intervalDays} hari</p>
                    </div>
                    <div>
                      <p className={c_sub}>Terakhir Dilakukan</p>
                      <p className={`font-bold ${c_text}`}>{new Date(detailItem.lastPerformed).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div>
                      <p className={c_sub}>Jadwal Selanjutnya</p>
                      <p className={`font-bold ${daysUntil(detailItem.nextDue) < 0 ? 'text-red-400' : daysUntil(detailItem.nextDue) <= 7 ? 'text-amber-400' : c_text}`}>
                        {new Date(detailItem.nextDue).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {daysUntil(detailItem.nextDue) < 0 && <span className="ml-1 text-red-400">({Math.abs(daysUntil(detailItem.nextDue))} hari terlambat)</span>}
                        {daysUntil(detailItem.nextDue) >= 0 && daysUntil(detailItem.nextDue) <= 7 && <span className="ml-1 text-amber-400">({daysUntil(detailItem.nextDue)} hari lagi)</span>}
                      </p>
                    </div>
                    <div>
                      <p className={c_sub}>Status</p>
                      <span className={`px-2 py-1 rounded-full border text-[10px] font-bold uppercase ${statusBadge(detailItem.status)}`}>{detailItem.status}</span>
                    </div>
                    <div>
                      <p className={c_sub}>Teknisi</p>
                      <p className={`font-bold ${c_text}`}>{detailItem.assignedTo || '—'}</p>
                    </div>
                  </div>
                  {detailItem.notes && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: isDark ? '#1A2744' : '#E5E7EB' }}>
                      <p className={c_sub}>Catatan</p>
                      <p className={`${c_text} mt-0.5`}>{detailItem.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Asset Detail Info */}
              {detailItem.asset && (
                <div>
                  <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${c_sub}`}>🏗️ Detail Aset yang di-PM</h4>
                  <div className={`p-4 rounded-xl border ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <p className={c_sub}>Nama Aset</p>
                        <p className={`font-bold text-sm ${c_text}`}>{detailItem.asset.name}</p>
                      </div>
                      <div>
                        <p className={c_sub}>Tipe</p>
                        <p className={`font-bold ${c_text}`}>{assetTypeLabel(detailItem.asset.type)}</p>
                      </div>
                      <div>
                        <p className={c_sub}>Kondisi Aset</p>
                        <span className={`px-2 py-1 rounded-full border text-[10px] font-bold ${assetStatusBadge(detailItem.asset.status).color}`}>
                          {assetStatusBadge(detailItem.asset.status).label}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <p className={c_sub}>Lokasi</p>
                        <p className={`font-bold ${c_text} flex items-center gap-1`}>
                          <MapPin className="w-3 h-3 text-[#3370FF]" />{detailItem.asset.location}
                        </p>
                      </div>
                      {detailItem.asset.bookValue != null && (
                        <div>
                          <p className={c_sub}>Nilai Buku</p>
                          <p className={`font-bold ${c_text}`}>Rp {detailItem.asset.bookValue.toLocaleString('id-ID')}</p>
                        </div>
                      )}
                      {detailItem.asset.purchaseDate && (
                        <div>
                          <p className={c_sub}>Tanggal Beli</p>
                          <p className={`font-bold ${c_text}`}>{new Date(detailItem.asset.purchaseDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                      )}
                      {detailItem.asset.lifecycleStatus && (
                        <div>
                          <p className={c_sub}>Status Lifecycle</p>
                          <p className={`font-bold capitalize ${c_text}`}>{detailItem.asset.lifecycleStatus}</p>
                        </div>
                      )}
                    </div>

                    {/* Dynamic Specs */}
                    {detailItem.asset.specs && Object.keys(detailItem.asset.specs).length > 0 && (
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: isDark ? '#1A2744' : '#E5E7EB' }}>
                        <p className={`font-semibold mb-2 ${c_sub}`}>Spesifikasi Teknis</p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(detailItem.asset.specs).map(([key, val]) => (
                            <div key={key}>
                              <p className={`${c_sub} capitalize`}>{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</p>
                              <p className={`font-bold ${c_text}`}>{String(val)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Asset Photos */}
                    {detailItem.asset.photos && detailItem.asset.photos.length > 0 && (
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: isDark ? '#1A2744' : '#E5E7EB' }}>
                        <p className={`font-semibold mb-2 ${c_sub}`}>📷 Foto Aset ({detailItem.asset.photos.length})</p>
                        <div className="grid grid-cols-2 gap-2">
                          {detailItem.asset.photos.map((url, idx) => (
                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                              className="relative rounded-xl overflow-hidden border border-zinc-700 hover:ring-2 hover:ring-[#3370FF] transition-all cursor-zoom-in">
                              <img src={url} alt={`Foto aset ${idx + 1}`} className="w-full h-28 object-cover" />
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1">
                                <p className="text-[9px] text-white font-bold">Foto {idx + 1}</p>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
