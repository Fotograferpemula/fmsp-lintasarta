import { NextRequest, NextResponse } from 'next/server';
import { validateCronAuth } from '@/lib/cron-auth';
import { runReminderJob } from '@/lib/cron-scheduler';
import { handleApiError } from '@/lib/api-error';

// GET /api/cron/reminder
// Dijalankan harian pukul 08:00 WIB via Fly.io scheduled machine atau external cron
export async function GET(req: NextRequest) {
  // SECURITY: Timing-safe cron secret validation (header only, no query param)
  const authError = validateCronAuth(req);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const now = new Date();

  try {
    const results = await runReminderJob();

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      ...results,
    });
  } catch (error: any) {
    console.error('[CRON REMINDER API ERROR]', error.message);
    return handleApiError(error, 'API');
  }
}
