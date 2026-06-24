'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  source?: string;
}

const SUGGESTIONS = [
  { label: '❄️ Panduan AC', text: 'Bagaimana panduan pemeliharaan AC Presisi?' },
  { label: '🔌 Cek Panel Listrik', text: 'Bagaimana checklist pemeliharaan panel listrik?' },
  { label: '⚡ Checklist Genset', text: 'Bagaimana panduan perawatan genset?' },
  { label: '🛡️ Inspeksi APAR', text: 'Bagaimana cara inspeksi APAR?' },
  { label: '📝 Buat Work Order', text: 'Bagaimana cara membuat tiket Work Order?' },
  { label: '🏢 Manajemen Aset', text: 'Bagaimana cara menginput aset baru?' },
];

export default function HelpBot({ isDark }: { isDark: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [ollamaOnline, setOllamaOnline] = useState(false);
  const [ollamaModel, setOllamaModel] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Halo! Saya adalah **Asisten FMSP Lintasarta (Lokal)**. \n\nSaya bisa membantu menjawab operasional menu aplikasi atau memberikan panduan teknis pemeliharaan fasilitas (AC, Genset, Panel Listrik, APAR, dll.) untuk teknisi di lapangan. \n\n*Silakan ketik pertanyaan Anda atau pilih salah satu tombol saran di bawah!*',
      source: 'Sistem Bantuan'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSource, setActiveSource] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const checkBotStatus = async () => {
      try {
        const res = await fetch('/api/chat');
        const data = await res.json();
        if (data.success) {
          setIsEnabled(data.enabled);
          setOllamaOnline(data.ollamaOnline);
          setOllamaModel(data.model);
        }
      } catch (err) {
        console.error('Gagal memverifikasi status AI chatbot:', err);
      }
    };
    checkBotStatus();

    // Listen to settings update event to reactively toggle the bot
    const handleSettingsUpdate = () => {
      checkBotStatus();
    };
    window.addEventListener('settings-updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('settings-updated', handleSettingsUpdate);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setActiveSource(null);

    try {
      const chatHistory = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory }),
      });

      if (!res.ok) throw new Error('API server error');
      const data = await res.json();

      if (data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply,
          source: data.source
        }]);
        setActiveSource(data.source);
      } else {
        throw new Error(data.error || 'Gagal memproses pesan');
      }
    } catch (error) {
      console.error('Chat bot error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Maaf, terjadi kendala koneksi ke server asisten lokal. Silakan coba sesaat lagi.',
        source: 'Sistem Error'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format text (simple bold and newlines)
  const formatMessageContent = (text: string) => {
    return text.split('\n').map((line, idx) => {
      // Handle Bold text (**text**)
      const parts = line.split(/\*\*([^*]+)\*\*/g);
      const renderedLine = parts.map((part, pIdx) => {
        if (pIdx % 2 === 1) {
          return <strong key={pIdx} className="font-bold text-[#5B8EFF]">{part}</strong>;
        }
        return part;
      });

      return (
        <p key={idx} className={line.trim() === '' ? 'h-2' : 'min-h-[1em] leading-relaxed mb-1'}>
          {renderedLine}
        </p>
      );
    });
  };

  // Theme Styles
  const c_bg = isDark ? 'bg-[#0A1628] border-zinc-800 text-white shadow-2xl' : 'bg-white border-zinc-200 text-zinc-800 shadow-2xl';
  const c_header = isDark ? 'bg-[#0E1E36] border-zinc-800' : 'bg-[#3370FF] border-[#3370FF] text-white';
  const c_bubble_bot = isDark ? 'bg-[#12223c] text-zinc-200 border border-zinc-800/80' : 'bg-zinc-100 text-zinc-700 border border-zinc-200/50';
  const c_bubble_user = 'bg-[#3370FF] text-white';
  const c_input_container = isDark ? 'bg-[#1B1F26]/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200';
  const c_input = isDark ? 'text-white placeholder-zinc-500' : 'text-zinc-800 placeholder-zinc-400';

  if (!isEnabled) return null;

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[100] font-sans">
      {/* Floating Chat Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-tr from-[#3370FF] to-[#5B8EFF] text-white shadow-lg shadow-[#3370FF]/20 flex items-center justify-center hover:scale-105 transition-all duration-300 relative group`}
        aria-label="Buka Asisten Lintasarta"
      >
        {isOpen ? (
          <X className="w-5 h-5 md:w-6 md:h-6" />
        ) : (
          <>
            <MessageSquare className="w-5 h-5 md:w-6 md:h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-bounce" />
          </>
        )}
      </button>

      {/* Chat Box Popup Panel */}
      {isOpen && (
        <div
          className={`absolute bottom-16 right-0 w-[340px] sm:w-[380px] h-[520px] rounded-xl border flex flex-col overflow-hidden transition-all duration-300 transform origin-bottom-right scale-100 ${c_bg}`}
        >
          {/* Header */}
          <div className={`px-5 py-4 border-b flex items-center justify-between flex-shrink-0 ${c_header}`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
                  Asisten FMSP Lintasarta
                  <Sparkles className="w-3 h-3 text-amber-300" />
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                  <span className="text-[9px] text-white/80 font-medium">Aktif (Kopilot Lokal)</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-grid">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  m.role === 'user' ? 'bg-[#3370FF]/10 text-[#3370FF]' : isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-600'
                }`}>
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className="space-y-1">
                  <div className={`px-3 py-2.5 rounded-xl text-[11px] leading-relaxed shadow-sm ${
                    m.role === 'user' ? `rounded-tr-none ${c_bubble_user}` : `rounded-tl-none ${c_bubble_bot}`
                  }`}>
                    {formatMessageContent(m.content)}
                  </div>
                  {m.source && m.role === 'assistant' && (
                    <span className={`text-[8px] block px-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'} font-medium`}>
                      Sumber: {m.source}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 max-w-[80%] mr-auto">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                  <Bot className="w-4 h-4 text-zinc-400" />
                </div>
                <div className={`px-4 py-3 rounded-xl rounded-tl-none flex items-center gap-1 shadow-sm ${c_bubble_bot}`}>
                  <span className="w-1.5 h-1.5 bg-[#3370FF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#3370FF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#3370FF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className={`px-4 py-2 border-t flex-shrink-0 overflow-x-auto whitespace-nowrap flex gap-1.5 scrollbar-thin ${isDark ? 'border-zinc-800 bg-[#070e1a]/40' : 'border-zinc-100 bg-zinc-50/50'}`}>
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s.text)}
                disabled={isLoading}
                className={`inline-block px-2.5 py-1.5 rounded-full text-[10px] font-semibold transition-all hover:scale-102 flex-shrink-0 ${
                  isDark
                    ? 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-[#3370FF]/55 hover:text-white'
                    : 'bg-white border border-zinc-200 text-zinc-600 hover:border-[#3370FF]/55 hover:text-[#3370FF] shadow-xs'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Form Input Area */}
          <div className="p-4 border-t flex-shrink-0" style={{ borderColor: isDark ? '#1A2744' : '#E5E7EB' }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className={`flex items-center gap-2 px-3 py-2 border rounded-xl ${c_input_container}`}
            >
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Tanyakan panduan pemeliharaan..."
                disabled={isLoading}
                className={`flex-1 bg-transparent border-0 outline-none text-xs ${c_input}`}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                  input.trim() && !isLoading
                    ? 'bg-[#3370FF] hover:bg-[#5B8EFF] text-white'
                    : isDark ? 'text-zinc-700 bg-zinc-900' : 'text-zinc-300 bg-zinc-100'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <p className={`text-[8px] text-center mt-2 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
              FMSP Copilot terhubung ke model AI lokal.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
