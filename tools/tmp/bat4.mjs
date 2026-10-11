import { cargarROM } from '../lib/gba_map_assets.mjs';
import { buscarTablasSprites, buscarTablasPaletas, puntuarTabla, battlerDe } from '../lib/gba_pokemon_assets.mjs';
const GRIS = Array.from({length:16}, (_,i)=>[i*17,i*17,i*17]);
for (const [n, r] of [['glazed','/tmp/roms/GlazedESPB6.gba'],['lp','/tmp/roms/LightPlatinumEsp.gba'],['lc','/tmp/roms/LiquidCrystalESP.gba'],['tfoh','/tmp/roms/Pokémon TFOH-Beta3.gba'],['unbound','/tmp/roms/Pokemon unbound gba.gba']]) {
  const data = cargarROM(r);
  const sp = buscarTablasSprites(data, { umbral: 100 });
  const pal = buscarTablasPaletas(data, { umbral: 100 });
  const punt = sp.map(t => ({ off: t.off, n: t.n, ...puntuarTabla(data, t, GRIS) }));
  punt.sort((a,b)=>a.ruido-b.ruido);
  console.log(n.padEnd(8), '· tablas sprites:', sp.length, '· paletas:', pal.length);
  for (const p of punt.slice(0,3)) console.log('   0x'+p.off.toString(16), 'n='+p.n, 'ruido', p.ruido.toFixed(3), 'cobertura', p.cobertura.toFixed(3));
  if (pal.length) console.log('   paletas candidatas:', pal.slice(0,3).map(p=>'0x'+p.off.toString(16)+'('+p.n+')').join(' '));
}
