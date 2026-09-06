const https = require('https');

async function check() {
  const url = 'https://forma-app-kz.vercel.app';
  console.log('Testing', url);
  const res = await fetch(url);
  console.log('Response status:', res.status, res.statusText);
  const html = await res.text();
  console.log('HTML length:', html.length);
  const matches = [...html.matchAll(/src="([^"]+)"/g)];
  for (const m of matches) {
    const jsUrl = new URL(m[1], url).href;
    const r = await fetch(jsUrl);
    console.log(jsUrl, r.status, (await r.text()).length);
  }
}

check().catch(console.error);
