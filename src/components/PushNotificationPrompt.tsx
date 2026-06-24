'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, X, CheckCircle } from 'lucide-react';

interface Props {
  token: string;
  isDark: boolean;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationPrompt({ token, isDark }: Props) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  // Check current subscription state
  const checkSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const perm = Notification.permission;
    setPermission(perm);

    if (perm === 'granted') {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    }

    // Show banner only if not yet decided and not dismissed this session
    const dismissed = sessionStorage.getItem('pushDismissed');
    if (perm === 'default' && !dismissed) {
      // Delay showing banner to avoid overwhelming new users
      setTimeout(() => setShowBanner(true), 5000);
    }
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const subscribe = async () => {
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        setShowBanner(false);
        setLoading(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.error('[Push] VAPID public key not found');
        setLoading(false);
        return;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // Send subscription to server
      const res = await fetch('/api/notifications/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      const data = await res.json();
      if (data.success) {
        setIsSubscribed(true);
        setShowBanner(false);
        setToast('Notifikasi push berhasil diaktifkan!');
        setTimeout(() => setToast(''), 3000);
      }
    } catch (error) {
      console.error('[Push] Subscribe error:', error);
    }
    setLoading(false);
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        // Notify server
        await fetch('/api/notifications/push', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
      setToast('Notifikasi push dinonaktifkan.');
      setTimeout(() => setToast(''), 3000);
    } catch (error) {
      console.error('[Push] Unsubscribe error:', error);
    }
    setLoading(false);
  };

  const dismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('pushDismissed', 'true');
  };

  // If push not supported, render nothing
  if (typeof window === 'undefined' || !('PushManager' in (window || {}))) return null;

  return (
    <>
      {/* Floating banner prompt (shown once if permission is default) */}
      {showBanner && permission === 'default' && (
        <div className={`fixed bottom-6 right-6 z-40 max-w-sm rounded-xl border shadow-2xl p-5 animate-in slide-in-from-bottom-4 ${
          isDark
            ? 'bg-[#0F1C33] border-[#373C43] text-white'
            : 'bg-white border-[#DEE0E3] text-zinc-800'
        }`}>
          <button onClick={dismiss} className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3370FF]/10 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-[#3370FF]" />
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-bold">Aktifkan Notifikasi</h4>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Terima notifikasi real-time untuk Work Order, dokumen expiring, maintenance jadwal, dan approval request.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={subscribe}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3370FF] hover:bg-[#5B8EFF] text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  <Bell className="w-3 h-3" />
                  {loading ? 'Mengaktifkan...' : 'Aktifkan'}
                </button>
                <button
                  onClick={dismiss}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    isDark ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  Nanti saja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold animate-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4" />
          {toast}
        </div>
      )}

      {/* Toggle button in header area — can be rendered by parent */}
      {permission === 'granted' && (
        <button
          onClick={isSubscribed ? unsubscribe : subscribe}
          disabled={loading}
          title={isSubscribed ? 'Nonaktifkan Push Notification' : 'Aktifkan Push Notification'}
          className={`p-2 rounded-xl transition-colors ${
            isSubscribed
              ? isDark ? 'bg-[#3370FF]/10 text-[#3370FF] hover:bg-[#3370FF]/20' : 'bg-[#3370FF]/10 text-[#3370FF] hover:bg-[#3370FF]/20'
              : isDark ? 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
          } disabled:opacity-50`}
        >
          {isSubscribed ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        </button>
      )}
    </>
  );
}
