/**
 * Industrial IoT Bridge Module (Modbus-TCP & MQTT Standard Protocol Engine)
 * Translates Biophysical & Environmental Digital Twin states into standard PLC registers & MQTT payloads.
 */
export class IndustrialIoTBridge {
  constructor(chamberId = "chamber_bio_01") {
    this.chamberId = chamberId;
    this.packetCounter = 1;
    this.lastModbusMap = [];
    this.lastMqttPayload = {};
  }

  /**
   * Generates standard Modbus-TCP 16-Bit Holding Register Map (40001 ~ 40020)
   */
  generateModbusRegisterMap(envTele = {}, bioState = {}, actuators = {}) {
    const s = envTele.sensors || {};
    const p = bioState || {};

    const registers = [
      { addr: 40001, name: "SETPOINT_PPFD", value: Math.round(s.ppfd || 450), unit: "μmol/m²s", scale: 1, type: "INT16", desc: "LED 광량 제어 설정값" },
      { addr: 40002, name: "ACTUAL_PPFD", value: Math.round(s.ppfd || 450), unit: "μmol/m²s", scale: 1, type: "INT16", desc: "챔버 상단 실제 광량 센서" },
      { addr: 40003, name: "ACTUAL_AIR_TEMP", value: Math.round((s.airTemp || 24.0) * 10), unit: "0.1 °C", scale: 0.1, type: "INT16", desc: "챔버 내부 대기 온도" },
      { addr: 40004, name: "ACTUAL_LEAF_TEMP", value: Math.round((p.leafTemp || 22.5) * 10), unit: "0.1 °C", scale: 0.1, type: "INT16", desc: "IR 비접촉 엽온 센서" },
      { addr: 40005, name: "ACTUAL_HUMIDITY", value: Math.round((s.humidity || 65.0) * 10), unit: "0.1 %", scale: 0.1, type: "INT16", desc: "상대 습도 (RH)" },
      { addr: 40006, name: "ACTUAL_CO2", value: Math.round(s.co2 || 800), unit: "ppm", scale: 1, type: "INT16", desc: "NDIR CO2 가스 센서" },
      { addr: 40007, name: "ACTUAL_EC", value: Math.round((s.ec || 2.2) * 100), unit: "0.01 dS/m", scale: 0.01, type: "INT16", desc: "양액 전기전도도 (EC)" },
      { addr: 40008, name: "ACTUAL_PH", value: Math.round((s.ph || 6.2) * 100), unit: "0.01 pH", scale: 0.01, type: "INT16", desc: "근권 순환 양액 산도 (pH)" },
      { addr: 40009, name: "VPD_DEFICIT", value: Math.round((s.vpd || 1.05) * 100), unit: "0.01 kPa", scale: 0.01, type: "INT16", desc: "포화수증기압차 (VPD)" },
      { addr: 40010, name: "SAP_FLUX_DENSITY", value: Math.round((p.sapFluxDensity || 16.4) * 10), unit: "0.1 cm/h", scale: 0.1, type: "INT16", desc: "TDP 도관 수액 유속 밀도 (Js)" },
      { addr: 40011, name: "CWSI_STRESS_INDEX", value: Math.round((p.cwsi || 0.15) * 100), unit: "%", scale: 1, type: "INT16", desc: "식물 수분 스트레스 지수" },
      { addr: 40012, name: "STOMATAL_GS", value: Math.round((p.gs || 0.38) * 1000), unit: "mmol/m²s", scale: 0.001, type: "INT16", desc: "기공전도도 (gs)" },
      { addr: 40013, name: "METABOLITE_ACCUM", value: Math.round((p.totalMetabolite || 18.5) * 10), unit: "0.1 mg", scale: 0.1, type: "INT16", desc: "유효 대사체 총 축적량" },
      { addr: 40014, name: "PUMP_ACID_ACTIVE", value: (actuators.acidPump ? 1 : 0), unit: "BOOL", scale: 1, type: "UINT16", desc: "HNO3 산 중화 펌프 릴레이" },
      { addr: 40015, name: "PUMP_BASE_ACTIVE", value: (actuators.basePump ? 1 : 0), unit: "BOOL", scale: 1, type: "UINT16", desc: "KOH 알칼리 중화 펌프 릴레이" },
      { addr: 40016, name: "LIGHT_RELAY_STATE", value: (s.isLightOn ? 1 : 0), unit: "BOOL", scale: 1, type: "UINT16", desc: "주간 LED 조명 메인 릴레이" }
    ];

    this.lastModbusMap = registers;
    return registers;
  }

  /**
   * Returns formatted Modbus-TCP holding registers with address and rawHex fields
   */
  getModbusRegisters(envTele = {}, bioState = {}, actuators = {}) {
    const rawMap = this.generateModbusRegisterMap(envTele, bioState, actuators);
    return rawMap.map(r => ({
      ...r,
      address: r.addr,
      rawHex: "0x" + ((r.value || 0) & 0xFFFF).toString(16).padStart(4, "0").toUpperCase()
    }));
  }

  /**
   * Builds Hexadecimal Modbus-TCP Frame Simulation (Function Code 03: Read Holding Registers)
   */
  generateModbusTcpHexFrame() {
    const txId = (this.packetCounter++ % 65535).toString(16).padStart(4, "0").toUpperCase();
    const protoId = "0000";
    const length = "0023"; // 35 bytes response
    const unitId = "01";
    const funcCode = "03";
    const byteCount = "20"; // 32 data bytes for 16 registers

    let hexPayload = "";
    this.lastModbusMap.forEach(reg => {
      const v = reg.value & 0xFFFF;
      hexPayload += v.toString(16).padStart(4, "0").toUpperCase() + " ";
    });

    return {
      header: `[MBAP Header: TxID 0x${txId} | Proto 0x${protoId} | Len 0x${length} | Unit 0x${unitId}]`,
      functionCode: `FC03 (Read Holding Registers) - Byte Count: 0x${byteCount}`,
      hexDump: `0x${txId.slice(0, 2)} 0x${txId.slice(2, 4)} 0x00 0x00 0x00 0x23 0x01 0x03 0x20 ${hexPayload.trim()}`
    };
  }

