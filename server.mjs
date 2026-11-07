import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3333;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.mp3': 'audio/mpeg',
  '.gif': 'image/gif',
};

const ROUTES = ['/', '/step3', '/step4', '/pay', '/vsl', '/vsl-2', '/vsl-3'];

http.createServer((req, res) => {
  let url = req.url.split('?')[0];

  // API stubs
  if (url === '/api/geo-country') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ country: 'BR', countryName: 'Brazil' }));
    return;
  }
  if (url.startsWith('/api/reviews')) {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ consensus: null }));
    return;
  }
  if (url === '/api/vsl/entry') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  if (url === '/api/pay/lead') {
    if (req.method === 'POST') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ ok: true, redirect: '/pay' }));
      return;
    }
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
      res.end();
      return;
    }
  }

  // Route pages to their index.html
  if (ROUTES.includes(url)) {
    url = url === '/' ? '/index.html' : `${url}/index.html`;
  }

  const filePath = path.join(__dirname, url);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache' });
  fs.createReadStream(filePath).pipe(res);
}).listen(PORT, () => {
  console.log(`Clone running → http://localhost:${PORT}`);
  console.log('Pages: / /step3 /step4 /vsl /pay');
});
