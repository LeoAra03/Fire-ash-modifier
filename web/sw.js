// Service worker: PokeMod funciona 100% offline (ideal en el celular).
const CACHE = "pokemod-v3";
const ASSETS = [
  "./", "./index.html", "./manifest.json", "./icon.svg", "./css/style.css",
  "./js/ui.js", "./js/editors.js", "./js/helpers.js", "./js/app.js", "./js/fs.js",
  "./js/marshal.js", "./js/rmxp.js", "./js/render.js", "./js/pbs.js",
  "./js/create.js", "./js/createUI.js", "./js/analyze.js", "./js/packs.js", "./packs/isla_espejo.json",
  "./js/demo.js", "./js/util.js",
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
