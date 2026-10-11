import fs from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import { cargarROM } from '../lib/gba_map_assets.mjs';
import { battlerDe } from '../lib/gba_pokemon_assets.mjs';
const ELEGIDAS = {
  glazed:  ['/tmp/roms/GlazedESPB6.gba', 0x301418, 0x58d150],
  lp:      ['/tmp/roms/LightPlatinumEsp.gba', 0x1e8354, 0x3d07ac],
  lc:      ['/tmp/roms/LiquidCrystalESP.gba', 0x2350ac, 0x3d428c],
  tfoh:    ['/tmp/roms/Pokémon TFOH-Beta3.gba', 0x722104, 0x45f89c],
  unbound: ['/tmp/roms/Pokemon unbound gba.gba', 0x19de42c, 0x3d428c],
};
const ids = [1,4,7,25,6,9,3,150];
const ESC = 2, W = 64;
const canvas = createCanvas(ids.length*W*ESC, Object.keys(ELEGIDAS).length*W*ESC);
const ctx = canvas.getContext('2d');
let f = 0;
for (const [n, [ruta, tSp, tPal]] of Object.entries(ELEGIDAS)) {
  const data = cargarROM(ruta);
  ids.forEach((id, k) => {
    const b = battlerDe(data, tSp, tPal, id);
    if (!b) return;
    const c = createCanvas(W,W); const cc = c.getContext('2d'); const im = cc.createImageData(W,W); im.data.set(b.px); cc.putImageData(im,0,0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(c, k*W*ESC, f*W*ESC, W*ESC, W*ESC);
  });
  ctx.fillStyle = '#fff'; ctx.font = '11px sans-serif'; ctx.fillText(n, 4, f*W*ESC+13);
  f++;
}
fs.writeFileSync('/tmp/bat_final.png', canvas.toBuffer('image/png'));
console.log('escrito · filas:', Object.keys(ELEGIDAS).join(', '), '· ids:', ids.join(','));
