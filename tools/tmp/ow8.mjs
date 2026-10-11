import fs from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import { cargarROM, u32, u16, esPtr, offsetDe } from '../lib/gba_map_assets.mjs';
import { bgr555aRGB } from '../forense/gba.mjs';
const TABLAS = { glazed: ['/tmp/roms/GlazedESPB6.gba', 0x505620], lp: ['/tmp/roms/LightPlatinumEsp.gba', 0x36dc58], lc: ['/tmp/roms/LiquidCrystalESP.gba', 0x39fdb0], tfoh: ['/tmp/roms/Pokémon TFOH-Beta3.gba', 0x7d2524], unbound: ['/tmp/roms/Pokemon unbound gba.gba', 0x8b2734] };
const ESC=3;
let fila = 0;
const ids = [0,1,2,3,4,5,6,7,8,9,10,11];
const canvas = createCanvas(ids.length*16*ESC, Object.keys(TABLAS).length*32*ESC);
const ctx = canvas.getContext('2d');
for (const [nombre, [ruta, tablaOff]] of Object.entries(TABLAS)) {
  const data = cargarROM(ruta);
  for (const id of ids) {
    const p = u32(data, tablaOff + id * 4);
    const o = offsetDe(p);
    const arr = offsetDe(u32(data, o + 0x1c));
    const size = u16(data, o + 6);
    const w = u16(data, o + 8), h = u16(data, o + 10);
    const imgPtr = u32(data, arr);           // frame 0
    const palPtr = offsetDe(u32(data, o + 0x20));
    const img = offsetDe(imgPtr);
    const colores = []; for (let c = 0; c < 16; c++) colores.push(bgr555aRGB(u16(data, palPtr + c * 2)));
    const c = createCanvas(w, h); const cc = c.getContext('2d'); const im = cc.createImageData(w, h);
    const tw = w >> 3;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ti = Math.floor(y / 8) * tw + Math.floor(x / 8), ox = x & 7, oy = y & 7;
      const b = data[img + ti * 32 + oy * 4 + (ox >> 1)] ?? 0;
      const idx = (ox & 1) === 0 ? b & 0xf : b >> 4;
      const q = (y * w + x) * 4; const [r, g, bl] = colores[idx];
      im.data[q] = r; im.data[q + 1] = g; im.data[q + 2] = bl; im.data[q + 3] = idx ? 255 : 0;
    }
    cc.putImageData(im, 0, 0);
    const gx = id * 16 * ESC, gy = fila * 32 * ESC;
    ctx.fillStyle = '#e8e8e8'; ctx.fillRect(gx, gy, 16 * ESC, 32 * ESC);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(c, gx, gy, w * ESC, h * ESC);
  }
  ctx.fillStyle = '#000'; ctx.font = '11px sans-serif'; ctx.fillText(nombre, 2, fila * 32 * ESC + 12);
  fila++;
}
fs.writeFileSync('/tmp/ow_tablas.png', canvas.toBuffer('image/png'));
console.log('escrito · filas:', Object.keys(TABLAS).join(', '), '· ids', ids.join(','));
