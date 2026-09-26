// Prueba de integración del núcleo SIN navegador (stub de canvas/DOM).
// Ejecutar con: node web/js/integration.test.mjs
import { Buffer } from "node:buffer";

// --- Stub mínimo de DOM -------------------------------------------------------
const PNG1 = Uint8Array.from(Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64"));

function stubCtx() {
  return new Proxy({}, { get: () => () => {}, set: () => true });
}
globalThis.document = {
  createElement: (tag) => {
    if (tag !== "canvas") throw new Error("stub: no soporta <" + tag + ">");
    return {
      width: 300, height: 150, style: {},
      getContext: () => stubCtx(),
      toBlob: (cb) => cb(new Blob([PNG1], { type: "image/png" })),
    };
  },
  addEventListener: () => {},
  dispatchEvent: () => true,
  querySelector: () => null,
  getElementById: () => null,
};

const { buildDemoProject } = await import("./demo.js");
const { FS } = await import("./fs.js");
const App = await import("./app.js");
const { renderMap } = await import("./render.js");
const { pbsSections, pbsGet, pbsSet } = await import("./pbs.js");
const { marshalLoad } = await import("./marshal.js");
const { zlibInflate } = await import("./util.js");

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) { pass++; } else { fail++; console.error("FALLA:", msg); } };

console.log("— demo —");
const mem = await buildDemoProject();
for (const k of ["Data/Map001.rxdata", "Data/MapInfos.rxdata", "Data/System.rxdata",
  "Data/Tilesets.rxdata", "Data/Scripts.rxdata", "PBS/pokemon.txt", "PBS/map_metadata.txt",
  "Graphics/Tilesets/DemoTiles.png", "Game.ini"]) {
  ok(mem.has(k), "demo trae " + k);
}

console.log("— proyecto —");
await FS.connectDemo(mem, "demo-test");
await App.loadProject();
ok(App.S.mapList.length === 3, "3 mapas");
ok(App.S.tilesets.size === 1, "1 tileset");
ok(App.S.pbsFiles.length >= 3, "PBS detectados: " + App.S.pbsFiles.length);
ok(App.S.names.switches[1] === "Intro terminada", "nombre switch 1");

console.log("— mapas —");
const m1 = await App.loadMap(1);
ok(m1.parsed.width === 12 && m1.parsed.events.length === 4, "mapa 1: 12px + 4 eventos");
const m3 = await App.loadMap(3);
ok(m3.parsed.events.length === 2, "mapa 3: 2 eventos");

console.log("— render (stub) —");
const fakeImg = (w, h) => ({ width: w, height: h });
const gfx = { tileset: fakeImg(256, 256), autotiles: Array.from({ length: 7 }, () => fakeImg(96, 128)), characters: new Map() };
const { canvas } = renderMap(m1.parsed, App.getTileset(1), gfx, { showEvents: true, ghostEvents: true, passageOverlay: true });
ok(canvas.width === 12 * 32 && canvas.height === 10 * 32, `canvas ${canvas.width}x${canvas.height}`);

console.log("— scripts zlib —");
const scripts = marshalLoad(await FS.readBytes("Data/Scripts.rxdata"));
ok(scripts[0][1].text === "DemoMain", "sección DemoMain");
const code = new TextDecoder().decode(await zlibInflate(scripts[0][2].bytes));
ok(code.includes("Hola desde la demo"), "inflate OK");

console.log("— kirin check —");
const rep = await App.kirinCheck(false);
ok(rep.some((r) => r.level === "ok" && /Game.ini/.test(r.msg)), "Game.ini ok");
ok(!rep.some((r) => r.level === "error"), "sin errores: " + JSON.stringify(rep.filter((r) => r.level === "error")));
const deep = await App.kirinCheck(true);
ok(deep.some((r) => /Caja de archivos perfecta/.test(r.msg)), "caja perfecta en demo");

console.log("— scan global —");
const all = await App.scanAllMaps((id, parsed) => parsed.events.length);
ok(all.reduce((a, b) => a + b, 0) === 9, "9 eventos totales");

console.log("— sala pokemod —");
const meta = await App.buildSalaMod({ entryMapId: 1, doorX: 5, doorY: 5, doorGraphic: "DemoProfesor" });
ok(meta.newId === 4 && meta.targets === 3, `sala 4 con 3 destinos (${JSON.stringify({ n: meta.newId, t: meta.targets })})`);
const sala = await App.loadMap(4);
ok(sala.parsed.events.length === 5, "sala: 5 eventos (ayuda+volver+3 warps)");
const entry = await App.loadMap(1);
ok(entry.parsed.events.length === 5, "puerta añadida en mapa 1");
await App.uninstallSalaMod();
const entry2 = await App.loadMap(1);
ok(entry2.parsed.events.length === 4, "puerta retirada");
ok(App.S.mapList.length === 3, "3 mapas otra vez");

console.log("— pbs —");
const pbs = await App.loadPBS("PBS/pokemon.txt");
ok(pbsSections(pbs.lines).includes("PIKACHU"), "sección PIKACHU");
pbsSet(pbs.lines, "PIKACHU", "Name", "PikachuEdit");
pbs.dirty = true;
await App.savePBS("PBS/pokemon.txt");
const pbs2 = await App.loadPBS("PBS/pokemon.txt");
ok(pbsGet(pbs2.lines, "PIKACHU", "Name") === "PikachuEdit", "PBS guardado (pendiente demo)");

console.log("— protección partidas —");
let blocked = false;
try { await FS.writeBytes("Save1.rxdata", new Uint8Array([1])); } catch { blocked = true; }
ok(blocked, "bloquea escribir Save1.rxdata");
blocked = false;
try { await FS.deleteFile("Game.rxdata"); } catch { blocked = true; }
ok(blocked, "bloquea borrar Game.rxdata");

console.log(`\nintegración: ${pass} OK, ${fail} fallos`);
process.exit(fail ? 1 : 0);
