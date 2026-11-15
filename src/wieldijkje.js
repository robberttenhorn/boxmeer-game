// Het Wieldijkje in detail.
// - Wieldijkje 9 nagebouwd naar een foto van de maker (Google Street View, maart 2025): crèmewitte baksteen,
//   lichtblauwe kozijnen, een wit entreeblok met glasblokken en een blauwe voordeur, een erker met zinken kapje,
//   zonnepanelen op het voordakvlak, een grindtuin met buxus en een klinkeroprit met een camper.
//   De maten komen uit de 3D BAG (gevel, goot en nok); de verdeling van ramen en deur is naar de foto geschat.
// - De voortuinen van de andere huizen aan het Wieldijkje: een oprit, gras of grind, een haagje langs de stoep,
//   struiken, een tegelpad naar de voordeur, een brievenbus en een container. Per huis anders (vast zaadje),
//   want de echte tuinen ken ik niet.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...extra });

function canvasTex(w, h, draw, repeat = null) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
let seedV = 1;
const rnd = () => ((seedV = (seedV * 16807) % 2147483647) / 2147483647);

// gedeelde texturen
const TEX = {};
function textures() {
  if (TEX.ready) return TEX;
  TEX.whiteBrick = canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = '#d9d6cf'; x.fillRect(0, 0, w, h);
    for (let r = 0; r < 16; r++) for (let k = -1; k < 5; k++) {
      const v = 238 + Math.floor(Math.random() * 14);
      x.fillStyle = `rgb(${v},${v - 1},${v - 5})`;
      x.fillRect(k * 64 + (r % 2) * 32 + 2, r * 16 + 2, 60, 12);
    }
  });
  TEX.glassBlock = canvasTex(128, 128, (x, w, h) => {
    x.fillStyle = '#c9d3d6'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const g = x.createRadialGradient(i * 32 + 16, j * 32 + 16, 2, i * 32 + 16, j * 32 + 16, 18);
      g.addColorStop(0, '#f2f7f8'); g.addColorStop(0.7, '#b9c9ce'); g.addColorStop(1, '#8fa4aa');
      x.fillStyle = g; x.fillRect(i * 32 + 2, j * 32 + 2, 28, 28);
    }
  });
  TEX.solar = canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = '#0d1420'; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#26324a'; x.lineWidth = 1;
    for (let i = 0; i <= 16; i++) { x.beginPath(); x.moveTo(i * 16, 0); x.lineTo(i * 16, h); x.stroke(); x.beginPath(); x.moveTo(0, i * 16); x.lineTo(w, i * 16); x.stroke(); }
    x.strokeStyle = '#7d8590'; x.lineWidth = 4; x.strokeRect(2, 2, w - 4, h - 4);
  });
  TEX.gravel = canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = '#cfc8ba'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const v = 170 + Math.floor(Math.random() * 80); x.fillStyle = `rgb(${v},${v - 6},${v - 16})`; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 2.2, 0, 7); x.fill(); }
  }, [1, 1]);
  TEX.klinker = canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = '#6d6a66'; x.fillRect(0, 0, w, h);
    // keperverband
    for (let i = -8; i < 16; i++) for (let j = -8; j < 16; j++) {
      const v = 130 + Math.floor(Math.random() * 30);
      x.fillStyle = `rgb(${v},${v - 3},${v - 6})`;
      x.save(); x.translate(i * 32 + j * 16, j * 16); x.rotate(Math.PI / 4);
      if ((i + j) % 2) x.fillRect(1, 1, 30, 14); else x.fillRect(1, 1, 14, 30);
      x.restore();
    }
  }, [1, 1]);
  TEX.lawn = canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = '#4f7a35'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 4000; i++) { const g = 90 + Math.floor(Math.random() * 60); x.fillStyle = `rgb(${g - 40},${g},${g - 55})`; x.fillRect(Math.random() * w, Math.random() * h, 1, 3); }
  }, [1, 1]);
  TEX.tiles = canvasTex(128, 128, (x, w, h) => {
    x.fillStyle = '#8f8a82'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const v = 175 + Math.floor(Math.random() * 25); x.fillStyle = `rgb(${v},${v - 4},${v - 10})`; x.fillRect(i * 32 + 1, j * 32 + 1, 30, 30); }
  }, [1, 1]);
  TEX.ready = true;
  return TEX;
}

