import { cargarROM, u32, u16, esPtr, offsetDe } from '../lib/gba_map_assets.mjs';
import { lz77 } from '../forense/gba.mjs';
const TAM = new Set([512, 1024, 2048, 4096, 8192, 320, 640, 1280, 2560]);
function cazar(ruta, umbral = 100) {
  const data = cargarROM(ruta); const len = data.length;
  const out = [];
  for (let off = 0; off + umbral * 8 < len; off += 4) {
    let ok = 0;
    for (let i = 0; i < umbral; i++) {
      const img = u32(data, off + i * 8), size = u16(data, off + i * 8 + 4);
      if (!esPtr(img, len) || data[offsetDe(img)] !== 0x10) break;
      if (!TAM.has(size)) break;
      const r = lz77(data, offsetDe(img)); if (!r) break;
      ok++;
    }
    if (ok >= umbral) {
      let n = ok;
      while (off + n * 8 + 8 < len) {
        const img = u32(data, off + n * 8), size = u16(data, off + n * 8 + 4);
        if (!esPtr(img, len) || data[offsetDe(img)] !== 0x10 || !TAM.has(size)) break;
        if (!lz77(data, offsetDe(img))) break;
        n++;
      }
      out.push({ off, n });
      off += n * 8 - 4;
    }
  }
  return out;
}
for (const [n, r] of [['glazed','/tmp/roms/GlazedESPB6.gba'],['lp','/tmp/roms/LightPlatinumEsp.gba'],['lc','/tmp/roms/LiquidCrystalESP.gba'],['tfoh','/tmp/roms/Pokémon TFOH-Beta3.gba'],['unbound','/tmp/roms/Pokemon unbound gba.gba']]) {
  const t = cazar(r);
  console.log(n.padEnd(8), '· tablas {img,size}:', t.length, t.slice(0,4).map(x=>`0x${x.off.toString(16)}(${x.n})`).join(' '));
}
