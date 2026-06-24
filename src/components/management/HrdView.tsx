'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, User, Mail, Phone, Calendar, ShieldCheck, Award, HelpCircle } from 'lucide-react';

interface Employee {
  id: string;
  nip: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  email: string;
  joinDate: string;
  contractType: string;
  status: string;
  baseSalary: number;
  skills: string[];
}

interface HrdViewProps {
  isDark: boolean; token?: string;
}

export default function HrdView({ isDark, token }: HrdViewProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    nip: '',
    name: '',
    role: 'teknisi_mep',
    department: 'Engineering',
    phone: '',
    email: '',
    joinDate: '',
    contractType: 'permanent',
    status: 'active',
    baseSalary: '',
    skillsString: '',
  });

  // Styles based on theme
  const c_card = isDark ? 'bg-zinc-900/30 border-zinc-800/80 text-white' : 'bg-white border-zinc-200 text-zinc-800 shadow-sm';
  const c_table_hdr = isDark ? 'bg-[#1B1F26]/40 border-zinc-800/80 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600';
  const c_table_row = isDark ? 'hover:bg-zinc-900/10 border-zinc-800/60' : 'hover:bg-zinc-100/50 border-zinc-200';
  const c_input = isDark ? 'bg-[#1B1F26] border-zinc-800 text-white focus:border-[#3370FF]' : 'bg-white border-zinc-200 text-zinc-800 focus:border-[#3370FF]';
  const c_modal = isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-800';
  const c_text_title = isDark ? 'text-white' : 'text-zinc-800';
  const c_text_sub = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const c_inner_bg = isDark ? 'bg-[#1B1F26]/40 border-zinc-800/40' : 'bg-zinc-50 border-zinc-200';
  const c_border = isDark ? 'border-zinc-800/80' : 'border-zinc-200';

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/management/hrd', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }).then(r => r.json());
      if (res.success) {
        setEmployees(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const openAddModal = () => {
    setEditingEmployee(null);
    setFormData({
      nip: `LA-${new Date().getFullYear()}-${String(employees.length + 1).padStart(3, '0')}`,
      name: '',
      role: 'teknisi_mep',
      department: 'Engineering',
      phone: '',
      email: '',
      joinDate: new Date().toISOString().slice(0, 10),
      contractType: 'permanent',
      status: 'active',
      baseSalary: '6000000',
      skillsString: '',
    });
    setShowModal(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      nip: emp.nip,
      name: emp.name,
      role: emp.role,
      department: emp.department,
      phone: emp.phone,
      email: emp.email,
      joinDate: new Date(emp.joinDate).toISOString().slice(0, 10),
      contractType: emp.contractType,
      status: emp.status,
      baseSalary: emp.baseSalary.toString(),
      skillsString: emp.skills.join(', '),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      baseSalary: parseFloat(formData.baseSalary) || 0,
      skills: formData.skillsString.split(',').map(s => s.trim()).filter(Boolean),
    };

    try {
      let res;
      if (editingEmployee) {
        res = await fetch('/api/management/hrd', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify({ id: editingEmployee.id, ...payload }),
        }).then(r => r.json());
      } else {
        res = await fetch('/api/management/hrd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify(payload),
        }).then(r => r.json());
      }

      if (res.success) {
        setShowModal(false);
        fetchEmployees();
      } else {
        alert(res.error);
      }
    } catch (err) {
      console.error('Error saving employee:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data karyawan ini?')) return;
    try {
      const res = await fetch('/api/management/hrd', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ id }),
      }).then(r => r.json());

      if (res.success) {
        fetchEmployees();
      } else {
        alert(res.error);
      }
    } catch (err) {
      console.error('Error deleting employee:', err);
    }
  };

  const filtered = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase()) || 
                          emp.nip.toLowerCase().includes(search.toLowerCase()) ||
                          emp.role.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === 'all' || emp.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  // Stats calculation
  const totalCount = employees.length;
  const activeCount = employees.filter(e => e.status === 'active').length;
  const engineeringCount = employees.filter(e => e.department === 'Engineering').length;
  const avgSalary = employees.length ? employees.reduce((acc, curr) => acc + curr.baseSalary, 0) / employees.length : 0;

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`p-6 rounded-xl border ${c_card}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${c_text_sub}`}>Total Karyawan</span>
          <h2 className="text-3xl font-extrabold mt-2">{totalCount} Orang</h2>
          <p className="text-[10px] text-zinc-500 mt-1">Terdaftar di database</p>
        </div>
        <div className={`p-6 rounded-xl border ${c_card}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${c_text_sub}`}>Karyawan Aktif</span>
          <h2 className="text-3xl font-extrabold mt-2 text-emerald-500">{activeCount} Orang</h2>
          <p className="text-[10px] text-zinc-500 mt-1">Status aktif bekerja</p>
        </div>
        <div className={`p-6 rounded-xl border ${c_card}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${c_text_sub}`}>Tim Engineering</span>
          <h2 className="text-3xl font-extrabold mt-2 text-[#3370FF]">{engineeringCount} Orang</h2>
          <p className="text-[10px] text-zinc-500 mt-1">MEP & BAS Operator</p>
        </div>
        <div className={`p-6 rounded-xl border ${c_card}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${c_text_sub}`}>Rata-rata Gaji</span>
          <h2 className="text-3xl font-extrabold mt-2 text-indigo-500">{formatRupiah(avgSalary)}</h2>
          <p className="text-[10px] text-zinc-500 mt-1">Gaji pokok bulanan</p>
        </div>
      </div>

      {/* Control bar */}
      <div className={`flex flex-col sm:flex-row gap-4 items-center justify-between p-4 border rounded-xl ${c_card}`}>
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
            <Search className="w-4 h-4" />
          </span>
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari NIP, nama atau spesialisasi..." 
            className={`w-full pl-9 pr-4 py-2 border rounded-xl text-xs outline-none transition-colors ${c_input}`}
          />
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <select 
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className={`px-3 py-2 border rounded-xl text-xs outline-none ${c_input}`}
          >
            <option value="all">Semua Departemen</option>
            <option value="Engineering">Engineering</option>
            <option value="Security">Security</option>
            <option value="Housekeeping">Housekeeping</option>
            <option value="Admin">Admin</option>
            <option value="Management">Management</option>
          </select>

          <button 
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#3370FF] hover:bg-[#5B8EFF] text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Tambah Karyawan
          </button>
        </div>
      </div>

      {/* Employees Table */}
      <div className={`border rounded-xl overflow-hidden ${c_card}`}>
        {loading ? (
          <div className="p-12 text-center text-zinc-500">Loading data karyawan...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">Tidak ada data karyawan ditemukan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[10px] uppercase font-bold tracking-wider ${c_table_hdr}`}>
                  <th className="py-4 px-6">Karyawan</th>
                  <th className="py-4 px-6">NIP & Kontrak</th>
                  <th className="py-4 px-6">Departemen & Peran</th>
                  <th className="py-4 px-6">Kontak</th>
                  <th className="py-4 px-6">Keahlian (Skills)</th>
                  <th className="py-4 px-6">Gaji Pokok</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {filtered.map(emp => (
                  <tr key={emp.id} className={`transition-colors border-b ${c_table_row}`}>
                    <td className="py-4 px-6 font-semibold">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#245BDB]/10 flex items-center justify-center text-[#3370FF]">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className={`font-bold ${c_text_title}`}>{emp.name}</p>
                          <span className="text-[10px] text-zinc-500">Gabung: {new Date(emp.joinDate).toLocaleDateString('id-ID')}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className={`font-mono font-semibold ${c_text_title}`}>{emp.nip}</p>
                      <span className="text-[10px] capitalize text-zinc-500">{emp.contractType}</span>
                    </td>
                    <td className="py-4 px-6">
                      <p className={`font-semibold ${c_text_title}`}>{emp.department}</p>
                      <span className="text-[10px] text-zinc-500 capitalize">{emp.role.replace('_', ' ')}</span>
                    </td>
                    <td className="py-4 px-6 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                        <Mail className="w-3 h-3" />
                        <span>{emp.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                        <Phone className="w-3 h-3" />
                        <span>{emp.phone}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {emp.skills.map(s => (
                          <span key={s} className={`text-[9px] px-2 py-0.5 rounded ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-700 border'}`}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono font-semibold">{formatRupiah(emp.baseSalary)}</td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase ${emp.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : emp.status === 'on_leave' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                        {emp.status === 'active' ? 'Aktif' : emp.status === 'on_leave' ? 'Cuti' : 'Resign'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(emp)}
                          className={`p-1.5 border rounded-lg hover:text-[#3370FF] ${isDark ? 'border-zinc-800 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-100'}`}
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(emp.id)}
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
          <div className={`w-full max-w-lg border p-6 rounded-xl shadow-2xl space-y-6 ${c_modal}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${c_border}`}>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">{editingEmployee ? 'Perbarui Data Karyawan' : 'Tambah Karyawan Baru'}</h3>
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
                  <label className="block text-zinc-500 mb-1">NIP (Nomor Induk Pegawai)</label>
                  <input 
                    type="text" 
                    required
                    value={formData.nip} 
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                    placeholder="Budi Santoso"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1">Departemen</label>
                  <select 
                    value={formData.department} 
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`}
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Security">Security</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Admin">Admin</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Peran Kerja (Role)</label>
                  <select 
                    value={formData.role} 
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`}
                  >
                    <option value="teknisi_mep">Teknisi MEP</option>
                    <option value="operator_bas">Operator BAS</option>
                    <option value="security">Petugas Keamanan</option>
                    <option value="cleaning">Petugas Kebersihan</option>
                    <option value="admin">Administrator</option>
                    <option value="management">Manajemen</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1">No. Handphone</label>
                  <input 
                    type="text" 
                    required
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                    placeholder="0812-xxxx-xxxx"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Email Corporate</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                    placeholder="name@lintasarta.co.id"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1">Tanggal Bergabung</label>
                  <input 
                    type="date" 
                    required
                    value={formData.joinDate} 
                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Gaji Pokok Bulanan (IDR)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.baseSalary} 
                    onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1">Jenis Kontrak</label>
                  <select 
                    value={formData.contractType} 
                    onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`}
                  >
                    <option value="permanent">Karyawan Tetap (Permanent)</option>
                    <option value="pkwt">Kontrak (PKWT)</option>
                    <option value="outsource">Outsource</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Status Karyawan</label>
                  <select 
                    value={formData.status} 
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`}
                  >
                    <option value="active">Aktif Bekerja</option>
                    <option value="on_leave">Cuti</option>
                    <option value="inactive">Resign / Non-aktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">Keahlian / Sertifikasi (Pisahkan dengan koma)</label>
                <input 
                  type="text" 
                  value={formData.skillsString} 
                  onChange={(e) => setFormData({ ...formData, skillsString: e.target.value })}
                  placeholder="HVAC, BAS, Kelistrikan, K3" 
                  className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                />
              </div>

              <button type="submit" className="w-full py-2.5 bg-[#3370FF] hover:bg-[#5B8EFF] text-white rounded-lg font-semibold transition-colors mt-4">
                {editingEmployee ? 'Simpan Perubahan' : 'Simpan Karyawan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
