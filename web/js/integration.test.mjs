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
  "Data/Tilesets.rxdata", "Data/Scripts.rxdata", "PBS/pokemon.txt", "PBS/metadata.txt",
  "PBS/encounters.txt", "PBS/trainers.txt", "PBS/townmap.txt", "PBS/items.txt",
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

console.log("— crear: plantillas —");
const C = await import("./create.js");
const Rmxp = await import("./rmxp.js");
const codesOf = (pages) => pages.flatMap((pg) => (pg.getIvar("list") || []).map((o) => Number(o.getIvar("code"))));
const allText = (pages) => pages.flatMap((pg) => (pg.getIvar("list") || []).map((o) => {
  const c = Rmxp.cmdOf(o);
  if (c.code === 355 || c.code === 655) return Rmxp.rstr(c.params[0]);
  if (c.code === 111 && c.params[0] === 12) return Rmxp.rstr(c.params[1]);
  return "";
}).join("\n")).join("\n");
for (const [id] of C.TEMPLATES) {
  const tpl = C.buildTemplate(id, {});
  ok(tpl.name && tpl.pages.length >= 1, `plantilla ${id} construye`);
  for (const pg of tpl.pages) {
    const list = pg.getIvar("list") || [];
    ok(Number(list[list.length - 1].getIvar("code")) === 0, `${id}: página termina en Fin`);
  }
}
const tr = C.buildTemplate("trainer", { ttype: "CAMPER", tname: "Dave" });
ok(tr.name === "Trainer(3)", "entrenador se llama Trainer(3)");
ok(Number(tr.pages[0].getIvar("trigger")) === 2, "entrenador dispara al tocar");
ok(allText(tr.pages).includes("pbTrainerIntro(:CAMPER)"), "entrenador: intro");
ok(allText(tr.pages).includes("pbNoticePlayer(get_self)"), "entrenador: aviso");
ok(allText(tr.pages).includes('pbTrainerBattle(:CAMPER,"Dave")'), "entrenador: batalla");
ok(allText(tr.pages).includes("pbTrainerEnd"), "entrenador: fin");
const hi = C.buildTemplate("hidden", { item: "NUGGET" });
ok(hi.name === "HiddenItem:NUGGET" && !!hi.pages[0].getIvar("through"), "oculto: nombre+through");
const hiSelf = hi.pages[0].getIvar("list").map(Rmxp.cmdOf).find((c) => c.code === 123);
ok(hiSelf?.params[1] === 0, "self-switch ON usa operación 0 de RPG Maker XP");
const heal = C.buildTemplate("heal", {});
ok(allText(heal.pages).includes("pbSetPokemonCenter"), "curandera: punto de retorno");
ok(codesOf(heal.pages).includes(314), "curandera: Recuperar todo");
const mart = C.buildTemplate("mart", { stock: ["POTION", "POKEBALL"] });
ok(allText(mart.pages).includes("pbPokemonMart"), "tienda: pbPokemonMart");
const gift = C.buildTemplate("gift", { species: "MEW", level: 20 });
ok(allText(gift.pages).includes("pbAddPokemon(:MEW,20)"), "regalo: pbAddPokemon");
const wild = C.buildTemplate("wild", { species: "PIKACHU", level: 10 });
ok(allText(wild.pages).includes("pbWildBattle(:PIKACHU,10)"), "salvaje: pbWildBattle");

console.log("— crear: insertar+mapa —");
const m1b = await App.loadMap(1);
const before = m1b.parsed.events.length;
const tplNpc = C.buildTemplate("npc", { name: "Test", dialog: ["Hola"] });
const newEvId = C.insertEvent(m1b.parsed, tplNpc.name, 1, 1, tplNpc.pages);
App.markMapDirty(1);
await App.saveMap(1);
const m1c = await App.loadMap(1);
ok(m1c.parsed.events.length === before + 1 && newEvId > 0, "evento insertado y guardado");
const built = C.buildMap({ tilesetId: 1, width: 20, height: 15, fill: 0 });
ok(Number(built.getIvar("width")) === 20 && built.getIvar("events").pairs.length === 0, "mapa nuevo 20x15 vacío");

