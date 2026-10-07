import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const files = ['index.html', 'contact.html', 'confidentialite.html', 'mentions-legales.html', '404.html', 'styles.css', 'app.js', 'robots.txt', 'sitemap.xml', '.nojekyll', 'assets'];
for (const file of files) await cp(resolve(root, file), resolve(output, file), { recursive: true });
// Preserve project-path hosting by default; custom domains can set SITE_URL when building.
if (process.env.SITE_URL) {
  const url = new URL(process.env.SITE_URL);
  if (url.protocol !== 'https:') throw new Error('SITE_URL must be an https URL');
  const base = url.href.endsWith('/') ? url.href : `${url.href}/`;
  const path = new URL(base).pathname;
  for (const file of files.filter(file => /\.(html|xml|txt)$/.test(file))) {
    let source = await readFile(resolve(output, file), 'utf8');
    source = source.replaceAll('https://caribtechstudio.github.io/bloknote-website/', base);
    if (file === '404.html') source = source.replaceAll('/bloknote-website/', path);
    await writeFile(resolve(output, file), source);
  }
}
console.log('Site statique généré dans dist/.');
