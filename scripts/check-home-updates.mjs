import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { appendFile, cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, extname } from 'node:path';
import puppeteer from 'puppeteer-core';

// Serve a disposable copy so update tests never mutate the review preview.
const root = await mkdtemp(join(tmpdir(), 'playover-update-'));
await cp(new URL('../dist/', import.meta.url), root, { recursive: true });
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  try {
    const file = join(root, path === '/' ? 'index.html' : path);
    response.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.end(await readFile(file));
  } catch { response.writeHead(404); response.end(); }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/`;
let browser;
try {
  browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, pipe: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 667, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument(() => sessionStorage.setItem('test:boots', String(Number(sessionStorage.getItem('test:boots') || 0) + 1)));
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload({ waitUntil: 'networkidle0' });
  const boots = await page.evaluate(() => Number(sessionStorage.getItem('test:boots')));
  await page.click('#play-reef');
  await page.waitForFunction(() => !!document.querySelector('.game-root') && !document.querySelector('.po-loading'));
  await appendFile(join(root, 'sw.js'), '\n// Update-test revision\n');
  await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration()).update(); });
  await page.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration()).waiting);
  assert.equal(await page.evaluate(() => Number(sessionStorage.getItem('test:boots'))), boots);
  assert.equal(new URL(page.url()).searchParams.get('game'), 'reef');
  console.log('PASS installed update waits while a game is open');
  await page.keyboard.press('Escape');
  await page.waitForFunction((before) => Number(sessionStorage.getItem('test:boots')) === before + 1, {}, boots);
  await page.waitForSelector('.po-home');
  await page.waitForNetworkIdle();
  assert.equal(await page.evaluate(() => Number(sessionStorage.getItem('test:boots'))), boots + 1);
  console.log('PASS returning Home applies update with one reload');
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
  await rm(root, { recursive: true, force: true });
}
