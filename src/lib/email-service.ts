import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3847';

const isMockMode = !SMTP_HOST || !SMTP_USER;

// Create transporter (mock or real)
let transporter: nodemailer.Transporter;

async function getTransporter() {
  if (transporter) return transporter;

  if (isMockMode) {
    // Mock mode: use Ethereal (free fake SMTP)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('[EMAIL SERVICE] Mode: MOCK (Ethereal). Preview URL akan ditampilkan di log.');
  } else {
    // Production mode: Microsoft Outlook SMTP
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: false, // STARTTLS
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
      tls: { ciphers: 'TLSv1.2' },
    });
    console.log(`[EMAIL SERVICE] Mode: PRODUCTION (${SMTP_HOST}:${SMTP_PORT})`);
  }

  return transporter;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  message: string;
  documentLink?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; previewUrl?: string; error?: string }> {
  try {
    const transport = await getTransporter();

    const htmlBody = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1e40af, #4f46e5); padding: 24px 32px;">
          <h1 style="color: white; margin: 0; font-size: 20px;">🏢 FMSP Lintasarta</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 12px;">Facility Management Service Platform — Notification</p>
        </div>
        <div style="padding: 24px 32px; color: #374151;">
          <h2 style="font-size: 16px; margin: 0 0 12px; color: #111827;">${options.subject}</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">${options.message}</p>
          ${options.documentLink ? `
            <div style="margin-top: 20px;">
              <a href="${APP_BASE_URL}${options.documentLink}" 
                 style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 600;">
                📄 Lihat Detail Dokumen
              </a>
            </div>
          ` : ''}
        </div>
        <div style="padding: 16px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 11px; color: #9ca3af;">
            Email ini dikirim otomatis oleh FMSP Lintasarta. Jangan membalas email ini.<br/>
            © 2026 PT Aplikanusa Lintasarta — Facility Management Division
          </p>
        </div>
      </div>
    `;

    const info = await transport.sendMail({
      from: `"FMSP Lintasarta" <${SMTP_USER || 'fmsp-alert@lintasarta.co.id'}>`,
      to: options.to,
      subject: options.subject,
      text: options.message,
      html: htmlBody,
    });

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
