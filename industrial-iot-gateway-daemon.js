/**
 * Industrial IoT Modbus-TCP & WebSocket Real Hardware Gateway Daemon
 * BioFoundry PlantTwin v1.0.0 Commercial Release
 * 
 * Standalone Node.js service:
 * 1. Modbus-TCP Server (Port 5020) for industrial PLCs & SCADA masters (Siemens, LS Electric, Mitsubishi, pymodbus)
 * 2. WebSocket Server (Port 8092) for real-time bidirectional sync with PlantTwin browser frontend
 */

import net from 'net';
import http from 'http';
import crypto from 'crypto';

const MODBUS_PORT = process.env.MODBUS_PORT || 5020;
const HTTP_WS_PORT = process.env.WS_PORT || 8092;

// 16-word Modbus Holding Register Array (40001 ~ 40016)
const holdingRegisters = new Uint16Array(32);
// Initialize default setpoints and actuals
holdingRegisters[0] = 450;  // 40001: SETPOINT_PPFD
holdingRegisters[1] = 485;  // 40002: ACTUAL_PPFD
holdingRegisters[2] = 240;  // 40003: ACTUAL_AIR_TEMP (24.0 C * 10)
holdingRegisters[3] = 232;  // 40004: ACTUAL_LEAF_TEMP (23.2 C * 10)
holdingRegisters[4] = 650;  // 40005: ACTUAL_HUMIDITY (65.0% * 10)
holdingRegisters[5] = 850;  // 40006: ACTUAL_CO2 (850 ppm)
holdingRegisters[6] = 220;  // 40007: ACTUAL_EC (2.20 * 100)
holdingRegisters[7] = 585;  // 40008: ACTUAL_PH (5.85 * 100)
holdingRegisters[8] = 105;  // 40009: VPD_DEFICIT (1.05 * 100)
holdingRegisters[9] = 164;  // 40010: SAP_FLUX (16.4 * 10)
holdingRegisters[10] = 15;  // 40011: CWSI (15%)
holdingRegisters[11] = 380; // 40012: GS (0.38 * 1000)
holdingRegisters[12] = 185; // 40013: METABOLITE (18.5 * 10)
holdingRegisters[13] = 0;   // 40014: ACID PUMP BOOL
holdingRegisters[14] = 0;   // 40015: BASE PUMP BOOL
holdingRegisters[15] = 1;   // 40016: LIGHT RELAY BOOL

console.log("=================================================");
console.log("🚀 BioFoundry Industrial IoT PLC Gateway Daemon");
console.log("=================================================");

