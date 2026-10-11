import { cargarROM, u32, u16, esPtr, offsetDe } from '../lib/gba_map_assets.mjs';
import { lz77 } from '../forense/gba.mjs';

/** Puntúa arrays de punteros buscando una tabla de "graphics info" de overworld
 *  (estructura cuyos campos +a y +b son punteros a arrays de punteros a blobs LZ77). */
function cazar(ruta, minEntradas = 120) {
  const data = cargarROM(ruta); const len = data.length;
  const mejores = [];
  for (let off = 0; off + minEntradas * 4 < len; off += 4) {
    let base = 0;
    for (let i = 0; i < minEntradas; i++) { if (!esPtr(u32(data, off + i * 4), len)) break; base++; }
    if (base < minEntradas) continue;
    for (let a = 0; a + 8 <= 0x28; a += 4) {
      for (let b = a + 4; b + 4 <= 0x2c; b += 4) {
        let ok = 0;
        for (let i = 0; i < 80; i++) {
          const o = offsetDe(u32(data, off + i * 4));
          const pa = u32(data, o + a), pb = u32(data, o + b);
          if (!esPtr(pa, len) || !esPtr(pb, len)) break;
          const ia = u32(data, offsetDe(pa)), ip = u32(data, offsetDe(pb));
          if (!esPtr(ia, len) || !esPtr(ip, len)) break;
          if (data[offsetDe(ia)] !== 0x10) break;
          ok++;
        }
        if (ok >= 80) mejores.push({ off, a, b, ok });
      }
    }
    off += base * 4 - 4;
  }
  return mejores.sort((x, y) => y.ok - x.ok).slice(0, 6);
}

for (const [nombre, ruta] of [['glazed','/tmp/roms/GlazedESPB6.gba'],['lp','/tmp/roms/LightPlatinumEsp.gba'],['lc','/tmp/roms/LiquidCrystalESP.gba'],['tfoh','/tmp/roms/Pokémon TFOH-Beta3.gba'],['unbound','/tmp/roms/Pokemon unbound gba.gba']]) {
  const r = cazar(ruta);
  console.log(nombre.padEnd(8), r.length ? r.map(m => `tabla 0x${m.off.toString(16)} campos(+0x${m.a.toString(16)},+0x${m.b.toString(16)}) ok=${m.ok}`).join(' | ') : 'sin candidato');
}
