import { cargarROM, u32, u16, esPtr, offsetDe } from '../lib/gba_map_assets.mjs';

/** Busca arrays de >=120 punteros donde los structs apuntados compartan un par de offsets con punteros válidos. */
function analizar(ruta) {
  const data = cargarROM(ruta); const len = data.length;
  const arrays = [];
  for (let off = 0; off + 120 * 4 < len; off += 4) {
    let ok = 0;
    for (let i = 0; i < 120; i++) { if (!esPtr(u32(data, off + i * 4), len)) break; ok++; }
    if (ok >= 120) { arrays.push(off); off += ok * 4 - 4; }
  }
  const votos = new Map();
  for (const off of arrays) {
    const primero = offsetDe(u32(data, off));
    // ¿qué offsets del struct apuntan a punteros válidos en TODOS los primeros 40 structs?
    for (let a = 0; a + 4 <= 0x2c; a += 4) {
      let bien = 0;
      for (let i = 0; i < 40; i++) {
        const o = offsetDe(u32(data, off + i * 4));
        if (!esPtr(u32(data, o + a), len)) break;
        bien++;
      }
      if (bien >= 40) {
        const clave = a;
        votos.set(clave, (votos.get(clave) ?? 0) + 1);
      }
    }
  }
  return { arrays: arrays.length, votos: [...votos.entries()].sort((x, y) => y[1] - x[1]).slice(0, 8) };
}

for (const [nombre, ruta] of [['glazed','/tmp/roms/GlazedESPB6.gba'],['lp','/tmp/roms/LightPlatinumEsp.gba'],['lc','/tmp/roms/LiquidCrystalESP.gba'],['tfoh','/tmp/roms/Pokémon TFOH-Beta3.gba'],['unbound','/tmp/roms/Pokemon unbound gba.gba']]) {
  const r = analizar(ruta);
  console.log(nombre.padEnd(8), '· arrays>=120:', r.arrays, '· offsets con punteros válidos (offset:cuenta):', r.votos.map(([a, c]) => '0x' + a.toString(16) + ':' + c).join(' '));
}
