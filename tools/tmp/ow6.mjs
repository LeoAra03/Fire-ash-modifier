import { cargarROM, u32, u16, esPtr, offsetDe } from '../lib/gba_map_assets.mjs';

const TALLAS = new Set([288, 512, 576, 768, 1024, 1152, 2048, 2304, 4608]);
const CAMPOS = [[0x1c, 0x20], [0x24, 0x28], [0x20, 0x24], [0x18, 0x1c], [0x28, 0x2c]];

function cazar(ruta, umbral = 60) {
  const data = cargarROM(ruta); const len = data.length;
  const cand = [];
  for (let off = 0; off + umbral * 4 < len; off += 4) {
    for (const [fImg, fPal] of CAMPOS) {
      let ok = 0;
      for (let i = 0; i < umbral; i++) {
        const p = u32(data, off + i * 4);
        if (!esPtr(p, len)) break;
        const o = offsetDe(p);
        const size = u16(data, o + 6);
        if (!TALLAS.has(size)) break;
        const arrImages = u32(data, o + fImg), pPal = u32(data, o + fPal);
        if (!esPtr(arrImages, len) || !esPtr(pPal, len)) break;
        const img0 = u32(data, offsetDe(arrImages));
        if (!esPtr(img0, len)) break;
        ok++;
      }
      if (ok >= umbral) {
        let n = ok;
        while (off + n * 4 + 4 < len) {
          const p = u32(data, off + n * 4);
          if (!esPtr(p, len)) break;
          const o = offsetDe(p);
          if (!TALLAS.has(u16(data, o + 6))) break;
          if (!esPtr(u32(data, o + fImg), len) || !esPtr(u32(data, o + fPal), len)) break;
          n++;
        }
        cand.push({ off, n, fImg, fPal });
        off += n * 4 - 4;
      }
    }
  }
  return cand.sort((a, b) => b.n - a.n);
}
for (const [nombre, ruta] of [['glazed','/tmp/roms/GlazedESPB6.gba'],['lp','/tmp/roms/LightPlatinumEsp.gba'],['lc','/tmp/roms/LiquidCrystalESP.gba'],['tfoh','/tmp/roms/Pokémon TFOH-Beta3.gba'],['unbound','/tmp/roms/Pokemon unbound gba.gba']]) {
  const c = cazar(ruta);
  console.log(nombre.padEnd(8), c.length ? c.slice(0, 3).map(x => `0x${x.off.toString(16)} n=${x.n} campos(0x${x.fImg.toString(16)},0x${x.fPal.toString(16)})`).join(' | ') : 'sin candidato');
}
