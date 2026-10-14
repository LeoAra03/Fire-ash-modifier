import fs from "node:fs";
import path from "node:path";
import { createCanvas } from "@napi-rs/canvas";

const GAME = path.resolve("pokemon_fire_ash");
const COLORS = {
  outline: "#182033",
  ink: "#26395B",
  indigo: "#4B5C91",
  sky: "#78D8D3",
  pale: "#E8F1D7",
  cream: "#FFF1C2",
  amber: "#F4B647",
  coral: "#EE7892",
  white: "#FFFFFF",
  shade: "#A8B6C8",
};
const SHINY = {
  outline: "#29203A",
  ink: "#48315E",
  indigo: "#B84F83",
  sky: "#77C8F2",
  pale: "#F3D6E8",
  cream: "#FFF0C5",
  amber: "#F6D64E",
  coral: "#59CDB9",
  white: "#FFFFFF",
  shade: "#C298BB",
};

function canvas(width, height) {
  const result = createCanvas(width, height);
  const ctx = result.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, width, height);
  return { canvas: result, ctx };
}
function rect(ctx, color, x, y, width, height) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}
function polygon(ctx, color, points) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
}
function ellipse(ctx, color, x, y, width, height) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Auralume is drawn on a 24-pixel grid so the battle and field versions share a silhouette.
function drawAuralume(ctx, x, y, scale, palette = COLORS, pose = "front", frame = 0) {
  ctx.save();
  ctx.translate(x, y + (frame === 1 ? -1 : frame === 3 ? 1 : 0));
  ctx.scale(scale, scale);
  const c = palette;
  const side = pose === "left" || pose === "right";
  const back = pose === "back";
  if (pose === "left") {
    ctx.translate(24, 0);
    ctx.scale(-1, 1);
  }

  // Floating wings, with a small four-frame flutter.
  const flutter = frame === 1 ? -1 : frame === 3 ? 1 : 0;
  polygon(ctx, c.outline, [[7, 10 + flutter], [3, 8], [1, 11], [2, 15], [0, 18], [5, 19], [9, 16]]);
  polygon(ctx, c.indigo, [[7, 11 + flutter], [4, 10], [3, 13], [5, 14], [2, 17], [6, 17], [9, 15]]);
  rect(ctx, c.sky, 3, 12 + flutter, 3, 1);
  rect(ctx, c.sky, 3, 16, 3, 1);
  polygon(ctx, c.outline, [[17, 10 - flutter], [21, 8], [23, 11], [22, 15], [24, 18], [19, 19], [15, 16]]);
  polygon(ctx, c.indigo, [[17, 11 - flutter], [20, 10], [21, 13], [19, 14], [22, 17], [18, 17], [15, 15]]);
  rect(ctx, c.sky, 18, 12 - flutter, 3, 1);
  rect(ctx, c.sky, 18, 16, 3, 1);

  // A small hanging bell crest and its glowing suspension ring.
  rect(ctx, c.outline, 11, 2, 2, 5);
  rect(ctx, c.amber, 10, 1, 4, 2);
  rect(ctx, c.cream, 11, 1, 2, 1);
  rect(ctx, c.sky, 9, 6, 6, 2);
  rect(ctx, c.outline, 10, 6, 4, 1);

  // Bell-shaped body and dark outline.
  polygon(ctx, c.outline, [[10, 7], [14, 7], [17, 10], [18, 15], [17, 19], [14, 22], [10, 22], [7, 19], [6, 15], [7, 10]]);
  polygon(ctx, c.pale, [[10, 8], [14, 8], [16, 11], [17, 15], [15, 19], [13, 21], [10, 20], [8, 18], [7, 15], [8, 11]]);
  polygon(ctx, c.sky, [[10, 10], [14, 10], [15, 12], [15, 17], [13, 19], [10, 18], [9, 16], [9, 12]]);
  rect(ctx, c.white, 10, 11, 2, 1);
  rect(ctx, c.pale, 9, 13, 1, 3);
  rect(ctx, c.indigo, 8, 18, 3, 2);
  rect(ctx, c.indigo, 13, 19, 3, 1);
  rect(ctx, c.amber, 11, 20, 2, 2);
  rect(ctx, c.outline, 10, 21, 4, 1);

  if (!back && !side) {
    // Face: calm eyes and tiny electric-gold cheeks.
    rect(ctx, c.outline, 9, 13, 2, 2);
    rect(ctx, c.outline, 14, 13, 2, 2);
    rect(ctx, c.white, 9, 13, 1, 1);
    rect(ctx, c.white, 14, 13, 1, 1);
    rect(ctx, c.amber, 7, 15, 1, 1);
    rect(ctx, c.amber, 16, 15, 1, 1);
    rect(ctx, c.ink, 11, 16, 3, 1);
  } else {
    // Back/side shell: a dark indigo panel crossed by a luminous current.
    polygon(ctx, c.ink, [[10, 10], [14, 10], [15, 13], [14, 18], [12, 20], [9, 18], [8, 14]]);
    rect(ctx, c.sky, 10, 12, 4, 1);
    rect(ctx, c.amber, 11, 15, 3, 1);
  }

  // A ribbon tail leaves a visible signature in the battle and overworld sprites.
  polygon(ctx, c.outline, [[11, 21], [14, 21], [15, 23], [17, 24], [16, 26], [14, 25], [12, 24], [10, 26], [9, 24]]);
  polygon(ctx, c.coral, [[12, 22], [14, 22], [15, 24], [17, 24], [15, 25], [13, 24], [10, 25], [11, 23]]);
  rect(ctx, c.amber, 11, 22, 2, 1);
  ctx.restore();
}

