import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

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
const patchPath = path.resolve('scripts/patch-hostname.cjs').replace(/\\/g, '/');
cleanEnv.NODE_OPTIONS = `--require "${patchPath}"`;

checkLoginAndDeploy();

function checkLoginAndDeploy() {
  let loggedIn = false;
  try {
    const who = execSync('npx.cmd vercel whoami', { env: cleanEnv, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    if (who.trim().length > 0 && !who.includes('Error') && !who.includes('Logged out')) {
      loggedIn = true;
    }
  } catch {
    loggedIn = false;
  }

  if (!loggedIn) {
    console.log('Vercel сессиясы аяқталған. Кіру басталуда...');
    const loginChild = spawn('cmd.exe', ['/c', 'npx', 'vercel', 'login'], {
      env: cleanEnv,
      stdio: 'inherit',
    });
    loginChild.on('exit', (code) => {
      if (code === 0) {
        console.log('Жүйеге сәтті кірді! Жоба орналастырылуда...');
        deploy();
      } else {
        console.log('Vercel-ге кіру тоқтатылды (код ' + code + ').');
        process.exit(code ?? 1);
      }
    });
  } else {
    deploy();
  }
}

function deploy() {
  console.log('Forma жобасы Vercel-ге орналастырылуда...');
  const out = path.resolve('.vercel/output');
  fs.mkdirSync(path.join(out, 'static'), { recursive: true });
  fs.cpSync(path.resolve('dist'), path.join(out, 'static'), { recursive: true });
  fs.writeFileSync(
    path.join(out, 'config.json'),
    JSON.stringify(
      {
        version: 3,
        routes: [{ handle: 'filesystem' }, { src: '/(.*)', dest: '/index.html' }],
      },
      null,
      2,
    ),
  );

  const child = spawn(
    'cmd.exe',
    ['/c', 'npx', 'vercel', 'deploy', '--prebuilt', '--prod', '--yes'],
    {
      env: cleanEnv,
      stdio: 'inherit',
    },
  );
  child.on('exit', (code) => {
    if (code === 0) {
      console.log('Доменді forma-app-kz.vercel.app етіп баптау...');
      try {
        execSync(
          'npx.cmd vercel alias set forma-app-kz.vercel.app',
          { env: cleanEnv, stdio: 'inherit' },
        );
      } catch {}
      console.log('Сәтті аяқталды!');
    }
    process.exit(code ?? 0);
  });
}
