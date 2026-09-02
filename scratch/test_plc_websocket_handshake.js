/**
 * Automated Verification Script for Industrial IoT Modbus-TCP & WebSocket Gateway
 */

import http from 'http';
import net from 'net';
import crypto from 'crypto';
import { spawn } from 'child_process';

console.log("=================================================");
console.log("🧪 Testing Industrial IoT Gateway & Handshake");
console.log("=================================================");

const WS_PORT = 8092;
const MODBUS_PORT = 5020;

// Start gateway daemon in background
const daemonProcess = spawn('node', ['industrial-iot-gateway-daemon.js'], {
  cwd: process.cwd(),
  stdio: 'pipe'
});

daemonProcess.stdout.on('data', (d) => {
  // console.log(`[DAEMON] ${d}`);
});

daemonProcess.stderr.on('data', (d) => {
  console.error(`[DAEMON ERROR] ${d}`);
});

// Give daemon 1 second to bind ports
setTimeout(async () => {
  try {
    // 1. Test HTTP API Status
    console.log("📍 Step 1: Testing Gateway /api/status HTTP endpoint...");
    const statusRes = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${WS_PORT}/api/status`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    if (statusRes.status === "ONLINE" && statusRes.modbusPort === 5020) {
      console.log("  ✅ [PASS] Gateway status is ONLINE, Modbus port is 5020");
    } else {
      throw new Error("Invalid status response: " + JSON.stringify(statusRes));
    }

    // 2. Test RFC6455 WebSocket Upgrade Handshake
    console.log("📍 Step 2: Testing RFC6455 WebSocket Upgrade Handshake...");
    const clientKey = crypto.randomBytes(16).toString('base64');
    const expectedAccept = crypto.createHash('sha1')
      .update(clientKey + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
      .digest('base64');

    const handshakeSuccess = await new Promise((resolve, reject) => {
      const socket = net.connect(WS_PORT, '127.0.0.1', () => {
        const req = [
          'GET / HTTP/1.1',
          `Host: 127.0.0.1:${WS_PORT}`,
          'Upgrade: websocket',
          'Connection: Upgrade',
          `Sec-WebSocket-Key: ${clientKey}`,
          'Sec-WebSocket-Version: 13',
          '\r\n'
        ].join('\r\n');
        socket.write(req);
      });

      socket.on('data', (buf) => {
        const resp = buf.toString('utf-8');
        if (resp.includes('101 Switching Protocols') && resp.includes(`Sec-WebSocket-Accept: ${expectedAccept}`)) {
          socket.end();
          resolve(true);
        } else {
          socket.end();
          reject(new Error("Handshake failed:\n" + resp));
        }
      });

      socket.on('error', reject);
    });

    if (handshakeSuccess) {
      console.log("  ✅ [PASS] WebSocket Upgrade Handshake succeeded with valid Sec-WebSocket-Accept key!");
    }

    // 3. Test Modbus-TCP FC03 Read
    console.log("📍 Step 3: Testing Modbus-TCP FC03 (Read Holding Registers)...");
    const modbusSuccess = await new Promise((resolve, reject) => {
      const mbSocket = net.connect(MODBUS_PORT, '127.0.0.1', () => {
        // MBAP: TxId=0x0001, ProtoId=0x0000, Length=0x0006, UnitId=0x01
        // PDU: FC=0x03, StartAddr=0x0000, RegCount=0x0004
        const req = Buffer.from([
          0x00, 0x01,
          0x00, 0x00,
          0x00, 0x06,
          0x01,
          0x03,
          0x00, 0x00,
          0x00, 0x04
        ]);
        mbSocket.write(req);
      });

      mbSocket.on('data', (buf) => {
        if (buf.length >= 9 && buf[7] === 0x03) {
          const byteCount = buf[8];
          const ppfd = buf.readUInt16BE(9);
          console.log(`  📊 Modbus FC03 Response Received: ByteCount=${byteCount}, Register[0] (PPFD)=${ppfd}`);
          mbSocket.end();
          resolve(true);
        } else {
          mbSocket.end();
          reject(new Error("Invalid Modbus response: " + buf.toString('hex')));
        }
      });

      mbSocket.on('error', reject);
    });

    if (modbusSuccess) {
      console.log("  ✅ [PASS] Modbus-TCP FC03 Socket Read passed successfully!");
    }

    console.log("=================================================");
    console.log("🏆 ALL P0 GATEWAY & WEBSOCKET TESTS PASSED 100%!");
    console.log("=================================================");
    daemonProcess.kill('SIGTERM');
    process.exit(0);

  } catch (err) {
    console.error("❌ [FAIL] Test Error:", err);
    daemonProcess.kill('SIGTERM');
    process.exit(1);
  }
}, 1200);
