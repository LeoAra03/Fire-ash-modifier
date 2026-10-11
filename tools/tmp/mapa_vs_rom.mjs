import fs from 'node:fs';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { marshalLoad } from '../../web/js/marshal.js';
const CASOS=[['glazed',3000],['light_platinum',3120],['liquid_crystal',3200],['tfoh',3700],['unbound',4000]];
const catDe=(s)=>JSON.parse(fs.readFileSync(`reference/roms_invitados_extraidos/${s}/catalogo.json`,'utf8'));
const celdasDe=(mapId)=>{ const m=marshalLoad(fs.readFileSync(`pokemon_fire_ash/Data/Map${String(mapId).padStart(3,'0')}.rxdata`));
  const w=m.getIvar('@width'), h=m.getIvar('@height'), b=m.getIvar('@data').bytes, dv=new DataView(b.buffer,b.byteOffset,b.byteLength);
  const d=new Uint16Array(w*h*3); for(let i=0;i<d.length;i++) d[i]=dv.getUint16(20+i*2,true); return {w,h,d,ts:m.getIvar('@tileset_id')}; };
const img=(p)=>{ const b=fs.readFileSync(p); return loadImage(b); };
const filas=[];
for (const [slug,mapId] of CASOS) {
  const cat=catDe(slug); const info=cat.mapas.find(x=>x.mapa==='Map'+mapId);
  const {w,h,d,ts:tilesetId}=celdasDe(mapId);
  const ts=fs.readFileSync('pokemon_fire_ash/Data/Tilesets.rxdata'); const T=marshalLoad(ts);
  const nombre=(T.find((t)=>t&&t.getIvar('@id')===tilesetId)?.getIvar('@tileset_name'))?.text;
  const atlas=await img(`pokemon_fire_ash/Graphics/Tilesets/${nombre}.png`);
  const c=createCanvas(w*32,h*32); const cx=c.getContext('2d'); cx.imageSmoothingEnabled=false; cx.fillStyle='#000'; cx.fillRect(0,0,c.width,c.height);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){ const id=d[x+y*w]; if(id<384) continue; const k=id-384; cx.drawImage(atlas,(k%8)*32,Math.floor(k/8)*32,32,32,x*32,y*32,32,32); }
  let rom; try { rom=await img(`/tmp/extra/${slug}/mapas/Map${mapId}.png`); } catch { rom=null; }
  let pct='(sin PNG de referencia)';
  if (rom) { const a=cx.getImageData(0,0,c.width,c.height).data; const c2=createCanvas(rom.width,rom.height); const cx2=c2.getContext('2d'); cx2.drawImage(rom,0,0); const b=cx2.getImageData(0,0,rom.width,rom.height).data;
    let eq=0,tot=Math.min(a.length,b.length); for(let i=0;i<tot;i+=4) if(a[i]===b[i]&&a[i+1]===b[i+1]&&a[i+2]===b[i+2]) eq++; pct=(eq/(tot/4)*100).toFixed(1)+'%'; }
  filas.push({slug,mapId,w,h,pct,render:c,rom,w_rom:rom?.width,h_rom:rom?.height,nombre});
}
const esc=1.0; const M=200;
const canvas=createCanvas(1600, 5*(M+10)+20); const ctx=canvas.getContext('2d'); ctx.fillStyle='#15151c'; ctx.fillRect(0,0,canvas.width,canvas.height);
filas.forEach((f,i)=>{
  const y=10+i*(M+10);
  ctx.fillStyle='#fff'; ctx.font='13px sans-serif'; ctx.fillText(`${f.slug} Map${f.mapId} · ${f.w}x${f.h} · ${f.pct} idéntico`, 10, y+14);
  ctx.drawImage(f.render, 10, y+22, ...ajustar(f.render, 320, M-30));
  if (f.rom) ctx.drawImage(f.rom, 350, y+22, ...ajustar(f.rom, 320, M-30));
});
function ajustar(im, maxW, maxH){ const e=Math.min(maxW/im.width, maxH/im.height); return [im.width*e, im.height*e]; }
fs.writeFileSync('/tmp/mapas_vs_rom.png', canvas.toBuffer('image/png'));
console.log(filas.map(f=>`${f.slug} ${f.mapId}: ${f.pct}`).join('\n'));
