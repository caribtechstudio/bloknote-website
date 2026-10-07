import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = process.env.SERVE_DIST === '1' ? fileURLToPath(new URL('../dist/', import.meta.url)) : fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8' };
createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path === '/bloknote-website') { res.writeHead(301, {Location:'/bloknote-website/'}); res.end(); return; }
    path = path.replace(/^\/bloknote-website\//, '/');
    let file = resolve(root, `.${path}`);
    if (!file.startsWith(resolve(root) + sep) && file !== resolve(root)) throw new Error('Forbidden');
    if (/(^|\/)\.|node_modules|scripts|package\.json|README/.test(path)) throw new Error('Forbidden');
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, {'Content-Type':types[extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(body);
  } catch {
    res.writeHead(404, {'Content-Type':'text/html; charset=utf-8'});
    res.end(await readFile(resolve(root,'404.html')));
  }
}).listen(port, '127.0.0.1', () => console.log(`Bloknot : http://127.0.0.1:${port}/bloknote-website/`));
