// Минималды TTF cmap оқығыш — қазақ әріптерінің шрифтте бар-жоғын тексереді.
const fs = require('fs');
const path = require('path');

const KZ = {
  'Ә': 0x04d8, 'ә': 0x04d9,
  'Ғ': 0x0492, 'ғ': 0x0493,
  'Қ': 0x049a, 'қ': 0x049b,
  'Ң': 0x04a2, 'ң': 0x04a3,
  'Ө': 0x04e8, 'ө': 0x04e9,
  'Ұ': 0x04b0, 'ұ': 0x04b1,
  'Ү': 0x04ae, 'ү': 0x04af,
  'Һ': 0x04ba, 'һ': 0x04bb,
  'І': 0x0406, 'і': 0x0456,
  '₸': 0x20b8, // теңге белгісі
};

function readCmap(file) {
  const b = fs.readFileSync(file);
  const numTables = b.readUInt16BE(4);
  let cmapOff = null;
  for (let i = 0; i < numTables; i++) {
    const o = 12 + i * 16;
    if (b.toString('ascii', o, o + 4) === 'cmap') cmapOff = b.readUInt32BE(o + 8);
  }
  if (cmapOff == null) return null;

  const n = b.readUInt16BE(cmapOff + 2);
  const subtables = [];
  for (let i = 0; i < n; i++) {
    const rec = cmapOff + 4 + i * 8;
    subtables.push({
      platform: b.readUInt16BE(rec),
      encoding: b.readUInt16BE(rec + 2),
      offset: cmapOff + b.readUInt32BE(rec + 4),
    });
  }

  const codes = new Set();
  for (const st of subtables) {
    const format = b.readUInt16BE(st.offset);
    if (format === 4) {
      const segX2 = b.readUInt16BE(st.offset + 6);
      const seg = segX2 / 2;
      const endO = st.offset + 14;
      const startO = endO + segX2 + 2;
      const deltaO = startO + segX2;
      const rangeO = deltaO + segX2;
      for (let s = 0; s < seg; s++) {
        const end = b.readUInt16BE(endO + s * 2);
        const start = b.readUInt16BE(startO + s * 2);
        if (start === 0xffff) continue;
        const rangeOffset = b.readUInt16BE(rangeO + s * 2);
        for (let c = start; c <= end && c !== 0xffff; c++) {
          let g;
          if (rangeOffset === 0) {
            g = (c + b.readInt16BE(deltaO + s * 2)) & 0xffff;
          } else {
            const gi = rangeO + s * 2 + rangeOffset + (c - start) * 2;
            if (gi + 1 >= b.length) continue;
            g = b.readUInt16BE(gi);
            if (g !== 0) g = (g + b.readInt16BE(deltaO + s * 2)) & 0xffff;
          }
          if (g !== 0) codes.add(c);
        }
      }
    } else if (format === 12) {
      const nGroups = b.readUInt32BE(st.offset + 12);
      for (let g = 0; g < nGroups; g++) {
        const o = st.offset + 16 + g * 12;
        const start = b.readUInt32BE(o);
        const end = b.readUInt32BE(o + 4);
        const gid = b.readUInt32BE(o + 8);
        if (gid === 0) continue;
        for (let c = start; c <= end; c++) codes.add(c);
      }
    }
  }
  return codes;
}

const targets = process.argv.slice(2);
let anyMissing = false;

for (const dir of targets) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.ttf'));
  for (const f of files) {
    const codes = readCmap(path.join(dir, f));
    if (!codes) { console.log(`${f}: cmap ОҚЫЛМАДЫ`); continue; }
    const missing = Object.entries(KZ).filter(([, cp]) => !codes.has(cp)).map(([ch]) => ch);
    if (missing.length) {
      anyMissing = true;
      console.log(`✗ ${f}  —  ЖОҚ: ${missing.join(' ')}`);
    } else {
      console.log(`✓ ${f}  —  барлық қазақ әрпі + ₸ бар`);
    }
  }
}

console.log(anyMissing ? '\nНАЗАР АУДАРЫҢЫЗ: кемістік бар.' : '\nБәрі дұрыс.');
