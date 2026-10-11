import fs from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import { cargarROM } from '../lib/gba_map_assets.mjs';
import { battlerDe } from '../lib/gba_pokemon_assets.mjs';
const CASOS = [
  ['glazed','/tmp/roms/GlazedESPB6.gba',0x3028b8,0x58d150,-1],
  ['unbound','/tmp/roms/Pokemon unbound gba.gba',0x1a1d5b4,0x960dd0,-2],
  ['lc','/tmp/roms/LiquidCrystalESP.gba',0x2350ac,0x3d428c,0],
  ['lp','/tmp/roms/LightPlatinumEsp.gba',0x1e8354,0x3d07ac,1],
  ['tfoh','/tmp/roms/Pokémon TFOH-Beta3.gba',0x722104,0x45f89c,0],
];
const ids = [1,2,3,4,5,6,7,8,9,25,26,150,151,152,155,158];
const ESC = 1.6, W = 64;
const canvas = createCanvas(ids.length*W*ESC, CASOS.length*W*ESC);
const ctx = canvas.getContext('2d');
ctx.fillStyle='#2a2a35'; ctx.fillRect(0,0,canvas.width,canvas.height);
CASOS.forEach(([n, ruta, sp, pal, k], f) => {
  const data = cargarROM(ruta);
  ids.forEach((id, idx) => {
    const b = battlerDe(data, sp, pal + k*4, id);
    if (!b) return;
    const c=createCanvas(W,W); const cc=c.getContext('2d'); const im=cc.createImageData(W,W); im.data.set(b.px); cc.putImageData(im,0,0);
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(c, idx*W*ESC, f*W*ESC, W*ESC, W*ESC);
  });
  ctx.fillStyle='#ffd'; ctx.font='12px sans-serif'; ctx.fillText(n, 4, f*W*ESC+12);
});
fs.writeFileSync('/tmp/bat_sheet.png', canvas.toBuffer('image/png'));
console.log('escrito · ids 1-9,25,26,150,151,152,155,158 · filas', CASOS.map(c=>c[0]).join(','));