// een vlak op de grond, met textuur die in meters herhaalt
function groundQuad(pts, y, mat, texScale) {
  const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateX(-Math.PI / 2);
  const uv = geo.attributes.uv, pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) { uv.setXY(i, pos.getX(i) / texScale, pos.getZ(i) / texScale); pos.setY(i, y); }
  const m = new THREE.Mesh(geo, mat); m.receiveShadow = true;
  return m;
}

// gevelkader: u langs de gevel (van links gezien vanaf de straat), o naar buiten, y omhoog
function frame(W, d, n, y0) {
  const P = (u, y, o) => new THREE.Vector3(W[0] + d[0] * u + n[0] * o, y0 + y, W[1] + d[1] * u + n[1] * o);
  const rotY = Math.atan2(n[0], n[1]); // lokale +z wijst naar buiten
  const place = (obj, u, y, o) => { obj.position.copy(P(u, y, o)); obj.rotation.y = rotY; return obj; };
  return { P, rotY, place };
}

// raam met lichtblauw kozijn, roeden en een vitrage in de onderste helft
function windowMesh(w, h, { rows = 1, cols = 1, frameColor = 0x9fd0db, glassColor = 0x2f3d44, curtain = true, depth = 0.08 } = {}) {
  const g = new THREE.Group();
  const fr = std(frameColor, { roughness: 0.5 });
  const glass = new THREE.MeshStandardMaterial({ color: glassColor, roughness: 0.08, metalness: 0.6, envMapIntensity: 1.3 });
  const t = 0.07;
  g.add(new THREE.Mesh(new THREE.PlaneGeometry(w - t, h - t), glass));
  if (curtain) { const c = new THREE.Mesh(new THREE.PlaneGeometry(w - t * 2, (h - t) * 0.55), new THREE.MeshStandardMaterial({ color: 0xece8de, roughness: 0.9, transparent: true, opacity: 0.55 })); c.position.set(0, -h * 0.2, 0.005); g.add(c); }
  const bar = (bw, bh, x, y) => { const b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, depth), fr); b.position.set(x, y, depth / 2); g.add(b); };
  bar(w, t, 0, h / 2 - t / 2); bar(w, t, 0, -h / 2 + t / 2); bar(t, h, -w / 2 + t / 2, 0); bar(t, h, w / 2 - t / 2, 0);
  for (let r = 1; r < rows; r++) bar(w, 0.05, 0, -h / 2 + (h * r) / rows);
  for (let c = 1; c < cols; c++) bar(0.05, h, -w / 2 + (w * c) / cols, 0);
  // vensterbank
  const sill = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, 0.04, 0.12), std(0xb9b5ad)); sill.position.set(0, -h / 2 - 0.02, 0.06); g.add(sill);
  return g;
}

