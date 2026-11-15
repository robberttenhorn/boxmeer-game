// Leven in de Steenstraat: stoepborden en uitstallingen voor de winkels, bloembakken, hanging baskets aan de
// lantaarnpalen, geparkeerde fietsen, vlaggenlijnen boven de straat, winkelend publiek en een straatmuzikant.
// Alles hier is aankleding in een passende stijl, geen nagebouwde echte uitstallingen.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { makeCharacter, makeBike } from './character.js';
import { SHOPS } from './shops.js';

const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...extra });
let seedV = 77;
const rnd = () => ((seedV = (seedV * 16807) % 2147483647) / 2147483647);

function boardTexture(bg, fg, line1, line2) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 192;
  const x = c.getContext('2d');
  x.fillStyle = '#1e1e1e'; x.fillRect(0, 0, 128, 192);
  x.fillStyle = bg; x.fillRect(8, 8, 112, 40);
  x.fillStyle = fg; x.font = '800 22px "Baloo 2", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(line1.slice(0, 11), 64, 29);
  x.fillStyle = '#f5f1e6'; x.font = '700 20px "Baloo 2", sans-serif';
  const words = line2.split(' '); let y = 80, row = '';
  for (const wd of words) { if ((row + ' ' + wd).length > 10) { x.fillText(row, 64, y); y += 26; row = wd; } else row = row ? row + ' ' + wd : wd; }
  x.fillText(row, 64, y);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

const OFFERS = {
  drogist: ['2e halve prijs!', 'Nieuw: zonnebrand', 'Alles voor de baby'],
  warenhuis: ['Rookworst + koffie', 'Op = op!', 'Nieuwe collectie'],
  kleding: ['Sale tot -50%', 'Nieuwe collectie', 'Laarzenweek'],
  damesmode: ['Nieuw binnen', 'Badmode sale', 'Pasvorm-advies'],
  speelgoed: ['Lego-actie!', 'Feestjes? Kom binnen', 'Nieuw: bordspellen'],
  elektro: ['Nieuwste toestel', 'Gratis hoesje', 'Sim only deal'],
  opticien: ['Oorbellen -25%', 'Trouwringen', 'Gravure gratis'],
  tijdschriften: ['Puzzelboeken!', 'Kaarten & post', 'Nieuwe thrillers'],
  ijs: ['Huisgemaakt ijs', 'Nieuwe smaak!', 'Koffie to go'],
  supermarkt: ['Bonus deze week', 'Vers brood', 'Erpel 2 kilo'],
  cafe: ['Happy hour 17-18', 'Live muziek za', 'Dagschotel'],
  bier: ['Speciaalbier', 'Quiz donderdag', 'Tap van de week'],
  restaurant: ['Dagmenu', 'Afhalen kan!', 'Terras open'],
  grill: ['Shoarma XL', 'Pizza van de dag', 'Bezorgen'],
};

