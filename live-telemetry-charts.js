/**
 * Real-time Streaming Oscilloscope & Bio-Telemetry Multi-Channel Canvas Charts
 * 
 * Channels:
 * 1. Live Photosynthetic Rate (An) & Transpiration Flux (E)
 * 2. Cumulative Biomass Dry Weight (g) & Leaf Area Index (LAI)
 * 3. Real-time Lutein Biosynthetic Flux (mg/hr) & Total Lutein Yield (mg/plant)
 * 4. Stomatal Conductance (gs) & Leaf Temperature Differential
 */

export class LiveTelemetryCharts {
  constructor(canvasMap) {
    this.canvases = canvasMap;
    this.contexts = {};

    Object.keys(canvasMap).forEach((key) => {
      if (canvasMap[key]) {
        this.contexts[key] = canvasMap[key].getContext("2d");
        this.initCanvas(canvasMap[key], this.contexts[key]);
      }
    });

    // Ring buffers for live streaming telemetry (100 real-time tick history)
    this.bufferSize = 90;
    this.history = {
      an: [],
      transpiration: [],
      luteinFlux: [],
      luteinTotal: [],
      biomass: [],
      leafTemp: [],
      airTemp: [],
      vpd: []
    };

    window.addEventListener("resize", () => {
      Object.keys(this.canvases).forEach((k) => {
        if (this.canvases[k] && this.contexts[k]) {
          this.initCanvas(this.canvases[k], this.contexts[k]);
        }
      });
    });
  }

  initCanvas(canvas, ctx) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.dispW = rect.width;
    canvas.dispH = rect.height;
  }

  pushTelemetryPoint(point) {
    const pushBuf = (arr, val) => {
      arr.push(val);
      if (arr.length > this.bufferSize) arr.shift();
    };

    pushBuf(this.history.an, point.an);
    pushBuf(this.history.transpiration, point.transpiration);
    pushBuf(this.history.luteinFlux, point.luteinFlux);
    pushBuf(this.history.luteinTotal, point.luteinTotal);
    pushBuf(this.history.biomass, point.biomass);
    pushBuf(this.history.leafTemp, point.leafTemp);
    pushBuf(this.history.airTemp, point.airTemp);
    pushBuf(this.history.vpd, point.vpd);

    this.renderAll();
  }

  renderAll() {
    this.renderPhotosynthesisScope();
    this.renderLuteinMolecularScope();
  }

  renderPhotosynthesisScope() {
    const canvas = this.canvases.photoScope;
    const ctx = this.contexts.photoScope;
    if (!canvas || !ctx) return;

    const w = canvas.dispW;
    const h = canvas.dispH;
    ctx.clearRect(0, 0, w, h);

    // Dark grid
    this.drawOscilloscopeGrid(ctx, w, h, "rgba(0, 242, 254, 0.08)");

    const dataAn = this.history.an;
    if (dataAn.length < 2) return;

    const padL = 40, padR = 20, padT = 20, padB = 24;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    // Y Axis Range: 0 ~ 30 umol/m2s
    const maxY = 30.0;
    const minY = 0.0;

    // Y Labels
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "10px Inter, monospace";
    for (let yVal = 0; yVal <= 30; yVal += 10) {
      const yPos = padT + plotH - (yVal / maxY) * plotH;
      ctx.fillText(`${yVal}`, 8, yPos + 3);
    }

    // Draw Live An Line (Cyan Glow)
    ctx.strokeStyle = "#00f2fe";
    ctx.lineWidth = 2.2;
    ctx.shadowColor = "#00f2fe";
    ctx.shadowBlur = 8;
    ctx.beginPath();

    dataAn.forEach((val, i) => {
      const x = padL + (i / (this.bufferSize - 1)) * plotW;
      const y = padT + plotH - (Math.max(0, val) / maxY) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Pulse dot at current stream end
    const lastIdx = dataAn.length - 1;
    const lastX = padL + (lastIdx / (this.bufferSize - 1)) * plotW;
    const lastY = padT + plotH - (Math.max(0, dataAn[lastIdx]) / maxY) * plotH;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Live Value Tag
    ctx.fillStyle = "#00f2fe";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillText(`${dataAn[lastIdx].toFixed(2)} μmol/m²s`, w - 120, 16);
  }

  renderLuteinMolecularScope() {
    const canvas = this.canvases.luteinScope;
    const ctx = this.contexts.luteinScope;
    if (!canvas || !ctx) return;

    const w = canvas.dispW;
    const h = canvas.dispH;
    ctx.clearRect(0, 0, w, h);

    this.drawOscilloscopeGrid(ctx, w, h, "rgba(241, 196, 15, 0.08)");

    const dataFlux = this.history.luteinFlux;
    if (dataFlux.length < 2) return;

    const padL = 40, padR = 20, padT = 20, padB = 24;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const maxFlux = 0.8; // mg / plant / hour max scale

    // Draw Live Lutein Biosynthetic Flux Line (Gold #f1c40f)
    ctx.strokeStyle = "#f1c40f";
    ctx.lineWidth = 2.2;
    ctx.shadowColor = "#f1c40f";
    ctx.shadowBlur = 10;
    ctx.beginPath();

    dataFlux.forEach((val, i) => {
      const x = padL + (i / (this.bufferSize - 1)) * plotW;
      const y = padT + plotH - (Math.min(maxFlux, Math.max(0, val)) / maxFlux) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Fill underneath
    const lastIdx = dataFlux.length - 1;
    const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    grad.addColorStop(0, "rgba(241, 196, 15, 0.25)");
    grad.addColorStop(1, "rgba(241, 196, 15, 0.0)");
    ctx.fillStyle = grad;
    ctx.lineTo(padL + (lastIdx / (this.bufferSize - 1)) * plotW, padT + plotH);
    ctx.lineTo(padL, padT + plotH);
    ctx.closePath();
    ctx.fill();

    // Live Value Tag
    ctx.fillStyle = "#f1c40f";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillText(`플럭스: ${(dataFlux[lastIdx] * 1000).toFixed(1)} μg/hr`, w - 130, 16);
  }

  drawOscilloscopeGrid(ctx, w, h, gridColor) {
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }
}
