import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';
import { GAMES } from '../src/games.js';

const base = process.env.PLAYOVER_URL || 'http://127.0.0.1:5327/';
const output = process.env.PLAYOVER_EVIDENCE || '/private/tmp/playover-home-check';
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true, pipe: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const results = [], errors = [];
const check = (name, detail) => { results.push({ name, detail }); console.log(`PASS ${name}`); };
const page = await browser.newPage();
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('request', (request) => {
  if (!['data:', 'blob:'].some((prefix) => request.url().startsWith(prefix)) && new URL(request.url()).origin !== new URL(base).origin) errors.push(`External request: ${request.url()}`);
});
const viewport = async (width, height) => page.setViewport({ width, height, deviceScaleFactor: 1, isMobile: width < 600, hasTouch: width < 600 });
const home = async () => { await page.goto(base, { waitUntil: 'networkidle0' }); await page.waitForSelector('.po-home'); };
const back = async (kind) => { await page.goBack(); await page.waitForSelector(kind); };
const storage = () => page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map((key) => [key, localStorage.getItem(key)])));

try {
  for (const [width, height] of [[375, 667], [390, 844], [430, 932], [375, 500], [1280, 900]]) {
    await viewport(width, height);
    await home();
    const layout = await page.evaluate(() => {
      const home = document.querySelector('.po-home');
      return { width: innerWidth, height: innerHeight, scrollWidth: home.scrollWidth, clientWidth: home.clientWidth,
        scrollHeight: home.scrollHeight, clientHeight: home.clientHeight, count: document.querySelectorAll('.po-game').length,
        nested: document.querySelectorAll('button button').length,
        targets: [...home.querySelectorAll('button')].map((button) => ({ id: button.id, width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })),
      };
    });
    assert.equal(layout.width, width);
    assert.equal(layout.count, 9);
    assert.equal(layout.nested, 0);
    assert.equal(layout.scrollWidth, layout.clientWidth);
    assert(layout.targets.every((target) => target.width >= 44 && target.height >= 44));
    if (width === 375 && height === 667) assert.equal(layout.scrollHeight, layout.clientHeight);
    await page.screenshot({ path: join(output, `home-${width}x${height}.png`) });
    check(`layout ${width}×${height}`, layout);
  }

  await viewport(375, 667);
  await home();
  await page.addStyleTag({ content: ':root{--sat:47px;--sab:34px;--sal:0px;--sar:0px}' });
  const safe = await page.$eval('.po-collection', (node) => ({ top: getComputedStyle(node).paddingTop, bottom: getComputedStyle(node).paddingBottom }));
  assert.deepEqual(safe, { top: '47px', bottom: '34px' });
  await page.screenshot({ path: join(output, 'home-safe-area.png') });
  check('safe areas counted once', safe);
  await home();
  await page.addStyleTag({ content: 'html{font-size:200%}' });
  const enlarged = await page.$eval('.po-home', (node) => ({ width: node.scrollWidth, clientWidth: node.clientWidth, height: node.scrollHeight, clientHeight: node.clientHeight,
    clipped: [...node.querySelectorAll('.po-summary,.po-name,.po-genre')].some((copy) => copy.scrollWidth > copy.clientWidth || copy.scrollHeight > copy.clientHeight + 1) }));
  assert.equal(enlarged.width, enlarged.clientWidth);
  assert.equal(enlarged.clipped, false);
  assert(enlarged.height > enlarged.clientHeight);
  await page.screenshot({ path: join(output, 'home-enlarged-text.png') });
  check('200% text naturally scrolls', enlarged);

  await home();
  await page.click('#home-sound');
  assert.equal(await page.$eval('#home-sound', (node) => node.getAttribute('aria-pressed')), 'false');
  await page.reload({ waitUntil: 'networkidle0' });
  assert.equal(await page.$eval('#home-sound', (node) => node.getAttribute('aria-label')), 'Sound effects off');
  await page.click('#home-sound');
  check('sound state persists across reload');

  for (const game of GAMES) {
    await page.click(`#info-${game.id}`);
    await page.waitForSelector('.po-sheet[open]');
    assert.equal(await page.$eval('.po-sheet h2', (node) => node.textContent), game.title);
    assert.equal(await page.$eval('.po-sheet p', (node) => node.textContent), game.tagline);
    const before = await storage();
    {
      await page.click('#po-how-to');
      await page.waitForSelector('.fg-guide[open]');
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.$eval('.fg-count', (node) => node.textContent.split(' / ')[0]), '2');
      await page.keyboard.press('ArrowLeft');
      assert.equal(await page.$eval('.fg-count', (node) => node.textContent.split(' / ')[0]), '1');
      // Exercise a touch-style horizontal swipe through the shared API.
      await page.$eval('.fg-guide', (node) => {
        node.dispatchEvent(new PointerEvent('pointerdown', { clientX: 240, clientY: 200, bubbles: true }));
        node.dispatchEvent(new PointerEvent('pointerup', { clientX: 100, clientY: 200, bubbles: true }));
      });
      assert.equal(await page.$eval('.fg-count', (node) => node.textContent.split(' / ')[0]), '2');
      await page.keyboard.press('Escape');
      await page.waitForSelector('.po-sheet[open]');
      await page.waitForFunction(() => !document.querySelector('.fg-guide'));
      assert.equal(await storage(), before, `${game.id}: guide changed saves`);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'po-how-to');
      // Finish also returns to the information sheet and does not launch a game.
      await page.click('#po-how-to');
      await page.waitForSelector('.fg-guide[open]');
      const count = Number(await page.$eval('.fg-count', (node) => node.textContent.split(' / ')[1]));
      for (let i = 1; i < count; i++) await page.keyboard.press('ArrowRight');
      await page.click('.fg-next');
      await page.waitForFunction(() => !document.querySelector('.fg-guide'));
      assert.equal(await storage(), before);
      assert.equal(new URL(page.url()).searchParams.get('info'), game.id);
      await page.click('#po-how-to');
      await page.waitForSelector('.fg-guide[open]');
      for (let i = 1; i < count; i++) await page.keyboard.press('ArrowRight');
      await page.click('.fg-more');
      assert.match(await page.$eval('.fg-count', (node) => node.textContent), /^More tips · 1 \/ /);
      await page.click('.fg-back');
      assert.equal(await page.$eval('.fg-count', (node) => node.textContent), `${count} / ${count}`);
      await page.click('.fg-more');
      await page.click('.fg-skip');
      await page.waitForFunction(() => !document.querySelector('.fg-guide'));
      assert.equal(await storage(), before, `${game.id}: More tips changed saves`);
      assert.equal(new URL(page.url()).searchParams.get('info'), game.id);
      check(`${game.id}: guide close/finish, keyboard/swipe, saves unchanged`);
      check(`${game.id}: More tips and return to main guide/sheet`);
    }
    await page.click('#po-sheet-play');
    await page.waitForFunction(() => !!document.querySelector('.game-root') && !document.querySelector('.po-loading'), { timeout: 30000 });
    assert.equal(new URL(page.url()).searchParams.get('game'), game.id);
    await back('.po-sheet[open]');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'po-sheet-play');
    await page.click('.po-close');
    await page.waitForFunction(() => !document.querySelector('dialog[open]'));
    assert.equal(await page.evaluate(() => document.activeElement.id), `info-${game.id}`);
    await page.click(`#play-${game.id}`);
    await page.waitForFunction(() => !!document.querySelector('.game-root') && !document.querySelector('.po-loading'), { timeout: 30000 });
    await back('.po-home');
    assert.equal(await page.evaluate(() => document.activeElement.id), `play-${game.id}`);
    check(`${game.id}: artwork and sheet Play open game, Back restores focus`);
  }

  await page.goto(`${base}?game=reef`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => !document.querySelector('.po-loading'));
  await page.keyboard.press('Escape');
  await page.waitForSelector('.po-home');
  assert.equal(new URL(page.url()).searchParams.has('game'), false);
  check('direct game link exits to Home');

  await home();
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.click('#info-planets');
  await page.click('#po-how-to');
  await page.waitForSelector('.fg-guide[open]');
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.$eval('.fg-on', (node) => getComputedStyle(node).animationName), 'none');
  await page.keyboard.press('Escape');
  check('guide respects reduced motion');

  assert.deepEqual(errors, []);
  check('no runtime errors or external requests');
} finally {
  await writeFile(join(output, 'checks.json'), JSON.stringify({ base, results, errors }, null, 2));
  await browser.close();
}
