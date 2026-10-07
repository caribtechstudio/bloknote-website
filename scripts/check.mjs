import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const pages = ['index.html', 'contact.html', 'confidentialite.html', 'mentions-legales.html', '404.html'];
for (const page of pages) {
  const html = await readFile(resolve(root, page), 'utf8');
  assert(html.includes('<html lang="fr">'), `${page}: langue manquante`);
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${page}: un seul H1`);
  assert(html.includes('name="viewport"'), `${page}: viewport manquant`);
  assert(html.includes('name="description"'), `${page}: description manquante`);
  assert(html.includes('rel="canonical"'), `${page}: canonical manquant`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${page}: ID dupliqué`);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = match[1];
    if (/^(mailto:|https?:|#)/.test(url)) {
      if (url.startsWith('#')) assert(ids.includes(url.slice(1)), `${page}: ancre ${url}`);
      continue;
    }
    const file = url.replace(/^\/bloknote-website\//, '').split('#')[0];
    await stat(resolve(root, file === './' || file === '' ? 'index.html' : file));
    if (url.includes('#') && file === './') {
      const home = await readFile(resolve(root, 'index.html'), 'utf8');
      assert(home.includes(`id="${url.split('#')[1]}"`), `${page}: ancre externe ${url}`);
    }
  }
}
const home = await readFile(resolve(root, 'index.html'), 'utf8');
assert.equal((home.match(/class="feature-card"/g) || []).length, 22);
assert.equal((home.match(/role="tab"/g) || []).length, 4);
for (const scene of ['trip', 'groceries', 'habits', 'voice', 'list']) {
  const image = await stat(resolve(root, `assets/screenshots/${scene}.webp`));
  assert(image.size > 5000, `capture ${scene} vide`);
}
console.log('5 pages vérifiées : métadonnées, liens, ancres, 22 blocs et captures.');
