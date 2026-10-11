import fs from 'node:fs';
import { cargarROM, buscarMapLayouts, leerBloques, parTilesets, u32, offsetDe, colisionDe } from '../lib/gba_map_assets.mjs';
const plan = JSON.parse(fs.readFileSync('content/rom_campaigns_complete.json','utf8'));
const ROMS = [['glazed',0,'/tmp/roms/GlazedESPB6.gba'],['unbound',4,'/tmp/roms/Pokemon unbound gba.gba']];
for (const [nombre, idx, ruta] of ROMS) {
  const data = cargarROM(ruta);
  const layouts = buscarMapLayouts(data).reduce((m,l)=>(m.set(l.off,l),m), new Map());
  const maps = plan.campaigns[idx].maps;
  let totales=0, bloqueadas=0, muestras=0, ejemplos=[];
  for (const m of maps.slice(0, 60)) {
    const lay = layouts.get(offsetDe(u32(data, parseInt(m.source.header,16))));
    if (!lay) continue;
    const par = parTilesets(data, lay);
    const bloques = leerBloques(data, lay);
    let b=0;
    const hist=new Map();
    for (const celda of bloques) { const c = colisionDe(par, celda & 0x3ff); if (c) b++; hist.set(c,(hist.get(c)??0)+1); }
    totales += bloques.length; bloqueadas += b; muestras++;
    if (ejemplos.length<3) ejemplos.push(`${m.title}: ${(b/bloques.length*100).toFixed(0)}% bloqueado · colisiones ${[...hist.entries()].sort((a,b2)=>b2[1]-a[1]).slice(0,4).map(([k,v])=>k+':'+v).join(' ')}`);
  }
  console.log(nombre, '· mapas', muestras, '· celdas', totales, '· bloqueadas', (bloqueadas/totales*100).toFixed(1)+'%');
  for (const e of ejemplos) console.log('   ', e);
}
