import fs from "node:fs";
import path from "node:path";
import { marshalLoad } from "../../web/js/marshal.js";
import { cmdOf, parseEvent, parseMap, rstr, visibleWidth } from "../../web/js/rmxp.js";

export const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
export const GAME = path.join(ROOT, "pokemon_fire_ash");
export const DATA = path.join(GAME, "Data");
export const BOX_COLUMNS = 53;
export const BOX_LINES = 2;

let cachedContext = null;

function mapFile(id) {
  return `Map${String(id).padStart(3, "0")}.rxdata`;
}

function cleanText(value) {
  return rstr(value)
    .replace(/\\(?:sp|v|c|ch|f|p|n|wt|wtnp|l)\[[^\]]*\]/gi, "")
    .replace(/\\(?:PN|n|b|r|pg|wt|!|\.|,|\^)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractScriptMessages(ruby) {
  const out = [];
  for (const match of String(ruby).matchAll(/pbMessage(?:Display)?\([^"]*"((?:[^"\\]|\\.)*)"/g)) {
    out.push(match[1].replace(/\\"/g, '"'));
  }
  return out;
}

export function loadTasksRange(taskStart, taskEnd) {
  const lines = fs.readFileSync(path.join(ROOT, "tareas.txt"), "utf8").split(/\r?\n/);
  const tasks = [];
  const fileLineSlice = [];
  lines.forEach((rawLine, idx) => {
    const fileLine = idx + 1;
    const match = /^(\d+)\.\s+(.*)$/.exec(rawLine.trim());
    if (!match) return;
    const item = { fileLine, id: Number(match[1]), text: match[2] };
    if (item.id >= taskStart && item.id <= taskEnd) tasks.push(item);
    if (fileLine >= taskStart && fileLine <= taskEnd) fileLineSlice.push(item);
  });
  return { tasks, fileLineSlice };
}

export function parseTaskSpec(task) {
  const text = task.text;
  const rangeMatch = /mapas (\d+)[–-](\d+) «([^»]+)»/.exec(text);
  const singleMatch = /el mapa (\d+) «([^»]+)» «([^»]+)»/.exec(text);
  const from = rangeMatch ? Number(rangeMatch[1]) : singleMatch ? Number(singleMatch[1]) : null;
  const to = rangeMatch ? Number(rangeMatch[2]) : singleMatch ? Number(singleMatch[1]) : null;
  const declaredFamily = rangeMatch ? rangeMatch[3] : singleMatch ? singleMatch[3] : null;
  const declaredMapName = singleMatch ? singleMatch[2] : null;
  const isPart = /\(parte\)/.test(text);
  const requiresHumanReading = /lectura humana/i.test(text);

  let kind = "other";
  let aspect = null;
  if (text.includes("en su página final con el estado avanzado")) {
    kind = "eventos_pagina_final";
  } else if (text.startsWith("Comprobar que las ramas de los eventos")) {
    kind = "ramas_control_estado";
  } else if (text.startsWith("Mostrar y comprobar los diálogos")) {
    kind = "dialogos_revision";
    const aspectMatch = /:\s*([^.]+)\./.exec(text);
    aspect = aspectMatch ? aspectMatch[1].trim() : "general";
  }
  return {
    id: task.id,
    fileLine: task.fileLine,
    text,
    kind,
    from,
    to,
    declaredFamily,
    declaredMapName,
    isPart,
    aspect,
    requiresHumanReading,
  };
}

export function getAuditContext() {
  if (cachedContext) return cachedContext;
  const rawInfos = marshalLoad(new Uint8Array(fs.readFileSync(path.join(DATA, "MapInfos.rxdata"))));
  const mapInfos = new Map();
  for (const [id, info] of rawInfos.pairs ?? []) {
    const mapId = Number(id);
    if (fs.existsSync(path.join(DATA, mapFile(mapId)))) {
      mapInfos.set(mapId, rstr(info.getIvar("@name") ?? info.getIvar("name")));
    }
  }
  const system = marshalLoad(new Uint8Array(fs.readFileSync(path.join(DATA, "System.rxdata"))));
  const switches = (system.getIvar("@switches") ?? []).map(rstr);
  const variables = (system.getIvar("@variables") ?? []).map(rstr);
  const mapCache = new Map();

  function getAnalyzedMap(mapId) {
    if (mapCache.has(mapId)) return mapCache.get(mapId);
    if (!mapInfos.has(mapId)) return null;
    const raw = marshalLoad(new Uint8Array(fs.readFileSync(path.join(DATA, mapFile(mapId)))));
    const parsed = parseMap(raw);
    const events = parsed.events.map((entry) => parseEvent(entry.obj));
    const record = {
      id: mapId,
      name: mapInfos.get(mapId) ?? "",
      width: parsed.width,
      height: parsed.height,
      tilesetId: parsed.tilesetId,
      events,
    };
    mapCache.set(mapId, record);
    return record;
  }

  cachedContext = { mapInfos, switches, variables, getAnalyzedMap };
  return cachedContext;
}

function assembleDialogueBlocks(commands) {
  const blocks = [];
  let current = null;
  const flush = () => {
    if (current === null) return;
    const joined = [current.first, ...current.continuations].filter(Boolean).join(" ").trim();
    const lines = joined.split(/\\n|\n/);
    const maxCols = lines.reduce((max, line) => Math.max(max, visibleWidth(line)), 0);
    blocks.push({
      text: joined,
      clean: cleanText(joined),
      lines: lines.length,
      maxCols,
      continuations: current.continuations.length,
    });
    current = null;
  };
  for (const cmd of commands) {
    if (cmd.code === 101) {
      flush();
      current = { first: rstr(cmd.params[0]), continuations: [] };
    } else if (cmd.code === 401) {
      if (current === null) current = { first: "", continuations: [] };
      current.continuations.push(rstr(cmd.params[0]));
    } else {
      flush();
    }
  }
  flush();
  return blocks;
}

export function auditFinalPageMap(mapId, ctx = getAuditContext()) {
  const map = ctx.getAnalyzedMap(mapId);
  if (!map) return null;

  let eventsCount = 0;
  let multiPageEvents = 0;
  let conditionedFinalPages = 0;
  let switchesRead = 0;
  let variablesRead = 0;
  let selfSwitchesRead = 0;
  let switchesWritten = 0;
  let variablesWritten = 0;
  let selfSwitchesWritten = 0;
  let unnamedSwitches = 0;
  let unnamedVariables = 0;
  let invalidFlags = 0;
  let pagesEndingCleanly = 0;
  let autorunOrParallel = 0;
  let unreleasedAutorun = 0;
  let transfersTotal = 0;
  let invalidTransfers = 0;
  let dialogueBlocks = 0;
  let scriptMessages = 0;
  let wideLines = 0;
  let replacementChars = 0;
  const findings = [];

  for (const ev of map.events) {
    eventsCount++;
    if (ev.pages.length === 0) continue;
    if (ev.pages.length > 1) multiPageEvents++;
    const finalPage = ev.pages[ev.pages.length - 1];
    const cond = finalPage.condition ?? {};
    const condFlags = [];
    if (cond.switch1Valid) {
      switchesRead++;
      condFlags.push(`s:${cond.switch1Id}`);
      if (cond.switch1Id <= 0) invalidFlags++;
      else if (!ctx.switches[cond.switch1Id]) unnamedSwitches++;
    }
    if (cond.switch2Valid) {
      switchesRead++;
      condFlags.push(`s:${cond.switch2Id}`);
      if (cond.switch2Id <= 0) invalidFlags++;
      else if (!ctx.switches[cond.switch2Id]) unnamedSwitches++;
    }
    if (cond.variableValid) {
      variablesRead++;
      condFlags.push(`v:${cond.variableId}>=${cond.variableValue}`);
      if (cond.variableId <= 0) invalidFlags++;
      else if (!ctx.variables[cond.variableId]) unnamedVariables++;
    }
    if (cond.selfSwitchValid) {
      selfSwitchesRead++;
      condFlags.push(`self:${cond.selfSwitchCh}`);
    }
    if (condFlags.length > 0) conditionedFinalPages++;

    const cmds = finalPage.list.map(cmdOf);
    const endsWithZero = cmds.length > 0 && cmds[cmds.length - 1].code === 0;
    if (endsWithZero) pagesEndingCleanly++;
    else findings.push({ eventId: ev.id, event: ev.name, type: "missing-end-code" });

    let releasesControl = false;
    for (const cmd of cmds) {
      if (cmd.code === 111) {
        const branchKind = Number(cmd.params[0]);
        if (branchKind === 0) switchesRead++;
        else if (branchKind === 1) variablesRead++;
        else if (branchKind === 2) selfSwitchesRead++;
      } else if (cmd.code === 121) {
        const a = Number(cmd.params[0]);
        const b = Number(cmd.params[1]);
        for (let s = a; s <= b; s++) {
          switchesWritten++;
          if (s <= 0) invalidFlags++;
          else if (!ctx.switches[s]) unnamedSwitches++;
        }
        releasesControl = true;
      } else if (cmd.code === 122) {
        const a = Number(cmd.params[0]);
        const b = Number(cmd.params[1]);
        for (let v = a; v <= b; v++) {
          variablesWritten++;
          if (v <= 0) invalidFlags++;
          else if (!ctx.variables[v]) unnamedVariables++;
        }
        releasesControl = true;
      } else if (cmd.code === 123) {
        selfSwitchesWritten++;
        releasesControl = true;
      } else if (cmd.code === 124 || cmd.code === 214 || cmd.code === 115) {
        releasesControl = true;
      } else if (cmd.code === 201) {
        transfersTotal++;
        releasesControl = true;
        const mode = Number(cmd.params[0]);
        const targetMap = Number(cmd.params[1]);
        const tx = Number(cmd.params[2]);
        const ty = Number(cmd.params[3]);
        if (mode === 0) {
          const dest = ctx.getAnalyzedMap(targetMap);
          if (!dest || tx < 0 || ty < 0 || tx >= dest.width || ty >= dest.height) {
            invalidTransfers++;
            findings.push({ eventId: ev.id, event: ev.name, type: "invalid-transfer", targetMap, tx, ty });
          }
        }
      } else if (cmd.code === 355 || cmd.code === 655) {
        const src = cmd.params.map(rstr).join(" ");
        for (const msg of extractScriptMessages(src)) {
          scriptMessages++;
          if (/[□]/.test(msg)) replacementChars++;
        }
        if (/pbTransfer|pbWarp|\$game_switches|\$game_variables|\$game_self_switches|pbExclaim/i.test(src)) {
          releasesControl = true;
        }
      }
    }

    if (finalPage.trigger === 3 || finalPage.trigger === 4) {
      autorunOrParallel++;
      if (!releasesControl) {
        unreleasedAutorun++;
        findings.push({ eventId: ev.id, event: ev.name, type: "autorun-or-parallel-without-release", trigger: finalPage.trigger });
      }
    }

    const blocks = assembleDialogueBlocks(cmds);
    dialogueBlocks += blocks.length;
    for (const block of blocks) {
      if (block.maxCols > BOX_COLUMNS) wideLines++;
      if (/[□]/.test(block.text)) replacementChars++;
    }
  }

  return {
    mapId,
    name: map.name,
    events: eventsCount,
    multiPageEvents,
    conditionedFinalPages,
    banderas: {
      switchesRead,
      variablesRead,
      selfSwitchesRead,
      switchesWritten,
      variablesWritten,
      selfSwitchesWritten,
      unnamedSwitches,
      unnamedVariables,
      invalidFlags,
    },
    salidas: {
      pagesEndingCleanly,
      autorunOrParallel,
      unreleasedAutorun,
      transfersTotal,
      invalidTransfers,
    },
    textos: {
      dialogueBlocks,
      scriptMessages,
      wideLines,
      replacementChars,
    },
    findings: findings.slice(0, 10),
    status: invalidFlags > 0 || invalidTransfers > 0 ? "fail" : unreleasedAutorun > 0 || wideLines > 0 ? "static_review_runtime_pending" : "static_pass_runtime_pending",
  };
}

export function auditBranchesMap(mapId, ctx = getAuditContext()) {
  const map = ctx.getAnalyzedMap(mapId);
  if (!map) return null;

  let eventsCount = 0;
  let pagesCount = 0;
  let conditionalBranches = 0;
  let elseBranches = 0;
  let choiceBlocks = 0;
  let choiceWhenBranches = 0;
  let choiceCancelBranches = 0;
  let loops = 0;
  let loopBreaks = 0;
  let labels = 0;
  let labelJumps = 0;
  let unbalancedConditionals = 0;
  let unbalancedChoices = 0;
  let loopsWithoutBreak = 0;
  let backwardLabelJumps = 0;
  let pagesWithoutEnd = 0;
  let unreleasedAutorunPages = 0;
  let invalidTransfers = 0;
  let invalidStateWrites = 0;
  let contradictoryBranchWrites = 0;
  const findings = [];

  for (const ev of map.events) {
    eventsCount++;
    for (let pageIdx = 0; pageIdx < ev.pages.length; pageIdx++) {
      pagesCount++;
      const page = ev.pages[pageIdx];
      const cmds = page.list.map(cmdOf);
      if (cmds.length === 0 || cmds[cmds.length - 1].code !== 0) {
        pagesWithoutEnd++;
        findings.push({ eventId: ev.id, event: ev.name, page: pageIdx + 1, type: "missing-end-code" });
      }

      let condOpen = 0;
      let condClose = 0;
      let choiceOpen = 0;
      let choiceClose = 0;
      let loopDepth = 0;
      let currentLoopHasExit = false;
      const seenLabels = new Set();
      let releasesControl = false;
      const branchSwitchWrites = new Map();

      for (let i = 0; i < cmds.length; i++) {
        const cmd = cmds[i];
        const code = cmd.code;
        if (code === 111) {
          conditionalBranches++;
          condOpen++;
        } else if (code === 411) {
          elseBranches++;
        } else if (code === 412) {
          condClose++;
        } else if (code === 102) {
          choiceBlocks++;
          choiceOpen++;
        } else if (code === 402) {
          choiceWhenBranches++;
        } else if (code === 403) {
          choiceCancelBranches++;
        } else if (code === 404) {
          choiceClose++;
        } else if (code === 112) {
          loops++;
          loopDepth++;
          currentLoopHasExit = false;
        } else if (code === 113) {
          loopBreaks++;
          currentLoopHasExit = true;
        } else if (code === 413) {
          if (loopDepth > 0 && !currentLoopHasExit) {
            loopsWithoutBreak++;
            findings.push({ eventId: ev.id, event: ev.name, page: pageIdx + 1, type: "loop-without-break" });
          }
          loopDepth = Math.max(0, loopDepth - 1);
        } else if (code === 118) {
          labels++;
          seenLabels.add(rstr(cmd.params[0]));
        } else if (code === 119) {
          labelJumps++;
          const targetLabel = rstr(cmd.params[0]);
          if (seenLabels.has(targetLabel)) {
            backwardLabelJumps++;
          }
          if (loopDepth > 0) currentLoopHasExit = true;
        } else if (code === 115) {
          releasesControl = true;
          if (loopDepth > 0) currentLoopHasExit = true;
        } else if (code === 121) {
          const a = Number(cmd.params[0]);
          const b = Number(cmd.params[1]);
          const val = Number(cmd.params[2]);
          for (let s = a; s <= b; s++) {
            if (s <= 0) invalidStateWrites++;
            const scopeKey = `${condOpen}:${choiceOpen}:${s}`;
            if (branchSwitchWrites.has(scopeKey) && branchSwitchWrites.get(scopeKey) !== val) {
              contradictoryBranchWrites++;
            }
            branchSwitchWrites.set(scopeKey, val);
          }
          releasesControl = true;
        } else if (code === 122) {
          const a = Number(cmd.params[0]);
          const b = Number(cmd.params[1]);
          if (a <= 0 || b < a) invalidStateWrites++;
          releasesControl = true;
        } else if (code === 123) {
          releasesControl = true;
        } else if (code === 124 || code === 214) {
          releasesControl = true;
          if (loopDepth > 0) currentLoopHasExit = true;
        } else if (code === 201) {
          releasesControl = true;
          if (loopDepth > 0) currentLoopHasExit = true;
          const mode = Number(cmd.params[0]);
          const targetMap = Number(cmd.params[1]);
          const tx = Number(cmd.params[2]);
          const ty = Number(cmd.params[3]);
          if (mode === 0) {
            const dest = ctx.getAnalyzedMap(targetMap);
            if (!dest || tx < 0 || ty < 0 || tx >= dest.width || ty >= dest.height) {
              invalidTransfers++;
              findings.push({ eventId: ev.id, event: ev.name, page: pageIdx + 1, type: "invalid-branch-transfer", targetMap, tx, ty });
            }
          }
        } else if (code === 355 || code === 655) {
          releasesControl = true;
          if (loopDepth > 0) currentLoopHasExit = true;
        }
      }

      if (condOpen !== condClose) {
        unbalancedConditionals++;
        findings.push({ eventId: ev.id, event: ev.name, page: pageIdx + 1, type: "unbalanced-conditional", condOpen, condClose });
      }
      if (choiceOpen !== choiceClose) {
        unbalancedChoices++;
        findings.push({ eventId: ev.id, event: ev.name, page: pageIdx + 1, type: "unbalanced-choice", choiceOpen, choiceClose });
      }
      if ((page.trigger === 3 || page.trigger === 4) && !releasesControl && cmds.length > 1) {
        unreleasedAutorunPages++;
        findings.push({ eventId: ev.id, event: ev.name, page: pageIdx + 1, type: "autorun-without-release", trigger: page.trigger });
      }
    }
  }

  return {
    mapId,
    name: map.name,
    events: eventsCount,
    pages: pagesCount,
    control: {
      conditionalBranches,
      elseBranches,
      choiceBlocks,
      choiceWhenBranches,
      choiceCancelBranches,
      loops,
      loopBreaks,
      labels,
      labelJumps,
      backwardLabelJumps,
      unbalancedConditionals,
      unbalancedChoices,
      loopsWithoutBreak,
      pagesWithoutEnd,
      unreleasedAutorunPages,
    },
    stateCoherence: {
      invalidTransfers,
      invalidStateWrites,
      contradictoryBranchWrites,
    },
    findings: findings.slice(0, 10),
    status:
      pagesWithoutEnd > 0 || unbalancedChoices > 0 || invalidTransfers > 0 || invalidStateWrites > 0
        ? "fail"
        : unbalancedConditionals > 0 || loopsWithoutBreak > 0 || unreleasedAutorunPages > 0 || backwardLabelJumps > 0
          ? "static_review_runtime_pending"
          : "static_pass_runtime_pending",
  };
}

export function auditDialoguesMap(mapId, aspect = "general", ctx = getAuditContext()) {
  const map = ctx.getAnalyzedMap(mapId);
  if (!map) return null;

  let eventsWithDialogue = 0;
  let totalBlocks = 0;
  let scriptMessagesCount = 0;
  let overflowLines = 0;
  let overTwoLines = 0;
  let missingOpeningQuestion = 0;
  let missingOpeningExclamation = 0;
  let unbalancedQuotes = 0;
  let englishTokens = 0;
  let glossaryHits = 0;
  let variableTokens = 0;
  let playerNameTokens = 0;
  let numericTokens = 0;
  let invalidVariableRefs = 0;
  const samples = [];

  const englishRe = /\b(?:the|and|you|your|welcome|hello|battle|route|city|town|please|choose|yes|no)\b/i;
  const glossaryRe = /\b(?:Ash|Pikachu|Oak|Kanto|Johto|Hoenn|Sinnoh|Unova|Kalos|Alola|Galar|Arceus|Liga|Gimnasio|Medalla| Centro Pokémon|Poké|Ruta|Ciudad|Pueblo)\b/i;

  for (const ev of map.events) {
    let evHasDialogue = false;
    for (let pageIdx = 0; pageIdx < ev.pages.length; pageIdx++) {
      const cmds = ev.pages[pageIdx].list.map(cmdOf);
      const blocks = assembleDialogueBlocks(cmds);
      for (const block of blocks) {
        if (!block.text) continue;
        evHasDialogue = true;
        totalBlocks++;
        if (samples.length < 4) {
          samples.push({ eventId: ev.id, event: ev.name, page: pageIdx + 1, text: block.text.slice(0, 140), maxCols: block.maxCols, lines: block.lines });
        }
        if (block.maxCols > BOX_COLUMNS) overflowLines++;
        if (block.lines > BOX_LINES) overTwoLines++;
        if (/\?/.test(block.clean) && !/¿/.test(block.clean)) missingOpeningQuestion++;
        if (/!/.test(block.clean) && !/¡/.test(block.clean)) missingOpeningExclamation++;
        const doubleQuotes = (block.clean.match(/"/g) ?? []).length;
        if (doubleQuotes % 2 !== 0) unbalancedQuotes++;
        if (englishRe.test(block.clean)) englishTokens++;
        if (glossaryRe.test(block.clean)) glossaryHits++;
        if (/\\PN|\\p\[0\]/i.test(block.text)) playerNameTokens++;
        if (/\b\d+\b/.test(block.clean)) numericTokens++;
        for (const vm of block.text.matchAll(/\\v\[(\d+)\]/gi)) {
          variableTokens++;
          const vid = Number(vm[1]);
          if (vid <= 0 || vid >= ctx.variables.length) invalidVariableRefs++;
        }
      }
      for (const cmd of cmds) {
        if (cmd.code === 355 || cmd.code === 655) {
          for (const msg of extractScriptMessages(cmd.params.map(rstr).join(" "))) {
            evHasDialogue = true;
            scriptMessagesCount++;
            if (samples.length < 4) {
              samples.push({ eventId: ev.id, event: ev.name, page: pageIdx + 1, text: msg.slice(0, 140), maxCols: visibleWidth(msg), lines: 1 });
            }
          }
        }
      }
    }
    if (evHasDialogue) eventsWithDialogue++;
  }

  return {
    mapId,
    name: map.name,
    aspect,
    eventsWithDialogue,
    totalBlocks,
    scriptMessagesCount,
    metrics: {
      boxFormat: { overflowLines, overTwoLines, boxColumns: BOX_COLUMNS, boxLines: BOX_LINES },
      punctuation: { missingOpeningQuestion, missingOpeningExclamation, unbalancedQuotes },
      languageAndGlossary: { englishTokens, glossaryHits },
      variablesAndNumbers: { playerNameTokens, variableTokens, numericTokens, invalidVariableRefs },
    },
    samples,
    status: invalidVariableRefs > 0 ? "fail" : "static_measured_manual_reading_pending",
  };
}

export function evaluateTask(task, ctx = getAuditContext()) {
  const spec = parseTaskSpec(task);
  const existingMapIds = [];
  for (let id = spec.from; id <= spec.to; id++) {
    if (ctx.mapInfos.has(id)) existingMapIds.push(id);
  }

  if (spec.kind === "eventos_pagina_final") {
    const maps = existingMapIds.map((id) => auditFinalPageMap(id, ctx));
    const totals = maps.reduce(
      (acc, m) => {
        acc.maps++;
        acc.events += m.events;
        acc.multiPageEvents += m.multiPageEvents;
        acc.conditionedFinalPages += m.conditionedFinalPages;
        acc.switchesRead += m.banderas.switchesRead;
        acc.variablesRead += m.banderas.variablesRead;
        acc.selfSwitchesRead += m.banderas.selfSwitchesRead;
        acc.switchesWritten += m.banderas.switchesWritten;
        acc.variablesWritten += m.banderas.variablesWritten;
        acc.selfSwitchesWritten += m.banderas.selfSwitchesWritten;
        acc.unnamedSwitches += m.banderas.unnamedSwitches;
        acc.unnamedVariables += m.banderas.unnamedVariables;
        acc.invalidFlags += m.banderas.invalidFlags;
        acc.pagesEndingCleanly += m.salidas.pagesEndingCleanly;
        acc.autorunOrParallel += m.salidas.autorunOrParallel;
        acc.unreleasedAutorun += m.salidas.unreleasedAutorun;
        acc.transfersTotal += m.salidas.transfersTotal;
        acc.invalidTransfers += m.salidas.invalidTransfers;
        acc.dialogueBlocks += m.textos.dialogueBlocks;
        acc.scriptMessages += m.textos.scriptMessages;
        acc.wideLines += m.textos.wideLines;
        acc.replacementChars += m.textos.replacementChars;
        return acc;
      },
      {
        maps: 0,
        events: 0,
        multiPageEvents: 0,
        conditionedFinalPages: 0,
        switchesRead: 0,
        variablesRead: 0,
        selfSwitchesRead: 0,
        switchesWritten: 0,
        variablesWritten: 0,
        selfSwitchesWritten: 0,
        unnamedSwitches: 0,
        unnamedVariables: 0,
        invalidFlags: 0,
        pagesEndingCleanly: 0,
        autorunOrParallel: 0,
        unreleasedAutorun: 0,
        transfersTotal: 0,
        invalidTransfers: 0,
        dialogueBlocks: 0,
        scriptMessages: 0,
        wideLines: 0,
        replacementChars: 0,
      }
    );
    const findings = maps.flatMap((m) => m.findings.map((f) => ({ mapId: m.mapId, ...f }))).slice(0, 20);
    return {
      id: spec.id,
      fileLine: spec.fileLine,
      kind: spec.kind,
      range: [spec.from, spec.to],
      declaredFamily: spec.declaredFamily,
      mapIds: existingMapIds,
      totals,
      findings,
      status: totals.invalidFlags > 0 || totals.invalidTransfers > 0 ? "fail" : totals.unreleasedAutorun > 0 || totals.wideLines > 0 ? "static_review_runtime_pending" : "static_pass_runtime_pending",
    };
  }

  if (spec.kind === "ramas_control_estado") {
    const maps = existingMapIds.map((id) => auditBranchesMap(id, ctx));
    const totals = maps.reduce(
      (acc, m) => {
        acc.maps++;
        acc.events += m.events;
        acc.pages += m.pages;
        acc.conditionalBranches += m.control.conditionalBranches;
        acc.elseBranches += m.control.elseBranches;
        acc.choiceBlocks += m.control.choiceBlocks;
        acc.choiceWhenBranches += m.control.choiceWhenBranches;
        acc.choiceCancelBranches += m.control.choiceCancelBranches;
        acc.loops += m.control.loops;
        acc.loopBreaks += m.control.loopBreaks;
        acc.labels += m.control.labels;
        acc.labelJumps += m.control.labelJumps;
        acc.backwardLabelJumps += m.control.backwardLabelJumps;
        acc.unbalancedConditionals += m.control.unbalancedConditionals;
        acc.unbalancedChoices += m.control.unbalancedChoices;
        acc.loopsWithoutBreak += m.control.loopsWithoutBreak;
        acc.pagesWithoutEnd += m.control.pagesWithoutEnd;
        acc.unreleasedAutorunPages += m.control.unreleasedAutorunPages;
        acc.invalidTransfers += m.stateCoherence.invalidTransfers;
        acc.invalidStateWrites += m.stateCoherence.invalidStateWrites;
        acc.contradictoryBranchWrites += m.stateCoherence.contradictoryBranchWrites;
        return acc;
      },
      {
        maps: 0,
        events: 0,
        pages: 0,
        conditionalBranches: 0,
        elseBranches: 0,
        choiceBlocks: 0,
        choiceWhenBranches: 0,
        choiceCancelBranches: 0,
        loops: 0,
        loopBreaks: 0,
        labels: 0,
        labelJumps: 0,
        backwardLabelJumps: 0,
        unbalancedConditionals: 0,
        unbalancedChoices: 0,
        loopsWithoutBreak: 0,
        pagesWithoutEnd: 0,
        unreleasedAutorunPages: 0,
        invalidTransfers: 0,
        invalidStateWrites: 0,
        contradictoryBranchWrites: 0,
      }
    );
    const findings = maps.flatMap((m) => m.findings.map((f) => ({ mapId: m.mapId, ...f }))).slice(0, 20);
    return {
      id: spec.id,
      fileLine: spec.fileLine,
      kind: spec.kind,
      range: [spec.from, spec.to],
      declaredFamily: spec.declaredFamily,
      mapIds: existingMapIds,
      totals,
      findings,
      status:
        totals.pagesWithoutEnd > 0 || totals.unbalancedChoices > 0 || totals.invalidTransfers > 0 || totals.invalidStateWrites > 0
          ? "fail"
          : totals.unbalancedConditionals > 0 || totals.loopsWithoutBreak > 0 || totals.unreleasedAutorunPages > 0 || totals.backwardLabelJumps > 0
            ? "static_review_runtime_pending"
            : "static_pass_runtime_pending",
    };
  }

  if (spec.kind === "dialogos_revision") {
    const maps = existingMapIds.map((id) => auditDialoguesMap(id, spec.aspect, ctx));
    const totals = maps.reduce(
      (acc, m) => {
        acc.maps++;
        acc.eventsWithDialogue += m.eventsWithDialogue;
        acc.totalBlocks += m.totalBlocks;
        acc.scriptMessagesCount += m.scriptMessagesCount;
        acc.overflowLines += m.metrics.boxFormat.overflowLines;
        acc.overTwoLines += m.metrics.boxFormat.overTwoLines;
        acc.missingOpeningQuestion += m.metrics.punctuation.missingOpeningQuestion;
        acc.missingOpeningExclamation += m.metrics.punctuation.missingOpeningExclamation;
        acc.unbalancedQuotes += m.metrics.punctuation.unbalancedQuotes;
        acc.englishTokens += m.metrics.languageAndGlossary.englishTokens;
        acc.glossaryHits += m.metrics.languageAndGlossary.glossaryHits;
        acc.playerNameTokens += m.metrics.variablesAndNumbers.playerNameTokens;
        acc.variableTokens += m.metrics.variablesAndNumbers.variableTokens;
        acc.numericTokens += m.metrics.variablesAndNumbers.numericTokens;
        acc.invalidVariableRefs += m.metrics.variablesAndNumbers.invalidVariableRefs;
        return acc;
      },
      {
        maps: 0,
        eventsWithDialogue: 0,
        totalBlocks: 0,
        scriptMessagesCount: 0,
        overflowLines: 0,
        overTwoLines: 0,
        missingOpeningQuestion: 0,
        missingOpeningExclamation: 0,
        unbalancedQuotes: 0,
        englishTokens: 0,
        glossaryHits: 0,
        playerNameTokens: 0,
        variableTokens: 0,
        numericTokens: 0,
        invalidVariableRefs: 0,
      }
    );
    const samples = maps.flatMap((m) => m.samples.map((s) => ({ mapId: m.mapId, mapName: m.name, ...s }))).slice(0, 6);
    return {
      id: spec.id,
      fileLine: spec.fileLine,
      kind: spec.kind,
      range: [spec.from, spec.to],
      declaredFamily: spec.declaredFamily,
      declaredMapName: spec.declaredMapName,
      isPart: spec.isPart,
      aspect: spec.aspect,
      requiresHumanReading: spec.requiresHumanReading,
      mapIds: existingMapIds,
      totals,
      samples,
      status: totals.invalidVariableRefs > 0 ? "fail" : "static_measured_manual_reading_pending",
    };
  }

  return { id: spec.id, fileLine: spec.fileLine, kind: spec.kind, text: spec.text, status: "manual_pending" };
}
