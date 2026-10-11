import { cargarROM } from '../lib/gba_map_assets.mjs';
import { buscarTablasSprites, buscarTablasPaletas, battlerDe } from '../lib/gba_pokemon_assets.mjs';
const data = cargarROM('/tmp/roms/GlazedESPB6.gba');
const sp = buscarTablasSprites(data, { umbral: 100 });
const palTablas = buscarTablasPaletas(data, { umbral: 100 });
const tablaSprites = sp.find(t=>t.off===0x3028b8).off;
for (const pt of palTablas.slice(0,4)) {
  for (const id of [1,4,25]) {
    const b = battlerDe(data, tablaSprites, pt.off, id);
    console.log('pal 0x'+pt.off.toString(16), 'id', id, b ? `ancho=${b.ancho} opacos=${b.opacos} ruido=${b.ruido.toFixed(3)}` : 'null');
    if (b && id===1) console.log('   primeros colores:', [...b.px.slice(0,8)].join(','));
  }
}
