'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Shield, Calendar, Phone, AlertTriangle, HelpCircle } from 'lucide-react';

interface SecurityGuard {
  id: string;
  name: string;
  nip: string;
  phone: string;
  email: string;
  department: string;
  contractType: string;
  baseSalary: number;
  gadaLevel: string | null;
  status: string;
  ktaNumber: string | null;
  ktaExpiry: string | null;
  joinDate: string;
}

interface SecurityViewProps {
  isDark: boolean; token?: string;
}

export default function SecurityView({ isDark, token }: SecurityViewProps) {
  const [guards, setGuards] = useState<SecurityGuard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [editingGuard, setEditingGuard] = useState<SecurityGuard | null>(null);

  const [formData, setFormData] = useState({
    name: '', nip: '', phone: '', email: '',
    gadaLevel: 'pratama', status: 'active',
    ktaNumber: '', ktaExpiry: '', joinDate: '',
    contractType: 'outsource', baseSalary: '5000000',
  });

  const c_card = isDark ? 'bg-zinc-900/30 border-zinc-800/80 text-white' : 'bg-white border-zinc-200 text-zinc-800 shadow-sm';
  const c_table_hdr = isDark ? 'bg-[#1B1F26]/40 border-zinc-800/80 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600';
  const c_table_row = isDark ? 'hover:bg-zinc-900/10 border-zinc-800/60' : 'hover:bg-zinc-100/50 border-zinc-200';
  const c_input = isDark ? 'bg-[#1B1F26] border-zinc-800 text-white focus:border-[#3370FF]' : 'bg-white border-zinc-200 text-zinc-800 focus:border-[#3370FF]';
  const c_modal = isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-800';
  const c_text_title = isDark ? 'text-white' : 'text-zinc-800';
  const c_text_sub = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const c_border = isDark ? 'border-zinc-800/80' : 'border-zinc-200';

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const fetchGuards = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/management/hrd?role=security', { headers }).then(r => r.json());
      if (res.success) setGuards(res.data);
    } catch (error) {
      console.error('Failed to fetch security guards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGuards(); }, []);

  const openAddModal = () => {
    setEditingGuard(null);
    setFormData({ name: '', nip: '', phone: '', email: '', gadaLevel: 'pratama', status: 'active', ktaNumber: '', ktaExpiry: '', joinDate: new Date().toISOString().slice(0, 10), contractType: 'outsource', baseSalary: '5000000' });
    setShowModal(true);
  };

  const openEditModal = (g: SecurityGuard) => {
    setEditingGuard(g);
    setFormData({
      name: g.name, nip: g.nip, phone: g.phone, email: g.email,
      gadaLevel: g.gadaLevel || 'pratama', status: g.status,
      ktaNumber: g.ktaNumber || '', ktaExpiry: g.ktaExpiry ? new Date(g.ktaExpiry).toISOString().slice(0, 10) : '',
      joinDate: new Date(g.joinDate).toISOString().slice(0, 10),
      contractType: g.contractType, baseSalary: g.baseSalary.toString(),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, role: 'security', department: 'Security', skills: ['Security Patrol'] };
      let res;
      if (editingGuard) {
        res = await fetch('/api/management/hrd', { method: 'PUT', headers, body: JSON.stringify({ id: editingGuard.id, ...payload }) }).then(r => r.json());
      } else {
        res = await fetch('/api/management/hrd', { method: 'POST', headers, body: JSON.stringify(payload) }).then(r => r.json());
      }
      if (res.success) { setShowModal(false); fetchGuards(); } else { alert(res.error); }
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data anggota security ini?')) return;
    try {
      const res = await fetch('/api/management/hrd', { method: 'DELETE', headers, body: JSON.stringify({ id }) }).then(r => r.json());
      if (res.success) fetchGuards(); else alert(res.error);
    } catch (err) { console.error(err); }
  };

  const isKtaExpired = (date: string | null) => date ? new Date(date) < new Date() : false;

  const filtered = guards.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase()) || g.nip.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = levelFilter === 'all' || g.gadaLevel === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const totalGuards = guards.length;
  const activeGuards = guards.filter(g => g.status === 'active').length;
  const expiredKta = guards.filter(g => isKtaExpired(g.ktaExpiry)).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-xl border ${c_card}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${c_text_sub}`}>Total Personil</span>
          <h2 className="text-3xl font-extrabold mt-2">{totalGuards} Orang</h2>
        </div>
        <div className={`p-6 rounded-xl border ${c_card}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${c_text_sub}`}>Aktif Bertugas</span>
          <h2 className="text-3xl font-extrabold mt-2 text-emerald-500">{activeGuards} Orang</h2>
        </div>
        <div className={`p-6 rounded-xl border ${c_card}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${c_text_sub}`}>KTA Expired</span>
          <h2 className="text-3xl font-extrabold mt-2 text-red-500">{expiredKta} Orang</h2>
        </div>
      </div>

      <div className={`flex flex-col sm:flex-row gap-4 items-center justify-between p-4 border rounded-xl ${c_card}`}>
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500"><Search className="w-4 h-4" /></span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama / NIP..." className={`w-full pl-9 pr-4 py-2 border rounded-xl text-xs outline-none ${c_input}`} />
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className={`px-3 py-2 border rounded-xl text-xs outline-none ${c_input}`}>
            <option value="all">Semua Level Gada</option>
            <option value="pratama">Gada Pratama</option>
            <option value="madya">Gada Madya</option>
            <option value="utama">Gada Utama</option>
          </select>
          <button onClick={openAddModal} className="flex items-center gap-1.5 px-4 py-2.5 bg-[#3370FF] hover:bg-[#5B8EFF] text-white rounded-xl text-xs font-semibold shadow-md">
            <Plus className="w-4 h-4" /> Tambah Guard
          </button>
        </div>
      </div>

      <div className={`border rounded-xl overflow-hidden ${c_card}`}>
        {loading ? (
          <div className="p-12 text-center text-zinc-500">Loading data security...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">Tidak ada data security ditemukan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[10px] uppercase font-bold tracking-wider ${c_table_hdr}`}>
                  <th className="py-4 px-6">Nama / NIP</th>
                  <th className="py-4 px-6">Phone</th>
                  <th className="py-4 px-6">Level Gada</th>
                  <th className="py-4 px-6">KTA</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {filtered.map(g => (
                  <tr key={g.id} className={`transition-colors border-b ${c_table_row}`}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-900/10 flex items-center justify-center text-indigo-500"><Shield className="w-4 h-4" /></div>
                        <div>
                          <p className={`font-bold ${c_text_title}`}>{g.name}</p>
                          <p className="text-zinc-500 text-[10px]">{g.nip}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-zinc-500"><div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{g.phone}</div></td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase ${g.gadaLevel === 'utama' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : g.gadaLevel === 'madya' ? 'bg-[#3370FF]/10 text-[#3370FF] border border-blue-500/20' : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'}`}>
                        Gada {g.gadaLevel || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-mono text-[10px]">{g.ktaNumber || '-'}</span>
                        {g.ktaExpiry && (
                          <span className={`text-[10px] flex items-center gap-1 ${isKtaExpired(g.ktaExpiry) ? 'text-red-500' : 'text-zinc-500'}`}>
                            {isKtaExpired(g.ktaExpiry) && <AlertTriangle className="w-3 h-3" />}
                            Exp: {new Date(g.ktaExpiry).toLocaleDateString('id-ID')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase ${g.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                        {g.status === 'active' ? 'Aktif' : 'Cuti'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(g)} className={`p-1.5 border rounded-lg hover:text-[#3370FF] ${isDark ? 'border-zinc-800 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-100'}`}><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(g.id)} className={`p-1.5 border rounded-lg hover:text-red-500 ${isDark ? 'border-zinc-800 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-100'}`}><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md border p-6 rounded-xl shadow-2xl space-y-6 ${c_modal}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${c_border}`}>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">{editingGuard ? 'Perbarui Data Security' : 'Tambah Anggota Security'}</h3>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('open-help', { detail: { key: 'hrd_add' } }))}
                  className="p-1 rounded-lg hover:bg-zinc-500/10 text-[#3370FF] hover:text-[#5B8EFF] transition-all"
                  title="Lihat Bantuan Form"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-red-500 text-xs">Tutup</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1">Nama</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">NIP</label>
                  <input type="text" required value={formData.nip} onChange={(e) => setFormData({ ...formData, nip: e.target.value })} className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1">Phone</label>
                  <input type="text" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Email</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1">Level Gada</label>
                  <select value={formData.gadaLevel} onChange={(e) => setFormData({ ...formData, gadaLevel: e.target.value })} className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`}>
                    <option value="pratama">Gada Pratama</option>
                    <option value="madya">Gada Madya</option>
                    <option value="utama">Gada Utama</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`}>
                    <option value="active">Aktif</option>
                    <option value="on_leave">Cuti</option>
                    <option value="inactive">Non-aktif</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1">No. KTA</label>
                  <input type="text" value={formData.ktaNumber} onChange={(e) => setFormData({ ...formData, ktaNumber: e.target.value })} className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Expired KTA</label>
                  <input type="date" value={formData.ktaExpiry} onChange={(e) => setFormData({ ...formData, ktaExpiry: e.target.value })} className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} />
                </div>
              </div>
              <div>
                <label className="block text-zinc-500 mb-1">Tanggal Bergabung</label>
                <input type="date" required value={formData.joinDate} onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })} className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} />
              </div>
              <button type="submit" className="w-full py-2.5 bg-[#3370FF] hover:bg-[#5B8EFF] text-white rounded-lg font-semibold">{editingGuard ? 'Simpan Perubahan' : 'Tambah Anggota'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
