export async function register() {
  // Only initialize scheduler in Node.js server runtime, not Edge runtime or client
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🏁 [INSTRUMENTATION] Booting Next.js server, loading background cron scheduler...');
    try {
      const { startCronJobs } = await import('./lib/cron-scheduler');
      startCronJobs();
    } catch (err: any) {
      console.error('❌ [INSTRUMENTATION] Failed to start background cron scheduler:', err.message);
    }
  }
}
