import fs from 'node:fs';
import { cargarROM, u32, u16, esPtr, offsetDe, bytesEn } from '/home/user/Fire-ash-modifier/tools/lib/gba_map_assets.mjs';
import { lz77, bgr555aRGB } from '/home/user/Fire-ash-modifier/tools/forense/gba.mjs';

const data = cargarROM('/tmp/roms/GlazedESPB6.gba');
const len = data.length;
// censo de tablas planas (img,pal) y tamaño descomprimido de cada blob
const tablas = [];
for (let off = 0; off + 8 * 100 < len; off += 4) {
  if (data[off] !== 0 && offsetDe(u32(data, off)) > len) continue;
  let ok = 0;
  const tamanos = new Map();
  for (let i = 0; i < 100; i++) {
    const img = u32(data, off + i * 8), pal = u32(data, off + i * 8 + 4);
    if (!esPtr(img, len) || !esPtr(pal, len) || data[offsetDe(img)] !== 0x10) break;
    const r = lz77(data, offsetDe(img));
    if (!r) break;
    tamanos.set(r.tam, (tamanos.get(r.tam) ?? 0) + 1);
    ok++;
  }
  if (ok >= 100) {
    // extender hasta que falle
    let n = 100;
    while (off + n * 8 + 8 < len) {
      const img = u32(data, off + n * 8);
      if (!esPtr(img, len) || data[offsetDe(img)] !== 0x10) break;
      n++;
    }
    const top = [...tamanos.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
    tablas.push({ off, n, top });
    off += n * 8;
  }
}
console.log('tablas planas (img,pal) encontradas:', tablas.length);
for (const t of tablas.slice(0, 8)) console.log('  0x' + t.off.toString(16), '· entradas', t.n, '· tamaños frecuentes:', t.top.map(([s, c]) => s + 'B×' + c).join(' '));
