import { prisma } from './db';

// ─── App Settings Helper ───
// Menggantikan hardcoded values dengan database-driven config

const SETTING_CACHE = new Map<string, { value: string; ts: number }>();
const CACHE_TTL = 60_000; // 1 minute cache

/**
 * Get a single app setting by key.
 * Falls back to `defaultValue` if not found in DB.
 */
export async function getAppSetting(key: string, defaultValue = ''): Promise<string> {
  // Check cache
  const cached = SETTING_CACHE.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.value;

  try {
    const setting = await prisma.appSetting.findUnique({ where: { key } });
    const val = setting?.value ?? defaultValue;
    SETTING_CACHE.set(key, { value: val, ts: Date.now() });
    return val;
  } catch {
    return defaultValue;
  }
}

/**
 * Get all settings for a group (e.g., 'smtp', 'company').
 */
export async function getAppSettings(group: string): Promise<Record<string, string>> {
  try {
    const settings = await prisma.appSetting.findMany({ where: { group } });
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
      SETTING_CACHE.set(s.key, { value: s.value, ts: Date.now() });
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Clear cache (called after settings update)
 */
export function clearSettingsCache() {
  SETTING_CACHE.clear();
}

/**
 * Default settings to seed into the database.
 */
export const DEFAULT_SETTINGS = [
  // ── SMTP ──
  { key: 'smtp_host', value: '', label: 'SMTP Host', group: 'smtp', inputType: 'text' },
  { key: 'smtp_port', value: '587', label: 'SMTP Port', group: 'smtp', inputType: 'number' },
  { key: 'smtp_user', value: '', label: 'SMTP Username', group: 'smtp', inputType: 'email' },
  { key: 'smtp_password', value: '', label: 'SMTP Password', group: 'smtp', inputType: 'password' },
  { key: 'smtp_from_name', value: 'FMSP Lintasarta', label: 'Nama Pengirim Email', group: 'smtp', inputType: 'text' },
  { key: 'smtp_from_email', value: 'fmsp-alert@lintasarta.co.id', label: 'Email Pengirim (FROM)', group: 'smtp', inputType: 'email' },

  // ── Notifikasi ──
  { key: 'notification_default_email', value: 'admin@lintasarta.co.id', label: 'Email Penerima Notifikasi Default', group: 'notification', inputType: 'email' },
  { key: 'doc_warning_days', value: '30', label: 'Peringatan Dokumen Expired (hari)', group: 'notification', inputType: 'number' },

  // ── Perusahaan ──
  { key: 'app_name', value: 'FMSP Lintasarta', label: 'Nama Aplikasi', group: 'company', inputType: 'text' },
  { key: 'company_name', value: 'PT Aplikanusa Lintasarta', label: 'Nama Perusahaan', group: 'company', inputType: 'text' },
  { key: 'company_division', value: 'Facility Management Division', label: 'Nama Divisi', group: 'company', inputType: 'text' },

  // ── Sistem ──
  { key: 'app_base_url', value: 'http://localhost:3847', label: 'Base URL Aplikasi', group: 'system', inputType: 'text' },
  { key: 'vapid_email', value: 'mailto:admin@lintasarta.co.id', label: 'VAPID Contact Email', group: 'system', inputType: 'text' },

  // ── AI Config ──
  { key: 'ai_bot_enabled', value: 'true', label: 'AI Chatbot Aktif', group: 'ai', inputType: 'text' },
];

/**
 * Seed default settings into database (only if not already present).
 */
export async function seedDefaultSettings() {
  for (const setting of DEFAULT_SETTINGS) {
    await prisma.appSetting.upsert({
      where: { key: setting.key },
      update: {}, // Don't overwrite existing values
      create: setting,
    });
  }
}
