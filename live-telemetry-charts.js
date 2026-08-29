/**
 * Real-time Streaming Multi-Channel Oscilloscopes & Sparkline Micro-Renderers
 * 
 * Channels:
 * 1. Photosynthesis Scope: 3-Channel Live Overlay (An [Emerald], gs [Cyan], Ci [Purple])
 * 2. Lutein Flux Scope: 2-Channel Live Overlay (Flux [Emerald], Concentration [Purple])
 * 3. 14x Real-Time Micro Sparklines for Telemetry Sensors & KPI Metrics
 */

export class LiveTelemetryCharts {
  constructor(canvasMap) {
    this.canvases = canvasMap || {};
    this.contexts = {};

    Object.keys(this.canvases).forEach((key) => {
      if (this.canvases[key]) {
        this.contexts[key] = this.canvases[key].getContext("2d");
        this.initCanvas(this.canvases[key], this.contexts[key]);
      }
    });

    this.bufferSize = 60;
    this.timeScale = '1m'; // '1m' | '24h' | '42d'

    this.history = {
      an: [],
      gs: [],
      ci: [],
      luteinFlux: [],
      luteinConc: [],
      luteinTotal: [],
      biomass: [],
      freshWeight: [],
      energyEff: [],
      ppfd: [],
      rh: [],
      airTemp: [],
      co2: [],
      leafTemp: [],
      ec: [],
      vpd: [],
      fvfm: []
    };

    window.addEventListener("resize", () => {
      Object.keys(this.canvases).forEach((k) => {
        if (this.canvases[k] && this.contexts[k]) {
          this.initCanvas(this.canvases[k], this.contexts[k]);
        }
      });
      this.renderAll();
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
    const h = rect.height > 0 ? rect.height : 140;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    canvas.dispW = w;
    canvas.dispH = h;
  }

  pushTelemetryPoint(p) {
    const pushBuf = (arr, val) => {
      arr.push(val);
      if (arr.length > this.bufferSize) arr.shift();
    };

    pushBuf(this.history.an, p.an || 12.4);
    pushBuf(this.history.gs, p.gs || 0.36);
    pushBuf(this.history.ci, p.ci || 480);
    pushBuf(this.history.luteinFlux, p.luteinFlux || 14.2);
    pushBuf(this.history.luteinConc, p.luteinConc || 18.7);
    pushBuf(this.history.luteinTotal, p.luteinTotal || 132.4);
    pushBuf(this.history.biomass, p.biomass || 12.8);
    pushBuf(this.history.freshWeight, p.freshWeight || 128.6);
    pushBuf(this.history.energyEff, p.energyEff || 41.3);

    // Sensor Telemetry
    pushBuf(this.history.ppfd, p.ppfd || 487);
    pushBuf(this.history.rh, p.rh || 69.2);
    pushBuf(this.history.airTemp, p.airTemp || 23.7);
    pushBuf(this.history.co2, p.co2 || 825);
    pushBuf(this.history.leafTemp, p.leafTemp || 24.6);
    pushBuf(this.history.ec, p.ec || 2.31);
    pushBuf(this.history.vpd, p.vpd || 1.12);
    pushBuf(this.history.fvfm, p.fvfm || 0.812);

    this.renderAll();
  }

  renderAll() {
    this.renderPhotosynthesisScope();
    this.renderLuteinMolecularScope();
    this.renderAllSparklines();
  }

  /**
   * Scope 1: 3-Channel Photosynthesis Scope (An [Emerald], gs [Cyan], Ci [Purple])
   */
  renderPhotosynthesisScope() {
    const canvas = this.canvases.photoScope;
    const ctx = this.contexts.photoScope;
    if (!canvas || !ctx) return;

    const w = canvas.dispW || canvas.clientWidth || 340;
    const h = canvas.dispH || canvas.clientHeight || 140;
    ctx.clearRect(0, 0, w, h);

    const padL = 28, padR = 34, padT = 12, padB = 18;
    const plotW = Math.max(10, w - padL - padR);
    const plotH = Math.max(10, h - padT - padB);

    this.drawScopeGrid(ctx, padL, padT, plotW, plotH);

    // Y Axis 1 (Left: An 0 ~ 40)
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "8.5px JetBrains Mono, monospace";
    [40, 30, 20, 10, 0].forEach((v, idx) => {
      const y = padT + (idx / 4) * plotH;
      ctx.fillText(String(v), 8, y + 3);
    });

    // Y Axis 2 (Right: Ci 0 ~ 1000 ppm)
    ctx.fillStyle = "rgba(168, 85, 247, 0.6)";
    [1000, 750, 500, 250, 0].forEach((v, idx) => {
      const y = padT + (idx / 4) * plotH;
      ctx.fillText(String(v), padL + plotW + 6, y + 3);
    });

    // Time Axis Ticks
    this.drawTimeTicks(ctx, padL, padT, plotW, plotH);

    // Synthesize / Fetch Series based on timeScale
    const seriesAn = this.getScaledSeries(this.history.an, 18.0, 40.0);
    const seriesGs = this.getScaledSeries(this.history.gs, 0.35, 0.60);
    const seriesCi = this.getScaledSeries(this.history.ci, 520, 1000.0);

    // Draw Channel 3: Ci (Purple)
    this.drawLineSeries(ctx, seriesCi, 1000.0, padL, padT, plotW, plotH, "#a855f7", "rgba(168, 85, 247, 0.12)");

    // Draw Channel 2: gs (Cyan)
    this.drawLineSeries(ctx, seriesGs, 0.60, padL, padT, plotW, plotH, "#00f2fe", null);

    // Draw Channel 1: An (Emerald)
    this.drawLineSeries(ctx, seriesAn, 40.0, padL, padT, plotW, plotH, "#34d399", "rgba(52, 211, 153, 0.18)");
  }

  /**
   * Scope 2: 2-Channel Lutein Flux Scope (Lutein Flux [Emerald], Concentration [Purple])
   */
  renderLuteinMolecularScope() {
    const canvas = this.canvases.luteinScope;
    const ctx = this.contexts.luteinScope;
    if (!canvas || !ctx) return;

    const w = canvas.dispW || canvas.clientWidth || 340;
    const h = canvas.dispH || canvas.clientHeight || 140;
    ctx.clearRect(0, 0, w, h);

    const padL = 28, padR = 34, padT = 12, padB = 18;
    const plotW = Math.max(10, w - padL - padR);
    const plotH = Math.max(10, h - padT - padB);

    this.drawScopeGrid(ctx, padL, padT, plotW, plotH);

    // Y Axis 1 (Left: Flux 0 ~ 25)
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "8.5px JetBrains Mono, monospace";
    [25, 20, 15, 10, 5, 0].forEach((v, idx) => {
      const y = padT + (idx / 5) * plotH;
      ctx.fillText(String(v), 8, y + 3);
    });

    // Y Axis 2 (Right: Conc 0 ~ 40 mg/g)
    ctx.fillStyle = "rgba(168, 85, 247, 0.6)";
    [40, 30, 20, 10, 0].forEach((v, idx) => {
      const y = padT + (idx / 4) * plotH;
      ctx.fillText(String(v), padL + plotW + 6, y + 3);
    });

    // Time Axis Ticks
    this.drawTimeTicks(ctx, padL, padT, plotW, plotH);

    // Fetch Series
    const seriesFlux = this.getScaledSeries(this.history.luteinFlux, 14.5, 25.0);
    const seriesConc = this.getScaledSeries(this.history.luteinConc, 18.2, 40.0);

    // Draw Channel 2: Concentration (Purple)
    this.drawLineSeries(ctx, seriesConc, 40.0, padL, padT, plotW, plotH, "#a855f7", "rgba(168, 85, 247, 0.12)");

    // Draw Channel 1: Flux (Emerald)
    this.drawLineSeries(ctx, seriesFlux, 25.0, padL, padT, plotW, plotH, "#34d399", "rgba(52, 211, 153, 0.20)");
  }

  getScaledSeries(historyArr, baselineVal, maxVal) {
    if (this.timeScale === '1m') {
      if (historyArr.length >= 2) return historyArr;
      return Array.from({ length: 40 }, (_, i) => baselineVal * (0.92 + Math.sin(i * 0.4) * 0.08));
    } else if (this.timeScale === '24h') {
      return Array.from({ length: 48 }, (_, i) => {
        const hour = (i / 47) * 24;
        if (hour < 6 || hour >= 22) return baselineVal * 0.08;
        const sun = Math.sin(((hour - 6) / 16) * Math.PI);
        return Math.max(0.1, baselineVal * (0.3 + 0.7 * Math.pow(sun, 0.8)));
      });
    } else {
      // 42d full lifecycle curve
      return Array.from({ length: 42 }, (_, d) => {
        const logistic = 1 / (1 + Math.exp(-0.22 * (d - 20)));
        return Math.max(0.2, baselineVal * (0.05 + 0.95 * logistic));
      });
    }
  }

  drawLineSeries(ctx, series, maxVal, padL, padT, plotW, plotH, strokeColor, fillColor = null) {
    if (!series || series.length < 2) return;
    const len = series.length;

    ctx.save();
    ctx.beginPath();
    ctx.rect(padL, padT, plotW, plotH);
    ctx.clip();

    // Fill under line
    if (fillColor) {
      ctx.beginPath();
      series.forEach((val, i) => {
        const x = padL + (i / (len - 1)) * plotW;
        const clamped = Math.min(maxVal, Math.max(0, val));
        const y = padT + plotH - (clamped / maxVal) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(padL + plotW, padT + plotH);
      ctx.lineTo(padL, padT + plotH);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
    }

    // Stroke line
    ctx.beginPath();
    series.forEach((val, i) => {
      const x = padL + (i / (len - 1)) * plotW;
      const clamped = Math.min(maxVal, Math.max(0, val));
      const y = padT + plotH - (clamped / maxVal) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.restore();
  }

  drawScopeGrid(ctx, padL, padT, plotW, plotH) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;

    // Horizontal grid lines (5 rows)
    for (let i = 0; i <= 4; i++) {
      const y = padT + (i / 4) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
    }

    // Vertical grid lines (6 cols)
    for (let i = 0; i <= 6; i++) {
      const x = padL + (i / 6) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();
    }
  }

  drawTimeTicks(ctx, padL, padT, plotW, plotH) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "8px Inter, sans-serif";

    let labels = ["-24 h", "-20 h", "-16 h", "-12 h", "-8 h", "-4 h", "Now"];
    if (this.timeScale === '1m') {
      labels = ["-60s", "-50s", "-40s", "-30s", "-20s", "-10s", "Now"];
    } else if (this.timeScale === '42d') {
      labels = ["Day 1", "Day 7", "Day 14", "Day 21", "Day 28", "Day 35", "Day 42"];
    }

    labels.forEach((lbl, i) => {
      const x = padL + (i / (labels.length - 1)) * plotW;
      ctx.fillText(lbl, x - 10, padT + plotH + 12);
    });
  }

  /**
   * Render Real-Time Micro Sparklines
   */
  renderAllSparklines() {
    const sparkConfigs = [
      { id: "sparkPpfd", data: this.history.ppfd, color: "#34d399" },
      { id: "sparkRh", data: this.history.rh, color: "#38bdf8" },
      { id: "sparkAirTemp", data: this.history.airTemp, color: "#f87171" },
      { id: "sparkCo2", data: this.history.co2, color: "#34d399" },
      { id: "sparkLeafTemp", data: this.history.leafTemp, color: "#00f2fe" },
      { id: "sparkEc", data: this.history.ec, color: "#fbbf24" },
      { id: "sparkVpd", data: this.history.vpd, color: "#34d399" },
      { id: "sparkFvFm", data: this.history.fvfm, color: "#a855f7" },
      // KPI Sparklines
      { id: "kpiSparkTotal", data: this.history.luteinTotal, color: "#00f2fe" },
      { id: "kpiSparkGain", data: this.history.an, color: "#34d399" },
      { id: "kpiSparkConc", data: this.history.luteinConc, color: "#a855f7" },
      { id: "kpiSparkFresh", data: this.history.freshWeight, color: "#34d399" },
      { id: "kpiSparkDry", data: this.history.biomass, color: "#94a3b8" },
      { id: "kpiSparkEnergy", data: this.history.energyEff, color: "#fbbf24" }
    ];

    sparkConfigs.forEach(({ id, data, color }) => {
      const canvas = document.getElementById(id);
      if (!canvas) return;
      this.drawMiniSparkline(canvas, data, color);
    });
  }

  drawMiniSparkline(canvas, data, color) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 60;
    const h = canvas.clientHeight || 18;

    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, w, h);

    if (!data || data.length < 2) {
      // Draw subtle straight line
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(2, h / 2);
      ctx.lineTo(w - 2, h / 2);
      ctx.stroke();
      return;
    }

    let min = Infinity, max = -Infinity;
    data.forEach(v => {
      if (v < min) min = v;
      if (v > max) max = v;
    });

    if (min === max) { min -= 1; max += 1; }
    const range = max - min;
    const len = data.length;

    ctx.beginPath();
    data.forEach((v, i) => {
      const x = 2 + (i / (len - 1)) * (w - 4);
      const y = (h - 3) - ((v - min) / range) * (h - 6);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
}