function drawProp(ctx, kind, ox, oy, pattern = 0, direction = 0) {
  // Art is drawn inside a standard 32x32 RPG Maker character frame.
  const bob = pattern === 1 ? -1 : pattern === 3 ? 1 : 0;
  ctx.save();
  ctx.translate(ox, oy + bob);
  const c = COLORS;
  if (kind === "Atlas Gate Home" || kind === "Atlas Gate Sector 01") {
    // A small stone threshold with amber inlay; intentionally not a ball-shaped marker.
    rect(ctx, "#354052", 5, 9, 5, 18);
    rect(ctx, "#354052", 22, 9, 5, 18);
    rect(ctx, "#617081", 7, 11, 2, 14);
    rect(ctx, "#617081", 23, 11, 2, 14);
    rect(ctx, "#354052", 9, 5, 14, 5);
    rect(ctx, "#F4B647", 11, 7, 10, 2);
    rect(ctx, "#F4B647", 10, 10, 2, 5);
    rect(ctx, "#F4B647", 20, 10, 2, 5);
    rect(ctx, "#315065", 12, 14, 8, 12);
    rect(ctx, "#78D8D3", 14, 16, 4, 8);
    rect(ctx, "#FFF1C2", 15, 17, 1, 3);
    rect(ctx, "#273145", 4, 27, 24, 3);
    rect(ctx, "#F4B647", 6, 27, 20, 1);
    if (kind === "Atlas Gate Sector 01") {
      rect(ctx, "#EE7892", 15, 11, 2, 2);
      rect(ctx, "#F4B647", 13, 12, 1, 1);
      rect(ctx, "#F4B647", 18, 12, 1, 1);
    }
  } else if (kind === "Atlas Gate Previous" || kind === "Atlas Gate Next") {
    const left = kind.endsWith("Previous");
    rect(ctx, "#493F35", 14, 13, 4, 15);
    rect(ctx, "#7C674C", 15, 16, 2, 11);
    rect(ctx, "#334256", 5, 6, 22, 13);
    rect(ctx, "#DCE7D8", 7, 8, 18, 9);
    rect(ctx, "#F4B647", 8, 7, 16, 2);
    if (left) {
      polygon(ctx, "#4B5C91", [[10, 12], [15, 9], [15, 11], [20, 11], [20, 14], [15, 14], [15, 16]]);
    } else {
      polygon(ctx, "#4B5C91", [[22, 12], [17, 9], [17, 11], [12, 11], [12, 14], [17, 14], [17, 16]]);
    }
    rect(ctx, "#78D8D3", left ? 8 : 22, 10, 2, 2);
    rect(ctx, "#273145", 12, 28, 8, 2);
  } else if (kind === "Atlas Wayfinder 01") {
    // Field cartography terminal with a readable glass panel and side beacons.
    rect(ctx, "#26354D", 6, 9, 20, 16);
    rect(ctx, "#708398", 8, 11, 16, 10);
    rect(ctx, "#243B53", 10, 13, 12, 6);
    rect(ctx, "#78D8D3", 11, 14, 10, 4);
    rect(ctx, "#F4B647", 12, 15, 2, 1);
    rect(ctx, "#F4B647", 14, 14, 1, 3);
    rect(ctx, "#FFF1C2", 17, 14, 1, 1);
    rect(ctx, "#EE7892", 19, 16, 1, 1);
    rect(ctx, "#4B5C91", 10, 24, 12, 3);
    rect(ctx, "#26354D", 8, 27, 16, 2);
    rect(ctx, "#F4B647", 12, 8, 2, 3);
    rect(ctx, "#F4B647", 19, 8, 2, 3);
    rect(ctx, "#FFF1C2", 13, 6, 1, 2);
    rect(ctx, "#FFF1C2", 20, 6, 1, 2);
    rect(ctx, "#78D8D3", 4, 14, 2, 5);
    rect(ctx, "#78D8D3", 26, 14, 2, 5);
    if (pattern === 2) rect(ctx, "#FFFFFF", 17, 15, 1, 1);
  } else if (kind === "Atlas Bell 01") {
    // The Campana de Alba: a broad, readable wooden arch, bronze bell and clapper.
    rect(ctx, "#4A3828", 5, 3, 4, 26);
    rect(ctx, "#4A3828", 23, 3, 4, 26);
    rect(ctx, "#795D3D", 7, 3, 18, 4);
    rect(ctx, "#A57943", 8, 4, 16, 1);
    rect(ctx, "#F4B647", 14, 7, 4, 3);
    polygon(ctx, "#503B2C", [[12, 9], [20, 9], [21, 12], [23, 15], [23, 21], [26, 24], [23, 27], [9, 27], [6, 24], [9, 21], [9, 15], [11, 12]]);
    polygon(ctx, "#D79B45", [[13, 11], [19, 11], [20, 14], [22, 16], [22, 21], [24, 24], [21, 25], [11, 25], [8, 24], [11, 21], [11, 16], [12, 14]]);
    rect(ctx, "#FFF1C2", 13, 12, 2, 5);
    rect(ctx, "#F4B647", 17, 13, 3, 2);
    rect(ctx, "#A57943", 13, 21, 7, 2);
    rect(ctx, "#4A3828", 15, 25, 3, 4);
    rect(ctx, "#EE7892", 16, 27, 1, 2);
    rect(ctx, "#273145", 4, 29, 24, 2);
  } else if (kind === "Atlas Resonance Dial 01") {
    // Resonance bench: four audible bands surround a glowing, original crystal.
    rect(ctx, "#26354D", 4, 28, 24, 2);
    rect(ctx, "#26354D", 6, 12, 20, 15);
    rect(ctx, "#708398", 8, 13, 16, 12);
    rect(ctx, "#243B53", 9, 14, 14, 9);
    rect(ctx, "#78D8D3", 10, 16, 12, 1);
    rect(ctx, "#4B5C91", 10, 19, 12, 1);
    rect(ctx, "#EE7892", 10, 22, 12, 1);
    rect(ctx, "#F4B647", 12, 15, 2, 3);
    rect(ctx, "#FFF1C2", 17, 18, 2, 2);
    rect(ctx, "#26354D", 8, 26, 3, 3);
    rect(ctx, "#26354D", 21, 26, 3, 3);
    ellipse(ctx, "#26354D", 10, 2, 12, 12);
    ellipse(ctx, "#F4B647", 12, 4, 8, 8);
    ellipse(ctx, "#78D8D3", 14, 6, 4, 4);
    rect(ctx, "#FFF1C2", 15, 5, 2, 2);
    rect(ctx, "#EE7892", 17, 10, 2, 2);
  } else if (kind === "Atlas Wind Shell 01") {
    // A shell chime in an open timber frame, with spiral and three hanging reeds.
    rect(ctx, "#26354D", 5, 27, 22, 3);
    rect(ctx, "#795D3D", 8, 7, 3, 20);
    rect(ctx, "#795D3D", 21, 7, 3, 20);
    rect(ctx, "#A57943", 6, 5, 20, 4);
    rect(ctx, "#FFF1C2", 8, 6, 16, 1);
    polygon(ctx, "#503B2C", [[10, 9], [14, 8], [18, 9], [22, 12], [23, 16], [21, 20], [17, 22], [12, 21], [9, 18], [8, 14]]);
    polygon(ctx, "#EE7892", [[11, 10], [14, 9], [18, 10], [21, 13], [21, 16], [19, 19], [16, 20], [12, 19], [10, 17], [10, 14]]);
    polygon(ctx, "#FFF1C2", [[12, 11], [14, 10], [17, 11], [19, 13], [19, 16], [17, 18], [14, 18], [12, 16], [11, 14]]);
    rect(ctx, "#F4B647", 14, 12, 2, 2);
    rect(ctx, "#A57943", 15, 14, 2, 2);
    rect(ctx, "#F4B647", 13, 16, 3, 1);
    rect(ctx, "#26354D", 11, 21, 1, 2);
    rect(ctx, "#26354D", 16, 21, 1, 3);
    rect(ctx, "#26354D", 20, 20, 1, 3);
    rect(ctx, "#78D8D3", 10, 23, 3, 4);
    rect(ctx, "#F4B647", 15, 24, 3, 3);
    rect(ctx, "#EE7892", 19, 23, 3, 4);
  } else if (kind === "Atlas Echo Stone 01") {
    polygon(ctx, "#26354D", [[10, 5], [21, 5], [25, 11], [24, 26], [7, 26], [6, 11]]);
    polygon(ctx, "#687C91", [[11, 7], [20, 7], [23, 12], [22, 24], [9, 24], [8, 12]]);
    rect(ctx, "#334B67", 11, 10, 10, 2);
    rect(ctx, "#78D8D3", 12, 13, 8, 2);
    rect(ctx, "#F4B647", 14, 16, 4, 2);
    rect(ctx, "#78D8D3", 12, 19, 8, 1);
    rect(ctx, "#26354D", 4, 27, 24, 3);
    if (pattern === 1 || pattern === 3) {
      rect(ctx, "#78D8D3", 4, 12, 2, 1);
      rect(ctx, "#78D8D3", 26, 12, 2, 1);
    }
  } else if (kind === "Atlas Echo Shard 01") {
    polygon(ctx, "#26354D", [[15, 4], [23, 11], [22, 21], [16, 28], [9, 21], [8, 12]]);
    polygon(ctx, "#78D8D3", [[15, 7], [20, 12], [19, 20], [16, 24], [11, 20], [11, 13]]);
    polygon(ctx, "#FFF1C2", [[15, 8], [17, 12], [14, 16], [12, 13]]);
    rect(ctx, "#F4B647", 17, 15, 2, 3);
    rect(ctx, "#EE7892", 13, 20, 3, 2);
    if (pattern === 1 || pattern === 3) rect(ctx, "#FFFFFF", 21, 9, 1, 2);
  }
  ctx.restore();
}

