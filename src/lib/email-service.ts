import nodemailer from 'nodemailer';
import { getAppSetting, getAppSettings } from './app-settings';

// Fallback to env vars, then to DB settings
const ENV_SMTP_HOST = process.env.SMTP_HOST || '';
const ENV_SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const ENV_SMTP_USER = process.env.SMTP_USER || '';
const ENV_SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';

let transporter: nodemailer.Transporter | null = null;
let lastConfigHash = '';

async function getSmtpConfig() {
  const dbSettings = await getAppSettings('smtp');

  // DB settings override env vars (if DB has values)
  const host = dbSettings.smtp_host || ENV_SMTP_HOST;
  const port = parseInt(dbSettings.smtp_port || String(ENV_SMTP_PORT)) || 587;
  const user = dbSettings.smtp_user || ENV_SMTP_USER;
  const password = dbSettings.smtp_password || ENV_SMTP_PASSWORD;
  const fromName = dbSettings.smtp_from_name || 'FMSP Lintasarta';
  const fromEmail = dbSettings.smtp_from_email || user || 'fmsp-alert@lintasarta.co.id';

  return { host, port, user, password, fromName, fromEmail };
}

async function getTransporter() {
  const config = await getSmtpConfig();
  const configHash = `${config.host}:${config.port}:${config.user}`;

  // Recreate transporter if config changed
  if (transporter && configHash === lastConfigHash) return { transporter, config };

  const isMockMode = !config.host || !config.user;

  if (isMockMode) {
    try {
      console.log('[EMAIL SERVICE] Initializing Ethereal mock account...');
      // Try to create test account with a 5-second timeout
      const testAccount = await Promise.race([
        nodemailer.createTestAccount(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Ethereal timeout')), 5000))
      ]);
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
      });
      console.log('[EMAIL SERVICE] Mode: MOCK (Ethereal). Preview URL akan ditampilkan di log.');
    } catch (err: any) {
      console.warn('[EMAIL SERVICE] Ethereal initialization failed or timed out. Falling back to OFFLINE MOCK mode. Emails will be printed to console log.', err.message);
      // Fallback to offline mock transporter
      transporter = {
        sendMail: async (mailOptions: any) => {
          console.log(`✉️ [OFFLINE EMAIL MOCK]
  From: ${mailOptions.from}
  To: ${mailOptions.to}
  Subject: ${mailOptions.subject}
  Message: ${mailOptions.text}
---------------------------------------------`);
          return { messageId: 'offline-mock-id' };
        }
      } as any;
    }
  } else {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.password },
      tls: { ciphers: 'TLSv1.2', minVersion: 'TLSv1.2' },
      requireTLS: config.port !== 465, // Force STARTTLS for non-465 ports
      connectionTimeout: 8000, // 8 seconds connection timeout
      greetingTimeout: 8000,   // 8 seconds greeting timeout
      socketTimeout: 15000,    // 15 seconds socket inactivity timeout
    });
    console.log(`[EMAIL SERVICE] Mode: PRODUCTION (${config.host}:${config.port})`);
  }

  lastConfigHash = configHash;
  return { transporter, config };
}

interface SendEmailOptions {
  to: string;
  subject: string;
  message: string;
  documentLink?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; previewUrl?: string; error?: string }> {
  try {
    const { transporter: transport, config } = await getTransporter();
    if (!transport) {
      throw new Error('SMTP transporter is not initialized');
    }

    // Get company branding from DB settings
    const appName = await getAppSetting('app_name', 'FMSP Lintasarta');
    const companyName = await getAppSetting('company_name', 'PT Aplikanusa Lintasarta');
    const companyDivision = await getAppSetting('company_division', 'Facility Management Division');
    const appBaseUrl = await getAppSetting('app_base_url', 'http://localhost:3847');

    // SECURITY: HTML-escape user-provided content to prevent XSS in email
    const escapeHtml = (str: string) =>
      str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

    const safeSubject = escapeHtml(options.subject);
    const safeMessage = escapeHtml(options.message).replace(/\n/g, '<br/>');

    const htmlBody = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1e40af, #4f46e5); padding: 24px 32px;">
          <h1 style="color: white; margin: 0; font-size: 20px;">🏢 ${appName}</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 12px;">Facility Management Service Platform — Notification</p>
        </div>
        <div style="padding: 24px 32px; color: #374151;">
          <h2 style="font-size: 16px; margin: 0 0 12px; color: #111827;">${safeSubject}</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">${safeMessage}</p>
          ${(() => {
            // SECURITY: Sanitize documentLink — only allow safe relative paths
            const safeLink = options.documentLink && /^\/[\w\-\/\.\?\=\&\%]+$/.test(options.documentLink)
              ? escapeHtml(options.documentLink) : null;
            return safeLink ? `
            <div style="margin-top: 20px;">
              <a href="${appBaseUrl}${safeLink}" 
                 style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 600;">
                📄 Lihat Detail Dokumen
              </a>
            </div>` : '';
          })()}
        </div>
        <div style="padding: 16px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 11px; color: #9ca3af;">
            Email ini dikirim otomatis oleh ${appName}. Jangan membalas email ini.<br/>
            © ${new Date().getFullYear()} ${companyName} — ${companyDivision}
          </p>
        </div>
      </div>
    `;

    const info = await transport.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.message,
      html: htmlBody,
    });

    const isMockMode = !config.host || !config.user;
    const previewUrl = isMockMode ? nodemailer.getTestMessageUrl(info) : undefined;

    if (previewUrl) {
      console.log(`[EMAIL SERVICE] Mock email preview: ${previewUrl}`);
    }

    return { success: true, previewUrl: previewUrl ? String(previewUrl) : undefined };
  } catch (error: any) {
    console.error('[EMAIL SERVICE] Send failed:', error.message);
    return { success: false, error: error.message };
  }
}
