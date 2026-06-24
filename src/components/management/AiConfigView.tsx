'use client';
import React, { useState, useEffect } from 'react';
import { Bot, RefreshCw, ToggleLeft, ToggleRight, Sparkles, CheckCircle2, AlertTriangle, Cpu } from 'lucide-react';

export default function AiConfigView({ isDark, token }: { isDark: boolean; token: string }) {
  const c_card = isDark ? 'bg-zinc-900/30 border-zinc-800/80' : 'bg-white border-zinc-200 shadow-sm';
  const c_inner_card = isDark ? 'bg-[#0A1628]/60 border-zinc-800/80' : 'bg-zinc-50 border-zinc-200/60';
  const c_text = isDark ? 'text-white' : 'text-zinc-800';
  const c_sub = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const [enabled, setEnabled] = useState(true);
  const [ollamaOnline, setOllamaOnline] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState('');
  const [model, setModel] = useState('');
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Fetch status of AI Bot
  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chat');
      const data = await res.json();
      if (data.success) {
        setEnabled(data.enabled);
        setOllamaOnline(data.ollamaOnline);
        setOllamaUrl(data.ollamaUrl);
        setModel(data.model);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Toggle AI Bot Active State
  const handleToggle = async () => {
    const nextState = !enabled;
    setEnabled(nextState);
    try {
      const res = await fetch('/api/management/app-settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          updates: [
            { key: 'ai_bot_enabled', value: String(nextState) }
          ]
        })
      });
      const data = await res.json();
      if (data.success) {
        // Dispatch event so HelpBot immediately reacts on screen
        window.dispatchEvent(new Event('settings-updated'));
      } else {
        alert(data.error || 'Gagal merubah status bot');
        setEnabled(!nextState); // rollback
      }
    } catch (err) {
      console.error(err);
      setEnabled(!nextState); // rollback
    }
  };

  // Test Connection to Ollama
  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const startTime = Date.now();
    try {
      const res = await fetch('/api/chat');
      const data = await res.json();
      const latency = Date.now() - startTime;
      if (data.success) {
        setOllamaOnline(data.ollamaOnline);
        if (data.ollamaOnline) {
          setTestResult({
            success: true,
            message: `Koneksi ke Ollama sukses! Latensi ping: ${latency}ms. Model "${data.model}" siap digunakan.`
          });
        } else {
          setTestResult({
            success: false,
            message: `Gagal terhubung ke Ollama di ${data.ollamaUrl}. Pastikan servis Ollama berjalan di mesin lokal.`
          });
        }
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Error uji koneksi: ${err.message || 'Server error'}`
      });
    }
    setTesting(false);
  };

  return (
    <div className="space-y-6 max-w-4xl font-sans">
      <div>
        <h2 className={`text-lg font-bold flex items-center gap-2 ${c_text}`}>
          <Bot className="w-5 h-5 text-[#3370FF]" />
          AI Copilot Configuration
        </h2>
        <p className={`text-xs ${c_sub}`}>
          Pengaturan status aktif dan pengecekan konektivitas asisten AI (Ollama) — Phase 2 Advance Menu
        </p>
      </div>

      <div className={`border rounded-xl p-6 space-y-6 ${c_card}`}>
        {/* Toggle Switch Card */}
        <div className={`border rounded-xl p-5 flex items-center justify-between transition-all ${c_inner_card}`}>
          <div className="space-y-1 pr-4">
            <h4 className={`text-sm font-bold flex items-center gap-1.5 ${c_text}`}>
              Status Asisten AI (Chatbot)
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h4>
            <p className={`text-xs ${c_sub}`}>
              Bila diaktifkan, tombol balon obrolan floating akan muncul di pojok kanan bawah halaman untuk semua pengguna terotentikasi.
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={loading}
            className={`transition-transform duration-200 hover:scale-105 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={enabled ? 'Matikan AI Copilot' : 'Nyalakan AI Copilot'}
          >
            {enabled ? (
              <ToggleRight className="w-14 h-8 text-[#3370FF] fill-[#3370FF]/10 cursor-pointer" />
            ) : (
              <ToggleLeft className="w-14 h-8 text-zinc-400 cursor-pointer" />
            )}
          </button>
        </div>

        {/* System Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`border rounded-xl p-4 space-y-3 ${c_inner_card}`}>
            <h5 className={`text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5`}>
              <Cpu className="w-3.5 h-3.5" />
              Spesifikasi LLM Lokal
            </h5>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-zinc-500/10">
                <span className={c_sub}>Model Terpasang:</span>
                <span className={`font-mono font-bold ${c_text}`}>{model || 'Loading...'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-500/10">
                <span className={c_sub}>Base URL Endpoint:</span>
                <span className={`font-mono ${c_text}`}>{ollamaUrl || 'Loading...'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className={c_sub}>Mode AI Copilot:</span>
                <span className="text-[#3370FF] font-semibold">Bahasa Indonesia (SOP Lintasarta)</span>
              </div>
            </div>
          </div>

          <div className={`border rounded-xl p-4 flex flex-col justify-between ${c_inner_card}`}>
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Status Konektivitas Servis
              </h5>
              <div className="flex items-center gap-4 mt-2">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 block">Status Fitur:</span>
                  {enabled ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Aktif (ON)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                      Nonaktif (OFF)
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 block">Koneksi Servis Ollama:</span>
                  {ollamaOnline ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Online
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                      Offline
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="px-3.5 py-1.5 bg-[#3370FF] hover:bg-[#5B8EFF] disabled:opacity-55 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {testing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Uji Koneksi
              </button>
            </div>
          </div>
        </div>

        {/* Test Result Box */}
        {testResult && (
          <div className={`border rounded-xl p-4 flex gap-3 animate-fade-in ${
            testResult.success 
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/5 border-red-500/20 text-red-400'
          }`}>
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400" />
            )}
            <div className="space-y-1">
              <h5 className="text-xs font-bold">Hasil Uji Koneksi</h5>
              <p className="text-xs text-zinc-400 leading-relaxed">{testResult.message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
