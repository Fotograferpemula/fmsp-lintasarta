'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { RefreshCw, TrendingUp, TrendingDown, BarChart2, PieChartIcon, Activity } from 'lucide-react';

interface AnalyticsData {
  complianceTrend: { bulan: string; rate: number; total: number; expired: number }[];
  woTrend: { bulan: string; open: number; in_progress: number; resolved: number; closed: number }[];
  woByCategory: { name: string; value: number }[];
  assetTypeData: { name: string; count: number; value: number }[];
  locationData: { name: string; fullName: string; count: number; value: number; good: number; warning: number; broken: number }[];
  maintStatusData: { name: string; value: number }[];
  depreciationData: { name: string; purchaseCost: number; currentValue: number; depreciatedPct: number }[];
  activityData: { name: string; count: number }[];
  summary: { totalAssets: number; totalDocs: number; totalWO: number; totalMaint: number; overallCompliance: number };
}

interface Props { token: string; isDark: boolean; }

const BRAND   = '#3370FF';
const COLORS  = ['#3370FF', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];
const STATUS_COLORS = { scheduled: '#3370FF', overdue: '#ef4444', completed: '#10b981', in_progress: '#f59e0b' };

const formatRp = (v: number) => v >= 1e9 ? `Rp ${(v/1e9).toFixed(1)}M` : v >= 1e6 ? `Rp ${(v/1e6).toFixed(0)}jt` : `Rp ${v.toLocaleString('id-ID')}`;

