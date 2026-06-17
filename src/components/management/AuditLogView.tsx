'use client';
import React, { useState, useEffect } from 'react';
import { ScrollText, RefreshCw, Search, Download } from 'lucide-react';

interface AuditLogItem {
  id: string; timestamp: string; user: string; action: string; resource: string; details: string; ip: string;
}

export default function AuditLogView({ isDark, token }: { isDark: boolean; token: string }) {
  const c_card = isDark ? 'bg-zinc-900/30 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm';
  const c_input = isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-800';
  const c_text = isDark ? 'text-white' : 'text-zinc-800';
  const c_sub = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const c_tbl_h = isDark ? 'bg-zinc-950/40 text-zinc-400' : 'bg-zinc-100 text-zinc-600';
  const c_tbl_r = isDark ? 'hover:bg-zinc-900/10 border-zinc-800/60' : 'hover:bg-zinc-50 border-zinc-200';

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (search) params.set('user', search);
      const res = await fetch(`/api/audit-logs?${params}`, { headers });
      const data = await res.json();
      if (data.success) { setLogs(data.data); setTotalPages(data.pagination?.totalPages || 1); }
    } catch (e) {}
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, [page]);

  const actionColor = (a: string) => {
    if (a.includes('DELETE')) return 'text-red-400';
    if (a.includes('CREATE')) return 'text-emerald-400';
    if (a.includes('UPDATE')) return 'text-amber-400';
    if (a.includes('LOGIN')) return 'text-blue-400';
    return 'text-zinc-400';
  };

  const handleExportCSV = () => {
    const csv = ['Timestamp,User,Action,Resource,Details']
      .concat(logs.map(l => `"${l.timestamp}","${l.user}","${l.action}","${l.resource}","${l.details.replace(/"/g, '""')}"`))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `audit_log_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className={`text-lg font-bold ${c_text}`}>Audit Log</h2><p className={`text-xs ${c_sub}`}>Catatan aktivitas sistem — BRD §4 (Admin Only)</p></div>
        <div className="flex gap-2">
          <div className="relative"><Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${c_sub}`} /><input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchData()} placeholder="Filter user..." className={`pl-9 pr-3 py-2 text-xs border rounded-lg w-48 ${c_input}`} /></div>
          <button onClick={fetchData} className={`p-2 rounded-lg border ${c_card}`}><RefreshCw className="w-4 h-4" /></button>
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"><Download className="w-3.5 h-3.5" /> CSV</button>
        </div>
      </div>

      <div className={`border rounded-xl overflow-hidden ${c_card}`}>
        <table className="w-full text-xs">
          <thead><tr className={c_tbl_h}>
            <th className="px-4 py-3 text-left font-semibold">Waktu</th>
            <th className="px-4 py-3 text-left font-semibold">User</th>
            <th className="px-4 py-3 text-left font-semibold">Aksi</th>
            <th className="px-4 py-3 text-left font-semibold">Resource</th>
            <th className="px-4 py-3 text-left font-semibold">Detail</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="text-center py-8"><RefreshCw className="w-5 h-5 mx-auto animate-spin text-[#1769FF]" /></td></tr> :
            logs.length === 0 ? <tr><td colSpan={5} className={`text-center py-8 ${c_sub}`}>Tidak ada log.</td></tr> :
            logs.map(log => (
              <tr key={log.id} className={`border-t ${c_tbl_r}`}>
                <td className={`px-4 py-3 font-mono ${c_sub}`}>{new Date(log.timestamp).toLocaleString('id-ID')}</td>
                <td className={`px-4 py-3 ${c_text}`}>{log.user}</td>
                <td className={`px-4 py-3 font-bold ${actionColor(log.action)}`}>{log.action}</td>
                <td className="px-4 py-3">{log.resource}</td>
                <td className={`px-4 py-3 max-w-xs truncate ${c_sub}`} title={log.details}>{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2">
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className={`px-3 py-1.5 text-xs font-semibold border rounded-lg disabled:opacity-30 ${c_card}`}>← Prev</button>
        <span className={`text-xs ${c_sub}`}>Hal {page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className={`px-3 py-1.5 text-xs font-semibold border rounded-lg disabled:opacity-30 ${c_card}`}>Next →</button>
      </div>
    </div>
  );
}
