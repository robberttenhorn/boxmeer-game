// Missies in Boxmeer: van het Wieldijkje tot de Steenstraat.
//
// Boksmèrse woorden en uitdrukkingen komen uit openbare woordenlijsten van het Boxmeers (gevonden via zoeken,
// onder andere mijnwoordenboek.nl). Laat ze nakijken door een echte Boksmèrse of Boksmèrs.
// Historie: het Heilig Bloed (rond 1400 werd in de kerk de wijn bloed toen een priester twijfelde), de
// Vaartzondag, carnaval met de metworst van zeven el en het criterium Daags na de Tour.
// De mensen in de missies zijn verzonnen.
import * as THREE from 'three';
import { makeCharacter, makeBike } from './character.js';
import { startBommetje, startTuutjes, startGyros } from './skills2.js';
import { startBBQ, startGnomes } from './skills3.js';
import { startIjs } from './skills4.js';
import { startTappen } from './skills5.js';
import { startCurls } from './fitness.js';
import { gnomeSpotsNear } from './missions3.js';
import { makePuntzak, makeFinishBanner } from './props.js';

// Boksmèrse zin met Nederlandse vertaling (de vertaling verschijnt eronder in het gesprek)
const B = (text, nl) => ({ text, nl });

const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; return m; };

// Krat misswijn: vier flessen, elke botsing kost er één
function makeWineCrate() {
  const g = new THREE.Group();
  const wood = std(0x9c6b3c, { roughness: 0.85 });
  g.add(mesh(new THREE.BoxGeometry(0.42, 0.02, 0.3), wood, 0, 0.01, 0));
  for (const [w, d, x, z] of [[0.42, 0.015, 0, 0.143], [0.42, 0.015, 0, -0.143], [0.015, 0.3, 0.203, 0], [0.015, 0.3, -0.203, 0]]) g.add(mesh(new THREE.BoxGeometry(w, 0.14, d), wood, x, 0.08, z));
  g.userData.layers = [];
  const glass = std(0x2e0a14, { roughness: 0.15, metalness: 0.1 });
  const label = std(0xf3ead2);
  const cap = std(0xb08d3c, { metalness: 0.7, roughness: 0.3 });
  [[-0.1, -0.065], [0.1, -0.065], [-0.1, 0.065], [0.1, 0.065]].forEach(([x, z]) => {
    const b = new THREE.Group();
    b.add(mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.2, 12), glass, 0, 0.11, 0));
    b.add(mesh(new THREE.CylinderGeometry(0.039, 0.039, 0.07, 12), label, 0, 0.1, 0));
    b.add(mesh(new THREE.CylinderGeometry(0.014, 0.03, 0.06, 10), glass, 0, 0.24, 0));
    b.add(mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.04, 10), cap, 0, 0.29, 0));
    b.position.set(x, 0, z);
    g.add(b);
    g.userData.layers.push(b);
  });
  return g;
}

// Metworst van zeven el op twee schragen (zeven el is ongeveer vijf meter)
function makeMetworst() {
  const g = new THREE.Group();
  const worst = std(0x8a3324, { roughness: 0.45 });
  const len = 4.8;
  const body = mesh(new THREE.CylinderGeometry(0.07, 0.07, len, 14), worst, 0, 1.0, 0);
  body.rotation.z = Math.PI / 2;
  g.add(body);
  for (const s of [-1, 1]) {
    const end = mesh(new THREE.SphereGeometry(0.07, 12, 8), worst, (s * len) / 2, 1.0, 0);
    g.add(end);
    g.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 6), std(0xd8c7a0), (s * (len + 0.18)) / 2, 1.0, 0)).rotation.z = Math.PI / 2;
  }
  // touwtjes om de worst
  for (let i = -5; i <= 5; i++) { const r = mesh(new THREE.TorusGeometry(0.072, 0.006, 5, 14), std(0xe8dcc0), i * 0.42, 1.0, 0); r.rotation.y = Math.PI / 2; g.add(r); }
  // schragen
  const wood = std(0x7a5a3a, { roughness: 0.9 });
  for (const x of [-1.8, 1.8]) {
    g.add(mesh(new THREE.BoxGeometry(0.1, 0.06, 0.6), wood, x, 0.92, 0));
    for (const [dx, dz] of [[-0.04, -0.25], [-0.04, 0.25], [0.04, -0.25], [0.04, 0.25]]) { const leg = mesh(new THREE.BoxGeometry(0.05, 0.95, 0.05), wood, x + dx * 3, 0.46, dz); leg.rotation.x = dz > 0 ? -0.15 : 0.15; g.add(leg); }
  }
  // lint in rood-wit-geel
  const cols = [0xd32f2f, 0xffffff, 0xfdd835];
  for (let i = 0; i < 3; i++) { const l = mesh(new THREE.BoxGeometry(0.06, 0.25, 0.01), std(cols[i]), -0.08 + i * 0.08, 0.84, 0.072); g.add(l); }
  return g;
}

// rode puntmuts voor Klutje
function gnomeHat() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.ConeGeometry(0.15, 0.42, 14), std(0xc62828, { roughness: 0.8 }), 0, 0.3, 0));
  g.add(mesh(new THREE.TorusGeometry(0.135, 0.03, 6, 16), std(0xf5f5f5), 0, 0.1, 0)).rotation.x = Math.PI / 2;
  return g;
}

// open plekjes in het groen rond een punt (voor de kabouters in het park)
function parkSpots(g, x, z, n, rMin = 12, rMax = 70) {
  const w = g.world, cands = [];
  for (let i = 0; i < 900; i++) {
    const a = Math.random() * Math.PI * 2, d = rMin + Math.random() * (rMax - rMin);
    const px = x + Math.sin(a) * d, pz = z + Math.cos(a) * d;
    if (w.insideBuilding(px, pz) || w.blocked(px, pz)) continue;
    const cls = w.classAt(px, pz);
    if (!['gras', 'berm', 'groenvoorziening', 'onverhard', 'struiken'].includes(cls)) continue;
    const [qx, qz] = w.resolve(px, pz, 0.6);
    if (Math.hypot(qx - px, qz - pz) > 1) continue;
    cands.push([qx, qz]);
  }
  const out = [];
  for (let tries = 0; tries < 600 && cands.length && out.length < n; tries++) {
    const c = cands[Math.floor(Math.random() * cands.length)];
    if (out.every((o) => Math.hypot(o[0] - c[0], o[1] - c[1]) >= 14)) out.push(c);
  }
  return out;
}

// ------------------------------------------------------------ opzet