const CustomTooltipCompliance = ({ active, payload, label, isDark }: any) => {
  if (!active || !payload?.length) return null;
  const bg = isDark ? '#0F1C33' : 'white';
  const border = isDark ? '#1A2744' : '#E0E8F5';
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '10px 14px', fontSize: 11 }}>
      <p style={{ fontWeight: 700, marginBottom: 4, color: isDark ? 'white' : '#111' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: <strong>{typeof p.value === 'number' && p.name === 'rate' ? `${p.value}%` : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

const SectionTitle = ({ icon, title, subtitle, isDark }: { icon: string; title: string; subtitle?: string; isDark: boolean }) => (
  <div className="flex items-center gap-3 mb-4">
    <span className="text-2xl">{icon}</span>
    <div>
      <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-zinc-800'}`}>{title}</h3>
      {subtitle && <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{subtitle}</p>}
    </div>
  </div>
);

export default function AnalyticsView({ token, isDark }: Props) {
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const c = {
    bg:     isDark ? 'bg-[#1B1F26]' : 'bg-[#F0F1F3]',
    card:   isDark ? 'bg-[#0F1C33] border-[#373C43]' : 'bg-white border-[#DEE0E3]',
    text:   isDark ? 'text-white' : 'text-zinc-800',
    sub:    isDark ? 'text-zinc-400' : 'text-zinc-500',
    grid:   isDark ? '#1A2744' : '#E0E8F5',
    tick:   isDark ? '#52525b' : '#a1a1aa',
    tooltip: { contentStyle: { background: isDark ? '#0F1C33' : 'white', border: `1px solid ${isDark ? '#1A2744' : '#E0E8F5'}`, borderRadius: 12, fontSize: 11 }, labelStyle: { color: isDark ? 'white' : '#111', fontWeight: 700 } },
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/analytics', { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.success) setData(d.data);
      else setError(d.error);
    } catch { setError('Gagal memuat data analytics'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-[#3370FF] mx-auto mb-3" />
        <p className={`text-sm ${c.sub}`}>Memuat data analytics...</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-red-400 text-sm">{error || 'Data tidak tersedia'}</p>
    </div>
  );

  const { summary, complianceTrend, woTrend, woByCategory, assetTypeData, locationData, maintStatusData, depreciationData, activityData } = data;

  // Compliance delta
  const latestRate = complianceTrend[complianceTrend.length - 1]?.rate ?? 0;
  const prevRate   = complianceTrend[complianceTrend.length - 2]?.rate ?? 0;
  const delta      = latestRate - prevRate;

  return (
    <div className="space-y-6 p-4 md:p-6">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className={`rounded-xl border p-5 ${c.card}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className={`text-lg font-bold ${c.text}`}>Analytics & Insights</h2>
            <p className={`text-xs mt-0.5 ${c.sub}`}>Visualisasi data portofolio 12 bulan terakhir</p>
          </div>
          <button onClick={fetchData} disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${c.card} ${c.sub}`}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#3370FF]' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Quick KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
          {[
            { label: 'Total Aset',        value: summary.totalAssets,      icon: '🏢', color: 'text-[#3370FF]' },
            { label: 'Total Dokumen',     value: summary.totalDocs,        icon: '📄', color: isDark ? 'text-white' : 'text-zinc-800' },
            { label: 'Work Order',        value: summary.totalWO,          icon: '🔧', color: 'text-amber-400' },
            { label: 'Jadwal PM',         value: summary.totalMaint,       icon: '📅', color: 'text-purple-400' },
            {
              label: 'Compliance Rate',
              value: `${summary.overallCompliance}%`,
              icon: summary.overallCompliance >= 80 ? '✅' : '⚠️',
              color: summary.overallCompliance >= 80 ? 'text-emerald-400' : 'text-amber-400',
            },
          ].map(k => (
            <div key={k.label} className={`rounded-xl border p-3 text-center ${isDark ? 'bg-[#1B1F26] border-[#373C43]' : 'bg-[#F8FAFF] border-[#DEE0E3]'}`}>
              <p className="text-xl">{k.icon}</p>
              <p className={`text-xl font-bold mt-1 ${k.color}`}>{k.value}</p>
              <p className={`text-[10px] mt-0.5 ${c.sub}`}>{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── ROW 1: Compliance Trend (Line) + WO Trend (Area) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Compliance Rate Trend */}
        <div className={`rounded-xl border p-5 ${c.card}`}>
          <div className="flex items-start justify-between mb-1">
            <SectionTitle icon="📈" title="Trend Compliance Rate" subtitle="12 bulan terakhir" isDark={isDark} />
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${delta >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {delta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {delta >= 0 ? '+' : ''}{delta}%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={complianceTrend} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
              <XAxis dataKey="bulan" tick={{ fill: c.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: c.tick, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} width={38} />
              <Tooltip {...c.tooltip} formatter={(v: any) => [`${v}%`, 'Rate']} />
              <Line type="monotone" dataKey="rate" stroke={BRAND} strokeWidth={2.5} dot={{ fill: BRAND, r: 3 }} activeDot={{ r: 5 }} name="rate" />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center gap-4 text-[10px]">
            <span className={c.sub}>Bulan ini: <strong className={`${latestRate >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{latestRate}%</strong></span>
            <span className={c.sub}>Dokumen expired: <strong className="text-red-400">{complianceTrend[complianceTrend.length - 1]?.expired ?? 0}</strong></span>
          </div>
        </div>

        {/* Work Order Trend (Area) */}
        <div className={`rounded-xl border p-5 ${c.card}`}>
          <SectionTitle icon="🔧" title="Work Order per Bulan" subtitle="Breakdown status 12 bulan" isDark={isDark} />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={woTrend} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
              <XAxis dataKey="bulan" tick={{ fill: c.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: c.tick, fontSize: 10 }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
              <Tooltip {...c.tooltip} />
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
              <Area type="monotone" dataKey="open"        stackId="1" stroke="#3370FF" fill="#3370FF20" name="Open" />
              <Area type="monotone" dataKey="in_progress" stackId="1" stroke="#f59e0b" fill="#f59e0b20" name="In Progress" />
              <Area type="monotone" dataKey="resolved"    stackId="1" stroke="#10b981" fill="#10b98120" name="Resolved" />
              <Area type="monotone" dataKey="closed"      stackId="1" stroke="#6b7280" fill="#6b728020" name="Closed" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── ROW 2: Aset per Tipe (Bar) + Lokasi (Bar) ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Asset Type Bar */}
        <div className={`rounded-xl border p-5 ${c.card}`}>
          <SectionTitle icon="🏢" title="Nilai Aset per Tipe" subtitle="Book value dalam miliar rupiah" isDark={isDark} />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={assetTypeData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: c.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: c.tick, fontSize: 10 }} axisLine={false} tickLine={false} width={40} tickFormatter={v => `${(v/1e9).toFixed(0)}M`} />
              <Tooltip {...c.tooltip} formatter={(v: any) => [formatRp(v), 'Nilai']} />
              <Bar dataKey="value" name="Nilai" radius={[6, 6, 0, 0]}>
                {assetTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Location Bar */}
        <div className={`rounded-xl border p-5 ${c.card}`}>
          <SectionTitle icon="📍" title="Distribusi Aset per Lokasi" subtitle="Jumlah & kondisi aset per gedung" isDark={isDark} />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={locationData} layout="vertical" margin={{ top: 5, right: 10, bottom: 5, left: 80 }} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.grid} horizontal={false} />
              <XAxis type="number" tick={{ fill: c.tick, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: c.tick, fontSize: 9 }} axisLine={false} tickLine={false} width={78} />
              <Tooltip {...c.tooltip} formatter={(v: any, name: any) => [v, name === 'good' ? '✅ Baik' : name === 'warning' ? '⚠️ Warning' : '🔴 Rusak']} />
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} formatter={(v) => v === 'good' ? '✅ Baik' : v === 'warning' ? '⚠️ Warning' : '🔴 Rusak'} />
              <Bar dataKey="good"    stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} name="good" />
              <Bar dataKey="warning" stackId="a" fill="#f59e0b" name="warning" />
              <Bar dataKey="broken"  stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} name="broken" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── ROW 3: WO Kategori (Pie) + Maintenance (Pie) ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* WO by Category Pie */}
        <div className={`rounded-xl border p-5 ${c.card}`}>
          <SectionTitle icon="🍩" title="WO per Kategori" isDark={isDark} />
          {woByCategory.length === 0 ? (
            <div className={`flex items-center justify-center h-48 ${c.sub} text-xs`}>Belum ada data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={woByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {woByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip {...c.tooltip} formatter={(v: any) => [v, 'Work Order']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Maintenance Status Pie */}
        <div className={`rounded-xl border p-5 ${c.card}`}>
          <SectionTitle icon="📅" title="Status Jadwal PM" isDark={isDark} />
          {maintStatusData.length === 0 ? (
            <div className={`flex items-center justify-center h-48 ${c.sub} text-xs`}>Belum ada data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={maintStatusData} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value" nameKey="name">
                  {maintStatusData.map((entry, i) => (
                    <Cell key={i} fill={(STATUS_COLORS as any)[entry.name] || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...c.tooltip} />
                <Legend wrapperStyle={{ fontSize: 10 }} formatter={(v) =>
                  v === 'scheduled' ? '📋 Terjadwal' : v === 'overdue' ? '🔴 Terlambat' : v === 'completed' ? '✅ Selesai' : v
                } />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Activity Chart (Bar) */}
        <div className={`rounded-xl border p-5 ${c.card}`}>
          <SectionTitle icon="⚡" title="Aktivitas 12 Minggu" subtitle="Audit log entries per minggu" isDark={isDark} />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={activityData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: c.tick, fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: c.tick, fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...c.tooltip} />
              <Bar dataKey="count" name="Aktivitas" fill={BRAND} radius={[4, 4, 0, 0]} fillOpacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── ROW 4: Depresiasi Aset ────────────────────────────── */}
      {depreciationData.length > 0 && (
        <div className={`rounded-xl border p-5 ${c.card}`}>
          <SectionTitle icon="📉" title="Estimasi Depresiasi Aset" subtitle="Nilai beli vs nilai buku saat ini berdasarkan estimasi umur pakai" isDark={isDark} />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={depreciationData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: c.tick, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: c.tick, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1e9).toFixed(1)}M`} width={44} />
              <Tooltip {...c.tooltip} formatter={(v: any, name: any) => [formatRp(v as number), name === 'purchaseCost' ? '💰 Harga Beli' : '📊 Nilai Saat Ini']} />
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} formatter={v => v === 'purchaseCost' ? '💰 Harga Beli' : '📊 Nilai Saat Ini'} />
              <Bar dataKey="purchaseCost" fill={isDark ? '#1A2744' : '#C7D9FF'} radius={[6, 6, 0, 0]} name="purchaseCost" barSize={28} />
              <Bar dataKey="currentValue" fill={BRAND} radius={[6, 6, 0, 0]} name="currentValue" barSize={28} />
            </BarChart>
          </ResponsiveContainer>

          {/* Depreciation table summary */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={isDark ? 'text-zinc-500' : 'text-zinc-400'}>
                  <th className="text-left py-1.5 pr-4 font-semibold">Tipe</th>
                  <th className="text-right py-1.5 pr-4 font-semibold">Harga Beli</th>
                  <th className="text-right py-1.5 pr-4 font-semibold">Nilai Saat Ini</th>
                  <th className="text-right py-1.5 font-semibold">Depresiasi</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: isDark ? '#1A2744' : '#E0E8F5' }}>
                {depreciationData.map((d, i) => (
                  <tr key={i}>
                    <td className={`py-1.5 pr-4 font-semibold ${c.text}`}>{d.name}</td>
                    <td className={`py-1.5 pr-4 text-right ${c.sub}`}>{formatRp(d.purchaseCost!)}</td>
                    <td className={`py-1.5 pr-4 text-right text-[#3370FF] font-semibold`}>{formatRp(d.currentValue)}</td>
                    <td className={`py-1.5 text-right font-bold ${d.depreciatedPct >= 75 ? 'text-red-400' : d.depreciatedPct >= 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {d.depreciatedPct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer note */}
      <p className={`text-center text-[10px] pb-20 md:pb-6 ${c.sub}`}>
        Data diperbarui real-time dari database FMSP · {new Date().toLocaleString('id-ID')}
      </p>
    </div>
  );
}
