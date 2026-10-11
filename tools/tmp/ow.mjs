import fs from 'node:fs';
import { cargarROM, u32, u16, esPtr, offsetDe } from '../lib/gba_map_assets.mjs';
import { lz77 } from '../forense/gba.mjs';

for (const [nombre, ruta] of [['glazed','/tmp/roms/GlazedESPB6.gba'],['unbound','/tmp/roms/Pokemon unbound gba.gba']]) {
  const data = cargarROM(ruta);
  const len = data.length;
  // struct ObjectEventGraphicsInfo (pokeemerald): size@6, w@8, h@10, anims@0x18, images@0x1C, palettes@0x20
  const hits = [];
  for (let off = 0; off + 0x24 < len; off += 4) {
    const size = u16(data, off + 6);
    const w = u16(data, off + 8), h = u16(data, off + 10);
    if (w !== 16 || h !== 32) continue;
    if (size < 64 || size > 4096) continue;
    const anims = u32(data, off + 0x18), images = u32(data, off + 0x1C), palettes = u32(data, off + 0x20);
    if (!esPtr(anims, len) || !esPtr(images, len) || !esPtr(palettes, len)) continue;
    const img0 = u32(data, offsetDe(images));
    if (!esPtr(img0, len) || data[offsetDe(img0)] !== 0x10) continue;
    const pal0 = u32(data, offsetDe(palettes) + 4);
    if (!esPtr(pal0, len)) continue;
    const r = lz77(data, offsetDe(img0));
    hits.push({ off, size, bytes: r ? r.tam : -1 });
  }
  console.log(nombre, '· structs 16×32:', hits.length, '· tamaños de blob:', [...new Set(hits.map(h=>h.bytes))].slice(0,6).join(','), '· offsets primeros:', hits.slice(0,5).map(h=>'0x'+h.off.toString(16)).join(' '));
}
