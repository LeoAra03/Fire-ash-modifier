import fs from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import { cargarROM, buscarTablaOverworld, bytesEn } from '../lib/gba_map_assets.mjs';
import { bgr555aRGB } from '../forense/gba.mjs';
const data = cargarROM('/tmp/roms/GlazedESPB6.gba');
const t = buscarTablaOverworld(data, { minEntradas: 100 });
// ids usados por los NPC del plan
const plan = JSON.parse(fs.readFileSync('content/rom_campaigns_complete.json','utf8'));
const usados = new Set();
for (const m of plan.campaigns[0].maps) for (const n of (m.npcs ?? [])) usados.add(n.sourceSprite);
const ids = [...usados].sort((a,b)=>a-b).slice(0, 40);
console.log('ids de sprite usados por los NPC de Glazed:', ids.join(','));
const ESC=3, W=24, H=24, cols=20;
const canvas=createCanvas(cols*W*ESC, Math.ceil(ids.length/cols)*H*ESC);
const ctx=canvas.getContext('2d');
ids.forEach((id, k) => {
  const e = t.entradas[id]; if (!e) return;
  const img = bytesEn(data, e.img), pal = bytesEn(data, e.pal);
  if (!img) return;
  const colores=[]; for (let c=0;c<16;c++) colores.push(bgr555aRGB(pal[c*2]|(pal[c*2+1]<<8)));
  const c=createCanvas(W,H); const cc=c.getContext('2d'); const im=cc.createImageData(W,H);
  const tw = W>>3;
  for (let y=0;y<H;y++) for (let x=0;x<W;x++){
    const ti=Math.floor(y/8)*tw+Math.floor(x/8), ox=x&7, oy=y&7;
    const b=img[ti*32+oy*4+(ox>>1)] ?? 0;
    const idx=(ox&1)===0?b&0xf:b>>4;
    const p=(y*W+x)*4; const [r,g,bl]=colores[idx]; im.data[p]=r;im.data[p+1]=g;im.data[p+2]=bl;im.data[p+3]=idx?255:0;
  }
  cc.putImageData(im,0,0);
  ctx.imageSmoothingEnabled=false;
  const gx=(k%cols)*W*ESC, gy=Math.floor(k/cols)*H*ESC;
  ctx.fillStyle='#eee'; ctx.fillRect(gx,gy,W*ESC,H*ESC);
  ctx.drawImage(c,gx,gy,W*ESC,H*ESC);
  ctx.fillStyle='#000'; ctx.font='9px sans-serif'; ctx.fillText(String(id), gx+2, gy+10);
});
fs.writeFileSync('/tmp/ids_npc.png', canvas.toBuffer('image/png'));
console.log('escrito ·', ids.length, 'ids');