  /**
   * Generates standard JSON MQTT Topic Payloads
   */
  generateMqttPayloads(envTele = {}, bioState = {}, cropProfile = {}) {
    const nowIso = new Date().toISOString();
    const s = envTele.sensors || {};
    const p = bioState || {};

    const telemetryTopic = `biofoundry/v1/${this.chamberId}/telemetry`;
    const telemetryPayload = {
      timestamp: nowIso,
      chamber_id: this.chamberId,
      crop_id: cropProfile.id || "marigold_lutein",
      simulated_day: envTele.simulatedDay || 1,
      sensors: {
        ppfd_umol_m2s: parseFloat((s.ppfd || 450).toFixed(1)),
        air_temp_c: parseFloat((s.airTemp || 24.0).toFixed(2)),
        leaf_temp_c: parseFloat((p.leafTemp || 22.5).toFixed(2)),
        humidity_pct: parseFloat((s.humidity || 65.0).toFixed(1)),
        co2_ppm: Math.round(s.co2 || 800),
        ec_ds_m: parseFloat((s.ec || 2.2).toFixed(2)),
        ph: parseFloat((s.ph || 6.2).toFixed(2)),
        vpd_kpa: parseFloat((s.vpd || 1.05).toFixed(3))
      },
      plant_biometrics: {
        sap_flux_density_cm_h: parseFloat((p.sapFluxDensity || 16.4).toFixed(1)),
        stem_water_potential_mpa: parseFloat((p.stemWaterPotential || -0.68).toFixed(2)),
        cwsi_stress_index: parseFloat((p.cwsi || 0.15).toFixed(2)),
        stomatal_gs_mol_m2s: parseFloat((p.gs || 0.38).toFixed(3)),
        total_lutein_mg: parseFloat((p.totalMetabolite || 18.5).toFixed(1))
      },
      actuators: {
        acid_pump_dosing: !!(envTele.phPid && envTele.phPid.acidPumpActive),
        base_pump_dosing: !!(envTele.phPid && envTele.phPid.basePumpActive),
        lighting_main_on: !!s.isLightOn
      }
    };

    const controlTopic = `biofoundry/v1/${this.chamberId}/control/setpoints`;
    const controlPayload = {
      timestamp: nowIso,
      target_ppfd: envTele.setpoints ? envTele.setpoints.ppfdTarget : 500,
      target_day_temp: envTele.setpoints ? envTele.setpoints.dayTempTarget : 24.0,
      target_humidity: envTele.setpoints ? envTele.setpoints.humidityTarget : 65.0,
      target_ph: envTele.setpoints ? envTele.setpoints.phTarget : 6.20
    };

    this.lastMqttPayload = {
      telemetryTopic,
      telemetryPayload,
      controlTopic,
      controlPayload
    };

    return this.lastMqttPayload;
  }

  /**
   * Simulates bi-directional Modbus FC06 (Write Single Register) / FC16 (Write Multiple)
   */
  sendModbusWriteCommand(addr, value) {
    const txId = (this.packetCounter++ % 65535).toString(16).padStart(4, "0").toUpperCase();
    const addrHex = (addr - 40001).toString(16).padStart(4, "0").toUpperCase();
    const valHex = (value & 0xFFFF).toString(16).padStart(4, "0").toUpperCase();
    const nowTime = new Date().toTimeString().split(" ")[0] + "." + Math.floor(Math.random() * 900 + 100);

    const txFrame = {
      timestamp: nowTime,
      direction: "TX",
      txId: `0x${txId}`,
      proto: "Modbus-TCP",
      funcCode: "FC06 (Write Single Register)",
      addr: `Register ${addr}`,
      value: `${value}`,
      hexDump: `0x${txId.slice(0, 2)} 0x${txId.slice(2, 4)} 0x00 0x00 0x00 0x06 0x01 0x06 0x${addrHex.slice(0, 2)} 0x${addrHex.slice(2, 4)} 0x${valHex.slice(0, 2)} 0x${valHex.slice(2, 4)}`,
      latencyMs: parseFloat((Math.random() * 1.8 + 1.2).toFixed(1)),
      status: "ACK (Success 200)"
    };

    if (!this.packetHistory) this.packetHistory = [];
    this.packetHistory.unshift(txFrame);
    if (this.packetHistory.length > 25) this.packetHistory.pop();

    return txFrame;
  }

  getPacketStreamHistory() {
    if (!this.packetHistory || this.packetHistory.length === 0) {
      // Seed initial handshake packets
      this.packetHistory = [
        {
          timestamp: new Date().toTimeString().split(" ")[0] + ".102",
          direction: "RX",
          txId: "0x0001",
          proto: "Modbus-TCP",
          funcCode: "FC03 (Read Holding Registers)",
          addr: "40001 ~ 40016",
          value: "16 Words",
          hexDump: "0x00 0x01 0x00 0x00 0x00 0x23 0x01 0x03 0x20 0x01 0xC2 0x00 0xF0 0x02 0x80",
          latencyMs: 1.4,
          status: "OK (Active Link)"
        }
      ];
    }
    return this.packetHistory;
  }
}