function eventSheet(kind) {
  const { canvas: image, ctx } = canvas(128, 128);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) drawProp(ctx, kind, col * 32, row * 32, col, row);
  }
  return image;
}

function savePng(image, relativePath) {
  const target = path.join(GAME, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, image.toBuffer("image/png"));
}

function battleSprite(palette, pose) {
  const { canvas: image, ctx } = canvas(96, 96);
  ellipse(ctx, "rgba(22,32,52,0.16)", 29, 72, 38, 9);
  drawAuralume(ctx, 24, 20, 2, palette, pose, 0);
  return image;
}

function characterSheet() {
  const { canvas: image, ctx } = canvas(256, 256);
  const poses = ["front", "left", "right", "back"];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      drawAuralume(ctx, col * 64 + 20, row * 64 + 17, 1, COLORS, poses[row], col);
    }
  }
  return image;
}

function iconSheet(palette) {
  const { canvas: image, ctx } = canvas(128, 64);
  drawAuralume(ctx, 8, 9, 2, palette, "front", 0);
  drawAuralume(ctx, 72, 9, 2, palette, "front", 1);
  return image;
}

function footprint() {
  const { canvas: image, ctx } = canvas(32, 32);
  const ink = "#253550";
  // Two tiny split feet and the bell-shaped tail mark.
  rect(ctx, ink, 8, 5, 5, 8);
  rect(ctx, ink, 6, 8, 2, 4);
  rect(ctx, ink, 13, 8, 2, 4);
  rect(ctx, ink, 19, 16, 5, 8);
  rect(ctx, ink, 17, 19, 2, 4);
  rect(ctx, ink, 24, 19, 2, 4);
  rect(ctx, "#78D8D3", 9, 7, 3, 4);
  rect(ctx, "#F4B647", 20, 18, 3, 4);
  return image;
}

