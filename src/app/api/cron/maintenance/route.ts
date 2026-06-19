import { NextRequest, NextResponse } from 'next/server';
import { validateCronAuth } from '@/lib/cron-auth';
import { runMaintenanceJob } from '@/lib/cron-scheduler';

// GET /api/cron/maintenance
// Cek jadwal maintenance overdue dan kirim reminder
export async function GET(req: NextRequest) {
  // SECURITY: Timing-safe cron secret validation (header only, no query param)
  const authError = validateCronAuth(req);
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const now = new Date();

  try {
    const results = await runMaintenanceJob();

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      ...results,
    });
  } catch (error: any) {
    console.error('[CRON MAINTENANCE API ERROR]', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
