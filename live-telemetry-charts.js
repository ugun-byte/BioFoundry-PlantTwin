/**
 * Real-time Streaming Oscilloscope & Bio-Telemetry Multi-Channel Canvas Charts
 * 
 * Channels:
 * 1. Live Photosynthetic Rate (An) & Transpiration Flux
 * 2. Real-time Targeted Secondary Metabolite Biosynthetic Flux (dLutein/dt, dGinsenoside/dt, etc.)
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

    // Ring buffers for live streaming telemetry (90 data ticks)
    this.bufferSize = 80;
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
    const w = rect.width > 0 ? rect.width : 340;
    const h = rect.height > 0 ? rect.height : 125;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset scale
    ctx.scale(dpr, dpr);
    canvas.dispW = w;
    canvas.dispH = h;
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

  /**
   * Scope 1: Live Photosynthetic Rate (An)
   */
  renderPhotosynthesisScope() {
    const canvas = this.canvases.photoScope;
    const ctx = this.contexts.photoScope;
    if (!canvas || !ctx) return;

    const w = canvas.dispW || canvas.clientWidth || 340;
    const h = canvas.dispH || canvas.clientHeight || 125;
    ctx.clearRect(0, 0, w, h);

    const padL = 34, padR = 16, padT = 18, padB = 20;
    const plotW = Math.max(10, w - padL - padR);
    const plotH = Math.max(10, h - padT - padB);

    // Dark high-tech oscilloscope grid
    this.drawOscilloscopeGrid(ctx, padL, padT, plotW, plotH, "rgba(0, 242, 254, 0.07)");

    const dataAn = this.history.an;
    if (dataAn.length < 2) return;

    // Y Axis Range: 0 ~ 30 umol/m2s
    const maxY = 30.0;

    // Y Labels
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "9px Inter, monospace";
    for (let yVal = 0; yVal <= 30; yVal += 15) {
      const yPos = padT + plotH - (yVal / maxY) * plotH;
      ctx.fillText(`${yVal}`, 6, yPos + 3);
    }

    const lastIdx = dataAn.length - 1;
    const latestVal = Math.max(0, dataAn[lastIdx]);

    // Live Value Tag Top Right
    ctx.fillStyle = "#00f2fe";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillText(`${latestVal.toFixed(2)} μmol/m²s`, w - 110, 14);

    // Clip rendering inside chart plot box (Prevents any line overflow)
    ctx.save();
    ctx.beginPath();
    ctx.rect(padL, padT, plotW, plotH + 2);
    ctx.clip();

    // Area Fill Under Curve
    const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    grad.addColorStop(0, "rgba(0, 242, 254, 0.22)");
    grad.addColorStop(1, "rgba(0, 242, 254, 0.0)");

    ctx.beginPath();
    dataAn.forEach((val, i) => {
      const x = padL + (i / (this.bufferSize - 1)) * plotW;
      const clamped = Math.min(maxY, Math.max(0, val));
      const y = padT + plotH - (clamped / maxY) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    const lastX = padL + (lastIdx / (this.bufferSize - 1)) * plotW;
    ctx.lineTo(lastX, padT + plotH);
    ctx.lineTo(padL, padT + plotH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Main Stroke Line
    ctx.strokeStyle = "#00f2fe";
    ctx.lineWidth = 2.0;
    ctx.shadowColor = "#00f2fe";
    ctx.shadowBlur = 6;

    ctx.beginPath();
    dataAn.forEach((val, i) => {
      const x = padL + (i / (this.bufferSize - 1)) * plotW;
      const clamped = Math.min(maxY, Math.max(0, val));
      const y = padT + plotH - (clamped / maxY) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();

    // Pulse dot at current stream end
    const lastY = padT + plotH - (Math.min(maxY, latestVal) / maxY) * plotH;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Scope 2: Live Secondary Metabolite Biosynthetic Flux (Gold Oscilloscope)
   */
  renderLuteinMolecularScope() {
    const canvas = this.canvases.luteinScope;
    const ctx = this.contexts.luteinScope;
    if (!canvas || !ctx) return;

    const w = canvas.dispW || canvas.clientWidth || 340;
    const h = canvas.dispH || canvas.clientHeight || 125;
    ctx.clearRect(0, 0, w, h);

    const padL = 34, padR = 16, padT = 18, padB = 20;
    const plotW = Math.max(10, w - padL - padR);
    const plotH = Math.max(10, h - padT - padB);

    this.drawOscilloscopeGrid(ctx, padL, padT, plotW, plotH, "rgba(241, 196, 15, 0.07)");

    const dataFlux = this.history.luteinFlux;
    if (dataFlux.length < 2) return;

    const maxFlux = 0.6; // mg / plant / hour
    const lastIdx = dataFlux.length - 1;
    const latestFluxUg = Math.max(0, dataFlux[lastIdx] * 1000);

    // Y Labels
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "9px Inter, monospace";
    ctx.fillText("600", 6, padT + 4);
    ctx.fillText("300", 6, padT + plotH / 2 + 3);
    ctx.fillText("0", 12, padT + plotH);

    // Live Value Tag Top Right
    ctx.fillStyle = "#f1c40f";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillText(`플럭스: ${latestFluxUg.toFixed(1)} μg/hr`, w - 125, 14);

    // Clip rendering inside chart plot box (Prevents yellow line from overflowing outside box)
    ctx.save();
    ctx.beginPath();
    ctx.rect(padL, padT, plotW, plotH + 1);
    ctx.clip();

    // Fill underneath
    const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    grad.addColorStop(0, "rgba(241, 196, 15, 0.25)");
    grad.addColorStop(1, "rgba(241, 196, 15, 0.0)");

    ctx.beginPath();
    dataFlux.forEach((val, i) => {
      const x = padL + (i / (this.bufferSize - 1)) * plotW;
      const clamped = Math.min(maxFlux, Math.max(0, val));
      const y = padT + plotH - (clamped / maxFlux) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    const lastX = padL + (lastIdx / (this.bufferSize - 1)) * plotW;
    ctx.lineTo(lastX, padT + plotH);
    ctx.lineTo(padL, padT + plotH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Main Gold Stroke Line
    ctx.strokeStyle = "#f1c40f";
    ctx.lineWidth = 2.0;
    ctx.shadowColor = "#f1c40f";
    ctx.shadowBlur = 8;

    ctx.beginPath();
    dataFlux.forEach((val, i) => {
      const x = padL + (i / (this.bufferSize - 1)) * plotW;
      const clamped = Math.min(maxFlux, Math.max(0, val));
      const y = padT + plotH - (clamped / maxFlux) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();

    // Pulse dot at current stream end
    const lastY = padT + plotH - (Math.min(maxFlux, Math.max(0, dataFlux[lastIdx])) / maxFlux) * plotH;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawOscilloscopeGrid(ctx, padL, padT, plotW, plotH, gridColor) {
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    // Outer Plot Border
    ctx.strokeRect(padL, padT, plotW, plotH);

    // Vertical lines
    for (let x = padL; x <= padL + plotW; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();
    }
    // Horizontal lines
    for (let y = padT; y <= padT + plotH; y += 18) {
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
    }
  }
}
