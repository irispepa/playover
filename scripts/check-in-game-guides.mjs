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
const results = [], errors = [];
async function clickText(page, text) {
  const handle = await page.evaluateHandle((wanted) => [...document.querySelectorAll('button')].find((node) => {
    const style = getComputedStyle(node);
    return node.getBoundingClientRect().height > 0 && style.visibility !== 'hidden' && node.textContent.trim().startsWith(wanted);
  }), text);
  const element = handle.asElement();
  assert(element, `Missing visible button: ${text}`);
  await element.click();
  await handle.dispose();
}

try {
  for (const game of GAMES) {
    const page = await browser.newPage();
    page.on('pageerror', (error) => errors.push(`${game.id}: ${error.message}`));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(`${game.id}: ${message.text()}`); });
    await page.setViewport({ width: 375, height: 667, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await page.goto(`${base}?game=${game.id}`, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => !!document.querySelector('.game-root') && !document.querySelector('.po-loading'));
    if (['oddcrown', 'planets', 'reef'].includes(game.id)) {
      await page.click('.arc-dialog .arc-primary');
      await page.waitForSelector('.fg-guide[open]');
      await page.keyboard.press('Escape');
      await page.click('.arc-help');
    } else if (game.id === 'everbrook') {
      await clickText(page, 'New valley');
      await clickText(page, 'Begin');
      await page.waitForSelector('.fg-guide[open]');
      await page.keyboard.press('Escape');
      await page.click('button[aria-label="Menu"]');
      await clickText(page, 'How to play');
    } else if (game.id === 'lanternfall') {
      await clickText(page, 'Settings');
      await clickText(page, 'How to play');
    } else {
      // Includes Patch & Kettle's newly integrated title-screen guide entry.
      await clickText(page, 'How to play');
    }
    await page.waitForSelector('.fg-guide[open]');
    const first = await page.$eval('.fg-guide .fg-title', (node) => node.textContent);
    const count = Number(await page.$eval('.fg-count', (node) => node.textContent.split(' / ')[1]));
    assert(count >= 3 && count <= 5, `${game.id}: expected short standardized guide`);
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.$eval('.fg-count', (node) => node.textContent.split(' / ')[0]), '2');
    for (let i = 2; i < count; i++) await page.keyboard.press('ArrowRight');
    await page.click('.fg-more');
    assert.match(await page.$eval('.fg-count', (node) => node.textContent), /^More tips/);
    await page.screenshot({ path: join(output, `in-game-guide-${game.id}.png`) });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('.fg-guide'));
    assert.equal(new URL(page.url()).searchParams.get('game'), game.id);
    assert(await page.$('.game-root'));
    results.push({ id: game.id, first, count });
    console.log(`PASS ${game.id}: in-game menu guide and More tips return to game`);
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log('PASS all nine in-game guide entries; no console or runtime errors');
} finally {
  await writeFile(join(output, 'in-game-guide-checks.json'), JSON.stringify({ base, results, errors }, null, 2));
  await browser.close();
}
