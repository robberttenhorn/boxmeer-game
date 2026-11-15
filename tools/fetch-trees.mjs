// Bomen, lantaarnpalen en bankjes voor plekken waar de BGT ze niet bevat (zoals Boxmeer).
//
// - Bomen: uit de AHN (PDOK). De hoogte van alles (DSM) min de hoogte van de grond (DTM) geeft hoe hoog iets
//   boven de grond uitsteekt. Wat hoger is dan 4 meter en niet in een gebouw staat, is vrijwel altijd een boom.
//   Elke kruin is een plaatselijke top in die hoogtekaart.
// - Lantaarnpalen: om de 30 meter langs de straten uit het wegennet, op de stoep en niet in een gebouw.
// - Bankjes en fietsenrekken: bij parken, pleinen en winkels.
// Draait na tools/fetch-data.mjs en vult public/data/objects.json aan.
//
// Gebruik (in de cloudomgeving met proxy): NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=... node tools/fetch-trees.mjs

import fs from 'node:fs/promises';
import path from 'node:path';
import { fromArrayBuffer } from 'geotiff';

const OUT = path.resolve('public/data');
const meta = JSON.parse(await fs.readFile(path.join(OUT, 'meta.json'), 'utf8'));
const objects = JSON.parse(await fs.readFile(path.join(OUT, 'objects.json'), 'utf8'));
const footprints = JSON.parse(await fs.readFile(path.join(OUT, 'footprints.json'), 'utf8'));
const roads = JSON.parse(await fs.readFile(path.join(OUT, 'roads.json'), 'utf8'));
const ground = JSON.parse(await fs.readFile(path.join(OUT, 'ground.json'), 'utf8'));
const { origin: O, core: C } = meta;
const RES = 1; // meter per pixel
const W = Math.round((C.maxX - C.minX) / RES), H = Math.round((C.maxY - C.minY) / RES);

async function coverage(id) {
  const url = 'https://service.pdok.nl/rws/ahn/wcs/v1_0?SERVICE=WCS&VERSION=2.0.1&REQUEST=GetCoverage' +
    `&COVERAGEID=${id}&FORMAT=image/tiff&SUBSET=x(${C.minX},${C.maxX})&SUBSET=y(${C.minY},${C.maxY})&SCALESIZE=x(${W}),y(${H})`;
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const img = await (await fromArrayBuffer(await res.arrayBuffer())).getImage();
      return (await img.readRasters())[0];
    } catch (e) { if (i === 3) throw e; await new Promise((r) => setTimeout(r, 2000 * 2 ** i)); }
  }
}

// lokale coördinaten (x oost, z zuid) <-> pixel
const toPx = (x, z) => [Math.floor((x + O.x - C.minX) / RES), Math.floor((C.maxY - (O.y - z)) / RES)];
const toLocal = (px, py) => [C.minX + (px + 0.5) * RES - O.x, -(C.maxY - (py + 0.5) * RES - O.y)];

// gebouwen rasteren (scanline), zodat daken niet als boom tellen
function rasterRings(rings, grid, pad = 0) {
  for (const ring of rings) {
    let minY = Infinity, maxY = -Infinity;
    const pts = ring.map(([x, z]) => toPx(x, z));
    for (const [, y] of pts) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    for (let y = Math.max(0, minY - pad); y <= Math.min(H - 1, maxY + pad); y++) {
      const xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= y && by > y) || (by <= y && ay > y)) xs.push(ax + ((y - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.max(0, Math.floor(xs[k]) - pad); x <= Math.min(W - 1, Math.ceil(xs[k + 1]) + pad); x++) grid[y * W + x] = 1;
    }
  }
}

console.log(`AHN-hoogtes ophalen (${W} x ${H} pixels van ${RES} m)...`);
const dsm = await coverage('dsm_05m');
const dtm = await coverage('dtm_05m');
const building = new Uint8Array(W * H);
rasterRings(footprints.map((f) => f.ring), building, 1);

// hoogte boven de grond; gaten in de DTM (onder bomen) opvullen met de buurt
const chm = new Float32Array(W * H);
for (let i = 0; i < W * H; i++) {
  const s = dsm[i], t = dtm[i];
  const ok = (v) => Number.isFinite(v) && v > -50 && v < 500;
  chm[i] = ok(s) && ok(t) ? s - t : ok(s) ? NaN : 0;
}
// pixels zonder grondhoogte: grond = laagste DSM in de buurt (ruwe schatting)
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = y * W + x;
  if (!Number.isNaN(chm[i])) continue;
  let lo = Infinity;
  for (let dy = -6; dy <= 6; dy += 2) for (let dx = -6; dx <= 6; dx += 2) {
    const xx = x + dx, yy = y + dy;
    if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
    const t = dtm[yy * W + xx];
    if (Number.isFinite(t) && t > -50 && t < 500) lo = Math.min(lo, t);
  }
  chm[i] = Number.isFinite(lo) ? dsm[i] - lo : 0;
}

