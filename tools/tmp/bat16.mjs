import fs from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import { cargarROM, u32, u16, offsetDe, esPtr } from '../lib/gba_map_assets.mjs';
import { renderSpriteIndizado } from '../lib/gba_pokemon_assets.mjs';
import { lz77, bgr555aRGB } from '../forense/gba.mjs';

function planitud(px, ancho) {
  let opacos=0, lisos=0;
  for (let y=0;y<ancho;y++) for (let x=0;x<ancho;x++) {
    const i=(y*ancho+x)*4; if(!px[i+3]) continue; opacos++;
    for (const [dx,dy] of [[1,0],[0,1]]) { const j=((y+dy)*ancho+(x+dx))*4;
      if (px[j+3]&&px[j]===px[i]&&px[j+1]===px[i+1]&&px[j+2]===px[i+2]) lisos++; }
  }
  return opacos ? lisos/(opacos*2) : 0;
}
/** Grupo de paletas: tablas {ptr,tag} + blobs sueltos de 16 colores válidos. */
function poolPaletas(data) {
  const vistos = new Set(); const out = [];
  for (let off = 0x100; off + 80 * 8 < data.length; off += 4) {
    let ok = 0;
    for (let i = 0; i < 80; i++) { const p=u32(data,off+i*8), tag=u16(data,off+i*8+4), pad=u16(data,off+i*8+6); if(!esPtr(p,data.length)||pad!==0||tag<1000||tag>40000) break; ok++; }
    if (ok >= 80) { for (let i = 0; i < ok; i++) { const p = offsetDe(u32(data, off + i * 8)); if (!vistos.has(p)) { vistos.add(p); out.push(p); } } off += ok*8-4; }
  }
  return out;
}
const ESP = 16;
for (const [n, ruta, sp] of [['glazed','/tmp/roms/GlazedESPB6.gba',0x3028b8],['unbound','/tmp/roms/Pokemon unbound gba.gba',0x1a1d5b4],['lc','/tmp/roms/LiquidCrystalESP.gba',0x2350ac],['lp','/tmp/roms/LightPlatinumEsp.gba',0x1e8354],['tfoh','/tmp/roms/Pokémon TFOH-Beta3.gba',0x722104]]) {
  const data = cargarROM(ruta);
  const pool = poolPaletas(data);
  const elegidas = new Map();
  let suma = 0;
  for (let id = 1; id <= ESP; id++) {
    const img = u32(data, sp + (id-1)*8), size = u16(data, sp + (id-1)*8 + 4);
    if (!esPtr(img, data.length)) continue;
    const r = lz77(data, offsetDe(img)); if (!r) continue;
    const lado = Math.round(Math.sqrt(size*2));
    let mejor = null;
    for (const p of pool) {
      const colores=[]; for (let c=0;c<16;c++) colores.push(bgr555aRGB(u16(data, p + c*2)));
      const b = renderSpriteIndizado(r.datos, lado, lado, colores);
      const nota = planitud(b.px, lado);
      if (!mejor || nota > mejor.nota) mejor = { p, nota, b, colores };
    }
    elegidas.set(id, mejor);
    suma += mejor.nota;
  }
  console.log(n.padEnd(8), '· paletas en el grupo:', pool.length, '· planitud media:', (suma/ESP).toFixed(3), '· distintas usadas:', new Set([...elegidas.values()].map(e=>e.p)).size);
  console.log('         y (planitud por especie 1..16):', [...elegidas.values()].map(e=>e.nota.toFixed(2)).join(' '));
}
