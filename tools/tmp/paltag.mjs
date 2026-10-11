import { cargarROM, u32, u16, esPtr, offsetDe } from '../lib/gba_map_assets.mjs';
/** Tablas stride-8 { ptr, tag(u16), pad } con tag pequeño y poco diverso. */
function cazar(ruta, umbral = 80) {
  const data = cargarROM(ruta); const len = data.length;
  const out = [];
  for (let off = 0; off + umbral * 8 < len; off += 4) {
    const tags = [];
    let ok = 0;
    for (let i = 0; i < umbral; i++) {
      const p = u32(data, off + i * 8), tag = u16(data, off + i * 8 + 4), pad = u16(data, off + i * 8 + 6);
      if (!esPtr(p, len)) break;
      if (tag < 1000 || tag > 40000) break;
      if (pad !== 0) break;
      const o = offsetDe(p);
      if (o + 32 > len) break;
      tags.push(tag); ok++;
    }
    if (ok >= umbral) {
      const unicos = new Set(tags).size;
      out.push({ off, n: ok, unicos, primero: tags[0], ultimo: tags[tags.length - 1] });
      off += ok * 8 - 4;
    }
  }
  return out;
}
for (const [n, r] of [['glazed','/tmp/roms/GlazedESPB6.gba'],['lp','/tmp/roms/LightPlatinumEsp.gba'],['lc','/tmp/roms/LiquidCrystalESP.gba'],['tfoh','/tmp/roms/Pokémon TFOH-Beta3.gba'],['unbound','/tmp/roms/Pokemon unbound gba.gba']]) {
  const t = cazar(r);
  console.log(n.padEnd(8), '· tablas {ptr,tag}:', t.length, t.slice(0,5).map(x=>`0x${x.off.toString(16)}(${x.n},tags ${x.primero}..${x.ultimo},${x.unicos}u)`).join(' '));
}
