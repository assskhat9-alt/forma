/**
 * Forma веб нұсқасын тестілеуге арналған жеңіл жергілікті сервер.
 * Ешқандай сыртқы тәуелділіксіз (Node.js стандартты кітапханалары).
 *
 * Қолдану: node scripts/serve.mjs [порт]
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const PORT = Number(process.env.PORT) || Number(process.argv[2]) || 3000;
const DIST = path.resolve('dist');

if (!fs.existsSync(DIST)) {
  console.error('dist/ табылмады. Алдымен `npm run build:web` орындаңыз.');
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const server = http.createServer((req, res) => {
  const rawUrl = req.url || '/';
  const cleanPath = decodeURIComponent(rawUrl.split('?')[0].split('#')[0]);

  let filePath = path.join(DIST, cleanPath);

  // 1. Егер тікелей файл бар болса
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return serveFile(res, filePath);
  }

  // 2. Егер қалта болса және ішінде index.html болса
  const dirIndex = path.join(filePath, 'index.html');
  if (fs.existsSync(dirIndex) && fs.statSync(dirIndex).isFile()) {
    return serveFile(res, dirIndex);
  }

  // 3. /goals -> goals.html
  const htmlTwin = `${filePath}.html`;
  if (fs.existsSync(htmlTwin) && fs.statSync(htmlTwin).isFile()) {
    return serveFile(res, htmlTwin);
  }

  // 4. Егер табылмаса — басты index.html (SPA routing)
  const rootIndex = path.join(DIST, 'index.html');
  if (fs.existsSync(rootIndex)) {
    return serveFile(res, rootIndex);
  }

  res.statusCode = 404;
  res.end('Not Found');
});

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME[ext] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': mimeType,
    'Access-Control-Allow-Origin': '*',
  });
  fs.createReadStream(filePath).pipe(res);
}

server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  console.log('───────────────────────────────────────────────────────');
  console.log(`  Forma тестілеу платформасы іске қосылды!`);
  console.log(`  • Компьютерде:  http://localhost:${PORT}`);
  console.log(`  • Телефонда:     http://${localIp}:${PORT} (бір Wi-Fi желісінде)`);
  console.log('───────────────────────────────────────────────────────');
});
