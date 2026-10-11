import { cargarROM, u32, u16, esPtr, offsetDe } from '../lib/gba_map_assets.mjs';
import { lz77 } from '../forense/gba.mjs';

/** Candidatos a tabla de gráficos de overworld: structs con (a) puntero a array
 *  de punteros, (b) puntero a paletas, (c) tamaño declarado == tamaño LZ77. */
function cazar(ruta, umbral = 24) {
  const data = cargarROM(ruta); const len = data.length;
  const cand = [];
  for (let off = 0; off + umbral * 4 < len; off += 4) {
    let ok = 0; const tallas = new Map();
    for (let i = 0; i < umbral; i++) {
      const p = u32(data, off + i * 4);
      if (!esPtr(p, len)) break;
      const o = offsetDe(p);
      // busca en campos 0..0x28 un par (array de punteros a blobs, paletas)
      let bien = false;
      for (let f = 0x0c; f <= 0x24; f += 4) {
        const arr = u32(data, o + f);
        if (!esPtr(arr, len)) continue;
        const a0 = u32(data, offsetDe(arr));
        if (!esPtr(a0, len) || data[offsetDe(a0)] !== 0x10) continue;
        const r = lz77(data, offsetDe(a0));
        if (!r) continue;
        tallas.set(r.tam, (tallas.get(r.tam) ?? 0) + 1);
        bien = true; break;
      }
      if (!bien) break;
      ok++;
    }
    if (ok >= umbral) {
      cand.push({ off, ok, tallas: [...tallas.entries()].sort((a,b)=>b[1]-a[1]).slice(0,4) });
      off += ok * 4 - 4;
    }
  }
  return cand;
}
for (const [nombre, ruta] of [['glazed','/tmp/roms/GlazedESPB6.gba'],['unbound','/tmp/roms/Pokemon unbound gba.gba']]) {
  const r = cazar(ruta);
  console.log(nombre, '· candidatos:', r.length);
  for (const c of r.slice(0, 8)) console.log('   0x' + c.off.toString(16), 'entradas', c.ok, '· tamaños', c.tallas.map(([t, n]) => t + 'B×' + n).join(' '));
}