export function setupBoxmeer(m, g, add) {
  const w = g.world;
  const poi = (id) => w.meta.pois.find((p) => p.id === id);
  const spotFor = (id, out = 2.4) => {
    const f = g.facades.frames[id];
    if (f) return w.resolve(f.x + f.nx * out, f.z + f.nz * out, 0.5);
    const p = poi(id);
    return p ? w.spotNear(...p.pos) : null;
  };
  const bx = g.boxmeer || {};

  // zwembad in de achtertuin van Wieldijkje 9: de buren komen "even" kijken
  if (bx.pool) add('buren', 'De buurvrouw met cocktail', w.resolve(bx.pool.talk[0], bx.pool.talk[1], 0.4), { shirt: 0xff7043, pants: 0x1e88e5, hair: 0xf5d06f, female: true, hairStyle: 'long', glasses: true });
  // straat-BBQ op het Wieldijkje
  if (bx.bbq) add('bbqbaas', 'Organisator straat-BBQ', w.resolve(bx.bbq.host[0], bx.bbq.host[1], 0.4), { shirt: 0x2e7d32, pants: 0x37474f, apron: 0x212121, hair: 0x6d4c41, hat: 'cap', hatColor: 0xfdd835 });
  // Klutje bij de kabouterboom in het Weijerpark
  if (bx.kabouterboom) {
    const k = bx.kabouterboom;
    const npc = add('klutje', 'Klutje', w.resolve(k.front[0], k.front[1], 0.4), { shirt: 0x1565c0, pants: 0x5d4037, hair: 0xeeeeee, beard: true, shoes: 0x3e2723 });
    npc.model.scale.setScalar(0.62);
    npc.label.position.y = 1.7;
    npc.marker.position.y = 2.2;
    const hat = gnomeHat();
    npc.model.userData.parts.head.add(hat);
    hat.position.set(0, 0.12, 0);
    npc.heading = Math.atan2(k.front[0] - k.x, k.front[1] - k.z);
  }
  // FysioHolland
  { const s = spotFor('fysioholland'); if (s) add('fysio', 'Fysiotherapeut', s, { shirt: 0xffffff, pants: 0x1a237e, hair: 0x3e2723, sleeves: 'short' }); }
  // zenuwachtige jongen bij de condoomautomaat van de Kruidvat
  {
    const f = g.facades.frames.automaat || g.facades.frames.kruidvat;
    if (f) add('wooles', 'Zenuwachtige jongen', w.resolve(f.x + f.nx * 2.6 - f.nz * 2.2, f.z + f.nz * 2.6 + f.nx * 2.2, 0.5), { shirt: 0x7cb342, pants: 0x263238, hair: 0x4e342e, hat: 'cap', hatColor: 0x212121 });
  }
  { const s = spotFor('rembrandt'); if (s) add('ijsjuf', 'Achter de ijstoonbank', s, { shirt: 0xf8bbd0, pants: 0x37474f, apron: 0xffffff, hair: 0x5d4037, female: true, hairStyle: 'bun' }); }
  { const s = spotFor('nogus', 3); if (s) add('waard', "De waard van Nog'us", s, { shirt: 0x111111, pants: 0x222222, apron: 0xf5f5f5, hair: 0x3e2723 }); }
  { const s = spotFor('cleopatra'); if (s) add('grill', 'De grillmeester', s, { shirt: 0xffffff, pants: 0x222222, apron: 0xb71c1c, hair: 0x111111, beard: true }); }
  { const s = spotFor('basiliek', 3.5); if (s) add('koster', 'De koster', s, { shirt: 0x263238, pants: 0x212121, hair: 0xbdbdbd, coat: 0x212121 }); }

  // renner van Daags na de Tour aan het begin van de Steenstraat (kant van de basiliek)
  {
    let path = w.streetPath('Steenstraat').map(([x, z]) => [x, z]);
    if (path.length > 1) {
      const b = poi('basiliek')?.pos || [0, 0];
      if (Math.hypot(path.at(-1)[0] - b[0], path.at(-1)[1] - b[1]) < Math.hypot(path[0][0] - b[0], path[0][1] - b[1])) path.reverse();
      // alleen het winkeldeel: van de grillroom bij de basiliek tot het Raadhuisplein (ongeveer 550 m)
      const cl = poi('cleopatra')?.pos;
      if (cl) {
        let k0 = 0, bd = Infinity;
        path.forEach(([x, z], k) => { const d = Math.hypot(x - cl[0], z - cl[1]); if (d < bd) { bd = d; k0 = k; } });
        if (path.length - k0 > 4) path = path.slice(k0);
      }
      m.criteriumPath = path;
      add('renner', 'Renner van Daags na de Tour', w.resolve(path[0][0] + 3, path[0][1] + 2, 0.5), { shirt: 0xfdd835, pants: 0x111111, hair: 0x5d4037, hat: 'helmet', hatColor: 0x1e88e5 });
    }
  }

  // Prins Carnaval op het Raadhuisplein
  add('prins', 'Prins Carnaval', w.spotNear(6, 8), { shirt: 0xd32f2f, pants: 0xfdd835, hair: 0x3b2a1a, hat: 'prins', sash: 0x43a047, coat: 0xd32f2f, chain: true });

  // opa op het bankje het dichtst bij het Raadhuisplein
  {
    const spots = (w.benchSpots || []).map((b) => ({ ...b, d: Math.hypot(b.x, b.z) })).filter((b) => b.d < 200).sort((a, b) => a.d - b.d);
    const bs = spots[0] || null;
    const bench = bs ? [bs.x, bs.z] : [12, 10];
    const o = add('opa', 'Opa op het bankje', w.resolve(bench[0] + 1.2, bench[1] + 0.6, 0.4), { shirt: 0x6d5c4b, pants: 0x4a4a4a, hair: 0xe0e0e0, hat: 'cap', hatColor: 0x3e3e3e });
    if (bs) {
      const yaw = bs.yaw;
      const sx = bench[0] + Math.sin(yaw) * 0.05, sz = bench[1] + Math.cos(yaw) * 0.05;
      o.pos.set(sx, w.groundAt(sx, sz), sz);
      o.heading = yaw;
      o.pose = 'sit';
      o.model.position.y = 0.19;
      if (g.peds?.sitters) g.peds.sitters = g.peds.sitters.filter((q) => { if (Math.hypot(q.x - sx, q.z - sz) > 1.6) return true; g.scene.remove(q.model); return false; });
    }
  }

  // voorwerpen
  if (m.npcs.grill) g.attachToHand(m.npcs.grill.model, makePuntzak());
}

// ------------------------------------------------------------ lijst

