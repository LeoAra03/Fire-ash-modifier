/**
 * rom_campaign_painter.mjs — pintor estructural de los mapas de campaña ROM.
 *
 * Convierte las filas de estilo del plano (`visualRows` de
 * content/rom_campaigns_complete.json) en el suelo y los acentos de cada mapa,
 * muestreando un único mapa donante de Fire Ash (tileset 1) por mapa.
 *
 * Lo comparten el instalador (tools/apply_complete_rom_campaigns.mjs) y la
 * auditoría de filas de estilo (tools/audit_visual_rows.mjs), para que lo que
 * se audita sea exactamente lo que se pinta.
 */
import { tableGet } from "../../web/js/rmxp.js";
import { TileCanvas, loadSourceMap, tilesets } from "./map_painter.mjs";

/** Pasabilidad del tileset 1 (exterior), el único que usa este pintor. */
export function passagesTileset1() {
  return tilesets().get(1)?.passages?.data ?? [];
}

/**
 * Teselas de suelo transitable (capa 0, pasabilidad 0) de un donante con su
 * número de celdas, de la más a la menos frecuente: [[tesela, celdas], …].
 */
export function floorCounts(donorId, passages = passagesTileset1()) {
  const donor = loadSourceMap(donorId);
  const count = new Map();
  for (let y = 0; y < donor.height; y += 1) for (let x = 0; x < donor.width; x += 1) {
    const tile = tableGet(donor.table, x, y, 0);
    if (tile && (passages[tile] ?? 0) === 0) count.set(tile, (count.get(tile) ?? 0) + 1);
  }
  return [...count.entries()].sort((a, b) => b[1] - a[1]);
}

/**
 * Suelos transitables de cada donante, ordenados del más al menos frecuente.
 * Es la reserva con la que se rellena una celda cuando la muestra del donante
 * no es transitable.
 */
export function floorPalette(donorIds) {
  const passages = passagesTileset1();
  const result = new Map();
  for (const id of donorIds) {
    const floors = floorCounts(id, passages).map(([tile]) => tile);
    if (!floors.length) throw new Error(`El donante Map${id} no tiene suelo transitable de tileset 1`);
    result.set(id, floors);
  }
  return { passages, result };
}

/**
 * Tamaño pintado: las dimensiones del ROM, ampliadas sólo si hace falta sitio
 * para colocar todos los eventos sin solaparlos (y nunca por debajo de 8×8).
 */
export function paintedSize(blueprint) {
  const desiredEvents = blueprint.npcs.length + blueprint.warps.length + 6;
  const minSide = Math.ceil(Math.sqrt(desiredEvents)) + 4;
  return {
    width: Math.max(blueprint.dimensions.width, minSide, 8),
    height: Math.max(blueprint.dimensions.height, minSide, 8),
  };
}

/**
 * Pinta un mapa fila a fila. La fila y usa visualRows[y % visualRows.length]:
 * su `floorPhase` desplaza la ventana de muestreo del donante y `accentEvery`
 * fija cada cuántas columnas se copian acentos transitables (capas 1 y 2).
 */
export function paintMap(campaign, blueprint, palette) {
  const { width, height } = paintedSize(blueprint);
  const canvas = new TileCanvas(width, height, 1);
  for (let y = 0; y < height; y += 1) {
    const row = blueprint.visualRows[y % blueprint.visualRows.length];
    const donor = loadSourceMap(row.donorMapId);
    const floors = palette.result.get(row.donorMapId);
    for (let x = 0; x < width; x += 1) {
      const sx = (x + row.floorPhase) % donor.width;
      const sy = (y + blueprint.sequence + row.floorPhase) % donor.height;
      let floor = tableGet(donor.table, sx, sy, 0);
      if (!floor || (palette.passages[floor] ?? 0) !== 0) floor = floors[(x + y + row.floorPhase) % Math.min(floors.length, 12)];
      canvas.set(x, y, 0, floor);
      if ((x + row.floorPhase) % row.accentEvery === 0 && x > 1 && y > 1 && x < width - 2 && y < height - 2) {
        for (const z of [1, 2]) {
          const accent = tableGet(donor.table, sx, sy, z);
          if (accent && (palette.passages[accent] ?? 0) === 0) canvas.set(x, y, z, accent);
        }
      }
    }
  }
  return canvas;
}
