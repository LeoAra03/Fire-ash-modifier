import { cargarROM } from '../lib/gba_map_assets.mjs';
import { buscarTablasSprites, buscarTablasPaletas, battlerDe } from '../lib/gba_pokemon_assets.mjs';

/** Cuenta cuántos píxeles de cada sprite caen en la familia de color esperada. */
function familia(px, test) {
  let dentro = 0, total = 0;
  for (let i = 0; i < px.length; i += 4) {
    if (!px[i + 3]) continue;
    total++;
    if (test(px[i], px[i + 1], px[i + 2])) dentro++;
  }
  return total ? dentro / total : 0;
}
const verde = (r, g, b) => g > r + 20 && g > b + 20;
const naranja = (r, g, b) => r > 150 && r > g + 40 && g > b + 20;
const azul = (r, g, b) => b > r + 30 && b > 60;
const amarillo = (r, g, b) => r > 180 && g > 150 && b < 120;

const ESPERADO = [[1, verde, 0.3], [4, naranja, 0.2], [7, azul, 0.25], [25, amarillo, 0.25]];

for (const [n, r] of [['glazed','/tmp/roms/GlazedESPB6.gba'],['lp','/tmp/roms/LightPlatinumEsp.gba'],['lc','/tmp/roms/LiquidCrystalESP.gba'],['tfoh','/tmp/roms/Pokémon TFOH-Beta3.gba'],['unbound','/tmp/roms/Pokemon unbound gba.gba']]) {
  const data = cargarROM(r);
  const sp = buscarTablasSprites(data, { umbral: 100 });
  const palTablas = buscarTablasPaletas(data, { umbral: 100 });
  const resultados = [];
  for (const st of sp) {
    for (const pt of palTablas) {
      let ok = 0, detalle = [];
      for (const [id, test, min] of ESPERADO) {
        const b = battlerDe(data, st.off, pt.off, id);
        if (!b) break;
        const f = familia(b.px, test);
        detalle.push(`${id}:${f.toFixed(2)}`);
        if (f >= min) ok++;
      }
      resultados.push({ sp: st.off, pal: pt.off, ok, detalle: detalle.join(' ') });
    }
  }
  resultados.sort((a, b) => b.ok - a.ok);
  const mejor = resultados[0];
  console.log(n.padEnd(8), '· mejor:', `sprites 0x${mejor.sp.toString(16)} paletas 0x${mejor.pal.toString(16)}`, `aciertos ${mejor.ok}/4`, '·', mejor.detalle);
}
