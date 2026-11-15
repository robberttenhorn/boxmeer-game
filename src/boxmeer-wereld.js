// Eigen plekken in Boxmeer, bovenop de wereld uit open data:
// - de achtertuin van Wieldijkje 9 met het zwembad (plek en maat naar de luchtfoto van PDOK, binnen het kadasterperceel);
// - de kabouterboom in het Weijerpark;
// - de straatbarbecue op het Wieldijkje (partytent, lange tafel, vlaggetjes en de barbecue).
// De vorm van tuin en meubels is een benadering; de plek van het zwembad komt van de luchtfoto.
import * as THREE from 'three';

const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...extra });
const box = (w, h, d, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true; return m; };

export function buildBoxmeerWorld(g) {
  const w = g.world;
  const O = w.meta.origin;
  const L = (x, y) => [x - O.x, -(y - O.y)]; // RD -> lokaal
  const out = {};
  try { out.pool = buildPool(g, L); } catch (e) { console.warn('zwembad Wieldijkje 9', e); }
  try { out.kabouterboom = buildKabouterboom(g); } catch (e) { console.warn('kabouterboom', e); }
  try { out.bbq = buildStreetBbq(g); } catch (e) { console.warn('straatbarbecue', e); }
  g.boxmeer = out;
  return out;
}

