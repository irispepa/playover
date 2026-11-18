import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';
import { GAMES } from '../src/games.js';

const base = process.env.PLAYOVER_URL || 'http://127.0.0.1:5328/';
const output = process.env.PLAYOVER_EVIDENCE || '/private/tmp/playover-home-check';
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, pipe: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const results = [];
const check = (name, detail) => { results.push({ name, detail }); console.log(`PASS ${name}`); };
const viewport = { width: 375, height: 667, deviceScaleFactor: 1, isMobile: true, hasTouch: true };
async function isolated() {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport(viewport);
  await page.setBypassServiceWorker(true);
  return { context, page };
}
async function entry(page) {
  await page.waitForFunction(() => !!document.querySelector('.game-root') && !document.querySelector('.po-loading'), { timeout: 30000 });
}

try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewport(viewport);
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload({ waitUntil: 'networkidle0' });
  assert(await page.evaluate(() => !!navigator.serviceWorker.controller));
  const cache = await page.evaluate(async () => (await Promise.all((await caches.keys()).map(async (name) => ({ name, count: (await (await caches.open(name)).keys()).length })) )));
  assert(cache.some((entry) => entry.count > 40));
  check('complete production cache controls Home', cache);
  await page.setOfflineMode(true);
  for (const game of GAMES) {
    // A reload resets the JS module map: each game is a cold offline launch.
    await page.reload({ waitUntil: 'networkidle0' });
    assert(await page.evaluate(() => !navigator.onLine));
    assert(await page.$$eval('.po-home img', (images) => images.every((image) => image.complete && image.naturalWidth > 0)));
    await page.click(`#info-${game.id}`);
    const beforeGuide = await page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map((key) => [key, localStorage.getItem(key)])));
    await page.click('#po-how-to');
    await page.waitForSelector('.fg-guide[open]');
    const count = Number(await page.$eval('.fg-count', (node) => node.textContent.split(' / ')[1]));
    for (let i = 1; i < count; i++) await page.keyboard.press('ArrowRight');
    await page.click('.fg-more');
    assert.match(await page.$eval('.fg-count', (node) => node.textContent), /^More tips/);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('.fg-guide'));
    assert.equal(await page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map((key) => [key, localStorage.getItem(key)]))), beforeGuide);
    await page.click('.po-close');
    await page.waitForFunction(() => !document.querySelector('dialog[open]'));
    check(`${game.id}: cold offline guide and More tips, saves unchanged`);
    await page.click(`#play-${game.id}`);
    await entry(page);
    assert.equal(new URL(page.url()).searchParams.get('game'), game.id);
    await page.goBack();
    await page.waitForSelector('.po-home');
    check(`${game.id}: cold offline reload and launch`);
  }
  assert.deepEqual(errors, []);
  await page.screenshot({ path: join(output, 'home-offline.png') });
  await page.close();

  const delayed = await isolated();
  await delayed.page.setRequestInterception(true);
  let release, held;
  const requested = new Promise((resolve) => { release = resolve; });
  delayed.page.on('request', (request) => {
    if (/\/assets\/reef-[^/]+\.js/.test(request.url())) { held = request; release(); }
    else request.continue();
  });
  await delayed.page.goto(base, { waitUntil: 'networkidle0' });
  await delayed.page.click('#play-reef');
  await requested;
  await delayed.page.click('.po-loading .po-action');
  await delayed.page.waitForSelector('.po-home');
  await held.continue();
  await delayed.page.waitForNetworkIdle();
  assert.equal(await delayed.page.$('.game-root'), null);
  assert.equal(new URL(delayed.page.url()).searchParams.has('game'), false);
  check('leaving during delayed import cannot start game');
  await delayed.context.close();

  const failed = await isolated();
  await failed.page.setRequestInterception(true);
  let block = true;
  failed.page.on('request', (request) => {
    if (block && /\/assets\/planets-[^/]+\.js/.test(request.url())) request.abort();
    else request.continue();
  });
  await failed.page.goto(base, { waitUntil: 'networkidle0' });
  await failed.page.click('#info-planets');
  await failed.page.click('#po-sheet-play');
  await failed.page.waitForFunction(() => document.querySelector('.po-loading p')?.textContent === 'This game could not start.');
  block = false;
  await failed.page.screenshot({ path: join(output, 'loading-error.png') });
  await Promise.all([failed.page.waitForNavigation({ waitUntil: 'networkidle0' }), failed.page.click('.po-loading .po-primary')]);
  await entry(failed.page);
  await failed.page.goBack();
  await failed.page.waitForSelector('.po-sheet[open]');
  assert.equal(new URL(failed.page.url()).searchParams.get('info'), 'planets');
  check('failed chunk retry recovers and preserves return origin');
  await failed.context.close();

  const saves = await isolated();
  await saves.page.evaluateOnNewDocument(() => {
    window.oscillatorStarts = 0;
    const start = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (...args) { ++window.oscillatorStarts; return start.apply(this, args); };
  });
  await saves.page.goto(base, { waitUntil: 'networkidle0' });
  await saves.page.click('#play-reef');
  await entry(saves.page);
  await saves.page.click('.arc-dialog .arc-primary');
  const guide = await saves.page.$('.fg-guide[open]');
  if (guide) await saves.page.keyboard.press('Escape');
  const beforeAction = await saves.page.evaluate(() => window.oscillatorStarts);
  await saves.page.focus('canvas');
  await saves.page.keyboard.press('Enter');
  const started = await saves.page.evaluate(() => window.oscillatorStarts);
  assert(started > beforeAction, 'actual Reef action should produce sound');
  await saves.page.goBack();
  await saves.page.waitForSelector('.po-home');
  const stored = await saves.page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((key) => key.startsWith('flightgames:reef:')).map((key) => [key, localStorage.getItem(key)])));
  assert(Object.keys(stored).some((key) => key.includes('save')));
  await saves.page.click('#home-sound');
  await saves.page.click('#play-reef');
  await entry(saves.page);
  const same = await saves.page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((key) => key.startsWith('flightgames:reef:')).map((key) => [key, localStorage.getItem(key)])));
  assert.deepEqual(same, stored, 'opening entry must preserve existing saves');
  const actions = await saves.page.$$eval('.arc-dialog button', (buttons) => buttons.map((button) => button.textContent));
  assert(actions.some((text) => text.includes('Continue')));
  await saves.page.click('.arc-dialog .arc-primary');
  const beforeMuted = await saves.page.evaluate(() => window.oscillatorStarts);
  await saves.page.focus('canvas');
  await saves.page.keyboard.press('Enter');
  assert.equal(await saves.page.evaluate(() => window.oscillatorStarts), beforeMuted);
  check('real game sound obeys global mute and existing save offers Continue');
  await saves.context.close();
} finally {
  await writeFile(join(output, 'offline-checks.json'), JSON.stringify({ base, results }, null, 2));
  await browser.close();
}
