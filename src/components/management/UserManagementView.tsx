'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, UserPlus, Shield, Eye, Edit3, UserX, UserCheck,
  Search, X, ChevronDown, RefreshCw, Phone, Building2, MapPin,
} from 'lucide-react';
import { ROLES, ROLE_NAMES, getRoleConfig, canManageRole, getAssignableRoles, type RoleName } from '@/lib/rbac';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  department?: string;
  phone?: string;
  region?: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  token: string;
  isDark: boolean;
  currentUserEmail: string;
  currentUserRole: string;
}

const ROLE_ICONS: Record<string, string> = {
  superadmin: '👑',
  manager_fms: '📊',
  admin_pusat: '🛡️',
  admin_regional: '🌍',
  admin_lokasi: '📍',
  user: '👤',
};

const EMPTY_FORM = {
  name: '', email: '', role: 'user', password: '', department: '', phone: '', region: '',
};

export default function UserManagementView({ token, isDark, currentUserEmail, currentUserRole }: Props) {
  const [users, setUsers]           = useState<User[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showInactive, setShowInactive] = useState(false);

  // Modal state
  const [showModal, setShowModal]   = useState(false);
  const [editUser, setEditUser]     = useState<User | null>(null);
  const [form, setForm]             = useState({ ...EMPTY_FORM });
  const [formError, setFormError]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState<{ userId: string; userName: string; deactivate: boolean } | null>(null);

  // Assignable roles for current user
  const assignableRoles = getAssignableRoles(currentUserRole);

  // Color shortcuts
  const c = {
    card:  isDark ? 'bg-[#0F1C33] border-[#1A2744]' : 'bg-white border-[#E0E8F5]',
    inner: isDark ? 'bg-[#0B1628] border-[#1A2744]' : 'bg-[#F8FAFF] border-[#E0E8F5]',
    input: isDark ? 'bg-[#0B1628] border-[#1A2744] text-white placeholder-zinc-600' : 'bg-white border-[#D1DEF5] text-zinc-800 placeholder-zinc-400',
    text:  isDark ? 'text-white' : 'text-zinc-800',
    sub:   isDark ? 'text-zinc-400' : 'text-zinc-500',
    th:    isDark ? 'bg-[#0B1628] text-zinc-400' : 'bg-[#F0F5FF] text-zinc-500',
    hover: isDark ? 'hover:bg-white/5' : 'hover:bg-[#F8FAFF]',
    border: isDark ? 'border-[#1A2744]' : 'border-[#E0E8F5]',
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/management/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      if (data.success) setUsers(data.data);
      else setError(data.error || 'Gagal memuat data');
    } catch { setError('Koneksi error'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = () => {
    setEditUser(null);
    setForm({ ...EMPTY_FORM, role: assignableRoles[assignableRoles.length - 1] || 'user' });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, role: u.role, password: '', department: u.department || '', phone: u.phone || '', region: u.region || '' });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      if (editUser) {
        const body: any = { id: editUser.id, name: form.name, role: form.role, department: form.department, phone: form.phone, region: form.region };
        if (form.password) body.newPassword = form.password;
        const r = await fetch('/api/management/users', {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await r.json();
        if (!data.success) { setFormError(data.error); return; }
      } else {
        const r = await fetch('/api/management/users', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await r.json();
        if (!data.success) { setFormError(data.error); return; }
      }
      setShowModal(false);
      fetchUsers();
    } catch { setFormError('Terjadi kesalahan'); }
    finally { setSubmitting(false); }
  };

  const handleToggleActive = async (userId: string, activate: boolean) => {
    try {
      if (!activate) {
        const r = await fetch(`/api/management/users?id=${userId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await r.json();
        if (!data.success) { alert(data.error); return; }
      } else {
        const r = await fetch('/api/management/users', {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: userId, isActive: true }),
        });
        const data = await r.json();
        if (!data.success) { alert(data.error); return; }
      }
      setShowConfirm(null);
      fetchUsers();
    } catch { alert('Terjadi kesalahan'); }
  };

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase()) ||
                        u.department?.toLowerCase().includes(search.toLowerCase()) ||
                        u.region?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchActive = showInactive ? true : u.isActive;
    return matchSearch && matchRole && matchActive;
  });

  // Group stats by role
  const roleCounts = ROLE_NAMES.reduce((acc, r) => {
    acc[r] = users.filter(u => u.role === r && u.isActive).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 p-6">
      {/* ── Header ── */}
      <div className={`rounded-2xl border p-6 ${c.card}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className={`text-lg font-bold ${c.text}`}>Manajemen Pengguna</h2>
            <p className={`text-xs mt-1 ${c.sub}`}>Kelola akun, role, dan akses pengguna FMSP — RBAC 6 tingkat</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1769FF] hover:bg-[#4A8AFF] text-white rounded-xl text-sm font-semibold shadow-lg shadow-[#1769FF]/20 transition-all active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4" />
            Tambah User
          </button>
        </div>

        {/* Stats — show all roles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mt-5">
          <div className={`rounded-xl border p-3 text-center ${c.inner}`}>
            <p className="text-xl">👥</p>
            <p className={`text-2xl font-bold mt-1 text-[#1769FF]`}>{users.length}</p>
            <p className={`text-[9px] mt-0.5 ${c.sub}`}>Total</p>
          </div>
          {ROLE_NAMES.map(r => {
            const rc = getRoleConfig(r);
            return (
              <div key={r} className={`rounded-xl border p-3 text-center ${c.inner}`}>
                <p className="text-lg">{ROLE_ICONS[r]}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: rc.color }}>{roleCounts[r] || 0}</p>
                <p className={`text-[9px] mt-0.5 ${c.sub}`}>{rc.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className={`flex flex-col sm:flex-row gap-3 p-4 rounded-2xl border ${c.card}`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text" placeholder="Cari nama, email, departemen, region..."
            value={search} onChange={e => setSearch(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm outline-none focus:border-[#1769FF] transition-colors ${c.input}`}
          />
        </div>
        <select
          value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className={`px-3 py-2 rounded-xl border text-sm outline-none ${c.input}`}
        >
          <option value="all">Semua Role</option>
          {ROLE_NAMES.map(r => (
            <option key={r} value={r}>{ROLE_ICONS[r]} {getRoleConfig(r).label}</option>
          ))}
        </select>
        <label className={`flex items-center gap-2 text-xs cursor-pointer ${c.sub}`}>
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="rounded" />
          Tampilkan non-aktif
        </label>
        <button onClick={fetchUsers} disabled={loading}
          className={`p-2 rounded-xl border transition-colors ${c.inner}`}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#1769FF]' : c.sub}`} />
        </button>
      </div>

      {/* ── User Table ── */}
      {error ? (
        <div className="text-center py-12 text-red-400 text-sm">{error}</div>
      ) : (
        <div className={`rounded-2xl border overflow-hidden ${c.card}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-xs font-semibold uppercase tracking-wider ${c.th}`}>
                  <th className="py-3 px-4 text-left">Pengguna</th>
                  <th className="py-3 px-4 text-left hidden sm:table-cell">Role</th>
                  <th className="py-3 px-4 text-left hidden md:table-cell">Region</th>
                  <th className="py-3 px-4 text-left hidden lg:table-cell">Departemen</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: isDark ? '#1A2744' : '#E0E8F5' }}>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="py-3 px-4">
                          <div className={`h-4 rounded animate-pulse ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={`py-12 text-center ${c.sub} text-sm`}>
                      Tidak ada user ditemukan
                    </td>
                  </tr>
                ) : (
                  filtered.map(u => {
                    const rc = getRoleConfig(u.role);
                    const isSelf = u.email === currentUserEmail;
                    const canManage = canManageRole(currentUserRole, u.role) && !isSelf;
                    return (
                      <tr key={u.id} className={`transition-colors ${c.hover}`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0`}
                              style={{ 
                                backgroundColor: u.isActive ? rc.bgColor : 'rgba(113,113,122,0.1)',
                                color: u.isActive ? rc.color : '#71717a',
                              }}
                            >
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className={`font-semibold text-sm truncate ${u.isActive ? c.text : 'text-zinc-500 line-through'}`}>
                                {u.name} {isSelf && <span className="text-[10px] text-[#1769FF] font-bold no-underline">(Anda)</span>}
                              </p>
                              <p className={`text-xs truncate ${c.sub}`}>{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <span 
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border"
                            style={{ color: rc.color, backgroundColor: rc.bgColor, borderColor: rc.color + '30' }}
                          >
                            {ROLE_ICONS[u.role] || '👤'} {rc.label}
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-xs hidden md:table-cell ${c.sub}`}>
                          {u.region ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-emerald-400" />
                              <span className="truncate max-w-[140px]">{u.region}</span>
                            </span>
                          ) : (
                            <span className="italic opacity-50">Global</span>
                          )}
                        </td>
                        <td className={`py-3 px-4 text-xs hidden lg:table-cell ${c.sub}`}>
                          {u.department || <span className="italic opacity-50">—</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            u.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                          }`}>
                            {u.isActive ? 'Aktif' : 'Non-aktif'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {(canManage || isSelf) && (
                              <button
                                onClick={() => openEdit(u)}
                                title="Edit"
                                className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canManage && (
                              <button
                                onClick={() => setShowConfirm({ userId: u.id, userName: u.name, deactivate: u.isActive })}
                                title={u.isActive ? 'Nonaktifkan' : 'Aktifkan kembali'}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  u.isActive
                                    ? 'hover:bg-red-500/10 text-red-400'
                                    : 'hover:bg-emerald-500/10 text-emerald-400'
                                }`}
                              >
                                {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className={`w-full sm:max-w-md border rounded-t-2xl sm:rounded-2xl shadow-2xl modal-mobile sm:modal-desktop ${c.card}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${c.border}`}>
              <div>
                <h3 className={`text-sm font-bold ${c.text}`}>
                  {editUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
                </h3>
                <p className={`text-xs mt-0.5 ${c.sub}`}>
                  {editUser ? `Mengedit: ${editUser.email}` : 'Buat akun pengguna baru'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className={`text-xs font-medium ${c.sub} hover:text-red-400 transition-colors`}>✕ Tutup</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm max-h-[70vh] overflow-y-auto">
              {/* Name */}
              <div>
                <label className={`block text-xs font-semibold mb-1 ${c.sub}`}>Nama Lengkap *</label>
                <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="contoh: Ahmad Fauzi" className={`w-full px-3 py-2.5 rounded-xl border outline-none focus:border-[#1769FF] text-sm transition-colors ${c.input}`} />
              </div>

              {/* Email — readonly on edit */}
              <div>
                <label className={`block text-xs font-semibold mb-1 ${c.sub}`}>Email *</label>
                <input type="email" required value={form.email} disabled={!!editUser}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="nama@lintasarta.co.id"
                  className={`w-full px-3 py-2.5 rounded-xl border outline-none text-sm ${editUser ? 'opacity-50 cursor-not-allowed' : 'focus:border-[#1769FF]'} transition-colors ${c.input}`} />
              </div>

              {/* Role — 6 tier */}
              <div>
                <label className={`block text-xs font-semibold mb-1 ${c.sub}`}>Role *</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className={`w-full px-3 py-2.5 rounded-xl border outline-none focus:border-[#1769FF] text-sm ${c.input}`}>
                  {assignableRoles.map(r => {
                    const rc = getRoleConfig(r);
                    return (
                      <option key={r} value={r}>
                        {ROLE_ICONS[r]} {rc.label} — {rc.description}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Region */}
              <div>
                <label className={`block text-xs font-semibold mb-1 ${c.sub}`}>
                  Region / Lokasi
                  <span className={`font-normal ml-1 ${c.sub}`}>(wajib untuk Admin Regional & Admin Lokasi)</span>
                </label>
                <input type="text" value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                  placeholder="contoh: Jatiluhur, Purwakarta, Jawa Barat"
                  className={`w-full px-3 py-2.5 rounded-xl border outline-none focus:border-[#1769FF] text-sm transition-colors ${c.input}`} />
              </div>

              {/* Department + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${c.sub}`}>Departemen</label>
                  <input type="text" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    placeholder="FM, IT, HR..."
                    className={`w-full px-3 py-2.5 rounded-xl border outline-none focus:border-[#1769FF] text-sm ${c.input}`} />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${c.sub}`}>No. HP</label>
                  <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="08xxxxxxxxxx"
                    className={`w-full px-3 py-2.5 rounded-xl border outline-none focus:border-[#1769FF] text-sm ${c.input}`} />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className={`block text-xs font-semibold mb-1 ${c.sub}`}>
                  {editUser ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password *'}
                </label>
                <input type="password" value={form.password} required={!editUser}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder={editUser ? 'Isi untuk mengubah password' : 'Min. 8 karakter'}
                  className={`w-full px-3 py-2.5 rounded-xl border outline-none focus:border-[#1769FF] text-sm ${c.input}`} />
              </div>

              {formError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{formError}</p>
              )}

              <button type="submit" disabled={submitting}
                className="w-full py-2.5 bg-[#1769FF] hover:bg-[#4A8AFF] disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2">
                {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {editUser ? 'Simpan Perubahan' : 'Buat Pengguna'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Toggle Modal ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm border rounded-2xl shadow-2xl p-6 ${c.card}`}>
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">{showConfirm.deactivate ? '🚫' : '✅'}</div>
              <h3 className={`text-sm font-bold ${c.text}`}>
                {showConfirm.deactivate ? 'Nonaktifkan' : 'Aktifkan kembali'} pengguna?
              </h3>
              <p className={`text-xs mt-2 ${c.sub}`}>
                <strong>{showConfirm.userName}</strong> akan {showConfirm.deactivate ? 'tidak bisa login ke sistem' : 'dapat login kembali'}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(null)}
                className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-colors ${c.inner} ${c.sub}`}>
                Batal
              </button>
              <button
                onClick={() => handleToggleActive(showConfirm.userId, !showConfirm.deactivate)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold text-white transition-colors ${
                  showConfirm.deactivate ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
                }`}>
                Ya, {showConfirm.deactivate ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
