import { spawn, execSync } from 'node:child_process';

const cleanEnv = {};
for (const [k, v] of Object.entries(process.env)) {
  if (k.startsWith('ANTIGRAVITY')) continue;
  let safe = true;
  for (let i = 0; i < v.length; i++) {
    if (v.charCodeAt(i) > 255) {
      safe = false;
      break;
    }
  }
  if (safe) cleanEnv[k] = v;
}
cleanEnv.VERCEL_TELEMETRY_DISABLED = '1';

// Check if logged in
let isLoggedIn = false;
try {
  const who = execSync('npx.cmd vercel whoami', { env: cleanEnv, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  if (who.trim().length > 0 && !who.includes('Error')) {
    isLoggedIn = true;
  }
} catch {
  isLoggedIn = false;
}

if (!isLoggedIn) {
  console.log('Vercel-ге кіру басталды...');
  const loginChild = spawn('cmd.exe', ['/c', 'npx', 'vercel', 'login'], {
    env: cleanEnv,
    stdio: 'inherit',
  });
  loginChild.on('exit', (code) => {
    if (code === 0) {
      console.log('Жүйеге кірді! Енді жобаны орналастырамыз...');
      deploy();
    } else {
      console.log('Кіру тоқтатылды.');
      process.exit(code ?? 1);
    }
  });
} else {
  deploy();
}

function deploy() {
  console.log('Forma жобасы Vercel-ге орналастырылуда...');
  const child = spawn('cmd.exe', ['/c', 'npx', 'vercel', 'dist', '--prod', '--yes'], {
    env: cleanEnv,
    stdio: 'inherit',
  });
  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}
