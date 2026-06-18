'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  FileText, 
  Bell, 
  ShieldCheck, 
  MapPin, 
  AlertTriangle, 
  Clock, 
  User, 
  LogOut, 
  Search, 
  Plus, 
  RefreshCw, 
  Mail, 
  TrendingUp,
  FileCheck,
  CheckCircle2,
  Calendar,
  Lock,
  ChevronRight,
  Database,
  Smartphone,
  Sun,
  Moon,
  Users,
  Shield,
  Box,
  HeartPulse,
  Landmark,
  History,
  DollarSign,
  Calculator,
  Wrench,
  FileSignature,
  ClipboardList,
  ScrollText,
  Trash2,
  QrCode,
  Upload,
  Settings
} from 'lucide-react';

import HrdView from '@/components/management/HrdView';
import SecurityView from '@/components/management/SecurityView';
import InventoryView from '@/components/management/InventoryView';
import Smk3View from '@/components/management/Smk3View';
import AccountingView from '@/components/management/AccountingView';
import RabView from '@/components/management/RabView';
import MaintenanceView from '@/components/management/MaintenanceView';
import VendorView from '@/components/management/VendorView';
import WorkOrderView from '@/components/management/WorkOrderView';
import AuditLogView from '@/components/management/AuditLogView';
import AdminView from '@/components/management/AdminView';
import UserManagementView from '@/components/management/UserManagementView';
import AnalyticsView from '@/components/management/AnalyticsView';
import { hasPermission, getRoleConfig, type PermissionKey } from '@/lib/rbac';

// Tipe data berdasarkan model Prisma
interface Asset {
  id: string;
  name: string;
  type: string;
  location: string;
  specs: any;
  status: string;
  bookValue: number;
  purchaseDate?: string;
  purchaseCost?: number;
  expectedLifeYrs?: number;
  lifecycleStatus?: string;
  createdAt: string;
  updatedAt: string;
  transfers: AssetTransfer[];
  legalDocuments: any[];
}

interface AssetTransfer {
  id: string;
  assetId: string;
  fromLocation: string;
  toLocation: string;
  transferredBy: string;
  transferredAt: string;
  notes: string | null;
}

interface LegalDocument {
  id: string;
  assetId: string;
  asset: { name: string; location: string };
  title: string;
  documentType: string;
  documentUrl: string;
  issueDate: string;
  expiryDate: string;
  complianceStatus: string;
}

interface Notification {
  id: string;
  recipientEmail: string;
  type: string;
  title: string;
  message: string;
  status: string;
  scheduledAt: string;
  sentAt: string | null;
}

