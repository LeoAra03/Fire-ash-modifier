import fs from 'node:fs';
import { cargarROM, buscarMapLayouts, u32, u16, esPtr, offsetDe } from '../lib/gba_map_assets.mjs';

/** struct ObjectEventTemplate (Gen 3): localId, graphicsId, kind, elevation,
 *  x(u16), y(u16), movementType, range, trainerType(u16), script(ptr), flag(u16) */
function leerObjectEvents(data, ptr) {
  const o = offsetDe(ptr);
  const n = data[o];
  const out = [];
  for (let i = 0; i < n; i++) {
    const b = o + 1 + i * 24;
    out.push({
      localId: data[b], graphicsId: data[b + 1], kind: data[b + 2], elevation: data[b + 3] - 128,
      x: u16(data, b + 4), y: u16(data, b + 6), movimiento: data[b + 8], rango: data[b + 9],
      entrenador: u16(data, b + 10), script: u32(data, b + 12), flag: u16(data, b + 16),
    });
  }
  return out;
}

for (const [nombre, ruta] of [['glazed','/tmp/roms/GlazedESPB6.gba'],['unbound','/tmp/roms/Pokemon unbound gba.gba']]) {
  const data = cargarROM(ruta);
  const layouts = buscarMapLayouts(data).reduce((m,l)=>(m.set(l.off,l),m), new Map());
  const plan = JSON.parse(fs.readFileSync('content/rom_campaigns_complete.json','utf8'));
  const idx = nombre === 'glazed' ? 0 : 4;
  const graficos = new Map(); let total = 0, mapas = 0;
  for (const m of plan.campaigns[idx].maps.slice(0, 40)) {
    const header = parseInt(m.source.header, 16);
    const evPtr = u32(data, header + 4);
    if (!esPtr(evPtr, data.length)) continue;
    mapas++;
    for (const ev of leerObjectEvents(data, evPtr)) { graficos.set(ev.graphicsId, (graficos.get(ev.graphicsId) ?? 0) + 1); total++; }
  }
  const top = [...graficos.entries()].sort((a,b)=>b[1]-a[1]).slice(0, 20);
  console.log(nombre, '· mapas', mapas, '· NPC', total, '· graphicsId distintos', graficos.size);
  console.log('   top:', top.map(([id, c]) => id + '×' + c).join(' '));
}
