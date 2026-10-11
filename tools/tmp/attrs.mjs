import fs from 'node:fs';
import { cargarROM, buscarMapLayouts, leerTileset, u32, offsetDe } from '../lib/gba_map_assets.mjs';
const plan = JSON.parse(fs.readFileSync('content/rom_campaigns_complete.json','utf8'));
for (const [nombre, idx, ruta] of [['glazed',0,'/tmp/roms/GlazedESPB6.gba'],['unbound',4,'/tmp/roms/Pokemon unbound gba.gba'],['lc',2,'/tmp/roms/LiquidCrystalESP.gba'],['tfoh',3,'/tmp/roms/Pokémon TFOH-Beta3.gba'],['lp',1,'/tmp/roms/LightPlatinumEsp.gba']]) {
  const data = cargarROM(ruta);
  const layouts = buscarMapLayouts(data).reduce((m,l)=>(m.set(l.off,l),m), new Map());
  const m = plan.campaigns[idx].maps[0];
  const lay = layouts.get(offsetDe(u32(data, parseInt(m.source.header,16))));
  const ts = leerTileset(data, lay.prim);
  const hist = new Map();
  for (const a of ts.attrs) hist.set(a, (hist.get(a) ?? 0) + 1);
  const top = [...hist.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10);
  console.log(nombre.padEnd(8), 'map0 tileset primario · attrs distintos:', hist.size, '· top:', top.map(([v,c])=>'0x'+v.toString(16)+'×'+c).join(' '));
}
