import { cargarROM, u32, u16, esPtr, offsetDe } from '../lib/gba_map_assets.mjs';
import { lz77 } from '../forense/gba.mjs';

/** Descubre structs de "gráfico de overworld" autoverificados: tamaño declarado == tamaño LZ77. */
function cazar(ruta) {
  const data = cargarROM(ruta); const len = data.length;
  const structs = [];
  for (let off = 0x100; off + 0x30 < len; off += 4) {
    const size = u16(data, off + 4);
    if (size !== 512 && size !== 1024 && size !== 2048) continue;
    const w = u16(data, off + 6), h = u16(data, off + 8);
    if ((w !== 16 && w !== 24 && w !== 32) || (h !== 16 && h !== 32)) continue;
    // busca en los campos siguientes un puntero a un array de frames {ptr,size} que cuadre
    for (let f = 0x0c; f <= 0x28; f += 4) {
      const arr = u32(data, off + f);
      if (!esPtr(arr, len)) continue;
      const o = offsetDe(arr);
      let frames = 0, cuadran = 0;
      for (let k = 0; k < 24; k++) {
        const p = u32(data, o + k * 8), sz = u16(data, o + k * 8 + 4);
        if (!esPtr(p, len)) break;
        frames++;
        if (data[offsetDe(p)] === 0x10) { const r = lz77(data, offsetDe(p)); if (r && r.tam === sz) cuadran++; }
        else if (sz === size) cuadran++;
      }
      if (frames >= 1 && cuadran === frames) {
        structs.push({ off, size, w, h, framesField: f, frames });
        break;
      }
    }
  }
  return structs;
}
for (const [nombre, ruta] of [['glazed','/tmp/roms/GlazedESPB6.gba'],['unbound','/tmp/roms/Pokemon unbound gba.gba'],['lc','/tmp/roms/LiquidCrystalESP.gba'],['tfoh','/tmp/roms/Pokémon TFOH-Beta3.gba'],['lp','/tmp/roms/LightPlatinumEsp.gba']]) {
  const s = cazar(ruta);
  const campos = {};
  for (const x of s) campos['0x' + x.framesField.toString(16)] = (campos['0x' + x.framesField.toString(16)] ?? 0) + 1;
  const tamaños = {};
  for (const x of s) tamaños[x.size] = (tamaños[x.size] ?? 0) + 1;
  console.log(nombre.padEnd(8), '· structs verificados:', s.length, '· campo de frames:', Object.entries(campos).map(([k, v]) => k + '×' + v).join(' '), '· tamaños:', Object.entries(tamaños).map(([k, v]) => k + 'B×' + v).join(' '));
}