export function boxmeerItems(n) {
  return [
    { id: 'bommetje', npc: n.buren, title: 'Bommetje in de achtertuin', place: 'Wieldijkje 9', desc: 'De buren liggen "even" bij het zwembad. Spring drie keer en maak ze kletsnat.' },
    { id: 'straatbbq', npc: n.bbqbaas, title: 'Straat-BBQ Wieldijkje', place: 'Wieldijkje', desc: 'De grillmeester ligt in het zwembad. Bak jij de burgers voor de hele straat?' },
    { id: 'kabouterboom', npc: n.klutje, title: 'Feest in de kabouterboom', place: 'Weijerpark', desc: 'Na het feest in de kabouterboom liggen Klutjes neefjes overal in het park. Breng ze thuis.' },
    { id: 'revalidatie', npc: n.fysio, title: 'Sterke armen bij FysioHolland', place: 'Rembrandt van Rijnstraat', desc: 'Zeven el metworst draag je niet met spaghetti-armpjes. Train je armen bij de fysio.' },
    { id: 'tuutjes', npc: n.wooles, title: 'Tuutjes trekken', place: 'Kruidvat, Steenstraat', desc: 'Een zenuwachtige jongen durft niet bij de condoomautomaat. De hele Steenstraat kijkt mee.' },
    { id: 'ijsjes', npc: n.ijsjuf, title: 'IJsjes scheppen', place: 'IJssalon Rembrandt', desc: 'Half Boxmeer staat in de rij. Schep de bolletjes precies zoals besteld.' },
    { id: 'pils', npc: n.waard, title: "Tappen bij Nog'us", place: "Café Nog'us", desc: 'Help de waard achter de tap en drink daarna een pilsje. Daarna wordt het avond (of weer ochtend).', repeat: true },
    { id: 'gyros', npc: n.grill, title: 'Gyros bij Cleopatra', place: 'Grillroom Cleopatra', desc: 'Snijd het krokante vlees eraf en gooi daarna de borden kapot.' },
    { id: 'criterium', npc: n.renner, title: 'Daags na de Tour', place: 'Steenstraat', desc: 'Criterium door de Steenstraat: heen en terug, sneller dan de renner. De rondemissen wachten bij de finish.' },
    { id: 'heiligbloed', npc: n.koster, title: 'Het Heilig Bloed', place: 'Sint-Petrusbasiliek', desc: 'De misswijn is weer "verdwenen". Haal nieuwe flessen bij de Albert Heijn zonder ze te breken.' },
    { id: 'plat', npc: n.opa, title: 'Plat kalle', place: 'Bankje bij het Raadhuisplein', desc: 'Opa overhoort je in het Boksmèrs. Weet jij wat de woorden betekenen?' },
    { id: 'metworst', npc: n.prins, title: 'De metworst van zeven el', place: 'Raadhuisplein', desc: 'Carnavalsmaandag: de dragers van de metworst zitten nog in de kroeg. Haal ze op met een polonaise.' },
  ].filter((it) => it.npc);
}

export const BOXMEER_MISSION_OF = {
  buren: 'bommetje', bbqbaas: 'straatbbq', klutje: 'kabouterboom', fysio: 'revalidatie', wooles: 'tuutjes', ijsjuf: 'ijsjes',
  waard: 'pils', grill: 'gyros', renner: 'criterium', koster: 'heiligbloed', opa: 'plat', prins: 'metworst',
};

// ------------------------------------------------------------ missies

