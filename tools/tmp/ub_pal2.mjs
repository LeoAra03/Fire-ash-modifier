import fs from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import { cargarROM, u32, u16, offsetDe } from '../lib/gba_map_assets.mjs';
const data = cargarROM('/tmp/roms/Pokemon unbound gba.gba');
const bgr = (v) => { const r=(v&0x1f)<<3, g=((v>>5)&0x1f)<<3, b=((v>>10)&0x1f)<<3; return [r|(r>>5), g|(g>>5), b|(b>>5)]; };
const tabla = 0x8b2734;
const o = offsetDe(u32(data, tabla + 4));
const ancho = u16(data, o + 8), alto = u16(data, o + 10);
const base = offsetDe(u32(data, offsetDe(u32(data, o + 0x1c))));
const tw = ancho >> 3;
const indice = (x, y) => { const ti = Math.floor(y/8)*tw + Math.floor(x/8), ox = x & 7, oy = y & 7; const b = data[base + ti*32 + oy*4 + (ox >> 1)] ?? 0; return (ox & 1) === 0 ? b & 0xf : b >> 4; };
function render(pi, stride, bank) {
  const px = new Uint8ClampedArray(ancho*alto*4);
  const colores = []; for (let c = 0; c < 16; c++) colores.push(bgr(u16(data, pi + (c + bank*16)*stride)));
  for (let y = 0; y < alto; y++) for (let x = 0; x < ancho; x++) {
    const idx = indice(x, y); if (!idx) continue; const [r,g,b] = colores[idx];
    const q = (y*ancho + x)*4; px[q]=r; px[q+1]=g; px[q+2]=b; px[q+3]=255;
  }
  return px;
}
const pi0 = offsetDe(u32(data, o + 0x20));
const variantes = [
  ['stride2 base', pi0, 2, 0],
  ['stride2 +2', pi0+2, 2, 0],
  ['stride2 +32 (bank)', pi0, 2, 0],
  ['stride4', pi0, 4, 0],
  ['stride4 +32b', pi0, 4, 1],
  ['stride2 ptr+0x24', offsetDe(u32(data, o+0x24)), 2, 0],
  ['stride2 ptr+0x28', offsetDe(u32(data, o+0x28)), 2, 0],
  ['stride2 ptr+0x2c', offsetDe(u32(data, o+0x2c)), 2, 0],
];
console.log('struct fields:', Array.from({length: 12}, (_,i)=>i*4+':'+'0x'+u32(data,o+i*4).toString(16)).join(' '));
const esc = 4, celda = ancho*esc;
const canvas = createCanvas(variantes.length*(celda+8)+8, alto*esc+30); const ctx = canvas.getContext('2d');
ctx.fillStyle = '#1a1a22'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#fff'; ctx.font='11px sans-serif';
variantes.forEach(([n, pi, stride, bank], i) => {
  if (!pi) return;
  const px = render(pi, stride, bank);
  const c = createCanvas(ancho, alto); const cx = c.getContext('2d'); const im = cx.createImageData(ancho, alto); im.data.set(px); cx.putImageData(im, 0, 0);
  ctx.imageSmoothingEnabled = false; ctx.drawImage(c, 8+i*(celda+8), 18, celda, alto*esc);
  ctx.fillText(n, 8+i*(celda+8), 12);
});
fs.writeFileSync('/tmp/ub_pal2.png', canvas.toBuffer('image/png'));
console.log('escrito');
