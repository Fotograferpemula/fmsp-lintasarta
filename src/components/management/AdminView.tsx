'use client';
import React, { useState, useEffect } from 'react';
import { Settings, Plus, RefreshCw, Search, Trash2, Edit, ToggleLeft, ToggleRight, Save, X, ChevronRight, Mail, Building2, Bell, Globe, Eye, EyeOff, Send, HelpCircle } from 'lucide-react';

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
  const c_input = isDark ? 'bg-[#1B1F26] border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-800';
  const c_text = isDark ? 'text-white' : 'text-zinc-800';
  const c_sub = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const c_inner = isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200';
  const c_tbl_h = isDark ? 'bg-[#1B1F26]/40 text-zinc-400' : 'bg-zinc-100 text-zinc-600';
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
  const [adminTab, setAdminTab] = useState<'master' | 'settings'>('master');

  // Settings state
  const [settingsData, setSettingsData] = useState<Record<string, { key: string; value: string; label: string; group: string; inputType: string }[]>>({});
  const [settingsEdits, setSettingsEdits] = useState<Record<string, string>>({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string; previewUrl?: string } | null>(null);

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

  // ─── Settings fetch ───
  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/management/app-settings', { headers });
      const data = await res.json();
      if (data.success) {
        setSettingsData(data.data);
        // Init edits with current values
        const edits: Record<string, string> = {};
        for (const group of Object.values(data.data) as any[]) {
          for (const s of group) { edits[s.key] = s.value; }
        }
        setSettingsEdits(edits);
      }
    } catch (e) {}
    setSettingsLoading(false);
  };

  useEffect(() => { if (adminTab === 'settings') fetchSettings(); }, [adminTab]);

  const saveSettings = async () => {
    setSettingsSaving(true);
    setSettingsMsg('');
    try {
      const updates = Object.entries(settingsEdits).map(([key, value]) => ({ key, value }));
      const res = await fetch('/api/management/app-settings', {
        method: 'PUT', headers,
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      setSettingsMsg(data.success ? '✅ Pengaturan berhasil disimpan!' : `❌ ${data.error}`);
      if (data.success) fetchSettings();
    } catch (e) {
      setSettingsMsg('❌ Gagal menyimpan pengaturan.');
    }
    setSettingsSaving(false);
    setTimeout(() => setSettingsMsg(''), 5000);
  };

  const sendTestEmail = async () => {
    setTestEmailLoading(true);
    setTestEmailResult(null);
    try {
      const res = await fetch('/api/management/app-settings', { method: 'POST', headers });
      const data = await res.json();
      setTestEmailResult(data);
    } catch (e) {
      setTestEmailResult({ success: false, message: 'Gagal mengirim test email.' });
    }
    setTestEmailLoading(false);
  };

  const GROUP_META: Record<string, { icon: React.ReactNode; label: string; desc: string }> = {
    smtp: { icon: <Mail className="w-4 h-4 text-[#3370FF]" />, label: '📧 SMTP / Email', desc: 'Konfigurasi server email keluar' },
    notification: { icon: <Bell className="w-4 h-4 text-amber-500" />, label: '🔔 Notifikasi', desc: 'Pengaturan penerima dan threshold notifikasi' },
    company: { icon: <Building2 className="w-4 h-4 text-emerald-500" />, label: '🏢 Perusahaan', desc: 'Branding dan identitas perusahaan' },
    system: { icon: <Globe className="w-4 h-4 text-purple-500" />, label: '🌐 Sistem', desc: 'Konfigurasi teknis aplikasi' },
  };

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
          <h2 className={`text-lg font-bold flex items-center gap-2 ${c_text}`}><Settings className="w-5 h-5 text-[#3370FF]" /> Admin Panel</h2>
          <p className={`text-xs ${c_sub}`}>Kelola master data dan pengaturan sistem</p>
        </div>
        <div className="flex gap-2">
          {/* Tab Switcher */}
          <div className={`flex rounded-xl border overflow-hidden text-xs font-semibold ${c_card}`}>
            <button onClick={() => setAdminTab('master')} className={`px-4 py-2 transition-colors ${adminTab === 'master' ? 'bg-[#3370FF] text-white' : c_sub}`}>Master Data</button>
            <button onClick={() => setAdminTab('settings')} className={`px-4 py-2 transition-colors ${adminTab === 'settings' ? 'bg-[#3370FF] text-white' : c_sub}`}>⚙️ Pengaturan Sistem</button>
          </div>
        </div>
      </div>

      {/* ═══════ TAB: SETTINGS ═══════ */}
      {adminTab === 'settings' ? (
        <div className="space-y-4">
          {settingsLoading ? (
            <div className="text-center py-16">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin text-[#3370FF]" />
              <p className={`text-xs mt-2 ${c_sub}`}>Memuat pengaturan...</p>
            </div>
          ) : (
            <>
              {Object.entries(settingsData).map(([group, items]) => {
                const meta = GROUP_META[group] || { icon: <Settings className="w-4 h-4" />, label: group, desc: '' };
                return (
                  <div key={group} className={`border rounded-xl overflow-hidden ${c_card}`}>
                    <div className={`px-5 py-3 border-b flex items-center justify-between ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                      <div className="flex items-center gap-3">
                        {meta.icon}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className={`text-sm font-bold ${c_text}`}>{meta.label}</h3>
                            <button
                              type="button"
                              onClick={() => window.dispatchEvent(new CustomEvent('open-help', { detail: { key: 'admin_settings' } }))}
                              className="p-0.5 rounded-lg hover:bg-zinc-500/10 text-[#3370FF] hover:text-[#5B8EFF] transition-all"
                              title="Lihat Bantuan Form"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className={`text-[10px] ${c_sub}`}>{meta.desc}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      {items.map((s) => (
                        <div key={s.key} className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-4">
                            <label className={`text-xs font-semibold ${c_text}`}>{s.label}</label>
                            <p className={`text-[10px] ${c_sub} font-mono`}>{s.key}</p>
                          </div>
                          <div className="col-span-8">
                            {s.inputType === 'password' ? (
                              <div className="relative">
                                <input
                                  type={showPasswords[s.key] ? 'text' : 'password'}
                                  value={settingsEdits[s.key] || ''}
                                  onChange={e => setSettingsEdits({ ...settingsEdits, [s.key]: e.target.value })}
                                  className={`w-full px-3 py-2 pr-10 text-xs border rounded-lg font-mono ${c_input}`}
                                  placeholder="Masukkan password..."
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPasswords({ ...showPasswords, [s.key]: !showPasswords[s.key] })}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                                >
                                  {showPasswords[s.key] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            ) : (
                              <input
                                type={s.inputType === 'number' ? 'number' : 'text'}
                                value={settingsEdits[s.key] || ''}
                                onChange={e => setSettingsEdits({ ...settingsEdits, [s.key]: e.target.value })}
                                className={`w-full px-3 py-2 text-xs border rounded-lg ${c_input}`}
                              />
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Test Email button for SMTP group */}
                      {group === 'smtp' && (
                        <div className="pt-3 border-t" style={{ borderColor: isDark ? '#1A2744' : '#E5E7EB' }}>
                          <button
                            onClick={sendTestEmail}
                            disabled={testEmailLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            {testEmailLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            {testEmailLoading ? 'Mengirim...' : '📧 Kirim Test Email'}
                          </button>
                          {testEmailResult && (
                            <div className={`mt-2 p-3 rounded-lg text-xs font-semibold ${testEmailResult.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                              {testEmailResult.message}
                              {testEmailResult.previewUrl && (
                                <a href={testEmailResult.previewUrl} target="_blank" rel="noopener noreferrer" className="block mt-1 text-[#5B8EFF] hover:underline">
                                  🔗 Preview Email (Ethereal)
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Save Button */}
              <div className="flex items-center gap-4">
                <button
                  onClick={saveSettings}
                  disabled={settingsSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-[#3370FF] hover:bg-[#5B8EFF] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shadow-lg shadow-[#3370FF]/20"
                >
                  {settingsSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {settingsSaving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
                </button>
                {settingsMsg && (
                  <span className={`text-xs font-semibold ${settingsMsg.startsWith('✅') ? 'text-emerald-500' : 'text-red-500'}`}>
                    {settingsMsg}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
      <div className="space-y-4">
        <div className="flex gap-2 justify-end">
          <button onClick={fetchData} className={`p-2 rounded-lg border ${c_card}`}><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => { setShowAddModal(true); setNewItem({ ...newItem, category: activeCategory }); }} className="flex items-center gap-2 px-4 py-2 bg-[#3370FF] hover:bg-[#5B8EFF] text-white rounded-lg text-xs font-semibold transition-colors">
            <Plus className="w-3.5 h-3.5" /> Tambah Data
          </button>
        </div>
        <div className="grid grid-cols-12 gap-6">
        {/* Category Sidebar */}
        <div className="col-span-3">
          <div className={`border rounded-xl p-3 space-y-1 ${c_card}`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 ${c_sub}`}>Kategori</p>
            <button
              onClick={() => setActiveCategory('')}
              className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${activeCategory === '' ? 'bg-[#3370FF] text-white' : `${c_sub} ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}`}
            >
              <span>Semua Data</span>
              <span className="text-[10px] opacity-70">{items.length || '—'}</span>
            </button>
            {displayCategories.map(cat => (
              <button
                key={cat.category}
                onClick={() => setActiveCategory(cat.category)}
                className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${activeCategory === cat.category ? 'bg-[#3370FF] text-white' : `${c_sub} ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}`}
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
                    <RefreshCw className="w-5 h-5 mx-auto animate-spin text-[#3370FF]" />
                    <p className={`text-xs mt-2 ${c_sub}`}>Memuat data...</p>
                  </td></tr>
                ) : fetchError ? (
                  <tr><td colSpan={8} className="text-center py-10">
                    <p className="text-red-500 text-xs font-semibold">{fetchError}</p>
                    <button onClick={fetchData} className="mt-2 text-xs text-[#3370FF] hover:underline">Coba lagi</button>
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
                            <button onClick={() => handleUpdate(item.id)} className="p-1.5 bg-[#3370FF] text-white rounded-lg hover:bg-[#5B8EFF]"><Save className="w-3.5 h-3.5" /></button>
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
      </div>
      )}

      {/* Modal Tambah Data */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md border rounded-xl shadow-2xl p-6 space-y-4 ${c_card} ${isDark ? 'bg-[#0F1C33]' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-bold ${c_text}`}>Tambah Master Data</h3>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('open-help', { detail: { key: 'admin' } }))}
                  className="p-1 rounded-lg hover:bg-zinc-500/10 text-[#3370FF] hover:text-[#5B8EFF] transition-all"
                  title="Lihat Bantuan Form"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
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
                <button type="submit" className="flex-1 py-2.5 bg-[#3370FF] hover:bg-[#5B8EFF] text-white rounded-xl font-semibold">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
