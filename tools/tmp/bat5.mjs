import fs from 'node:fs';
import zlib from 'node:zlib';
import { createCanvas } from '@napi-rs/canvas';
import { cargarROM } from '../lib/gba_map_assets.mjs';
import { buscarTablasSprites, buscarTablasPaletas, puntuarTabla, battlerDe, pngRGBA } from '../lib/gba_pokemon_assets.mjs';
const GRIS = Array.from({length:16}, (_,i)=>[i*17,i*17,i*17]);
const data = cargarROM('/tmp/roms/GlazedESPB6.gba');
const sp = buscarTablasSprites(data, { umbral: 100 }).map(t=>({...t, ...puntuarTabla(data, t, GRIS)})).sort((a,b)=>a.ruido-b.ruido);
const palTablas = buscarTablasPaletas(data, { umbral: 100 });
const tablaSprites = sp[0].off;
const ids = [1,4,7,25];
const ESC=2, W=64;
const canvas = createCanvas(palTablas.length*ids.length*W*ESC, W*ESC); const ctx=canvas.getContext('2d');
let x=0;
for (const pt of palTablas.slice(0,6)) {
  for (const id of ids) {
    const b = battlerDe(data, tablaSprites, pt.off, id);
    if (!b) { x+=W*ESC; continue; }
    const c=createCanvas(W,W); const cc=c.getContext('2d'); const im=cc.createImageData(W,W); im.data.set(b.px); cc.putImageData(im,0,0);
    ctx.imageSmoothingEnabled=false; ctx.drawImage(c,x,0,W*ESC,W*ESC);
    x+=W*ESC;
  }
  ctx.fillStyle='#000'; ctx.font='10px sans-serif'; ctx.fillText('0x'+pt.off.toString(16), x-ids.length*W*ESC+2, 12);
}
fs.writeFileSync('/tmp/bat_pal.png', canvas.toBuffer('image/png'));
console.log('tabla sprites 0x'+tablaSprites.toString(16), '· tablas de paleta', palTablas.length);
