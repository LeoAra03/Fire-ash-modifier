import fs from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import { cargarROM, buscarMapLayouts, leerBloques, parTilesets, renderMetatile, u32, offsetDe, metatileDe } from '../lib/gba_map_assets.mjs';
const plan = JSON.parse(fs.readFileSync('content/rom_campaigns_complete.json','utf8'));
const data = cargarROM('/tmp/roms/GlazedESPB6.gba');
const layouts = buscarMapLayouts(data).reduce((m,l)=>(m.set(l.off,l),m), new Map());
const m = plan.campaigns[0].maps[0];
const lay = layouts.get(offsetDe(u32(data, parseInt(m.source.header,16))));
const par = parTilesets(data, lay);
const bloques = leerBloques(data, lay);
const reglas = {
  A: (id) => { const {tileset, indice} = metatileDe(par, id); return (tileset.attrs[indice] & 0x3f) !== 0; },
  B: (id) => { const {tileset, indice} = metatileDe(par, id); const a = tileset.attrs[indice]; return (a & 0x0fff) !== 0 && a !== 0xffff ? false : (a & 0x0fff) !== 0; },
  C: (id) => { const {tileset, indice} = metatileDe(par, id); const a = tileset.attrs[indice]; return a === 0xffff; },
  D: (id) => { const {tileset, indice} = metatileDe(par, id); const a = tileset.attrs[indice]; return a !== 0 && a !== 0x1000; },
};
const ESC=2;
const canvas=createCanvas((lay.width*32+8)*4*ESC/2, lay.height*32*ESC/2+8);
const ctx=canvas.getContext('2d');
const base=createCanvas(lay.width*32, lay.height*32); const bctx=base.getContext('2d');
for (let y=0;y<lay.height;y++) for (let x=0;x<lay.width;x++){ const px=renderMetatile(par, bloques[y*lay.width+x]); const im=bctx.createImageData(32,32); im.data.set(px); bctx.putImageData(im,x*32,y*32); }
let ox=4;
for (const [nombre, f] of Object.entries(reglas)) {
  const c=createCanvas(lay.width*32, lay.height*32); const cc=c.getContext('2d');
  cc.drawImage(base,0,0);
  let bloqueadas=0;
  cc.fillStyle='rgba(255,0,0,0.55)';
  for (let y=0;y<lay.height;y++) for (let x=0;x<lay.width;x++){ if (f(bloques[y*lay.width+x] & 0x3ff)) { cc.fillRect(x*32,y*32,32,32); bloqueadas++; } }
  ctx.drawImage(c, ox, 4, lay.width*32*ESC/2, lay.height*32*ESC/2);
  ctx.fillStyle='#000'; ctx.font='12px sans-serif';
  ctx.fillText(`${nombre}: ${bloqueadas}/${lay.width*lay.height}`, ox+2, 16);
  ox += lay.width*32*ESC/2 + 8;
}
fs.writeFileSync('/tmp/reglas.png', canvas.toBuffer('image/png'));
console.log('escrito · reglas A(0x3f) B(0xfff) C(0xffff) D(≠0 y ≠0x1000)');
