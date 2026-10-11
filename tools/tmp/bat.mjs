import { cargarROM, u32, u16, esPtr, offsetDe } from '../lib/gba_map_assets.mjs';
import { lz77 } from '../forense/gba.mjs';
for (const [nombre, ruta] of [['glazed','/tmp/roms/GlazedESPB6.gba'],['unbound','/tmp/roms/Pokemon unbound gba.gba'],['lc','/tmp/roms/LiquidCrystalESP.gba'],['lp','/tmp/roms/LightPlatinumEsp.gba'],['tfoh','/tmp/roms/Pokémon TFOH-Beta3.gba']]) {
  const data = cargarROM(ruta); const len = data.length;
  const encontradas = [];
  for (let off = 0; off + 8 * 150 < len; off += 4) {
    let ok = 0; const tamanos = new Map();
    for (let i = 0; i < 150; i++) {
      const img = u32(data, off + i * 8), size = u32(data, off + i * 8 + 4);
      if (!esPtr(img, len) || data[offsetDe(img)] !== 0x10) break;
      const r = lz77(data, offsetDe(img));
      if (!r) break;
      if (size !== r.tam) break;         // la tabla declara el tamaño descomprimido
      tamanos.set(size, (tamanos.get(size) ?? 0) + 1);
      ok++;
    }
    if (ok >= 150) {
      let n = 150;
      while (off + n * 8 + 8 < len) {
        const img = u32(data, off + n * 8), size = u32(data, off + n * 8 + 4);
        if (!esPtr(img, len) || data[offsetDe(img)] !== 0x10) break;
        const r = lz77(data, offsetDe(img)); if (!r || r.tam !== size) break;
        n++;
      }
      encontradas.push({ off, n, tamanos: [...tamanos.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3) });
      off += n * 8;
    }
  }
  const total = encontradas.reduce((a,e)=>a+e.n,0);
  console.log(nombre.padEnd(8), '· tablas {img,size}:', encontradas.length, '· entradas:', total, '· ejemplos:', encontradas.slice(0,3).map(e=>'0x'+e.off.toString(16)+'('+e.n+') '+e.tamanos.map(([s,c])=>s+'B×'+c).join(' ')).join(' | '));
}