// ------------------------------------------------------------ Wieldijkje 9
export function buildHouse9(g) {
  const w = g.world;
  const home = w.meta.pois.find((p) => p.id === 'thuis');
  if (!home) return null;
  const O = w.meta.origin;
  const T = textures();
  // pand uit de footprints
  const inRing = (x, z, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, zi] = r[i], [xj, zj] = r[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };
  const fp = w.footprints.find((f) => inRing(home.pos[0], home.pos[1], f.ring));
  if (!fp) return null;
  const st = w.nearestStreet(...home.pos, 'Wieldijkje');
  if (!st) return null;
  // voorgevel: de langste gevel die naar de straat kijkt
  let best = null;
  const ring = fp.ring;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 4) continue;
    const d = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
    let n = [d[1], -d[0]];
    const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
    if (inRing(mx + n[0] * 0.5, mz + n[1] * 0.5, ring)) n = [-n[0], -n[1]];
    const face = (st.x - mx) * n[0] + (st.z - mz) * n[1];
    if (face <= 0) continue;
    const score = L - Math.hypot(st.x - mx, st.z - mz) * 0.3;
    if (!best || score > best.score) best = { a, b, L, d, n, score };
  }
  if (!best) return null;
  // links gezien vanaf de straat = het begin van u
  let { a, b, d, n, L } = best;
  if (d[0] * n[1] - d[1] * n[0] < 0) { [a, b] = [b, a]; d = [-d[0], -d[1]]; }
  // gevel lichter en zonder getekende ramen (zie world.js, btype 3)
  w.paintBuilding([a[0] + O.x + (b[0] - a[0]) / 2 - n[0] * 1.5, -(a[1] + (b[1] - a[1]) / 2 - n[1] * 1.5) + O.y], 3);
  const yG = w.groundAt((a[0] + b[0]) / 2 + n[0] * 0.5, (a[1] + b[1]) / 2 + n[1] * 0.5);
  // hoogtes uit de 3D BAG (absoluut): maaiveld 13,4, goot voorgevel 18,57, nok 20,55
  const EAVE = 18.57 - 13.4, RIDGE = 20.55 - 13.4, RIDGE_BACK = 4.56;
  const F = frame(a, d, n, yG);
  const grp = new THREE.Group();
  const add = (obj, u, y, o) => { grp.add(F.place(obj, u, y, o)); return obj; };
  const white = new THREE.MeshStandardMaterial({ map: T.whiteBrick, roughness: 0.85 });
  const wb = (tw, th) => { const m = white.clone(); m.map = T.whiteBrick.clone(); m.map.needsUpdate = true; m.map.wrapS = m.map.wrapT = THREE.RepeatWrapping; m.map.repeat.set(tw / 1.0, th / 0.5); return m; };

  // bovenverdieping: vier ramen
  for (const u of [1.25, 2.7, 4.15, 5.6]) add(windowMesh(0.95, 1.25, { rows: 1 }), u, 3.85, 0.03);
  // begane grond: twee grote ramen met bovenlicht, en links een smal raam
  for (const u of [3.3, 5.0]) add(windowMesh(1.35, 2.15, { rows: 2 }), u, 1.32, 0.03);
  add(windowMesh(1.1, 1.9, { rows: 2 }), 1.35, 1.25, 0.03);
  // regenpijp
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, EAVE - 0.1, 8), std(0xb0b4b8, { metalness: 0.5, roughness: 0.4 }));
  add(pipe, 6.3, (EAVE - 0.1) / 2, 0.08);
  // goot langs de voorgevel
  const gutter = new THREE.Mesh(new THREE.BoxGeometry(L + 0.3, 0.12, 0.16), std(0x2a2c2e, { metalness: 0.3 }));
  add(gutter, L / 2, EAVE - 0.02, 0.1);

  // rechts: het witte hoge blok met de erker
  const blockU0 = Math.min(L - 2.6, 6.75), blockW = L - blockU0 + 0.15;
  const facing = new THREE.Mesh(new THREE.PlaneGeometry(blockW, EAVE + 0.4), wb(blockW, EAVE + 0.4));
  add(facing, blockU0 + blockW / 2, (EAVE + 0.4) / 2, 0.02);
  const bay = new THREE.Group();
  const bw = Math.min(1.9, blockW - 0.5), bh = 1.75, bd = 0.55;
  const bayWin = windowMesh(bw, bh, { rows: 3, curtain: false, glassColor: 0x40525a }); bayWin.position.z = bd; bay.add(bayWin);
  for (const s of [-1, 1]) { const side = windowMesh(bd, bh, { rows: 3, curtain: false, glassColor: 0x40525a }); side.rotation.y = s * Math.PI / 2; side.position.set(s * bw / 2, 0, bd / 2); bay.add(side); }
  const zinc = std(0xa7adb1, { metalness: 0.7, roughness: 0.35 });
  const cap = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.3, 0.06, bd + 0.25), zinc); cap.position.set(0, bh / 2 + 0.14, bd / 2 + 0.05); cap.rotation.x = 0.28; bay.add(cap);
  const under = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.05, 0.1, bd), white); under.position.set(0, -bh / 2 - 0.05, bd / 2); bay.add(under);
  add(bay, blockU0 + blockW / 2, 3.8, 0);

  // entreeblok (één laag, wit) met het huisnummer, glasblokken en de blauwe voordeur
  const e0 = blockU0 + 0.15, e1 = Math.max(L + 1.0, e0 + 3.6), eD = 1.7, eH = 3.05;
  const ent = new THREE.Mesh(new THREE.BoxGeometry(e1 - e0, eH, eD), [wb(eD, eH), wb(eD, eH), white, white, wb(e1 - e0, eH), wb(e1 - e0, eH)]);
  add(ent, (e0 + e1) / 2, eH / 2, eD / 2);
  const roofEdge = new THREE.Mesh(new THREE.BoxGeometry(e1 - e0 + 0.08, 0.1, eD + 0.08), std(0x8b9196, { metalness: 0.5 }));
  add(roofEdge, (e0 + e1) / 2, eH + 0.05, eD / 2);
  const front = eD + 0.012;
  const glassMat = (gw, gh) => { const t = T.glassBlock.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(gw / 0.76, gh / 0.76); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.2, metalness: 0.1, emissive: 0x222628, emissiveIntensity: 0.2 }); };
  const cGlass = e0 + 1.25, door0 = cGlass + 0.38, door1 = door0 + 0.95, glass1 = Math.min(e1 - 0.2, door1 + 1.0);
  add(new THREE.Mesh(new THREE.PlaneGeometry(0.38, 2.45), glassMat(0.38, 2.45)), cGlass + 0.19, 1.225, front);
  const doorMat = std(0x1f5fa8, { roughness: 0.45 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(door1 - door0, 2.3, 0.06), doorMat); add(door, (door0 + door1) / 2, 1.15, front - 0.02);
  const doorWin = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 1.5), new THREE.MeshStandardMaterial({ color: 0x8fb4c8, roughness: 0.1, metalness: 0.5 })); add(doorWin, door1 - 0.25, 1.25, front + 0.015);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.4, 0.04), std(0xd0d4d8, { metalness: 0.9, roughness: 0.2 })); add(handle, door0 + 0.12, 1.05, front + 0.04);
  add(new THREE.Mesh(new THREE.PlaneGeometry(glass1 - door1, 2.45), glassMat(glass1 - door1, 2.45)), (door1 + glass1) / 2, 1.225, front);
  // huisnummer 9 en een lampje
  const nr = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.3), new THREE.MeshBasicMaterial({ map: canvasTex(64, 96, (x) => { x.fillStyle = '#3a3a3a'; x.font = '700 80px Inter, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('9', 32, 52); }), transparent: true }));
  add(nr, cGlass - 0.5, 1.45, front + 0.005);
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.07, 0.14), std(0x6b6f73, { metalness: 0.6 })); add(lamp, cGlass - 0.5, 2.05, front + 0.07);
  const nr2 = nr.clone(); nr2.scale.setScalar(0.6); add(nr2, cGlass - 0.5, 2.55, front + 0.005);
  // bel en brievenbus
  const bell = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.03), std(0xcccccc, { metalness: 0.8 })); add(bell, door1 + 0.1, 1.3, front + 0.01);

  // zonnepanelen op het voordakvlak (van de goot naar de nok)
  const slope = Math.atan2(RIDGE - EAVE, RIDGE_BACK);
  const panelW = Math.min(L - 0.8, blockU0 - 0.4), panelD = (RIDGE_BACK - 0.5) / Math.cos(slope);
  const st2 = T.solar.clone(); st2.needsUpdate = true; st2.wrapS = st2.wrapT = THREE.RepeatWrapping; st2.repeat.set(panelW / 1.0, panelD / 1.7);
  const panels = new THREE.Mesh(new THREE.PlaneGeometry(panelW, panelD), new THREE.MeshStandardMaterial({ map: st2, roughness: 0.25, metalness: 0.4 }));
  const pg = new THREE.Group(); panels.rotation.x = -Math.PI / 2; panels.position.set(0, 0, -panelD / 2); pg.add(panels);
  pg.rotation.x = slope; // de groep kantelt om de goot
  const pHolder = new THREE.Group(); pHolder.add(pg);
  add(pHolder, 0.35 + panelW / 2, EAVE + 0.1, -0.15);
  // rvs rookkanaal door het dak
  const flue = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.4, 12), std(0xc8ccd0, { metalness: 0.9, roughness: 0.2 }));
  add(flue, 2.6, EAVE + Math.tan(slope) * 2.2 + 0.6, -2.2);
  const flueCap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.12, 12), std(0xc8ccd0, { metalness: 0.9, roughness: 0.2 }));
  add(flueCap, 2.6, EAVE + Math.tan(slope) * 2.2 + 1.35, -2.2);

  // voortuin tot aan de stoep
  let depth = 3;
  for (let o = 1; o < 12; o += 0.5) {
    const [x, z] = [a[0] + d[0] * (L / 2) + n[0] * o, a[1] + d[1] * (L / 2) + n[1] * o];
    const c = w.classAt(x, z);
    if (c === 'voetpad' || c === 'rijbaan' || c === 'fietspad' || c === 'parkeer') { depth = o - 0.4; break; }
    depth = o;
  }
  const gy = 0.17; // boven de bestrating van het erf
  const toW = (u, o) => [a[0] + d[0] * u + n[0] * o, a[1] + d[1] * u + n[1] * o];
  const gravelMat = new THREE.MeshStandardMaterial({ map: T.gravel, roughness: 1 });
  grp.add(groundQuad([toW(-2.2, 0.1), toW(blockU0, 0.1), toW(blockU0, depth), toW(-2.2, depth)], yG + gy, gravelMat, 1.6));
  const klMat = new THREE.MeshStandardMaterial({ map: T.klinker, roughness: 0.9 });
  grp.add(groundQuad([toW(blockU0, eD + 0.02), toW(e1 + 4.2, eD + 0.02), toW(e1 + 4.2, depth), toW(blockU0, depth)], yG + gy - 0.01, klMat, 2.2));
  grp.add(groundQuad([toW(e1, 0.05), toW(e1 + 4.2, 0.05), toW(e1 + 4.2, eD + 0.03), toW(e1, eD + 0.03)], yG + gy - 0.01, klMat, 2.2));
  // band tussen grind en oprit
  const curb = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, depth), std(0x9a968e)); add(curb, blockU0, gy + 0.02, depth / 2);
  // buxus: een grote bol voor het entreeblok en een paar kleinere, een laag haagje links
  const bux = std(0x2f5a26, { roughness: 0.95 });
  const bush = (u, o, r, sy = 0.8) => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 2), bux); m.scale.set(1.15, sy, 1); m.castShadow = true; add(m, u, gy + r * sy * 0.85, o); return m; };
  bush(blockU0 - 0.95, 0.9, 0.75); bush(blockU0 - 2.1, 0.75, 0.6, 0.75); bush(1.8, depth - 0.7, 0.45);
  const hedge = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.1, depth - 0.6), bux); add(hedge, -1.6, gy + 0.55, depth / 2);
  // coniferen links
  const con = std(0x2d4a2a, { roughness: 1 });
  for (const [u, o, hh] of [[-2.6, 1.6, 4.2], [-2.8, 3.2, 3.6]]) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.75, hh, 10), con); c.castShadow = true; add(c, u, gy + hh / 2, o); }
  // klein boompje met kale takken (maart) en een paar blaadjes
  const tree = new THREE.Group();
  const bark = std(0x6b5444, { roughness: 1 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.4, 6), bark); trunk.position.y = 0.7; tree.add(trunk);
  seedV = 9;
  for (let k = 0; k < 9; k++) {
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.03, 1.1, 5), bark);
    const ang = (k / 9) * Math.PI * 2;
    br.position.set(Math.cos(ang) * 0.25, 1.75, Math.sin(ang) * 0.25); br.rotation.set(Math.sin(ang) * 0.6, 0, -Math.cos(ang) * 0.6); tree.add(br);
  }
  const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 1), std(0x9a7a4a, { roughness: 1, transparent: true, opacity: 0.55 })); leaves.position.y = 2.1; leaves.scale.set(1, 0.8, 1); tree.add(leaves);
  add(tree, 2.4, gy, Math.min(2.6, depth - 1));
  // wat grote keien in het grind
  for (const [u, o, r] of [[0.6, 1.2, 0.22], [4.2, depth - 0.6, 0.18], [3.4, 0.8, 0.15]]) { const s = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), std(0x8a8279)); s.scale.y = 0.6; add(s, u, gy + r * 0.4, o); }

  // camper op de oprit, met de neus naar de straat
  const camper = makeCamper();
  add(camper, e1 + 1.9, gy, Math.max(eD + 4.2, depth - 2.2));
  camper.rotation.y = F.rotY; // de neus wijst naar buiten (lokale +z)
  // botsing: entreeblok en camper
  w.addObstacle([toW(e0, 0), toW(e1, 0), toW(e1, eD), toW(e0, eD)]);
  const cu = e1 + 1.9, co = Math.max(eD + 4.2, depth - 2.2);
  w.addObstacle([toW(cu - 1.15, co - 3.6), toW(cu + 1.15, co - 3.6), toW(cu + 1.15, co + 3.6), toW(cu - 1.15, co + 3.6)]);

  grp.traverse((o) => { if (o.isMesh) { o.castShadow = o.castShadow || false; o.receiveShadow = true; } });
  g.scene.add(grp);
  return { grp, fp, facade: { a, b, d, n, L }, depth };
}

