/**
 * `expo export -p web` шыққаннан кейінгі екі олқылықты жөндейді.
 *
 * ⚠ 1. Бос тақырып. Статикалық құрастыруда helmet әр бетке
 *    `<title data-rh="true"></title>` деген БОС тегті бірінші қояды.
 *    HTML стандарты бойынша браузер БІРІНШІ тақырыпты алады, сондықтан
 *    бізде `+html.tsx`-те «Forma» тұрса да, қойынды атаусыз көрінеді.
 *
 * ⚠ 2. /time мекенжайы. Экспортта әрі `time.html` файлы, әрі `time/`
 *    қалтасы бар (ішінде `[id].html`). Статикалық сервер қалтаны
 *    көреді де, /time-ті /time/ деп бұрып жібереді — ол жерде
 *    index жоқ, 404 шығады. Сондықтан көшірмесін қоямыз.
 *
 * Қолдану: npm run build:web
 */
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
if (!fs.existsSync(dist)) {
  console.error('dist/ жоқ — алдымен `npx expo export -p web` жүргізіңіз');
  process.exit(1);
}

/** Барлық .html файлдан бос helmet тақырыбын алып тастау */
let cleaned = 0;
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!e.name.endsWith('.html')) continue;
    const src = fs.readFileSync(p, 'utf8');
    const out = src.replace(/<title data-rh="true"><\/title>/g, '');
    if (out !== src) { fs.writeFileSync(p, out); cleaned++; }
  }
};
walk(dist);

/** Қалтамен атаулас беттерге index.html көшірмесін қою */
let copied = 0;
for (const e of fs.readdirSync(dist, { withFileTypes: true })) {
  if (!e.isDirectory()) continue;
  const twin = path.join(dist, `${e.name}.html`);
  const target = path.join(dist, e.name, 'index.html');
  if (fs.existsSync(twin) && !fs.existsSync(target)) {
    fs.copyFileSync(twin, target);
    copied++;
  }
}

console.log(`тақырып тазаланды: ${cleaned} бет, index көшірмесі: ${copied}`);
