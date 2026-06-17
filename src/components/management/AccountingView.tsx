'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, DollarSign, Calendar, TrendingUp, TrendingDown, FileText } from 'lucide-react';

interface AccountingTransaction {
  id: string;
  date: string;
  description: string;
  type: string; // income | expense
  amount: number;
  category: string;
}

interface AccountingViewProps {
  isDark: boolean; token?: string;
}

export default function AccountingView({ isDark, token }: AccountingViewProps) {
  const [txs, setTxs] = useState<AccountingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState<AccountingTransaction | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    date: '',
    description: '',
    type: 'expense',
    amount: '',
    category: 'maintenance',
  });

  const c_card = isDark ? 'bg-zinc-900/30 border-zinc-800/80 text-white' : 'bg-white border-zinc-200 text-zinc-800 shadow-sm';
  const c_table_hdr = isDark ? 'bg-zinc-950/40 border-zinc-800/80 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600';
  const c_table_row = isDark ? 'hover:bg-zinc-900/10 border-zinc-800/60' : 'hover:bg-zinc-100/50 border-zinc-200';
  const c_input = isDark ? 'bg-zinc-950 border-zinc-800 text-white focus:border-[#1769FF]' : 'bg-white border-zinc-200 text-zinc-800 focus:border-[#1769FF]';
  const c_modal = isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-800';
  const c_text_title = isDark ? 'text-white' : 'text-zinc-800';
  const c_text_sub = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const c_border = isDark ? 'border-zinc-800/80' : 'border-zinc-200';

  const fetchTxs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/management/accounting', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }).then(r => r.json());
      if (res.success) {
        setTxs(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTxs();
  }, []);

  const openAddModal = () => {
    setEditingTx(null);
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      description: '',
      type: 'expense',
      amount: '500000',
      category: 'maintenance',
    });
    setShowModal(true);
  };

  const openEditModal = (tx: AccountingTransaction) => {
    setEditingTx(tx);
    setFormData({
      date: new Date(tx.date).toISOString().slice(0, 10),
      description: tx.description,
      type: tx.type,
      amount: tx.amount.toString(),
      category: tx.category,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res;
      if (editingTx) {
        res = await fetch('/api/management/accounting', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify({ id: editingTx.id, ...formData }),
        }).then(r => r.json());
      } else {
        res = await fetch('/api/management/accounting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify(formData),
        }).then(r => r.json());
      }

      if (res.success) {
        setShowModal(false);
        fetchTxs();
      } else {
        alert(res.error);
      }
    } catch (err) {
      console.error('Error saving transaction:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi akuntansi ini?')) return;
    try {
      const res = await fetch('/api/management/accounting', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ id }),
      }).then(r => r.json());

      if (res.success) {
        fetchTxs();
      } else {
        alert(res.error);
      }
    } catch (err) {
      console.error('Error deleting transaction:', err);
    }
  };

  const filtered = txs.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) || 
                          t.category.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Calculate statistics
  const totalExpense = txs.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const totalIncome = txs.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-2xl border ${c_card}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${c_text_sub}`}>Total Pemasukan (Income)</span>
          <h2 className="text-3xl font-extrabold mt-2 text-emerald-500">{formatRupiah(totalIncome)}</h2>
          <p className="text-[10px] text-zinc-500 mt-1">Pendapatan operasional</p>
        </div>
        <div className={`p-6 rounded-2xl border ${c_card}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${c_text_sub}`}>Total Pengeluaran (Expense)</span>
          <h2 className="text-3xl font-extrabold mt-2 text-red-500">{formatRupiah(totalExpense)}</h2>
          <p className="text-[10px] text-zinc-500 mt-1">Biaya operasional & pemeliharaan</p>
        </div>
        <div className={`p-6 rounded-2xl border ${c_card}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${c_text_sub}`}>Kas / Saldo Bersih (Net)</span>
          <h2 className={`text-3xl font-extrabold mt-2 ${netBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {formatRupiah(netBalance)}
          </h2>
          <p className="text-[10px] text-zinc-500 mt-1">Sisa saldo keuangan aktif</p>
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
            placeholder="Cari deskripsi transaksi, kategori..." 
            className={`w-full pl-9 pr-4 py-2 border rounded-xl text-xs outline-none transition-colors ${c_input}`}
          />
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={`px-3 py-2 border rounded-xl text-xs outline-none ${c_input}`}
          >
            <option value="all">Semua Tipe</option>
            <option value="income">Pemasukan (Income)</option>
            <option value="expense">Pengeluaran (Expense)</option>
          </select>

          <button 
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1769FF] hover:bg-[#4A8AFF] text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Catat Transaksi
          </button>
        </div>
      </div>

      {/* Transactions Ledger Table */}
      <div className={`border rounded-2xl overflow-hidden ${c_card}`}>
        {loading ? (
          <div className="p-12 text-center text-zinc-500">Loading jurnal akuntansi...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">Tidak ada catatan transaksi ditemukan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[10px] uppercase font-bold tracking-wider ${c_table_hdr}`}>
                  <th className="py-4 px-6">Deskripsi Transaksi</th>
                  <th className="py-4 px-6">Tanggal Buku</th>
                  <th className="py-4 px-6">Kategori</th>
                  <th className="py-4 px-6">Tipe</th>
                  <th className="py-4 px-6">Jumlah Uang (IDR)</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {filtered.map(t => (
                  <tr key={t.id} className={`transition-colors border-b ${c_table_row}`}>
                    <td className="py-4 px-6 font-semibold">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {t.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        </div>
                        <p className={`font-bold ${c_text_title}`}>{t.description}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(t.date).toLocaleDateString('id-ID')}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 capitalize">
                      <span className={`text-[10px] border px-2 py-0.5 rounded font-semibold uppercase ${isDark ? 'bg-zinc-800 border-zinc-700/50 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-500'}`}>
                        {t.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className={`py-4 px-6 font-mono font-bold text-sm ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {t.type === 'income' ? '+' : '-'} {formatRupiah(t.amount)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(t)}
                          className={`p-1.5 border rounded-lg hover:text-[#1769FF] ${isDark ? 'border-zinc-800 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-100'}`}
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(t.id)}
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
          <div className={`w-full max-w-md border p-6 rounded-2xl shadow-2xl space-y-6 ${c_modal}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${c_border}`}>
              <h3 className="text-base font-bold">{editingTx ? 'Perbarui Transaksi' : 'Catat Jurnal Transaksi Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-red-500 text-xs">Tutup</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-500 mb-1">Deskripsi Transaksi</label>
                <input 
                  type="text" 
                  required
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Pembelian APAR CO2 6kg"
                  className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1">Tanggal Buku</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date} 
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Tipe Kas</label>
                  <select 
                    value={formData.type} 
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`}
                  >
                    <option value="expense">Pengeluaran (Expense)</option>
                    <option value="income">Pemasukan (Income)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1">Jumlah Nominal (IDR)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.amount} 
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Kategori Akun</label>
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`}
                  >
                    <option value="operasional">Operasional</option>
                    <option value="maintenance">Maintenance / Perbaikan</option>
                    <option value="utility">Utility / Listrik & Air</option>
                    <option value="salary">Gaji Karyawan</option>
                    <option value="lease">Sewa Aset</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full py-2.5 bg-[#1769FF] hover:bg-[#4A8AFF] text-white rounded-lg font-semibold transition-colors mt-4">
                {editingTx ? 'Simpan Perubahan' : 'Catat Transaksi'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