// ------------------------------------------------------------ zwembad in de achtertuin van Wieldijkje 9
function buildPool(g, L) {
  const w = g.world;
  // midden van het bad en de richting van de lange kant, gemeten op de luchtfoto (RD 194245,2 / 407320,8; 23,5 graden)
  const [cx, cz] = L(194245.2, 407320.8);
  const ang = (23.5 * Math.PI) / 180;
  const ux = Math.cos(ang), uz = -Math.sin(ang); // langs het bad (lokaal: z wijst naar het zuiden)
  const vx = -uz, vz = ux; // dwars
  const rot = Math.atan2(-uz, ux); // draaiing om y zodat lokale x langs het bad loopt
  const y0 = w.groundAt(cx, cz);
  const LEN = 8, WID = 3.2, RIM = 0.4;
  const grp = new THREE.Group();
  grp.position.set(cx, y0, cz);
  grp.rotation.y = rot;
  // gazon rondom het bad, met een gat voor het bad zelf (anders ligt er gras over het water)
  const ls = new THREE.Shape([new THREE.Vector2(-8, -4.5), new THREE.Vector2(8, -4.5), new THREE.Vector2(8, 8), new THREE.Vector2(-8, 8)]);
  const hx = LEN / 2 + RIM, hz = WID / 2 + RIM;
  ls.holes.push(new THREE.Path([new THREE.Vector2(-hx, -hz), new THREE.Vector2(-hx, hz), new THREE.Vector2(hx, hz), new THREE.Vector2(hx, -hz)]));
  const lawn = new THREE.Mesh(new THREE.ShapeGeometry(ls), std(0x4f7d33, { roughness: 1 }));
  lawn.rotation.x = -Math.PI / 2; lawn.position.y = 0.16; lawn.receiveShadow = true;
  grp.add(lawn);
  // bak: wanden en bodem in lichtblauw tegelwerk, het water iets onder de rand
  const tile = std(0x9fd3e6, { roughness: 0.35 });
  grp.add(box(LEN, 0.05, WID, tile, 0, -1.4, 0));
  for (const [bw, bd, x, z] of [[LEN, 0.1, 0, WID / 2], [LEN, 0.1, 0, -WID / 2], [0.1, WID, LEN / 2, 0], [0.1, WID, -LEN / 2, 0]]) grp.add(box(bw, 1.4, bd, tile, x, -0.7, z));
  // het terrein loopt door onder het bad, dus het water ligt net boven de grond (de rand nog iets hoger)
  const water = new THREE.Mesh(new THREE.PlaneGeometry(LEN, WID), new THREE.MeshStandardMaterial({ color: 0x1e9bc4, roughness: 0.04, metalness: 0.2, envMapIntensity: 1.2 }));
  water.rotation.x = -Math.PI / 2; water.position.y = 0.12;
  // donkerder in het midden: suggestie van diepte
  const deep = new THREE.Mesh(new THREE.PlaneGeometry(LEN - 1.2, WID - 1.0), new THREE.MeshStandardMaterial({ color: 0x137a9e, roughness: 0.04, metalness: 0.2, transparent: true, opacity: 0.55 }));
  deep.rotation.x = -Math.PI / 2; deep.position.y = 0.125;
  grp.add(deep);
  grp.add(water);
  // rand van lichte natuursteen
  const stone = std(0xe8e2d4, { roughness: 0.6 });
  grp.add(box(LEN + RIM * 2, 0.22, RIM, stone, 0, 0.11, WID / 2 + RIM / 2), box(LEN + RIM * 2, 0.22, RIM, stone, 0, 0.11, -WID / 2 - RIM / 2));
  grp.add(box(RIM, 0.22, WID, stone, LEN / 2 + RIM / 2, 0.11, 0), box(RIM, 0.22, WID, stone, -LEN / 2 - RIM / 2, 0.11, 0));
  // opgerolde afdekking aan de oostkant (op de luchtfoto ligt het bad afgedekt)
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, WID + 0.4, 18), std(0x8a9096, { roughness: 0.5 }));
  roll.rotation.x = Math.PI / 2; roll.position.set(LEN / 2 + 0.75, 0.4, 0);
  grp.add(roll);
  for (const s of [-1, 1]) grp.add(box(0.12, 0.6, 0.12, std(0x5b6168, { metalness: 0.5 }), LEN / 2 + 0.75, 0.3, s * (WID / 2 + 0.3)));
  // trapje in de hoek
  const steel = std(0xd0d4d8, { metalness: 0.8, roughness: 0.25 });
  for (const s of [-0.25, 0.25]) {
    const rail = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.025, 6, 12, Math.PI), steel);
    rail.position.set(LEN / 2 - 0.6, 0.2, -WID / 2 + 0.05 + s); rail.rotation.set(0, Math.PI / 2, 0);
    grp.add(rail);
  }
  // springplank aan de westkant (voor het bommetje)
  grp.add(box(0.5, 0.45, 0.5, std(0x9aa3ab), -LEN / 2 - 0.9, 0.22, 0));
  const board = box(2.0, 0.08, 0.5, std(0x1e88e5, { roughness: 0.45 }), -LEN / 2 - 0.1, 0.5, 0);
  grp.add(board);
  // twee ligbedden en een parasol aan de zonkant
  const lounger = (x, z) => {
    const l = new THREE.Group();
    l.add(box(0.7, 0.08, 1.9, std(0xf2f0ea), 0, 0.32, 0));
    const back = box(0.7, 0.08, 0.7, std(0xf2f0ea), 0, 0.55, -0.85); back.rotation.x = 0.9; l.add(back);
    for (const [lx, lz] of [[-0.3, 0.8], [0.3, 0.8], [-0.3, -0.8], [0.3, -0.8]]) l.add(box(0.05, 0.3, 0.05, std(0x8d8d8d), lx, 0.15, lz));
    l.position.set(x, 0, z); l.rotation.y = Math.PI / 2;
    grp.add(l);
  };
  lounger(-1.2, -WID / 2 - 2.0); lounger(1.0, -WID / 2 - 2.0);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 8), steel); pole.position.set(-0.1, 1.2, -WID / 2 - 2.6); grp.add(pole);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.45, 16, 1, true), std(0xf4f1e6, { side: THREE.DoubleSide })); shade.position.set(-0.1, 2.3, -WID / 2 - 2.6); grp.add(shade);
  // opblaasflamingo in het water
  const pink = std(0xff7aa8, { roughness: 0.4 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.16, 10, 20), pink); ring.rotation.x = Math.PI / 2; ring.position.set(1.6, 0.19, 0.6); grp.add(ring);
  const neck = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 8, 14, Math.PI * 1.2), pink); neck.position.set(1.95, 0.59, 0.6); neck.rotation.set(0, Math.PI / 2, 0.4); grp.add(neck);
  grp.traverse((o) => { if (o.isMesh && o !== water && o !== lawn && o !== deep) o.castShadow = true; });
  g.scene.add(grp);
  // niet door het water of de rand lopen
  const ringPts = [];
  for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const lx = a * (LEN / 2 + RIM), lz = b * (WID / 2 + RIM);
    ringPts.push([cx + ux * lx + vx * lz, cz + uz * lx + vz * lz]);
  }
  w.addObstacle(ringPts);
  // voor het bommetje: het bad als "ruimte" met een eigen draaiing en grondhoogte (zie startBommetje)
  return {
    ox: cx, oz: cz, oy: y0, rot,
    board: { x: -LEN / 2 - 0.9, z: 0 },
    boardEnd: { x: -LEN / 2 + 0.8, y: 0.62, z: 0 },
    water: { x: 0, z: 0, y: 0.12 },
    // camera aan de tuinkant (bij de ligbedden), zodat je niet tegen het huis aankijkt
    cam: { landscape: { pos: [-3.5, 3.4, -6.5], look: [-1.5, 1.8, 0] }, portrait: { pos: [3.2, 4.2, -5.2], look: [-4.2, 1.4, 1.2] } },
    // plek naast het bad om te praten (op het gras aan de zuidkant)
    talk: [cx + ux * -2 + vx * (-WID / 2 - 3.6), cz + uz * -2 + vz * (-WID / 2 - 3.6)],
    center: [cx, cz],
  };
}