// witte camper (geen merk): opbouw met slaapneus boven de cabine, ramen, deur en wielen
function makeCamper() {
  const g = new THREE.Group();
  const white = std(0xf4f4f2, { roughness: 0.4, metalness: 0.1 });
  const grey = std(0x9aa0a6, { roughness: 0.5 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x1b2328, roughness: 0.05, metalness: 0.7 });
  const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  box(2.3, 2.45, 5.4, white, 0, 1.75, -0.7); // opbouw
  box(2.25, 0.62, 1.2, white, 0, 2.72, 2.4); // neus boven de cabine
  box(2.1, 1.25, 1.5, white, 0, 1.15, 2.6); // cabine
  box(2.0, 0.55, 0.05, glass, 0, 1.6, 3.36).rotation.x = -0.35; // voorruit
  for (const s of [-1, 1]) {
    box(0.04, 0.5, 0.9, glass, s * 1.06, 1.55, 2.55); // zijruit cabine
    box(0.04, 0.55, 1.1, glass, s * 1.16, 2.0, 0.4); // raam opbouw
    box(0.04, 0.5, 0.9, glass, s * 1.16, 2.05, -2.0);
    box(0.03, 0.08, 6.6, grey, s * 1.16, 0.95, 0); // sierlijn
  }
  box(0.04, 1.9, 0.62, std(0xe6e6e3), 1.17, 1.5, -0.9); // deur
  box(2.32, 0.25, 0.1, grey, 0, 0.55, 3.38); // bumper
  box(1.2, 0.2, 1.0, grey, 0, 3.05, -1.0); // dakluik / airco
  for (const s of [-1, 1]) box(0.25, 0.1, 0.05, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff3d6, emissiveIntensity: 0.4 }), s * 0.8, 0.85, 3.39);
  const tyre = std(0x161616, { roughness: 0.9 });
  for (const [x, z] of [[-0.95, 2.4], [0.95, 2.4], [-0.95, -1.6], [0.95, -1.6]]) {
    const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.25, 18), tyre); wh.rotation.z = Math.PI / 2; wh.position.set(x, 0.36, z); g.add(wh);
  }
  return g;
}

