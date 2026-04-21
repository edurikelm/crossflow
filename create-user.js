import https from 'node:https';

const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vaGNvandwbGdtbWVmam1peWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc3Mjc3NCwiZXhwIjoyMDkyMzQ4Nzc0fQ.UbmtSLlH_yYi0f6PiB49D6Kzg_wc4HRW835-SvP-fxg';

const email = 'admin@crossfit.com';
const password = 'Admin123!';

const data = JSON.stringify({
  email: email,
  password: password,
  email_confirm: true,
  user_metadata: { full_name: 'Administrador' }
});

const options = {
  hostname: 'oohcojwplgmmefjmiyle.supabase.co',
  port: 443,
  path: '/auth/v1/admin/users',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${serviceRoleKey}`,
    'apikey': serviceRoleKey
  }
};

console.log('Creating user:', email);

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();