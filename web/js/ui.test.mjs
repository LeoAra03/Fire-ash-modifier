// Prueba de humo de la INTERFAZ con jsdom (requiere: npm i jsdom).
// Ejecutar con: node --experimental-vm-modules web/js/ui.test.mjs
// (o desde /tmp con NODE_PATH; en CI no se ejecuta por defecto).
import { JSDOM } from "jsdom";
import { Buffer } from "node:buffer";

const PNG1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="app"></div></body></html>`, {
  url: "http://localhost:8080/",
  pretendToBeVisual: true,
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.CustomEvent = dom.window.CustomEvent;

// canvas 2d: stub no-op + toBlob con PNG real de 1px
const stubCtx = () => new Proxy({}, { get: () => () => {}, set: () => true });
dom.window.HTMLCanvasElement.prototype.getContext = function () { return stubCtx(); };
dom.window.HTMLCanvasElement.prototype.toBlob = function (cb) {
  cb(new Blob([PNG1], { type: "image/png" }));
};
globalThis.createImageBitmap = async () => ({ width: 64, height: 64, close: () => {} });

const { boot, goTab } = await import("./ui.js");
const App = await import("./app.js");

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) { pass++; } else { fail++; console.error("FALLA:", msg); } };
const tick = (ms = 50) => new Promise((r) => setTimeout(r, ms));

console.log("— boot —");
boot();
await tick();
ok(document.querySelectorAll("#tabs .tab").length === 8, "8 pestañas");
ok(document.getElementById("c-demo"), "botón demo visible");

console.log("— demo + mapas —");
await App.connectDemo();
goTab("maps", true);
await tick(400);
ok(document.querySelector("#map-stage canvas"), "canvas del mapa renderizado");
ok(document.querySelectorAll(".maprow").length >= 3, "lista de mapas");
ok(document.querySelectorAll("#map-events .chip").length >= 4, "chips de eventos");

console.log("— eventos —");
App.S.currentEvent = 1;
goTab("events", true);
await tick(300);
ok(document.querySelectorAll(".cmdrow").length > 5, "comandos listados: " + document.querySelectorAll(".cmdrow").length);
ok(document.querySelector("#f-name"), "formulario evento");

console.log("— flags —");
goTab("flags", true);
await tick(200);
ok(document.querySelectorAll(".flagrow").length > 10, "flags listados");

console.log("— npcs —");
goTab("npcs", true);
await tick(200);
document.getElementById("npc-scan").click();
await tick(600);
ok(document.querySelectorAll(".npcrow").length >= 3, "NPCs escaneados: " + document.querySelectorAll(".npcrow").length);

console.log("— pbs —");
goTab("pbs", true);
await tick(300);
ok(document.querySelectorAll(".pbssec").length >= 2, "secciones PBS");

console.log("— crear —");
goTab("create", true);
await tick(400);
ok(document.getElementById("ce-event"), "creador de eventos");
ok(document.querySelectorAll("#view details.card").length === 7, "7 secciones de Crear");
ok(document.getElementById("an-run"), "análisis total");
ok(document.getElementById("pk-import"), "packs");
document.getElementById("ce-create").click();
await tick(400);
ok(document.querySelector("#ce-out .logrow.ok"), "crear evento desde la UI");
document.getElementById("au-pbs").click();
await tick(600);
ok(document.querySelector("#au-out .flagrow, #au-out .logrow"), "auditoría PBS muestra resultados");
document.getElementById("an-run").click();
await tick(900);
ok(document.querySelector("#an-out .stats"), "análisis muestra tablero");
ok(document.querySelectorAll("#an-list .logrow").length >= 1, "análisis lista diálogos");

console.log("— mods —");
goTab("mods", true);
await tick(200);
document.getElementById("m-kirin").click();
await tick(600);
ok(document.querySelectorAll("#kirin-out .logrow").length >= 5, "chequeo kirin muestra resultados");

console.log("— modales —");
const { mapPickerModal, spritePickerModal } = await import("./helpers.js");
mapPickerModal("Test", () => {});
await tick(100);
ok(document.getElementById("modal-ov"), "modal mapa abre");
ok(document.querySelectorAll(".pickrow").length >= 3, "modal mapa lista");
document.querySelector("#modal-ov [data-x]").click();
spritePickerModal("Test", "", () => {});
await tick(300);
ok(document.querySelectorAll(".sprrow").length >= 2, "modal sprites lista");

console.log(`\nui: ${pass} OK, ${fail} fallos`);
process.exit(fail ? 1 : 0);
