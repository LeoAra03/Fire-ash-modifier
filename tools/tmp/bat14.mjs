import { cargarROM, u32, u16, offsetDe, esPtr } from '../lib/gba_map_assets.mjs';
import { renderSpriteIndizado } from '../lib/gba_pokemon_assets.mjs';
import { lz77, bgr555aRGB } from '../forense/gba.mjs';
function familia(px, test) { let d=0,t=0; for (let i=0;i<px.length;i+=4){ if(!px[i+3])continue; t++; if(test(px[i],px[i+1],px[i+2]))d++; } return t?d/t:0; }
const P = [[1,(r,g,b)=>g>r+35&&g>b+35,'verde'],[4,(r,g,b)=>r>150&&r>g+60&&g>b+30,'naranja'],[7,(r,g,b)=>b>r+45&&b>110,'azul'],[25,(r,g,b)=>r>170&&g>150&&b<130,'amarillo'],[6,(r,g,b)=>r>130&&g<110&&b<110,'rojo'],[150,(r,g,b)=>b>140&&r<110,'violeta']];
function puntuar(data, sp, pal, sPal, sSp) {
  let ok = 0, det = [];
  for (const [id, test, nombre] of P) {
    const p = u32(data, pal + (id + sPal) * 8);
    const img = u32(data, sp + (id + sSp) * 8), size = u16(data, sp + (id + sSp) * 8 + 4);
    if (!esPtr(p, data.length) || !esPtr(img, data.length)) { det.push('-'); continue; }
    const r = lz77(data, offsetDe(img)); if (!r) { det.push('-'); continue; }
    const colores = []; for (let c=0;c<16;c++) colores.push(bgr555aRGB(u16(data, offsetDe(p) + c*2)));
    const lado = Math.round(Math.sqrt(size*2));
    const b = renderSpriteIndizado(r.datos, lado, lado, colores);
    const f = familia(b.px, test); det.push(nombre[0]+f.toFixed(1));
    if (f >= 0.3) ok++;
  }
  return { ok, det: det.join(' ') };
}
const CASOS = [['glazed','/tmp/roms/GlazedESPB6.gba',[0x3028b8],[0x52544c,0x5256cc]],['unbound','/tmp/roms/Pokemon unbound gba.gba',[0x1a1d5b4,0x19de42c],[0x960b50,0x960dd0]],['lc','/tmp/roms/LiquidCrystalESP.gba',[0x2350ac],[0x3ad510,0x3ad790]],['lp','/tmp/roms/LightPlatinumEsp.gba',[0x1e8354],[0x37ea6c]],['tfoh','/tmp/roms/Pokémon TFOH-Beta3.gba',[0x722104],[0x3ad510,0x2371d8]]];
for (const [n, ruta, sps, pals] of CASOS) {
  const data = cargarROM(ruta);
  const filas = [];
  for (const sp of sps) for (const pal of pals) for (let sPal = -3; sPal <= 3; sPal++) for (const sSp of [0]) {
    const r = puntuar(data, sp, pal, sPal, sSp);
    filas.push({ sp, pal, sPal, sSp, ...r });
  }
  filas.sort((a,b)=>b.ok-a.ok);
  const m = filas[0];
  console.log(n.padEnd(8), `sp 0x${m.sp.toString(16)} pal 0x${m.pal.toString(16)} sPal ${m.sPal} sSp ${m.sSp}`, 'ok', m.ok+'/6', '·', m.det);
  if (filas[1]) console.log('         segundo:', `sPal ${filas[1].sPal}`, 'ok', filas[1].ok+'/6', '·', filas[1].det);
}
