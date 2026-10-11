import fs from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import { cargarROM, u32, u16, offsetDe, esPtr } from '../lib/gba_map_assets.mjs';
const data = cargarROM('/tmp/roms/Pokemon unbound gba.gba');
const bgr = (v) => { const r=(v&0x1f)<<3, g=((v>>5)&0x1f)<<3, b=((v>>10)&0x1f)<<3; return [r|(r>>5), g|(g>>5), b|(b>>5)]; };
function planitud(px, w, h) { let op=0, l=0; const cols=new Set(); for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4; if(!px[i+3])continue; op++; cols.add(px[i]+','+px[i+1]+','+px[i+2]); for(const[dx,dy]of[[1,0],[0,1]]){const j=((y+dy)*w+(x+dx))*4; if(px[j+3]&&px[j]===px[i]&&px[j+1]===px[i+1]&&px[j+2]===px[i+2])l++;}} return {pl: op?l/(op*2):0, colores: cols.size, op}; }
// sprite gfxId 1 de la tabla 0x8b2734
const tabla = 0x8b2734;
const p = u32(data, tabla + 1*4), o = offsetDe(p);
const size=u16(data,o+6), ancho=u16(data,o+8), alto=u16(data,o+10);
const arr=u32(data,o+0x1c), tam=u16(data,offsetDe(arr)+4)||size;
const imgPtr=u32(data,offsetDe(arr));
console.log('struct: size',size,'ancho',ancho,'alto',alto,'frames?','tam del primer frame',tam,'ptrPal', '0x'+u32(data,o+0x20).toString(16));
function render(pi) {
  const base=offsetDe(imgPtr), tw=ancho>>3, px=new Uint8ClampedArray(ancho*alto*4);
  const colores=[]; for(let c=0;c<16;c++) colores.push(bgr(u16(data,pi+c*2)));
  for(let y=0;y<alto;y++)for(let x=0;x<ancho;x++){ const ti=Math.floor(y/8)*tw+Math.floor(x/8), ox=x&7, oy=y&7;
    const b=data[base+ti*32+oy*4+(ox>>1)]??0, idx=(ox&1)===0?b&0xf:b>>4; if(!idx)continue;
    const [r,g,bl]=colores[idx]; const q=(y*ancho+x)*4; px[q]=r;px[q+1]=g;px[q+2]=bl;px[q+3]=255; }
  return px;
}
const cand=[];
cand.push({p:offsetDe(u32(data,o+0x20)), via:'struct +0x20'});
for (const t of [0x960b50,0x960dd0,0x961050,0x9612d0]) {
  for (let i=0;i<200;i++){ const q=u32(data,t+i*8); if(!esPtr(q,data.length)) break; cand.push({p:offsetDe(q), via:'tabla 0x'+t.toString(16)}); }
}
cand.push({p:0, via:'fondo'});
let mejor=null;
for (const c of cand) { const px=render(c.p); const m=planitud(px,ancho,alto); if(!mejor||m.pl>mejor.m.pl) mejor={...c,m,px}; }
console.log('candidatas', cand.length, '· mejor:', mejor.via, 'planitud', mejor.m.pl.toFixed(3), 'colores', mejor.m.colores);
// lámina: struct +0x20 vs mejor
const W=ancho, H=alto, esc=4;
const canvas=createCanvas(2*W*esc+40, H*esc+30); const ctx=canvas.getContext('2d'); ctx.fillStyle='#1a1a22'; ctx.fillRect(0,0,canvas.width,canvas.height);
ctx.fillStyle='#fff'; ctx.font='12px sans-serif';
const a=render(offsetDe(u32(data,o+0x20))); ctx.fillText('struct +0x20', 6, 14);
for (let f=0; f<2; f++) {
  const px = f===0? a : mejor.px;
  const c1=createCanvas(ancho,alto); const cx1=c1.getContext('2d'); const im=cx1.createImageData(ancho,alto); im.data.set(px); cx1.putImageData(im,0,0);
  ctx.imageSmoothingEnabled=false; ctx.drawImage(c1, 6+f*(W*esc+20), 20, W*esc, H*esc);
}
ctx.fillText('mejor ('+mejor.via+')', 6+W*esc+20, 14);
fs.writeFileSync('/tmp/ub_pal.png', canvas.toBuffer('image/png'));
