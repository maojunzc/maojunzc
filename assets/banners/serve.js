const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const types = { '.html':'text/html', '.png':'image/png', '.css':'text/css', '.js':'text/javascript' };

const server = http.createServer((req, res) => {
  let url = req.url.split('?')[0];
  if (url === '/' || url === '') url = '/banner-01-cyan.html';
  const file = path.join(root, decodeURIComponent(url));
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('404'); return; }
    const ext = path.extname(file);
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(8765, () => console.log('Banner preview server up at http://localhost:8765'));
