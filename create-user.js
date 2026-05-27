import https from 'node:https';

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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