// kruinen: plaatselijke toppen boven 4 m, buiten gebouwen, minstens 5 m uit elkaar
const trees = [];
const R = 3;
for (let y = R; y < H - R; y++) for (let x = R; x < W - R; x++) {
  const i = y * W + x, h = chm[i];
  if (!(h > 4 && h < 40) || building[i]) continue;
  let top = true;
  for (let dy = -R; dy <= R && top; dy++) for (let dx = -R; dx <= R; dx++) { if ((dx || dy) && chm[(y + dy) * W + x + dx] > h) { top = false; break; } }
  if (!top) continue;
  // kruin moet breed genoeg zijn (geen lantaarnpaal of hoogspanningsmast): minstens de helft van de buren boven 2,5 m
  let n = 0;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (chm[(y + dy) * W + x + dx] > 2.5) n++;
  if (n < 13) continue;
  const [lx, lz] = toLocal(x, y);
  trees.push([lx, lz, h]);
}
// dunnen tot minstens 5 m tussen de kruinen (hoogste eerst)
trees.sort((a, b) => b[2] - a[2]);
const kept = [];
const cell = new Map();
const key = (x, z) => Math.floor(x / 5) + ',' + Math.floor(z / 5);
for (const t of trees) {
  const [x, z] = t;
  let near = false;
  for (let dx = -1; dx <= 1 && !near; dx++) for (let dz = -1; dz <= 1 && !near; dz++) for (const o of cell.get(Math.floor(x / 5) + dx + ',' + (Math.floor(z / 5) + dz)) || []) if (Math.hypot(o[0] - x, o[1] - z) < 5) { near = true; break; }
  if (near) continue;
  kept.push(t);
  const k = key(x, z); if (!cell.has(k)) cell.set(k, []); cell.get(k).push(t);
}
// [x, z, hoogte]; de wereld gebruikt x en z en kiest zelf een vorm
objects.trees = kept.map(([x, z, h]) => [Math.round(x * 10) / 10, Math.round(z * 10) / 10, Math.round(h * 10) / 10]);
console.log(`  ${objects.trees.length} bomen gevonden`);

// ---- lantaarnpalen langs de straten (om de 30 m, afwisselend links en rechts op de stoep)
const inBuilding = (x, z) => { const [px, py] = toPx(x, z); return px < 0 || py < 0 || px >= W || py >= H || building[py * W + px] === 1; };
const lights = [];
const lightCell = new Map();
for (const r of roads) {
  const line = r[1] || r.line || r;
  if (!Array.isArray(line) || line.length < 4) continue;
  let carry = 15, side = 1;
  for (let i = 0; i + 3 < line.length; i += 2) {
    const ax = line[i], az = line[i + 1], bx = line[i + 2], bz = line[i + 3];
    const L = Math.hypot(bx - ax, bz - az);
    if (L < 0.1) continue;
    const ux = (bx - ax) / L, uz = (bz - az) / L;
    for (let d = carry; d < L; d += 30) {
      const off = 4.2 * side; side = -side;
      const x = ax + ux * d - uz * off, z = az + uz * d + ux * off;
      if (inBuilding(x, z)) continue;
      const k = Math.floor(x / 12) + ',' + Math.floor(z / 12);
      if (lightCell.has(k)) continue;
      lightCell.set(k, 1);
      lights.push([Math.round(x * 10) / 10, Math.round(z * 10) / 10]);
    }
    carry = (carry - L) % 30; if (carry < 0) carry += 30;
  }
}
objects.lights = lights;
console.log(`  ${lights.length} lantaarnpalen`);

// ---- bankjes en fietsenrekken: bankjes langs paden in groen bij parken en pleinen, fietsenrekken bij winkels
const furniture = [];
const pois = Object.fromEntries(meta.pois.map((p) => [p.id, p]));
let seed = 7; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const around = (id, n, r, kind) => {
  const p = pois[id]; if (!p) return;
  for (let k = 0, tries = 0; k < n && tries < n * 40; tries++) {
    const a = rnd() * Math.PI * 2, d = 4 + rnd() * r, x = p.pos[0] + Math.sin(a) * d, z = p.pos[1] + Math.cos(a) * d;
    if (inBuilding(x, z) || furniture.some((f) => Math.hypot(f[1] - x, f[2] - z) < 6)) continue;
    furniture.push([kind, Math.round(x * 10) / 10, Math.round(z * 10) / 10]); k++;
  }
};
around('weijer', 7, 60, 'bank');
around('raadhuisplein', 4, 25, 'bank');
around('basiliek', 2, 20, 'bank');
around('kasteel', 2, 30, 'bank');
for (const id of ['albertheijn', 'hema', 'kruidvat', 'bruna', 'rabobank', 'fysioholland']) around(id, 1, 8, 'fietsenrek');
objects.furniture = furniture;
console.log(`  ${furniture.length} bankjes en fietsenrekken`);
void ground;

await fs.writeFile(path.join(OUT, 'objects.json'), JSON.stringify(objects));
console.log('Klaar.');