export function generateAtlasSector01Assets() {
  const eventNames = [
    "Atlas Gate Home",
    "Atlas Gate Previous",
    "Atlas Gate Next",
    "Atlas Gate Sector 01",
    "Atlas Wayfinder 01",
    "Atlas Bell 01",
    "Atlas Resonance Dial 01",
    "Atlas Wind Shell 01",
    "Atlas Echo Stone 01",
    "Atlas Echo Shard 01",
  ];
  for (const name of eventNames) savePng(eventSheet(name), `Graphics/Characters/${name}.png`);

  savePng(characterSheet(), "Graphics/Characters/AURALUME.png");
  savePng(battleSprite(COLORS, "front"), "Graphics/Pokemon/Front/AURALUME.png");
  savePng(battleSprite(COLORS, "back"), "Graphics/Pokemon/Back/AURALUME.png");
  savePng(battleSprite(SHINY, "front"), "Graphics/Pokemon/Front shiny/AURALUME.png");
  savePng(battleSprite(SHINY, "back"), "Graphics/Pokemon/Back shiny/AURALUME.png");
  savePng(iconSheet(COLORS), "Graphics/Pokemon/Icons/AURALUME.png");
  savePng(iconSheet(SHINY), "Graphics/Pokemon/Icons shiny/AURALUME.png");
  savePng(footprint(), "Graphics/Pokemon/Footprints/AURALUME.png");

  return [
    ...eventNames.map((name) => `Graphics/Characters/${name}.png`),
    "Graphics/Characters/AURALUME.png",
    "Graphics/Pokemon/Front/AURALUME.png",
    "Graphics/Pokemon/Back/AURALUME.png",
    "Graphics/Pokemon/Front shiny/AURALUME.png",
    "Graphics/Pokemon/Back shiny/AURALUME.png",
    "Graphics/Pokemon/Icons/AURALUME.png",
    "Graphics/Pokemon/Icons shiny/AURALUME.png",
    "Graphics/Pokemon/Footprints/AURALUME.png",
  ];
}
