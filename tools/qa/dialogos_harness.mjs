#!/usr/bin/env node
/**
 * QA ejecutable de PokeMod_Dialogos (cajas de diálogo por personaje).
 *
 * Carga `tools/lib/pokemod_dialogos.rb` en el CRuby/WASM del proyecto y
 * comprueba con el motor Ruby real:
 *   · la sintaxis de la sección completa (incluidos los alias del motor);
 *   · la extracción del hablante (prefijo «Nombre:», etiqueta \sp[Nombre],
 *     nombre del evento, y los falsos positivos que debe ignorar);
 *   · la cola anti-solape (nunca dos cajas a la vez, con liberación en ensure);
 *   · la caja de nombre (creación, posición y disposición con el mensaje).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { ROOT } from "../lib/fire_ash_registry.mjs";

const require = createRequire(import.meta.url);
const SOURCE = path.join(ROOT, "tools", "lib", "pokemod_dialogos.rb");
const wasmCandidates = [
  path.join(ROOT, "node_modules/@ruby/3.3-wasm-wasi/dist/ruby+stdlib.wasm"),
  path.join(ROOT, "node_modules/@ruby/wasm-wasi/dist/ruby+stdlib.wasm"),
];
const wasmPath = wasmCandidates.find((candidate) => fs.existsSync(candidate));
if (!wasmPath) {
  console.error("Falta el runtime Ruby/WASM. Instálalo sin modificar package.json:");
  console.error("  npm i --no-save @ruby/3.3-wasm-wasi");
  process.exit(2);
}
let DefaultRubyVM;
try {
  ({ DefaultRubyVM } = require("@ruby/wasm-wasi/dist/node"));
} catch (error) {
  console.error(`No se pudo cargar @ruby/wasm-wasi: ${error.message}`);
  process.exit(2);
}

const ruby = fs.readFileSync(SOURCE, "utf8");
const { vm } = await DefaultRubyVM(await WebAssembly.compile(fs.readFileSync(wasmPath)));

// Stubs del motor RMXP mínimos para cargar la sección completa (los alias
// necesitan que los métodos originales existan) y para observar la caja.
vm.eval(`
  module Kernel
    def pbMessageDisplay(msgwindow, message, letterbyletter = true, commandProc = nil, &block); $pb_calls ||= []; $pb_calls << message; return nil; end
    def pbCreateMessageWindow(viewport = nil, skin = nil); $pb_windows ||= 0; $pb_windows += 1; return :msgwindow; end
    def pbDisposeMessageWindow(msgwindow); $pb_windows = ($pb_windows || 1) - 1; end
  end
  class Object
    include Kernel
  end
  class Window_AdvancedTextPokemon
    attr_accessor :x, :y, :z, :opacity, :visible, :width, :height, :text
    def initialize(text); @text = text.to_s; @width = 120; @height = 48; @x = 0; @y = 0; @z = 0; @opacity = 255; @visible = false; $cajas ||= []; $cajas << self; end
    def resizeToFit(text, maxwidth); @width = [text.to_s.length * 8 + 24, maxwidth].min; @height = 48; end
    def setSkin(skin); end
    def disposed?; @disposed == true; end
    def dispose; @disposed = true; end
  end
  module MessageConfig
    def self.pbGetSpeechFrame; "frame"; end
  end
  module Graphics
    def self.height; 384; end
    def self.width; 512; end
    def self.update; end
  end
  module Input
    def self.update; end
  end
  class PokeBattle_Scene
    def pbDisplayMessage(msg, brief = false, &block); $battle_calls ||= []; $battle_calls << msg; end
    def pbDisplayPausedMessage(msg, &block); $battle_calls ||= []; $battle_calls << msg; end
    def initialize; @sprites = { "messageWindow" => Window_AdvancedTextPokemon.new("") }; end
    def sprites; @sprites; end
  end
  class FakeEvent
    attr_reader :name
    def initialize(name); @name = name; end
  end
  class FakeMap
    def initialize(events); @events = events; end
    def events; @events; end
  end
`);

try {
  vm.eval(ruby);
} catch (error) {
  console.error("FALLO: PokeModDialogos no carga en el motor Ruby:");
  console.error(String(error));
  process.exit(1);
}

const run = (code) => JSON.parse(vm.eval(`require 'json'; JSON.generate(begin; ${code}; end)`).toString());

// ── 1. Extracción del hablante ────────────────────────────────────────────
assert.deepEqual(run(`
  h, t = PokeModDialogos.dividir("Arceus: «¿Contarlos? Imposible.»")
  [h, t]
`), ["Arceus", "«¿Contarlos? Imposible.»"], "prefijo «Nombre:»");

assert.deepEqual(run(`
  h, t = PokeModDialogos.dividir("\\\\sp[Maxine] Bienvenida a Teckel.")
  [h, t]
`), ["Maxine", "Bienvenida a Teckel."], "etiqueta \\\\sp[Nombre]");

assert.deepEqual(run(`
  h, t = PokeModDialogos.dividir("Rotom del Tiempo — El fragmento arde.")
  [h, t]
`), ["Rotom del Tiempo", "El fragmento arde."], "prefijo con raya (máx. 4 palabras)");

assert.equal(run(`
  PokeModDialogos.dividir("Ash se pone el uniforme — nadie lo mira dos veces.")[0]
`), null, "la narración con raya no es un hablante");

assert.equal(run(`
  PokeModDialogos.dividir("12:30 sale el barco.")[0]
`), null, "las horas no son un hablante");

assert.equal(run(`
  PokeModDialogos.dividir("PokeMod: evento interno.")[0]
`), null, "los marcadores de herramientas no son un hablante");

assert.deepEqual(run(`
  $game_map = FakeMap.new({ 7 => FakeEvent.new("Norbert") })
  class Probe
    def initialize(id); @event_id = id; end
    def call; return PokeModDialogos.dividir("Toma. Talla única.", self); end
  end
  Probe.new(7).call
`), ["Norbert", "Toma. Talla única."], "el nombre del evento habla cuando no hay prefijo");

assert.equal(run(`
  $game_map = FakeMap.new({ 8 => FakeEvent.new("Warp tile 2") })
  class Probe2
    def initialize(id); @event_id = id; end
    def call; return PokeModDialogos.dividir("Zas.", self)[0]; end
  end
  Probe2.new(8).call
`), null, "los eventos técnicos no dan nombre de hablante");

// ── 2. Cola anti-solape (estado del contador) ────────────────────────────
run(`
  $pb_windows = 0
  PokeModDialogos.salir rescue nil
  w1 = pbCreateMessageWindow
  $estado_tras_crear = PokeModDialogos.ocupado?
`);
assert.equal(run("$estado_tras_crear"), true, "con un mensaje abierto la cola queda ocupada");
run("pbDisposeMessageWindow(nil); $estado_tras_cerrar = PokeModDialogos.ocupado?");
assert.equal(run("$estado_tras_cerrar"), false, "al cerrar el mensaje la cola queda libre");

// ── 3. Caja por personaje en el flujo pbMessageDisplay ───────────────────
run(`
  msgw = Window_AdvancedTextPokemon.new("")
  $cajas = []
  $pb_calls = []
  pbMessageDisplay(msgw, "Arceus: «Prueba.»", true, nil)
`);
assert.deepEqual(run("$pb_calls"), ["«Prueba.»"], "el texto llega sin el prefijo del hablante");
assert.equal(run("$cajas.length"), 1, "se crea una caja de nombre");
assert.equal(run("$cajas[0].text"), "Arceus", "la caja lleva el nombre del hablante");
assert.equal(run("$cajas[0].disposed?"), true, "la caja se cierra con el mensaje");

// ── 4. Combate: misma caja por personaje ─────────────────────────────────
run(`
  $battle_calls = []
  scene = PokeBattle_Scene.new
  scene.pbDisplayPausedMessage("Arceus: «¿Contarlos?»")
`);
assert.deepEqual(run("$battle_calls"), ["«¿Contarlos?»"], "el combate también descubre al hablante");

console.log("OK: PokeModDialogos verificado en el motor Ruby (hablante, cola anti-solape, cajas y combate).");