console.log("— crear: pbs texto —");
const encText = await FS.readText("PBS/encounters.txt");
const sec002 = C.getSectionBody(encText, "002");
ok(sec002.found && sec002.body.includes("Land,21"), "sección [002] leída");
const added = C.setSectionBody(encText, "099", "Land,21\n    100,RATTATA,2,4");
ok(C.getSectionBody(added, "099").found, "sección añadida");
const townText = await FS.readText("PBS/townmap.txt");
const regs = C.getTownRegions(townText);
ok(regs.length === 1 && regs[0].points.length === 2, "región demo con 2 puntos");
ok(C.formatTownPoint({ x: 1, y: 2, name: "Test", poi: "", flyMap: 1, flyX: 5, flyY: 5, sw: "" }) === "Point = 1,2,Test,,1,5,5,", "formato Point");
const blocks = C.parseEncountersBody(sec002.body);
ok(blocks.length === 2 && blocks[0].rows.reduce((a, r) => a + r.ch, 0) === 100, "encuentros Land suman 100");
const norm = C.normalizeChances([{ ch: 1 }, { ch: 1 }, { ch: 1 }]);
ok(norm.reduce((a, r) => a + r.ch, 0) === 100, "normalizar a 100");
const te = C.formatTrainerEntry({ type: "CAMPER", name: "Dave", version: 0, loseText: "X", team: [{ species: "PIDGEY", level: 9 }] });
ok(te.header === "[CAMPER,Dave]" && te.body.includes("Pokemon = PIDGEY,9"), "entrada de entrenador");
const conns = C.parseConnections("# nada\n1,N,0,2,S,0");
ok(conns.length === 1 && conns[0].a === 1 && conns[0].edgeB === "S", "conexiones");
const oldf = C.parseEncountersBody("Land,25\nPIKACHU,5,8");
ok(oldf.length === 1 && oldf[0].rows[0].old === true, "detecta formato antiguo");

console.log("— crear: auditoría —");
const texts = {};
for (const f of ["metadata", "townmap", "connections", "encounters", "trainers", "pokemon", "items", "trainertypes"]) {
  texts[f] = await FS.readText(`PBS/${f}.txt`);
}
const iss = C.auditPBS(texts, App.S.mapList.map((m) => m.id));
ok(!iss.some((i) => i.level === "error"), "demo PBS sin errores: " + JSON.stringify(iss.filter((i) => i.level === "error")));
const actx = {
  species: new Set(["PIKACHU", "RATTATA", "MAGIKARP", "CHARIZARD"]),
  items: new Set(["POTION"]),
  trainerKeys: new Set(["YOUNGSTER|Joey|0"]),
  mapSet: new Set([1, 2, 3]),
  mapSizes: new Map([[1, { w: 12, h: 10 }], [2, { w: 14, h: 12 }], [3, { w: 8, h: 7 }]]),
  charSet: new Set(["demonpc", "demoprofesor"]),
};
for (const id of [1, 2, 3]) {
  const rec = await App.loadMap(id);
  const mi = C.auditMapEvents(rec.parsed, id, actx);
  ok(mi.length === 0, `mapa ${id} sin avisos: ` + JSON.stringify(mi));
}
const bad = C.auditPBS({ ...texts, encounters: "[999]\nLand,21\n    50,NOEXISTE,5,9" }, [1, 2, 3]);
ok(bad.some((i) => i.level === "error" && /999/.test(i.msg)), "detecta mapa inexistente en encuentros");

console.log("— crear: registro de mapa —");
const newId = App.S.mapList.reduce((m, x) => Math.max(m, x.id), 0) + 1;
App.S.mapInfosObj.pairs.push([newId, C.buildMapInfo("Mapa Test", 0, 99)]);
App.S.maps.set(newId, { info: null, parsed: Rmxp.parseMap(built), dirty: true });
await App.saveMap(newId);
await App.saveMapInfos();
ok(App.S.mapList.some((m) => m.id === newId && m.name === "Mapa Test"), "mapa registrado en MapInfos");

console.log("— analizar —");
const AN = await import("./analyze.js");
const { pbsToText } = await import("./pbs.js");
const rep1 = AN.extractMapReport(m1c.parsed, 1, App.S.mapList.find((m) => m.id === 1) || null, App.S.tilesets.get(m1c.parsed.tilesetId) || null);
ok(rep1.events.length === 5, "reporte mapa 1: 5 eventos");
ok(rep1.texts.length >= 1, `reporte trae diálogos (${rep1.texts.length})`);
ok(rep1.texts.some((t) => /Bienvenido|Hola|Pradera/i.test(t.text)), "análisis conserva la primera línea del comando 101");
ok(rep1.collisions && rep1.collisions.total === 12 * 10, "reporte trae colisiones 12x10");
const mdT = pbsToText((await App.loadPBS("PBS/metadata.txt")).lines);
const tmT = pbsToText((await App.loadPBS("PBS/townmap.txt")).lines);
const reports = await App.scanAllMaps((id, parsed) => [AN.extractMapReport(parsed, id, App.S.mapList.find((m) => m.id === id) || null, App.S.tilesets.get(parsed.tilesetId) || null)]);
ok(reports.length === 4, `4 reportes (${reports.length})`);
const gidx = AN.buildGameIndex(reports, { metadata: mdT, townmap: tmT });
ok(gidx.totals.maps === 4 && gidx.totals.events === 10, `índice 4 mapas 10 eventos (${gidx.totals.maps}/${gidx.totals.events})`);
ok(Array.isArray(gidx.islands.regions) && gidx.islands.regions.length >= 1, "islas agrupadas por región");
const gj = AN.indexToJSON(gidx);
ok(Array.isArray(gj.dialogues) && Array.isArray(gj.flagUses) && gj.totals.maps === 4, "índice exportable a JSON");

