import { chromium, webkit } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
const port = 4174;
const origin = process.env.QA_URL || `http://127.0.0.1:${port}/bloknote-website/`;
const server = process.env.QA_URL ? null : spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: String(port), SERVE_DIST: '1' }, stdio: ['ignore', 'pipe', 'inherit'] });
if (server) await Promise.race([once(server.stdout, 'data'), once(server, 'exit').then(() => { throw new Error('Preview server failed'); })]);
const engines = process.env.QA_WEBKIT === '1' ? { chromium, webkit } : { chromium };
const pages = ['', 'contact.html', 'confidentialite.html', 'mentions-legales.html', '404.html'];
const widths = (process.env.QA_WIDTHS || '320,390,768,1024,1440').split(',').map(Number);
const results = [];
await mkdir('qa', { recursive: true });
try {
  for (const [name, engine] of Object.entries(engines)) {
    const browser = await engine.launch();
    const errors = [];
    let takingScreenshot = false;
    const context = await browser.newContext({reducedMotion:'reduce'});
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.setDefaultNavigationTimeout(30000);
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() !== 'error') return;
      // Playwright injects a harmless `body {}` style to sync WebKit screenshots.
      // Our CSP blocks that test-only style; do not weaken the production policy for QA.
      if (name === 'webkit' && takingScreenshot && message.text().startsWith('Refused to apply a stylesheet because its hash')) return;
      errors.push(message.text());
    });
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of pages) {
        await page.goto(new URL(route, origin).href, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        const layout = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: innerWidth, h1: document.querySelectorAll('h1').length, unloaded: [...document.images].filter(image => !image.complete || !image.naturalWidth).map(image => image.src) }));
        // Force below-fold lazy images to load before inspecting the whole page.
        await page.evaluate(async () => {
          for (const image of document.images) { image.loading = 'eager'; }
          await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
        });
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        assert(layout.scroll <= layout.viewport, `${name}/${route}/${width}: horizontal overflow ${layout.scroll}`);
        assert.equal(layout.h1, 1);
        assert(await page.evaluate(() => [...document.images].every(image => image.naturalWidth > 0)), `${route}: broken image`);
        const audit = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
        assert.equal(audit.violations.length, 0, `${name}/${route}/${width}: ${JSON.stringify(audit.violations.map(item => ({id:item.id, impact:item.impact,nodes:item.nodes.map(node => node.target)})))}`);
        results.push({ engine: name, route: route || 'index.html', width, accessibilityViolations: audit.violations.length, horizontalOverflow: false });
        if ((width === 390 || width === 1440) && (route === '' || width === 390)) {
          takingScreenshot = true;
          try { await page.screenshot({path:`qa/${name}-${route.replace('.html','') || 'home'}-${width}.png`,fullPage:true,caret:'initial'}); }
          finally { takingScreenshot = false; }
        }
      }
      console.log(`${name} : 5 pages validées à ${width}px.`);
    }
    await page.setViewportSize({width:390,height:844});
    await page.goto(origin);
    const menu = page.locator('.nav-toggle');
    await menu.click();
    assert.equal(await menu.getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Escape');
    assert.equal(await menu.getAttribute('aria-expanded'), 'false');
    await menu.click();
    await page.locator('#main-nav').getByRole('link',{name:'Fonctionnalités'}).click();
    assert.equal(await menu.getAttribute('aria-expanded'), 'false');
    assert(page.url().endsWith('#fonctionnalites'));
    for (const [filter,count] of [['ecriture',8],['quotidien',6],['budget',5],['ressources',3],['all',22]]) {
      await page.locator(`[data-filter="${filter}"]`).click();
      assert.equal(await page.locator('.feature-card:visible').count(), count);
      assert.equal(await page.locator(`[data-filter="${filter}"]`).getAttribute('aria-pressed'), 'true');
    }
    for (const scene of ['groceries','habits','voice','trip']) {
      await page.locator(`#tab-${scene}`).click();
      assert.equal(await page.locator(`#panel-${scene}`).isVisible(),true);
      assert((await page.locator('#demo-screen').getAttribute('src')).endsWith(`${scene}.webp`));
    }
    await page.locator('#tab-trip').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#tab-groceries').getAttribute('aria-selected'), 'true');
    await page.keyboard.press('End');
    assert.equal(await page.locator('#tab-voice').getAttribute('aria-selected'), 'true');
    await page.locator('.faq-list summary').first().click();
    assert.equal(await page.locator('.faq-list details').first().getAttribute('open'), '');
    assert((await page.locator('#disponibilite .button').getAttribute('href')).startsWith('mailto:contact@caribtechstudio.com?'));
    // Text enlargement must preserve the mobile layout and its controls.
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    const enlarged = await page.evaluate(() => ({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(element => {const bounds=element.getBoundingClientRect();return bounds.right>innerWidth+1 && getComputedStyle(element).position !== 'absolute' && !element.closest('.hero-stage');}).map(element=>({tag:element.tagName,class:element.className,width:element.getBoundingClientRect().width}))}));
    // scrollWidth rounds fractional rem/font metrics differently across renderers.
    // Allow one CSS pixel at 200% text; default-size checks remain exact.
    assert(enlarged.scroll <= enlarged.width + 1, `200% text overflow: ${JSON.stringify(enlarged)}`);
    // A real Pages request at a nested missing path must still load the branded 404 assets.
    if (!process.env.QA_URL) {
      const response = await page.goto(new URL('unknown/nested/page',origin).href);
      assert.equal(response.status(),404);
      assert.equal(await page.locator('h1').textContent(),'Cette page apris une autre note.');
      await page.locator('.not-found .button').click();
      assert.equal(await page.locator('#hero-title').count(),1);
      errors.splice(errors.findIndex(error => error.includes('unknown/nested/page')),1);
      // Browser reports the intentional 404 response as a resource error too.
      for (let i=errors.length-1;i>=0;i--) if (errors[i].includes('404')) errors.splice(i,1);
    }
    assert.equal(errors.length,0,`Browser errors: ${errors.join('\n')}`);
    const noJS = await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
    const fallback = await noJS.newPage();
    await fallback.goto(origin);
    assert.equal(await fallback.locator('.feature-card:visible').count(),22);
    assert.equal(await fallback.locator('.demo-detail:visible').count(),4);
    assert.equal(await fallback.locator('#main-nav a:visible').count(),4);
    await noJS.close();
    const motion = await browser.newContext({reducedMotion:'no-preference',viewport:{width:390,height:844}});
    const animated = await motion.newPage();
    await animated.goto(origin);
    await animated.locator('#fonctionnalites').scrollIntoViewIfNeeded();
    await animated.waitForTimeout(750);
    assert(await animated.locator('.feature-card.reveal-visible').count() > 0);
    assert(Number(await animated.locator('.site-header').evaluate(element => getComputedStyle(element).getPropertyValue('--scroll-progress'))) > 0);
    await animated.emulateMedia({reducedMotion:'reduce'});
    await animated.waitForTimeout(100);
    assert.equal(await animated.locator('.reveal-pending').count(),0);
    await motion.close();
    await browser.close();
  }
  await writeFile('qa/report.json',JSON.stringify({checkedAt:new Date().toISOString(),results,interactions:'Menu, keyboard tabs, 22-block filters, FAQ, launch email, 200% text, nested 404 and no-JS fallback passed.'},null,2));
  console.log(`${results.length} contrôles de pages réussis. Largeurs : ${widths.join(', ')} px. Accessibilité et interactions validées.`);
} finally { server?.kill(); }