// ------------------------------------------------------------ voortuinen aan het Wieldijkje
export function buildWieldijkjeGardens(g, skipRing) {
  const w = g.world;
  const T = textures();
  const segs = w.segments.filter((s) => s[0] === 'Wieldijkje');
  if (!segs.length) return;
  const distToStreet = (x, z) => {
    let bd = Infinity, bp = null;
    for (const [, ax, az, bx, bz] of segs) {
      const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
      const px = ax + dx * t, pz = az + dz * t, d = Math.hypot(x - px, z - pz);
      if (d < bd) { bd = d; bp = [px, pz]; }
    }
    return [bd, bp];
  };
  const inRing = (x, z, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, zi] = r[i], [xj, zj] = r[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };
  const parts = { lawn: [], gravel: [], tiles: [], hedge: [], shrub: [], post: [], bin: [], edge: [] };
  const push = (k, geo) => parts[k].push(geo);
  let houses = 0;
  w.footprints.forEach((fp, idx) => {
    if (fp === skipRing || fp.h > 12) return;
    const ring = fp.ring;
    const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length, cz = ring.reduce((s, p) => s + p[1], 0) / ring.length;
    const [dS, sp] = distToStreet(cx, cz);
    if (dS > 30) return;
    // kleine schuurtjes en garages overslaan
    let area = 0; for (let i = 0; i < ring.length; i++) { const [x1, z1] = ring[i], [x2, z2] = ring[(i + 1) % ring.length]; area += x1 * z2 - x2 * z1; }
    if (Math.abs(area) / 2 < 60) return;
    // voorgevel
    let best = null;
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (L < 4) continue;
      const d = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
      let n = [d[1], -d[0]];
      const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      if (inRing(mx + n[0] * 0.4, mz + n[1] * 0.4, ring)) n = [-n[0], -n[1]];
      const face = ((sp[0] - mx) * n[0] + (sp[1] - mz) * n[1]) / Math.hypot(sp[0] - mx, sp[1] - mz);
      if (face < 0.7) continue;
      const sc = L * face;
      if (!best || sc > best.sc) best = { a, b, L, d, n, sc };
    }
    if (!best) return;
    const { a, d, n, L } = best;
    // diepte van de voortuin: tot de stoep of de weg
    let depth = 0;
    for (let o = 0.6; o < 12; o += 0.4) {
      const x = a[0] + d[0] * L / 2 + n[0] * o, z = a[1] + d[1] * L / 2 + n[1] * o;
      const c = w.classAt(x, z);
      if (c === 'voetpad' || c === 'rijbaan' || c === 'fietspad' || c === 'parkeer' || w.insideBuilding(x, z)) break;
      depth = o;
    }
    if (depth < 2) return;
    houses++;
    seedV = 1000 + idx * 7;
    const yG = w.groundAt(a[0] + d[0] * L / 2 + n[0] * 1, a[1] + d[1] * L / 2 + n[1] * 1) + 0.16;
    const toW = (u, o) => [a[0] + d[0] * u + n[0] * o, a[1] + d[1] * u + n[1] * o];
    const quad = (u0, u1, o0, o1, y) => {
      const pts = [toW(u0, o0), toW(u1, o0), toW(u1, o1), toW(u0, o1)];
      const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
      const geo = new THREE.ShapeGeometry(shape); geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position, uv = geo.attributes.uv;
      for (let i = 0; i < pos.count; i++) { pos.setY(i, y); uv.setXY(i, pos.getX(i) / 1.8, pos.getZ(i) / 1.8); }
      return geo;
    };
    const boxAt = (bw, bh, bd, u, y, o) => {
      const geo = new THREE.BoxGeometry(bw, bh, bd);
      geo.rotateY(Math.atan2(n[0], n[1]));
      const [x, z] = toW(u, o); geo.translate(x, y, z); return geo;
    };
    // oprit aan één kant (de bestrating van het erf blijft daar zichtbaar), de rest tuin
    const drivewayLeft = rnd() < 0.5;
    const dw = Math.min(3.2, L * 0.4);
    const t0 = drivewayLeft ? dw : 0, t1 = drivewayLeft ? L : L - dw;
    const kind = rnd() < 0.55 ? 'lawn' : 'gravel';
    const pathU = t0 + (t1 - t0) * (0.25 + rnd() * 0.5);
    push(kind, quad(t0 + 0.1, pathU - 0.55, 0.15, depth - 0.1, yG));
    push(kind, quad(pathU + 0.55, t1 - 0.1, 0.15, depth - 0.1, yG));
    push('tiles', quad(pathU - 0.55, pathU + 0.55, 0.1, depth, yG + 0.005));
    // opsluitband tussen oprit en tuin
    push('edge', boxAt(0.08, 0.1, depth, drivewayLeft ? t0 : t1, yG + 0.03, depth / 2));
    // haagje langs de stoep, met een opening voor het pad (niet bij elk huis)
    if (rnd() < 0.7) {
      const hh = 0.5 + rnd() * 0.5;
      const o = depth - 0.3;
      if (pathU - 0.6 - t0 > 0.6) push('hedge', boxAt(pathU - 0.6 - t0, hh, 0.45, (t0 + pathU - 0.6) / 2, yG + hh / 2, o));
      if (t1 - pathU - 0.6 > 0.6) push('hedge', boxAt(t1 - pathU - 0.6, hh, 0.45, (pathU + 0.6 + t1) / 2, yG + hh / 2, o));
    }
    // struiken tegen de gevel en in de tuin
    const ns = 2 + Math.floor(rnd() * 3);
    for (let k = 0; k < ns; k++) {
      const u = t0 + 0.6 + rnd() * (t1 - t0 - 1.2);
      if (Math.abs(u - pathU) < 0.9) continue;
      const r = 0.3 + rnd() * 0.4, o = 0.5 + rnd() * Math.max(0.2, depth - 1.6);
      const geo = new THREE.IcosahedronGeometry(r, 1); geo.scale(1.1, 0.8, 1);
      const [x, z] = toW(u, o); geo.translate(x, yG + r * 0.7, z);
      push('shrub', geo);
    }
    // brievenbus op een paaltje bij het pad en een container bij de oprit
    if (rnd() < 0.6) { push('post', boxAt(0.08, 1.0, 0.08, pathU + 0.75, yG + 0.5, depth - 0.25)); push('post', boxAt(0.3, 0.25, 0.4, pathU + 0.75, yG + 1.05, depth - 0.25)); }
    if (rnd() < 0.7) push('bin', boxAt(0.58, 1.05, 0.72, drivewayLeft ? 0.5 : L - 0.5, yG + 0.52, 0.6));
  });
  const mats = {
    lawn: new THREE.MeshStandardMaterial({ map: T.lawn, roughness: 1 }),
    gravel: new THREE.MeshStandardMaterial({ map: T.gravel, roughness: 1 }),
    tiles: new THREE.MeshStandardMaterial({ map: T.tiles, roughness: 0.9 }),
    hedge: std(0x2f5a26, { roughness: 1 }),
    shrub: std(0x3d6b2c, { roughness: 1 }),
    post: std(0x2b2b2b, { metalness: 0.4 }),
    bin: std(0x3d4a3a, { roughness: 0.6 }),
    edge: std(0x9a968e),
  };
  for (const [k, geos] of Object.entries(parts)) {
    if (!geos.length) continue;
    const norm = geos.map((x) => (x.index ? x.toNonIndexed() : x));
    norm.forEach((x) => { if (!x.attributes.uv) x.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(x.attributes.position.count * 2), 2)); });
    const merged = mergeGeometries(norm, false);
    if (!merged) continue;
    const m = new THREE.Mesh(merged, mats[k]);
    m.receiveShadow = true; m.castShadow = ['hedge', 'shrub', 'post', 'bin'].includes(k);
    g.scene.add(m);
  }
  return houses;
}
