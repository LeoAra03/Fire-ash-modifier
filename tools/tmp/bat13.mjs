import { cargarROM, u32, u16, offsetDe, esPtr } from '../lib/gba_map_assets.mjs';
import { renderSpriteIndizado } from '../lib/gba_pokemon_assets.mjs';
import { lz77, bgr555aRGB } from '../forense/gba.mjs';
function familia(px, test) { let d=0,t=0; for (let i=0;i<px.length;i+=4){ if(!px[i+3])continue; t++; if(test(px[i],px[i+1],px[i+2]))d++; } return t?d/t:0; }
const P = [[1,(r,g,b)=>g>r+10&&g>b+10,'verde'],[4,(r,g,b)=>r>140&&r>g+30,'naranja'],[7,(r,g,b)=>b>r+20,'azul'],[25,(r,g,b)=>r>150&&g>130&&b<140,'amarillo'],[6,(r,g,b)=>r>140&&g<120&&b<120,'rojo'],[150,(r,g,b)=>b>150&&r<120,'violeta']];
const CASOS = [['glazed','/tmp/roms/GlazedESPB6.gba',0x3028b8,[0x52544c] ],['unbound','/tmp/roms/Pokemon unbound gba.gba',0x1a1d5b4,[0x960b50]],['lc','/tmp/roms/LiquidCrystalESP.gba',0x2350ac,[0x3ad510]],['lp','/tmp/roms/LightPlatinumEsp.gba',0x1e8354,[0x37ea6c]],['tfoh','/tmp/roms/Pokémon TFOH-Beta3.gba',0x722104,[0x3ad510]]];
for (const [n, ruta, sp, pals] of CASOS) {
  const data = cargarROM(ruta);
  for (const pal of pals) for (const stride of [8, 4]) {
    const res = [];
    let ok = 0;
    for (const [id, test, nombre] of P) {
      const p = u32(data, pal + id * stride);
      if (!esPtr(p, data.length)) { res.push(nombre+':-'); continue; }
      const img = u32(data, sp + id * 8), size = u16(data, sp + id * 8 + 4);
      const r = lz77(data, offsetDe(img));
      const colores = []; for (let c=0;c<16;c++) colores.push(bgr555aRGB(u16(data, offsetDe(p) + c*2)));
      const lado = Math.round(Math.sqrt(size*2));
      const b = renderSpriteIndizado(r.datos, lado, lado, colores);
      const f = familia(b.px, test); res.push(nombre+':'+f.toFixed(2));
      if (f >= 0.25) ok++;
    }
    console.log(n.padEnd(8), `pal 0x${pal.toString(16)} stride ${stride}`, 'ok', ok+'/6', '·', res.join(' '));
  }
}
