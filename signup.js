import https from 'node:https';

const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vaGNvandwbGdtbWVmam1peWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NzI3NzQsImV4cCI6MjA5MjM0ODc3NH0.XXViUgc0EatHFKHN8uA1l-hpiDQ7lMn0_1SaohRpgAY';

const email = 'admin@crossfit.com';
const password = 'Admin123!';

const data = JSON.stringify({
  email: email,
  password: password
});

const options = {
  hostname: 'oohcojwplgmmefjmiyle.supabase.co',
  port: 443,
  path: '/auth/v1/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': anonKey
  }
};

console.log('Signing up user:', email);

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