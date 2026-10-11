import { cargarROM, u32, esPtr, offsetDe } from '../lib/gba_map_assets.mjs';
import { lz77 } from '../forense/gba.mjs';
function tablasPlanas(ruta, minEntradas = 60) {
  const data = cargarROM(ruta); const len = data.length;
  const out = [];
  for (let off = 0; off + minEntradas * 8 < len; off += 4) {
    let ok = 0; const tallas = new Map();
    for (let i = 0; i < minEntradas; i++) {
      const img = u32(data, off + i * 8), pal = u32(data, off + i * 8 + 4);
      if (!esPtr(img, len) || !esPtr(pal, len) || data[offsetDe(img)] !== 0x10) break;
      const r = lz77(data, offsetDe(img)); if (!r) break;
      tallas.set(r.tam, (tallas.get(r.tam) ?? 0) + 1);
      ok++;
    }
    if (ok >= minEntradas) {
      let n = ok;
      while (off + n * 8 + 8 < len) {
        const img = u32(data, off + n * 8), pal = u32(data, off + n * 8 + 4);
        if (!esPtr(img, len) || !esPtr(pal, len) || data[offsetDe(img)] !== 0x10) break;
        const r = lz77(data, offsetDe(img)); if (!r) break;
        tallas.set(r.tam, (tallas.get(r.tam) ?? 0) + 1);
        n++;
      }
      out.push({ off, n, tallas: [...tallas.entries()].sort((a, b) => b[1] - a[1]) });
      off += n * 8 - 4;
    }
  }
  return out;
}
for (const [nombre, ruta] of [['glazed','/tmp/roms/GlazedESPB6.gba'],['lp','/tmp/roms/LightPlatinumEsp.gba'],['lc','/tmp/roms/LiquidCrystalESP.gba'],['tfoh','/tmp/roms/Pokémon TFOH-Beta3.gba'],['unbound','/tmp/roms/Pokemon unbound gba.gba']]) {
  const t = tablasPlanas(ruta);
  console.log(nombre.padEnd(8), '· tablas planas:', t.length, '·', t.map(x => `0x${x.off.toString(16)}(${x.n}) ${x.tallas.slice(0,3).map(([s,c])=>s+'B×'+c).join(',')}`).join(' | ').slice(0, 300));
}
