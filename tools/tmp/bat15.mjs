import { cargarROM, u32, u16, offsetDe, esPtr } from '../lib/gba_map_assets.mjs';
import { renderSpriteIndizado } from '../lib/gba_pokemon_assets.mjs';
import { lz77, bgr555aRGB } from '../forense/gba.mjs';
/** Planitud: proporción de píxeles opacos cuyos vecinos comparten color. */
function planitud(px, ancho) {
  let opacos=0, lisos=0;
  for (let y=0;y<ancho;y++) for (let x=0;x<ancho;x++) {
    const i=(y*ancho+x)*4; if(!px[i+3]) continue; opacos++;
    for (const [dx,dy] of [[1,0],[0,1]]) {
      const j=((y+dy)*ancho+(x+dx))*4;
      if (px[j+3] && px[j]===px[i] && px[j+1]===px[i+1] && px[j+2]===px[i+2]) lisos++;
    }
  }
  return opacos ? lisos/(opacos*2) : 0;
}
const ESP = [1,2,3,4,5,6,7,8,9,25,26,150,151,152,155,158];
function evaluar(data, sp, pal, delta) {
  let suma=0, n=0;
  for (const id of ESP) {
    const k = id - 1 + delta;
    if (k < 0) continue;
    const pp = u32(data, pal + k*8); if (!esPtr(pp, data.length)) continue;
    const img = u32(data, sp + k*8), size = u16(data, sp + k*8 + 4);
    if (!esPtr(img, data.length)) continue;
    const r = lz77(data, offsetDe(img)); if (!r) continue;
    const colores=[]; for (let c=0;c<16;c++) colores.push(bgr555aRGB(u16(data, offsetDe(pp)+c*2)));
    const lado = Math.round(Math.sqrt(size*2));
    const b = renderSpriteIndizado(r.datos, lado, lado, colores);
    suma += planitud(b.px, lado); n++;
  }
  return n ? suma/n : 0;
}
for (const [n, ruta, tablasSp,,] of [['glazed','/tmp/roms/GlazedESPB6.gba',[0x3028b8]],[['unbound','/tmp/roms/Pokemon unbound gba.gba'][0]||'unbound','/tmp/roms/Pokemon unbound gba.gba',[0x19de42c,0x1a1d5b4]],['lc','/tmp/roms/LiquidCrystalESP.gba',[0x2350ac]],[['lp','/tmp/roms/LightPlatinumEsp.gba'][0]||'lp','/tmp/roms/LightPlatinumEsp.gba',[0x1e8354]],['tfoh','/tmp/roms/Pokémon TFOH-Beta3.gba',[0x722104]]]) {
  const data = cargarROM(ruta);
  // candidatas: las tablas emerald {ptr,tag} + tablas planas de paletas
  const pals = [];
  for (let off = 0x100; off + 80*8 < data.length; off += 4) {
    let ok = 0;
    for (let i=0;i<80;i++){ const p=u32(data,off+i*8), tag=u16(data,off+i*8+4), pad=u16(data,off+i*8+6); if(!esPtr(p,data.length)||pad!==0||tag<1000||tag>40000) break; ok++; }
    if (ok>=80) { pals.push(off); off += ok*8-4; }
  }
  const filas=[];
  for (const sp of tablasSp) for (const pal of pals) for (const delta of [-1,0,1]) filas.push({ sp, pal, delta, nota: evaluar(data, sp, pal, delta) });
  filas.sort((a,b)=>b.nota-a.nota);
  const m = filas[0];
  console.log(n.padEnd(8), 'mejor: sp 0x'+m.sp.toString(16), 'pal 0x'+m.pal.toString(16), 'delta', m.delta, 'planitud', m.nota.toFixed(3), '· 2º pal 0x'+filas[1].pal.toString(16), filas[1].nota.toFixed(3));
}
