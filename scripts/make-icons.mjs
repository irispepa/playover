// Draws the app icon (three stacked tiles on a dark field) as PNGs, no dependencies.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body));
  return Buffer.concat([len, body, sum]);
};

function png(size) {
  const px = Buffer.alloc(size * size * 3);
  const set = (x, y, [r, g, b]) => { const i = (y * size + x) * 3; px[i] = r; px[i + 1] = g; px[i + 2] = b; };
  const bg = [14, 20, 32];
  const tiles = [
    { c: [76, 201, 160], cy: 0.30 },  // island green
    { c: [240, 180, 76], cy: 0.50 },  // torch amber
    { c: [226, 92, 92], cy: 0.70 },   // tower red
  ];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let col = bg;
    const u = x / size - 0.5, v = y / size;
    for (const t of tiles) {
      // isometric diamond
      if (Math.abs(u) / 0.30 + Math.abs(v - t.cy) / 0.13 <= 1) col = t.c;
    }
    set(x, y, col);
  }
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) px.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}
for (const s of [180, 192, 512]) writeFileSync(new URL(`../public/icon-${s}.png`, import.meta.url), png(s));
console.log('icons written');