export const boxmeerHandlers = {
  // ---------------------------------------------- zwembad Wieldijkje 9
  async buren(npc, N, ui, g) {
    const a = await ui.dialog(N, [
      B('Joe! Ik lag hier toevallig even. Al drie weken. Sinds jullie dat zwembad hebben, heb ik ineens heel veel zin in buurtcontact.', 'Dag! Ik lag hier toevallig even. Al drie weken. Sinds jullie dat zwembad hebben, heb ik ineens heel veel zin in buurtcontact.'),
      'De halve straat kijkt over de schutting mee. Laat eens een bommetje zien waar we het op de straat-BBQ nog over hebben.',
      'Drie sprongen van de plank. De buren zijn de jury, en die zijn na twee cocktails heel streng. Of heel soepel.',
    ], ['Zwembroek aan!', 'Ik heb geen zwembroek']);
    if (a !== 0) {
      await ui.dialog(N, [B('Geen zwembroek? Liever schik as un neije boks, zeggen ze hier. Maar doe toch maar iets aan, de buurman van 11 heeft een verrekijker.', 'Geen zwembroek? Liever plezier dan een nieuwe broek, zeggen ze hier. Maar doe toch maar iets aan, de buurman van 11 heeft een verrekijker.')]);
      return;
    }
    const room = g.boxmeer?.pool;
    if (!room) return;
    if (g.mode === 'car') g.exitCar();
    g.setMode('walk');
    this.setActive('bommetje', 'Bommetje in de achtertuin', 'Drie sprongen. Kracht kiezen, dan in de lucht op tijd tikken voor een bommetje. Haal samen 21 punten.', 'Sprong 1 / 3');
    const r = await startBommetje(g, room);
    if (!r || this.active?.id !== 'bommetje') return;
    const tot = r.total.toFixed(1).replace('.', ',');
    if (r.total >= 21) {
      await ui.dialog(N, [
        `${tot} punten! Mijn cocktail is nu voor de helft zwembadwater. Proost!`,
        'De buurman van 11 legt zijn verrekijker weg. Ik denk dat hij genoeg gezien heeft. Ingsullu zien we elkaar vanavond op de straat-BBQ.',
      ]);
      this.complete('bommetje', 'Bommenkoning van het Wieldijkje!', { v: Math.round(r.total * 10) / 10, unit: 'punten', high: true });
    } else {
      await ui.dialog(N, [`${tot} punten. Mijn cocktail is niet eens nat geworden. Nog een keer, en nu met je billen eerst!`]);
      this.fail('Te kleine bommetjes.');
    }
  },

  // ---------------------------------------------- straat-BBQ op het Wieldijkje
  async bbqbaas(npc, N, ui, g) {
    const a = await ui.dialog(N, [
      B('Joe! Welkom op de jaarlijkse straat-BBQ van het Wieldijkje!', 'Dag! Welkom op de jaarlijkse straat-BBQ van het Wieldijkje!'),
      'Iedereen heeft een salade meegenomen. Vier keer erpelsalade, om precies te zijn. Niemand overlegt hier ooit.',
      'Alleen is de grillmeester na zes biertjes in het zwembad van nummer 9 gesprongen. Met zijn schort nog aan. Bak jij de burgers? Acht stuks, en hooguit twee verbrand.',
    ], ['Schort aan, ik grill!', 'Ik neem wel erpelsalade']);
    if (a !== 0) { await ui.dialog(N, [B('Erpelsalade? Daar hebben we er vier van. De vijfde kun je in het zwembad gooien, bij de grillmeester.', 'Aardappelsalade? Daar hebben we er vier van. De vijfde kun je in het zwembad gooien, bij de grillmeester.')]); return; }
    if (g.mode === 'car') g.exitCar();
    g.setMode('walk');
    this.setActive('straatbbq', 'Straat-BBQ Wieldijkje', 'Tik op een burger als de balk groen is om hem om te draaien, en nog eens om op te dienen. Acht burgers, hooguit twee verbrand.', '');
    const r = await startBBQ(g, { need: 8, maxBurnt: 2, limit: 60, title: 'Straat-BBQ Wieldijkje' });
    if (!r || this.active?.id !== 'straatbbq') return;
    if (r.ok) {
      await ui.dialog(N, [
        r.burnt ? `${r.served} burgers! Die zwarte geven we aan de buurman van 11, die ziet toch alleen wat er in de tuin van nummer 9 gebeurt.` : `${r.served} burgers en niks verbrand. Jij bent de grillmeester van het Wieldijkje, en die oude mag in het zwembad blijven.`,
        'Volgend jaar sta jij op het lijstje. Met je naam erbij. En een schort. Alleen een schort, als je wilt, dan wordt het pas echt een straatfeest.',
      ]);
      g.fx?.confetti(g.player.x, g.world.groundAt(g.player.x, g.player.z) + 2, g.player.z, 120);
      this.complete('straatbbq', 'Grillmeester van het Wieldijkje!');
    } else {
      await ui.dialog(N, ['Het ruikt hier naar een afgebrande frituur. Iedereen eet nu erpelsalade. Vier soorten. Volgend jaar beter!']);
      this.fail('Te veel verbrand of te traag.');
    }
  },

  // ---------------------------------------------- kabouterboom in het Weijerpark
  async klutje(npc, N, ui, g) {
    const a = await ui.dialog(N, [
      B('Joe! Ik ben Klutje. Ik woon in de kabouterboom, al driehonderd jaar. Kijk niet zo, ik ben gewoon klein voor mijn leeftijd.', 'Dag! Ik ben Klutje. Ik woon in de kabouterboom, al driehonderd jaar. Kijk niet zo, ik ben gewoon klein voor mijn leeftijd.'),
      'Gisteren was het feest in de boom. Paddenstoelenbier. Veel te veel paddenstoelenbier.',
      'En nu liggen mijn neefjes overal in het Weijerpark hun roes uit te slapen, met hun mutsen scheef. Ze gedragen zich als wöölese, en ze zijn tweehonderd!',
      'Zoek ze voordat de hondenuitlaters ze vinden. Die meter zegt warm of koud. Loop tegen een kabouter aan om hem op te rapen.',
    ], ['Ik breng ze thuis!', 'Kabouters bestaan niet']);
    if (a !== 0) { await ui.dialog(N, ['Kabouters bestaan niet? Wie heeft er dan vannacht in jouw fietstas geplast? Juist.']); return; }
    const k = g.boxmeer?.kabouterboom;
    const cx = k ? k.x : npc.pos.x, cz = k ? k.z : npc.pos.z;
    let spots = parkSpots(g, cx, cz, 5, 14, 75);
    if (spots.length < 5) spots = spots.concat(gnomeSpotsNear(g, cx, cz, 5 - spots.length, 20, 90));
    if (spots.length < 3) { await ui.dialog(N, ['Hm, ik zie ze nergens. Kom later nog eens terug.']); return; }
    this.setActive('kabouterboom', 'Feest in de kabouterboom', 'Zoek de kabouters in en rond het Weijerpark. De meter zegt warm of koud. Loop tegen een kabouter aan om hem te pakken.', `0 / ${spots.length} kabouters`);
    const r = await startGnomes(g, spots, { limit: 180 });
    if (!r || this.active?.id !== 'kabouterboom') return;
    if (r.ok) {
      await ui.dialog(N, [
        `Alle ${r.found}! In ${Math.round(r.time)} seconden. Eentje lag in de vijver met een eend. Daar vragen we maar niet naar.`,
        B('Dank je wel. Ingsullu komt alles goed, zeg ik altijd. Maar meestal pas na een kater.', 'Dank je wel. Uiteindelijk komt alles goed, zeg ik altijd. Maar meestal pas na een kater.'),
      ]);
      this.complete('kabouterboom', 'Kabouterredder van het Weijerpark!');
    } else {
      await ui.dialog(N, [`${r.found} gevonden... De rest wordt morgen wakker in de Maas. Dat gebeurt elk jaar.`]);
      this.fail('Niet alle kabouters gevonden.');
    }
  },

  // ---------------------------------------------- FysioHolland
  async fysio(npc, N, ui, g) {
    const a = await ui.dialog(N, [
      'Welkom bij FysioHolland. Even kijken... Hm. Rechterarm sterker dan de linker. Muisarm? Te veel op je telefoon? Of iets anders? Ik vraag niks, ik behandel alleen.',
      'Met carnaval moet de metworst van zeven el gedragen worden. Daar heb je armen voor nodig, geen spaghetti.',
      'Ingedrukt houden om te curlen, bovenin aanspannen tot de ring vol is, en dan pas loslaten. Niet te lang hangen, anders verzuurt alles.',
    ], ['Pompen maar!', 'Mijn armen zijn prima']);
    if (a !== 0) { await ui.dialog(N, ['Prima? Je kreeg net de deur bijna niet open. Kom terug als je durft.']); return; }
    this.setActive('revalidatie', 'Sterke armen bij FysioHolland', 'Loop naar de paarse mat bij de spiegel en pak de dumbbells. Pomp je armen naar 100 procent: klaar voor de metworst!', '');
    const room = g.interiors.room('fitness');
    let go;
    const ready = new Promise((r) => { go = r; });
    const spot = room.curlSpot;
    await g.enterInterior(room, { triggers: [{ x: spot.x, z: spot.z, r: 1.4, label: 'Pak de dumbbells', action: () => go(true) }] });
    if (this.active?.id !== 'revalidatie') return;
    g.ui.toast('Loop naar de paarse mat bij de spiegel', 2200);
    const watch = setInterval(() => { if (this.active?.id !== 'revalidatie') { clearInterval(watch); go(false); } }, 400);
    const ok = await ready;
    clearInterval(watch);
    if (!ok || this.active?.id !== 'revalidatie') return;
    room.activeTriggers = [];
    const r = await startCurls(g, {
      limit: 50, shirt: 0xe8a33d, title: 'Sterke armen bij FysioHolland',
      tiers: [[0, 'Spaghetti-armpjes'], [0.35, 'Gemiddelde Boksmèrs'], [0.7, 'Bijna optocht-klaar'], [1, 'Metworst-drager!']],
      coach: ['Nog eentje!', 'Denk aan de metworst!', 'Voel die pomp!', 'Netjes, rug recht!', 'Niet opgeven!'],
    });
    if (!r || this.active?.id !== 'revalidatie') return;
    if (r.ok) {
      await ui.dialog(N, [
        `${r.perfect} strakke herhalingen. Die armen kunnen zeven el metworst aan. En de rest van de avond ook, als je begrijpt wat ik bedoel.`,
        'Ik bedoel de polonaise. Waar dacht jij aan?',
      ]);
      if (g.interior) await g.exitInterior();
      this.complete('revalidatie', 'Metworst-armen!');
    } else {
      await ui.dialog(N, [`${Math.round(r.pump * 100)} procent. Nog steeds spaghetti. Even een slokje water en dan nog een setje!`]);
      this.fail('Nog geen metworst-armen.');
    }
  },

  // ---------------------------------------------- Kruidvat: tuutjes trekken
  async wooles(npc, N, ui, g) {
    const a = await ui.dialog(N, [
      'Psst... Hé. Kun jij iets voor me doen? Vanavond komt mijn vriendin langs en ik eh... heb niks in huis.',
      B('Ik ben gin klutje mer, hè! Alle wöölese hebben het al gedaan, zeggen ze.', 'Ik ben geen klein mannetje meer, hè! Alle pubers hebben het al gedaan, zeggen ze.'),
      'Die automaat bij de Kruidvat. Maar de halve Steenstraat loopt hier langs! Mijn oma, de juf van vroeger, de koster van de basiliek...',
    ], ['Geef dat muntje maar', 'Regel het zelf maar, held']);
    if (a !== 0) { await ui.dialog(N, ['Dan wordt het vanavond Monopoly. Weer.']); return; }
    this.setActive('tuutjes', 'Tuutjes trekken', 'Draai aan de knop van de automaat, maar stop als er iemand kijkt!', 'Schaamte: 0 / 3');
    const f = g.facades.frames.automaat;
    if (f) { g.player.x = f.x + f.nx * 0.9; g.player.z = f.z + f.nz * 0.9; g.player.heading = Math.atan2(-f.nx, -f.nz); }
    const r = await startTuutjes(g);
    if (!r || this.active?.id !== 'tuutjes') return;
    if (r.ok) {
      await ui.dialog(N, [
        r.shame ? `Gelukt! Al heeft ${r.shame === 1 ? 'iemand' : 'de halve Steenstraat'} je gezien. Morgen weet heel Boksmèr het. Bedankt, hè.` : 'Gelukt, en niemand heeft iets gezien! Jij bent een ninja.',
        '...Extra groot? Je bent wel een optimist, zeg. Nou ja. Dank je!',
      ]);
      this.complete('tuutjes', 'Tuutjes getrokken!');
    } else {
      await ui.dialog(N, ['Iedereen heeft je gezien. Mijn oma ook. Ze zwaaide nog. Laat maar, ik fiets wel naar Cuijk.']);
      this.fail('Te vaak betrapt.');
    }
  },

  // ---------------------------------------------- IJssalon Rembrandt
  async ijsjuf(npc, N, ui, g) {
    const a = await ui.dialog(N, [
      B('Joe! Zie je die rij? Half Boksmèr wil een ijsje, en mijn collega is net naar huis met een ijskoppijn.', 'Dag! Zie je die rij? Half Boxmeer wil een ijsje, en mijn collega is net naar huis met een ijskoppijn.'),
      'Kun jij scheppen? Precies zoals besteld, van onder naar boven. De schep zwiert een beetje, dus laat los als hij boven het ijsje hangt.',
      'Vijf klanten blij maken. En niet likken aan de schep, ik zie alles.',
    ], ['Ik schep!', 'Ik ben op dieet']);
    if (a !== 0) { await ui.dialog(N, ['Op dieet? Bij dertig graden? Dan heb je in de Steenstraat niks te zoeken.']); return; }
    if (g.mode === 'car') g.exitCar();
    g.setMode('walk');
    this.setActive('ijsjes', 'IJsjes scheppen', 'Tik op de juiste smaak als de zwierende schep boven het ijsje hangt (de stippellijn wordt groen). Bolletjes in de volgorde van het bonnetje.', '0 / 5 klanten');
    const r = await startIjs(g, { need: 5, maxMistakes: 4, limit: 80 });
    if (!r || this.active?.id !== 'ijsjes') return;
    if (r.ok) {
      await ui.dialog(N, [
        r.mistakes === 0 ? 'Geen bolletje gemorst! Jij bent geboren achter de toonbank.' : 'Hier en daar een splat, maar iedereen heeft een ijsje.',
        'Deze is voor jou: drie bolletjes, van de zaak. Met slagroom. Veel slagroom. Niet aan je vriendin vertellen.',
      ]);
      this.complete('ijsjes', 'IJsmeester van de Steenstraat!');
    } else {
      await ui.dialog(N, [r.mistakes >= 4 ? 'De toonbank ligt vol ijs en de klanten zijn weg. Dat wordt dweilen...' : 'De rij staat nu tot aan de basiliek! Probeer het straks nog eens.']);
      this.fail('IJsjes niet op tijd geschept.');
    }
  },

  // ---------------------------------------------- Café Nog'us
  async waard(npc, N, ui, g) {
    const night = g.night > 0.5;
    const a = await ui.dialog(N, [night ? B('Joe! Nog eentje? Nog\'us eentje dan.', 'Hoi! Nog eentje? Nog eens eentje dan.') : B('Joe! Ee pilske?', 'Hoi! Een pilsje?')],
      [night ? 'Nog eentje (tot morgenochtend)' : 'Graag, een pilsje!', 'Nee, dank je']);
    if (a !== 0) return;
    let tap = !this.done.has('pils');
    if (!tap) tap = (await ui.dialog(N, ['Help je me nog eens achter de tap? Het terras zit weer vol.'], ['Ja, ik tap', 'Nee, gewoon een pilsje'])) === 0;
    if (tap) {
      await ui.dialog(N, [
        'Eerst even helpen, want het terras zit vol en mijn barman is aan het zoenen achter de container.',
        'Tappen: ingedrukt houden en loslaten als het bier bij de streep is, met twee vingers schuim. Acht goede biertjes.',
      ]);
      if (g.mode === 'car') g.exitCar();
      g.setMode('walk');
      this.setActive('pils', "Tappen bij Nog'us", 'Houd ingedrukt om te tappen en laat los als het bier bij de streep staat, met een kraag van twee vingers schuim. Acht goede biertjes!', '0 / 8 biertjes');
      const r = await startTappen(g, { need: 8, maxFails: 3, limit: 70, title: "Tappen bij Café Nog'us", mcLines: ['Joe, tapper!', 'Nog\'us eentje!', 'Wie heeft er dorst?!', 'Proost, Boksmèr!', 'Applaus voor de tapper!', 'Ik zit hier al een uur droog!'] });
      if (!r || this.active?.id !== 'pils') return;
      this.active = null;
      if (!r.ok) {
        await ui.dialog(N, [r.fails >= 3 ? 'Het terras staat in het schuim. Mijn barman komt net terug, met lippenstift op zijn kraag. Probeer het straks nog eens!' : 'Te traag! Het terras is al naar Pub Esser. Probeer het straks nog eens!']);
        this.refresh();
        return;
      }
      await ui.dialog(N, ['Jij mag hier zo achter de tap. Deze pils is van de zaak.']);
    }
    await g.drinkPils();
    await ui.dialog(N, [B('Proost! Op Boksmèr!', 'Proost! Op Boxmeer!')]);
    await g.skipTime(night ? 15 : 22.5);
    this.done.add('pils');
    this.save();
    this.refresh();
  },

  // ---------------------------------------------- Grillroom Cleopatra
  async grill(npc, N, ui, g) {
    const a = await ui.dialog(N, [
      'Welkom bij Cleopatra! Mijn hulpkok is naar huis. Liefdesverdriet. Hij zegt dat het door de knoflook komt.',
      'Jij snijdt de gyros. Alleen het donkere, krokante vlees eraf. Het lichte vlees laat je nog even grillen, anders krijgen de gasten rauwe lappen.',
      'En daarna gooien we de oude borden kapot. Eigenlijk iets Grieks, maar het is gewoon veel leuker dan afwassen.',
    ], ['Geef dat mes', 'Ik ben vegetariër']);
    if (a !== 0) { await ui.dialog(N, ['Vegetariër? Dan krijg jij een bord knoflooksaus. Je vriendin slaapt vannacht toch op de bank.']); return; }
    if (g.mode === 'car') g.exitCar();
    g.setMode('walk');
    this.setActive('gyros', 'Gyros bij Cleopatra', 'Snijd zes keer het donkere vlees eraf en gooi daarna de stapel van tien borden kapot, binnen zes seconden.', '');
    const r = await startGyros(g);
    if (!r || this.active?.id !== 'gyros') return;
    if (r.ok) {
      await ui.dialog(N, [r.all ? `${r.good} perfecte plakjes en alle borden kapot!` : `${r.good} perfecte plakjes en ${r.plates} van de tien borden kapot.`, 'Hier, een schotel van het huis. Met zoveel knoflook dat je vannacht alleen slaapt. Gegarandeerd.']);
      await g.eat(makePuntzak(), 3);
      this.complete('gyros', 'Gyrosmeester van de Steenstraat!');
    } else {
      await ui.dialog(N, ['Rauw, aangebrand, rauw... De gasten bestellen nu een pizza. Probeer het nog eens.']);
      this.fail('Te weinig goede plakjes.');
    }
  },

  // ---------------------------------------------- Daags na de Tour: criterium door de Steenstraat
  async renner(npc, N, ui, g) {
    const path = this.criteriumPath;
    if (!path || path.length < 2) return;
    if (!g.vehicles.bike) { await ui.dialog(N, ['Te voet een criterium rijden? Haal eerst je fiets.']); return; }
    const a = await ui.dialog(N, [
      'Daags na de Tour! De dag na de Tour de France rijden de profs hier door Boxmeer. En vandaag oefen ik vast.',
      'De Steenstraat af, keren, en terug. Wie het eerst terug is bij de start, wint.',
      'De rondemissen staan bij de finish met bloemen en twee zoenen. Op de wang. Meestal.',
    ], ['Kom maar op!', 'Ik heb zadelpijn']);
    if (a !== 0) { await ui.dialog(N, ['Zadelpijn? Dan heb je de verkeerde fiets. Of de verkeerde broek. Liever schik as un neije boks!']); return; }
    if (g.mode === 'car') g.exitCar();
    g.setMode('bike');
    const route = path.concat(path.slice(0, -1).reverse());
    const half = path.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - path[i - 1][0], p[1] - path[i - 1][1]) : 0), 0);
    const lens = [0];
    for (let k = 1; k < route.length; k++) lens.push(lens[k - 1] + Math.hypot(route[k][0] - route[k - 1][0], route[k][1] - route[k - 1][1]));
    const total = lens.at(-1);
    const at = (s) => {
      s = Math.max(0, Math.min(total, s));
      let k = 1; while (k < lens.length - 1 && lens[k] < s) k++;
      const f = (s - lens[k - 1]) / Math.max(0.001, lens[k] - lens[k - 1]);
      const [ax, az] = route[k - 1], [bx, bz] = route[k];
      return [ax + (bx - ax) * f, az + (bz - az) * f, Math.atan2(bx - ax, bz - az)];
    };
    // projectie van een punt op een deel van de route (van s0 tot s1)
    const project = (x, z, s0, s1) => {
      let best = s0, bd = Infinity;
      for (let k = 1; k < route.length; k++) {
        if (lens[k] < s0 || lens[k - 1] > s1) continue;
        const [ax, az] = route[k - 1], [bx, bz] = route[k];
        const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
        const f = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
        const d = Math.hypot(x - ax - dx * f, z - az - dz * f);
        if (d < bd) { bd = d; best = lens[k - 1] + f * (lens[k] - lens[k - 1]); }
      }
      return Math.max(s0, Math.min(s1, best));
    };
    // tegenstander op de fiets; de gewone renner verdwijnt even
    const rider = makeCharacter({ shirt: 0xfdd835, pants: 0x111111, hair: 0x5d4037, hat: 'helmet', hatColor: 0x1e88e5 });
    const bike = makeBike(0x1e88e5);
    const rg = new THREE.Group();
    rg.add(bike, rider);
    rider.position.y = 0.35;
    g.scene.add(rg);
    npc.group.visible = false;
    // finishdoek en twee rondemissen bij de start
    const [sx, sz, sh] = at(0);
    const banner = makeFinishBanner(9);
    banner.position.set(sx, g.world.groundAt(sx, sz), sz);
    banner.rotation.y = sh;
    g.scene.add(banner);
    const missen = [1, -1].map((side) => {
      const mm = makeCharacter({ shirt: 0xffffff, pants: 0xffffff, hair: side > 0 ? 0xf5d06f : 0x3e2723, female: true, hairStyle: 'long', sash: 0xd32f2f });
      const mx = sx + Math.cos(sh) * 5.2 * side, mz = sz - Math.sin(sh) * 5.2 * side;
      mm.position.set(mx, g.world.groundAt(mx, mz), mz);
      mm.rotation.y = sh + Math.PI;
      g.scene.add(mm);
      return mm;
    });
    const [px, pz] = g.world.resolve(sx + Math.cos(sh) * 1.8, sz - Math.sin(sh) * 1.8, 0.5);
    g.player.x = px; g.player.z = pz; g.player.heading = sh; g.player.speed = 0;
    g.camYaw = sh + Math.PI;
    const marker = { x: sx, z: sz, color: '#fdd835', glyph: 'R', done: false };
    g.tempMarkers = [marker];
    this.setActive('criterium', 'Daags na de Tour', 'Fiets de Steenstraat af, keer bij de gele ring en fiets terug naar de finish. Sneller dan de renner! Alleen op de fiets.', '');
    let s = 0, t = 0, speed = 0, finished = false, lastGap = null, stage = 1;
    const base = Math.max(7, (g.bikeSpeed || 12.5) * 0.84);
    const cleanup = () => { g.scene.remove(rg); g.scene.remove(banner); missen.forEach((q) => g.scene.remove(q)); npc.group.visible = true; g.tempMarkers = []; if (g.minigame?.race) g.minigame = null; };
    this.active.cleanup = cleanup;
    const go = (fn) => { if (!finished) { finished = true; fn(); } };
    const opts = { noTimer: true, violate: () => (t > 3 && g.mode !== 'bike' ? 'Valsspelen! Dit is een wielerwedstrijd.' : null) };
    const lose = (msg) => go(() => { cleanup(); this.fail(msg || 'Opgegeven.'); });
    const end = path.at(-1);
    g.setDestination(g.world.resolve(end[0], end[1], 0.5), 900, () => {
      stage = 2;
      g.ui.toast('Keren! Terug naar de finish!', 1500);
      g.setDestination([sx, sz], 900, () => go(async () => {
        g.sfx?.play('cheer');
        g.fx?.confetti(g.player.x, g.world.groundAt(g.player.x, g.player.z) + 2.4, g.player.z, 140);
        await ui.dialog('De rondemissen', ['Gefeliciteerd! Hier zijn je bloemen. En twee zoenen, op de wang.', 'Nou vooruit, drie. Het is tenslotte Boxmeer.']);
        await ui.dialog(N, ['Wat?! Jij was eerder? Ik had... eh... de zon in mijn ogen. In de Steenstraat. Jij bent de winnaar van Daags na Daags na de Tour.']);
        cleanup();
        this.complete('criterium', 'Winnaar van Daags na de Tour!');
      }), lose, opts);
    }, lose, opts);
    g.ui.toast('3...', 800);
    g.minigame = {
      race: true, actionLabel: null,
      stop: () => { finished = true; cleanup(); },
      update: (dt) => {
        t += dt;
        const pl = g.player;
        if (t < 3) {
          pl.lockedFor = true; pl.speed = 0;
          const c = Math.ceil(3 - t);
          if (c !== this._count) { this._count = c; if (t > 0.05) g.ui.toast(`${c}...`, 700); g.sfx?.play('tally'); }
        } else {
          if (this._count !== 0) { this._count = 0; g.ui.toast('Gaan!', 900); g.sfx?.play('whistle'); }
          pl.lockedFor = false;
          // de renner remt af bij het keerpunt
          const toTurn = Math.abs(s - half);
          let want = base * (toTurn < 18 ? 0.45 + (toTurn / 18) * 0.55 : 1);
          const playerS = stage === 1 ? project(pl.x, pl.z, 0, half) : project(pl.x, pl.z, half, total);
          const gap = s - playerS;
          if (gap > 40) want *= 0.9; else if (gap < -25) want *= 1.12;
          speed += (want - speed) * Math.min(1, dt * 1.5);
          s += speed * dt;
          const lead = Math.abs(gap) < 5 ? 'Zij aan zij!' : gap > 0 ? `Renner ligt ${Math.round(gap)} m voor` : `Jij ligt ${Math.round(-gap)} m voor`;
          if (lead !== lastGap) { lastGap = lead; this.progress(lead); }
          if (s >= total) go(async () => {
            g.clearDestination();
            await ui.dialog(N, ['Haha! Eerst over de streep! De rondemissen zijn voor mij.', 'Volgend jaar beter. Train eens wat bij FysioHolland.']);
            cleanup();
            this.fail('De renner was eerder bij de finish.');
          });
        }
        const [x, z, h] = at(s);
        rg.position.set(x, g.world.groundAt(x, z), z);
        rg.rotation.y = h;
        rider.userData.animate(dt, speed, 'bike');
        marker.x = x; marker.z = z;
      },
    };
  },

  // ---------------------------------------------- Het Heilig Bloed: misswijn halen
  async koster(npc, N, ui, g) {
    const a = await ui.dialog(N, [
      'Wist je dat hier rond 1400 een wonder gebeurde? Een priester twijfelde of er echt bloed in de kelk zat, en toen werd de wijn bloed. Het Heilig Bloed van Boxmeer.',
      'Bij ons gebeurt nu het omgekeerde wonder: de misswijn verdwijnt. Elke week. De kapelaan zegt dat het een wonder is. Ik denk dat het de kapelaan is.',
      'Haal jij vier nieuwe flessen bij de Albert Heijn? En breek ze niet. Botsen is breken, en dan krijg je pas echt bloed op de stoep.',
    ], ['Ik haal de wijn', 'Ik drink zelf geen wijn']);
    if (a !== 0) { await ui.dialog(N, ['Je hoeft hem niet te drinken. Dat doet de kapelaan wel.']); return; }
    if (g.mode === 'car') g.exitCar();
    this.setActive('heiligbloed', 'Het Heilig Bloed', 'Haal de misswijn bij de Albert Heijn.', '');
    const act = this.active;
    const ah = g.facades.frames.albertheijn;
    const ahPoi = g.world.meta.pois.find((p) => p.id === 'albertheijn');
    const shop = ah ? g.world.resolve(ah.x + ah.nx * 3, ah.z + ah.nz * 3, 0.6) : g.world.spotNear(...ahPoi.pos);
    g.setDestination(shop, 150, async () => {
      if (this.active !== act) return;
      await ui.dialog('Caissière van de Albert Heijn', ['Vier flessen rode wijn, om tien uur \'s ochtends? Voor de kerk? Tuurlijk. Dat zeggen ze allemaal.']);
      if (this.active !== act) return;
      carryWine.call(this, act);
    }, (msg) => this.fail(msg || 'Te laat, de mis is al begonnen. Met water.'));
  },

  // ---------------------------------------------- opa: Boksmèrs
  async opa(npc, N, ui) {
    // woorden met betekenis uit openbare woordenlijsten van het Boxmeers (nog laten nakijken)
    const pool = [
      ['joe', 'dag (als groet)'], ['erpel', 'aardappels'], ['plat', 'dialect'], ['mien', 'mijn'], ['wöölese', 'pubers'],
      ['klutje', 'klein mensje'], ['ingsullu', 'uiteindelijk'], ['boks', 'broek'], ['mik', 'brood'], ['schik', 'plezier'],
      ['huus', 'huis'], ['neije', 'nieuwe'], ['snèj', 'snee'], ['gin', 'geen'],
    ];
    await ui.dialog(N, [
      B('Joe, jong. Kom eens bij me zitten op het bankje.', 'Dag, jongen. Kom eens bij me zitten op het bankje.'),
      'Spreek jij nog plat? Of is het allemaal Hollands tegenwoordig? Ik noem een woord, jij zegt wat het betekent. Drie van de vier goed, dan ben je een echte Boksmèrse of Boksmèrs.',
    ]);
    const qs = pool.slice().sort(() => Math.random() - 0.5).slice(0, 4);
    let good = 0;
    for (const [word, meaning] of qs) {
      const wrong = pool.filter((p) => p[1] !== meaning).sort(() => Math.random() - 0.5).slice(0, 2).map((p) => p[1]);
      const opts = [meaning, ...wrong].sort(() => Math.random() - 0.5);
      const pick = await ui.dialog(N, [`Wat is "${word}"?`], opts);
      if (opts[pick] === meaning) { good++; await ui.dialog(N, ['Goed zo!']); }
      else await ui.dialog(N, [`Nee nee. "${word}" is ${meaning}.`]);
    }
    if (good < 3) {
      await ui.dialog(N, [`${good} van de 4... Kom morgen maar weer op het bankje zitten, dan oefenen we nog wat.`]);
      this.refresh();
      return;
    }
    // bonusvraag: een echte Boksmèrse uitdrukking
    const sayings = ['Liever plezier dan een nieuwe broek', 'Liever een nieuwe broek dan schik', 'Liever bier dan een broek'];
    const opts = sayings.slice().sort(() => Math.random() - 0.5);
    const pick = await ui.dialog(N, [`${good} van de 4! Nog eentje voor de eer. Wat betekent "Liever schik as un neije boks"?`], opts);
    if (opts[pick] === sayings[0]) await ui.dialog(N, ['Precies! Plezier gaat voor alles. Daarom zit ik hier al de hele dag. Ik heb nog geen nieuwe broek, maar wel veel schik.']);
    else await ui.dialog(N, ['Bijna! Het is: liever plezier dan een nieuwe broek. Onthoud dat, dan kom je ver in Boxmeer.']);
    await ui.dialog(N, [B('Jij bent een echte Boksmèrse of Boksmèrs. Joe!', 'Jij bent een echte Boxmeerse of Boxmeerder. Dag!')]);
    this.complete('plat', 'Plat kalle: geslaagd!');
  },

  // ---------------------------------------------- carnaval: de metworst van zeven el
  async prins(npc, N, ui, g) {
    if (this.active?.id === 'metworst') {
      await ui.dialog(N, [`Nog ${g.followers.length - g.followersJoined()} dragers te gaan. Schiet op, de metworst wordt koud!`]);
      return;
    }
    const a = await ui.dialog(N, [
      'Alaaf! Het is carnavalsmaandag in Boksmèr, en dan hoort er een metworst bij. Van zeven el. Dat is bijna vijf meter worst.',
      'Alleen zitten de dragers nog in de kroeg. Sinds vrijdag. Ze denken dat het nog zaterdag is.',
      'Haal ze op en kom met een polonaise terug naar het Raadhuisplein. Te voet natuurlijk, en snel, voordat iemand anders aan de worst begint te knabbelen.',
    ], ['Alaaf, ik ga!', 'Ik ben vegetariër']);
    if (a !== 0) { await ui.dialog(N, ['Vegetariër? Met carnaval? Dan mag jij de mosterd dragen.']); return; }
    if (g.mode === 'car') g.exitCar();
    g.setMode('walk');
    const n = g.world.isMobile ? 5 : 6;
    g.startPolonaise(n, { minD: 30, maxD: 140, joinLines: ['Alaaf! Is het al maandag?', 'Wie heeft mijn boks gezien?', 'Metworst? Ik kom!', 'Nog\'us eentje en dan ga ik mee!', 'Joe! Waar is de polonaise?', 'Ik hou van worst!'] });
    this.setActive('metworst', 'De metworst van zeven el', 'De dragers staan als roze punten op de kaart. Loop erheen, dan lopen ze achter je aan. Breng ze naar het Raadhuisplein.', `0 / ${n} dragers`);
    const plein = g.world.spotNear(2, 2);
    g.setDestination(plein, 300, async () => {
      g.stopPolonaise();
      // de metworst ligt klaar op het plein
      const worst = makeMetworst();
      const [wx, wz] = g.world.resolve(npc.pos.x + 3, npc.pos.z + 2, 3);
      worst.position.set(wx, g.world.groundAt(wx, wz), wz);
      g.scene.add(worst);
      setTimeout(() => g.scene.remove(worst), 60000);
      await ui.dialog(N, ['Daar zijn ze allemaal! Zeven el metworst, en zes dragers die nog net rechtop staan.', 'Vivat de Metworstkoning! Alaaf!']);
      const gy = g.world.groundAt(npc.pos.x, npc.pos.z);
      npc.pose = 'wave'; npc.heading = Math.atan2(g.player.x - npc.pos.x, g.player.z - npc.pos.z);
      for (let k = 0; k < 5; k++) setTimeout(() => { g.fx?.candy(npc.pos.x, gy + 2.1, npc.pos.z, 26, gy, [g.player.x, g.player.z]); g.sfx?.play('pop'); }, k * 420);
      setTimeout(() => { npc.pose = null; }, 3000);
      this.complete('metworst', 'Vivat de Metworstkoning!');
    }, (msg) => { g.stopPolonaise(); this.fail(msg || 'Te laat. De metworst is al opgegeten.'); }, {
      require: () => (g.followersJoined() >= n ? null : `Je hebt pas ${g.followersJoined()} van de ${n} dragers.`),
      violate: () => (g.mode !== 'walk' ? 'Een polonaise doe je te voet!' : null),
    });
  },
};

