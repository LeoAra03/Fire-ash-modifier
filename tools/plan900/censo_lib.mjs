/**
 * censo_lib.mjs — un solo recorrido del proyecto que alimenta al medidor de
 * cobertura y al emisor de fases. Nada se cuenta dos veces ni con dos criterios.
 */
import fs from "node:fs";
import path from "node:path";
import { DATA } from "../lib/fire_ash_registry.mjs";
import { readMapRaw } from "../lib/dlc_helpers.mjs";
import { parseMap, parseEvent } from "../../web/js/rmxp.js";
import { marshalLoad } from "../../web/js/marshal.js";

export function rangoDe(id) {
  return id < 1000 ? "Fire Ash original"
    : id <= 1020 ? "Horizontes"
      : id <= 2020 ? "Atlas Mil"
        : id <= 2038 ? "Ruta de Dios + Silver"
          : id <= 2190 ? "Dimensional Nightmare"
            : id <= 2300 ? "Mapas nuevos del DLC"
              : id <= 2999 ? "Reserva"
                : id <= 4419 ? "Campañas ROM"
                  : "Otros";
}

export function censo() {
  const files = fs.readdirSync(DATA).filter((f) => /^Map\d+\.rxdata$/.test(f));
  const ids = files.map((f) => parseInt(f.match(/\d+/)[0], 10)).sort((a, b) => a - b);

  const nombres = new Map();
  try {
    const infos = marshalLoad(fs.readFileSync(path.join(DATA, "MapInfos.rxdata")));
    if (infos?.pairs) for (const [k, v] of infos.pairs) {
      const nm = v?.getIvar?.("name");
      if (nm) nombres.set(Number(k), String(nm.text ?? nm));
    }
  } catch { /* MapInfos ilegible: se sigue sin nombres */ }

  const mapas = [];
  const switches = new Set(), variables = new Set(), graficos = new Set(), bgms = new Set();
  const campos = {
    dialogo: 0, eleccion: 0, condicion: 0, selfSwitch: 0, transfer: 0,
    batalla: 0, rutina: 0, espera: 0, script: 0,
  };
  let comandos = 0, paginas = 0, eventos = 0, tiles = 0, conBgm = 0;

  for (const id of ids) {
    let p;
    try { p = parseMap(readMapRaw(id)); } catch { continue; }
    const bgm = p.bgm?.getIvar?.("name");
    const m = {
      id, nombre: nombres.get(id) || "", w: p.width, h: p.height, tiles: p.width * p.height,
      eventos: 0, paginas: 0, comandos: 0, dialogos: 0, elecciones: 0, condiciones: 0,
      selfswitches: 0, transfers: 0, batallas: 0, rutinas: 0, esperas: 0, scripts: 0,
      bgm: bgm ? String(bgm) : "",
    };
    if (bgm) { conBgm++; bgms.add(String(bgm)); }
    tiles += m.tiles;

    for (const e of p.events) {
      const pe = parseEvent(e.obj);
      m.eventos++; eventos++;
      const g = pe.pages[0]?.graphic?.charName;
      if (g) graficos.add(String(g));
      for (const pg of pe.pages) {
        m.paginas++; paginas++;
        if (pg.condition) {
          if (pg.condition.switch1) switches.add(pg.condition.switch1);
          if (pg.condition.switch2) switches.add(pg.condition.switch2);
          if (pg.condition.variable) variables.add(pg.condition.variable.id);
        }
        for (const c of pg.list || []) {
          m.comandos++; comandos++;
          const code = Number(c.getIvar("code"));
          const pr = c.getIvar("parameters") || [];
          switch (code) {
            case 101: case 401: m.dialogos++; campos.dialogo++; break;
            case 102: m.elecciones++; campos.eleccion++; break;
            case 111:
              m.condiciones++; campos.condicion++;
              if (Number(pr[0]) === 0) switches.add(Number(pr[1]));
              if (Number(pr[0]) === 1) variables.add(Number(pr[1]));
              break;
            case 121: switches.add(Number(pr[0])); break;
            case 122: variables.add(Number(pr[0])); break;
            case 123: m.selfswitches++; campos.selfSwitch++; break;
            case 201: m.transfers++; campos.transfer++; break;
            case 209: m.rutinas++; campos.rutina++; break;
            case 106: m.esperas++; campos.espera++; break;
            case 355: case 655: {
              m.scripts++; campos.script++;
              const linea = String(pr[0]?.text ?? pr[0] ?? "");
              if (/pbTrainerBattle|pbWildBattle|pbDoubleTrainerBattle|pbBattle/.test(linea)) {
                m.batallas++; campos.batalla++;
              }
              break;
            }
            default: break;
          }
        }
      }
    }
    mapas.push(m);
  }

  let tablasEnc = 0, slotsEnc = 0;
  try {
    const enc = marshalLoad(fs.readFileSync(path.join(DATA, "encounters.dat")));
    if (enc?.pairs) for (const [, v] of enc.pairs) {
      tablasEnc++;
      const types = v?.getIvar?.("types");
      if (types?.pairs) for (const [, arr] of types.pairs) slotsEnc += (arr || []).length;
    }
  } catch { /* sin encounters.dat */ }

  return {
    mapas,
    comandos, paginas, eventos, tiles, conBgm,
    switches: [...switches].sort((a, b) => a - b),
    variables: [...variables].sort((a, b) => a - b),
    graficos: [...graficos],
    bgms: [...bgms],
    tablasEnc, slotsEnc, campos,
  };
}

export const nf = (v) => v.toLocaleString("es-CL");
