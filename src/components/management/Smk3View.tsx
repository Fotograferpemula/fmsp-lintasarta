'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, ShieldAlert, CheckCircle, AlertTriangle, Calendar, User, HelpCircle } from 'lucide-react';

interface Smk3Item {
  id: string;
  item: string;
  location: string;
  lastChecked: string;
  status: string; // ok | warning | danger
  checkedBy: string;
}

interface Smk3ViewProps {
  isDark: boolean; token?: string;
}

export default function Smk3View({ isDark, token }: Smk3ViewProps) {
  const [items, setItems] = useState<Smk3Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Smk3Item | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    item: '',
    location: '',
    lastChecked: '',
    status: 'ok',
    checkedBy: '',
  });

  const c_card = isDark ? 'bg-zinc-900/30 border-zinc-800/80 text-white' : 'bg-white border-zinc-200 text-zinc-800 shadow-sm';
  const c_table_hdr = isDark ? 'bg-[#1B1F26]/40 border-zinc-800/80 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600';
  const c_table_row = isDark ? 'hover:bg-zinc-900/10 border-zinc-800/60' : 'hover:bg-zinc-100/50 border-zinc-200';
  const c_input = isDark ? 'bg-[#1B1F26] border-zinc-800 text-white focus:border-[#3370FF]' : 'bg-white border-zinc-200 text-zinc-800 focus:border-[#3370FF]';
  const c_modal = isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-800';
  const c_text_title = isDark ? 'text-white' : 'text-zinc-800';
  const c_text_sub = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const c_border = isDark ? 'border-zinc-800/80' : 'border-zinc-200';

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/management/smk3', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }).then(r => r.json());
      if (res.success) {
        setItems(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch SMK3 items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      item: '',
      location: '',
      lastChecked: new Date().toISOString().slice(0, 10),
      status: 'ok',
      checkedBy: 'Admin FM',
    });
    setShowModal(true);
  };

  const openEditModal = (item: Smk3Item) => {
    setEditingItem(item);
    setFormData({
      item: item.item,
      location: item.location,
      lastChecked: new Date(item.lastChecked).toISOString().slice(0, 10),
      status: item.status,
      checkedBy: item.checkedBy,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res;
      if (editingItem) {
        res = await fetch('/api/management/smk3', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify({ id: editingItem.id, ...formData }),
        }).then(r => r.json());
      } else {
        res = await fetch('/api/management/smk3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify(formData),
        }).then(r => r.json());
      }

      if (res.success) {
        setShowModal(false);
        fetchItems();
      } else {
        alert(res.error);
      }
    } catch (err) {
      console.error('Error saving SMK3 item:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus poin SMK3 ini?')) return;
    try {
      const res = await fetch('/api/management/smk3', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ id }),
      }).then(r => r.json());

      if (res.success) {
        fetchItems();
      } else {
        alert(res.error);
      }
    } catch (err) {
      console.error('Error deleting SMK3 item:', err);
    }
  };

  const filtered = items.filter(i => {
    const matchesSearch = i.item.toLowerCase().includes(search.toLowerCase()) || 
                          i.location.toLowerCase().includes(search.toLowerCase()) ||
                          i.checkedBy.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalCount = items.length;
  const okCount = items.filter(i => i.status === 'ok').length;
  const warningCount = items.filter(i => i.status === 'warning').length;
  const dangerCount = items.filter(i => i.status === 'danger').length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`p-6 rounded-xl border ${c_card}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${c_text_sub}`}>Total Titik HSE</span>
          <h2 className="text-3xl font-extrabold mt-2">{totalCount} Lokasi</h2>
          <p className="text-[10px] text-zinc-500 mt-1">Poin inspeksi SMK3 K3</p>
        </div>
        <div className={`p-6 rounded-xl border ${c_card}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${c_text_sub}`}>Status Aman (OK)</span>
          <h2 className="text-3xl font-extrabold mt-2 text-emerald-500">{okCount} Poin</h2>
          <p className="text-[10px] text-zinc-500 mt-1">Lulus pengecekan</p>
        </div>
        <div className={`p-6 rounded-xl border ${c_card}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${c_text_sub}`}>Warning / Perbaikan</span>
          <h2 className="text-3xl font-extrabold mt-2 text-amber-500">{warningCount} Poin</h2>
          <p className="text-[10px] text-zinc-500 mt-1">Inspeksi butuh perhatian</p>
        </div>
        <div className={`p-6 rounded-xl border ${c_card}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${c_text_sub}`}>Bahaya / Kritis</span>
          <h2 className="text-3xl font-extrabold mt-2 text-red-500">{dangerCount} Poin</h2>
          <p className="text-[10px] text-zinc-500 mt-1">Kerusakan fatal / darurat</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className={`flex flex-col sm:flex-row gap-4 items-center justify-between p-4 border rounded-xl ${c_card}`}>
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
            <Search className="w-4 h-4" />
          </span>
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari poin K3, lokasi, atau pemeriksa..." 
            className={`w-full pl-9 pr-4 py-2 border rounded-xl text-xs outline-none transition-colors ${c_input}`}
          />
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 border rounded-xl text-xs outline-none ${c_input}`}
          >
            <option value="all">Semua Status</option>
            <option value="ok">Aman (OK)</option>
            <option value="warning">Warning</option>
            <option value="danger">Danger (Bahaya)</option>
          </select>

          <button 
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#3370FF] hover:bg-[#5B8EFF] text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Tambah Poin K3
          </button>
        </div>
      </div>

      {/* SMK3 Checklist Table */}
      <div className={`border rounded-xl overflow-hidden ${c_card}`}>
        {loading ? (
          <div className="p-12 text-center text-zinc-500">Loading checklist SMK3...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">Tidak ada data checklist SMK3 ditemukan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[10px] uppercase font-bold tracking-wider ${c_table_hdr}`}>
                  <th className="py-4 px-6">Poin Proteksi / Alat</th>
                  <th className="py-4 px-6">Lokasi Fisik</th>
                  <th className="py-4 px-6">Terakhir Pengecekan</th>
                  <th className="py-4 px-6">Petugas Pemeriksa</th>
                  <th className="py-4 px-6">Status HSE</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {filtered.map(i => (
                  <tr key={i.id} className={`transition-colors border-b ${c_table_row}`}>
                    <td className="py-4 px-6 font-semibold">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i.status === 'danger' ? 'bg-red-500/10 text-red-500 animate-pulse' : i.status === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          {i.status === 'ok' ? <CheckCircle className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                        </div>
                        <p className={`font-bold ${c_text_title}`}>{i.item}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-zinc-500">{i.location}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(i.lastChecked).toLocaleDateString('id-ID')}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <User className="w-3.5 h-3.5" />
                        <span>{i.checkedBy}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase ${i.status === 'ok' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : i.status === 'warning' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                        {i.status === 'ok' ? 'Aman' : i.status === 'warning' ? 'Warning' : 'Bahaya'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(i)}
                          className={`p-1.5 border rounded-lg hover:text-[#3370FF] ${isDark ? 'border-zinc-800 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-100'}`}
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(i.id)}
                          className={`p-1.5 border rounded-lg hover:text-red-500 ${isDark ? 'border-zinc-800 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-100'}`}
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md border p-6 rounded-xl shadow-2xl space-y-6 ${c_modal}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${c_border}`}>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">{editingItem ? 'Perbarui Inspeksi K3' : 'Tambah Inspeksi Baru'}</h3>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('open-help', { detail: { key: 'smk3_add' } }))}
                  className="p-1 rounded-lg hover:bg-zinc-500/10 text-[#3370FF] hover:text-[#5B8EFF] transition-all"
                  title="Lihat Bantuan Form"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-red-500 text-xs">Tutup</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-500 mb-1">Nama Alat / Titik K3</label>
                <input 
                  type="text" 
                  required
                  value={formData.item} 
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                  placeholder="APAR CO2 6kg"
                  className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">Lokasi Gedung / Ruangan</label>
                <input 
                  type="text" 
                  required
                  value={formData.location} 
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Koridor Depan Data Center Lt. 1"
                  className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1">Tanggal Inspeksi</label>
                  <input 
                    type="date" 
                    required
                    value={formData.lastChecked} 
                    onChange={(e) => setFormData({ ...formData, lastChecked: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Status K3</label>
                  <select 
                    value={formData.status} 
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`}
                  >
                    <option value="ok">Aman (OK)</option>
                    <option value="warning">Warning / Perlu Maintenance</option>
                    <option value="danger">Bahaya / Rusak Parah</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">Nama Petugas Pemeriksa</label>
                <input 
                  type="text" 
                  required
                  value={formData.checkedBy} 
                  onChange={(e) => setFormData({ ...formData, checkedBy: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                />
              </div>

              <button type="submit" className="w-full py-2.5 bg-[#3370FF] hover:bg-[#5B8EFF] text-white rounded-lg font-semibold transition-colors mt-4">
                {editingItem ? 'Simpan Perubahan' : 'Simpan Inspeksi'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
