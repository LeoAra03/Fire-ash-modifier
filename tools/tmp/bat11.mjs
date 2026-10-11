import { cargarROM, u32, esPtr, offsetDe } from '../lib/gba_map_assets.mjs';
import { battlerDe } from '../lib/gba_pokemon_assets.mjs';
function familia(px, test) { let d=0,t=0; for (let i=0;i<px.length;i+=4){ if(!px[i+3])continue; t++; if(test(px[i],px[i+1],px[i+2]))d++; } return t?d/t:0; }
const P = [
  [1,  (r,g,b)=>g>r+10&&g>b+10],
  [4,  (r,g,b)=>r>140&&r>g+30],
  [7,  (r,g,b)=>b>r+20],
  [25, (r,g,b)=>r>150&&g>130&&b<140],
  [6,  (r,g,b)=>r>140&&g<120&&b<120],
  [150,(r,g,b)=>b>150&&r<120],
];
const CASOS = [
  ['glazed','/tmp/roms/GlazedESPB6.gba',0x3028b8,[0x58d150,0x52544c]],
  ['unbound','/tmp/roms/Pokemon unbound gba.gba',0x1a1d5b4,[0x960dd0,0x960b50]],
  ['lc','/tmp/roms/LiquidCrystalESP.gba',0x2350ac,[0x3ad790,0x3d428c]],
  ['lp','/tmp/roms/LightPlatinumEsp.gba',0x1e8354,[0x37ecec,0x3d07ac]],
  ['tfoh','/tmp/roms/Pokémon TFOH-Beta3.gba',0x722104,[0x2371d8,0x45f89c]],
];
for (const [n, ruta, sp, pals] of CASOS) {
  const data = cargarROM(ruta);
  const filas = [];
  for (const pal of pals) for (let k = -4; k <= 4; k++) {
    let ok = 0, det = [];
    for (const [id, test] of P) {
      const b = battlerDe(data, sp, pal + k * 4, id);
      if (!b) { det.push('-'); continue; }
      const f = familia(b.px, test); det.push(f.toFixed(2));
      if (f >= 0.25) ok++;
    }
    filas.push({ pal, k, ok, det: det.join(' ') });
  }
  filas.sort((a,b)=>b.ok-a.ok);
  console.log(n.padEnd(8), filas.slice(0,2).map(f=>`pal 0x${f.pal.toString(16)} k=${f.k} ok=${f.ok}/6 [${f.det}]`).join('  |  '));
}