console.log("— packs —");
const PK = await import("./packs.js");
const nodefs = await import("node:fs");
const pack = JSON.parse(nodefs.readFileSync(new URL("../packs/isla_espejo.json", import.meta.url), "utf-8"));
ok(pack.bosses.length === 8 && (pack.extras || []).length === 3, "pack Isla Espejo: 8 jefes + 3 extras");
const vis = PK.validatePack(pack, {});
ok(!vis.some((i) => i.level === "error"), "pack válido: " + JSON.stringify(vis.filter((i) => i.level === "error")));
const visSp = PK.validatePack(pack, { species: ["PIKACHU"] });
ok(visSp.some((i) => i.level === "error" && /LUDICOLO/.test(i.msg)), "detecta especie inexistente");
const badPack = PK.validatePack({ ...pack, bosses: [{ id: "x", name: "X", x: 99, y: 99, team: [] }] }, {});
ok(badPack.filter((i) => i.level === "error").length >= 2, "detecta posición y equipo inválidos");
const dupPack = PK.validatePack({ ...pack, bosses: [pack.bosses[0], { ...pack.bosses[1], x: pack.bosses[0].x, y: pack.bosses[0].y }] }, {});
ok(dupPack.some((i) => /ocupada/.test(i.msg)), "detecta casilla ocupada");
const plan = PK.planPack(pack, { hubId: 99, doorMap: 1, doorX: 5, doorY: 5, region: "0", townX: 1, townY: 1, tilesetId: 1, typeMap: {}, spriteMap: {} });
ok(plan.events.length === 12, `plan: 12 eventos (${plan.events.length})`);
ok(plan.trainerEntries.length === 8 && plan.trainerEntries[0].header === "[MIRORB,Miror B.]", "plan: 8 entrenadores con tipo sugerido");
const plan2 = PK.planPack(pack, { hubId: 99, doorMap: 1, doorX: 5, doorY: 5, region: "0", townX: 1, townY: 1, tilesetId: 1, typeMap: { miror_b: "CLOWN" }, spriteMap: {} });
ok(plan2.trainerEntries[0].header === "[CLOWN,Miror B.]", "plan: remap de tipo funciona");
ok(plan.manifest.hubId === 99 && plan.manifest.doorEventId === 0, "plan: manifiesto con hub 99");
ok(/MapPosition = 0,1,1/.test(plan.metadataBody) && /HealingSpot = 99,15,20/.test(plan.metadataBody), "plan: metadatos completos");
ok(plan.landing.x === 15 && plan.landing.y === 20, "plan: aterrizaje junto a la salida");
const fc = PK.findFreeTownCoord([{ x: 1, y: 1 }], { x: 1, y: 1 });
ok(!(fc.x === 1 && fc.y === 1), `coord libre evita ocupada (${fc.x},${fc.y})`);

console.log("— crear: jefes y borrado PBS —");
const boss = C.buildTrainer({ mode: "boss", displayName: "Jefe", ttype: "CAMPER", tname: "Dave" });
ok(boss.name === "Jefe" && Number(boss.pages[0].getIvar("trigger")) === 0, "jefe: nombre + disparo por acción");
ok(!allText(boss.pages).includes("pbNoticePlayer"), "jefe: sin aviso de proximidad");
ok(allText(boss.pages).includes('pbTrainerBattle(:CAMPER,"Dave")'), "jefe: batalla intacta");
const removed = C.removeSectionBody(added, "099");
ok(!C.getSectionBody(removed, "099").found && C.getSectionBody(removed, "002").found, "sección borrada sin dañar vecinas");

console.log(`\nintegración: ${pass} OK, ${fail} fallos`);
process.exit(fail ? 1 : 0);