// ------------------------------------------------------------ kabouterboom in het Weijerpark
function buildKabouterboom(g) {
  const w = g.world;
  const weijer = w.meta.pois.find((p) => p.id === 'weijer');
  if (!weijer) return null;
  // een open plek midden in het groen van het park: zoveel mogelijk gras eromheen, ver van gebouwen en water,
  // en niet te ver van De Weijer
  const [px, pz] = weijer.pos;
  const green = (c) => c === 'gras' || c === 'groen' || c === 'groenvoorziening' || c === 'berm' || c === 'struiken';
  let spot = null, bestScore = -Infinity;
  for (let r = 10; r <= 160; r += 6) {
    for (let k = 0; k < 36; k++) {
      const a = (k / 36) * Math.PI * 2, x = px + Math.sin(a) * r, z = pz + Math.cos(a) * r;
      if (!green(w.classAt(x, z)) || w.insideBuilding(x, z)) continue;
      let ok = true, greenN = 0, n = 0, nearB = 30;
      for (const rr of [4, 8, 12, 18]) {
        for (let j = 0; j < 12; j++) {
          const b = (j / 12) * Math.PI * 2, qx = x + Math.sin(b) * rr, qz = z + Math.cos(b) * rr;
          const c = w.classAt(qx, qz);
          if (w.insideBuilding(qx, qz)) nearB = Math.min(nearB, rr);
          if (rr <= 4 && (c === 'rijbaan' || c === 'water' || w.insideBuilding(qx, qz))) ok = false;
          if (rr <= 8 && c === 'water') ok = false;
          n++; if (green(c)) greenN++;
        }
      }
      if (!ok || nearB <= 8) continue;
      const score = (greenN / n) * 40 + nearB - r * 0.08;
      if (score > bestScore) { bestScore = score; spot = [x, z]; }
    }
  }
  if (!spot) return null;
  const [x, z] = spot;
  const y = w.groundAt(x, z);
  const grp = new THREE.Group();
  grp.position.set(x, y, z);
  const bark = std(0x5b4636, { roughness: 1, flatShading: true });
  // dikke, knoestige stam met wortels
  const trunkGeo = new THREE.CylinderGeometry(0.9, 1.35, 5.5, 14, 6);
  const tp = trunkGeo.attributes.position;
  for (let i = 0; i < tp.count; i++) { const yy = tp.getY(i), a = Math.atan2(tp.getZ(i), tp.getX(i)); const n = 1 + Math.sin(a * 5 + yy * 1.3) * 0.08 + Math.sin(a * 11) * 0.04; tp.setX(i, tp.getX(i) * n); tp.setZ(i, tp.getZ(i) * n); }
  trunkGeo.computeVertexNormals();
  const trunk = new THREE.Mesh(trunkGeo, bark); trunk.position.y = 2.75; grp.add(trunk);
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.3;
    const root = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.35, 2.2, 7), bark);
    root.position.set(Math.cos(a) * 1.3, 0.25, Math.sin(a) * 1.3); root.rotation.set(Math.sin(a) * 1.25, 0, -Math.cos(a) * 1.25);
    grp.add(root);
  }
  // kruin van bladerbollen
  const leaf = new THREE.MeshStandardMaterial({ color: 0x4f7f35, roughness: 0.9, flatShading: true });
  for (let k = 0; k < 16; k++) {
    const a = k * 2.4, d = 1.2 + (k % 4) * 0.7;
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4 + (k % 3) * 0.4, 1), leaf);
    s.position.set(Math.cos(a) * d, 6 + (k % 5) * 0.5, Math.sin(a) * d);
    grp.add(s);
  }
  // kabouterhuisjes: deurtjes, raampjes met warm licht, trapjes en een brievenbusje
  const wood = std(0x9a5b2e), red = std(0xc62828), white = std(0xf5f0e6);
  const glow = new THREE.MeshStandardMaterial({ color: 0xffe2a0, emissive: 0xffb84d, emissiveIntensity: 0.9 });
  const onTrunk = (a, h, r = 1.25) => [Math.cos(a) * r, h, Math.sin(a) * r];
  const door = (a, h) => {
    const [dx, dy, dz] = onTrunk(a, h, a % 1 === 0 ? 1.3 : 1.2);
    const d = new THREE.Group();
    d.add(box(0.42, 0.62, 0.06, wood, 0, 0.31, 0));
    const arch = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.06, 14, 1, false, 0, Math.PI), wood); arch.rotation.x = Math.PI / 2; arch.position.y = 0.62; d.add(arch);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), std(0xd4af37, { metalness: 0.9 })); knob.position.set(0.12, 0.3, 0.05); d.add(knob);
    d.position.set(dx, dy, dz); d.rotation.y = -a + Math.PI / 2;
    grp.add(d);
  };
  const win = (a, h) => {
    const [dx, dy, dz] = onTrunk(a, h, 1.12);
    const f = new THREE.Group();
    f.add(box(0.3, 0.3, 0.05, wood, 0, 0, 0));
    f.add(box(0.22, 0.22, 0.06, glow, 0, 0, 0.01));
    f.add(box(0.03, 0.22, 0.07, wood, 0, 0, 0.02), box(0.22, 0.03, 0.07, wood, 0, 0, 0.02));
    f.position.set(dx, dy, dz); f.rotation.y = -a + Math.PI / 2;
    grp.add(f);
  };
  door(0, 0.05); door(2.2, 1.6); door(4.1, 3.1);
  win(0.7, 0.9); win(1.6, 2.4); win(3.3, 1.2); win(5.0, 2.6); win(2.8, 3.8);
  // trapje langs de stam
  for (let k = 0; k < 9; k++) {
    const a = 0.2 + k * 0.28, h = 0.25 + k * 0.17;
    const [sx, sy, sz] = onTrunk(a, h, 1.42);
    grp.add(box(0.36, 0.05, 0.18, wood, sx, sy, sz, -a));
  }
  // brievenbusje en een bordje
  grp.add(box(0.06, 0.8, 0.06, wood, 1.9, 0.4, 0.9));
  grp.add(box(0.26, 0.18, 0.18, red, 1.9, 0.88, 0.9));
  const sign = new THREE.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = 512; c.height = 160; const x = c.getContext('2d'); x.fillStyle = '#7a4a22'; x.fillRect(0, 0, 512, 160); x.strokeStyle = '#4a2c12'; x.lineWidth = 10; x.strokeRect(5, 5, 502, 150); x.fillStyle = '#fff3d6'; x.font = '800 74px "Baloo 2", serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('Kabouterboom', 256, 84); return c; })());
  sign.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.38), new THREE.MeshStandardMaterial({ map: sign, side: THREE.DoubleSide }));
  board.position.set(-1.9, 1.15, 1.2); board.rotation.y = 0.5; grp.add(board);
  grp.add(box(0.07, 1.1, 0.07, wood, -1.9, 0.55, 1.2));
  // paddenstoelen (rood met witte stippen) rond de voet
  for (let k = 0; k < 7; k++) {
    const a = k * 0.9 + 0.4, d = 1.8 + (k % 3) * 0.5;
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.25, 8), white); st.position.set(Math.cos(a) * d, 0.12, Math.sin(a) * d); grp.add(st);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), red); cap.position.set(Math.cos(a) * d, 0.24, Math.sin(a) * d); grp.add(cap);
  }
  // lichtsnoertje in de onderste takken
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), glow);
    b.position.set(Math.cos(a) * 2.2, 4.9 + Math.sin(a * 3) * 0.2, Math.sin(a) * 2.2); grp.add(b);
  }
  grp.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.scene.add(grp);
  // botsing om de stam
  const ringPts = [];
  for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; ringPts.push([x + Math.cos(a) * 1.6, z + Math.sin(a) * 1.6]); }
  w.addObstacle(ringPts);
  // de glimmende raampjes 's avonds feller
  g.facades?.signMats?.push({ isWindow: true, mat: glow });
  return { x, z, y, front: [x + 0, z + 3.2], grp };
}

