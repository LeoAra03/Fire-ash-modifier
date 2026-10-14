import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalLoad } from "../web/js/marshal.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtime = fs.readFileSync(path.join(ROOT, "content", "dimensional_nightmare_runtime.rb"), "utf8");
const scriptBase = marshalLoad(fs.readFileSync(path.join(ROOT, "Scripts_corregido", "Scripts.rxdata")));

assert.match(runtime, /def dn_mirror_battle/);
assert.match(runtime, /Pokemon\.new\(source\.species, source\.level, mirror, false\)/);
assert.match(runtime, /source\.moves\.each/);
assert.match(runtime, /copy\.learn_move\(move\.id\)/);
assert.match(runtime, /pbTrainerBattleCore\(mirror\) == 1/);
assert.match(runtime, /setBattleRule\("canLose"\)/);
assert.match(runtime, /def dn_kinggus_final_sequence/);
assert.match(runtime, /dn_registered_boss_battle\(:DN_KINGGUS, "KINGGUS"\)/);
assert.match(runtime, /dn_registered_boss_battle\(:DN_KINGGUS, "EL REY SIN LETRA"\)/);
assert.doesNotMatch(runtime, /\$game_variables\[264\]\s*(?:=(?!=)|\+=|-=|\*=|\/=)/,
  "el runtime no escribe el contador externo de Monte Silver v264");
assert.equal(scriptBase.some((entry) => entry?.[1]?.text === "DN_RuntimeSupport"), false,
  "el helper runtime se añade sólo a la copia Scripts.rxdata del ZIP QA");

const blueprint = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "dimensional_nightmare_events.json"), "utf8"));
const ep05 = blueprint.episodes.find((episode) => episode.key === "EP05");
const ep06 = blueprint.episodes.find((episode) => episode.key === "EP06");
assert.match(ep05?.boss?.notes ?? "", /copia temporal/);
assert.equal(ep06?.boss?.finalForm?.label, "EL REY SIN LETRA");
assert.equal(ep06?.boss?.team?.length, 6);
assert.equal(ep06?.boss?.finalForm?.team?.length, 6);
console.log("Runtime DN: combate espejo no destructivo y forma final de KINGGUS verificados.");
