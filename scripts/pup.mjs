// Headless-Chrome helper for play-testing a game at phone size.
//   import { openGame } from '../scripts/pup.mjs';
//   const { browser, page, shot, tap, errors } = await openGame({ port: 5320, game: 'everbrook' });
//   await shot('/abs/path/out.png'); await browser.close();
// Uses the system Chrome through puppeteer-core (no browser download).
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export async function openGame({ port, game = null, width = 390, height = 844, scale = 2, touch = true, fresh = true, path = '' } = {}) {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-first-run', '--mute-audio', '--enable-unsafe-swiftshader', '--use-angle=metal', '--ignore-gpu-blocklist', `--window-size=${width},${height}`],
  });
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: scale, isMobile: touch, hasTouch: touch });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  const url = `http://localhost:${port}/${path}${game ? `?game=${game}` : ''}`;
  await page.goto(url, { waitUntil: 'networkidle0' });
  if (fresh) {
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });
  }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  return {
    browser, page, errors, sleep,
    shot: (file) => page.screenshot({ path: file }),
    // Tap by CSS selector, by visible text (first match, exact then substring), or by {x, y}.
    async tap(target) {
      if (typeof target === 'object') { await page.touchscreen.tap(target.x, target.y); return true; }
      let handle = null;
      try { handle = await page.$(target); } catch { handle = null; }
      if (!handle) {
        handle = await page.evaluateHandle((text) => {
          const all = [...document.querySelectorAll('button, [role="button"], a, [data-tap]')].filter((n) => n.offsetParent !== null);
          return all.find((n) => n.textContent.trim() === text) || all.find((n) => n.textContent.includes(text)) || null;
        }, target);
        if (!(await handle.evaluate((n) => !!n))) return false;
      }
      const box = await handle.boundingBox();
      if (!box) return false;
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      return true;
    },
  };
}