// 1. Modbus-TCP Server
const modbusServer = net.createServer((socket) => {
  const clientAddr = `${socket.remoteAddress}:${socket.remotePort}`;
  console.log(`[Modbus-TCP] 🔌 Physical PLC Client Connected: ${clientAddr}`);

  socket.on('data', (data) => {
    if (data.length < 12) return;

    // Modbus Application Header (MBAP)
    const txId = data.readUInt16BE(0);
    const protoId = data.readUInt16BE(2);
    const unitId = data.readUInt8(6);
    const funcCode = data.readUInt8(7);

    // FC03: Read Holding Registers
    if (funcCode === 0x03) {
      const startAddr = data.readUInt16BE(8);
      const regCount = data.readUInt16BE(10);
      const byteCount = regCount * 2;

      const resp = Buffer.alloc(9 + byteCount);
      resp.writeUInt16BE(txId, 0);
      resp.writeUInt16BE(protoId, 2);
      resp.writeUInt16BE(3 + byteCount, 4); // Length
      resp.writeUInt8(unitId, 6);
      resp.writeUInt8(0x03, 7);
      resp.writeUInt8(byteCount, 8);

      for (let i = 0; i < regCount; i++) {
        const regVal = holdingRegisters[(startAddr + i) % 32];
        resp.writeUInt16BE(regVal, 9 + i * 2);
      }

      socket.write(resp);
    }
    // FC06: Write Single Register
    else if (funcCode === 0x06) {
      const writeAddr = data.readUInt16BE(8);
      const writeVal = data.readUInt16BE(10);

      holdingRegisters[writeAddr % 32] = writeVal;
      console.log(`[Modbus-TCP] ✍️ PLC Write Command: Register ${40001 + writeAddr} = ${writeVal}`);

      // Echo back request as standard FC06 response
      const resp = Buffer.alloc(12);
      data.copy(resp, 0, 0, 12);
      socket.write(resp);

      // Broadcast PLC control event to connected browser clients
      broadcastToWebClients({
        type: "PLC_WRITE_EVENT",
        register: 40001 + writeAddr,
        value: writeVal,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('close', () => {
    console.log(`[Modbus-TCP] ❌ PLC Client Disconnected: ${clientAddr}`);
  });

  socket.on('error', (err) => {
    console.error(`[Modbus-TCP] Error:`, err.message);
  });
});

modbusServer.listen(MODBUS_PORT, () => {
  console.log(`✅ [Modbus-TCP] Server listening on 0.0.0.0:${MODBUS_PORT}`);
});

// 2. HTTP & Lightweight WebSocket Server for Browser Link
const webSockets = new Set();

const httpServer = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  if (req.url === "/api/status") {
    res.end(JSON.stringify({
      status: "ONLINE",
      modbusPort: MODBUS_PORT,
      holdingRegisters: Array.from(holdingRegisters.slice(0, 16)),
      connectedWebClients: webSockets.size
    }));
  } else {
    res.end(JSON.stringify({ message: "BioFoundry IoT Gateway Daemon Online" }));
  }
});

httpServer.on('upgrade', (req, socket, head) => {
  // Simple RFC6455 WebSocket Handshake
  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }

  const acceptKey = crypto.createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');

  const headers = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptKey}`
  ];

  socket.write(headers.join('\r\n') + '\r\n\r\n');
  webSockets.add(socket);
  console.log(`[WebSocket] 🌐 PlantTwin Browser Client Connected (${webSockets.size} active)`);

  socket.on('data', (buffer) => {
    const text = decodeWebSocketFrame(buffer);
    if (!text) return;
    try {
      const msg = JSON.parse(text);
      if (msg.type === "TELEMETRY_SYNC" && Array.isArray(msg.registers)) {
        msg.registers.forEach((r, idx) => {
          if (idx < 16 && typeof r.value === 'number') {
            holdingRegisters[idx] = r.value & 0xFFFF;
          }
        });
        // Send ACK
        sendWsMessage(socket, { type: "TELEMETRY_ACK", timestamp: Date.now() });
      } else if (msg.type === "TEST_PLC_WRITE") {
        const addr = (msg.addr || 40001) - 40001;
        holdingRegisters[addr % 32] = msg.value & 0xFFFF;
        console.log(`[WebSocket] 🛠️ Web simulated PLC Write: Reg ${msg.addr} = ${msg.value}`);
        broadcastToWebClients({
          type: "PLC_WRITE_EVENT",
          register: msg.addr,
          value: msg.value,
          timestamp: new Date().toISOString()
        });
      }
    } catch (e) {
      // Ignored
    }
  });

  socket.on('close', () => {
    webSockets.delete(socket);
    console.log(`[WebSocket] ❌ Browser Client Disconnected (${webSockets.size} remaining)`);
  });

  socket.on('error', () => {
    webSockets.delete(socket);
  });
});

function decodeWebSocketFrame(buf) {
  if (buf.length < 2) return null;
  const isMasked = (buf[1] & 0x80) !== 0;
  let payloadLen = buf[1] & 0x7F;
  let offset = 2;

  if (payloadLen === 126) {
    payloadLen = buf.readUInt16BE(2);
    offset = 4;
  } else if (payloadLen === 127) {
    return null; // Large frames ignored
  }

  if (isMasked) {
    const maskKey = buf.slice(offset, offset + 4);
    offset += 4;
    const payload = Buffer.alloc(payloadLen);
    for (let i = 0; i < payloadLen; i++) {
      payload[i] = buf[offset + i] ^ maskKey[i % 4];
    }
    return payload.toString('utf8');
  }
  return buf.slice(offset, offset + payloadLen).toString('utf8');
}

function sendWsMessage(socket, obj) {
  try {
    const payload = Buffer.from(JSON.stringify(obj), 'utf8');
    const len = payload.length;
    let header;

    if (len < 126) {
      header = Buffer.from([0x81, len]);
    } else {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 126;
      header.writeUInt16BE(len, 2);
    }
    socket.write(Buffer.concat([header, payload]));
  } catch (e) {
    // Socket write error
  }
}

function broadcastToWebClients(obj) {
  webSockets.forEach(sock => sendWsMessage(sock, obj));
}

httpServer.listen(HTTP_WS_PORT, () => {
  console.log(`✅ [WebSocket Bridge] Server listening on ws://0.0.0.0:${HTTP_WS_PORT}`);
  console.log("=================================================");
  console.log("🔗 Digital Twin Modbus-TCP Gateway is READY!");
  console.log("=================================================");
});
