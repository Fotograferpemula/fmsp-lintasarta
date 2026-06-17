'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, PieChart, Landmark, Percent } from 'lucide-react';

interface RabBudget {
  id: string;
  year: number;
  department: string;
  category: string;
  allocatedAmount: number;
  spentAmount: number;
}

interface RabViewProps {
  isDark: boolean; token?: string;
}

export default function RabView({ isDark, token }: RabViewProps) {
  const [budgets, setBudgets] = useState<RabBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('all');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<RabBudget | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    year: '2026',
    department: 'Engineering',
    category: 'Opex',
    allocatedAmount: '1000000000',
    spentAmount: '0',
  });

  const c_card = isDark ? 'bg-zinc-900/30 border-zinc-800/80 text-white' : 'bg-white border-zinc-200 text-zinc-800 shadow-sm';
  const c_table_hdr = isDark ? 'bg-zinc-950/40 border-zinc-800/80 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600';
  const c_table_row = isDark ? 'hover:bg-zinc-900/10 border-zinc-800/60' : 'hover:bg-zinc-100/50 border-zinc-200';
  const c_input = isDark ? 'bg-zinc-950 border-zinc-800 text-white focus:border-[#1769FF]' : 'bg-white border-zinc-200 text-zinc-800 focus:border-[#1769FF]';
  const c_modal = isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-800';
  const c_text_title = isDark ? 'text-white' : 'text-zinc-800';
  const c_text_sub = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const c_border = isDark ? 'border-zinc-800/80' : 'border-zinc-200';

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/management/rab', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }).then(r => r.json());
      if (res.success) {
        setBudgets(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const openAddModal = () => {
    setEditingBudget(null);
    setFormData({
      year: new Date().getFullYear().toString(),
      department: 'Engineering',
      category: 'Opex',
      allocatedAmount: '1000000000',
      spentAmount: '0',
    });
    setShowModal(true);
  };

  const openEditModal = (b: RabBudget) => {
    setEditingBudget(b);
    setFormData({
      year: b.year.toString(),
      department: b.department,
      category: b.category,
      allocatedAmount: b.allocatedAmount.toString(),
      spentAmount: b.spentAmount.toString(),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res;
      if (editingBudget) {
        res = await fetch('/api/management/rab', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify({ id: editingBudget.id, ...formData }),
        }).then(r => r.json());
      } else {
        res = await fetch('/api/management/rab', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify(formData),
        }).then(r => r.json());
      }

      if (res.success) {
        setShowModal(false);
        fetchBudgets();
      } else {
        alert(res.error);
      }
    } catch (err) {
      console.error('Error saving budget:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pos RAB ini?')) return;
    try {
      const res = await fetch('/api/management/rab', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ id }),
      }).then(r => r.json());

      if (res.success) {
        fetchBudgets();
      } else {
        alert(res.error);
      }
    } catch (err) {
      console.error('Error deleting budget:', err);
    }
  };

  const filtered = budgets.filter(b => {
    const matchesSearch = b.department.toLowerCase().includes(search.toLowerCase()) || 
                          b.category.toLowerCase().includes(search.toLowerCase());
    const matchesYear = yearFilter === 'all' || b.year.toString() === yearFilter;
    return matchesSearch && matchesYear;
  });

  // Calculate statistics
  const totalAllocated = budgets.reduce((acc, curr) => acc + curr.allocatedAmount, 0);
  const totalSpent = budgets.reduce((acc, curr) => acc + curr.spentAmount, 0);
  const totalRemaining = totalAllocated - totalSpent;
  const averageUtilization = totalAllocated ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  // Get unique years for filter
  const uniqueYears = Array.from(new Set(budgets.map(b => b.year))).sort((a,b) => b - a);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`p-6 rounded-2xl border ${c_card}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${c_text_sub}`}>Total Alokasi Anggaran</span>
          <h2 className="text-3xl font-extrabold mt-2 text-[#1769FF]">{formatRupiah(totalAllocated)}</h2>
          <p className="text-[10px] text-zinc-500 mt-1">Plafond RAB yang disetujui</p>
        </div>
        <div className={`p-6 rounded-2xl border ${c_card}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${c_text_sub}`}>Total Penyerapan (Spent)</span>
          <h2 className="text-3xl font-extrabold mt-2 text-red-500">{formatRupiah(totalSpent)}</h2>
          <p className="text-[10px] text-zinc-500 mt-1">Anggaran yang telah terpakai</p>
        </div>
        <div className={`p-6 rounded-2xl border ${c_card}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${c_text_sub}`}>Sisa Alokasi (Remaining)</span>
          <h2 className="text-3xl font-extrabold mt-2 text-emerald-500">{formatRupiah(totalRemaining)}</h2>
          <p className="text-[10px] text-zinc-500 mt-1">Sisa dana yang belum terpakai</p>
        </div>
        <div className={`p-6 rounded-2xl border ${c_card}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${c_text_sub}`}>Rata-rata Penyerapan</span>
          <h2 className="text-3xl font-extrabold mt-2 text-indigo-500">{averageUtilization}%</h2>
          <p className="text-[10px] text-zinc-500 mt-1">Efisiensi penggunaan dana</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className={`flex flex-col sm:flex-row gap-4 items-center justify-between p-4 border rounded-2xl ${c_card}`}>
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
            <Search className="w-4 h-4" />
          </span>
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari departemen atau kategori..." 
            className={`w-full pl-9 pr-4 py-2 border rounded-xl text-xs outline-none transition-colors ${c_input}`}
          />
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <select 
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className={`px-3 py-2 border rounded-xl text-xs outline-none ${c_input}`}
          >
            <option value="all">Semua Tahun</option>
            {uniqueYears.map(y => <option key={y} value={y.toString()}>{y}</option>)}
          </select>

          <button 
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1769FF] hover:bg-[#4A8AFF] text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Tambah Plafon RAB
          </button>
        </div>
      </div>

      {/* Budgets Table */}
      <div className={`border rounded-2xl overflow-hidden ${c_card}`}>
        {loading ? (
          <div className="p-12 text-center text-zinc-500">Loading data alokasi RAB...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">Tidak ada alokasi RAB ditemukan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[10px] uppercase font-bold tracking-wider ${c_table_hdr}`}>
                  <th className="py-4 px-6">Departemen</th>
                  <th className="py-4 px-6">Tahun RAB</th>
                  <th className="py-4 px-6">Kategori Anggaran</th>
                  <th className="py-4 px-6">Nilai Plafon Disetujui</th>
                  <th className="py-4 px-6">Telah Direalisasi (Spent)</th>
                  <th className="py-4 px-6">Sisa Alokasi</th>
                  <th className="py-4 px-6">Penyerapan (%)</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {filtered.map(b => {
                  const utilization = b.allocatedAmount ? Math.round((b.spentAmount / b.allocatedAmount) * 100) : 0;
                  const remaining = b.allocatedAmount - b.spentAmount;

                  return (
                    <tr key={b.id} className={`transition-colors border-b ${c_table_row}`}>
                      <td className="py-4 px-6 font-semibold">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#0D4FCC]/10 flex items-center justify-center text-[#1769FF]">
                            <Landmark className="w-4 h-4" />
                          </div>
                          <div>
                            <p className={`font-bold ${c_text_title}`}>{b.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono font-semibold">{b.year}</td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] border px-2 py-0.5 rounded font-semibold uppercase ${isDark ? 'bg-zinc-800 border-zinc-700/50 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-500'}`}>
                          {b.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono font-semibold">{formatRupiah(b.allocatedAmount)}</td>
                      <td className="py-4 px-6 font-mono font-semibold text-red-500">{formatRupiah(b.spentAmount)}</td>
                      <td className="py-4 px-6 font-mono font-semibold text-emerald-500">{formatRupiah(remaining)}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3 w-32">
                          <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${utilization > 90 ? 'bg-red-500' : utilization > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                              style={{ width: `${Math.min(100, utilization)}%` }}
                            />
                          </div>
                          <span className={`font-mono font-bold text-xs ${utilization > 90 ? 'text-red-500 animate-pulse' : utilization > 60 ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {utilization}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openEditModal(b)}
                            className={`p-1.5 border rounded-lg hover:text-[#1769FF] ${isDark ? 'border-zinc-800 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-100'}`}
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(b.id)}
                            className={`p-1.5 border rounded-lg hover:text-red-500 ${isDark ? 'border-zinc-800 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-100'}`}
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md border p-6 rounded-2xl shadow-2xl space-y-6 ${c_modal}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${c_border}`}>
              <h3 className="text-base font-bold">{editingBudget ? 'Perbarui Pos RAB' : 'Tambah Alokasi Plafon RAB'}</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-red-500 text-xs">Tutup</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1">Tahun Anggaran</label>
                  <input 
                    type="number" 
                    required
                    value={formData.year} 
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Kategori Budget</label>
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`}
                  >
                    <option value="Operasional">Operasional</option>
                    <option value="Capex">Capex (Capital Expenditure)</option>
                    <option value="Opex">Opex (Operational Expenditure)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">Departemen Penanggung Jawab</label>
                <select 
                  value={formData.department} 
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`}
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Security">Security</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Admin">Admin</option>
                  <option value="IT">IT Operations</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1">Plafon Dialokasikan (IDR)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.allocatedAmount} 
                    onChange={(e) => setFormData({ ...formData, allocatedAmount: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Jumlah Terpakai (IDR)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.spentAmount} 
                    onChange={(e) => setFormData({ ...formData, spentAmount: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-2.5 bg-[#1769FF] hover:bg-[#4A8AFF] text-white rounded-lg font-semibold transition-colors mt-4">
                {editingBudget ? 'Simpan Perubahan' : 'Alokasikan Anggaran'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
