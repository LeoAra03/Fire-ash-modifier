import fs from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import { cargarROM } from '../lib/gba_map_assets.mjs';
import { buscarTablasSprites, buscarTablasPaletas, battlerDe } from '../lib/gba_pokemon_assets.mjs';
const data = cargarROM('/tmp/roms/GlazedESPB6.gba');
const tablaSprites = 0x3028b8;
const palTablas = buscarTablasPaletas(data, { umbral: 100 });
const ids = [1, 4, 25];
const ESC=3, W=64;
const canvas = createCanvas(ids.length*W*ESC, palTablas.length*W*ESC/2);
const ctx = canvas.getContext('2d');
palTablas.forEach((pt, f) => {
  ids.forEach((id, k) => {
    const b = battlerDe(data, tablaSprites, pt.off, id);
    if (!b) return;
    const c=createCanvas(W,W); const cc=c.getContext('2d'); const im=cc.createImageData(W,W); im.data.set(b.px); cc.putImageData(im,0,0);
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(c, k*W*ESC, f*W*ESC/2, W*ESC/2, W*ESC/2);
  });
});
fs.writeFileSync('/tmp/bat_pal2.png', canvas.toBuffer('image/png'));
console.log('tablas de paleta probadas:', palTablas.length, '· filas en la imagen');
