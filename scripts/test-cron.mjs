async function test() {
  console.log('🔑 Logging in to get token...');
  const loginRes = await fetch('http://localhost:4101/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@lintasarta.co.id',
      password: 'Admin@2026'
    })
  }).then(r => r.json());

  if (!loginRes.success) {
    console.error('❌ Login failed:', loginRes);
    return;
  }

  const token = loginRes.data.token;
  console.log('✅ Token obtained:', token.slice(0, 20) + '...');

  console.log('🔄 Calling POST /api/notifications (Simulasi Cron)...');
  const cronRes = await fetch('http://localhost:4101/api/notifications', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const status = cronRes.status;
  const body = await cronRes.json();
  console.log(`📡 Response Status: ${status}`);
  console.log('📡 Response Body:', JSON.stringify(body, null, 2));
}

test().catch(console.error);
