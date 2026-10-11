import { cargarROM } from '../lib/gba_map_assets.mjs';
import { battlerDe } from '../lib/gba_pokemon_assets.mjs';
function familia(px, test) { let d=0,t=0; for (let i=0;i<px.length;i+=4){ if(!px[i+3])continue; t++; if(test(px[i],px[i+1],px[i+2]))d++; } return t?d/t:0; }
const pruebas = [
  [1,  (r,g,b)=>g>r+10&&g>b+10, 'verde'],
  [4,  (r,g,b)=>r>140&&r>g+30, 'naranja'],
  [7,  (r,g,b)=>b>r+20, 'azul'],
  [25, (r,g,b)=>r>150&&g>130&&b<140&&Math.abs(r-g)<90, 'amarillo'],
  [6,  (r,g,b)=>r>140&&g<120&&b<120, 'rojo'],
  [150,(r,g,b)=>b>150&&r<120, 'violeta'],
];
const CASOS = [
  ['glazed','/tmp/roms/GlazedESPB6.gba',[0x3028b8], [0x52544c,0x5256cc,0x52594c,0x58d150]],
  ['unbound','/tmp/roms/Pokemon unbound gba.gba',[0x19de42c,0x1a1d5b4],[0x960b50,0x960dd0,0x961050,0x9612d0]],
  ['lc','/tmp/roms/LiquidCrystalESP.gba',[0x2350ac,0x23654c],[0x3ad510,0x3ad790,0x3ada10]],
  ['lp','/tmp/roms/LightPlatinumEsp.gba',[0x1e8354,0x1e97f4],[0x37ea6c,0x37ecec,0x37ef6c]],
  ['tfoh','/tmp/roms/Pokémon TFOH-Beta3.gba',[0x722104,0x723504],[0x3ad510,0x3ad790,0x2371d8]],
];
for (const [n, ruta, tablasSp, tablasPal] of CASOS) {
  const data = cargarROM(ruta);
  const filas = [];
  for (const sp of tablasSp) for (const pal of tablasPal) {
    let ok=0, det=[];
    for (const [id, test, nombre] of pruebas) {
      const b = battlerDe(data, sp, pal, id);
      if (!b) { det.push(nombre+':-'); continue; }
      const f = familia(b.px, test);
      det.push(nombre+':'+f.toFixed(2));
      if (f >= 0.25) ok++;
    }
    filas.push({sp, pal, ok, det: det.join(' '), ruido: null});
  }
  filas.sort((a,b)=>b.ok-a.ok);
  console.log(n.padEnd(8), 'Top:');
  for (const f of filas.slice(0,3)) console.log('   sp 0x'+f.sp.toString(16), 'pal 0x'+f.pal.toString(16), 'aciertos', f.ok+'/6', '·', f.det);
}