// misswijn van de Albert Heijn naar de basiliek dragen
function carryWine(act) {
  const g = this.g, ui = g.ui;
  const crate = makeWineCrate();
  g.holdProp(crate);
  let left = 4;
  act.noVehicles = true;
  if (g.mode !== 'walk') g.setMode('walk');
  act.desc = 'Loop rustig naar de Sint-Petrusbasiliek en zet de wijn bij het altaar. Nergens tegenaan!';
  this.progress('Flessen: 4 / 4');
  this.refresh();
  act.cleanup = () => { g.fragile = null; g.dropProp(); };
  g.fragile = () => {
    const b = crate.userData.layers.pop();
    if (!b) return;
    left--;
    const wp = new THREE.Vector3();
    b.getWorldPosition(wp);
    crate.remove(b);
    const floorY = g.interior ? 0 : g.world.groundAt(wp.x, wp.z);
    const splat = new THREE.Mesh(new THREE.CircleGeometry(0.45, 18), new THREE.MeshStandardMaterial({ color: 0x5a0a14, roughness: 0.25 }));
    splat.rotation.x = -Math.PI / 2;
    splat.position.set(wp.x, floorY + 0.03, wp.z);
    g.scene.add(splat);
    setTimeout(() => g.scene.remove(splat), 20000);
    g.sfx?.play('splat');
    g.ui.toast(left === 3 ? 'Kraak! Bloed op de stoep... nee, gewoon wijn.' : 'Daar gaat weer een fles!', 1800);
    this.progress(`Flessen: ${left} / 4`);
    if (left <= 0) { g.fragile = null; this.fail('Alle flessen kapot. De Steenstraat ruikt naar een studentenfeest.'); }
  };
  const f = g.facades.frames.basiliek;
  const poi = g.world.meta.pois.find((p) => p.id === 'basiliek');
  const dest = f ? g.world.resolve(f.x + f.nx * 4, f.z + f.nz * 4, 0.6) : g.world.spotNear(...poi.pos);
  g.setDestination(dest, 240, async () => {
    const kerk = g.interiors.room('kerk');
    g.sfx?.play('bells');
    await g.enterInterior(kerk, {
      triggers: [{
        x: kerk.coffeeTable.x, z: kerk.coffeeTable.z, r: kerk.coffeeTable.r, label: 'Zet de wijn bij het altaar',
        action: async () => {
          kerk.activeTriggers = [];
          g.fragile = null;
          g.dropProp();
          if (left >= 2) {
            await ui.dialog('De koster', [`${left} flessen heel! De mis kan door. En het wonder van de verdwijnende wijn ook, vrees ik.`, 'Hier, een slokje voor de bezorger. Niet doorvertellen aan de kapelaan, die telt de flessen.']);
            this.complete('heiligbloed', 'Misswijn bezorgd!');
          } else {
            await ui.dialog('De koster', ['Eén fles voor de hele mis? Dan wordt het een wel heel klein wondertje. En de kapelaan kijkt nu al zo dorstig.']);
            this.fail('Te weinig wijn heel aangekomen. Probeer het opnieuw bij de koster.');
          }
        },
      }],
    });
  }, (msg) => this.fail(msg || 'Te laat, de mis is al begonnen. Met water.'));
}
