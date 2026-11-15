// De Sint-Petrusbasiliek aan de Steenstraat, zo dicht mogelijk bij de echte kerk.
// Bronnen: Reliwiki, Wikipedia, BHIC en Monumenten in Nederland (DBNL): wederopbouwkerk uit 1950-1952 van
// H.W. Valk in de stijl van de Bossche School, een grote kruiskerk met brede transeptarmen, bakstenen gevels,
// zadeldaken met pannen en een sobere vierkante toren boven de entree met vier uurwerken en een leien dak.
// De vorm komt uit de 3D BAG; de toren staat op de zuidwesthoek. Op de luchtfoto van PDOK zie je het
// kruisvormige pannendak (gevlamde oranjerode pannen) en het grijze leien tentdak van de toren.
// Geschat: de plek en maat van de ramen (hoge smalle ramen met gebrandschilderd glas, die in de echte kerk
// van Eugène Laudy zijn), de galmgaten, de wijzerplaten en de deuren.
import * as THREE from 'three';

const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...extra });
const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };

const inRing = (x, z, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, zi] = r[i], [xj, zj] = r[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };

// gebrandschilderd glas in een moderne stijl: vlakken in blauw, rood, goud en groen met lood ertussen
function stainedTexture(seed) {
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return tex(64, 256, (x, w, h) => {
    x.fillStyle = '#1b1b1b'; x.fillRect(0, 0, w, h);
    const cols = ['#1f4e9c', '#2a6fc9', '#b3261e', '#e0a526', '#2e7d4f', '#6a3d9a', '#d8c88a'];
    for (let y = 0; y < h; y += 14) for (let xx = 0; xx < w; xx += 16) {
      x.fillStyle = cols[Math.floor(r() * cols.length)];
      x.beginPath(); x.moveTo(xx + 1 + r() * 3, y + 1); x.lineTo(xx + 15, y + 1 + r() * 4); x.lineTo(xx + 15 - r() * 3, y + 13); x.lineTo(xx + 1, y + 13 - r() * 4); x.closePath(); x.fill();
    }
    // een kruis in het midden
    x.fillStyle = '#f1e3a4'; x.fillRect(w / 2 - 3, h * 0.25, 6, h * 0.4); x.fillRect(w / 2 - 14, h * 0.36, 28, 6);
  });
}

function clockTexture() {
  return tex(256, 256, (x, w) => {
    const c = w / 2;
    x.fillStyle = '#16191c'; x.beginPath(); x.arc(c, c, c - 2, 0, 7); x.fill();
    x.strokeStyle = '#d6b45a'; x.lineWidth = 8; x.beginPath(); x.arc(c, c, c - 8, 0, 7); x.stroke();
    x.fillStyle = '#d6b45a';
    for (let i = 0; i < 12; i++) { x.save(); x.translate(c, c); x.rotate((i / 12) * Math.PI * 2); x.fillRect(-5, -(c - 18), 10, i % 3 === 0 ? 30 : 18); x.restore(); }
  });
}

