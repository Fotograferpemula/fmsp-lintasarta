'use client';
import React, { useState, useEffect } from 'react';
import { Settings, Plus, RefreshCw, Search, Trash2, Edit, ToggleLeft, ToggleRight, Save, X, ChevronRight } from 'lucide-react';

interface MasterDataItem {
  id: string; category: string; code: string; label: string; description: string; isActive: boolean; sortOrder: number; createdAt: string;
}
interface CategoryInfo {
  category: string; count: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  asset_type: 'Tipe Aset',
  facility_type: 'Jenis Fasilitas',
  location: 'Lokasi Gedung',
  document_type: 'Tipe Dokumen Legal',
  asset_status: 'Status Kondisi Aset',
  department: 'Departemen',
  maintenance_type: 'Tipe Pemeliharaan',
  vendor_category: 'Kategori Vendor',
};

export default function AdminView({ isDark, token }: { isDark: boolean; token: string }) {
  const c_card = isDark ? 'bg-zinc-900/30 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm';
  const c_input = isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-800';
  const c_text = isDark ? 'text-white' : 'text-zinc-800';
  const c_sub = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const c_inner = isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200';
  const c_tbl_h = isDark ? 'bg-zinc-950/40 text-zinc-400' : 'bg-zinc-100 text-zinc-600';
  const c_tbl_r = isDark ? 'hover:bg-zinc-900/10 border-zinc-800/60' : 'hover:bg-zinc-50 border-zinc-200';

  const [items, setItems] = useState<MasterDataItem[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ label: '', code: '', description: '', sortOrder: 0, isActive: true });
  const [newItem, setNewItem] = useState({ category: '', code: '', label: '', description: '', sortOrder: 0 });
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchData = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const params = activeCategory ? `?category=${activeCategory}` : '';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
      const res = await fetch(`/api/management/admin${params}`, { headers, signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setFetchError(errData.error || `Error ${res.status}`);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
        if (data.categories) setCategories(data.categories);
      } else {
        setFetchError(data.error || 'Gagal memuat data');
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        setFetchError('Request timeout — server tidak merespons dalam 10 detik.');
      } else {
        setFetchError(e.message || 'Gagal terhubung ke server.');
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeCategory]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/management/admin', {
        method: 'POST', headers,
        body: JSON.stringify({ ...newItem, category: newItem.category || activeCategory }),
      }).then(r => r.json());
      if (res.success) {
        setShowAddModal(false);
        setNewItem({ category: '', code: '', label: '', description: '', sortOrder: 0 });
        fetchData();
      } else { alert(res.error); }
    } catch (e) {}
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch('/api/management/admin', {
        method: 'PUT', headers,
        body: JSON.stringify({ id, ...editData }),
      }).then(r => r.json());
      if (res.success) { setEditingId(null); fetchData(); } else { alert(res.error); }
    } catch (e) {}
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Hapus "${label}"?`)) return;
    try {
      const res = await fetch('/api/management/admin', {
        method: 'DELETE', headers,
        body: JSON.stringify({ id }),
      }).then(r => r.json());
      if (res.success) fetchData();
      else alert(res.error);
    } catch (e) {}
  };

  const handleToggleActive = async (item: MasterDataItem) => {
    try {
      await fetch('/api/management/admin', {
        method: 'PUT', headers,
        body: JSON.stringify({ id: item.id, isActive: !item.isActive }),
      }).then(r => r.json());
      fetchData();
    } catch (e) {}
  };

  const startEdit = (item: MasterDataItem) => {
    setEditingId(item.id);
    setEditData({ label: item.label, code: item.code, description: item.description, sortOrder: item.sortOrder, isActive: item.isActive });
  };

  const filtered = items.filter(i =>
    i.label.toLowerCase().includes(search.toLowerCase()) ||
    i.code.toLowerCase().includes(search.toLowerCase())
  );

  const allCategories = Object.keys(CATEGORY_LABELS);
  // Merge API categories with predefined
  const displayCategories = allCategories.map(cat => ({
    category: cat,
    count: categories.find(c => c.category === cat)?.count || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-bold flex items-center gap-2 ${c_text}`}><Settings className="w-5 h-5 text-[#1769FF]" /> Admin — Master Data</h2>
          <p className={`text-xs ${c_sub}`}>Kelola jenis fasilitas, tipe aset, lokasi, dan referensi data lainnya</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className={`p-2 rounded-lg border ${c_card}`}><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => { setShowAddModal(true); setNewItem({ ...newItem, category: activeCategory }); }} className="flex items-center gap-2 px-4 py-2 bg-[#1769FF] hover:bg-[#4A8AFF] text-white rounded-lg text-xs font-semibold transition-colors">
            <Plus className="w-3.5 h-3.5" /> Tambah Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Category Sidebar */}
        <div className="col-span-3">
          <div className={`border rounded-xl p-3 space-y-1 ${c_card}`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 ${c_sub}`}>Kategori</p>
            <button
              onClick={() => setActiveCategory('')}
              className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${activeCategory === '' ? 'bg-[#1769FF] text-white' : `${c_sub} ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}`}
            >
              <span>Semua Data</span>
              <span className="text-[10px] opacity-70">{items.length || '—'}</span>
            </button>
            {displayCategories.map(cat => (
              <button
                key={cat.category}
                onClick={() => setActiveCategory(cat.category)}
                className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${activeCategory === cat.category ? 'bg-[#1769FF] text-white' : `${c_sub} ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}`}
              >
                <span>{CATEGORY_LABELS[cat.category]}</span>
                {cat.count > 0 && <span className="text-[10px] opacity-70">{cat.count}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="col-span-9">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${c_sub}`} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari label atau kode..." className={`pl-9 pr-3 py-2.5 text-xs border rounded-lg w-full ${c_input}`} />
            </div>
          </div>

          <div className={`border rounded-xl overflow-hidden ${c_card}`}>
            <table className="w-full text-xs">
              <thead><tr className={c_tbl_h}>
                <th className="px-4 py-3 text-left font-semibold w-8">#</th>
                <th className="px-4 py-3 text-left font-semibold">Label</th>
                <th className="px-4 py-3 text-left font-semibold">Kode</th>
                <th className="px-4 py-3 text-left font-semibold">Kategori</th>
                <th className="px-4 py-3 text-left font-semibold">Deskripsi</th>
                <th className="px-4 py-3 text-center font-semibold">Status</th>
                <th className="px-4 py-3 text-center font-semibold">Urutan</th>
                <th className="px-4 py-3 text-center font-semibold">Aksi</th>
              </tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-10">
                    <RefreshCw className="w-5 h-5 mx-auto animate-spin text-[#1769FF]" />
                    <p className={`text-xs mt-2 ${c_sub}`}>Memuat data...</p>
                  </td></tr>
                ) : fetchError ? (
                  <tr><td colSpan={8} className="text-center py-10">
                    <p className="text-red-500 text-xs font-semibold">{fetchError}</p>
                    <button onClick={fetchData} className="mt-2 text-xs text-[#1769FF] hover:underline">Coba lagi</button>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className={`text-center py-10 ${c_sub}`}>Belum ada data{activeCategory ? ` di kategori "${CATEGORY_LABELS[activeCategory] || activeCategory}"` : ''}. Klik "Tambah Data" untuk memulai.</td></tr>
                ) :
                filtered.map((item, idx) => (
                  <tr key={item.id} className={`border-t ${c_tbl_r}`}>
                    <td className={`px-4 py-3 ${c_sub}`}>{idx+1}</td>
                    {editingId === item.id ? (
                      <React.Fragment>
                        <td className="px-4 py-2"><input value={editData.label} onChange={e => setEditData({...editData, label: e.target.value})} className={`w-full px-2 py-1.5 border rounded text-xs ${c_input}`} /></td>
                        <td className="px-4 py-2"><input value={editData.code} onChange={e => setEditData({...editData, code: e.target.value})} className={`w-full px-2 py-1.5 border rounded text-xs ${c_input}`} /></td>
                        <td className={`px-4 py-3 ${c_sub}`}><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'}`}>{CATEGORY_LABELS[item.category] || item.category}</span></td>
                        <td className="px-4 py-2"><input value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} className={`w-full px-2 py-1.5 border rounded text-xs ${c_input}`} /></td>
                        <td className="px-4 py-2 text-center">
                          <button onClick={() => setEditData({...editData, isActive: !editData.isActive})}>
                            {editData.isActive ? <ToggleRight className="w-5 h-5 text-emerald-500 mx-auto" /> : <ToggleLeft className="w-5 h-5 text-zinc-400 mx-auto" />}
                          </button>
                        </td>
                        <td className="px-4 py-2"><input type="number" value={editData.sortOrder} onChange={e => setEditData({...editData, sortOrder: parseInt(e.target.value) || 0})} className={`w-14 px-2 py-1.5 border rounded text-xs text-center ${c_input}`} /></td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handleUpdate(item.id)} className="p-1.5 bg-[#1769FF] text-white rounded-lg hover:bg-[#4A8AFF]"><Save className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 bg-zinc-200 text-zinc-600 rounded-lg hover:bg-zinc-300"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        <td className={`px-4 py-3 font-semibold ${c_text}`}>{item.label}</td>
                        <td className="px-4 py-3"><code className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'}`}>{item.code}</code></td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'}`}>{CATEGORY_LABELS[item.category] || item.category}</span></td>
                        <td className={`px-4 py-3 max-w-[160px] truncate ${c_sub}`} title={item.description}>{item.description || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => handleToggleActive(item)}>
                            {item.isActive ? <ToggleRight className="w-5 h-5 text-emerald-500 mx-auto" /> : <ToggleLeft className="w-5 h-5 text-zinc-400 mx-auto" />}
                          </button>
                        </td>
                        <td className={`px-4 py-3 text-center ${c_sub}`}>{item.sortOrder}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => startEdit(item)} className={`p-1.5 rounded-lg border ${isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-100'}`}><Edit className="w-3.5 h-3.5 text-amber-500" /></button>
                            <button onClick={() => handleDelete(item.id, item.label)} className={`p-1.5 rounded-lg border ${isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-100'}`}><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                          </div>
                        </td>
                      </React.Fragment>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Tambah Data */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md border rounded-2xl shadow-2xl p-6 space-y-4 ${c_card} ${isDark ? 'bg-[#0F1C33]' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-base font-bold ${c_text}`}>Tambah Master Data</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-red-500 text-xs font-semibold">✕</button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-500 mb-1">Kategori</label>
                <select required value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className={`w-full px-3 py-2.5 border rounded-lg ${c_input}`}>
                  <option value="">— Pilih Kategori —</option>
                  {allCategories.map(cat => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-500 mb-1">Kode (unik)</label>
                  <input required value={newItem.code} onChange={e => setNewItem({...newItem, code: e.target.value})} placeholder="contoh: ac_split" className={`w-full px-3 py-2.5 border rounded-lg ${c_input}`} />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Label</label>
                  <input required value={newItem.label} onChange={e => setNewItem({...newItem, label: e.target.value})} placeholder="contoh: AC Split" className={`w-full px-3 py-2.5 border rounded-lg ${c_input}`} />
                </div>
              </div>
              <div>
                <label className="block text-zinc-500 mb-1">Deskripsi (opsional)</label>
                <input value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} placeholder="Keterangan tambahan" className={`w-full px-3 py-2.5 border rounded-lg ${c_input}`} />
              </div>
              <div>
                <label className="block text-zinc-500 mb-1">Urutan Tampil</label>
                <input type="number" value={newItem.sortOrder} onChange={e => setNewItem({...newItem, sortOrder: parseInt(e.target.value) || 0})} className={`w-full px-3 py-2.5 border rounded-lg ${c_input}`} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className={`flex-1 py-2.5 border rounded-xl font-semibold ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white' : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700'}`}>Batal</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#1769FF] hover:bg-[#4A8AFF] text-white rounded-xl font-semibold">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
