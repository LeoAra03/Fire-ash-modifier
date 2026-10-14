// ============================================================================
// badge_icons.mjs — genera filas de 8 iconos de medalla (48px) estilo GBA
// para extender la hoja Graphics/Pictures/Trainer Card/icon_badges.png.
// ============================================================================

import { createCanvas } from "@napi-rs/canvas";

const CELL = 48, MINI = 12, SCALE = CELL / MINI;

const SHAPES = [
  (x, y, r) => x * x + y * y <= r * r,                                   // aro
  (x, y, r) => Math.abs(x) + Math.abs(y) <= r + 1,                       // rombo
  (x, y, r) => Math.max(Math.abs(x), Math.abs(y)) <= r && (Math.abs(x) <= 1 || Math.abs(y) <= 1 || Math.abs(x) + Math.abs(y) >= r - 1), // estrella 4
  (x, y, r) => Math.abs(x) <= r - 1 && y >= -r && y <= (x % 2 === 0 ? r : r - 1), // escudo
  (x, y, r) => Math.abs(x) <= r - 1 && Math.abs(y) <= r - 1 && Math.abs(x) + Math.abs(y) <= r + 2, // hexágono
  (x, y, r) => y >= -r && y <= r - Math.abs(x) ,                         // triángulo
  (x, y, r) => Math.abs(x) <= 1 || Math.abs(y) <= 1 ? Math.max(Math.abs(x), Math.abs(y)) <= r : false, // cruz
  (x, y, r) => x * x + (y + 1) * (y + 1) <= r * r && y >= -r - 1,        // gota
];

/**
 * Genera un canvas 384x48 con 8 medallas de la región.
 * palette: { main:[r,g,b], dark:[r,g,b], light:[r,g,b] }
 */
export function badgeRowCanvas(palette) {
  const canvas = createCanvas(384, CELL);
  const ctx = canvas.getContext("2d");
  for (let i = 0; i < 8; i++) {
    const mini = createCanvas(MINI, MINI);
    const mctx = mini.getContext("2d");
    const img = mctx.createImageData(MINI, MINI);
    const shape = SHAPES[i % SHAPES.length];
    const cx = 5.5, cy = 5.5, r = 4.4;
    for (let y = 0; y < MINI; y++) {
      for (let x = 0; x < MINI; x++) {
        const dx = x - cx, dy = y - cy;
        const idx = (y * MINI + x) * 4;
        let col = null;
        if (shape(dx, dy, r)) col = palette.main;
        if (shape(dx, dy, r) && !shape(dx, dy, r - 1.4)) col = palette.dark;
        if (dx >= -2 && dx <= -1 && dy >= -3 && dy <= -2 && shape(dx, dy, r)) col = palette.light;
        if ((x + y) % 2 === 0 && col === palette.main && shape(dx, dy, r - 1.6)) {
          // dither interno sutil
          col = palette.light2 ?? palette.main;
        }
        if (col) {
          img.data[idx] = col[0]; img.data[idx + 1] = col[1]; img.data[idx + 2] = col[2]; img.data[idx + 3] = 255;
        }
      }
    }
    mctx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(mini, i * CELL, 0, CELL, CELL);
  }
  return canvas;
}

export const REGION_PALETTES = {
  glazed:   { main: [150, 205, 235], dark: [40, 90, 140], light: [235, 250, 255], light2: [180, 225, 245] },
  platinum: { main: [205, 210, 220], dark: [70, 75, 90],  light: [250, 250, 255], light2: [225, 228, 235] },
  crystal:  { main: [120, 230, 220], dark: [20, 100, 110], light: [220, 255, 250], light2: [160, 240, 230] },
  creepy:   { main: [150, 90, 190],  dark: [50, 20, 80],  light: [230, 190, 255], light2: [175, 120, 210] },
  atlas:    { main: [215, 175, 90],  dark: [100, 70, 30], light: [255, 235, 180], light2: [230, 200, 120] },
  teckel:   { main: [185, 130, 80],  dark: [80, 50, 25],  light: [240, 210, 170], light2: [205, 160, 110] },
};
