'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Box, MapPin, Archive, AlertTriangle } from 'lucide-react';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  qty: number;
  minQty: number;
  maxQty: number;
  unit: string;
  location: string;
  unitPrice: number;
  lastRestocked: string;
}

interface InventoryViewProps {
  isDark: boolean; token?: string;
}

export default function InventoryView({ isDark, token }: InventoryViewProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'spare_part',
    qty: '',
    minQty: '',
    maxQty: '',
    unit: 'pcs',
    location: '',
    unitPrice: '',
    lastRestocked: '',
  });

  const c_card = isDark ? 'bg-zinc-900/30 border-zinc-800/80 text-white' : 'bg-white border-zinc-200 text-zinc-800 shadow-sm';
  const c_table_hdr = isDark ? 'bg-zinc-950/40 border-zinc-800/80 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600';
  const c_table_row = isDark ? 'hover:bg-zinc-900/10 border-zinc-800/60' : 'hover:bg-zinc-100/50 border-zinc-200';
  const c_input = isDark ? 'bg-zinc-950 border-zinc-800 text-white focus:border-[#1769FF]' : 'bg-white border-zinc-200 text-zinc-800 focus:border-[#1769FF]';
  const c_modal = isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-800';
  const c_text_title = isDark ? 'text-white' : 'text-zinc-800';
  const c_text_sub = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const c_border = isDark ? 'border-zinc-800/80' : 'border-zinc-200';

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/management/inventory', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }).then(r => r.json());
      if (res.success) {
        setItems(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch inventory items:', error);
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
      sku: `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      name: '',
      category: 'spare_part',
      qty: '10',
      minQty: '5',
      maxQty: '50',
      unit: 'pcs',
      location: 'Gudang MEP Lt. 1',
      unitPrice: '150000',
      lastRestocked: new Date().toISOString().slice(0, 10),
    });
    setShowModal(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      sku: item.sku,
      name: item.name,
      category: item.category,
      qty: item.qty.toString(),
      minQty: item.minQty.toString(),
      maxQty: item.maxQty.toString(),
      unit: item.unit,
      location: item.location,
      unitPrice: item.unitPrice.toString(),
      lastRestocked: new Date(item.lastRestocked).toISOString().slice(0, 10),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res;
      if (editingItem) {
        res = await fetch('/api/management/inventory', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify({ id: editingItem.id, ...formData }),
        }).then(r => r.json());
      } else {
        res = await fetch('/api/management/inventory', {
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
      console.error('Error saving inventory item:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus barang inventaris ini?')) return;
    try {
      const res = await fetch('/api/management/inventory', {
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
      console.error('Error deleting inventory item:', err);
    }
  };

  const filtered = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.sku.toLowerCase().includes(search.toLowerCase()) ||
                          item.location.toLowerCase().includes(search.toLowerCase());
    const matchesCat = catFilter === 'all' || item.category === catFilter;
    return matchesSearch && matchesCat;
  });

  // Calculate statistics
  const totalSku = items.length;
  const lowStockCount = items.filter(i => i.qty <= i.minQty && i.qty > 0).length;
  const outOfStockCount = items.filter(i => i.qty === 0).length;
  const totalValue = items.reduce((acc, curr) => acc + (curr.qty * curr.unitPrice), 0);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`p-6 rounded-2xl border ${c_card}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${c_text_sub}`}>Total SKU</span>
          <h2 className="text-3xl font-extrabold mt-2">{totalSku} Item</h2>
          <p className="text-[10px] text-zinc-500 mt-1">Jenis barang terdaftar</p>
        </div>
        <div className={`p-6 rounded-2xl border ${c_card}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${c_text_sub}`}>Stok Menipis</span>
          <h2 className={`text-3xl font-extrabold mt-2 ${lowStockCount > 0 ? 'text-amber-500' : ''}`}>{lowStockCount} Item</h2>
          <p className="text-[10px] text-zinc-500 mt-1">Stok &lt;= batas minimal</p>
        </div>
        <div className={`p-6 rounded-2xl border ${c_card}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${c_text_sub}`}>Stok Kosong</span>
          <h2 className={`text-3xl font-extrabold mt-2 ${outOfStockCount > 0 ? 'text-red-500' : ''}`}>{outOfStockCount} Item</h2>
          <p className="text-[10px] text-zinc-500 mt-1">Stok bernilai 0</p>
        </div>
        <div className={`p-6 rounded-2xl border ${c_card}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${c_text_sub}`}>Nilai Aset Inventaris</span>
          <h2 className="text-3xl font-extrabold mt-2 text-indigo-500">{formatRupiah(totalValue)}</h2>
          <p className="text-[10px] text-zinc-500 mt-1">Valuasi total gudang</p>
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
            placeholder="Cari SKU, nama barang, atau lokasi..." 
            className={`w-full pl-9 pr-4 py-2 border rounded-xl text-xs outline-none transition-colors ${c_input}`}
          />
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <select 
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className={`px-3 py-2 border rounded-xl text-xs outline-none ${c_input}`}
          >
            <option value="all">Semua Kategori</option>
            <option value="spare_part">Spare Parts</option>
            <option value="electrical">Listrik / Electrical</option>
            <option value="plumbing">Plumbing</option>
            <option value="safety_ppe">HSE / PPE</option>
            <option value="chemical">Bahan Kimia</option>
            <option value="consumable">Konsumabel</option>
          </select>

          <button 
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1769FF] hover:bg-[#4A8AFF] text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Tambah Barang
          </button>
        </div>
      </div>

      {/* Inventory List */}
      <div className={`border rounded-2xl overflow-hidden ${c_card}`}>
        {loading ? (
          <div className="p-12 text-center text-zinc-500">Loading data inventaris...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">Tidak ada barang inventaris ditemukan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[10px] uppercase font-bold tracking-wider ${c_table_hdr}`}>
                  <th className="py-4 px-6">Nama Barang</th>
                  <th className="py-4 px-6">SKU</th>
                  <th className="py-4 px-6">Kategori</th>
                  <th className="py-4 px-6">Stok Fisik</th>
                  <th className="py-4 px-6">Lokasi Penyimpanan</th>
                  <th className="py-4 px-6">Harga Satuan</th>
                  <th className="py-4 px-6">Total Valuasi</th>
                  <th className="py-4 px-6">Terakhir Restock</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {filtered.map(item => {
                  const low = item.qty <= item.minQty && item.qty > 0;
                  const empty = item.qty === 0;

                  return (
                    <tr key={item.id} className={`transition-colors border-b ${c_table_row}`}>
                      <td className="py-4 px-6 font-semibold">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#0D4FCC]/10 flex items-center justify-center text-[#1769FF]">
                            <Box className="w-4 h-4" />
                          </div>
                          <div>
                            <p className={`font-bold ${c_text_title}`}>{item.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono font-semibold">{item.sku}</td>
                      <td className="py-4 px-6 capitalize text-zinc-500">{item.category.replace('_', ' ')}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold text-sm ${empty ? 'text-red-500' : low ? 'text-amber-500' : c_text_title}`}>
                            {item.qty} {item.unit}
                          </span>
                          {empty && <span className="text-[8px] bg-red-500/10 border border-red-500/20 text-red-500 px-1.5 py-0.5 rounded font-bold uppercase">Habis</span>}
                          {low && <span className="text-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-bold uppercase">Low</span>}
                        </div>
                        <span className="text-[9px] text-zinc-500 block">Min: {item.minQty} • Max: {item.maxQty}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-zinc-500">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{item.location}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono font-semibold">{formatRupiah(item.unitPrice)}</td>
                      <td className="py-4 px-6 font-mono font-semibold text-[#1769FF]">{formatRupiah(item.qty * item.unitPrice)}</td>
                      <td className="py-4 px-6 text-zinc-500">{new Date(item.lastRestocked).toLocaleDateString('id-ID')}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openEditModal(item)}
                            className={`p-1.5 border rounded-lg hover:text-[#1769FF] ${isDark ? 'border-zinc-800 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-100'}`}
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
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
              <h3 className="text-base font-bold">{editingItem ? 'Perbarui Data Barang' : 'Tambah Barang Inventaris'}</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-red-500 text-xs">Tutup</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1">SKU Barang</label>
                  <input 
                    type="text" 
                    required
                    value={formData.sku} 
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Nama Barang</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                    placeholder="MCB Schneider 16A"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1">Kategori</label>
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`}
                  >
                    <option value="spare_part">Spare Parts</option>
                    <option value="electrical">Listrik / Electrical</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="safety_ppe">HSE / PPE</option>
                    <option value="chemical">Bahan Kimia</option>
                    <option value="consumable">Konsumabel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Unit Satuan</label>
                  <input 
                    type="text" 
                    required
                    value={formData.unit} 
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                    placeholder="pcs, box, roll, kg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1">Stok Saat Ini</label>
                  <input 
                    type="number" 
                    required
                    value={formData.qty} 
                    onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Min. Stok</label>
                  <input 
                    type="number" 
                    required
                    value={formData.minQty} 
                    onChange={(e) => setFormData({ ...formData, minQty: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Max. Stok</label>
                  <input 
                    type="number" 
                    required
                    value={formData.maxQty} 
                    onChange={(e) => setFormData({ ...formData, maxQty: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1">Harga Satuan (IDR)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.unitPrice} 
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Lokasi Rak/Gudang</label>
                  <input 
                    type="text" 
                    required
                    value={formData.location} 
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                    placeholder="Gudang A Rak 3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">Tanggal Restock Terakhir</label>
                <input 
                  type="date" 
                  required
                  value={formData.lastRestocked} 
                  onChange={(e) => setFormData({ ...formData, lastRestocked: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                />
              </div>

              <button type="submit" className="w-full py-2.5 bg-[#1769FF] hover:bg-[#4A8AFF] text-white rounded-lg font-semibold transition-colors mt-4">
                {editingItem ? 'Simpan Perubahan' : 'Simpan Barang'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
