/**
 * Automated Verification Script for Cross-PC Plant2Human REST API Bridge & Proxy
 */

import http from 'http';
import { spawn } from 'child_process';

console.log("=================================================");
console.log("🧪 Testing Plant2Human Cross-PC REST Bridge");
console.log("=================================================");

const PORT = process.env.TEST_PORT || 3097;

// Start run.js server in background
const serverProc = spawn('node', ['run.js'], {
  cwd: process.cwd(),
  stdio: 'pipe',
  env: { ...process.env, PORT: String(PORT) }
});

setTimeout(async () => {
  try {
    // 1. Direct Pipeline REST GET
    console.log("📍 Step 1: Testing Direct Pipeline REST GET (/api/discovery/pipeline)...");
    const getRes = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${PORT}/api/discovery/pipeline`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
      }).on('error', reject);
    });

    if (getRes.statusCode === 200 && Array.isArray(getRes.body.pipelines)) {
      console.log(`  ✅ [PASS] Direct REST GET returned 200 OK with ${getRes.body.pipelines.length} molecular pipelines!`);
    } else {
      throw new Error("Invalid pipeline response: " + JSON.stringify(getRes));
    }

    // 2. Direct Recipe Feedback REST POST
    console.log("📍 Step 2: Testing Direct Recipe Feedback REST POST (/api/recipes/optimized)...");
    const postPayload = JSON.stringify({
      source: "BioFoundry_PlantTwin",
      cropSpecies: "Tagetes erecta L.",
      targetMolecule: "루테인",
      predictedYield: "18.5 mg/g DW"
    });

    const postRes = await new Promise((resolve, reject) => {
      const req = http.request(`http://127.0.0.1:${PORT}/api/recipes/optimized`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postPayload)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
      });
      req.on('error', reject);
      req.write(postPayload);
      req.end();
    });

    if (postRes.statusCode === 200 && postRes.body.status === "ACKNOWLEDGED") {
      console.log("  ✅ [PASS] Direct REST POST feedback returned 200 OK (ACKNOWLEDGED)!");
    } else {
      throw new Error("Invalid POST response: " + JSON.stringify(postRes));
    }

    // 3. Cross-PC / Remote CORS Bypass Proxy GET
    console.log("📍 Step 3: Testing Cross-PC Proxy Relay (/api/p2h-proxy?url=...)...");
    const targetUrl = `http://127.0.0.1:${PORT}/api/discovery/pipeline`;
    const proxyRes = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${PORT}/api/p2h-proxy?url=${encodeURIComponent(targetUrl)}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
      }).on('error', reject);
    });

    if (proxyRes.statusCode === 200 && Array.isArray(proxyRes.body.pipelines)) {
      console.log("  ✅ [PASS] Cross-PC Proxy Relay successfully bypassed CORS and forwarded REST payload!");
    } else {
      throw new Error("Proxy relay failed: " + JSON.stringify(proxyRes));
    }

    // 4. Offline Fallback Resilience Test
    console.log("📍 Step 4: Testing Offline Fallback Resilience (Unreachable Remote Host)...");
    const offlineTargetUrl = `http://127.0.0.1:49999/api/discovery/pipeline`;
    const offlineRes = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${PORT}/api/p2h-proxy?url=${encodeURIComponent(offlineTargetUrl)}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
      }).on('error', reject);
    });

    if (offlineRes.body && offlineRes.body.isOffline === true) {
      console.log("  ✅ [PASS] Offline Remote Host handled gracefully with isOffline=true without crash!");
    } else {
      throw new Error("Offline fallback failed: " + JSON.stringify(offlineRes));
    }

    console.log("=================================================");
    console.log("🏆 ALL PLANT2HUMAN REST API & PROXY TESTS PASSED 100%!");
    console.log("=================================================");
    serverProc.kill('SIGTERM');
    process.exit(0);

  } catch (err) {
    console.error("❌ [FAIL] Test Error:", err);
    serverProc.kill('SIGTERM');
    process.exit(1);
  }
}, 1000);
