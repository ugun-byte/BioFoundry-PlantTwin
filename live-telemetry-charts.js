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
      this.resizeAll();
    });
  }

  resizeAll() {
    Object.keys(this.canvases).forEach((k) => {
      if (this.canvases[k] && this.contexts[k]) {
        this.initCanvas(this.canvases[k], this.contexts[k]);
      }
    });
    this.renderAll();
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

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width > 0 ? rect.width : (canvas.dispW || 340);
    const h = rect.height > 0 ? rect.height : (canvas.dispH || 140);

    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.dispW = w;
      canvas.dispH = h;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const padL = 36, padR = 44, padT = 14, padB = 22;
    const plotW = Math.max(10, w - padL - padR);
    const plotH = Math.max(10, h - padT - padB);

    this.drawScopeGrid(ctx, padL, padT, plotW, plotH);

    // Y Axis 1 (Left: An 0 ~ 40) - Crisp High-Contrast Bright White
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px 'JetBrains Mono', 'Inter', monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    [40, 30, 20, 10, 0].forEach((v, idx) => {
      const y = padT + (idx / 4) * plotH;
      ctx.fillText(String(v), padL - 8, y);
    });

    // Y Axis 2 (Right: Ci 0 ~ 1000 ppm) - Crisp High-Contrast Neon Purple
    ctx.fillStyle = "#e879f9";
    ctx.textAlign = "left";
    [1000, 750, 500, 250, 0].forEach((v, idx) => {
      const y = padT + (idx / 4) * plotH;
      ctx.fillText(String(v), padL + plotW + 8, y);
    });

    // Time Axis Ticks
    this.drawTimeTicks(ctx, padL, padT, plotW, plotH);

    // Synthesize / Fetch Series based on timeScale
    const seriesAn = this.getScaledSeries(this.history.an, 18.0, 40.0);
    const seriesGs = this.getScaledSeries(this.history.gs, 0.35, 0.60);
    const seriesCi = this.getScaledSeries(this.history.ci, 520, 1000.0);

    // Draw Channel 3: Ci (Purple)
    this.drawLineSeries(ctx, seriesCi, 1000.0, padL, padT, plotW, plotH, "#c084fc", "rgba(192, 132, 252, 0.08)");

    // Draw Channel 2: gs (Cyan)
    this.drawLineSeries(ctx, seriesGs, 0.60, padL, padT, plotW, plotH, "#00f2fe", null);

    // Draw Channel 1: An (Emerald)
    this.drawLineSeries(ctx, seriesAn, 40.0, padL, padT, plotW, plotH, "#34d399", "rgba(52, 211, 153, 0.10)");
  }

  /**
   * Scope 2: 2-Channel Lutein Flux Scope (Lutein Flux [Emerald], Concentration [Purple])
   */
  renderLuteinMolecularScope() {
    const canvas = this.canvases.luteinScope;
    const ctx = this.contexts.luteinScope;
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width > 0 ? rect.width : (canvas.dispW || 340);
    const h = rect.height > 0 ? rect.height : (canvas.dispH || 140);

    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.dispW = w;
      canvas.dispH = h;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const padL = 36, padR = 44, padT = 14, padB = 22;
    const plotW = Math.max(10, w - padL - padR);
    const plotH = Math.max(10, h - padT - padB);

    this.drawScopeGrid(ctx, padL, padT, plotW, plotH);

    // Y Axis 1 (Left: Flux 0 ~ 25) - Crisp High-Contrast Bright White
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px 'JetBrains Mono', 'Inter', monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    [25, 20, 15, 10, 5, 0].forEach((v, idx) => {
      const y = padT + (idx / 5) * plotH;
      ctx.fillText(String(v), padL - 8, y);
    });

    // Y Axis 2 (Right: Conc 0 ~ 40 mg/g) - Crisp High-Contrast Neon Purple
    ctx.fillStyle = "#e879f9";
    ctx.textAlign = "left";
    [40, 30, 20, 10, 0].forEach((v, idx) => {
      const y = padT + (idx / 4) * plotH;
      ctx.fillText(String(v), padL + plotW + 8, y);
    });

    // Time Axis Ticks
    this.drawTimeTicks(ctx, padL, padT, plotW, plotH);

    // Fetch Series
    const seriesFlux = this.getScaledSeries(this.history.luteinFlux, 14.5, 25.0);
    const seriesConc = this.getScaledSeries(this.history.luteinConc, 18.2, 40.0);

    // Draw Channel 2: Concentration (Purple)
    this.drawLineSeries(ctx, seriesConc, 40.0, padL, padT, plotW, plotH, "#c084fc", "rgba(192, 132, 252, 0.08)");

    // Draw Channel 1: Flux (Emerald)
    this.drawLineSeries(ctx, seriesFlux, 25.0, padL, padT, plotW, plotH, "#34d399", "rgba(52, 211, 153, 0.10)");
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
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.restore();
  }

  drawScopeGrid(ctx, padL, padT, plotW, plotH) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
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
    ctx.fillStyle = "#f1f5f9";
    ctx.font = "bold 10px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    let labels = ["-24 h", "-20 h", "-16 h", "-12 h", "-8 h", "-4 h", "Now"];
    if (this.timeScale === '1m') {
      labels = ["-60s", "-50s", "-40s", "-30s", "-20s", "-10s", "Now"];
    } else if (this.timeScale === '42d') {
      labels = ["Day 1", "Day 7", "Day 14", "Day 21", "Day 28", "Day 35", "Day 42"];
    }

    labels.forEach((lbl, i) => {
      const x = padL + (i / (labels.length - 1)) * plotW;
      ctx.fillText(lbl, x, padT + plotH + 5);
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

  /**
   * Log-scale OJIP Chlorophyll a Fluorescence Induction Transient Scope (JIP-Test)
   */
  renderOJIPScope(canvas, primaryOJIP, comparisonOJIPList = []) {
    if (!canvas || !primaryOJIP || !primaryOJIP.points) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width > 0 ? rect.width : 560;
    const h = rect.height > 0 ? rect.height : 260;

    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, w, h);

    const padL = 48, padR = 24, padT = 24, padB = 36;
    const plotW = Math.max(10, w - padL - padR);
    const plotH = Math.max(10, h - padT - padB);

    // 1. Draw Cyber Dark Logarithmic Grid
    const logMin = -5.0; // 10 us (10^-5 s)
    const logMax = 0.0;  // 1 s (10^0 s)

    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;

    // Horizontal Y Grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padT + (i / 4) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
    }

    // Vertical Decadal Log Grid lines (10us, 100us, 1ms, 10ms, 100ms, 1s)
    const decades = [
      { log: -5, label: "10 μs" },
      { log: -4, label: "100 μs" },
      { log: -3, label: "1 ms" },
      { log: -2, label: "10 ms" },
      { log: -1, label: "100 ms" },
      { log: 0,  label: "1 s" }
    ];

    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.font = "9px Inter, sans-serif";

    decades.forEach(d => {
      const x = padL + ((d.log - logMin) / (logMax - logMin)) * plotW;
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();

      ctx.fillText(d.label, x - 12, padT + plotH + 15);
    });

    // 2. Determine Max Fluorescence for scale
    let maxF = 2200;
    if (primaryOJIP.cardinalPoints && primaryOJIP.cardinalPoints.Fm) {
      maxF = Math.max(maxF, primaryOJIP.cardinalPoints.Fm * 1.15);
    }

    // Y Axis Labels
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    for (let i = 0; i <= 4; i++) {
      const val = Math.round(maxF * (1.0 - i / 4));
      const y = padT + (i / 4) * plotH + 3;
      ctx.fillText(String(val), 8, y);
    }

    // 3. Draw Comparison Species Dotted Overlays
    const compColors = ["rgba(168, 85, 247, 0.55)", "rgba(56, 189, 248, 0.55)", "rgba(251, 191, 36, 0.55)"];
    if (Array.isArray(comparisonOJIPList)) {
      comparisonOJIPList.forEach((comp, cIdx) => {
        if (!comp || !comp.points) return;
        const cColor = compColors[cIdx % compColors.length];
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = cColor;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        comp.points.forEach((pt, i) => {
          const x = padL + ((pt.logT - logMin) / (logMax - logMin)) * plotW;
          const y = padT + plotH - (pt.f / maxF) * plotH;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.restore();
      });
    }

    // 4. Draw Primary Active Species OJIP Shaded Area & Glowing Curve
    const pts = primaryOJIP.points;

    // Shaded Gradient Fill
    const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    grad.addColorStop(0, "rgba(244, 63, 94, 0.35)"); // 685nm crimson tint
    grad.addColorStop(0.6, "rgba(16, 185, 129, 0.15)");
    grad.addColorStop(1, "rgba(16, 185, 129, 0.0)");

    ctx.beginPath();
    pts.forEach((pt, i) => {
      const x = padL + ((pt.logT - logMin) / (logMax - logMin)) * plotW;
      const y = padT + plotH - (pt.f / maxF) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.lineTo(padL, padT + plotH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Glowing Neon Stroke
    ctx.save();
    ctx.shadowColor = "#10b981";
    ctx.shadowBlur = 8;
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    pts.forEach((pt, i) => {
      const x = padL + ((pt.logT - logMin) / (logMax - logMin)) * plotW;
      const y = padT + plotH - (pt.f / maxF) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();

    // 5. Draw and Annotate the 4 Cardinal Points (O, J, I, P)
    const cardinals = [
      { step: "O (F₀)", logT: -4.70, f: primaryOJIP.cardinalPoints.Fo, color: "#38bdf8" },
      { step: "J (Fⱼ)", logT: -2.70, f: primaryOJIP.cardinalPoints.Fj, color: "#00f2fe" },
      { step: "I (Fᵢ)", logT: -1.52, f: primaryOJIP.cardinalPoints.Fi, color: "#c084fc" },
      { step: "P (Fₘ)", logT: -0.52, f: primaryOJIP.cardinalPoints.Fm, color: "#f59e0b" }
    ];

    cardinals.forEach(c => {
      const cx = padL + ((c.logT - logMin) / (logMax - logMin)) * plotW;
      const cy = padT + plotH - (c.f / maxF) * plotH;

      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = c.color;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      ctx.fillStyle = c.color;
      ctx.font = "bold 10px Inter, sans-serif";
      ctx.fillText(c.step, cx - 12, cy - 8);
    });
  }

  /**
   * Root Electrophysiology Membrane Potential (V_m) & Action Potential Scope
   */
  renderElectrophysScope(canvas, electroData) {
    if (!canvas || !electroData || !electroData.wavePoints) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width > 0 ? rect.width : 560;
    const h = rect.height > 0 ? rect.height : 220;

    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, w, h);

    const padL = 48, padR = 20, padT = 20, padB = 30;
    const plotW = Math.max(10, w - padL - padR);
    const plotH = Math.max(10, h - padT - padB);

    const minV = -200, maxV = -60; // mV

    // 1. Hyperpolarized Optimal Absorption Zone (-180mV ~ -140mV)
    const yOptTop = padT + ((maxV - (-140)) / (maxV - minV)) * plotH;
    const yOptBottom = padT + ((maxV - (-180)) / (maxV - minV)) * plotH;
    ctx.fillStyle = "rgba(16, 185, 129, 0.10)";
    ctx.fillRect(padL, yOptTop, plotW, yOptBottom - yOptTop);

    // 2. Y Grid Lines & Labels
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px 'JetBrains Mono', 'Inter', monospace";
    ctx.textAlign = "right";

    const vTicks = [-200, -170, -140, -110, -80];
    vTicks.forEach(v => {
      const y = padT + ((maxV - v) / (maxV - minV)) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
      ctx.fillText(`${v} mV`, padL - 6, y + 3);
    });

    // 3. Time Ticks
    const pts = electroData.wavePoints;
    const len = pts.length;
    ctx.fillStyle = "#f1f5f9";
    ctx.textAlign = "center";
    for (let i = 0; i <= 4; i++) {
      const x = padL + (i / 4) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();
      ctx.fillText(`${(i * 5)}s`, x, padT + plotH + 15);
    }

    // 4. Draw Glowing Action Potential Waveform
    const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    grad.addColorStop(0, "rgba(0, 242, 254, 0.25)");
    grad.addColorStop(1, "rgba(0, 242, 254, 0.0)");

    ctx.beginPath();
    pts.forEach((pt, i) => {
      const x = padL + (i / (len - 1)) * plotW;
      const y = padT + ((maxV - pt.voltage) / (maxV - minV)) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.lineTo(padL, padT + plotH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Glowing Neon Stroke
    ctx.save();
    ctx.shadowColor = "#00f2fe";
    ctx.shadowBlur = 8;
    ctx.strokeStyle = "#00f2fe";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    pts.forEach((pt, i) => {
      const x = padL + (i / (len - 1)) * plotW;
      const y = padT + ((maxV - pt.voltage) / (maxV - minV)) * plotH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();

    // 5. Current Real-time Point Marker
    const lastPt = pts[pts.length - 1];
    const lx = padL + plotW;
    const ly = padT + ((maxV - lastPt.voltage) / (maxV - minV)) * plotH;
    ctx.beginPath();
    ctx.arc(lx, ly, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = electroData.stateColor || "#10b981";
    ctx.fill();
  }

  /**
   * Microscopic Guard Cell & Stomatal Pore Interactive Canvas
   */
  renderMicroscopeStomaView(canvas, cellData) {
    if (!canvas || !cellData) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width > 0 ? rect.width : 480;
    const h = rect.height > 0 ? rect.height : 220;

    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const aperturePct = cellData.stomaAperturePct || 75;
    const apertureWidth = 4 + (aperturePct / 100) * 36;

    // 1. Epidermal Cell Background Tissue Pattern
    ctx.strokeStyle = "rgba(16, 185, 129, 0.12)";
    ctx.lineWidth = 1.5;
    for (let r = 50; r < 220; r += 40) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. Stomatal Pore Aperture Gap (Center Black / Transpiration Hole)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, apertureWidth / 2, 60, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(5, 10, 18, 0.95)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(0, 242, 254, 0.4)";
    ctx.stroke();
    ctx.restore();

    // 3. Left Guard Cell
    ctx.save();
    ctx.shadowColor = "#10b981";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(cx - (apertureWidth / 2 + 32), cy, 32, 62, -0.08, 0, Math.PI * 2);
    const gradL = ctx.createRadialGradient(cx - 35, cy, 5, cx - 35, cy, 60);
    gradL.addColorStop(0, "#34d399");
    gradL.addColorStop(1, "#065f46");
    ctx.fillStyle = gradL;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#10b981";
    ctx.stroke();

    // Right Guard Cell
    ctx.beginPath();
    ctx.ellipse(cx + (apertureWidth / 2 + 32), cy, 32, 62, 0.08, 0, Math.PI * 2);
    const gradR = ctx.createRadialGradient(cx + 35, cy, 5, cx + 35, cy, 60);
    gradR.addColorStop(0, "#34d399");
    gradR.addColorStop(1, "#065f46");
    ctx.fillStyle = gradR;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#10b981";
    ctx.stroke();
    ctx.restore();

    // 4. Chloroplast Granules inside Guard Cells
    const chloroOffsets = [
      { x: -18, y: -30 }, { x: -28, y: -10 }, { x: -16, y: 15 }, { x: -25, y: 35 },
      { x: 18, y: -30 }, { x: 28, y: -10 }, { x: 16, y: 15 }, { x: 25, y: 35 }
    ];
    chloroOffsets.forEach(pt => {
      const offsetX = pt.x < 0 ? cx - (apertureWidth / 2 + 32) + (pt.x + 22) : cx + (apertureWidth / 2 + 32) + (pt.x - 22);
      ctx.beginPath();
      ctx.arc(offsetX, cy + pt.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = "#6ee7b7";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(offsetX, cy + pt.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    });

    // 5. Transpiration Vapor Glow Particles escaping through pore
    if (aperturePct > 20) {
      ctx.fillStyle = "rgba(0, 242, 254, 0.75)";
      for (let i = 0; i < 6; i++) {
        const py = cy - 35 + (i * 14);
        const px = cx + (Math.sin(Date.now() * 0.005 + i) * (apertureWidth * 0.25));
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /**
   * Real-Time Xylem Sap Flow & Transpiration Hydraulic Oscilloscope Canvas
   */
  renderSapFlowScope(canvas, sapData) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // 1. Futuristic Glass Grid
    ctx.fillStyle = "rgba(4, 11, 20, 0.95)";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(0, 242, 254, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 40; x < w - 20; x += 45) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, h - 30);
      ctx.stroke();
    }
    for (let y = 30; y < h - 30; y += 30) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(w - 20, y);
      ctx.stroke();
    }

    // 2. Axis Labels
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 10px 'JetBrains Mono', 'Inter', sans-serif";
    ctx.fillText("00:00", 40, h - 14);
    ctx.fillText("06:00 (일출)", 120, h - 14);
    ctx.fillText("12:00 (정오)", 220, h - 14);
    ctx.fillText("18:00 (일몰)", 320, h - 14);
    ctx.fillText("24:00", w - 45, h - 14);

    ctx.fillStyle = "#38bdf8";
    ctx.fillText("30 cm/h", 5, 35);
    ctx.fillText("15 cm/h", 5, 85);
    ctx.fillText("0 cm/h", 10, h - 35);

    // 3. Draw 24-Hour Diurnal Sap Flux Density Curve (Aqua/Cyan Area)
    const curve = sapData.diurnalCurve || [];
    if (curve.length > 0) {
      const padL = 45;
      const plotW = w - padL - 25;
      const plotH = h - 65;
      const padT = 28;
      const maxJs = 32.0;

      const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
      grad.addColorStop(0, "rgba(56, 189, 248, 0.45)");
      grad.addColorStop(1, "rgba(56, 189, 248, 0.0)");

      ctx.beginPath();
      curve.forEach((pt, i) => {
        const x = padL + (i / (curve.length - 1)) * plotW;
        const y = padT + ((maxJs - pt.js) / maxJs) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(padL + plotW, padT + plotH);
      ctx.lineTo(padL, padT + plotH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Stroke Line
      ctx.save();
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 8;
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      curve.forEach((pt, i) => {
        const x = padL + (i / (curve.length - 1)) * plotW;
        const y = padT + ((maxJs - pt.js) / maxJs) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();

      // Current live operating point marker
      const liveX = padL + (12 / 24) * plotW;
      const liveY = padT + ((maxJs - sapData.sapFluxDensity) / maxJs) * plotH;
      ctx.beginPath();
      ctx.arc(liveX, liveY, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#00f2fe";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(liveX, liveY, 9, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 242, 254, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  /**
   * Real-Time Hyperspectral Signature Reflectance (400nm ~ 900nm) Curve Canvas
   */
  renderHyperspectralScope(canvas, hsData) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = (rect.width > 0 ? rect.width : 780) * dpr;
    const h = (rect.height > 0 ? rect.height : 200) * dpr;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.clearRect(0, 0, w, h);

    // 1. Sci-Fi Grid Background
    ctx.fillStyle = "rgba(4, 11, 20, 0.95)";
    ctx.fillRect(0, 0, w, h);

    const padL = 60 * dpr;
    const padR = 30 * dpr;
    const padT = 36 * dpr;
    const padB = 42 * dpr;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    // Grid lines
    ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
    ctx.lineWidth = 1 * dpr;
    for (let wl = 400; wl <= 900; wl += 100) {
      const x = padL + ((wl - 400) / 500) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = `bold ${12 * dpr}px 'Inter', sans-serif`;
      ctx.fillText(`${wl}nm`, x - 16 * dpr, padT + plotH + 20 * dpr);
    }

    // Reflectance Y-axis
    for (let r = 0.0; r <= 1.0; r += 0.25) {
      const y = padT + (1.0 - r) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = `bold ${12 * dpr}px 'Inter', sans-serif`;
      ctx.fillText(`${(r * 100).toFixed(0)}%`, 14 * dpr, y + 4 * dpr);
    }

    // Visible Spectrum Color Gradient Bar along X-axis
    const specGrad = ctx.createLinearGradient(padL, 0, padL + (300 / 500) * plotW, 0);
    specGrad.addColorStop(0.0, "rgba(59, 130, 246, 0.45)");  // Blue 400nm
    specGrad.addColorStop(0.35, "rgba(16, 185, 129, 0.45)"); // Green 550nm
    specGrad.addColorStop(0.7, "rgba(239, 68, 68, 0.45)");   // Red 680nm
    specGrad.addColorStop(1.0, "rgba(168, 85, 247, 0.45)");  // NIR 750nm+
    ctx.fillStyle = specGrad;
    ctx.fillRect(padL, padT + plotH + 4 * dpr, plotW, 5 * dpr);

    // 2. Plot Hyperspectral Curve
    const curve = hsData.spectralCurve || [];
    if (curve.length > 0) {
      const curveGrad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
      curveGrad.addColorStop(0, "rgba(6, 182, 212, 0.4)");
      curveGrad.addColorStop(1, "rgba(6, 182, 212, 0.0)");

      ctx.beginPath();
      curve.forEach((pt, i) => {
        const x = padL + ((pt.wavelength - 400) / 500) * plotW;
        const y = padT + (1.0 - Math.min(1.0, Math.max(0.0, pt.reflectance))) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(padL + plotW, padT + plotH);
      ctx.lineTo(padL, padT + plotH);
      ctx.closePath();
      ctx.fillStyle = curveGrad;
      ctx.fill();

      // Stroke Spectral Signature Line
      ctx.save();
      ctx.shadowColor = "#06b6d4";
      ctx.shadowBlur = 10 * dpr;
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 2.8 * dpr;
      ctx.beginPath();
      curve.forEach((pt, i) => {
        const x = padL + ((pt.wavelength - 400) / 500) * plotW;
        const y = padT + (1.0 - Math.min(1.0, Math.max(0.0, pt.reflectance))) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();

      // Red Edge Inflection Label
      const redEdgeX = padL + ((705 - 400) / 500) * plotW;
      const redEdgeY = padT + (1.0 - 0.42) * plotH;
      ctx.fillStyle = "#fbbf24";
      ctx.font = `bold ${13 * dpr}px 'Inter', sans-serif`;
      ctx.fillText("⚡ Red Edge Transition", redEdgeX + 8 * dpr, redEdgeY - 8 * dpr);
    }
  }

  /**
   * Real-Time Stem Ultrasonic Acoustic Emissions (UAE) Cavitation Oscilloscope Canvas
   */
  renderCavitationScope(canvas, uaeData) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = (rect.width > 0 ? rect.width : 780) * dpr;
    const h = (rect.height > 0 ? rect.height : 200) * dpr;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.clearRect(0, 0, w, h);

    // 1. Futuristic Acoustic Grid
    ctx.fillStyle = "rgba(4, 11, 20, 0.95)";
    ctx.fillRect(0, 0, w, h);

    const padL = 60 * dpr;
    const padR = 30 * dpr;
    const padT = 30 * dpr;
    const padB = 38 * dpr;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const centerY = padT + plotH / 2;

    ctx.strokeStyle = "rgba(236, 72, 153, 0.15)";
    ctx.lineWidth = 1 * dpr;
    for (let x = padL; x <= padL + plotW; x += 65 * dpr) {
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(padL, centerY);
    ctx.lineTo(padL + plotW, centerY);
    ctx.strokeStyle = "rgba(236, 72, 153, 0.35)";
    ctx.stroke();

    // Time Axis Labels
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.font = `bold ${12 * dpr}px 'Inter', sans-serif`;
    ctx.fillText("0 ms (Trigger)", padL, padT + plotH + 20 * dpr);
    ctx.fillText("25 ms", padL + plotW * 0.25, padT + plotH + 20 * dpr);
    ctx.fillText("50 ms", padL + plotW * 0.5, padT + plotH + 20 * dpr);
    ctx.fillText("75 ms", padL + plotW * 0.75, padT + plotH + 20 * dpr);
    ctx.fillText("100 ms (Sampling Window)", padL + plotW - 120 * dpr, padT + plotH + 20 * dpr);

    ctx.fillText("+1.0 V", 14 * dpr, padT + 10 * dpr);
    ctx.fillText("0.0 V", 18 * dpr, centerY + 4 * dpr);
    ctx.fillText("-1.0 V", 16 * dpr, padT + plotH - 2 * dpr);

    // 2. Synthesize High-Frequency Ultrasonic Waveform
    const numPoints = 280;
    const freq = (uaeData.peakFreqKhz || 60.0) / 10.0;
    const maxAmp = (plotH * 0.42) * Math.min(1.0, Math.max(0.15, (uaeData.amplitudeDb || 35.0) / 75.0));

    ctx.save();
    ctx.shadowColor = "#ec4899";
    ctx.shadowBlur = 10 * dpr;
    ctx.strokeStyle = "#f472b6";
    ctx.lineWidth = 2.5 * dpr;
    ctx.beginPath();

    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      const x = padL + t * plotW;
      
      // Damped harmonic cavitation pulse packet
      const envelope = Math.exp(-4.5 * t) * Math.sin(t * Math.PI);
      const wave = Math.sin(t * Math.PI * 2 * freq * 8.0) * envelope;
      const noise = (Math.random() - 0.5) * 0.04;
      const y = centerY - (wave + noise) * maxAmp;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // Amplitude Peak Marker
    ctx.fillStyle = "#ec4899";
    ctx.font = `bold ${13 * dpr}px 'Inter', sans-serif`;
    ctx.fillText(`⚡ Cavitation Burst Peak: ${uaeData.peakFreqKhz || 62.5} kHz (${uaeData.amplitudeDb || 38} dB_AE)`, padL + 15 * dpr, padT + 20 * dpr);
  }

  /**
   * Real-Time C18 Reverse-Phase HPLC Chromatogram (450nm) Separation Canvas
   */
  renderHplcChromatogramScope(canvas, hplcData) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = (rect.width > 0 ? rect.width : 780) * dpr;
    const h = (rect.height > 0 ? rect.height : 230) * dpr;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.clearRect(0, 0, w, h);

    // 1. Sci-Fi Chromatography Grid Background
    ctx.fillStyle = "rgba(4, 11, 20, 0.96)";
    ctx.fillRect(0, 0, w, h);

    const padL = 65 * dpr;
    const padR = 30 * dpr;
    const padT = 38 * dpr;
    const padB = 42 * dpr;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const maxMau = 950.0;
    const maxTimeMin = 22.0;

    // Time X-Axis Grid Lines (every 2.0 min)
    ctx.strokeStyle = "rgba(234, 179, 8, 0.12)";
    ctx.lineWidth = 1 * dpr;
    for (let t = 0; t <= maxTimeMin; t += 2.0) {
      const x = padL + (t / maxTimeMin) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = `bold ${12 * dpr}px 'Inter', sans-serif`;
      ctx.fillText(`${t.toFixed(0)} min`, x - 12 * dpr, padT + plotH + 20 * dpr);
    }

    // Absorbance Y-Axis (0 to 800 mAU)
    for (let m = 0; m <= 800; m += 200) {
      const y = padT + ((maxMau - m) / maxMau) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = `bold ${12 * dpr}px 'Inter', sans-serif`;
      ctx.fillText(`${m} mAU`, 12 * dpr, y + 4 * dpr);
    }

    // 2. Render Shaded Peak Areas
    const peaks = hplcData.peakTable || [];
    peaks.forEach(p => {
      const peakX = padL + (p.rt / maxTimeMin) * plotW;
      const peakY = padT + ((maxMau - Math.min(maxMau, p.height + 16.0)) / maxMau) * plotH;

      // Peak Drop Line
      ctx.save();
      ctx.setLineDash([3 * dpr, 3 * dpr]);
      ctx.strokeStyle = p.isTarget ? "rgba(251, 191, 36, 0.75)" : "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 1.2 * dpr;
      ctx.beginPath();
      ctx.moveTo(peakX, peakY);
      ctx.lineTo(peakX, padT + plotH);
      ctx.stroke();
      ctx.restore();

      // Peak Tag Badge
      ctx.fillStyle = p.isTarget ? "#fbbf24" : (p.color || "#38bdf8");
      ctx.font = `bold ${(p.isTarget ? 13.5 : 12) * dpr}px 'Inter', sans-serif`;
      const badgeText = p.isTarget ? `★ ${p.name.split(' ')[0]} (${p.rt}m)` : `${p.name.split(' ')[0]} (${p.rt}m)`;
      ctx.fillText(badgeText, peakX - 25 * dpr, Math.max(padT - 8 * dpr, peakY - 10 * dpr));
    });

    // 3. Draw Continuous Chromatogram Baseline & Absorbance Curve
    const curve = hplcData.chromatogramCurve || [];
    if (curve.length > 0) {
      const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
      grad.addColorStop(0, "rgba(234, 179, 8, 0.4)");
      grad.addColorStop(1, "rgba(234, 179, 8, 0.0)");

      ctx.beginPath();
      curve.forEach((pt, i) => {
        const x = padL + (pt.timeMin / maxTimeMin) * plotW;
        const y = padT + ((maxMau - Math.min(maxMau, pt.absorbanceMau)) / maxMau) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(padL + plotW, padT + plotH);
      ctx.lineTo(padL, padT + plotH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Stroke Chromatogram Trace
      ctx.save();
      ctx.shadowColor = "#eab308";
      ctx.shadowBlur = 10 * dpr;
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 2.6 * dpr;
      ctx.beginPath();
      curve.forEach((pt, i) => {
        const x = padL + (pt.timeMin / maxTimeMin) * plotW;
        const y = padT + ((maxMau - Math.min(maxMau, pt.absorbanceMau)) / maxMau) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();
    }

    // Detector & Method Info Header
    ctx.fillStyle = "#fef08a";
    ctx.font = `bold ${13 * dpr}px 'Inter', sans-serif`;
    ctx.fillText(`UV/Vis λ=450nm | Flow: 1.0 mL/min | Column: C18 (250x4.6mm)`, padL + 12 * dpr, padT + 14 * dpr);
  }

  /**
   * Real-Time Biological EIS Nyquist (Cole-Cole) & Bode Impedance Dual Scope Canvas
   */
  renderEisNyquistAndBodeScope(canvas, eisData) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = (rect.width > 0 ? rect.width : 780) * dpr;
    const h = (rect.height > 0 ? rect.height : 230) * dpr;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.clearRect(0, 0, w, h);

    // 1. Futuristic Glass Background
    ctx.fillStyle = "rgba(4, 11, 20, 0.96)";
    ctx.fillRect(0, 0, w, h);

    const padL = 55 * dpr;
    const padR = 25 * dpr;
    const padT = 38 * dpr;
    const padB = 40 * dpr;
    const midGap = 40 * dpr;
    const singlePlotW = (w - padL - padR - midGap) / 2;
    const plotH = h - padT - padB;

    const sweep = eisData.sweepData || [];

    // ==========================================
    // PANE 1: Nyquist Cole-Cole Arc (Left Pane)
    // ==========================================
    const maxReal = Math.max(3000.0, (eisData.extracellularResistanceOhm || 2800) * 1.15);
    const maxImag = maxReal * 0.45;

    // Grid lines for Nyquist
    ctx.strokeStyle = "rgba(139, 92, 246, 0.15)";
    ctx.lineWidth = 1 * dpr;
    for (let r = 0; r <= maxReal; r += 1000) {
      const x = padL + (r / maxReal) * singlePlotW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = `bold ${11.5 * dpr}px 'Inter', sans-serif`;
      ctx.fillText(`${r}Ω`, x - 10 * dpr, padT + plotH + 18 * dpr);
    }
    for (let im = 0; im <= maxImag; im += 400) {
      const y = padT + ((maxImag - im) / maxImag) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + singlePlotW, y);
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = `bold ${11.5 * dpr}px 'Inter', sans-serif`;
      ctx.fillText(`${im}Ω`, padL - 40 * dpr, y + 4 * dpr);
    }

    // Pane 1 Title
    ctx.fillStyle = "#c084fc";
    ctx.font = `bold ${13.5 * dpr}px 'Inter', sans-serif`;
    ctx.fillText("① Nyquist Cole-Cole Arc (Z' vs -Z'')", padL, padT - 12 * dpr);

    // Plot Nyquist Depressed Arc
    if (sweep.length > 0) {
      ctx.save();
      ctx.shadowColor = "#a855f7";
      ctx.shadowBlur = 10 * dpr;
      ctx.strokeStyle = "#c084fc";
      ctx.lineWidth = 2.8 * dpr;
      ctx.beginPath();
      sweep.forEach((pt, i) => {
        const x = padL + (pt.zReal / maxReal) * singlePlotW;
        const y = padT + ((maxImag - Math.min(maxImag, pt.zImag)) / maxImag) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();

      // Intercept markers
      const rInfX = padL + ((eisData.intracellularResistanceOhm || 640) / maxReal) * singlePlotW;
      const r0X = padL + ((eisData.extracellularResistanceOhm || 2800) / maxReal) * singlePlotW;
      const baseLineY = padT + plotH;

      ctx.fillStyle = "#38bdf8";
      ctx.font = `bold ${11.5 * dpr}px 'Inter', sans-serif`;
      ctx.fillText(`R_inf`, rInfX - 8 * dpr, baseLineY - 8 * dpr);
      ctx.fillStyle = "#fbbf24";
      ctx.fillText(`R_0=Re`, r0X - 12 * dpr, baseLineY - 8 * dpr);

      // Apex Characteristic Frequency Marker
      const fcPt = sweep[Math.floor(sweep.length / 2)];
      if (fcPt) {
        const apexX = padL + (fcPt.zReal / maxReal) * singlePlotW;
        const apexY = padT + ((maxImag - Math.min(maxImag, fcPt.zImag)) / maxImag) * plotH;
        ctx.beginPath();
        ctx.arc(apexX, apexY, 5 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = "#f43f5e";
        ctx.fill();
        ctx.fillStyle = "#fecdd3";
        ctx.font = `bold ${12 * dpr}px 'Inter', sans-serif`;
        ctx.fillText(`fc=${eisData.characteristicFreqKhz}kHz`, apexX + 8 * dpr, apexY - 6 * dpr);
      }
    }

    // ==========================================
    // PANE 2: Bode Frequency vs Phase (Right Pane)
    // ==========================================
    const pane2L = padL + singlePlotW + midGap;

    // Grid lines for Bode Log Frequency (10Hz to 1MHz)
    ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
    ctx.lineWidth = 1 * dpr;
    const logDecades = [
      { log: 1, label: "10Hz" },
      { log: 2, label: "100Hz" },
      { log: 3, label: "1kHz" },
      { log: 4, label: "10kHz" },
      { log: 5, label: "100kHz" },
      { log: 6, label: "1MHz" }
    ];

    logDecades.forEach(d => {
      const x = pane2L + ((d.log - 1.0) / 5.0) * singlePlotW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = `bold ${11.5 * dpr}px 'Inter', sans-serif`;
      ctx.fillText(d.label, x - 12 * dpr, padT + plotH + 18 * dpr);
    });

    // Phase angle Y-axis (0 to -60 deg)
    for (let deg = 0; deg >= -60; deg -= 20) {
      const y = padT + ((-deg) / 60.0) * plotH;
      ctx.beginPath();
      ctx.moveTo(pane2L, y);
      ctx.lineTo(pane2L + singlePlotW, y);
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = `bold ${11.5 * dpr}px 'Inter', sans-serif`;
      ctx.fillText(`${deg}°`, pane2L - 32 * dpr, y + 4 * dpr);
    }

    // Pane 2 Title
    ctx.fillStyle = "#22d3ee";
    ctx.font = `bold ${13.5 * dpr}px 'Inter', sans-serif`;
    ctx.fillText("② Bode Phase Angle vs Frequency (10Hz ~ 1MHz)", pane2L, padT - 12 * dpr);

    // Plot Bode Phase Curve
    if (sweep.length > 0) {
      ctx.save();
      ctx.shadowColor = "#06b6d4";
      ctx.shadowBlur = 10 * dpr;
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 2.8 * dpr;
      ctx.beginPath();
      sweep.forEach((pt, i) => {
        const x = pane2L + ((pt.logFreq - 1.0) / 5.0) * singlePlotW;
        const y = padT + ((-pt.phaseAngleDeg) / 60.0) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();
    }
  }

  /**
   * Real-Time Stem Cell Meristem Dynamics & Cell Cycle Phase Wheel Canvas
   */
  renderMeristemCellCycleScope(canvas, meristemData) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = (rect.width > 0 ? rect.width : 780) * dpr;
    const h = (rect.height > 0 ? rect.height : 230) * dpr;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.clearRect(0, 0, w, h);

    // 1. Futuristic Glass Background
    ctx.fillStyle = "rgba(4, 11, 20, 0.96)";
    ctx.fillRect(0, 0, w, h);

    const padL = 40 * dpr;
    const padR = 20 * dpr;
    const padT = 30 * dpr;
    const padB = 32 * dpr;
    const midGap = 35 * dpr;
    const singlePlotW = (w - padL - padR - midGap) / 2;
    const plotH = h - padT - padB;

    // ==========================================================
    // PANE 1: Radial Cell Division Cycle Wheel (G1 -> S -> G2 -> M)
    // ==========================================================
    const centerX = padL + singlePlotW * 0.45;
    const centerY = padT + plotH * 0.52;
    const outerR = Math.min(singlePlotW * 0.38, plotH * 0.44);
    const innerR = outerR * 0.58;

    // Title
    ctx.fillStyle = "#38bdf8";
    ctx.font = `bold ${13.5 * dpr}px 'Inter', sans-serif`;
    ctx.fillText("① 세포 분열주기 래디얼 휠 (G1 → S → G2 → M)", padL, padT - 12 * dpr);

    const phases = meristemData.phaseDistribution || [];
    let startAngle = -Math.PI / 2;

    phases.forEach(p => {
      const sliceAngle = (p.percent / 100.0) * (Math.PI * 2);
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.arc(centerX, centerY, outerR, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerR, endAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(15, 23, 42, 0.95)";
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();

      // Label at slice center
      const midAngle = startAngle + sliceAngle / 2;
      const labelR = (outerR + innerR) / 2;
      const lx = centerX + Math.cos(midAngle) * labelR;
      const ly = centerY + Math.sin(midAngle) * labelR;

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${12 * dpr}px 'Inter', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.phase, lx, ly);

      startAngle = endAngle;
    });

    // Donut Center Stats
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#38bdf8";
    ctx.font = `bold ${15 * dpr}px 'Inter', sans-serif`;
    ctx.fillText(`${meristemData.totalCycleHours}h`, centerX, centerY - 6 * dpr);
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = `bold ${11.5 * dpr}px 'Inter', sans-serif`;
    ctx.fillText(`MI ${meristemData.mitoticIndexPct}%`, centerX, centerY + 10 * dpr);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // Legend on the right side of Pane 1
    const legendX = padL + singlePlotW * 0.74;
    phases.forEach((p, idx) => {
      const ly = padT + 28 * dpr + idx * 28 * dpr;
      ctx.fillStyle = p.color;
      ctx.fillRect(legendX, ly - 10 * dpr, 10 * dpr, 10 * dpr);

      ctx.fillStyle = "#e2e8f0";
      ctx.font = `bold ${12 * dpr}px 'Inter', sans-serif`;
      ctx.fillText(`${p.phase}: ${p.hours}h`, legendX + 14 * dpr, ly);

      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.font = `${10.5 * dpr}px 'Inter', sans-serif`;
      ctx.fillText(p.regulator, legendX + 14 * dpr, ly + 12 * dpr);
    });

    // ==========================================================
    // PANE 2: Meristem Morphogen Spatial Gradient (0 to 200 um)
    // ==========================================================
    const pane2L = padL + singlePlotW + midGap;

    // Grid lines for Radial Distance (0 to 200 um)
    ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
    ctx.lineWidth = 1 * dpr;
    for (let r = 0; r <= 200; r += 50) {
      const x = pane2L + (r / 200.0) * singlePlotW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = `bold ${11.5 * dpr}px 'Inter', sans-serif`;
      ctx.fillText(`${r}μm`, x - 10 * dpr, padT + plotH + 18 * dpr);
    }

    // Title & Subtitle
    ctx.fillStyle = "#22d3ee";
    ctx.font = `bold ${13.5 * dpr}px 'Inter', sans-serif`;
    ctx.fillText("② SAM 공간 호르몬 구배 (옥신 IAA vs 사이토키닌 CK)", pane2L, padT - 12 * dpr);

    const grad = meristemData.spatialGradient || [];
    if (grad.length > 0) {
      // 1. Plot Cytokinin (CK in nM, cyan curve)
      const maxCk = Math.max(35.0, (meristemData.ckConcNm || 28.5) * 1.1);
      ctx.save();
      ctx.strokeStyle = "#38bdf8";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 8 * dpr;
      ctx.lineWidth = 2.6 * dpr;
      ctx.beginPath();
      grad.forEach((pt, i) => {
        const x = pane2L + (pt.radiusUm / 200.0) * singlePlotW;
        const y = padT + ((maxCk - pt.ckNm) / maxCk) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();

      // 2. Plot Auxin (IAA in uM, gold curve)
      const maxIaa = Math.max(6.0, (meristemData.iaaConcUm || 4.2) * 1.25);
      ctx.save();
      ctx.strokeStyle = "#fbbf24";
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 8 * dpr;
      ctx.lineWidth = 2.6 * dpr;
      ctx.beginPath();
      grad.forEach((pt, i) => {
        const x = pane2L + (pt.radiusUm / 200.0) * singlePlotW;
        const y = padT + ((maxIaa - pt.iaaUm) / maxIaa) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();

      // Curve Labels
      ctx.fillStyle = "#38bdf8";
      ctx.font = `bold ${12 * dpr}px 'Inter', sans-serif`;
      ctx.fillText(`● 사이토키닌 CK (정단 CZ 피크)`, pane2L + 12 * dpr, padT + 18 * dpr);
      ctx.fillStyle = "#fbbf24";
      ctx.fillText(`● 옥신 IAA (엽원기 PZ 피크)`, pane2L + 12 * dpr, padT + 34 * dpr);
    }
  }

  /**
   * 15. Guard Cell ABA Signaling & Cytosolic Calcium Wave ([Ca2+]cyt) Dual-Pane Scope
   * Left: Guard Cell fluo-4 Ca2+ green glow & SLAC1/GORK channel gates
   * Right: 60-Second multi-channel molecular wave oscilloscope ([Ca2+]cyt, SLAC1 current, Vm, Aperture)
   */
  renderAbaCaWaveScope(canvas, abaData = {}) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = (rect.width > 0 ? rect.width : 780) * dpr;
    const h = (rect.height > 0 ? rect.height : 230) * dpr;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.clearRect(0, 0, w, h);

    // Dark Background Grid
    ctx.fillStyle = "rgba(4, 8, 15, 0.95)";
    ctx.fillRect(0, 0, w, h);

    const midX = w * 0.42;

    // Divider Line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(midX, 10 * dpr);
    ctx.lineTo(midX, h - 10 * dpr);
    ctx.stroke();

    // ==========================================
    // LEFT PANE: Guard Cell Molecular Micro-Diagram
    // ==========================================
    const leftW = midX;
    const centerX = leftW * 0.5;
    const centerY = h * 0.52;

    ctx.fillStyle = "#34d399";
    ctx.font = `bold ${13.5 * dpr}px 'Inter', sans-serif`;
    ctx.fillText("① 공변세포 칼슘 형광(Fluo-4) & 채널 동역학", 14 * dpr, 20 * dpr);

    const ca2Val = abaData.cytosolicCa2nM || 120.0;
    const ost1Pct = abaData.ost1KinaseActivityPct || 10.0;
    const apertureUm = abaData.stomaApertureUm || 8.5;

    // Calcium glow intensity (0.1 ~ 0.95)
    const caIntensity = Math.min(1.0, (ca2Val - 70.0) / 800.0);
    const poreOpeningHalf = Math.max(2 * dpr, (apertureUm / 12.0) * 26 * dpr);

    // Left Guard Cell
    ctx.save();
    ctx.translate(centerX - poreOpeningHalf - 22 * dpr, centerY);
    ctx.beginPath();
    ctx.ellipse(0, 0, 20 * dpr, 52 * dpr, -0.15, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(16, 185, 129, ${0.25 + caIntensity * 0.55})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(52, 211, 153, ${0.4 + caIntensity * 0.6})`;
    ctx.lineWidth = 2.4 * dpr;
    ctx.shadowColor = "#34d399";
    ctx.shadowBlur = (4 + caIntensity * 16) * dpr;
    ctx.stroke();

    // Vacuole inside Left Guard Cell
    ctx.beginPath();
    ctx.ellipse(0, 0, 10 * dpr, 32 * dpr, -0.15, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
    ctx.fill();
    ctx.restore();

    // Right Guard Cell
    ctx.save();
    ctx.translate(centerX + poreOpeningHalf + 22 * dpr, centerY);
    ctx.beginPath();
    ctx.ellipse(0, 0, 20 * dpr, 52 * dpr, 0.15, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(16, 185, 129, ${0.25 + caIntensity * 0.55})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(52, 211, 153, ${0.4 + caIntensity * 0.6})`;
    ctx.lineWidth = 2.4 * dpr;
    ctx.shadowColor = "#34d399";
    ctx.shadowBlur = (4 + caIntensity * 16) * dpr;
    ctx.stroke();

    // Vacuole inside Right Guard Cell
    ctx.beginPath();
    ctx.ellipse(0, 0, 10 * dpr, 32 * dpr, 0.15, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
    ctx.fill();
    ctx.restore();

    // Stomatal Pore Aperture Gap
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, Math.max(1 * dpr, poreOpeningHalf), 42 * dpr, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Channel Efflux Indicators
    if (ost1Pct > 35.0) {
      // SLAC1 Anion Efflux (Cl-, Malate2-) Orange arrows
      ctx.fillStyle = "#f97316";
      ctx.font = `bold ${11.5 * dpr}px 'Inter', sans-serif`;
      ctx.fillText("◀ SLAC1 (Cl⁻/Mal²⁻ 유출)", centerX - 100 * dpr, centerY - 32 * dpr);

      // GORK K+ Efflux Cyan arrows
      ctx.fillStyle = "#00f2fe";
      ctx.fillText("GORK (K⁺ 유출) ▶", centerX + 35 * dpr, centerY + 38 * dpr);
    }

    // Status Label below Left Pane
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = `bold ${12 * dpr}px 'Inter', sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`기공 폭: ${apertureUm}μm | Vm: ${abaData.currentVmMv}mV | [Ca²⁺]: ${Math.round(ca2Val)}nM`, centerX, h - 14 * dpr);
    ctx.textAlign = "left";

    // ==========================================
    // RIGHT PANE: 60-Second Multi-Trace Oscilloscope
    // ==========================================
    const rightL = midX + 18 * dpr;
    const rightW = w - rightL - 18 * dpr;
    const plotT = 36 * dpr;
    const plotH = h - 68 * dpr;

    ctx.fillStyle = "#fbbf24";
    ctx.font = `bold ${13.5 * dpr}px 'Inter', sans-serif`;
    ctx.fillText("② 60초 분자 파동 스코프 ([Ca²⁺]cyt, SLAC1 전류, 막전위 Vm)", rightL, 20 * dpr);

    // Horizontal Grid Lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1 * dpr;
    for (let y = plotT; y <= plotT + plotH; y += plotH / 4) {
      ctx.beginPath(); ctx.moveTo(rightL, y); ctx.lineTo(rightL + rightW, y); ctx.stroke();
    }

    // Vertical Time Grid Lines (0s, 15s, 30s, 45s, 60s)
    for (let s = 0; s <= 60; s += 15) {
      const x = rightL + (s / 60.0) * rightW;
      ctx.beginPath(); ctx.moveTo(x, plotT); ctx.lineTo(x, plotT + plotH); ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.font = `bold ${11 * dpr}px 'Inter', sans-serif`;
      ctx.fillText(`${s}s`, x - 8 * dpr, plotT + plotH + 18 * dpr);
    }

    const wavePoints = abaData.wavePoints || [];
    if (wavePoints.length > 1) {
      // 1. Plot [Ca2+]cyt (Green trace)
      ctx.save();
      ctx.strokeStyle = "#34d399";
      ctx.shadowColor = "#34d399";
      ctx.shadowBlur = 8 * dpr;
      ctx.lineWidth = 2.4 * dpr;
      ctx.beginPath();
      wavePoints.forEach((pt, i) => {
        const x = rightL + (pt.timeSec / 60.0) * rightW;
        const norm = Math.max(0.0, Math.min(1.0, (pt.ca2nM - 50.0) / 1000.0));
        const y = plotT + plotH - (norm * plotH);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();

      // 2. Plot Membrane Potential Vm (Cyan trace)
      ctx.save();
      ctx.strokeStyle = "#00f2fe";
      ctx.shadowColor = "#00f2fe";
      ctx.shadowBlur = 6 * dpr;
      ctx.lineWidth = 1.8 * dpr;
      ctx.beginPath();
      wavePoints.forEach((pt, i) => {
        const x = rightL + (pt.timeSec / 60.0) * rightW;
        const norm = Math.max(0.0, Math.min(1.0, (pt.vmMv - (-150.0)) / 110.0));
        const y = plotT + plotH - (norm * plotH);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();

      // 3. Plot SLAC1 Current (Orange trace)
      ctx.save();
      ctx.strokeStyle = "#f97316";
      ctx.shadowColor = "#f97316";
      ctx.shadowBlur = 6 * dpr;
      ctx.lineWidth = 1.8 * dpr;
      ctx.beginPath();
      wavePoints.forEach((pt, i) => {
        const x = rightL + (pt.timeSec / 60.0) * rightW;
        const norm = Math.max(0.0, Math.min(1.0, Math.abs(pt.slac1Pa) / 400.0));
        const y = plotT + plotH - (norm * plotH * 0.7);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();

      // Oscilloscope Legend Pills
      ctx.fillStyle = "#34d399";
      ctx.font = `bold ${12 * dpr}px 'Inter', sans-serif`;
      ctx.fillText(`● [Ca²⁺]cyt (${Math.round(ca2Val)} nM)`, rightL + 8 * dpr, plotT + 16 * dpr);

      ctx.fillStyle = "#00f2fe";
      ctx.fillText(`● Vm 탈분극 (${abaData.currentVmMv} mV)`, rightL + 150 * dpr, plotT + 16 * dpr);

      ctx.fillStyle = "#f97316";
      ctx.fillText(`● SLAC1 전류 (${abaData.slac1AnionCurrentPicoA} pA)`, rightL + 300 * dpr, plotT + 16 * dpr);
    }
  }

  /**
   * 16. Closed-Loop Hydroponic Nutrient Recycling & 6-ISE Calibration Dual-Pane Scope
   * Left: Closed-loop schematic fluid circuit (Mixing -> Roots -> Drain -> ISE Cell -> UV/RO -> Dosing Pumps)
   * Right: 6-Ion Comparative Supply vs Drain Bar Chart & ISE Electrode Potentials (mV)
   */
  renderClosedLoopHydroponicScope(canvas, iseData = {}) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = (rect.width > 0 ? rect.width : 780) * dpr;
    const h = (rect.height > 0 ? rect.height : 230) * dpr;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.clearRect(0, 0, w, h);

    // Dark Background Grid
    ctx.fillStyle = "rgba(4, 8, 15, 0.95)";
    ctx.fillRect(0, 0, w, h);

    const midX = w * 0.44;

    // Divider Line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(midX, 10 * dpr);
    ctx.lineTo(midX, h - 10 * dpr);
    ctx.stroke();

    // ==========================================
    // LEFT PANE: Closed-Loop Fluid Circuit Flow
    // ==========================================
    ctx.fillStyle = "#38bdf8";
    ctx.font = `bold ${13.5 * dpr}px 'Inter', sans-serif`;
    ctx.fillText("① 스마트 양액 100% 폐쇄 재순환 루프 (Closed-Loop)", 14 * dpr, 20 * dpr);

    const leftW = midX;
    const cx = leftW * 0.5;
    const cy = h * 0.52;

    // Outer Recirculation Fluid Circuit Track
    ctx.save();
    ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
    ctx.lineWidth = 3 * dpr;
    ctx.setLineDash([6 * dpr, 4 * dpr]);
    ctx.strokeRect(30 * dpr, 36 * dpr, leftW - 60 * dpr, h - 72 * dpr);
    ctx.restore();

    // Circuit Nodes (4 Key Stations)
    const nodes = [
      { name: "혼합 탱크 (Mixing Tank)", sub: `EC ${iseData.targetEc || 2.2} / pH ${iseData.targetPh || 5.85}`, x: 30 * dpr, y: 36 * dpr, color: "#38bdf8" },
      { name: "식물 근권 배지 (Rhizosphere)", sub: "6대 이온 차등 흡수", x: leftW - 30 * dpr, y: 36 * dpr, color: "#10b981" },
      { name: "배액 집수정 (Drain Tank)", sub: `EC ${iseData.drainageEc || 1.8} / pH ${iseData.drainagePh || 6.1}`, x: leftW - 30 * dpr, y: h - 36 * dpr, color: "#fbbf24" },
      { name: "6-ISE 센서 & UV 살균기", sub: `회수율 ${iseData.waterRecoveryRatePct || 94.8}%`, x: 30 * dpr, y: h - 36 * dpr, color: "#a855f7" }
    ];

    nodes.forEach(n => {
      ctx.fillStyle = n.color;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 6 * dpr, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = `bold ${12 * dpr}px 'Inter', sans-serif`;
      ctx.textAlign = n.x < cx ? "left" : "right";
      ctx.fillText(n.name, n.x + (n.x < cx ? 12 * dpr : -12 * dpr), n.y - 2 * dpr);

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = `${10.5 * dpr}px 'Inter', sans-serif`;
      ctx.fillText(n.sub, n.x + (n.x < cx ? 12 * dpr : -12 * dpr), n.y + 12 * dpr);
    });

    // Center Badge: Dosing & Water Savings
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.roundRect(cx - 80 * dpr, cy - 28 * dpr, 160 * dpr, 56 * dpr, 6 * dpr);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "#38bdf8";
    ctx.font = `bold ${13 * dpr}px 'Inter', sans-serif`;
    ctx.fillText("💧 94.8% 순환 회수", cx, cy - 8 * dpr);

    ctx.fillStyle = "#34d399";
    ctx.font = `bold ${11.5 * dpr}px 'Inter', sans-serif`;
    ctx.fillText(`일일 절수: ${iseData.dailyWaterSavedLiters || 1.42}L | 비료: -38.5%`, cx, cy + 7 * dpr);

    ctx.fillStyle = iseData.isAutoDosed ? "#10b981" : "#fbbf24";
    ctx.font = `bold ${11 * dpr}px 'Inter', sans-serif`;
    ctx.fillText(iseData.isAutoDosed ? "● 정밀 자동 보정 완료 (Dosed)" : "● ISE 피드백 보정 대기 중", cx, cy + 20 * dpr);

    // ==========================================
    // RIGHT PANE: 6-Ion Comparative Supply vs Drain Chart
    // ==========================================
    const rightL = midX + 18 * dpr;
    const rightW = w - rightL - 18 * dpr;
    const plotT = 40 * dpr;
    const plotH = h - 72 * dpr;

    ctx.textAlign = "left";
    ctx.fillStyle = "#fbbf24";
    ctx.font = `bold ${13.5 * dpr}px 'Inter', sans-serif`;
    ctx.fillText("② 6대 이온 공급 목표 vs 배액 농도 & ISE 전위(mV)", rightL, 20 * dpr);

    const sensors = iseData.sensors || [];
    const barGroupW = rightW / Math.max(1, sensors.length);
    const maxVal = 16.0;

    sensors.forEach((s, idx) => {
      const gx = rightL + idx * barGroupW;
      const colW = Math.min(22 * dpr, barGroupW * 0.36);

      // Target Supply Bar (Translucent Background)
      const targetH = (s.target_mm / maxVal) * plotH;
      const targetY = plotT + plotH - targetH;
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fillRect(gx + 4 * dpr, targetY, colW, targetH);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.strokeRect(gx + 4 * dpr, targetY, colW, targetH);

      // Drainage Actual Bar (Color Gradient)
      const drainH = (s.drain_mm / maxVal) * plotH;
      const drainY = plotT + plotH - drainH;
      const grad = ctx.createLinearGradient(0, drainY, 0, plotT + plotH);
      grad.addColorStop(0, s.color);
      grad.addColorStop(1, "rgba(0,0,0,0.3)");
      ctx.fillStyle = grad;
      ctx.fillRect(gx + 6 * dpr + colW, drainY, colW, drainH);
      ctx.strokeStyle = s.color;
      ctx.strokeRect(gx + 6 * dpr + colW, drainY, colW, drainH);

      // Value text above bars
      ctx.fillStyle = s.color;
      ctx.font = `bold ${11 * dpr}px 'Inter', sans-serif`;
      ctx.fillText(`${s.drain_mm}`, gx + 6 * dpr + colW, drainY - 4 * dpr);

      // Ion Symbol Label
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${12 * dpr}px 'Inter', sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(s.symbol, gx + colW + 6 * dpr, plotT + plotH + 16 * dpr);

      // ISE Potential readout below
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = `bold ${10.5 * dpr}px monospace`;
      ctx.fillText(`${s.electrodePotentialMv}mV`, gx + colW + 6 * dpr, plotT + plotH + 28 * dpr);
      ctx.textAlign = "left";
    });

    // Chart Legend
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.font = `bold ${11 * dpr}px 'Inter', sans-serif`;
    ctx.fillText("■ 공급 목표 (Target) | ■ 배액 실측 (Drain ISE)", rightL, plotT - 8 * dpr);
  }

  /**
   * 17. Thylakoid Membrane Electron Transport Chain (ETC) & ATP Synthase Dual-Pane Scope
   * Left: Thylakoid Lipid Bilayer (PSII -> Cyt b6f -> PSI -> ATP Synthase Rotor)
   * Right: 60-Second Energetics Oscilloscope (pmf in mV, ETR, Lumen pH, ATP Synthase RPM)
   */
  renderThylakoidEtcScope(canvas, etcData = {}) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = (rect.width > 0 ? rect.width : 780) * dpr;
    const h = (rect.height > 0 ? rect.height : 230) * dpr;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.clearRect(0, 0, w, h);

    // Dark Background Grid
    ctx.fillStyle = "rgba(4, 8, 15, 0.95)";
    ctx.fillRect(0, 0, w, h);

    const midX = w * 0.45;

    // Divider Line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(midX, 10 * dpr);
    ctx.lineTo(midX, h - 10 * dpr);
    ctx.stroke();

    // ==========================================
    // LEFT PANE: Thylakoid Membrane Complexes Diagram
    // ==========================================
    ctx.fillStyle = "#34d399";
    ctx.font = `bold ${13.5 * dpr}px 'Inter', sans-serif`;
    ctx.fillText("① 틸라코이드 막 전자전달계(ETC) & ATP 합성 나노모터", 14 * dpr, 20 * dpr);

    const leftW = midX;
    const membraneY = h * 0.52;

    // Lipid Bilayer Double Band
    ctx.fillStyle = "rgba(16, 185, 129, 0.18)";
    ctx.fillRect(20 * dpr, membraneY - 12 * dpr, leftW - 40 * dpr, 24 * dpr);
    ctx.strokeStyle = "rgba(52, 211, 153, 0.4)";
    ctx.lineWidth = 2 * dpr;
    ctx.strokeRect(20 * dpr, membraneY - 12 * dpr, leftW - 40 * dpr, 24 * dpr);

    // Compartment Labels
    ctx.fillStyle = "rgba(56, 189, 248, 0.85)";
    ctx.font = `bold ${11.5 * dpr}px 'Inter', sans-serif`;
    ctx.fillText("스트로마 (Stroma pH 7.85)", 24 * dpr, membraneY - 20 * dpr);

    ctx.fillStyle = "rgba(251, 191, 36, 0.85)";
    ctx.fillText(`루멘 (Lumen pH ${etcData.lumenPh || 5.85}) - 산성화`, 24 * dpr, membraneY + 34 * dpr);

    // 4 Protein Complexes along membrane
    const complexes = [
      { name: "PSII", sub: "2H₂O→O₂", x: 70 * dpr, color: "#10b981", shape: "rect" },
      { name: "Cyt b₆f", sub: "Q-Cycle 4H⁺", x: 150 * dpr, color: "#38bdf8", shape: "rect" },
      { name: "PSI", sub: "P700→Fd", x: 230 * dpr, color: "#a855f7", shape: "rect" },
      { name: "ATP Synthase", sub: `${etcData.atpSynthaseRpm || 840} RPM`, x: 310 * dpr, color: "#fbbf24", shape: "rotor" }
    ];

    complexes.forEach(c => {
      ctx.fillStyle = c.color;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.2 * dpr;

      if (c.shape === "rect") {
        ctx.beginPath();
        ctx.roundRect(c.x - 25 * dpr, membraneY - 24 * dpr, 50 * dpr, 48 * dpr, 4 * dpr);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#fff";
        ctx.font = `bold ${11.5 * dpr}px 'Inter', sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(c.name, c.x, membraneY - 2 * dpr);

        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.font = `bold ${10 * dpr}px 'Inter', sans-serif`;
        ctx.fillText(c.sub, c.x, membraneY + 12 * dpr);
      } else {
        // Rotating F0F1 ATP Synthase Rotor
        ctx.beginPath();
        ctx.arc(c.x, membraneY - 16 * dpr, 18 * dpr, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Stalk & F0 base in membrane
        ctx.fillRect(c.x - 7 * dpr, membraneY - 2 * dpr, 14 * dpr, 24 * dpr);

        ctx.fillStyle = "#000";
        ctx.font = `bold ${10.5 * dpr}px 'Inter', sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("F₁ Rotor", c.x, membraneY - 18 * dpr);
        ctx.fillText(`${etcData.atpSynthaseRpm || 840}RPM`, c.x, membraneY - 6 * dpr);

        // Proton cascade arrow into Stroma
        ctx.fillStyle = "#fbbf24";
        ctx.font = `bold ${11.5 * dpr}px 'Inter', sans-serif`;
        ctx.fillText("▲ H⁺ 방출 (ATP 생성)", c.x, membraneY - 38 * dpr);
      }
    });

    // Subtitle Footer in Left Pane
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = `bold ${11.5 * dpr}px 'Inter', sans-serif`;
    ctx.fillText(`ETR: ${etcData.linearEtr || 88.5} μmol e⁻ | pmf: ${etcData.protonMotiveForcePmfMv || 192.4} mV | ATP: ${etcData.atpPerSecPerComplex || 42.0} ATP/s`, 20 * dpr, h - 12 * dpr);

    // ==========================================
    // RIGHT PANE: 60-Second Multi-Trace Oscilloscope
    // ==========================================
    const rightL = midX + 18 * dpr;
    const rightW = w - rightL - 18 * dpr;
    const plotT = 40 * dpr;
    const plotH = h - 72 * dpr;

    ctx.fillStyle = "#fbbf24";
    ctx.font = `bold ${13.5 * dpr}px 'Inter', sans-serif`;
    ctx.fillText("② 60초 광에너지 대사 스코프 (pmf, ETR, 루멘 pH, ATP RPM)", rightL, 20 * dpr);

    // Horizontal Grid Lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1 * dpr;
    for (let y = plotT; y <= plotT + plotH; y += plotH / 4) {
      ctx.beginPath(); ctx.moveTo(rightL, y); ctx.lineTo(rightL + rightW, y); ctx.stroke();
    }

    // Vertical Time Grid Lines (0s, 15s, 30s, 45s, 60s)
    for (let s = 0; s <= 60; s += 15) {
      const x = rightL + (s / 60.0) * rightW;
      ctx.beginPath(); ctx.moveTo(x, plotT); ctx.lineTo(x, plotT + plotH); ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.font = `bold ${11 * dpr}px 'Inter', sans-serif`;
      ctx.fillText(`${s}s`, x - 8 * dpr, plotT + plotH + 18 * dpr);
    }

    const wavePoints = etcData.wavePoints || [];
    if (wavePoints.length > 1) {
      // 1. Plot Proton Motive Force (pmf, Gold trace)
      ctx.save();
      ctx.strokeStyle = "#fbbf24";
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 8 * dpr;
      ctx.lineWidth = 2.4 * dpr;
      ctx.beginPath();
      wavePoints.forEach((pt, i) => {
        const x = rightL + (pt.timeSec / 60.0) * rightW;
        const norm = Math.max(0.0, Math.min(1.0, (pt.pmfMv - 140.0) / 100.0));
        const y = plotT + plotH - (norm * plotH);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();

      // 2. Plot Linear ETR (Cyan trace)
      ctx.save();
      ctx.strokeStyle = "#38bdf8";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 6 * dpr;
      ctx.lineWidth = 1.8 * dpr;
      ctx.beginPath();
      wavePoints.forEach((pt, i) => {
        const x = rightL + (pt.timeSec / 60.0) * rightW;
        const norm = Math.max(0.0, Math.min(1.0, pt.etr / 180.0));
        const y = plotT + plotH - (norm * plotH);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();

      // 3. Plot ATP Synthase RPM (Purple trace)
      ctx.save();
      ctx.strokeStyle = "#c084fc";
      ctx.shadowColor = "#c084fc";
      ctx.shadowBlur = 6 * dpr;
      ctx.lineWidth = 1.8 * dpr;
      ctx.beginPath();
      wavePoints.forEach((pt, i) => {
        const x = rightL + (pt.timeSec / 60.0) * rightW;
        const norm = Math.max(0.0, Math.min(1.0, pt.rpm / 1400.0));
        const y = plotT + plotH - (norm * plotH);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();

      // Oscilloscope Legend Pills
      ctx.fillStyle = "#fbbf24";
      ctx.font = `bold ${12 * dpr}px 'Inter', sans-serif`;
      ctx.fillText(`● pmf (${etcData.protonMotiveForcePmfMv} mV)`, rightL + 8 * dpr, plotT + 16 * dpr);

      ctx.fillStyle = "#38bdf8";
      ctx.fillText(`● ETR (${etcData.linearEtr} μmol e⁻)`, rightL + 140 * dpr, plotT + 16 * dpr);

      ctx.fillStyle = "#c084fc";
      ctx.fillText(`● ATP RPM (${etcData.atpSynthaseRpm} RPM)`, rightL + 280 * dpr, plotT + 16 * dpr);
    }
  }

  /**
   * 18. Industrial PLC Modbus-TCP & MQTT Live Hardware Gateway Scope
   * Left: Industrial PLC Rack Simulator (CPU, Ethernet Modbus Module, DO/AO Relay status LEDs)
   * Right: Real-Time Hexadecimal Transaction Packet Stream Tracer
   */
  renderModbusPacketScope(canvas, iotBridge) {
    if (!canvas || !iotBridge) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = (rect.width > 0 ? rect.width : 780) * dpr;
    const h = (rect.height > 0 ? rect.height : 230) * dpr;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.clearRect(0, 0, w, h);

    // Dark Background
    ctx.fillStyle = "rgba(4, 8, 15, 0.95)";
    ctx.fillRect(0, 0, w, h);

    const midX = w * 0.42;

    // Divider Line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(midX, 10 * dpr);
    ctx.lineTo(midX, h - 10 * dpr);
    ctx.stroke();

    // ==========================================
    // LEFT PANE: Industrial PLC Rack Simulator
    // ==========================================
    ctx.fillStyle = "#38bdf8";
    ctx.font = `bold ${13.5 * dpr}px 'Inter', sans-serif`;
    ctx.fillText("① 산업용 PLC 게이트웨이 랙 (LS / Siemens Modbus-TCP)", 14 * dpr, 20 * dpr);

    const rackX = 20 * dpr;
    const rackY = 36 * dpr;
    const rackW = midX - 40 * dpr;
    const rackH = h - 56 * dpr;

    // Rack Chassis
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.fillRect(rackX, rackY, rackW, rackH);
    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = 1.8 * dpr;
    ctx.strokeRect(rackX, rackY, rackW, rackH);

    // 4 Slots: Power, CPU, Modbus-TCP, IO Relay
    const slotW = (rackW - 10 * dpr) / 4;
    const slots = [
      { name: "PSU", sub: "24V DC", led: "#34d399", label: "PWR" },
      { name: "CPU", sub: "XGT-500", led: "#34d399", label: "RUN" },
      { name: "ETH", sub: "Port 502", led: (Date.now() % 400 < 200) ? "#fbbf24" : "#34d399", label: "TX/RX" },
      { name: "RELAY", sub: "8-CH DO", led: "#10b981", label: "ACT" }
    ];

    slots.forEach((s, idx) => {
      const sx = rackX + 5 * dpr + idx * slotW;
      const sy = rackY + 5 * dpr;
      const sw = slotW - 5 * dpr;
      const sh = rackH - 10 * dpr;

      ctx.fillStyle = "rgba(30, 41, 59, 0.85)";
      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1 * dpr;
      ctx.strokeRect(sx, sy, sw, sh);

      // Slot Title
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${11 * dpr}px 'Inter', sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(s.name, sx + sw / 2, sy + 16 * dpr);

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = `bold ${9.5 * dpr}px monospace`;
      ctx.fillText(s.sub, sx + sw / 2, sy + 28 * dpr);

      // Status LED
      ctx.fillStyle = s.led;
      ctx.beginPath();
      ctx.arc(sx + sw / 2, sy + 44 * dpr, 5 * dpr, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.font = `bold ${10 * dpr}px monospace`;
      ctx.fillText(s.label, sx + sw / 2, sy + 58 * dpr);
    });

    // Subtitle Footer
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = `bold ${10.5 * dpr}px monospace`;
    ctx.fillText("Modbus Link: 127.0.0.1:502 | Unit ID: 0x01 | Poll: 100ms", rackX + 4 * dpr, rackY + rackH + 16 * dpr);

    // ==========================================
    // RIGHT PANE: Packet Stream Trace Terminal
    // ==========================================
    const rightL = midX + 18 * dpr;
    const rightW = w - rightL - 18 * dpr;

    ctx.fillStyle = "#34d399";
    ctx.font = `bold ${13.5 * dpr}px 'Inter', sans-serif`;
    ctx.fillText("② 실시간 Modbus-TCP / MQTT 패킷 트레이서 (Hex Stream)", rightL, 20 * dpr);

    const packets = iotBridge.getPacketStreamHistory();
    packets.slice(0, 5).forEach((p, idx) => {
      const cardY = 36 * dpr + idx * 36 * dpr;
      const isTx = p.direction === "TX";

      ctx.fillStyle = isTx ? "rgba(14, 165, 233, 0.15)" : "rgba(16, 185, 129, 0.15)";
      ctx.strokeStyle = isTx ? "rgba(56, 189, 248, 0.35)" : "rgba(52, 211, 153, 0.35)";
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.roundRect(rightL, cardY, rightW, 32 * dpr, 4 * dpr);
      ctx.fill();
      ctx.stroke();

      // Direction Badge
      ctx.fillStyle = isTx ? "#38bdf8" : "#34d399";
      ctx.font = `bold ${11 * dpr}px monospace`;
      ctx.fillText(`[${p.direction}] ${p.timestamp}`, rightL + 8 * dpr, cardY + 13 * dpr);

      ctx.fillStyle = "#fbbf24";
      ctx.fillText(`${p.funcCode} (${p.addr})`, rightL + 135 * dpr, cardY + 13 * dpr);

      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.fillText(`${p.latencyMs}ms`, rightL + rightW - 45 * dpr, cardY + 13 * dpr);

      // Hex Payload Dump Line
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = `${10 * dpr}px monospace`;
      ctx.fillText(p.hexDump.length > 55 ? p.hexDump.slice(0, 55) + "..." : p.hexDump, rightL + 8 * dpr, cardY + 26 * dpr);
    });
  }

  /**
   * Renders High-Resolution Matrix QR Verification Code on Canvas
   */
  renderQrCodeCanvas(canvas, qrUrl = "") {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 120;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    // Draw Crisp 2D Matrix Pattern (Deterministic QR Code representation)
    ctx.fillStyle = "#000000";
    const modules = 21;
    const cellSize = size / modules;

    // Fixed Position Finders (3 Corners)
    const drawFinder = (x0, y0) => {
      ctx.fillRect(x0 * cellSize, y0 * cellSize, 7 * cellSize, 7 * cellSize);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect((x0 + 1) * cellSize, (y0 + 1) * cellSize, 5 * cellSize, 5 * cellSize);
      ctx.fillStyle = "#000000";
      ctx.fillRect((x0 + 2) * cellSize, (y0 + 2) * cellSize, 3 * cellSize, 3 * cellSize);
    };

    drawFinder(0, 0);
    drawFinder(modules - 7, 0);
    drawFinder(0, modules - 7);

    // Pseudo-Random Deterministic Data Bits based on URL hash
    let hash = 0;
    for (let i = 0; i < qrUrl.length; i++) hash = ((hash << 5) - hash) + qrUrl.charCodeAt(i);

    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        // Skip finder areas
        if ((r < 8 && c < 8) || (r < 8 && c >= modules - 8) || (r >= modules - 8 && c < 8)) continue;
        const bit = Math.sin(hash + r * 13 + c * 37) > 0;
        if (bit) {
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }
  }

  /**
   * 19. Real-Time Rhizosphere PGPR Microbiome & Biofertilizer Symbiosis Dual-Pane Scope
   * Left: Root Hair Micro-Zone, Exudate Carbon Cloud & Bacterial Biofilm Colonization (CFU)
   * Right: 60-Second Multi-Trace Oscilloscope (Density Log CFU, Pi Solubilization, BNF Activity, Rhizo-pH)
   */
  renderRhizosphereMicrobiomeScope(canvas, microData = {}) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = (rect.width > 0 ? rect.width : 780) * dpr;
    const h = (rect.height > 0 ? rect.height : 230) * dpr;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.clearRect(0, 0, w, h);

    // Dark Background Grid
    ctx.fillStyle = "rgba(4, 8, 15, 0.95)";
    ctx.fillRect(0, 0, w, h);

    const midX = w * 0.44;

    // Divider Line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(midX, 10 * dpr);
    ctx.lineTo(midX, h - 10 * dpr);
    ctx.stroke();

    // ==========================================
    // LEFT PANE: Rhizosphere Root & Biofilm Colonization Micro-Diagram
    // ==========================================
    const leftW = midX;
    const rootCenterY = h * 0.52;

    ctx.fillStyle = "#34d399";
    ctx.font = `bold ${13.5 * dpr}px 'Inter', sans-serif`;
    ctx.fillText("① 근권 미생물 군집(PGPR) 공생 & 바이오필름 정착", 14 * dpr, 20 * dpr);

    // 1. Root Epidermis & Cortical Cylinder (Brown/Amber tissue)
    ctx.fillStyle = "rgba(180, 83, 9, 0.25)";
    ctx.fillRect(15 * dpr, rootCenterY - 30 * dpr, 70 * dpr, 60 * dpr);
    ctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
    ctx.lineWidth = 2 * dpr;
    ctx.strokeRect(15 * dpr, rootCenterY - 30 * dpr, 70 * dpr, 60 * dpr);

    ctx.fillStyle = "#fbbf24";
    ctx.font = `bold ${11.5 * dpr}px 'Inter', sans-serif`;
    ctx.fillText("뿌리 표피", 24 * dpr, rootCenterY - 4 * dpr);
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.font = `${9.5 * dpr}px 'Inter', sans-serif`;
    ctx.fillText("Root Cortex", 22 * dpr, rootCenterY + 12 * dpr);

    // 2. Root Hairs Protruding into Soil
    const hairYOffsets = [-22, -8, 8, 22];
    ctx.strokeStyle = "rgba(251, 191, 36, 0.7)";
    ctx.lineWidth = 3 * dpr;
    hairYOffsets.forEach(yOff => {
      ctx.beginPath();
      ctx.moveTo(85 * dpr, rootCenterY + yOff * dpr);
      ctx.bezierCurveTo(120 * dpr, rootCenterY + (yOff - 6) * dpr, 140 * dpr, rootCenterY + (yOff + 6) * dpr, 175 * dpr, rootCenterY + yOff * dpr);
      ctx.stroke();
    });

    // 3. Exudate Carbon Gradient Cloud (Glow around roots)
    const exudateGrad = ctx.createRadialGradient(90 * dpr, rootCenterY, 15 * dpr, 140 * dpr, rootCenterY, 110 * dpr);
    exudateGrad.addColorStop(0.0, "rgba(56, 189, 248, 0.35)");
    exudateGrad.addColorStop(0.5, "rgba(16, 185, 129, 0.2)");
    exudateGrad.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");
    ctx.fillStyle = exudateGrad;
    ctx.fillRect(80 * dpr, rootCenterY - 65 * dpr, 160 * dpr, 130 * dpr);

    // 4. Microbial Colony Cells (Fluorescent green Bacillus rods & Cyan circles)
    const colonizationPct = microData.biofilmColonizationPct || 78.0;
    const numCells = Math.min(65, Math.round((colonizationPct / 100.0) * 55) + 10);

    for (let i = 0; i < numCells; i++) {
      const cx = (100 + (i * 19) % 130 + Math.sin(i * 3.7) * 15) * dpr;
      const cy = (rootCenterY + ((i * 23) % 90 - 45) + Math.cos(i * 2.1) * 8) * dpr;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((i * 45 * Math.PI) / 180);
      ctx.fillStyle = i % 2 === 0 ? "#10b981" : "#34d399";
      ctx.shadowColor = "#34d399";
      ctx.shadowBlur = 6 * dpr;

      // Bacillus Rod shape
      ctx.beginPath();
      ctx.roundRect(-5 * dpr, -2 * dpr, 10 * dpr, 4 * dpr, 2 * dpr);
      ctx.fill();
      ctx.restore();
    }

    // 5. Insoluble Phosphate Chelation Particles (Gold Sparkles)
    for (let p = 0; p < 8; p++) {
      const px = (185 + (p * 22) % 45) * dpr;
      const py = (rootCenterY + ((p * 31) % 80 - 40)) * dpr;
      ctx.fillStyle = "#fbbf24";
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 8 * dpr;
      ctx.beginPath();
      ctx.arc(px, py, 3 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Left Pane Footer Status Badge
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = `bold ${11.5 * dpr}px 'Inter', sans-serif`;
    ctx.fillText(`균주: ${microData.strainName || "Bacillus velezensis"} | 정착도: ${microData.biofilmColonizationPct}%`, 18 * dpr, h - 12 * dpr);

    // ==========================================
    // RIGHT PANE: 60-Second Multi-Trace Oscilloscope
    // ==========================================
    const rightL = midX + 18 * dpr;
    const rightW = w - rightL - 18 * dpr;
    const plotT = 40 * dpr;
    const plotH = h - 72 * dpr;

    ctx.fillStyle = "#fbbf24";
    ctx.font = `bold ${13.5 * dpr}px 'Inter', sans-serif`;
    ctx.fillText("② 60초 생체 반응 스코프 (균밀도 CFU, Pi 가용화, BNF 질소고정)", rightL, 20 * dpr);

    // Horizontal Grid Lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1 * dpr;
    for (let y = plotT; y <= plotT + plotH; y += plotH / 4) {
      ctx.beginPath(); ctx.moveTo(rightL, y); ctx.lineTo(rightL + rightW, y); ctx.stroke();
    }

    // Vertical Time Grid Lines (0s, 15s, 30s, 45s, 60s)
    for (let s = 0; s <= 60; s += 15) {
      const x = rightL + (s / 60.0) * rightW;
      ctx.beginPath(); ctx.moveTo(x, plotT); ctx.lineTo(x, plotT + plotH); ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.font = `bold ${11 * dpr}px 'Inter', sans-serif`;
      ctx.fillText(`${s}s`, x - 8 * dpr, plotT + plotH + 18 * dpr);
    }

    const wavePoints = microData.wavePoints || [];
    if (wavePoints.length > 1) {
      // 1. Plot Microbial Density (CFU Log, Emerald Green)
      ctx.save();
      ctx.strokeStyle = "#10b981";
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 8 * dpr;
      ctx.lineWidth = 2.4 * dpr;
      ctx.beginPath();
      wavePoints.forEach((pt, i) => {
        const x = rightL + (pt.timeSec / 60.0) * rightW;
        // cfuLog ranges 6.0 to 10.0
        const norm = Math.max(0.0, Math.min(1.0, (pt.cfuLog - 6.0) / 4.0));
        const y = plotT + plotH - (norm * plotH);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();

      // 2. Plot Phosphate Solubilization (Gold)
      ctx.save();
      ctx.strokeStyle = "#fbbf24";
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 6 * dpr;
      ctx.lineWidth = 1.8 * dpr;
      ctx.beginPath();
      wavePoints.forEach((pt, i) => {
        const x = rightL + (pt.timeSec / 60.0) * rightW;
        // pi ranges 0 to 12 umol/h
        const norm = Math.max(0.0, Math.min(1.0, pt.piSolubilized / 10.0));
        const y = plotT + plotH - (norm * plotH);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();

      // 3. Plot Biological Nitrogen Fixation BNF (Cyan)
      ctx.save();
      ctx.strokeStyle = "#00f2fe";
      ctx.shadowColor = "#00f2fe";
      ctx.shadowBlur = 6 * dpr;
      ctx.lineWidth = 1.8 * dpr;
      ctx.beginPath();
      wavePoints.forEach((pt, i) => {
        const x = rightL + (pt.timeSec / 60.0) * rightW;
        // bnf ranges 0 to 250 nmol
        const norm = Math.max(0.0, Math.min(1.0, pt.bnfActivity / 220.0));
        const y = plotT + plotH - (norm * plotH);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();

      // Oscilloscope Legend Pills
      ctx.fillStyle = "#10b981";
      ctx.font = `bold ${12 * dpr}px 'Inter', sans-serif`;
      ctx.fillText(`● 균밀도 (${microData.cfuScientific || "4.8×10⁸"})`, rightL + 8 * dpr, plotT + 16 * dpr);

      ctx.fillStyle = "#fbbf24";
      ctx.fillText(`● Pi 가용화 (${microData.phosphateSolubilizedUmolPerHour} μmol/h)`, rightL + 160 * dpr, plotT + 16 * dpr);

      ctx.fillStyle = "#00f2fe";
      ctx.fillText(`● BNF (${microData.nitrogenaseActivityNmol} nmol/h)`, rightL + 330 * dpr, plotT + 16 * dpr);
    }
  }

  /**
   * 20. CRISPR-Cas9 Target Cleavage & Secondary Metabolic Rewiring Dual-Pane Scope
   * Left: CRISPR RNP / sgRNA Cleavage Complex & Metabolic Flux Balance Branch Routing
   * Right: 60-Second Real-Time Multi-Trace Flux Tracer & Predicted HPLC Yield Profile
   */
  renderCrisprMetabolicRewiringScope(canvas, crisprData = {}) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = (rect.width > 0 ? rect.width : 780) * dpr;
    const h = (rect.height > 0 ? rect.height : 230) * dpr;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.clearRect(0, 0, w, h);

    // Dark Background Grid
    ctx.fillStyle = "rgba(4, 8, 15, 0.95)";
    ctx.fillRect(0, 0, w, h);

    const midX = w * 0.45;

    // Divider Line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(midX, 10 * dpr);
    ctx.lineTo(midX, h - 10 * dpr);
    ctx.stroke();

    // ==========================================
    // LEFT PANE: Metabolic Flux Balance Network Diagram
    // ==========================================
    const leftW = midX;
    const cy = h * 0.52;

    ctx.fillStyle = "#a855f7";
    ctx.font = `bold ${13.5 * dpr}px 'Inter', sans-serif`;
    ctx.fillText("① CRISPR-Cas9 대사 분기점 플럭스 밸런스(FBA)", 14 * dpr, 20 * dpr);

    const nodes = crisprData.networkNodes || [];
    if (nodes.length >= 4) {
      // Draw Connecting Flux Arrows / Pipes
      const pNode = nodes[0];
      const sNode = nodes[1];
      const eNode = nodes[2];
      const prodNode = nodes[3];

      const px = pNode.xRatio * leftW;
      const py = pNode.yRatio * h;
      const sx = sNode.xRatio * leftW;
      const sy = sNode.yRatio * h;
      const ex = eNode.xRatio * leftW;
      const ey = eNode.yRatio * h;
      const prodx = prodNode.xRatio * leftW;
      const prody = prodNode.yRatio * h;

      // Pipe 1: Precursor -> Shunt (Dashed or blocked)
      ctx.save();
      ctx.setLineDash(sNode.isBlocked ? [4 * dpr, 4 * dpr] : []);
      ctx.strokeStyle = sNode.isBlocked ? "rgba(239, 68, 68, 0.4)" : "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = sNode.isBlocked ? 2 * dpr : 4 * dpr;
      ctx.beginPath(); ctx.moveTo(px + 35 * dpr, py); ctx.lineTo(sx - 40 * dpr, sy); ctx.stroke();
      ctx.restore();

      // Pipe 2: Precursor -> Target Enzyme (Glowing Thick Path)
      ctx.save();
      ctx.strokeStyle = "rgba(168, 85, 247, 0.85)";
      ctx.shadowColor = "#a855f7";
      ctx.shadowBlur = 10 * dpr;
      ctx.lineWidth = 5 * dpr;
      ctx.beginPath(); ctx.moveTo(px + 35 * dpr, py); ctx.lineTo(ex - 45 * dpr, ey); ctx.stroke();
      ctx.restore();

      // Pipe 3: Enzyme -> High-Yield Product
      ctx.save();
      ctx.strokeStyle = "rgba(251, 191, 36, 0.85)";
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 10 * dpr;
      ctx.lineWidth = 5 * dpr;
      ctx.beginPath(); ctx.moveTo(ex + 45 * dpr, ey); ctx.lineTo(prodx - 45 * dpr, prody); ctx.stroke();
      ctx.restore();

      // Draw Node Cards
      nodes.forEach(n => {
        const nx = n.xRatio * leftW;
        const ny = n.yRatio * h;
        const nw = 85 * dpr;
        const nh = 36 * dpr;

        ctx.fillStyle = n.isBlocked ? "rgba(239, 68, 68, 0.15)" : (n.isTarget ? "rgba(168, 85, 247, 0.2)" : (n.isProduct ? "rgba(251, 191, 36, 0.2)" : "rgba(30, 41, 59, 0.85)"));
        ctx.strokeStyle = n.isBlocked ? "#ef4444" : (n.isTarget ? "#c084fc" : (n.isProduct ? "#fbbf24" : "#38bdf8"));
        ctx.lineWidth = 1.5 * dpr;
        ctx.beginPath();
        ctx.roundRect(nx - nw / 2, ny - nh / 2, nw, nh, 4 * dpr);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#fff";
        ctx.font = `bold ${10.5 * dpr}px 'Inter', sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(n.name.length > 14 ? n.name.slice(0, 13) + ".." : n.name, nx, ny - 2 * dpr);

        ctx.fillStyle = n.isBlocked ? "#f87171" : (n.isProduct ? "#fbbf24" : "#38bdf8");
        ctx.font = `bold ${9 * dpr}px monospace`;
        ctx.fillText(n.isBlocked ? "⛔ FLUX 차단 (0.04x)" : `플럭스: ${n.flux} μmol`, nx, ny + 11 * dpr);
        ctx.textAlign = "left";
      });
    }

    // Left Pane Footer
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = `bold ${11 * dpr}px 'Inter', sans-serif`;
    ctx.fillText(`sgRNA On-Target: ${crisprData.onTargetScore}% | 수율 증폭: +${Math.round((crisprData.yieldMultiplier - 1.0) * 100)}%`, 16 * dpr, h - 12 * dpr);

    // ==========================================
    // RIGHT PANE: 60-Second Multi-Trace Oscilloscope
    // ==========================================
    const rightL = midX + 18 * dpr;
    const rightW = w - rightL - 18 * dpr;
    const plotT = 40 * dpr;
    const plotH = h - 72 * dpr;

    ctx.fillStyle = "#fbbf24";
    ctx.font = `bold ${13.5 * dpr}px 'Inter', sans-serif`;
    ctx.fillText("② 60초 대사 플럭스 재분배 스코프 (Target 물질 vs Byproduct)", rightL, 20 * dpr);

    // Horizontal Grid Lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1 * dpr;
    for (let y = plotT; y <= plotT + plotH; y += plotH / 4) {
      ctx.beginPath(); ctx.moveTo(rightL, y); ctx.lineTo(rightL + rightW, y); ctx.stroke();
    }

    // Vertical Time Grid Lines (0s, 15s, 30s, 45s, 60s)
    for (let s = 0; s <= 60; s += 15) {
      const x = rightL + (s / 60.0) * rightW;
      ctx.beginPath(); ctx.moveTo(x, plotT); ctx.lineTo(x, plotT + plotH); ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.font = `bold ${11 * dpr}px 'Inter', sans-serif`;
      ctx.fillText(`${s}s`, x - 8 * dpr, plotT + plotH + 18 * dpr);
    }

    const wavePoints = crisprData.wavePoints || [];
    if (wavePoints.length > 1) {
      // 1. Plot Target Compound Flux (Gold trace)
      ctx.save();
      ctx.strokeStyle = "#fbbf24";
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 8 * dpr;
      ctx.lineWidth = 2.4 * dpr;
      ctx.beginPath();
      wavePoints.forEach((pt, i) => {
        const x = rightL + (pt.timeSec / 60.0) * rightW;
        // targetFlux ranges 0 to 100
        const norm = Math.max(0.0, Math.min(1.0, pt.targetFlux / 90.0));
        const y = plotT + plotH - (norm * plotH);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();

      // 2. Plot Shunt / Byproduct Flux (Red / Grey trace)
      ctx.save();
      ctx.strokeStyle = "#ef4444";
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 6 * dpr;
      ctx.lineWidth = 1.8 * dpr;
      ctx.beginPath();
      wavePoints.forEach((pt, i) => {
        const x = rightL + (pt.timeSec / 60.0) * rightW;
        // shuntFlux ranges 0 to 60
        const norm = Math.max(0.0, Math.min(1.0, pt.shuntFlux / 90.0));
        const y = plotT + plotH - (norm * plotH);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();

      // 3. Plot Biomass Metabolic Burden Penalty (Purple trace)
      ctx.save();
      ctx.strokeStyle = "#c084fc";
      ctx.shadowColor = "#c084fc";
      ctx.shadowBlur = 6 * dpr;
      ctx.lineWidth = 1.8 * dpr;
      ctx.beginPath();
      wavePoints.forEach((pt, i) => {
        const x = rightL + (pt.timeSec / 60.0) * rightW;
        // burden ranges 0 to 15%
        const norm = Math.max(0.0, Math.min(1.0, pt.biomassLoad / 15.0));
        const y = plotT + plotH - (norm * plotH * 0.5);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();

      // Oscilloscope Legend Pills
      ctx.fillStyle = "#fbbf24";
      ctx.font = `bold ${12 * dpr}px 'Inter', sans-serif`;
      ctx.fillText(`● 타깃 약리 플럭스 (${crisprData.rewiredFluxUmol} μmol)`, rightL + 8 * dpr, plotT + 16 * dpr);

      ctx.fillStyle = "#ef4444";
      ctx.fillText(`● 부산물 플럭스 (${crisprData.editMode === "knockout" ? "3.5" : "38.0"} μmol)`, rightL + 180 * dpr, plotT + 16 * dpr);

      ctx.fillStyle = "#c084fc";
      ctx.fillText(`● 대사 부하 (${crisprData.biomassPenaltyPct}%)`, rightL + 340 * dpr, plotT + 16 * dpr);
    }
  }
}