// ------------------------------------------------------------ straatbarbecue op het Wieldijkje
function buildStreetBbq(g) {
  const w = g.world;
  const home = w.meta.pois.find((p) => p.id === 'thuis');
  if (!home) return null;
  const st = w.nearestStreet(...home.pos, 'Wieldijkje') || w.nearestStreet(...home.pos);
  if (!st) return null;
  // richting van de straat bij de barbecue
  const seg = w.segments.filter((s) => s[0] === st.name).map(([, ax, az, bx, bz]) => ({ ax, az, bx, bz, d: Math.hypot((ax + bx) / 2 - st.x, (az + bz) / 2 - st.z) })).sort((a, b) => a.d - b.d)[0];
  let ux = 1, uz = 0;
  if (seg) { const l = Math.hypot(seg.bx - seg.ax, seg.bz - seg.az) || 1; ux = (seg.bx - seg.ax) / l; uz = (seg.bz - seg.az) / l; }
  // een stukje verderop in de straat, zodat de oprit van nummer 9 vrij blijft
  const cx = st.x + ux * 14, cz = st.z + uz * 14;
  const y = w.groundAt(cx, cz);
  const grp = new THREE.Group();
  grp.position.set(cx, y, cz);
  grp.rotation.y = Math.atan2(ux, uz) - Math.PI / 2;
  const white = std(0xf7f7f2), steel = std(0x9ea4aa, { metalness: 0.6, roughness: 0.4 });
  // partytent
  for (const [x, z] of [[-3, -1.5], [3, -1.5], [-3, 1.5], [3, 1.5]]) grp.add(box(0.06, 2.3, 0.06, steel, x, 1.15, z));
  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.3, 0.9, 4, 1, true), white); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.5); roof.position.y = 2.75; grp.add(roof);
  // lange tafel met banken (biertafelset)
  const wood = std(0xb07a46);
  grp.add(box(5, 0.05, 0.7, wood, 0, 0.76, 0));
  for (const s of [-1, 1]) grp.add(box(5, 0.05, 0.28, wood, 0, 0.46, s * 0.75));
  for (const x of [-2.2, 2.2]) for (const s of [-1, 0, 1]) grp.add(box(0.04, s ? 0.46 : 0.76, 0.5, steel, x, s ? 0.23 : 0.38, s * 0.75));
  // spullen op tafel: sauzen, borden, een krat bier eronder
  for (let k = 0; k < 8; k++) grp.add(box(0.25, 0.02, 0.25, white, -2 + k * 0.55, 0.8, 0));
  const sauce = [0xd32f2f, 0xfdd835, 0xffffff, 0x6d4c41];
  for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.2, 8), std(sauce[k])); b.position.set(-0.5 + k * 0.3, 0.89, 0.2); grp.add(b); }
  grp.add(box(0.4, 0.3, 0.3, std(0xc62828), 1.5, 0.15, 0.2));
  // de barbecue (kogel) naast de tent
  const black = std(0x1b1b1b, { roughness: 0.5, metalness: 0.3 });
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), black); bowl.position.set(4.2, 0.8, 0); grp.add(bowl);
  const lid = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2.4), black); lid.position.set(4.42, 0.88, 0); lid.rotation.z = -1.1; grp.add(lid);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.8, 6), black); leg.position.set(4.2 + Math.cos(a) * 0.2, 0.4, Math.sin(a) * 0.2); leg.rotation.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25); grp.add(leg); }
  // vlaggetjes over de straat (rood-wit-groen-geel)
  const cols = [0xd32f2f, 0xffffff, 0x2e7d32, 0xfdd835];
  for (let k = 0; k < 18; k++) {
    const t = k / 17, xx = -6 + t * 12, sag = Math.sin(t * Math.PI) * 0.6;
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.3, 3), std(cols[k % 4], { side: THREE.DoubleSide }));
    f.rotation.x = Math.PI; f.position.set(xx, 3.1 - sag, 3.2); grp.add(f);
  }
  grp.add(box(0.08, 3.4, 0.08, steel, -6, 1.7, 3.2), box(0.08, 3.4, 0.08, steel, 6, 1.7, 3.2));
  // bord "Straatbarbecue Wieldijkje"
  const tex = new THREE.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = 768; c.height = 160; const x = c.getContext('2d'); x.fillStyle = '#c62828'; x.fillRect(0, 0, 768, 160); x.fillStyle = '#fff'; x.font = '800 72px "Baloo 2", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('Straat-BBQ Wieldijkje', 384, 84); return c; })());
  tex.colorSpace = THREE.SRGBColorSpace;
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.85), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide })); banner.position.set(0, 2.35, 1.52); grp.add(banner);
  grp.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.scene.add(grp);
  const toW = (lx, lz) => { const c = Math.cos(grp.rotation.y), s = Math.sin(grp.rotation.y); return [cx + lx * c + lz * s, cz - lx * s + lz * c]; };
  w.addObstacle([toW(-2.6, -1), toW(2.6, -1), toW(2.6, 1), toW(-2.6, 1)]);
  return { x: cx, z: cz, grill: toW(4.2, 0), host: toW(5.6, 1.6), table: toW(0, 0), grp };
}
