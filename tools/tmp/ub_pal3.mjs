import fs from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import { cargarROM, u32, u16, offsetDe } from '../lib/gba_map_assets.mjs';
const data = cargarROM('/tmp/roms/Pokemon unbound gba.gba');
const bgr = (v) => { const r=(v&0x1f)<<3, g=((v>>5)&0x1f)<<3, b=((v>>10)&0x1f)<<3; return [r|(r>>5), g|(g>>5), b|(b>>5)]; };
const o = offsetDe(u32(data, 0x8b2734 + 4));
const ancho = u16(data, o + 8), alto = u16(data, o + 10);
const base = offsetDe(u32(data, offsetDe(u32(data, o + 0x1c))));
const tw = ancho >> 3;
const idx = (x, y) => { const ti = Math.floor(y/8)*tw + Math.floor(x/8), ox = x & 7, oy = y & 7; const b = data[base + ti*32 + oy*4 + (ox >> 1)] ?? 0; return (ox & 1) === 0 ? b & 0xf : b >> 4; };
const pi = offsetDe(u32(data, o + 0x20));
const variantes = [];
// a) 16 colores stride 2
variantes.push(['16 col stride2', (c) => bgr(u16(data, pi + c*2))]);
// b) 8 colores pares
variantes.push(['8 pares (c&7)', (c) => bgr(u16(data, pi + (c & 7)*4))]);
// c) 8 impares
variantes.push(['8 impares (c&7)', (c) => bgr(u16(data, pi + 2 + (c & 7)*4))]);
// d) 16 colores stride 4 (contiguos)
variantes.push(['16 col stride4', (c) => bgr(u16(data, pi + c*4))]);
// e) stride 4, banco alto
variantes.push(['16 col stride4+64', (c) => bgr(u16(data, pi + 64 + c*4))]);
// f) los pares como 16 colores duplicados
variantes.push(['pares+impares (16)', (c) => bgr(u16(data, pi + (c & 7)*4))]);
// g) paleta del struct +2 en stride 4
variantes.push(['16 col stride4 desde -2', (c) => bgr(u16(data, pi - 2 + c*4))]);
const esc = 4, W = ancho*esc, H = alto*esc;
const canvas = createCanvas(variantes.length*(W+8)+8, H+28); const ctx = canvas.getContext('2d');
ctx.fillStyle = '#1a1a22'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#fff'; ctx.font='11px sans-serif';
variantes.forEach(([n, color], i) => {
  const px = new Uint8ClampedArray(ancho*alto*4);
  for (let y=0;y<alto;y++) for (let x=0;x<ancho;x++) { const c = idx(x,y); if(!c) continue; const [r,g,b]=color(c); const q=(y*ancho+x)*4; px[q]=r;px[q+1]=g;px[q+2]=b;px[q+3]=255; }
  const c1 = createCanvas(ancho, alto); const cx = c1.getContext('2d'); const im = cx.createImageData(ancho, alto); im.data.set(px); cx.putImageData(im,0,0);
  ctx.imageSmoothingEnabled = false; ctx.drawImage(c1, 8+i*(W+8), 20, W, H); ctx.fillText(n, 8+i*(W+8), 13);
});
fs.writeFileSync('/tmp/ub_pal3.png', canvas.toBuffer('image/png'));
console.log('ok · paleta en 0x'+pi.toString(16));
