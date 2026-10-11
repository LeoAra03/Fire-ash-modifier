import { cargarROM, u32, u16, esPtr, offsetDe } from '../lib/gba_map_assets.mjs';
for (const [nombre, ruta] of [['glazed','/tmp/roms/GlazedESPB6.gba'],['lp','/tmp/roms/LightPlatinumEsp.gba'],['lc','/tmp/roms/LiquidCrystalESP.gba']]) {
  const data = cargarROM(ruta); const len = data.length;
  const encontrados = [];
  for (let off = 0; off + 30 * 4 < len; off += 4) {
    let ok = 0; const tallas = new Map();
    for (let i = 0; i < 30; i++) {
      const p = u32(data, off + i * 4);
      if (!esPtr(p, len)) break;
      const o = offsetDe(p);
      const arr = u32(data, o + 0x1c), pal = u32(data, o + 0x20);
      if (!esPtr(arr, len) || !esPtr(pal, len)) break;
      const img0 = u32(data, offsetDe(arr));
      if (!esPtr(img0, len)) break;
      const size = u16(data, o + 6);
      tallas.set(size, (tallas.get(size) ?? 0) + 1);
      ok++;
    }
    if (ok >= 30) {
      let n = ok;
      while (off + n * 4 + 4 < len) {
        const p = u32(data, off + n * 4); if (!esPtr(p, len)) break;
        const o = offsetDe(p);
        if (!esPtr(u32(data, o + 0x1c), len) || !esPtr(u32(data, o + 0x20), len)) break;
        if (!esPtr(u32(data, offsetDe(u32(data, o + 0x1c))), len)) break;
        tallas.set(u16(data, o + 6), (tallas.get(u16(data, o + 6)) ?? 0) + 1);
        n++;
      }
      encontrados.push({ off, n, tallas: [...tallas.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5) });
      off += n * 4 - 4;
    }
  }
  console.log(nombre.padEnd(8), '· candidatos ≥30:', encontrados.length, encontrados.slice(0, 4).map(c => `0x${c.off.toString(16)} n=${c.n} tallas ${c.tallas.map(([t, k]) => t + '×' + k).join(' ')}`).join(' | '));
}