export default function Home() {
  // State Autentikasi SSO Lintasarta
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginStep, setLoginStep] = useState<'form' | 'mfa' | 'success'>('form');
  const [email, setEmail] = useState('admin@lintasarta.co.id');
  const [password, setPassword] = useState('admin123');
  const [mfaTimer, setMfaTimer] = useState(5);
  const [authToken, setAuthToken] = useState('');
  const [loginError, setLoginError] = useState('');
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string; region?: string; roleLabel?: string } | null>(null);

  // State Tema Terang / Gelap
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const isDark = theme === 'dark';

  // State Utama Aplikasi
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'notifications' | 'hrd' | 'inventory' | 'smk3' | 'accounting' | 'maintenance' | 'vendor' | 'workorder' | 'auditlog' | 'admin' | 'users' | 'analytics'>('overview');
  // Sub-tab states for consolidated menus
  const [assetSubTab, setAssetSubTab] = useState<'aset' | 'legal'>('aset');
  const [hrdSubTab, setHrdSubTab] = useState<'karyawan' | 'security'>('karyawan');
  const [keuanganSubTab, setKeuanganSubTab] = useState<'accounting' | 'rab'>('accounting');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [legalDocs, setLegalDocs] = useState<LegalDocument[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [cronLoading, setCronLoading] = useState(false);

  // Search & Filter State
  const [assetSearch, setAssetSearch] = useState('');
  const [assetFilterType, setAssetFilterType] = useState('all');
  const [docSearch, setDocSearch] = useState('');
  const [docFilterType, setDocFilterType] = useState('all');

  // Mobile UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);
  const [showPwaBanner, setShowPwaBanner] = useState(false);

  // SSE Notification badge
  const [notifBadge, setNotifBadge] = useState(0);
  const [sseNotifs, setSseNotifs] = useState<{ id: string; title: string; message: string; timestamp: string }[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Modal State
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);

  // Form State
  const [newAsset, setNewAsset] = useState({
    name: '',
    type: 'facility',
    location: '',
    specBrand: '',
    specCapacity: '',
    specYear: '',
    specNote: '',
    bookValue: '',
    status: 'good'
  });
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditingAsset, setIsEditingAsset] = useState(false);
  const [editAssetData, setEditAssetData] = useState({
    name: '', type: '', location: '', status: '', bookValue: '',
    specBrand: '', specCapacity: '', specYear: '', specNote: ''
  });
  const [transferData, setTransferData] = useState({
    toLocation: '',
    notes: ''
  });
  const [newDoc, setNewDoc] = useState({
    assetId: '',
    title: '',
    documentType: 'slf',
    issueDate: '',
    expiryDate: '',
    documentUrl: '/uploads/docs/new_doc.pdf'
  });
  const [selectedDoc, setSelectedDoc] = useState<LegalDocument | null>(null);
  const [renewExpiryDate, setRenewExpiryDate] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  // ────────────────────────────────────────────────────────
  // PEMETAAN KELAS GAYA DINAMIS (LINTASARTA THEME)
  // ────────────────────────────────────────────────────────
  const c_bg = isDark ? 'bg-[#070E1B] text-zinc-100' : 'bg-[#F4F7FC] text-zinc-800';
  const c_sidebar = isDark ? 'bg-[#0B1628]/95 border-[#1A2744]' : 'bg-white border-[#E0E8F5]';
  const c_header = isDark ? 'bg-[#0B1628]/40 border-[#1A2744]' : 'bg-white/90 border-[#E0E8F5]';
  const c_card = isDark ? 'bg-[#0F1C33]/60 border-[#1A2744]' : 'bg-white border-[#E0E8F5] shadow-sm';
  const c_table_hdr = isDark ? 'bg-[#0A1525] border-[#1A2744] text-zinc-400' : 'bg-[#F0F4FA] border-[#E0E8F5] text-zinc-600';
  const c_table_row = isDark ? 'hover:bg-[#111D35]/60 divide-[#1A2744]' : 'hover:bg-[#F0F4FA]/50 divide-[#E0E8F5]';
  const c_input = isDark ? 'bg-[#070E1B] border-[#1A2744] text-white focus:border-[#1769FF]' : 'bg-white border-[#D0D8E8] text-zinc-800 focus:border-[#1769FF]';
  const c_modal = isDark ? 'bg-[#0F1C33] border-[#1A2744] text-white' : 'bg-white border-[#E0E8F5] text-zinc-800';
  const c_text_title = isDark ? 'text-white' : 'text-zinc-800';
  const c_text_sub = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const c_border = isDark ? 'border-[#1A2744]' : 'border-[#E0E8F5]';
  const c_inner_bg = isDark ? 'bg-[#070E1B]/60 border-[#1A2744]' : 'bg-[#F4F7FC] border-[#E0E8F5]';

  // Auth headers helper
  const authHeaders = { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' };

  // Fetch Data dari API
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resAssets, resDocs, resNotifs] = await Promise.all([
        fetch('/api/assets', { headers: authHeaders }).then(res => res.json()),
        fetch('/api/legal-documents', { headers: authHeaders }).then(res => res.json()),
        fetch('/api/notifications', { headers: authHeaders }).then(res => res.json())
      ]);

      if (resAssets.success) setAssets(resAssets.data);
      if (resDocs.success) setLegalDocs(resDocs.data);
      if (resNotifs.success) setNotifications(resNotifs.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // PWA Install Prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setPwaPrompt(e);
      setShowPwaBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Close mobile sidebar when tab changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [activeTab]);

  // SSE — real-time notification stream
  useEffect(() => {
    if (!isAuthenticated || !authToken) return;
    const url = `/api/notifications/stream?token=${encodeURIComponent(authToken)}`;
    const es = new EventSource(url);
    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.type === 'badge') setNotifBadge(d.count);
        if (d.type === 'notification') {
          setSseNotifs(prev => [d, ...prev].slice(0, 10));
          setNotifBadge(c => c + 1);
        }
      } catch {}
    };
    return () => es.close();
  }, [isAuthenticated, authToken]);

  // Simulasi MFA Microsoft Authenticator
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loginStep === 'mfa' && mfaTimer > 0) {
      timer = setTimeout(() => setMfaTimer(mfaTimer - 1), 1000);
    } else if (loginStep === 'mfa' && mfaTimer === 0) {
      setLoginStep('success');
      setTimeout(() => {
        setIsAuthenticated(true);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [loginStep, mfaTimer]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setAuthToken(data.data.token);
        setCurrentUser(data.data.user);
        setLoginStep('mfa');
        setMfaTimer(3);
      } else {
        setLoginError(data.error || 'Login gagal');
      }
    } catch (err) {
      setLoginError('Server error. Pastikan server berjalan.');
    }
  };

  // Tambah Aset Baru
  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Build specs object from structured fields
      const specs: Record<string, any> = {};
      if (newAsset.specBrand) specs.brand = newAsset.specBrand;
      if (newAsset.specCapacity) specs.kapasitas = newAsset.specCapacity;
      if (newAsset.specYear) specs.tahun = newAsset.specYear;
      if (newAsset.specNote) specs.catatan = newAsset.specNote;

      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: newAsset.name,
          type: newAsset.type,
          location: newAsset.location,
          status: newAsset.status,
          bookValue: newAsset.bookValue,
          specs
        })
      }).then(r => r.json());

      if (res.success) {
        setShowAssetModal(false);
        setNewAsset({ name: '', type: 'facility', location: '', specBrand: '', specCapacity: '', specYear: '', specNote: '', bookValue: '', status: 'good' });
        fetchData();
      } else {
        alert(res.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Aset — populate form dari data aset terpilih
  const startEditAsset = (asset: Asset) => {
    setEditAssetData({
      name: asset.name,
      type: asset.type,
      location: asset.location,
      status: asset.status,
      bookValue: String(asset.bookValue),
      specBrand: asset.specs?.brand || asset.specs?.merek || '',
      specCapacity: asset.specs?.kapasitas || asset.specs?.capacity || '',
      specYear: asset.specs?.tahun || asset.specs?.year || asset.specs?.Year || '',
      specNote: asset.specs?.catatan || asset.specs?.note || '',
    });
    setIsEditingAsset(true);
  };

  const handleEditAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    try {
      const specs: Record<string, any> = { ...selectedAsset.specs };
      if (editAssetData.specBrand) specs.brand = editAssetData.specBrand;
      if (editAssetData.specCapacity) specs.kapasitas = editAssetData.specCapacity;
      if (editAssetData.specYear) specs.tahun = editAssetData.specYear;
      if (editAssetData.specNote) specs.catatan = editAssetData.specNote;

      const res = await fetch('/api/assets', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          id: selectedAsset.id,
          name: editAssetData.name,
          type: editAssetData.type,
          location: editAssetData.location,
          status: editAssetData.status,
          bookValue: editAssetData.bookValue,
          specs
        })
      }).then(r => r.json());

      if (res.success) {
        setIsEditingAsset(false);
        setShowDetailModal(false);
        fetchData();
      } else {
        alert(res.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mutasi Aset (Pindahan Lokasi)
  const handleTransferAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    try {
      const res = await fetch('/api/assets', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          id: selectedAsset.id,
          location: transferData.toLocation,
          updatedBy: currentUser?.email || 'admin@lintasarta.co.id',
          notes: transferData.notes
        })
      }).then(r => r.json());

      if (res.success) {
        setShowTransferModal(false);
        setTransferData({ toLocation: '', notes: '' });
        fetchData();
      } else {
        alert(res.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Tambah Dokumen Legal
  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/legal-documents', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(newDoc)
      }).then(r => r.json());

      if (res.success) {
        setShowDocModal(false);
        setNewDoc({ assetId: '', title: '', documentType: 'slf', issueDate: '', expiryDate: '', documentUrl: '/uploads/docs/new_doc.pdf' });
        fetchData();
      } else {
        alert(res.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Perpanjang Dokumen Legal
  const handleRenewDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;

    try {
      const res = await fetch('/api/legal-documents', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          id: selectedDoc.id,
          expiryDate: renewExpiryDate
        })
      }).then(r => r.json());

      if (res.success) {
        setShowRenewModal(false);
        setRenewExpiryDate('');
        fetchData();
      } else {
        alert(res.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Jalankan Simulasi Cron Evaluasi Pengingat
  const runReminderCron = async () => {
    setCronLoading(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: authHeaders,
      }).then(r => r.json());

      if (res.success) {
        alert(`Simulasi Evaluasi Sukses!\n- Notifikasi Baru Dibuat: ${res.createdCount}\n- Notifikasi Terkirim via SMTP Outlook: ${res.sentCount}`);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCronLoading(false);
    }
  };

  // Delete Asset
  const handleDeleteAsset = async (id: string, name: string) => {
    if (!confirm(`Yakin hapus aset "${name}"? Semua data terkait (transfer, dokumen legal) akan ikut terhapus.`)) return;
    try {
      const res = await fetch('/api/assets', { method: 'DELETE', headers: authHeaders, body: JSON.stringify({ id }) }).then(r => r.json());
      if (res.success) fetchData();
      else alert(res.error);
    } catch (err) { console.error(err); }
  };

  // Delete Legal Doc
  const handleDeleteDoc = async (id: string, title: string) => {
    if (!confirm(`Yakin hapus dokumen "${title}"?`)) return;
    try {
      const res = await fetch('/api/legal-documents', { method: 'DELETE', headers: authHeaders, body: JSON.stringify({ id }) }).then(r => r.json());
      if (res.success) fetchData();
      else alert(res.error);
    } catch (err) { console.error(err); }
  };

  // Upload File Document
  const handleFileUpload = async (file: File) => {
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: formData,
      }).then(r => r.json());
      if (res.success) {
        setNewDoc(prev => ({ ...prev, documentUrl: res.data.url }));
      } else {
        alert(res.error);
      }
    } catch (err) { console.error(err); }
    setUploadLoading(false);
  };

  // Generate QR Code for Asset
  const handleShowQR = async (asset: Asset) => {
    try {
      const { generateAssetQRCode } = await import('@/lib/qr-service');
      const dataUrl = await generateAssetQRCode(asset.id, asset.name);
      setQrDataUrl(dataUrl);
      setSelectedAsset(asset);
      setShowQrModal(true);
    } catch (err) { console.error(err); }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl || !selectedAsset) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR-${selectedAsset.name.replace(/\s+/g, '_')}.png`;
    link.click();
  };

  const handlePrintQR = () => {
    if (!qrDataUrl || !selectedAsset) return;
    const code = `FMSP-${selectedAsset.id.slice(-8).toUpperCase()}`;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Label QR Aset</title>
      <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
        .label { width: 300px; border: 2px solid #1769FF; border-radius: 8px; padding: 16px; text-align: center; }
        .logo { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; }
        .name { font-size: 13px; font-weight: bold; margin-bottom: 4px; }
        .location { font-size: 10px; color: #888; margin-bottom: 12px; }
        img { width: 200px; height: 200px; }
        .code { font-size: 11px; font-family: monospace; color: #1769FF; margin-top: 8px; letter-spacing: 1px; }
      </style></head><body>
      <div class="label">
        <div class="logo">🏢 Lintasarta FMSP</div>
        <div class="name">${selectedAsset.name}</div>
        <div class="location">${selectedAsset.location}</div>
        <img src="${qrDataUrl}" alt="QR Code" />
        <div class="code">${code}</div>
      </div>
      <script>window.onload = () => { window.print(); }<\/script>
      </body></html>
    `);
    win.document.close();
  };


  // Format Mata Uang Rupiah
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  // Login Screen Render (Lintasarta Brand)
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070E1B] font-sans relative overflow-hidden">
        {/* Glow Effects - Lintasarta Blue */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#1769FF]/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[#0D4FCC]/15 blur-[120px] pointer-events-none" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(23,105,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(23,105,255,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="w-full max-w-md p-8 bg-[#0F1C33]/80 border border-[#1A2744] backdrop-blur-xl rounded-2xl shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-8">
            {/* Lintasarta Logo */}
            <div className="mb-4">
              <img src="/lintasarta-icon.png" alt="Lintasarta" className="w-16 h-16 object-contain" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Lintasarta FMSP</h1>
            <p className="text-sm text-zinc-400 mt-1">Facility Management Service Platform</p>
          </div>

          {loginStep === 'form' && (
            <form onSubmit={handleLoginSubmit} className="space-y-6 text-xs">
              {loginError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{loginError}</div>}
              <div>
                <label className="block text-zinc-300 font-semibold uppercase tracking-wider mb-2">Corporate Email</label>
                <div className="relative text-sm">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#070E1B] border border-[#1A2744] rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-[#1769FF] transition-colors text-sm"
                    placeholder="name@lintasarta.co.id" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold uppercase tracking-wider mb-2">Password</label>
                <div className="relative text-sm">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#070E1B] border border-[#1A2744] rounded-xl text-white focus:outline-none focus:border-[#1769FF] transition-colors text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center text-zinc-400">
                  <input type="checkbox" defaultChecked className="mr-2 rounded border-[#1A2744] bg-[#070E1B] text-[#1769FF] focus:ring-0 focus:ring-offset-0" />
                  Ingat saya
                </label>
                <a href="#" className="text-[#1769FF] hover:underline">Lupa Password?</a>
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-gradient-to-r from-[#1769FF] to-[#0D4FCC] hover:from-[#4A8AFF] hover:to-[#1769FF] text-white rounded-xl font-semibold transition-all shadow-md shadow-[#1769FF]/20 active:scale-[0.98] text-sm"
              >
                Sign In with SSO
              </button>
            </form>
          )}

          {loginStep === 'mfa' && (
            <div className="text-center py-6 space-y-6">
              <div className="flex justify-center">
                <div className="relative flex items-center justify-center">
                  <div className="animate-ping absolute inline-flex h-20 w-20 rounded-full bg-[#1769FF]/10 opacity-75" />
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#1769FF] flex items-center justify-center animate-spin" style={{ animationDuration: '6s' }} />
                  <Smartphone className="w-8 h-8 text-[#1769FF] absolute" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">2FA Verification Required</h3>
                <p className="text-sm text-zinc-400 px-4">
                  Buka aplikasi **Microsoft Authenticator** Anda dan setujui permintaan masuk yang dikirimkan.
                </p>
              </div>
              <div className="text-xs text-zinc-500">
                Memproses dalam {mfaTimer} detik...
              </div>
            </div>
          )}

          {loginStep === 'success' && (
            <div className="text-center py-8 space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Akses Disetujui</h3>
                <p className="text-sm text-zinc-400">Selamat datang kembali di FMSP Lintasarta.</p>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-[#1A2744]/60 text-center">
            <p className="text-xs text-zinc-500">
              Dikendalikan oleh Lintasarta Infosec SSO Gateway.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Filter Aset & Dokumen
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(assetSearch.toLowerCase()) || 
                          asset.location.toLowerCase().includes(assetSearch.toLowerCase());
    const matchesType = assetFilterType === 'all' || asset.type === assetFilterType;
    return matchesSearch && matchesType;
  });

  const filteredDocs = legalDocs.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(docSearch.toLowerCase()) || 
                          doc.asset.name.toLowerCase().includes(docSearch.toLowerCase());
    const matchesType = docFilterType === 'all' || doc.complianceStatus === docFilterType;
    return matchesSearch && matchesType;
  });

  // Kalkulasi Statistik
  const totalAssetsCount = assets.length;
  const totalValue = assets.reduce((acc, curr) => acc + curr.bookValue, 0);
  const totalWarningDocs = legalDocs.filter(d => d.complianceStatus === 'warning').length;
  const totalExpiredDocs = legalDocs.filter(d => d.complianceStatus === 'expired').length;
  const complianceRate = legalDocs.length ? Math.round(((legalDocs.length - totalExpiredDocs) / legalDocs.length) * 100) : 100;

  return (
    <div className={`flex min-h-screen font-sans relative overflow-hidden transition-colors duration-300 ${c_bg}`}>
      
      {/* Background Decorative Glow (hanya untuk dark mode) */}
      {isDark && (
        <>
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#1769FF]/5 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#0D4FCC]/5 blur-[120px] pointer-events-none" />
        </>
      )}

      {/* ── Mobile Drawer Overlay ────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile, drawer on small screens */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 flex flex-col justify-between
        transition-transform duration-300 ease-in-out
        md:static md:w-64 md:z-auto md:translate-x-0 md:flex md:shrink-0
        border-r backdrop-blur-xl
        ${sidebarOpen ? 'translate-x-0 animate-slide-left' : '-translate-x-full'}
        ${c_sidebar}
      `}>
        <div className="flex-1 overflow-y-auto">
          {/* Header Sidebar — Lintasarta Logo */}
          <div className={`h-20 border-b flex items-center px-5 gap-3 ${c_border}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1769FF] to-[#0D4FCC] flex items-center justify-center shadow-md shadow-[#1769FF]/20 p-1.5">
              <img src="/lintasarta-icon.png" alt="Lintasarta" className="w-full h-full object-contain brightness-0 invert" />
            </div>
            <div>
              <h2 className={`font-bold tracking-tight text-sm ${c_text_title}`}>FMSP Lintasarta</h2>
              <span className="text-[10px] text-[#1769FF] font-semibold tracking-wider uppercase">Facility Management</span>
            </div>
          </div>

          {/* Navigasi Sidebar */}
          <nav className="p-4 space-y-1">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-[#1769FF] text-white shadow-lg shadow-[#1769FF]/15' : `text-zinc-400 hover:${c_text_title} hover:bg-zinc-500/10`}`}
            >
              <Database className="w-4 h-4" />
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('assets')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'assets' ? 'bg-[#1769FF] text-white shadow-lg shadow-[#1769FF]/15' : `text-zinc-400 hover:${c_text_title} hover:bg-zinc-500/10`}`}
            >
              <Building2 className="w-4 h-4" />
              Aset & Perizinan
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative ${activeTab === 'notifications' ? 'bg-[#1769FF] text-white shadow-lg shadow-[#1769FF]/15' : `text-zinc-400 hover:${c_text_title} hover:bg-zinc-500/10`}`}
            >
              <Bell className="w-4 h-4" />
              Reminder & Alerts
              {notifications.filter(n => n.status === 'pending').length > 0 && (
                <span className="absolute right-4 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>

            {/* Header Management */}
            <div className="pt-4 pb-2 px-4">
              <span className="text-[10px] text-zinc-500 font-bold tracking-wider uppercase">Management</span>
            </div>

            <button 
              onClick={() => setActiveTab('hrd')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'hrd' ? 'bg-[#1769FF] text-white shadow-lg shadow-[#1769FF]/15' : `text-zinc-400 hover:${c_text_title} hover:bg-zinc-500/10`}`}
            >
              <Users className="w-4 h-4" />
              HRD & Security
            </button>
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'inventory' ? 'bg-[#1769FF] text-white shadow-lg shadow-[#1769FF]/15' : `text-zinc-400 hover:${c_text_title} hover:bg-zinc-500/10`}`}
            >
              <Box className="w-4 h-4" />
              Inventory
            </button>
            <button 
              onClick={() => setActiveTab('smk3')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'smk3' ? 'bg-[#1769FF] text-white shadow-lg shadow-[#1769FF]/15' : `text-zinc-400 hover:${c_text_title} hover:bg-zinc-500/10`}`}
            >
              <HeartPulse className="w-4 h-4" />
              SMK3 Safety
            </button>
            <button 
              onClick={() => setActiveTab('accounting')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'accounting' ? 'bg-[#1769FF] text-white shadow-lg shadow-[#1769FF]/15' : `text-zinc-400 hover:${c_text_title} hover:bg-zinc-500/10`}`}
            >
              <DollarSign className="w-4 h-4" />
              Keuangan
            </button>

            {/* Header Operations */}
            <div className="pt-4 pb-2 px-4">
              <span className="text-[10px] text-zinc-500 font-bold tracking-wider uppercase">Operations</span>
            </div>
            <button 
              onClick={() => setActiveTab('maintenance')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'maintenance' ? 'bg-[#1769FF] text-white shadow-lg shadow-[#1769FF]/15' : `text-zinc-400 hover:${c_text_title} hover:bg-zinc-500/10`}`}
            >
              <Wrench className="w-4 h-4" />
              Preventive Maintenance
            </button>
            <button 
              onClick={() => setActiveTab('vendor')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'vendor' ? 'bg-[#1769FF] text-white shadow-lg shadow-[#1769FF]/15' : `text-zinc-400 hover:${c_text_title} hover:bg-zinc-500/10`}`}
            >
              <FileSignature className="w-4 h-4" />
              Vendor & Contract
            </button>
            <button 
              onClick={() => setActiveTab('workorder')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'workorder' ? 'bg-[#1769FF] text-white shadow-lg shadow-[#1769FF]/15' : `text-zinc-400 hover:${c_text_title} hover:bg-zinc-500/10`}`}
            >
              <ClipboardList className="w-4 h-4" />
              Work Order / Ticket
            </button>

            {/* Header Analytics */}
            <div className="pt-4 pb-2 px-4">
              <span className="text-[10px] text-zinc-500 font-bold tracking-wider uppercase">Analytics</span>
            </div>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'analytics' ? 'bg-[#1769FF] text-white shadow-lg shadow-[#1769FF]/15' : `text-zinc-400 hover:${c_text_title} hover:bg-zinc-500/10`}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              Analytics & Charts
            </button>

            {/* Header Integration */}
            <div className="pt-4 pb-2 px-4">
              <span className="text-[10px] text-zinc-500 font-bold tracking-wider uppercase">Integration</span>
            </div>
            {currentUser && hasPermission(currentUser.role, 'audit_log_view') && (
              <button 
                onClick={() => setActiveTab('auditlog')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'auditlog' ? 'bg-[#1769FF] text-white shadow-lg shadow-[#1769FF]/15' : `text-zinc-400 hover:${c_text_title} hover:bg-zinc-500/10`}`}
              >
                <ScrollText className="w-4 h-4" />
                Audit Log
              </button>
            )}
            {currentUser && hasPermission(currentUser.role, 'user_manage') && (
              <button 
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'users' ? 'bg-[#1769FF] text-white shadow-lg shadow-[#1769FF]/15' : `text-zinc-400 hover:${c_text_title} hover:bg-zinc-500/10`}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                Manajemen User
              </button>
            )}
            {currentUser && hasPermission(currentUser.role, 'master_data') && (
              <button 
                onClick={() => setActiveTab('admin')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'admin' ? 'bg-[#1769FF] text-white shadow-lg shadow-[#1769FF]/15' : `text-zinc-400 hover:${c_text_title} hover:bg-zinc-500/10`}`}
              >
                <Settings className="w-4 h-4" />
                Admin Master Data
              </button>
            )}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className={`p-4 border-t ${c_border}`}>
          <div className={`flex items-center justify-between p-2 rounded-xl border ${c_inner_bg}`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#0D4FCC]/50 border border-[#1769FF]/20 flex items-center justify-center">
                <User className="w-4 h-4 text-[#4A8AFF]" />
              </div>
              <div className="overflow-hidden">
                <h4 className={`text-xs font-bold truncate w-28 ${c_text_title}`}>{currentUser?.name || 'Admin FM'}</h4>
                <p className="text-[10px] text-zinc-500 truncate w-28">{currentUser?.email || 'admin@lintasarta.co.id'}</p>
                {currentUser && (
                  <span 
                    className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ 
                      color: getRoleConfig(currentUser.role).color, 
                      backgroundColor: getRoleConfig(currentUser.role).bgColor 
                    }}
                  >
                    {currentUser.roleLabel || getRoleConfig(currentUser.role).label}
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={() => {
                setIsAuthenticated(false);
                setAuthToken('');
                setCurrentUser(null);
                setLoginStep('form');
              }}
              title="Logout"
              className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto mobile-content-pad">
        
        {/* Header Bar */}
        <header className={`h-16 md:h-20 border-b px-4 md:px-8 flex items-center justify-between backdrop-blur-md sticky top-0 z-30 transition-colors duration-300 ${c_header}`}>
          {/* Mobile: Hamburger + Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className={`md:hidden p-2 rounded-xl border transition-all ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-600 shadow-sm'}`}
              aria-label="Buka menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          <h1 className={`text-base md:text-xl font-bold tracking-tight capitalize ${c_text_title}`}>
            {activeTab === 'overview' && 'Dashboard — Ringkasan Portofolio Aset'}
            {activeTab === 'assets' && 'Manajemen Aset & Perizinan'}
            {activeTab === 'notifications' && 'Kotak Alerts & Reminder'}
            {activeTab === 'hrd' && 'HRD & Security Service'}
            {activeTab === 'inventory' && 'Inventory & Sparepart Gudang'}
            {activeTab === 'smk3' && 'SMK3 Safety & Checklist K3'}
            {activeTab === 'accounting' && 'Keuangan — Accounting & RAB'}
            {activeTab === 'maintenance' && 'Preventive Maintenance Schedule'}
            {activeTab === 'vendor' && 'Vendor & Contract Management'}
            {activeTab === 'workorder' && 'Work Order & Ticket Management'}
            {activeTab === 'auditlog' && 'Audit Log — Catatan Aktivitas'}
            {activeTab === 'admin' && 'Admin — Master Data Management'}
            {activeTab === 'users' && 'Manajemen Pengguna'}
            {activeTab === 'analytics' && 'Analytics & Insights — Visualisasi Data'}
          </h1>
          </div>{/* end hamburger+title */}

          <div className="flex items-center gap-2 md:gap-4">
            
            {/* Bell Notification dengan SSE badge */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifDropdown(s => !s); if (notifBadge > 0) setNotifBadge(0); }}
                className={`relative p-2 rounded-xl border transition-all ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-600 shadow-sm'}`}
                aria-label="Notifikasi"
              >
                <Bell className="w-4 h-4" />
                {notifBadge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {notifBadge > 9 ? '9+' : notifBadge}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifDropdown && (
                <div className={`absolute right-0 top-11 w-80 rounded-2xl border shadow-2xl z-50 overflow-hidden ${isDark ? 'bg-[#0F1C33] border-[#1A2744]' : 'bg-white border-[#E0E8F5]'}`}>
                  <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? 'border-[#1A2744]' : 'border-[#E0E8F5]'}`}>
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-zinc-800'}`}>Notifikasi Terbaru</span>
                    <button onClick={() => { setShowNotifDropdown(false); setActiveTab('notifications'); }}
                      className="text-[10px] text-[#1769FF] font-semibold">Lihat Semua</button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y" style={{ borderColor: isDark ? '#1A2744' : '#E0E8F5' }}>
                    {sseNotifs.length === 0 ? (
                      <p className={`text-xs text-center py-6 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Tidak ada notifikasi baru</p>
                    ) : sseNotifs.map(n => (
                      <div key={n.id} className={`px-4 py-3 text-xs ${isDark ? 'hover:bg-white/5' : 'hover:bg-zinc-50'}`}>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-zinc-800'}`}>{n.title}</p>
                        <p className={`mt-0.5 line-clamp-2 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{n.message}</p>
                        <p className="mt-1 text-[10px] text-zinc-500">
                          {n.timestamp ? new Date(n.timestamp).toLocaleString('id-ID') : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* BUTTON TOGGLE TEMA (TERANG / GELAP) */}
            <button 
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`p-2 rounded-xl border transition-all active:scale-95 ${isDark ? 'bg-zinc-900 border-zinc-800 text-yellow-400 hover:bg-zinc-800' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100 shadow-sm'}`}
              title={isDark ? 'Ganti ke Tema Terang' : 'Ganti ke Tema Gelap'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {activeTab === 'notifications' && (
              <button 
                onClick={runReminderCron}
                disabled={cronLoading}
                className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#1769FF] to-[#0D4FCC] hover:from-[#4A8AFF] hover:to-[#1769FF] disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md transition-all active:scale-[0.98]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${cronLoading ? 'animate-spin' : ''}`} />
                {cronLoading ? 'Evaluasi...' : 'Simulasi Cron'}
              </button>
            )}

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Infosec Protected</span>
            </div>
          </div>
        </header>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-[#1769FF] animate-spin" />
          </div>
        ) : (
          <div className="p-8 flex-1 space-y-8 max-w-7xl w-full mx-auto">
            
            {/* ────────── TAB 1: OVERVIEW ────────── */}
            {activeTab === 'overview' && (() => {
              // ── Storytelling with Data: Pre-compute all insights ──
              const goodAssets = assets.filter(a => a.status === 'good').length;
              const warningAssets = assets.filter(a => a.status === 'warning').length;
              const brokenAssets = assets.filter(a => a.status === 'broken').length;

              const typeGroups = assets.reduce((acc: Record<string, number>, a) => {
                const t = a.type === 'land' ? 'Tanah' : a.type === 'office' ? 'Gedung' : a.type === 'facility' ? 'Fasilitas' : a.type === 'vehicle' ? 'Kendaraan' : a.type;
                acc[t] = (acc[t] || 0) + 1;
                return acc;
              }, {});
              const typeSorted = Object.entries(typeGroups).sort((a, b) => b[1] - a[1]);
              const maxTypeCount = typeSorted.length > 0 ? typeSorted[0][1] : 1;

              const locationGroups = assets.reduce((acc: Record<string, number>, a) => {
                acc[a.location] = (acc[a.location] || 0) + 1;
                return acc;
              }, {});
              const locationSorted = Object.entries(locationGroups).sort((a, b) => b[1] - a[1]);
              const maxLocationCount = locationSorted.length > 0 ? locationSorted[0][1] : 1;

              const valueByType = assets.reduce((acc: Record<string, number>, a) => {
                const t = a.type === 'land' ? 'Tanah' : a.type === 'office' ? 'Gedung' : a.type === 'facility' ? 'Fasilitas' : a.type === 'vehicle' ? 'Kendaraan' : a.type;
                acc[t] = (acc[t] || 0) + a.bookValue;
                return acc;
              }, {});
              const valueSorted = Object.entries(valueByType).sort((a, b) => b[1] - a[1]);
              const maxValue = valueSorted.length > 0 ? valueSorted[0][1] : 1;

              const urgentDocs = legalDocs
                .filter(d => d.complianceStatus !== 'valid')
                .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
              const validDocs = legalDocs.filter(d => d.complianceStatus === 'valid').length;
              const pendingNotifications = notifications.filter(n => n.status === 'pending').length;
              const today = new Date();

              const formatShortRupiah = (n: number) => {
                if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
                if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(0)}jt`;
                return formatRupiah(n);
              };

              const daysUntil = (dateStr: string) => {
                const diff = Math.ceil((new Date(dateStr).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return diff;
              };

              return (
                <div className="space-y-8">

                  {/* ═══════════════════════════════════════════════════
                      ROW 1 — HEADLINE STORY (The "So What?")
                      SWD Principle: Lead with the most important insight
                  ═══════════════════════════════════════════════════ */}
                  <div className={`rounded-2xl border p-6 ${c_card}`}>
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                      <div>
                        <p className={`text-xs tracking-wider uppercase font-semibold ${c_text_sub}`}>Ringkasan Portofolio</p>
                        <h2 className={`text-2xl font-bold mt-1 ${c_text_title}`}>
                          {totalAssetsCount} Aset Terkelola — Nilai Total {formatShortRupiah(totalValue)}
                        </h2>
                        <p className={`text-sm mt-2 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                          {brokenAssets > 0
                            ? <>{brokenAssets} aset dalam kondisi <span className="text-red-500 font-semibold">rusak</span> memerlukan perhatian segera. </>
                            : warningAssets > 0
                            ? <>{warningAssets} aset berstatus <span className="text-amber-500 font-semibold">warning</span> perlu ditindaklanjuti. </>
                            : <>Seluruh aset dalam kondisi <span className="text-emerald-600 font-semibold">baik</span>. </>
                          }
                          {totalExpiredDocs > 0
                            ? <>{totalExpiredDocs} dokumen legal telah <span className="text-red-500 font-semibold">expired</span> dan harus segera diperpanjang.</>
                            : totalWarningDocs > 0
                            ? <>{totalWarningDocs} dokumen akan segera jatuh tempo.</>
                            : <>Semua dokumen legal aktif dan valid.</>
                          }
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-6 shrink-0 items-center">
                        <div className="text-center">
                          <p className={`text-3xl font-bold ${complianceRate >= 90 ? 'text-emerald-600' : complianceRate >= 70 ? 'text-amber-500' : 'text-red-500'}`}>{complianceRate}%</p>
                          <p className={`text-[10px] font-semibold uppercase tracking-wider mt-1 ${c_text_sub}`}>Kepatuhan Legal</p>
                        </div>
                        <div className={`w-px hidden sm:block ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                        <div className="text-center">
                          <p className={`text-3xl font-bold ${pendingNotifications > 0 ? 'text-amber-500' : `${c_text_title}`}`}>{pendingNotifications}</p>
                          <p className={`text-[10px] font-semibold uppercase tracking-wider mt-1 ${c_text_sub}`}>Alert Pending</p>
                        </div>
                        <div className={`w-px hidden sm:block ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                        {/* PDF Report Download */}
                        <button
                          onClick={() => {
                            const token = authToken;
                            const url = `/api/reports/compliance?format=html`;
                            const win = window.open('', '_blank');
                            if (!win) return;
                            fetch(url, { headers: { Authorization: `Bearer ${token}` } })
                              .then(r => r.text())
                              .then(html => {
                                win.document.write(html);
                                win.document.close();
                              });
                          }}
                          className="flex flex-col items-center gap-1 px-4 py-2.5 bg-[#1769FF]/10 hover:bg-[#1769FF]/20 border border-[#1769FF]/30 text-[#1769FF] rounded-xl transition-all text-xs font-semibold"
                          title="Download Laporan Compliance Bulanan"
                        >
                          <span className="text-lg">📄</span>
                          <span>Laporan PDF</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ═══════════════════════════════════════════════════
                      ROW 2 — KPI TILES (Scannable at a glance)
                      SWD: Use preattentive attributes — size & color
                  ═══════════════════════════════════════════════════ */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Kondisi Baik', value: goodAssets, color: 'text-emerald-600', bar: 'bg-emerald-500', pct: totalAssetsCount ? (goodAssets / totalAssetsCount) * 100 : 0 },
                      { label: 'Perlu Perhatian', value: warningAssets, color: warningAssets > 0 ? 'text-amber-500' : `${c_text_title}`, bar: 'bg-amber-400', pct: totalAssetsCount ? (warningAssets / totalAssetsCount) * 100 : 0 },
                      { label: 'Rusak', value: brokenAssets, color: brokenAssets > 0 ? 'text-red-500' : `${c_text_title}`, bar: 'bg-red-500', pct: totalAssetsCount ? (brokenAssets / totalAssetsCount) * 100 : 0 },
                      { label: 'Dokumen Valid', value: validDocs, color: 'text-emerald-600', bar: 'bg-emerald-500', pct: legalDocs.length ? (validDocs / legalDocs.length) * 100 : 0 },
                    ].map((kpi, i) => (
                      <div key={i} className={`rounded-xl border p-5 ${c_card}`}>
                        <p className={`text-[11px] font-semibold uppercase tracking-wide ${c_text_sub}`}>{kpi.label}</p>
                        <p className={`text-3xl font-bold mt-1.5 ${kpi.color}`}>{kpi.value}</p>
                        {/* SWD: Micro progress bar shows proportion without needing a pie chart */}
                        <div className={`h-1 rounded-full mt-3 ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                          <div className={`h-1 rounded-full transition-all duration-700 ${kpi.bar}`} style={{ width: `${Math.max(kpi.pct, 2)}%` }} />
                        </div>
                        <p className={`text-[10px] mt-1.5 ${c_text_sub}`}>{Math.round(kpi.pct)}% dari total</p>
                      </div>
                    ))}
                  </div>

                  {/* ═══════════════════════════════════════════════════
                      ROW 3 — COMPOSITION CHARTS (Horizontal Bars)
                      SWD: Horizontal bars are the workhorse of data viz —
                      easy to read, naturally sorted, labels are readable
                  ═══════════════════════════════════════════════════ */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Chart A: Distribusi Aset per Tipe */}
                    <div className={`rounded-xl border p-6 ${c_card}`}>
                      <p className={`text-xs font-bold ${c_text_title}`}>Komposisi aset didominasi oleh {typeSorted[0]?.[0] || '—'}</p>
                      <p className={`text-[11px] mt-0.5 ${c_text_sub}`}>Jumlah aset per kategori tipe</p>
                      <div className="mt-5 space-y-3">
                        {typeSorted.map(([type, count], i) => (
                          <div key={type}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className={`font-medium ${c_text_title}`}>{type}</span>
                              <span className={`font-bold tabular-nums ${i === 0 ? 'text-[#1769FF]' : c_text_sub}`}>{count}</span>
                            </div>
                            <div className={`h-2 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                              <div
                                className={`h-2 rounded-full transition-all duration-700 ${i === 0 ? 'bg-[#1769FF]' : isDark ? 'bg-zinc-600' : 'bg-zinc-300'}`}
                                style={{ width: `${(count / maxTypeCount) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                        {typeSorted.length === 0 && <p className={`text-xs italic ${c_text_sub}`}>Belum ada data aset.</p>}
                      </div>
                    </div>

                    {/* Chart B: Distribusi Aset per Lokasi */}
                    <div className={`rounded-xl border p-6 ${c_card}`}>
                      <p className={`text-xs font-bold ${c_text_title}`}>{locationSorted[0]?.[0] || '—'} memiliki aset terbanyak</p>
                      <p className={`text-[11px] mt-0.5 ${c_text_sub}`}>Sebaran aset di setiap lokasi</p>
                      <div className="mt-5 space-y-3">
                        {locationSorted.map(([loc, count], i) => (
                          <div key={loc}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className={`font-medium truncate max-w-[160px] ${c_text_title}`} title={loc}>{loc}</span>
                              <span className={`font-bold tabular-nums ${i === 0 ? 'text-[#1769FF]' : c_text_sub}`}>{count}</span>
                            </div>
                            <div className={`h-2 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                              <div
                                className={`h-2 rounded-full transition-all duration-700 ${i === 0 ? 'bg-[#1769FF]' : isDark ? 'bg-zinc-600' : 'bg-zinc-300'}`}
                                style={{ width: `${(count / maxLocationCount) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                        {locationSorted.length === 0 && <p className={`text-xs italic ${c_text_sub}`}>Belum ada data lokasi.</p>}
                      </div>
                    </div>

                    {/* Chart C: Nilai Buku per Tipe */}
                    <div className={`rounded-xl border p-6 ${c_card}`}>
                      <p className={`text-xs font-bold ${c_text_title}`}>Nilai buku terbesar pada {valueSorted[0]?.[0] || '—'}</p>
                      <p className={`text-[11px] mt-0.5 ${c_text_sub}`}>Distribusi nilai investasi per kategori</p>
                      <div className="mt-5 space-y-3">
                        {valueSorted.map(([type, val], i) => (
                          <div key={type}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className={`font-medium ${c_text_title}`}>{type}</span>
                              <span className={`font-bold tabular-nums ${i === 0 ? 'text-[#1769FF]' : c_text_sub}`}>{formatShortRupiah(val)}</span>
                            </div>
                            <div className={`h-2 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                              <div
                                className={`h-2 rounded-full transition-all duration-700 ${i === 0 ? 'bg-[#1769FF]' : isDark ? 'bg-zinc-600' : 'bg-zinc-300'}`}
                                style={{ width: `${(val / maxValue) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                        {valueSorted.length === 0 && <p className={`text-xs italic ${c_text_sub}`}>Belum ada data nilai.</p>}
                      </div>
                    </div>
                  </div>

                  {/* ═══════════════════════════════════════════════════
                      ROW 4 — ACTION TABLE (What needs attention NOW)
                      SWD: "Declutter" — show only non-compliant items
                      SWD: Sort by urgency, color = signal not decoration
                  ═══════════════════════════════════════════════════ */}
                  <div className={`rounded-xl border ${c_card}`}>
                    <div className="flex items-center justify-between p-5 pb-3">
                      <div>
                        <p className={`text-xs font-bold ${c_text_title}`}>
                          {urgentDocs.length > 0
                            ? `${urgentDocs.length} dokumen membutuhkan tindakan segera`
                            : 'Semua dokumen legal dalam keadaan valid'}
                        </p>
                        <p className={`text-[11px] mt-0.5 ${c_text_sub}`}>Diurutkan berdasarkan urgensi tanggal jatuh tempo</p>
                      </div>
                      {urgentDocs.length > 0 && (
                        <button onClick={() => { setActiveTab('assets'); setAssetSubTab('legal'); }} className="text-xs text-[#1769FF] hover:underline font-semibold flex items-center gap-1">
                          Kelola Dokumen <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {urgentDocs.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className={isDark ? 'bg-zinc-950/30 text-zinc-500' : 'bg-zinc-50 text-zinc-500'}>
                              <th className="text-left font-semibold px-5 py-2.5">Dokumen</th>
                              <th className="text-left font-semibold px-5 py-2.5">Aset Terkait</th>
                              <th className="text-left font-semibold px-5 py-2.5">Jatuh Tempo</th>
                              <th className="text-left font-semibold px-5 py-2.5">Sisa Hari</th>
                              <th className="text-left font-semibold px-5 py-2.5">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {urgentDocs.map(doc => {
                              const days = daysUntil(doc.expiryDate);
                              const isExpired = doc.complianceStatus === 'expired';
                              return (
                                <tr key={doc.id} className={`border-t ${isDark ? 'border-zinc-800/60 hover:bg-zinc-900/20' : 'border-zinc-100 hover:bg-zinc-50'}`}>
                                  <td className={`px-5 py-3 font-semibold ${c_text_title}`}>{doc.title}</td>
                                  <td className={`px-5 py-3 ${c_text_sub}`}>{doc.asset.name}</td>
                                  <td className={`px-5 py-3 tabular-nums ${c_text_sub}`}>{new Date(doc.expiryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                  <td className="px-5 py-3">
                                    <span className={`font-bold tabular-nums ${isExpired ? 'text-red-500' : days <= 7 ? 'text-red-500' : 'text-amber-500'}`}>
                                      {isExpired ? `${Math.abs(days)} hari lewat` : `${days} hari lagi`}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3">
                                    {/* SWD: Color IS the label — no need for icons */}
                                    <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${isExpired ? 'bg-red-500' : 'bg-amber-400'}`} />
                                    <span className={isExpired ? 'text-red-500 font-semibold' : 'text-amber-500 font-semibold'}>{isExpired ? 'Expired' : 'Warning'}</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className={`text-center py-10 ${c_text_sub}`}>
                        <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                        <p className="text-sm font-semibold text-emerald-600">Tidak Ada Dokumen Bermasalah</p>
                        <p className={`text-xs mt-1 ${c_text_sub}`}>Seluruh {legalDocs.length} dokumen legal berstatus valid.</p>
                      </div>
                    )}
                  </div>

                  {/* ═══════════════════════════════════════════════════
                      ROW 5 — CONTEXT (Asset condition snapshot + recent activity)
                      SWD: "Build trust" — show data freshness & system health
                  ═══════════════════════════════════════════════════ */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Kondisi Aset — Stacked bar */}
                    <div className={`rounded-xl border p-6 ${c_card}`}>
                      <p className={`text-xs font-bold ${c_text_title}`}>Snapshot kondisi seluruh aset</p>
                      <p className={`text-[11px] mt-0.5 mb-5 ${c_text_sub}`}>{goodAssets} baik · {warningAssets} warning · {brokenAssets} rusak dari {totalAssetsCount} unit</p>
                      
                      {/* SWD: Stacked horizontal bar — single bar, proportional */}
                      {totalAssetsCount > 0 && (
                        <div className="space-y-3">
                          <div className="flex h-4 rounded-full overflow-hidden">
                            {goodAssets > 0 && <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${(goodAssets / totalAssetsCount) * 100}%` }} />}
                            {warningAssets > 0 && <div className="bg-amber-400 transition-all duration-700" style={{ width: `${(warningAssets / totalAssetsCount) * 100}%` }} />}
                            {brokenAssets > 0 && <div className="bg-red-500 transition-all duration-700" style={{ width: `${(brokenAssets / totalAssetsCount) * 100}%` }} />}
                          </div>
                          <div className="flex items-center gap-5 text-[11px]">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Baik ({Math.round((goodAssets / totalAssetsCount) * 100)}%)</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Warning ({Math.round((warningAssets / totalAssetsCount) * 100)}%)</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Rusak ({Math.round((brokenAssets / totalAssetsCount) * 100)}%)</span>
                          </div>
                        </div>
                      )}

                      {/* Per-location breakdown */}
                      {totalAssetsCount > 0 && (
                        <div className="mt-6 space-y-2.5">
                          <p className={`text-[11px] font-semibold uppercase tracking-wider ${c_text_sub}`}>Per Lokasi</p>
                          {locationSorted.map(([loc]) => {
                            const locAssets = assets.filter(a => a.location === loc);
                            const lg = locAssets.filter(a => a.status === 'good').length;
                            const lw = locAssets.filter(a => a.status === 'warning').length;
                            const lb = locAssets.filter(a => a.status === 'broken').length;
                            const lt = locAssets.length;
                            return (
                              <div key={loc}>
                                <div className="flex items-center justify-between text-[11px] mb-1">
                                  <span className={`font-medium truncate max-w-[200px] ${c_text_title}`}>{loc}</span>
                                  <span className={`tabular-nums ${c_text_sub}`}>{lt} unit</span>
                                </div>
                                <div className="flex h-1.5 rounded-full overflow-hidden">
                                  {lg > 0 && <div className="bg-emerald-500" style={{ width: `${(lg / lt) * 100}%` }} />}
                                  {lw > 0 && <div className="bg-amber-400" style={{ width: `${(lw / lt) * 100}%` }} />}
                                  {lb > 0 && <div className="bg-red-500" style={{ width: `${(lb / lt) * 100}%` }} />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Aktivitas Terkini — Real audit log data */}
                    <div className={`rounded-xl border p-6 ${c_card}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className={`text-xs font-bold ${c_text_title}`}>Aktivitas terkini</p>
                          <p className={`text-[11px] mt-0.5 ${c_text_sub}`}>Catatan perubahan data terakhir di sistem</p>
                        </div>
                        {currentUser && hasPermission(currentUser.role, 'audit_log_view') && (
                          <button onClick={() => setActiveTab('auditlog')} className="text-[11px] text-[#1769FF] hover:underline font-semibold">Audit Log →</button>
                        )}
                      </div>

                      <div className="space-y-0">
                        {/* SWD: Timeline with minimal visual weight */}
                        {[
                          ...assets.slice(0, 3).map(a => ({
                            action: `Aset "${a.name}" tercatat di sistem`,
                            time: a.updatedAt,
                            type: 'asset' as const,
                          })),
                          ...legalDocs.slice(0, 2).map(d => ({
                            action: `Dokumen "${d.title}" — ${d.asset.name}`,
                            time: d.issueDate,
                            type: 'doc' as const,
                          })),
                        ]
                        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                        .slice(0, 6)
                        .map((item, i, arr) => (
                          <div key={i} className="flex gap-3 group">
                            {/* Timeline line */}
                            <div className="flex flex-col items-center">
                              <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${i === 0 ? 'bg-[#1769FF]' : isDark ? 'bg-zinc-700' : 'bg-zinc-300'}`} />
                              {i < arr.length - 1 && <div className={`w-px flex-1 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />}
                            </div>
                            <div className="pb-4">
                              <p className={`text-xs leading-snug ${i === 0 ? c_text_title : c_text_sub} ${i === 0 ? 'font-semibold' : ''}`}>{item.action}</p>
                              <p className={`text-[10px] mt-0.5 ${c_text_sub}`}>
                                {new Date(item.time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                        {assets.length === 0 && legalDocs.length === 0 && (
                          <p className={`text-xs italic py-4 ${c_text_sub}`}>Belum ada aktivitas tercatat.</p>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              );
            })()}

            {/* ────────── TAB 2: ASSETS MANAGEMENT ────────── */}
            {activeTab === 'assets' && (
            <div className="space-y-6">
              {/* Sub-tab switcher: Aset | Legal */}
              <div className={`flex gap-1 p-1 rounded-xl border w-fit ${c_inner_bg}`}>
                <button onClick={() => setAssetSubTab('aset')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${assetSubTab === 'aset' ? 'bg-[#1769FF] text-white shadow-sm' : `${c_text_sub} hover:${c_text_title}`}`}>
                  <span className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5" /> Data Aset</span>
                </button>
                <button onClick={() => setAssetSubTab('legal')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${assetSubTab === 'legal' ? 'bg-[#1769FF] text-white shadow-sm' : `${c_text_sub} hover:${c_text_title}`}`}>
                  <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Perizinan & Legal</span>
                </button>
              </div>

              {assetSubTab === 'aset' && (
              <div className="space-y-6">
                {/* Search & Actions Bar */}
                <div className={`flex flex-col sm:flex-row gap-4 items-center justify-between p-4 border rounded-2xl ${c_sidebar}`}>
                  <div className="relative w-full sm:max-w-xs">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                      <Search className="w-4 h-4" />
                    </span>
                    <input 
                      type="text" 
                      value={assetSearch}
                      onChange={(e) => setAssetSearch(e.target.value)}
                      placeholder="Cari aset atau lokasi..." 
                      className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-xs outline-none ${c_input}`}
                    />
                  </div>

                  <div className="flex gap-3 w-full sm:w-auto">
                    <select 
                      value={assetFilterType}
                      onChange={(e) => setAssetFilterType(e.target.value)}
                      className={`px-3 py-2 border rounded-xl text-xs outline-none ${c_input}`}
                    >
                      <option value="all">Semua Tipe</option>
                      <option value="land">Tanah</option>
                      <option value="office">Gedung Kantor</option>
                      <option value="facility">Fasilitas Kantor</option>
                      <option value="vehicle">Kendaraan Operasional</option>
                    </select>

                    <button 
                      onClick={() => setShowAssetModal(true)}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1769FF] hover:bg-[#4A8AFF] text-white rounded-xl text-xs font-semibold shadow-md shadow-[#1769FF]/15"
                    >
                      <Plus className="w-4 h-4" />
                      Tambah Aset
                    </button>
                  </div>
                </div>

                {/* Grid List Aset */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAssets.map(asset => (
                    <div key={asset.id} className={`border rounded-2xl p-6 flex flex-col justify-between hover:border-[#1769FF]/40 transition-all ${c_card}`}>
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className={`text-[10px] border px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${isDark ? 'bg-zinc-800/80 border-zinc-700/50 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-500'}`}>
                              {asset.type}
                            </span>
                            <h3 className={`font-bold text-base mt-2 truncate w-48 ${c_text_title}`}>{asset.name}</h3>
                          </div>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase ${asset.status === 'good' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : asset.status === 'warning' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                            {asset.status === 'good' ? 'Baik' : asset.status === 'warning' ? 'Warning' : 'Rusak'}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2 text-zinc-500">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className={`truncate ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{asset.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-zinc-500">
                            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                            <span className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Nilai Buku: {formatRupiah(asset.bookValue)}</span>
                          </div>
                        </div>

                        {/* Specs Render */}
                        <div className={`p-3 border rounded-xl text-[11px] font-mono ${c_inner_bg}`}>
                          <span className={`block font-bold border-b pb-1 mb-1 ${isDark ? 'text-zinc-300 border-zinc-800/80' : 'text-zinc-700 border-zinc-200'}`}>Spesifikasi Aset</span>
                          <div className="space-y-1">
                            {Object.entries(asset.specs).map(([k, v]: [string, any]) => (
                              <div key={k} className="flex justify-between">
                                <span className="text-zinc-500">{k}:</span>
                                <span className={`font-medium truncate w-32 text-right ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{v.toString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className={`mt-6 pt-4 border-t flex items-center justify-between gap-2 ${c_border}`}>
                        <button 
                          onClick={() => {
                            setSelectedAsset(asset);
                            setShowDetailModal(true);
                          }}
                          className="flex-1 py-2 bg-[#1769FF] hover:bg-[#4A8AFF] text-white border border-[#1769FF] rounded-lg text-xs font-semibold transition-colors"
                        >
                          Lihat Detail
                        </button>
                        <button 
                          onClick={() => handleShowQR(asset)}
                          title="Generate QR Code"
                          className={`py-2 px-3 border rounded-lg text-xs font-semibold transition-colors ${isDark ? 'bg-zinc-800 hover:bg-zinc-700/80 border-zinc-700/40 text-zinc-200' : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700'}`}
                        >
                          QR
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedAsset(asset);
                            setShowTransferModal(true);
                          }}
                          className={`flex-1 py-2 border rounded-lg text-xs font-semibold transition-colors ${isDark ? 'bg-zinc-800 hover:bg-zinc-700/80 border-zinc-700/40 text-zinc-200' : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700 shadow-sm'}`}
                        >
                          Mutasi Lokasi
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ────────── TAB 3: LEGAL & PERMITS ────────── */}
            {assetSubTab === 'legal' && (
              <div className="space-y-6">
                {/* Search & Actions Bar */}
                <div className={`flex flex-col sm:flex-row gap-4 items-center justify-between p-4 border rounded-2xl ${c_sidebar}`}>
                  <div className="relative w-full sm:max-w-xs">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                      <Search className="w-4 h-4" />
                    </span>
                    <input 
                      type="text" 
                      value={docSearch}
                      onChange={(e) => setDocSearch(e.target.value)}
                      placeholder="Cari nama dokumen atau aset..." 
                      className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-xs outline-none ${c_input}`}
                    />
                  </div>

                  <div className="flex gap-3 w-full sm:w-auto">
                    <select 
                      value={docFilterType}
                      onChange={(e) => setDocFilterType(e.target.value)}
                      className={`px-3 py-2 border rounded-xl text-xs outline-none ${c_input}`}
                    >
                      <option value="all">Semua Status</option>
                      <option value="valid">Valid</option>
                      <option value="warning">Warning</option>
                      <option value="expired">Expired</option>
                    </select>

                    <button 
                      onClick={() => {
                        if (assets.length === 0) return alert('Silakan tambahkan aset terlebih dahulu.');
                        setNewDoc({ ...newDoc, assetId: assets[0].id });
                        setShowDocModal(true);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1769FF] hover:bg-[#4A8AFF] text-white rounded-xl text-xs font-semibold shadow-md shadow-[#1769FF]/15"
                    >
                      <Plus className="w-4 h-4" />
                      Tambah Dokumen
                    </button>
                  </div>
                </div>

                {/* Table Legal Documents */}
                <div className={`border rounded-2xl overflow-hidden ${c_sidebar}`}>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b text-[10px] uppercase font-bold tracking-wider ${c_table_hdr}`}>
                        <th className="py-4 px-6">Nama Dokumen</th>
                        <th className="py-4 px-6">Aset Terkait</th>
                        <th className="py-4 px-6">Tipe Dokumen</th>
                        <th className="py-4 px-6">Tanggal Berlaku</th>
                        <th className="py-4 px-6">Jatuh Tempo</th>
                        <th className="py-4 px-6">Status Kepatuhan</th>
                        <th className="py-4 px-6 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y text-xs ${isDark ? 'divide-zinc-800/60' : 'divide-zinc-200'}`}>
                      {filteredDocs.map(doc => (
                        <tr key={doc.id} className={`transition-colors ${c_table_row}`}>
                          <td className={`py-4 px-6 font-bold ${c_text_title}`}>{doc.title}</td>
                          <td className={`py-4 px-6 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{doc.asset.name}</td>
                          <td className="py-4 px-6">
                            <span className={`text-[10px] border px-2 py-0.5 rounded font-semibold uppercase ${isDark ? 'bg-zinc-800/80 border-zinc-700/50 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-500'}`}>
                              {doc.documentType}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-zinc-500">{new Date(doc.issueDate).toLocaleDateString('id-ID')}</td>
                          <td className={`py-4 px-6 font-semibold ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{new Date(doc.expiryDate).toLocaleDateString('id-ID')}</td>
                          <td className="py-4 px-6">
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase ${doc.complianceStatus === 'valid' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : doc.complianceStatus === 'warning' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                              {doc.complianceStatus}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button 
                              onClick={() => {
                                setSelectedDoc(doc);
                                setRenewExpiryDate(new Date(doc.expiryDate).toISOString().slice(0, 10));
                                setShowRenewModal(true);
                              }}
                              className={`px-3 py-1.5 border rounded-lg text-[10px] font-semibold transition-colors ${isDark ? 'bg-zinc-800 hover:bg-zinc-700/80 border-zinc-700/40 text-zinc-200' : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700 shadow-sm'}`}
                            >
                              Perpanjang
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            </div>)}

            {/* ────────── TAB 4: NOTIFICATIONS ────────── */}
            {activeTab === 'notifications' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Antrean & Riwayat Notifikasi */}
                <div className={`border rounded-2xl p-6 space-y-4 lg:col-span-2 ${c_sidebar}`}>
                  <div className={`border-b pb-3 flex items-center justify-between ${c_border}`}>
                    <h3 className={`font-bold text-sm ${c_text_title}`}>Log Alerts & Email Log</h3>
                    <span className="text-[10px] text-zinc-500 font-bold">Total: {notifications.length}</span>
                  </div>

                  <div className="space-y-4">
                    {notifications.length === 0 ? (
                      <div className="text-center py-12 text-zinc-500 text-sm">Belum ada log notifikasi pengingat yang terkirim.</div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className={`p-4 border rounded-xl space-y-2.5 ${c_inner_bg}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-[#1769FF] shrink-0" />
                              <h4 className={`text-xs font-bold ${c_text_title}`}>{notif.title}</h4>
                            </div>
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase ${notif.status === 'sent' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                              {notif.status}
                            </span>
                          </div>
                          <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{notif.message}</p>
                          <div className={`flex items-center justify-between text-[10px] text-zinc-500 border-t pt-2 ${isDark ? 'border-zinc-800/40' : 'border-zinc-200'}`}>
                            <span>Tujuan: {notif.recipientEmail}</span>
                            <span>
                              {notif.sentAt ? `Terkirim: ${new Date(notif.sentAt).toLocaleString('id-ID')}` : `Direncanakan: ${new Date(notif.scheduledAt).toLocaleString('id-ID')}`}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Simulasi SMTP & Pengingat Status */}
                <div className={`border rounded-2xl p-6 space-y-6 ${c_sidebar}`}>
                  <div className={`border-b pb-3 ${c_border}`}>
                    <h3 className={`font-bold text-sm ${c_text_title}`}>Sistem Log SMTP Outlook</h3>
                  </div>

                  <div className={`p-4 border rounded-xl font-mono text-[10px] text-zinc-500 space-y-2 ${isDark ? 'bg-zinc-950/80 border-zinc-800/80' : 'bg-zinc-100 border-zinc-200'}`}>
                    <span className="block text-zinc-400 border-b pb-1 mb-1 font-bold">SMTP STATUS LOGS</span>
                    <p className="text-[#1769FF]">[SYSTEM] Connection secure via Outlook SMTP SSL port 587</p>
                    <p className="text-emerald-500">[SMTP] Auth validated for fmsp-alert@lintasarta.co.id</p>
                    <p className="text-zinc-500">[IDLE] Waiting for cron triggers...</p>
                    {notifications.filter(n => n.status === 'sent').map(n => (
                      <p key={n.id} className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>
                        &gt; Email Terkirim ke {n.recipientEmail} : {n.title.slice(0,25)}...
                      </p>
                    ))}
                  </div>

                </div>
              </div>
            )}

            {/* ────────── TAB 5: HRD & SECURITY (with sub-tabs) ────────── */}
            {activeTab === 'hrd' && (
              <div className="space-y-6">
                <div className={`flex gap-1 p-1 rounded-xl border w-fit ${c_inner_bg}`}>
                  <button onClick={() => setHrdSubTab('karyawan')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${hrdSubTab === 'karyawan' ? 'bg-[#1769FF] text-white shadow-sm' : `${c_text_sub} hover:${c_text_title}`}`}>
                    <span className="flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Semua Karyawan</span>
                  </button>
                  <button onClick={() => setHrdSubTab('security')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${hrdSubTab === 'security' ? 'bg-[#1769FF] text-white shadow-sm' : `${c_text_sub} hover:${c_text_title}`}`}>
                    <span className="flex items-center gap-2"><Shield className="w-3.5 h-3.5" /> Security Service</span>
                  </button>
                </div>
                {hrdSubTab === 'karyawan' && <HrdView isDark={isDark} token={authToken} />}
                {hrdSubTab === 'security' && <SecurityView isDark={isDark} token={authToken} />}
              </div>
            )}

            {/* ────────── TAB 7: INVENTORY ────────── */}
            {activeTab === 'inventory' && <InventoryView isDark={isDark} token={authToken} />}

            {/* ────────── TAB 8: SMK3 SAFETY ────────── */}
            {activeTab === 'smk3' && <Smk3View isDark={isDark} token={authToken} />}

            {/* ────────── TAB 9: KEUANGAN (Accounting + RAB sub-tabs) ────────── */}
            {activeTab === 'accounting' && (
              <div className="space-y-6">
                <div className={`flex gap-1 p-1 rounded-xl border w-fit ${c_inner_bg}`}>
                  <button onClick={() => setKeuanganSubTab('accounting')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${keuanganSubTab === 'accounting' ? 'bg-[#1769FF] text-white shadow-sm' : `${c_text_sub} hover:${c_text_title}`}`}>
                    <span className="flex items-center gap-2"><DollarSign className="w-3.5 h-3.5" /> Accounting</span>
                  </button>
                  <button onClick={() => setKeuanganSubTab('rab')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${keuanganSubTab === 'rab' ? 'bg-[#1769FF] text-white shadow-sm' : `${c_text_sub} hover:${c_text_title}`}`}>
                    <span className="flex items-center gap-2"><Calculator className="w-3.5 h-3.5" /> RAB / Anggaran</span>
                  </button>
                </div>
                {keuanganSubTab === 'accounting' && <AccountingView isDark={isDark} token={authToken} />}
                {keuanganSubTab === 'rab' && <RabView isDark={isDark} token={authToken} />}
              </div>
            )}

            {/* ────────── TAB 13: PREVENTIVE MAINTENANCE ────────── */}
            {activeTab === 'maintenance' && <MaintenanceView isDark={isDark} token={authToken} />}

            {/* ────────── TAB 14: VENDOR & CONTRACT ────────── */}
            {activeTab === 'vendor' && <VendorView isDark={isDark} token={authToken} />}

            {/* ────────── TAB 15: WORK ORDER / TICKET ────────── */}
            {activeTab === 'workorder' && <WorkOrderView isDark={isDark} token={authToken} currentUserRole={currentUser?.role || 'viewer'} />}

            {/* ────────── TAB 16: AUDIT LOG ────────── */}
            {activeTab === 'auditlog' && <AuditLogView isDark={isDark} token={authToken} />}

            {/* ────────── TAB 17: ADMIN MASTER DATA ────────── */}
            {activeTab === 'admin' && <AdminView isDark={isDark} token={authToken} />}
            {activeTab === 'users' && (
              <UserManagementView
                token={authToken}
                isDark={isDark}
                currentUserEmail={currentUser?.email || ''}
                currentUserRole={currentUser?.role || 'user'}
              />
            )}
            {activeTab === 'analytics' && (
              <AnalyticsView token={authToken} isDark={isDark} />
            )}

          </div>
        )}
      </main>

      {/* ────────────────── MODALS ────────────────── */}

      {/* MODAL 1: Tambah Aset */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`w-full max-w-md border p-6 rounded-2xl shadow-2xl space-y-6 ${c_modal}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${c_border}`}>
              <h3 className="text-base font-bold">Tambah Aset Fisik Baru</h3>
              <button onClick={() => setShowAssetModal(false)} className="text-zinc-500 hover:text-red-500 text-xs">Tutup</button>
            </div>

            <form onSubmit={handleAddAsset} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-500 mb-1">Nama Aset</label>
                <input 
                  type="text" 
                  required
                  value={newAsset.name} 
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                  placeholder="AC Presisi, Gedung Kantor, dll."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1">Tipe Aset</label>
                  <select 
                    value={newAsset.type} 
                    onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`}
                  >
                    <option value="land">Tanah</option>
                    <option value="office">Gedung Kantor</option>
                    <option value="facility">Fasilitas Kantor</option>
                    <option value="vehicle">Kendaraan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Kondisi</label>
                  <select 
                    value={newAsset.status} 
                    onChange={(e) => setNewAsset({ ...newAsset, status: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`}
                  >
                    <option value="good">Baik</option>
                    <option value="warning">Warning</option>
                    <option value="broken">Rusak</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">Lokasi Fisik</label>
                <input 
                  type="text" 
                  required
                  value={newAsset.location} 
                  onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                  placeholder="Gedung Jatiluhur Lt.1, Pool Thamrin, dll."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1">Nilai Buku (IDR)</label>
                  <input 
                    type="number" 
                    required
                    value={newAsset.bookValue} 
                    onChange={(e) => setNewAsset({ ...newAsset, bookValue: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                    placeholder="120000000"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Merek / Brand</label>
                  <input 
                    type="text" 
                    value={newAsset.specBrand} 
                    onChange={(e) => setNewAsset({ ...newAsset, specBrand: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                    placeholder="Daikin, Toyota, Schneider"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1">Kapasitas / Ukuran</label>
                  <input 
                    type="text" 
                    value={newAsset.specCapacity} 
                    onChange={(e) => setNewAsset({ ...newAsset, specCapacity: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                    placeholder="2 PK, 500 kVA, 3 Lantai"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Tahun Pembelian</label>
                  <input 
                    type="text" 
                    value={newAsset.specYear} 
                    onChange={(e) => setNewAsset({ ...newAsset, specYear: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                    placeholder="2024"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">Catatan Tambahan</label>
                <input 
                  type="text" 
                  value={newAsset.specNote} 
                  onChange={(e) => setNewAsset({ ...newAsset, specNote: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                  placeholder="Opsional: keterangan tambahan"
                />
              </div>

              <button type="submit" className="w-full py-2.5 bg-[#1769FF] hover:bg-[#4A8AFF] text-white rounded-lg font-semibold transition-colors mt-4">
                Simpan Aset
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL: Lihat Detail Aset */}
      {showDetailModal && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => { setShowDetailModal(false); setIsEditingAsset(false); }}>
          <div className={`w-full max-w-2xl border rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto ${c_modal}`} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={`sticky top-0 z-10 flex items-center justify-between border-b p-6 pb-4 ${c_border} ${isDark ? 'bg-[#0F1C33]' : 'bg-white'}`}>
              <div>
                <span className={`text-[10px] border px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${isDark ? 'bg-zinc-800/80 border-zinc-700/50 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-500'}`}>
                  {selectedAsset.type === 'land' ? 'Tanah' : selectedAsset.type === 'office' ? 'Gedung Kantor' : selectedAsset.type === 'facility' ? 'Fasilitas' : 'Kendaraan'}
                </span>
                <h3 className={`text-lg font-bold mt-2 ${c_text_title}`}>{isEditingAsset ? 'Edit Aset' : selectedAsset.name}</h3>
              </div>
              <div className="flex items-center gap-3">
                {!isEditingAsset && (
                  <button onClick={() => startEditAsset(selectedAsset)} className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/20 rounded-lg text-[10px] font-semibold transition-colors flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    Edit
                  </button>
                )}
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase ${selectedAsset.status === 'good' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : selectedAsset.status === 'warning' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                  {selectedAsset.status === 'good' ? 'Baik' : selectedAsset.status === 'warning' ? 'Warning' : 'Rusak'}
                </span>
                <button onClick={() => { setShowDetailModal(false); setIsEditingAsset(false); }} className="text-zinc-500 hover:text-red-500 text-sm font-semibold">✕</button>
              </div>
            </div>

            {/* ──── EDIT MODE ──── */}
            {isEditingAsset ? (
              <form onSubmit={handleEditAsset} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-500 mb-1">Nama Aset</label>
                  <input type="text" required value={editAssetData.name} onChange={(e) => setEditAssetData({...editAssetData, name: e.target.value})} className={`w-full px-3 py-2.5 border rounded-lg outline-none ${c_input}`} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-500 mb-1">Tipe Aset</label>
                    <select value={editAssetData.type} onChange={(e) => setEditAssetData({...editAssetData, type: e.target.value})} className={`w-full px-3 py-2.5 border rounded-lg outline-none ${c_input}`}>
                      <option value="land">Tanah</option>
                      <option value="office">Gedung Kantor</option>
                      <option value="facility">Fasilitas Kantor</option>
                      <option value="vehicle">Kendaraan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-500 mb-1">Kondisi</label>
                    <select value={editAssetData.status} onChange={(e) => setEditAssetData({...editAssetData, status: e.target.value})} className={`w-full px-3 py-2.5 border rounded-lg outline-none ${c_input}`}>
                      <option value="good">Baik</option>
                      <option value="warning">Warning</option>
                      <option value="broken">Rusak</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Lokasi Fisik</label>
                  <input type="text" required value={editAssetData.location} onChange={(e) => setEditAssetData({...editAssetData, location: e.target.value})} className={`w-full px-3 py-2.5 border rounded-lg outline-none ${c_input}`} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-500 mb-1">Nilai Buku (IDR)</label>
                    <input type="number" required value={editAssetData.bookValue} onChange={(e) => setEditAssetData({...editAssetData, bookValue: e.target.value})} className={`w-full px-3 py-2.5 border rounded-lg outline-none ${c_input}`} />
                  </div>
                  <div>
                    <label className="block text-zinc-500 mb-1">Merek / Brand</label>
                    <input type="text" value={editAssetData.specBrand} onChange={(e) => setEditAssetData({...editAssetData, specBrand: e.target.value})} className={`w-full px-3 py-2.5 border rounded-lg outline-none ${c_input}`} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-500 mb-1">Kapasitas / Ukuran</label>
                    <input type="text" value={editAssetData.specCapacity} onChange={(e) => setEditAssetData({...editAssetData, specCapacity: e.target.value})} className={`w-full px-3 py-2.5 border rounded-lg outline-none ${c_input}`} />
                  </div>
                  <div>
                    <label className="block text-zinc-500 mb-1">Tahun</label>
                    <input type="text" value={editAssetData.specYear} onChange={(e) => setEditAssetData({...editAssetData, specYear: e.target.value})} className={`w-full px-3 py-2.5 border rounded-lg outline-none ${c_input}`} />
                  </div>
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Catatan Tambahan</label>
                  <input type="text" value={editAssetData.specNote} onChange={(e) => setEditAssetData({...editAssetData, specNote: e.target.value})} className={`w-full px-3 py-2.5 border rounded-lg outline-none ${c_input}`} />
                </div>
                <div className="flex gap-3 pt-3">
                  <button type="button" onClick={() => setIsEditingAsset(false)} className={`flex-1 py-2.5 border rounded-xl text-xs font-semibold transition-colors ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white' : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700'}`}>
                    Batal
                  </button>
                  <button type="submit" className="flex-1 py-2.5 bg-[#1769FF] hover:bg-[#4A8AFF] text-white rounded-xl text-xs font-semibold transition-colors">
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            ) : (
            /* ──── VIEW MODE ──── */
            <div className="p-6 space-y-6 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border ${c_inner_bg}`}>
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase mb-1">Lokasi</p>
                  <p className={`font-semibold ${c_text_title}`}>{selectedAsset.location}</p>
                </div>
                <div className={`p-4 rounded-xl border ${c_inner_bg}`}>
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase mb-1">Nilai Buku</p>
                  <p className="font-semibold text-[#1769FF]">{formatRupiah(selectedAsset.bookValue)}</p>
                </div>
              </div>
              <div className={`p-4 rounded-xl border ${c_inner_bg}`}>
                <p className={`text-xs font-bold mb-3 ${c_text_title}`}>Informasi Lifecycle</p>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div><p className="text-zinc-500">Status Lifecycle</p><p className={`font-semibold capitalize ${c_text_title}`}>{selectedAsset.lifecycleStatus || '-'}</p></div>
                  <div><p className="text-zinc-500">Tanggal Beli</p><p className={`font-semibold ${c_text_title}`}>{selectedAsset.purchaseDate ? new Date(selectedAsset.purchaseDate).toLocaleDateString('id-ID') : '-'}</p></div>
                  <div><p className="text-zinc-500">Umur Pakai</p><p className={`font-semibold ${c_text_title}`}>{selectedAsset.expectedLifeYrs ? `${selectedAsset.expectedLifeYrs} tahun` : '-'}</p></div>
                </div>
              </div>
              <div className={`p-4 rounded-xl border ${c_inner_bg}`}>
                <p className={`text-xs font-bold mb-3 ${c_text_title}`}>Spesifikasi Teknis</p>
                {Object.keys(selectedAsset.specs).length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {Object.entries(selectedAsset.specs).map(([k, v]: [string, any]) => (
                      <div key={k} className="flex justify-between gap-2">
                        <span className="text-zinc-500 capitalize">{k}</span>
                        <span className={`font-semibold text-right ${c_text_title}`}>{v.toString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (<p className="text-xs text-zinc-500 italic">Belum ada spesifikasi</p>)}
              </div>
              <div className={`p-4 rounded-xl border ${c_inner_bg}`}>
                <p className={`text-xs font-bold mb-3 ${c_text_title}`}>Riwayat Mutasi ({selectedAsset.transfers?.length || 0})</p>
                {selectedAsset.transfers && selectedAsset.transfers.length > 0 ? (
                  <div className="space-y-2">
                    {selectedAsset.transfers.map((t: any, i: number) => (
                      <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg text-xs ${isDark ? 'bg-[#070E1B]/60' : 'bg-white'}`}>
                        <div className="w-6 h-6 rounded-full bg-[#1769FF]/10 flex items-center justify-center text-[#1769FF] text-[10px] font-bold">{i+1}</div>
                        <div className="flex-1"><span className="text-zinc-500">{t.fromLocation}</span><span className="mx-2 text-[#1769FF]">→</span><span className={`font-semibold ${c_text_title}`}>{t.toLocation}</span></div>
                        <span className="text-[10px] text-zinc-500">{new Date(t.transferredAt).toLocaleDateString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                ) : (<p className="text-xs text-zinc-500 italic">Belum ada mutasi</p>)}
              </div>
              <div className={`p-4 rounded-xl border ${c_inner_bg}`}>
                <p className={`text-xs font-bold mb-3 ${c_text_title}`}>Dokumen Legal Terkait</p>
                {selectedAsset.legalDocuments && selectedAsset.legalDocuments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedAsset.legalDocuments.map((doc: any) => (
                      <div key={doc.id} className={`flex items-center justify-between p-2.5 rounded-lg text-xs ${isDark ? 'bg-[#070E1B]/60' : 'bg-white'}`}>
                        <div><p className={`font-semibold ${c_text_title}`}>{doc.title}</p><p className="text-zinc-500 text-[10px]">{doc.documentType.toUpperCase()} · Berlaku s/d {new Date(doc.expiryDate).toLocaleDateString('id-ID')}</p></div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${doc.complianceStatus === 'valid' ? 'bg-emerald-500/10 text-emerald-500' : doc.complianceStatus === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>{doc.complianceStatus.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                ) : (<p className="text-xs text-zinc-500 italic">Belum ada dokumen legal</p>)}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => startEditAsset(selectedAsset)} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition-colors">Edit Aset</button>
                <button onClick={() => { setShowDetailModal(false); setShowTransferModal(true); }} className={`flex-1 py-2.5 border rounded-xl text-xs font-semibold transition-colors ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white' : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700'}`}>Mutasi Lokasi</button>
                <button onClick={() => setShowDetailModal(false)} className="flex-1 py-2.5 bg-[#1769FF] hover:bg-[#4A8AFF] text-white rounded-xl text-xs font-semibold transition-colors">Tutup</button>
              </div>
            </div>
            )}
          </div>
        </div>
      )}
      {/* MODAL 2: Mutasi Lokasi Aset */}
      {showTransferModal && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`w-full max-w-md border p-6 rounded-2xl shadow-2xl space-y-6 ${c_modal}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${c_border}`}>
              <h3 className="text-base font-bold">Mutasi Lokasi Aset</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-zinc-500 hover:text-red-500 text-xs">Tutup</button>
            </div>

            <form onSubmit={handleTransferAsset} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-500 mb-1">Nama Aset (Read-Only)</label>
                <input type="text" disabled value={selectedAsset.name} className={`w-full px-3 py-2 border rounded-lg text-zinc-400 cursor-not-allowed ${c_input}`} style={{ opacity: 0.6 }} />
              </div>
              <div>
                <label className="block text-zinc-500 mb-1">Lokasi Saat Ini</label>
                <input type="text" disabled value={selectedAsset.location} className={`w-full px-3 py-2 border rounded-lg text-zinc-400 cursor-not-allowed ${c_input}`} style={{ opacity: 0.6 }} />
              </div>
              <div>
                <label className="block text-zinc-500 mb-1">Lokasi Baru</label>
                <input 
                  type="text" 
                  required
                  value={transferData.toLocation}
                  onChange={(e) => setTransferData({ ...transferData, toLocation: e.target.value })}
                  placeholder="Gedung TB Simatupang, dll." 
                  className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                />
              </div>
              <div>
                <label className="block text-zinc-500 mb-1">Catatan Mutasi</label>
                <textarea 
                  value={transferData.notes}
                  onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
                  placeholder="Alasan pemindahan aset..." 
                  className={`w-full px-3 py-2 border rounded-lg outline-none h-20 resize-none ${c_input}`} 
                />
              </div>

              <button type="submit" className="w-full py-2.5 bg-[#1769FF] hover:bg-[#4A8AFF] text-white rounded-lg font-semibold transition-colors mt-4">
                Proses Mutasi Lokasi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Tambah Dokumen Legal */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`w-full max-w-md border p-6 rounded-2xl shadow-2xl space-y-6 ${c_modal}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${c_border}`}>
              <h3 className="text-base font-bold">Tambah Dokumen Legalitas Aset</h3>
              <button onClick={() => setShowDocModal(false)} className="text-zinc-500 hover:text-red-500 text-xs">Tutup</button>
            </div>

            <form onSubmit={handleAddDoc} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-500 mb-1">Aset Terkait</label>
                <select 
                  value={newDoc.assetId}
                  onChange={(e) => setNewDoc({ ...newDoc, assetId: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`}
                >
                  {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">Nama Dokumen</label>
                <input 
                  type="text" 
                  required
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                  placeholder="Sertifikat IMB Gedung Lintasarta X..." 
                  className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1">Tipe Dokumen</label>
                  <select 
                    value={newDoc.documentType}
                    onChange={(e) => setNewDoc({ ...newDoc, documentType: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`}
                  >
                    <option value="pbg_imb">PBG / IMB</option>
                    <option value="slf">SLF</option>
                    <option value="certificate">Sertifikat Tanah</option>
                    <option value="insurance">Asuransi</option>
                    <option value="tax_building">Pajak Gedung (PBB)</option>
                    <option value="tax_vehicle">Pajak Kendaraan (PKB)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">URL / Lokasi Berkas PDF</label>
                  <input 
                    type="text" 
                    value={newDoc.documentUrl}
                    onChange={(e) => setNewDoc({ ...newDoc, documentUrl: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-500 mb-1">Tanggal Terbit</label>
                  <input 
                    type="date" 
                    required
                    value={newDoc.issueDate}
                    onChange={(e) => setNewDoc({ ...newDoc, issueDate: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1">Tanggal Kedaluwarsa</label>
                  <input 
                    type="date" 
                    required
                    value={newDoc.expiryDate}
                    onChange={(e) => setNewDoc({ ...newDoc, expiryDate: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-2.5 bg-[#1769FF] hover:bg-[#4A8AFF] text-white rounded-lg font-semibold transition-colors mt-4">
                Unggah & Simpan Dokumen
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Perpanjang Dokumen */}
      {showRenewModal && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`w-full max-w-md border p-6 rounded-2xl shadow-2xl space-y-6 ${c_modal}`}>
            <div className={`flex items-center justify-between border-b pb-3 ${c_border}`}>
              <h3 className="text-base font-bold">Perpanjang Dokumen Legalitas</h3>
              <button onClick={() => setShowRenewModal(false)} className="text-zinc-500 hover:text-red-500 text-xs">Tutup</button>
            </div>

            <form onSubmit={handleRenewDoc} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-500 mb-1">Nama Dokumen (Read-Only)</label>
                <input type="text" disabled value={selectedDoc.title} className={`w-full px-3 py-2 border rounded-lg text-zinc-400 cursor-not-allowed ${c_input}`} style={{ opacity: 0.6 }} />
              </div>
              <div>
                <label className="block text-zinc-500 mb-1">Jatuh Tempo Saat Ini</label>
                <input type="text" disabled value={new Date(selectedDoc.expiryDate).toLocaleDateString('id-ID')} className={`w-full px-3 py-2 border rounded-lg text-zinc-400 cursor-not-allowed ${c_input}`} style={{ opacity: 0.6 }} />
              </div>
              <div>
                <label className="block text-zinc-500 mb-1">Tanggal Jatuh Tempo Baru</label>
                <input 
                  type="date" 
                  required
                  value={renewExpiryDate}
                  onChange={(e) => setRenewExpiryDate(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg outline-none ${c_input}`} 
                />
              </div>

              <button type="submit" className="w-full py-2.5 bg-[#1769FF] hover:bg-[#4A8AFF] text-white rounded-lg font-semibold transition-colors mt-4">
                Proses Perpanjangan Dokumen
              </button>
            </form>
          </div>
        </div>
      )}
      {/* MODAL 5: QR Code Aset */}
      {showQrModal && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`w-full max-w-sm border rounded-2xl shadow-2xl overflow-hidden ${c_modal}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: isDark ? '#1A2744' : '#E0E8F5' }}>
              <div>
                <h3 className="text-sm font-bold">QR Code Aset</h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Scan untuk lihat detail aset</p>
              </div>
              <button onClick={() => setShowQrModal(false)} className="text-zinc-500 hover:text-red-500 text-xs font-medium transition-colors">✕ Tutup</button>
            </div>

            {/* QR Display */}
            <div className="flex flex-col items-center px-6 py-6 gap-4">
              {/* Label Tag */}
              <div className={`w-full rounded-xl border p-4 text-center ${isDark ? 'bg-white/5 border-[#1A2744]' : 'bg-[#F0F5FF] border-[#C7D9FF]'}`}>
                <p className="text-[10px] font-semibold tracking-widest text-[#1769FF] mb-2">🏢 LINTASARTA FMSP</p>
                <p className="text-sm font-bold leading-tight">{selectedAsset.name}</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{selectedAsset.location}</p>

                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 mx-auto mt-3 rounded-lg" />
                ) : (
                  <div className="w-48 h-48 mx-auto mt-3 rounded-lg bg-zinc-200 animate-pulse" />
                )}

                <p className="text-[11px] font-mono text-[#1769FF] mt-2 tracking-widest">
                  FMSP-{selectedAsset.id.slice(-8).toUpperCase()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleDownloadQR}
                  className="flex-1 py-2.5 rounded-lg text-xs font-semibold bg-[#1769FF] hover:bg-[#4A8AFF] text-white transition-colors"
                >
                  ⬇ Download PNG
                </button>
                <button
                  onClick={handlePrintQR}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-colors ${isDark ? 'border-zinc-600 hover:bg-white/10 text-zinc-200' : 'border-zinc-300 hover:bg-zinc-100 text-zinc-700'}`}
                >
                  🖨️ Print Label
                </button>
              </div>

              <p className={`text-[10px] text-center ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Tempel label QR ini di aset fisik untuk akses cepat via smartphone
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── PWA Install Banner ──────────────────────── */}
      {showPwaBanner && (
        <div className="pwa-install-banner animate-slide-up">
          <span>📱</span>
          <span>Install FMSP di HP kamu</span>
          <button
            onClick={async () => {
              if (pwaPrompt) {
                pwaPrompt.prompt();
                const { outcome } = await pwaPrompt.userChoice;
                if (outcome === 'accepted') setShowPwaBanner(false);
              }
            }}
            className="bg-white text-[#1769FF] px-3 py-1 rounded-full text-xs font-bold"
          >
            Install
          </button>
          <button onClick={() => setShowPwaBanner(false)} className="text-white/70 hover:text-white text-sm leading-none">✕</button>
        </div>
      )}

      {/* ── Bottom Navigation (Mobile Only) ─────────── */}
      <nav className={`fixed bottom-0 left-0 right-0 z-40 md:hidden border-t bottom-nav-safe ${isDark ? 'bg-[#0B1628]/95 border-[#1A2744]' : 'bg-white/95 border-[#E0E8F5]'} backdrop-blur-xl`}>
        <div className="grid grid-cols-5 h-16">
          {([
            { tab: 'overview'      as const, icon: '📊', label: 'Overview' },
            { tab: 'assets'        as const, icon: '🏢', label: 'Aset' },
            { tab: 'workorder'     as const, icon: '🔧', label: 'WO' },
            { tab: 'maintenance'   as const, icon: '📅', label: 'PM' },
            { tab: 'notifications' as const, icon: '🔔', label: 'Alerts' },
          ]).map(({ tab, icon, label }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-all ${
                activeTab === tab
                  ? 'text-[#1769FF]'
                  : isDark ? 'text-zinc-500' : 'text-zinc-400'
              }`}
            >
              <span className="text-lg leading-none">{icon}</span>
              <span>{label}</span>
              {activeTab === tab && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-[#1769FF] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>

    </div>
  );
}
