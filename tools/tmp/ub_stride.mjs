import { cargarROM, u32, u16, offsetDe, esPtr } from '../lib/gba_map_assets.mjs';
const data = cargarROM('/tmp/roms/Pokemon unbound gba.gba');
const tabla = 0x8b2734;
for (const stride of [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64]) {
  let ok = 0, detalles = [];
  for (let id = 0; id < 12; id++) {
    const p = u32(data, tabla + id * stride);
    if (!esPtr(p, data.length)) break;
    const o = offsetDe(p);
    const size = u16(data, o + 6), ancho = u16(data, o + 8), alto = u16(data, o + 10);
    const arr = u32(data, o + 0x1c), pal = u32(data, o + 0x20);
    const valido = [16,32,64].includes(ancho) && [16,32,64].includes(alto) && size === ancho*alto/2 && esPtr(arr,data.length) && esPtr(pal,data.length);
    if (valido) ok++;
    detalles.push(`id${id}:${ancho}x${alto}/sz${size}${valido?'✓':'✗'}`);
  }
  console.log('stride', String(stride).padStart(2), '· válidos', ok, '/12', ok >= 6 ? '  ← ' + detalles.slice(0,6).join(' ') : '');
}
