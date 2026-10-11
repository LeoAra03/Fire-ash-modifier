import fs from 'node:fs';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { marshalLoad } from '../../web/js/marshal.js';

const [mapId, slug, tsNombre, refPng, extraido] = process.argv.slice(2);
const m = marshalLoad(fs.readFileSync(`pokemon_fire_ash/Data/Map${String(mapId).padStart(3,'0')}.rxdata`));
const ancho = m.getIvar('@width'), alto = m.getIvar('@height');
const dat = m.getIvar('@data').bytes; const dv = new DataView(dat.buffer, dat.byteOffset, dat.byteLength);
const total = ancho*alto; const celda = (x,y) => dv.getUint16(20 + (x + y*ancho)*2, true);
const load = async (p) => { const im = await loadImage(fs.readFileSync(p)); const c = createCanvas(im.width, im.height); const cx=c.getContext('2d'); cx.drawImage(im,0,0); return { im: c, datos: cx.getImageData(0,0,im.width,im.height).data }; };
const atlas = await load(`pokemon_fire_ash/Graphics/Tilesets/${tsNombre}.png`);
const out = createCanvas(ancho*32, alto*32); const ctx = out.getContext('2d');
ctx.imageSmoothingEnabled = false; ctx.fillStyle='#000'; ctx.fillRect(0,0,out.width,out.height);
let negros = 0;
for (let y=0;y<alto;y++) for (let x=0;x<ancho;x++) {
  const id = celda(x,y); if (id < 384) { negros++; continue; }
  const idx = id - 384, sx = (idx % 8)*32, sy = Math.floor(idx/8)*32;
  ctx.drawImage(atlas.im, sx, sy, 32, 32, x*32, y*32, 32, 32);
}
const a = ctx.getImageData(0,0,out.width,out.height).data;
const b = extraido ? await load(extraido) : await load(refPng);
if (b.im.width !== out.width || b.im.height !== out.height) console.log(`DIMENSIONES: render ${out.width}x${out.height} vs ROM ${b.im.width}x${b.im.height}`);
let iguales=0, totalPx=0, distintosBloque=0;
for (let i=0;i<a.length;i+=4) { totalPx++; const eq = a[i]===b.datos[i] && a[i+1]===b.datos[i+1] && a[i+2]===b.datos[i+2]; if(eq) iguales++; }
console.log(`${slug} Map${mapId}: ${(iguales/totalPx*100).toFixed(1)}% de píxeles idénticos al render del ROM (${ancho}x${alto}, ${negros} celdas vacías)`);
