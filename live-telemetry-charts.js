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
    this.timeScale = '1m'; // '1m' | '24h' | '42d'

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

  setTimeScale(scale) {
    if (['1m', '24h', '42d'].includes(scale)) {
      this.timeScale = scale;
      this.renderAll();
    }
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
   * Scope 1: Live Photosynthetic Rate (An) with TimeScale Zoom
   */
  renderPhotosynthesisScope() {
    const canvas = this.canvases.photoScope;
    const ctx = this.contexts.photoScope;
    if (!canvas || !ctx) return;

    const w = canvas.dispW || canvas.clientWidth || 340;
    const h = canvas.dispH || canvas.clientHeight || 125;
    ctx.clearRect(0, 0, w, h);

    const padL = 34, padR = 16, padT = 18, padB = 22;
    const plotW = Math.max(10, w - padL - padR);
    const plotH = Math.max(10, h - padT - padB);

    // Dark high-tech oscilloscope grid
    this.drawOscilloscopeGrid(ctx, padL, padT, plotW, plotH, "rgba(0, 242, 254, 0.07)");

    let dataSeries = [];
    let maxY = 30.0;
    let unitLabel = "μmol/m²s";
    let timeLabel = "60초 스트림";

    if (this.timeScale === '1m') {
      dataSeries = this.history.an;
      timeLabel = "실시간 (60s)";
      maxY = 30.0;
    } else if (this.timeScale === '24h') {
      timeLabel = "24H 일주기 (00~24시)";
      maxY = 30.0;
      // Synthesize 24h diurnal curve based on current peak An
      const peakAn = this.history.an.length > 0 ? Math.max(5, this.history.an[this.history.an.length - 1]) : 20.0;
      dataSeries = Array.from({ length: 48 }, (_, i) => {
        const hour = (i / 47) * 24;
        if (hour < 6.0 || hour >= 22.0) return -1.2; // Night respiration
        const sun = Math.sin(((hour - 6.0) / 16.0) * Math.PI);
        return Math.max(0, peakAn * Math.pow(sun, 0.75));
      });
    } else if (this.timeScale === '42d') {
      timeLabel = "42일 전주기 LAI/광합성";
      maxY = 30.0;
      // 42-day lifecycle canopy photosynthetic capacity
      dataSeries = Array.from({ length: 42 }, (_, d) => {
        const logistic = 1 / (1 + Math.exp(-0.25 * (d - 18)));
        return 2.5 + 24.5 * logistic;
      });
    }

    if (dataSeries.length < 2) return;

    // Y Axis Labels
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "9px Inter, monospace";
    for (let yVal = 0; yVal <= 30; yVal += 15) {
      const yPos = padT + plotH - (yVal / maxY) * plotH;
      ctx.fillText(`${yVal}`, 6, yPos + 3);
    }

    // Time Axis Tag Bottom Center
    ctx.fillStyle = "rgba(0, 242, 254, 0.6)";
    ctx.font = "9px Inter, sans-serif";
    ctx.fillText(`◷ ${timeLabel}`, padL + plotW / 2 - 25, padT + plotH + 16);

    const lastIdx = dataSeries.length - 1;
    const latestVal = Math.max(0, dataSeries[lastIdx]);

    // Live Value Tag Top Right
    ctx.fillStyle = "#00f2fe";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillText(`${latestVal.toFixed(2)} ${unitLabel}`, w - 110, 14);

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
    const len = dataSeries.length;
    dataSeries.forEach((val, i) => {
      const x = padL + (i / (len - 1)) * plotW;
      const clamped = Math.min(maxY, Math.max(0, val));
      const y = padT + plotH - (clamped / maxY) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    const lastX = padL + (lastIdx / (len - 1)) * plotW;
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
    dataSeries.forEach((val, i) => {
      const x = padL + (i / (len - 1)) * plotW;
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

    const padL = 34, padR = 16, padT = 18, padB = 22;
    const plotW = Math.max(10, w - padL - padR);
    const plotH = Math.max(10, h - padT - padB);

    this.drawOscilloscopeGrid(ctx, padL, padT, plotW, plotH, "rgba(241, 196, 15, 0.07)");

    let dataSeries = [];
    let maxY = 0.6; // mg / hr
    let unitLabel = "μg/hr";
    let timeLabel = "60초 스트림";
    let isYieldMode = false;

    if (this.timeScale === '1m') {
      dataSeries = this.history.luteinFlux;
      timeLabel = "실시간 (60s)";
      maxY = 0.6;
    } else if (this.timeScale === '24h') {
      timeLabel = "24H 대사 플럭스";
      maxY = 0.6;
      const peakFlux = this.history.luteinFlux.length > 0 ? Math.max(0.1, this.history.luteinFlux[this.history.luteinFlux.length - 1]) : 0.35;
      dataSeries = Array.from({ length: 48 }, (_, i) => {
        const hour = (i / 47) * 24;
        if (hour < 6.0 || hour >= 22.0) return 0.04; // Baseline dark synthesis
        const sun = Math.sin(((hour - 6.0) / 16.0) * Math.PI);
        return Math.max(0.04, peakFlux * (0.3 + 0.7 * sun));
      });
    } else if (this.timeScale === '42d') {
      timeLabel = "42일 누적 수확량 (mg)";
      isYieldMode = true;
      maxY = 25.0; // 0 ~ 25mg
      unitLabel = "mg 누적";
      const totalYield = this.history.luteinTotal.length > 0 ? Math.max(1.0, this.history.luteinTotal[this.history.luteinTotal.length - 1]) : 17.5;
      dataSeries = Array.from({ length: 42 }, (_, d) => {
        const logistic = 1 / (1 + Math.exp(-0.20 * (d - 22)));
        return totalYield * logistic;
      });
    }

    if (dataSeries.length < 2) return;

    const lastIdx = dataSeries.length - 1;
    const latestRaw = dataSeries[lastIdx];
    const latestDisplay = isYieldMode ? `${latestRaw.toFixed(1)} mg` : `${(latestRaw * 1000).toFixed(1)} μg/hr`;

    // Y Labels
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "9px Inter, monospace";
    if (isYieldMode) {
      ctx.fillText("25", 8, padT + 4);
      ctx.fillText("12", 8, padT + plotH / 2 + 3);
      ctx.fillText("0", 12, padT + plotH);
    } else {
      ctx.fillText("600", 6, padT + 4);
      ctx.fillText("300", 6, padT + plotH / 2 + 3);
      ctx.fillText("0", 12, padT + plotH);
    }

    // Time Axis Tag Bottom Center
    ctx.fillStyle = "rgba(241, 196, 15, 0.6)";
    ctx.font = "9px Inter, sans-serif";
    ctx.fillText(`◷ ${timeLabel}`, padL + plotW / 2 - 35, padT + plotH + 16);

    // Live Value Tag Top Right
    ctx.fillStyle = "#f1c40f";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillText(latestDisplay, w - 125, 14);

    // Clip rendering inside chart plot box (Prevents yellow line from overflowing outside box)
    ctx.save();
    ctx.beginPath();
    ctx.rect(padL, padT, plotW, plotH + 1);
    ctx.clip();

    // Fill underneath
    const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    grad.addColorStop(0, "rgba(241, 196, 15, 0.25)");
    grad.addColorStop(1, "rgba(241, 196, 15, 0.0)");

    const len = dataSeries.length;
    ctx.beginPath();
    dataSeries.forEach((val, i) => {
      const x = padL + (i / (len - 1)) * plotW;
      const clamped = Math.min(maxY, Math.max(0, val));
      const y = padT + plotH - (clamped / maxY) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    const lastX = padL + (lastIdx / (len - 1)) * plotW;
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
    dataSeries.forEach((val, i) => {
      const x = padL + (i / (len - 1)) * plotW;
      const clamped = Math.min(maxY, Math.max(0, val));
      const y = padT + plotH - (clamped / maxY) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();

    // Pulse dot
    const lastY = padT + plotH - (Math.min(maxY, latestRaw) / maxY) * plotH;
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
