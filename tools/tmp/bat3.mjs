import fs from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import { cargarROM, u32, u16, esPtr, offsetDe } from '../lib/gba_map_assets.mjs';
import { lz77, bgr555aRGB } from '../forense/gba.mjs';
const CASOS = [['glazed','/tmp/roms/GlazedESPB6.gba',[0x301418,0x3028b8]],['unbound','/tmp/roms/Pokemon unbound gba.gba',[0x19de42c,0x1a1d5b4]],['tfoh','/tmp/roms/Pokémon TFOH-Beta3.gba',[0x11a0000,0x11a0eb0]]];
const ids = [1,2,3,4,5,6,7,8,9,25];
const ESC = 2, W = 64, H = 64;
const canvas = createCanvas(ids.length*W*ESC, CASOS.length*2*H*ESC/2); const ctx = canvas.getContext('2d');
let fila = 0;
for (const [nombre, ruta, tablas] of CASOS) {
  const data = cargarROM(ruta);
  for (const tabla of tablas) {
    // paleta: las tablas de Pokémon usan una tabla aparte; probamos la paleta global de batalla
    // buscando una paleta cerca: usamos la convención del ROM (gMonPaletteTable) — aquí intentamos
    // con la paleta que sigue a la tabla si es válida.
    const palCandidatas = [tabla + 8 * 440, tabla - 8 * 440, 0];
    for (const id of ids) {
      const img = u32(data, tabla + id * 8);
      if (!esPtr(img, data.length)) continue;
      const r = lz77(data, offsetDe(img)); if (!r) continue;
      // paleta: construimos una escala de grises desde los índices (prueba estructural)
      const c = createCanvas(W, H); const cc = c.getContext('2d'); const im = cc.createImageData(W, H);
      const tw = W >> 3;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const ti = Math.floor(y/8)*tw + Math.floor(x/8), ox = x&7, oy = y&7;
        const b = r.datos[ti*32 + oy*4 + (ox>>1)] ?? 0;
        const idx = (ox&1)===0 ? b&0xf : b>>4;
        const q = (y*W+x)*4; const g = idx*17;
        im.data[q]=g; im.data[q+1]=g; im.data[q+2]=g; im.data[q+3]=idx?255:0;
      }
      cc.putImageData(im,0,0);
      ctx.imageSmoothingEnabled=false;
      ctx.drawImage(c, ids.indexOf(id)*W*ESC, (fila*H*ESC)/1, W*ESC, H*ESC);
    }
    ctx.fillStyle='#000'; ctx.font='10px sans-serif';
    ctx.fillText(`${nombre} 0x${tabla.toString(16)}`, 2, fila*H*ESC+10);
    fila++;
  }
}
fs.writeFileSync('/tmp/bat_tablas.png', canvas.toBuffer('image/png'));
console.log('escrito · filas', fila);
