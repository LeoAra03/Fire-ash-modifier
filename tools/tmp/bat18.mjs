import fs from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import { cargarROM, u32, u16, offsetDe, esPtr } from '../lib/gba_map_assets.mjs';
import { renderSpriteIndizado } from '../lib/gba_pokemon_assets.mjs';
import { lz77, bgr555aRGB } from '../forense/gba.mjs';
function evaluar(px, ancho) {
  let op=0, lisos=0; const usados=new Map();
  for (let y=0;y<ancho;y++) for (let x=0;x<ancho;x++) {
    const i=(y*ancho+x)*4; if(!px[i+3]) continue; op++;
    const clave = px[i]+','+px[i+1]+','+px[i+2];
    usados.set(clave, (usados.get(clave) ?? 0) + 1);
    for (const [dx,dy] of [[1,0],[0,1]]) { const j=((y+dy)*ancho+(x+dx))*4;
      if (px[j+3]&&px[j]===px[i]&&px[j+1]===px[i+1]&&px[j+2]===px[i+2]) lisos++; }
  }
  if (!op) return -1;
  const plan = lisos/(op*2);
  const variedad = Math.min(usados.size, 12) / 12;       // castiga paletas de 1-2 tonos
  const dominante = Math.max(...usados.values()) / op;    // castiga un único color
  return plan * (0.45 + 0.55 * variedad) * (1 - 0.6 * Math.max(0, dominante - 0.45));
}
function poolPaletas(data) { const vistos=new Set(), out=[]; for(let off=0x100;off+80*8<data.length;off+=4){let ok=0; for(let i=0;i<80;i++){const p=u32(data,off+i*8),tag=u16(data,off+i*8+4),pad=u16(data,off+i*8+6); if(!esPtr(p,data.length)||pad!==0||tag<1000||tag>40000)break; ok++;} if(ok>=80){for(let i=0;i<ok;i++){const p=offsetDe(u32(data,off+i*8)); if(!vistos.has(p)){vistos.add(p);out.push(p);}} off+=ok*8-4;}} 
  // además, cualquier bloque de 32 bytes con 16 colores válidos y 0 en el índice 0
  for (let o=0x100;o+32<data.length;o+=2){ if ((u16(data,o)&0x7fff)!==0) continue; const s=new Set(); let ok=true; for(let c=0;c<16;c++){const v=u16(data,o+c*2); if(v&0x8000){ok=false;break;} s.add(v&0x7fff);} if(ok&&s.size>=6){ if(!vistos.has(o)){vistos.add(o);out.push(o);} } }
  return out; }
const CASOS=[['glazed','/tmp/roms/GlazedESPB6.gba',0x3028b8],['unbound','/tmp/roms/Pokemon unbound gba.gba',0x1a1d5b4],['lc','/tmp/roms/LiquidCrystalESP.gba',0x2350ac],['lp','/tmp/roms/LightPlatinumEsp.gba',0x1e8354],['tfoh','/tmp/roms/Pokémon TFOH-Beta3.gba',0x722104]];
for (const [n,ruta,sp] of CASOS) {
  const data=cargarROM(ruta); const pool=poolPaletas(data);
  const res=[];
  for (const id of [1,4,7,25]) {
    const img=u32(data, sp+(id-1)*8), size=u16(data, sp+(id-1)*8+4);
    const r=lz77(data,offsetDe(img)); const lado=Math.round(Math.sqrt(size*2));
    let mejor=null;
    for(const p of pool){ const colores=[]; for(let c=0;c<16;c++) colores.push(bgr555aRGB(u16(data,p+c*2))); const b=renderSpriteIndizado(r.datos,lado,lado,colores); const nota=evaluar(b.px,lado); if(!mejor||nota>mejor.nota) mejor={p,nota,colores}; }
    res.push({id, ...mejor});
  }
  console.log(n.padEnd(8), 'paletas', pool.length, res.map(x=>`${x.id}:0x${x.p.toString(16)}(${x.nota.toFixed(2)})`).join(' '));
  // guardar colores de Bulbasaur para inspección
  const b = res[0]; console.log('         Bulbasaur colores:', b.colores.map(c=>'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('')).join(' '));
}
