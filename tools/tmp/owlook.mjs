import fs from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import { cargarROM, buscarTablaOverworld, bytesEn } from '../lib/gba_map_assets.mjs';
import { bgr555aRGB } from '../forense/gba.mjs';
const casos = [['glazed','/tmp/roms/GlazedESPB6.gba',[0,1,2,3,4,5,6,8,9,10,13,27,46,134,173,213,217,221,225,227,255]],['unbound','/tmp/roms/Pokemon unbound gba.gba',[0,1,2,3,4,5,8,11,13,19,24,31,35,46,151,183,231,255]]];
const ESC=3, W=24, H=24, cols=11;
const filas = casos.length*2;
const canvas=createCanvas(cols*W*ESC, filas*H*ESC); const ctx=canvas.getContext('2d');
let fila=0;
for (const [nombre, ruta, ids] of casos) {
  const data = cargarROM(ruta);
  const t = buscarTablaOverworld(data, { minEntradas: 100 });
  for (const [etiqueta, lista] of [[nombre+' ids', ids]]) {
    lista.forEach((id, k) => {
      const e = t.entradas[id]; if (!e) return;
      const img = bytesEn(data, e.img), pal = bytesEn(data, e.pal);
      if (!img) return;
      const colores=[]; for (let c=0;c<16;c++) colores.push(bgr555aRGB(pal[c*2]|(pal[c*2+1]<<8)));
      const c=createCanvas(W,H); const cc=c.getContext('2d'); const im=cc.createImageData(W,H);
      const tw=W>>3;
      for (let y=0;y<H;y++) for (let x=0;x<W;x++){
        const ti=Math.floor(y/8)*tw+Math.floor(x/8), ox=x&7, oy=y&7;
        const b=img[ti*32+oy*4+(ox>>1)] ?? 0; const idx=(ox&1)===0?b&0xf:b>>4;
        const p=(y*W+x)*4; const [r,g,bl]=colores[idx]; im.data[p]=r;im.data[p+1]=g;im.data[p+2]=bl;im.data[p+3]=idx?255:0;
      }
      cc.putImageData(im,0,0);
      const gx=(k%cols)*W*ESC, gy=(fila+Math.floor(k/cols))*H*ESC;
      ctx.fillStyle='#ddd'; ctx.fillRect(gx,gy,W*ESC,H*ESC);
      ctx.imageSmoothingEnabled=false; ctx.drawImage(c,gx,gy,W*ESC,H*ESC);
      ctx.fillStyle='#000'; ctx.font='9px sans-serif'; ctx.fillText(String(id),gx+2,gy+9);
    });
    fila += Math.ceil(lista.length/cols);
  }
}
fs.writeFileSync('/tmp/ow_ids.png', canvas.toBuffer('image/png'));
console.log('escrito');