export function buildBasiliek(g) {
  const w = g.world;
  const poi = w.meta.pois.find((p) => p.id === 'basiliek');
  if (!poi) return null;
  const fp = w.footprints.find((f) => inRing(poi.pos[0], poi.pos[1], f.ring));
  if (!fp) return null;
  const O = w.meta.origin;
  const base = w.baseHeight;
  // gevels: roodbruine baksteen zonder getekende woonhuisramen
  w.paintBuilding([poi.pos[0] + O.x, -poi.pos[1] + O.y], 4);
  const grp = new THREE.Group();

  // ---- de toren (uit de 3D BAG: ongeveer 10 x 11 m, muren tot 46,3 m NAP, maaiveld 13,7 m)
  const T = { cx: 343.35, cz: 226.85, ax: [0.693, 0.721], half: 5.25 };
  const bx = [T.ax[1], -T.ax[0]]; // tweede as
  const groundY = 13.7 - base, topY = 46.3 - base;
  // het rommelige torendak uit de 3D BAG weghalen, er komt een strak leien tentdak voor in de plaats
  g.scene.traverse((o) => {
    const geo = o.geometry;
    if (!geo?.attributes?.btype) return;
    const pos = geo.attributes.position;
    const arr = pos.data.array, stride = pos.data.stride, off = pos.offset;
    let changed = false;
    for (let v = 0; v + 2 < pos.count; v += 3) {
      let minY = Infinity, maxY = -Infinity, inside = true;
      for (let k = 0; k < 3; k++) {
        const i = (v + k) * stride + off;
        const x = arr[i], y = arr[i + 1], z = arr[i + 2];
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        const du = (x - T.cx) * T.ax[0] + (z - T.cz) * T.ax[1], dv = (x - T.cx) * bx[0] + (z - T.cz) * bx[1];
        if (Math.abs(du) > T.half + 0.8 || Math.abs(dv) > T.half + 0.8) inside = false;
      }
      if (!inside) continue;
      // muren die van lager komen: alleen de punten boven de muurrand omlaag zetten (de muur blijft staan)
      if (minY < topY - 0.4) {
        if (maxY > topY + 0.1) {
          for (let k = 0; k < 3; k++) { const i = (v + k) * stride + off; if (arr[i + 1] > topY) arr[i + 1] = topY; }
          changed = true;
        }
        continue;
      }
      const i0 = v * stride + off;
      for (let k = 1; k < 3; k++) { const i = (v + k) * stride + off; arr[i] = arr[i0]; arr[i + 1] = arr[i0 + 1]; arr[i + 2] = arr[i0 + 2]; }
      changed = true;
    }
    if (changed) pos.data.needsUpdate = true;
  });
  // dakranden, goten en schoorstenen (losse meshes) die boven de torenmuren uitsteken: omlaag tot de rand
  g.scene.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.geometry?.attributes?.btype) return;
    const pos = o.geometry?.attributes?.position;
    if (!pos || o.parent !== g.scene) return;
    let changed = false;
    for (let k = 0; k < pos.count; k++) {
      const x = pos.getX(k), y = pos.getY(k), z = pos.getZ(k);
      if (y < topY + 0.2) continue;
      const du = (x - T.cx) * T.ax[0] + (z - T.cz) * T.ax[1], dv = (x - T.cx) * bx[0] + (z - T.cz) * bx[1];
      if (Math.abs(du) > T.half + 0.8 || Math.abs(dv) > T.half + 0.8) continue;
      pos.setY(k, topY); changed = true;
    }
    if (changed) { (pos.data || pos).needsUpdate = true; o.geometry.computeBoundingSphere(); }
  });
  const tower = new THREE.Group();
  tower.position.set(T.cx, 0, T.cz);
  tower.rotation.y = Math.atan2(T.ax[0], T.ax[1]); // lokale z langs de eerste as
  grp.add(tower);
  // bovenrand (lijst) en het tentdak van lei
  const H = T.half;
  const rim = new THREE.Mesh(new THREE.BoxGeometry(H * 2 + 0.5, 0.45, H * 2 + 0.5), std(0xb8b0a2)); rim.position.y = topY + 0.2; tower.add(rim);
  const slate = new THREE.MeshStandardMaterial({ map: tex(128, 128, (x, w2, h2) => { x.fillStyle = '#3f4549'; x.fillRect(0, 0, w2, h2); for (let r = 0; r < 16; r++) for (let k = -1; k < 9; k++) { const v = Math.random(); x.fillStyle = `rgb(${58 + v * 22},${64 + v * 22},${70 + v * 22})`; x.fillRect(k * 16 + (r % 2) * 8 + 1, r * 8 + 1, 14, 7); } }), roughness: 0.55, metalness: 0.15 });
  slate.map.wrapS = slate.map.wrapT = THREE.RepeatWrapping; slate.map.repeat.set(6, 6);
  const roofH = 57.2 - 46.3;
  const roof = new THREE.Mesh(new THREE.ConeGeometry((H + 0.35) * Math.SQRT2, roofH, 4, 1), slate);
  roof.rotation.y = Math.PI / 4; roof.position.y = topY + 0.42 + roofH / 2; tower.add(roof);
  // per gevel: wijzerplaat, galmgaten en (aan de straatkant) de entree
  const dial = clockTexture();
  const handMat = std(0xd6b45a, { metalness: 0.8, roughness: 0.3 });
  const louvreMat = std(0x2b2622, { roughness: 0.9 });
  const stone = std(0xc9c1b2, { roughness: 0.85 });
  const hands = [];
  const steen = w.segments.filter((s) => s[0] === 'Steenstraat');
  const streetPt = (() => { let best = null; for (const [, ax, az, bx2, bz] of steen) for (const [px, pz] of [[ax, az], [bx2, bz]]) { const d = Math.hypot(px - T.cx, pz - T.cz); if (!best || d < best.d) best = { d, px, pz }; } return best; })();
  let frontIdx = 0, bestDot = -Infinity;
  for (let k = 0; k < 4; k++) {
    const ang = tower.rotation.y + (k * Math.PI) / 2;
    const nx = Math.sin(ang), nz = Math.cos(ang);
    const dot = streetPt ? (streetPt.px - T.cx) * nx + (streetPt.pz - T.cz) * nz : 0;
    if (dot > bestDot) { bestDot = dot; frontIdx = k; }
  }
  for (let k = 0; k < 4; k++) {
    const face = new THREE.Group();
    face.rotation.y = (k * Math.PI) / 2;
    tower.add(face);
    // wijzerplaat met wijzers
    const dy = topY - 3.6;
    const plate = new THREE.Mesh(new THREE.CircleGeometry(1.45, 40), new THREE.MeshStandardMaterial({ map: dial, roughness: 0.5 }));
    plate.position.set(0, dy, H + 0.06); face.add(plate);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.08, 6, 40), stone); ring.position.set(0, dy, H + 0.05); face.add(ring);
    const hh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.85, 0.04), handMat); hh.geometry.translate(0, 0.35, 0);
    const mh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 0.04), handMat); mh.geometry.translate(0, 0.52, 0);
    hh.position.set(0, dy, H + 0.12); mh.position.set(0, dy, H + 0.15);
    face.add(hh, mh); hands.push([hh, mh]);
    // twee hoge galmgaten met lamellen
    for (const sx of [-1.6, 1.6]) {
      const gat = new THREE.Group();
      gat.add(new THREE.Mesh(new THREE.PlaneGeometry(1.0, 4.2), std(0x111111)));
      for (let i = 0; i < 12; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.18), louvreMat); l.position.set(0, -1.95 + i * 0.35, 0.05); l.rotation.x = 0.5; gat.add(l); }
      const surround = new THREE.Mesh(new THREE.BoxGeometry(1.25, 4.45, 0.1), stone); surround.position.z = -0.04; gat.add(surround);
      gat.position.set(sx, dy - 5.2, H + 0.04); face.add(gat);
    }
    // smalle hoge raampjes lager in de toren
    for (const sx of [-1.2, 0, 1.2]) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 2.6), new THREE.MeshStandardMaterial({ map: stainedTexture(31 + k * 7 + Math.round(sx * 10)), emissive: 0x332211, emissiveIntensity: 0.15, roughness: 0.3 }));
      win.position.set(sx, groundY + 9.5, H + 0.04); face.add(win);
    }
    if (k === frontIdx) {
      // hoofdingang: natuurstenen omlijsting met twee houten deuren en een bovenlicht
      const surround = new THREE.Mesh(new THREE.BoxGeometry(4.2, 5.4, 0.25), stone); surround.position.set(0, groundY + 2.7, H + 0.1); face.add(surround);
      const doorMat = std(0x5a3a22, { roughness: 0.6 });
      for (const sx of [-0.85, 0.85]) {
        const d = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.6, 0.1), doorMat); d.position.set(sx, groundY + 1.8, H + 0.25); face.add(d);
        for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.04), std(0x4a2f1b)); p.position.set(sx, groundY + 0.7 + i * 1.1, H + 0.31); face.add(p); }
      }
      const fan = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.2), new THREE.MeshStandardMaterial({ map: stainedTexture(99), roughness: 0.3, emissive: 0x332211, emissiveIntensity: 0.2 })); fan.position.set(0, groundY + 4.3, H + 0.24); face.add(fan);
      const steps = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.3, 1.4), stone); steps.position.set(0, groundY + 0.15, H + 0.8); face.add(steps);
    }
  }
  // klok gelijk zetten met de echte tijd
  const tick = () => {
    const now = new Date();
    const m = now.getMinutes() + now.getSeconds() / 60, h = (now.getHours() % 12) + m / 60;
    for (const [hh, mh] of hands) { hh.rotation.z = -(h / 12) * Math.PI * 2; mh.rotation.z = -(m / 60) * Math.PI * 2; }
  };
  tick();
  g.updaters?.add?.((() => { let t = 0; return (dt) => { t += dt; if (t > 5) { t = 0; tick(); } }; })());

  // ---- hoge smalle kerkramen langs de lange gevels van schip en transepten (niet bij de toren)
  const buf = w.bld;
  const ring = fp.ring;
  const wallTop = (ax, az, bx2, bz) => {
    // hoogste muurpunt in de buurt van deze gevel
    let top = -Infinity;
    const dx = bx2 - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
    for (let v = 0; v < buf.n; v++) {
      const x = buf.f32[v * 7], z = buf.f32[v * 7 + 2];
      if (x < Math.min(ax, bx2) - 1 || x > Math.max(ax, bx2) + 1 || z < Math.min(az, bz) - 1 || z > Math.max(az, bz) + 1) continue;
      if (buf.i8[v * buf.stride + 23] === 1) continue;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
      if (Math.hypot(x - ax - dx * t, z - az - dz * t) > 0.4) continue;
      top = Math.max(top, buf.f32[v * 7 + 1]);
    }
    return top;
  };
  const winMats = [0, 1, 2, 3, 4].map((i) => new THREE.MeshStandardMaterial({ map: stainedTexture(7 + i * 13), roughness: 0.25, metalness: 0.1, emissive: 0x2a1c10, emissiveIntensity: 0.18 }));
  const frameMat = std(0xc9c1b2, { roughness: 0.85 });
  let nWin = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 4.5) continue;
    const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
    const du = (mx - T.cx) * T.ax[0] + (mz - T.cz) * T.ax[1], dv = (mx - T.cx) * bx[0] + (mz - T.cz) * bx[1];
    if (Math.abs(du) < T.half + 1 && Math.abs(dv) < T.half + 1) continue; // torengevel
    const d = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
    let n = [d[1], -d[0]];
    if (inRing(mx + n[0] * 0.4, mz + n[1] * 0.4, ring)) n = [-n[0], -n[1]];
    const top = wallTop(a[0], a[1], b[0], b[1]);
    const wallH = top - groundY;
    if (!(wallH > 6)) continue;
    const count = Math.max(1, Math.floor((L - 1.5) / 3.2));
    const step = L / count;
    const winH = Math.min(6.5, wallH - 3.2), winW = 1.0;
    for (let k = 0; k < count; k++) {
      const u = step * (k + 0.5);
      const x = a[0] + d[0] * u + n[0] * 0.06, z = a[1] + d[1] * u + n[1] * 0.06;
      const y = groundY + Math.max(2.2, wallH - winH - 1.4) + winH / 2;
      const win = new THREE.Group();
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), winMats[(i + k) % winMats.length]);
      win.add(glass);
      // betonnen omlijsting met een tussenstijl (Bossche School: strak, rechthoekig)
      for (const [fw, fh, fx, fy] of [[winW + 0.3, 0.18, 0, winH / 2 + 0.09], [winW + 0.3, 0.22, 0, -winH / 2 - 0.11], [0.15, winH, -winW / 2 - 0.075, 0], [0.15, winH, winW / 2 + 0.075, 0], [0.06, winH, 0, 0]]) {
        const f = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, 0.12), frameMat); f.position.set(fx, fy, 0.03); win.add(f);
      }
      win.position.set(x, y, z);
      win.rotation.y = Math.atan2(n[0], n[1]);
      grp.add(win);
      nWin++;
    }
  }
  grp.traverse((o) => { if (o.isMesh) { o.receiveShadow = true; } });
  g.scene.add(grp);
  return { tower: T, windows: nWin };
}
