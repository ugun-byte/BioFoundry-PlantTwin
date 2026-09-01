/**
 * BioFoundry PlantTwin - Zero-Dependency One-Click Runner (Cross-Platform)
 * 
 * Works out-of-the-box on Windows, macOS, and Linux without needing any 'npm install'.
 * 1. Starts built-in HTTP static server on port 3007
 * 2. Automatically launches default browser at http://localhost:3007
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3007;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.csv': 'text/csv; charset=utf-8'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.join(__dirname, reqPath);

  // Security check: ensure path is within directory
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log("==================================================================");
  console.log("🌿 BioFoundry PlantTwin - Virtual Plant Growth & Molecular Farming");
  console.log("==================================================================");
  console.log(`✅ Web Server Running:  ${url}`);
  console.log(`📡 Modbus IoT Gateway: node industrial-iot-gateway-daemon.js`);
  console.log("------------------------------------------------------------------");
  console.log("🚀 Opening default browser automatically...");

  // Cross-platform browser opener
  const startCmd = process.platform === 'darwin' ? `open "${url}"`
    : process.platform === 'win32' ? `start "" "${url}"`
    : `xdg-open "${url}"`;

  exec(startCmd, (error) => {
    if (error) {
      console.log(`👉 Please open your browser and navigate to: ${url}`);
    }
  });
  console.log("⌨️  Press Ctrl+C to stop the server anytime.");
  console.log("==================================================================");
});
