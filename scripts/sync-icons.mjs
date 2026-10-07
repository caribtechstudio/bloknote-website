// Inline the vendored official Lucide SVGs so icons also work without JavaScript.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const pages = ['index.html', 'contact.html', 'confidentialite.html', 'mentions-legales.html', '404.html'];
for (const page of pages) {
  let html = await readFile(resolve(root, page), 'utf8');
  const matches = [...html.matchAll(/<svg\b([^>]*\bdata-lucide="([a-z-]+)"[^>]*)>[\s\S]*?<\/svg>/g)];
  for (const [markup, attributes, name] of matches) {
    const source = await readFile(resolve(root, `assets/icons/${name}.svg`), 'utf8');
    const content = source.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/)?.[1].trim().replace(/\s*\n\s*/g, '');
    if (!content) throw new Error(`Invalid Lucide SVG: ${name}`);
    const extraClass = attributes.match(/\bclass="([^"]*)"/)?.[1].replace(/\blucide\b/g, '').trim();
    const icon = `<svg class="lucide${extraClass ? ` ${extraClass}` : ''}" data-lucide="${name}" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${content}</svg>`;
    html = html.replace(markup, icon);
  }
  await writeFile(resolve(root, page), html);
}
console.log('Icônes Lucide synchronisées dans les 5 pages.');
