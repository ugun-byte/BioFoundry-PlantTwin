/**
 * BioFoundry PlantTwin - Zero-Dependency One-Click Runner (Cross-Platform)
 * 
 * Works out-of-the-box on Windows, macOS, and Linux without needing any 'npm install'.
 * 1. Starts built-in HTTP static server on port 3007
 * 2. Automatically launches default browser at http://localhost:3007
 */

import http from 'http';
import https from 'https';
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
  // Global CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURI(parsedUrl.pathname);

  // 1. Plant2Human REST Proxy API (Cross-PC & CORS Bypass)
  if (pathname === '/api/p2h-proxy') {
    const targetUrl = parsedUrl.searchParams.get('url');
    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: "Missing 'url' query parameter" }));
      return;
    }

    try {
      const destUrl = new URL(targetUrl);
      const isHttps = destUrl.protocol === 'https:';
      const clientLib = isHttps ? https : http;

      if (req.method === 'GET') {
        const proxyReq = clientLib.get(destUrl, { timeout: 3500 }, (destRes) => {
          let data = '';
          destRes.on('data', chunk => data += chunk);
          destRes.on('end', () => {
            res.writeHead(destRes.statusCode, { 'Content-Type': 'application/json' });
            res.end(data);
          });
        });

        proxyReq.on('timeout', () => {
          proxyReq.destroy();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, isOffline: true, error: "Connection Timeout (3.5s)" }));
        });

        proxyReq.on('error', (err) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, isOffline: true, error: err.message }));
        });
        return;
      } else if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          const proxyReq = clientLib.request(destUrl, {
            method: 'POST',
            timeout: 3500,
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(body)
            }
          }, (destRes) => {
            let data = '';
            destRes.on('data', chunk => data += chunk);
            destRes.on('end', () => {
              res.writeHead(destRes.statusCode, { 'Content-Type': 'application/json' });
              res.end(data);
            });
          });

          proxyReq.on('timeout', () => {
            proxyReq.destroy();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, isOffline: true, error: "Connection Timeout (3.5s)" }));
          });

          proxyReq.on('error', (err) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, isOffline: true, error: err.message }));
          });

          proxyReq.write(body);
          proxyReq.end();
        });
        return;
      }
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, isOffline: true, error: e.message }));
      return;
    }
  }

  // 2. Built-in Plant2Human Standalone Mock REST Endpoints (for standalone operation)
  if (pathname === '/api/discovery/pipeline') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      source: "Plant2Human_AI_OS",
      status: "ONLINE",
      timestamp: new Date().toISOString(),
      pipelines: [
        { id: "marigold_lutein", name: "메리골드", targetMolecule: "루테인", chemicalFormula: "C40H56O2", pubchemCid: 5281243, indication: "황반변성 억제 & 블루라이트 흡수" },
        { id: "spinach_carotenoid", name: "유기농 시금치", targetMolecule: "복합 카로티노이드", chemicalFormula: "C40H56", pubchemCid: 5280489, indication: "황산화 및 세포 보호" },
        { id: "grape_resveratrol", name: "호장근 / 포도", targetMolecule: "트랜스-레스베라트롤", chemicalFormula: "C14H12O3", pubchemCid: 445154, indication: "SIRT1 장수 유전자 활성화" },
        { id: "kale_antioxidant", name: "슈퍼푸드 케일", targetMolecule: "설포라판 & 퀘르세틴", chemicalFormula: "C6H11NOS2", pubchemCid: 5350, indication: "Nrf2 해독 대사 촉진" }
      ]
    }));
    return;
  }

  if (pathname === '/api/recipes/optimized' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: "ACKNOWLEDGED",
        message: "Optimal recipe feedback received successfully by Plant2Human OS",
        receivedAt: new Date().toISOString()
      }));
    });
    return;
  }

  // 3. Static File Serving
  let reqPath = pathname;
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