export function buildSteenstraat(g) {
  const w = g.world;
  const fac = g.facades;
  const path = w.streetPath('Steenstraat').map(([x, z]) => [x, z]);
  if (path.length < 2) return null;
  const parts = { board: [], wood: [], planter: [], flowers: [], green: [], metal: [], pole: [] };
  const flagGeos = [];
  const add = (k, geo) => parts[k].push(geo);
  const boxGeo = (w2, h, d, x, y, z, ry = 0, rx = 0) => { const geo = new THREE.BoxGeometry(w2, h, d); if (rx) geo.rotateX(rx); if (ry) geo.rotateY(ry); geo.translate(x, y, z); return geo; };
  const group = new THREE.Group();
  const free = (x, z) => !w.insideBuilding(x, z) && w.classAt(x, z) !== 'rijbaan' && w.classAt(x, z) !== 'water';

  // ---- stoepborden en uitstallingen voor de winkels en horeca aan de Steenstraat
  for (const [id, s] of Object.entries(SHOPS)) {
    if (s.street !== 'Steenstraat') continue;
    const f = fac.frames[id];
    if (!f) continue;
    const side = rnd() < 0.5 ? -1 : 1;
    const tx = -f.nz, tz = f.nx; // langs de gevel
    const bx = f.x + f.nx * 1.4 + tx * side * ((f.w || 3) / 2 - 0.3), bz = f.z + f.nz * 1.4 + tz * side * ((f.w || 3) / 2 - 0.3);
    if (free(bx, bz)) {
      const offers = OFFERS[s.type] || ['Welkom!', 'Kom binnen'];
      const tex = boardTexture(s.bg || '#333', s.fg || '#fff', s.sign, offers[Math.floor(rnd() * offers.length)]);
      const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
      const y = w.groundAt(bx, bz);
      const ry = Math.atan2(f.nx, f.nz);
      // A-bord: twee panelen schuin tegen elkaar
      for (const sgn of [1, -1]) {
        const p = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.9), mat);
        p.position.set(bx + f.nx * sgn * 0.17, y + 0.48, bz + f.nz * sgn * 0.17);
        p.rotation.set(0, ry + (sgn < 0 ? Math.PI : 0), 0);
        p.rotateX(-0.2);
        group.add(p);
      }
      add('board', boxGeo(0.64, 0.04, 0.5, bx, y + 0.94, bz, ry));
    }
    // uitstalling: kledingrek bij kledingzaken, een bak met spullen bij warenhuizen, bloemen bij de drogist
    const ux = f.x + f.nx * 1.2 - tx * side * 1.2, uz = f.z + f.nz * 1.2 - tz * side * 1.2;
    if (!free(ux, uz)) continue;
    const uy = w.groundAt(ux, uz), ry = Math.atan2(f.nx, f.nz) + Math.PI / 2;
    if (s.type === 'kleding' || s.type === 'damesmode') {
      add('metal', boxGeo(1.4, 0.04, 0.04, ux, uy + 1.5, uz, ry));
      for (const e of [-0.68, 0.68]) add('metal', boxGeo(0.04, 1.5, 0.04, ux + Math.sin(ry) * e, uy + 0.75, uz + Math.cos(ry) * e, ry));
      const cols = [0xc62828, 0x1565c0, 0xf5f5f5, 0x2e7d32, 0xfdd835, 0x6d4c41];
      for (let k = 0; k < 7; k++) {
        const e = -0.55 + k * 0.18;
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.75, 0.5), std(cols[Math.floor(rnd() * cols.length)], { roughness: 0.95 }));
        m.position.set(ux + Math.sin(ry) * e, uy + 1.08, uz + Math.cos(ry) * e); m.rotation.y = ry + Math.PI / 2; group.add(m);
      }
    } else if (s.type === 'warenhuis' || s.type === 'speelgoed' || s.type === 'supermarkt') {
      add('wood', boxGeo(1.2, 0.7, 0.6, ux, uy + 0.35, uz, ry));
      const cols = [0xe53935, 0xfdd835, 0x1e88e5, 0x43a047, 0xff7043];
      for (let k = 0; k < 6; k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.18, 0.25), std(cols[k % cols.length])); m.position.set(ux + Math.sin(ry) * (-0.42 + (k % 3) * 0.42), uy + 0.8, uz + Math.cos(ry) * (-0.42 + (k % 3) * 0.42) + (k < 3 ? 0.1 : -0.1)); group.add(m); }
    } else if (s.type === 'drogist' || s.type === 'tijdschriften') {
      add('metal', boxGeo(0.5, 1.4, 0.5, ux, uy + 0.7, uz, ry));
      const cols = [0xf8bbd0, 0xfff59d, 0xb3e5fc, 0xffffff];
      for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.04, 0.52), std(cols[k])); m.position.set(ux, uy + 0.4 + k * 0.3, uz); m.rotation.y = ry; group.add(m); }
    }
  }

  // ---- bloembakken en fietsen langs de straat, vlaggenlijnen erboven
  let acc = 0;
  for (let k = 1; k < path.length; k++) {
    const [ax, az] = path[k - 1], [bx, bz] = path[k];
    const L = Math.hypot(bx - ax, bz - az);
    if (L < 0.1) continue;
    const ux = (bx - ax) / L, uz = (bz - az) / L;
    for (let d = (20 - acc % 20 + 20) % 20; d < L; d += 20) {
      const px = ax + ux * d, pz = az + uz * d;
      const sideSign = (Math.floor((acc + d) / 20) % 2) ? 1 : -1;
      // zoek de stoeprand: een stukje opzij, maar niet in een gevel
      for (const off of [3.4, 2.8, 4.2]) {
        const x = px - uz * off * sideSign, z = pz + ux * off * sideSign;
        if (!free(x, z)) continue;
        const y = w.groundAt(x, z);
        add('planter', boxGeo(1.4, 0.55, 0.7, x, y + 0.28, z, Math.atan2(ux, uz)));
        add('green', (() => { const geo = new THREE.IcosahedronGeometry(0.5, 1); geo.scale(1.3, 0.55, 0.6); geo.translate(x, y + 0.72, z); return geo; })());
        for (let f = 0; f < 6; f++) { const geo = new THREE.IcosahedronGeometry(0.09, 0); geo.translate(x + (rnd() - 0.5) * 1.1 * Math.sin(Math.atan2(ux, uz) + Math.PI / 2), y + 0.85 + rnd() * 0.1, z + (rnd() - 0.5) * 1.1 * Math.cos(Math.atan2(ux, uz) + Math.PI / 2)); add('flowers', geo); }
        // fiets tegen de bloembak
        if (rnd() < 0.55) {
          const bike = makeBike([0x263238, 0x8d6e63, 0x1e88e5, 0xc62828, 0xeeeeee][Math.floor(rnd() * 5)]);
          bike.position.set(x + ux * 1.1, y, z + uz * 1.1); bike.rotation.y = Math.atan2(ux, uz) + Math.PI / 2; bike.rotation.z = 0.12;
          group.add(bike);
        }
        break;
      }
    }
    // vlaggenlijn dwars over de straat om de ~45 m
    for (let d = (45 - acc % 45 + 45) % 45; d < L; d += 45) {
      const px = ax + ux * d, pz = az + uz * d;
      let l = null, r = null;
      for (let o = 3; o < 9 && !(l && r); o += 0.5) {
        if (!l && w.insideBuilding(px - uz * o, pz + ux * o)) l = [px - uz * (o - 0.2), pz + ux * (o - 0.2)];
        if (!r && w.insideBuilding(px + uz * o, pz - ux * o)) r = [px + uz * (o - 0.2), pz - ux * (o - 0.2)];
      }
      if (!l || !r) continue;
      const y0 = w.groundAt(px, pz) + 5.2;
      const n = 14;
      for (let i = 0; i <= n; i++) {
        const t = i / n, sag = Math.sin(t * Math.PI) * 0.7;
        const x = l[0] + (r[0] - l[0]) * t, z = l[1] + (r[1] - l[1]) * t;
        if (i < n) { const geo = new THREE.ConeGeometry(0.18, 0.36, 3); geo.rotateX(Math.PI); geo.rotateY(Math.atan2(r[0] - l[0], r[1] - l[1])); geo.translate(x, y0 - sag - 0.2, z); flagGeos.push([geo, i % 4]); }
      }
      // de lijn zelf
      const len = Math.hypot(r[0] - l[0], r[1] - l[1]);
      const line = new THREE.Mesh(new THREE.BoxGeometry(len, 0.02, 0.02), std(0x333333));
      line.position.set((l[0] + r[0]) / 2, y0 - 0.32, (l[1] + r[1]) / 2); line.rotation.y = -Math.atan2(r[1] - l[1], r[0] - l[0]);
      group.add(line);
    }
    acc += L;
  }

  // ---- bloemenmanden aan de lantaarnpalen in de Steenstraat
  const near = (x, z) => { for (let k = 1; k < path.length; k++) { const [ax, az] = path[k - 1], [bx, bz] = path[k]; const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1; const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)); if (Math.hypot(x - ax - dx * t, z - az - dz * t) < 7) return true; } return false; };
  for (const [x, z] of w.objects.lights || []) {
    if (!near(x, z)) continue;
    const y = w.groundAt(x, z) + 3.0;
    add('metal', boxGeo(0.6, 0.04, 0.04, x + 0.3, y + 0.4, z));
    add('planter', (() => { const geo = new THREE.SphereGeometry(0.28, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); geo.translate(x + 0.6, y, z); return geo; })());
    add('green', (() => { const geo = new THREE.IcosahedronGeometry(0.34, 1); geo.scale(1, 0.8, 1); geo.translate(x + 0.6, y + 0.05, z); return geo; })());
    for (let f = 0; f < 5; f++) { const geo = new THREE.IcosahedronGeometry(0.07, 0); geo.translate(x + 0.6 + (rnd() - 0.5) * 0.5, y - 0.1 + rnd() * 0.3, z + (rnd() - 0.5) * 0.5); add('flowers', geo); }
  }

  const mats = {
    board: std(0x1e1e1e), wood: std(0x8d6e63, { roughness: 0.9 }), planter: std(0x5d5a55, { roughness: 0.85 }),
    flowers: std(0xe84a7a, { roughness: 0.8 }), green: std(0x3f6e2e, { roughness: 1 }), metal: std(0x3a3d40, { metalness: 0.6, roughness: 0.4 }), pole: std(0x3a3d40),
  };
  for (const [k, geos] of Object.entries(parts)) {
    if (!geos.length) continue;
    const merged = mergeGeometries(geos.map((x) => (x.index ? x.toNonIndexed() : x)).map((x) => { x.deleteAttribute('uv'); return x; }), false);
    if (!merged) continue;
    const m = new THREE.Mesh(merged, mats[k]); m.castShadow = k !== 'flowers'; m.receiveShadow = true; group.add(m);
  }
  const flagCols = [0xd32f2f, 0xffffff, 0x2e7d32, 0xfdd835];
  for (let c = 0; c < 4; c++) {
    const geos = flagGeos.filter(([, k]) => k === c).map(([geo]) => geo.toNonIndexed());
    if (!geos.length) continue;
    geos.forEach((x) => x.deleteAttribute('uv'));
    group.add(new THREE.Mesh(mergeGeometries(geos, false), std(flagCols[c], { side: THREE.DoubleSide })));
  }

  // ---- winkelend publiek bij de etalages en een straatmuzikant bij de basiliek
  const people = [];
  const looks = [
    { shirt: 0x7e57c2, pants: 0x37474f, hair: 0x5d4037, female: true, hairStyle: 'long' },
    { shirt: 0x26a69a, pants: 0x263238, hair: 0x212121 },
    { shirt: 0xef5350, pants: 0x455a64, hair: 0xbdbdbd, female: true, hairStyle: 'bun', glasses: true, coat: 0x6d4c41 },
    { shirt: 0x8d6e63, pants: 0x3e2723, hair: 0x9e9e9e, glasses: true, coat: 0x37474f },
    { shirt: 0xffca28, pants: 0x1565c0, hair: 0xf5d06f, female: true, hairStyle: 'long' },
    { shirt: 0x546e7a, pants: 0x212121, hair: 0x3e2723, hat: 'cap', hatColor: 0x1b1b1b },
  ];
  const shopIds = Object.keys(SHOPS).filter((id) => SHOPS[id].street === 'Steenstraat' && fac.frames[id]);
  for (let i = 0; i < Math.min(8, shopIds.length); i++) {
    const f = fac.frames[shopIds[Math.floor(rnd() * shopIds.length)]];
    const x = f.x + f.nx * 1.0 + (rnd() - 0.5) * 2 * -f.nz, z = f.z + f.nz * 1.0 + (rnd() - 0.5) * 2 * f.nx;
    if (!free(x, z)) continue;
    const m = makeCharacter(looks[i % looks.length]);
    m.position.set(x, w.groundAt(x, z), z);
    m.rotation.y = Math.atan2(-f.nx, -f.nz); // kijkt naar de etalage
    // boodschappentas
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.36, 0.14), std([0xffffff, 0xd84315, 0x0277bd][i % 3]));
    g.attachToHand?.(m, bag, { offset: [0, -0.25, 0] });
    group.add(m);
    people.push(m);
  }
  const bas = w.meta.pois.find((p) => p.id === 'basiliek');
  if (bas) {
    // een plek op de stoep tussen de basiliek en de straat
    let spot = null;
    for (let r = 14; r < 40 && !spot; r += 2) for (let k = 0; k < 16 && !spot; k++) { const a = (k / 16) * Math.PI * 2, x = bas.pos[0] + Math.sin(a) * r, z = bas.pos[1] + Math.cos(a) * r; if (free(x, z) && near(x, z)) spot = [x, z]; }
    if (spot) {
      const m = makeCharacter({ shirt: 0x1a237e, pants: 0x212121, hair: 0x212121, hat: 'cap', hatColor: 0x8e1b1b, beard: true });
      m.position.set(spot[0], w.groundAt(...spot), spot[1]);
      const st = w.nearestStreet(...spot);
      if (st) m.rotation.y = Math.atan2(st.x - spot[0], st.z - spot[1]);
      // accordeon voor de borst en een open koffer voor muntjes
      const acc2 = new THREE.Group();
      acc2.add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.18), std(0xb71c1c, { roughness: 0.4 })));
      const keys = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.19), std(0xf5f5f5)); keys.position.x = 0.2; acc2.add(keys);
      acc2.position.set(0, 1.2, 0.25); m.add(acc2);
      const case_ = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.35), std(0x3e2723)); case_.position.set(0, 0.04, 0.8); m.add(case_);
      group.add(m);
      people.push(m);
      g.streetMusician = { model: m, acc: acc2, x: spot[0], z: spot[1] };
    }
  }
  g.scene.add(group);
  // poppetjes een beetje laten bewegen: rondkijken, en de muzikant laat de accordeon ademen
  let t = 0;
  g.updaters?.add?.((dt) => {
    t += dt;
    const p = g.player;
    if (Math.hypot(p.x - path[0][0], p.z - path[0][1]) > 900) return;
    for (const m of people) m.userData.animate?.(dt, 0, 'idle');
    if (g.streetMusician) g.streetMusician.acc.scale.x = 1 + Math.sin(t * 3) * 0.25;
  });
  return { people: people.length };
}
