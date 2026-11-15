// Maakt de achtergrond van het laadscherm: je poppetje in de Steenstraat met de basiliek aan het eind (1920 x 1080,
// zonder knoppen en teksten), opgeslagen als public/laadbeeld.jpg en een kleine versie public/laadbeeld-klein.jpg.
// Gebruik: npm run build && npx vite preview --port 4173 &   en dan   node tools/laadbeeld.cjs
// Heeft Python met Pillow nodig om het beeld als JPEG in twee maten op te slaan.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(1800000);
  page.on('console', (m) => { if (m.type() === 'error') console.log('console:', m.text().slice(0, 200)); });
  await page.goto((process.env.URL || 'http://localhost:4173/') + '?kwaliteit=hoog&dev');
  await page.waitForSelector('#start-btn:not([hidden])');
  await page.evaluate(() => { const g = window.game; g.renderer.setAnimationLoop = () => {}; g.adaptQuality = () => {}; g.dawn = async () => {}; g.updateDayNight = () => {}; g.checkBlack = () => {}; });
  await page.click('#start-btn');
  for (let i = 0; i < 8; i++) { await page.waitForTimeout(300); if (!(await page.evaluate(() => game.ui.dialogOpen)) && i > 1) break; await page.evaluate(() => document.getElementById('dialog').click()); }
  const url = await page.evaluate(() => {
    const g = window.game, p = g.player;
    // in de Steenstraat, met de vlaggetjes en de toren van de Sint-Petrusbasiliek aan het eind; je poppetje vooraan
    const T = [343.35, 226.85];
    let best = null;
    for (const [x, z] of g.world.streetPath('Steenstraat')) { const d = Math.hypot(x - T[0], z - T[1]); if (x < T[0] && (!best || Math.abs(d - 80) < Math.abs(best.d - 80))) best = { d, x, z }; }
    [p.x, p.z] = g.world.resolve(best.x, best.z, 0.5);
    const away = Math.atan2(p.x - T[0], p.z - T[1]); // van de toren af, naar de camera
    p.heading = away + 0.5; p.speed = 0; p.group.visible = true; // half naar de camera gedraaid
    g.camYaw = away - 0.12; g.camPitch = 0.04; g.camDist = 6.5; g.lastManualLook = g.time + 1e6;
    if (g.timeOfDay !== 15) { g.timeOfDay = 15; g.applyTime(); }
    g.clock.getDelta();
    for (let i = 0; i < 3; i++) { g.tickInner(); g.updateCamera(0, true); }
    g.render();
    return { url: g.canvas.toDataURL('image/png'), w: g.canvas.width, h: g.canvas.height };
  });
  const png = path.join(root, 'laadbeeld-tmp.png');
  fs.writeFileSync(png, Buffer.from(url.url.split(',')[1], 'base64'));
  // als JPEG opslaan, groot en klein
  execFileSync('python3', ['-c', `from PIL import Image
im = Image.open(r'${png}').convert('RGB')
im.save(r'${path.join(root, 'public/laadbeeld.jpg')}', quality=80, optimize=True, progressive=True)
im.resize((960, 540), Image.LANCZOS).save(r'${path.join(root, 'public/laadbeeld-klein.jpg')}', quality=78, optimize=True, progressive=True)`]);
  fs.unlinkSync(png);
  console.log('gemaakt', url.w, url.h);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
