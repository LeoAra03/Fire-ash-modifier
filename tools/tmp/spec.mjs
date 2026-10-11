import { cargarROM, u32, u16, offsetDe } from '../lib/gba_map_assets.mjs';
import { buscarTablaNombres } from '../forense/gba.mjs';
import { renderSpriteIndizado } from '../lib/gba_pokemon_assets.mjs';
import { lz77, bgr555aRGB } from '../forense/gba.mjs';
function familia(px, test) { let d=0,t=0; for (let i=0;i<px.length;i+=4){ if(!px[i+3])continue; t++; if(test(px[i],px[i+1],px[i+2]))d++; } return t?d/t:0; }
const P = [[1,(r,g,b)=>g>r+35&&g>b+35,'verde'],[4,(r,g,b)=>r>150&&r>g+60&&g>b+30,'naranja'],[7,(r,g,b)=>b>r+45&&b>110,'azul'],[25,(r,g,b)=>r>170&&g>150&&b<130,'amarillo'],[6,(r,g,b)=>r>130&&g<110&&b<110,'rojo'],[150,(r,g,b)=>b>140&&r<110,'violeta']];
const CASOS = [['glazed','/tmp/roms/GlazedESPB6.gba',0x3028b8,0x52544c],['unbound','/tmp/roms/Pokemon unbound gba.gba',0x19de42c,0x960b50],['lc','/tmp/roms/LiquidCrystalESP.gba',0x2350ac,0x3ad510],['lp','/tmp/roms/LightPlatinumEsp.gba',0x1e8354,0x37ea6c],['tfoh','/tmp/roms/Pokémon TFOH-Beta3.gba',0x722104,0x3ad510]];
for (const [n, ruta, sp, pal] of CASOS) {
  const data = cargarROM(ruta);
  const t = buscarTablaNombres(data, 60);
  if (!t) { console.log(n, 'sin tabla de nombres'); continue; }
  const nombres = t.nombres.map(x => (x.nombre || '').toUpperCase());
  const buscar = (n2) => nombres.indexOf(n2);
  const idx = { BULBASAUR: buscar('BULBASAUR'), CHARMANDER: buscar('CHARMANDER'), SQUIRTLE: buscar('SQUIRTLE'), PIKACHU: buscar('PIKACHU'), CHARIZARD: buscar('CHARIZARD'), MEWTWO: buscar('MEWTWO') };
  console.log(n.padEnd(8), '· nombres', nombres.length, '· base 0x'+t.base.toString(16), '·', JSON.stringify(idx));
  // probar deltas
  const mejor = [];
  for (let delta = -3; delta <= 3; delta++) {
    let ok = 0, det = [];
    for (const [id, test, nombre] of P) {
      const k = idx[{1:'BULBASAUR',4:'CHARMANDER',7:'SQUIRTLE',25:'PIKACHU',6:'CHARIZARD',150:'MEWTWO'}[id]] + delta;
      if (k < 0) { det.push('-'); continue; }
      const pp = u32(data, pal + k * 8), img = u32(data, sp + k * 8), size = u16(data, sp + k * 8 + 4);
      const r = lz77(data, offsetDe(img));
      const colores = []; for (let c=0;c<16;c++) colores.push(bgr555aRGB(u16(data, offsetDe(pp) + c*2)));
      const lado = Math.round(Math.sqrt(size*2));
      const b = renderSpriteIndizado(r.datos, lado, lado, colores);
      const f = familia(b.px, test); det.push(f.toFixed(2)); if (f >= 0.3) ok++;
    }
    mejor.push({ delta, ok, det: det.join(' ') });
  }
  mejor.sort((a,b)=>b.ok-a.ok);
  console.log('         mejor delta', mejor[0].delta, '· aciertos', mejor[0].ok+'/6', '·', mejor[0].det);
}
