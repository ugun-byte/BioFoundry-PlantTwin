/**
 * Real-time Canvas Analytics & Bio-Charts Module
 * 
 * High-performance vector charts for:
 * 1. Biomass & Dry Weight Accumulation Curve
 * 2. Secondary Metabolite (Lutein) Concentration & Total Yield
 * 3. VPD Gauge & Photosynthetic Efficiency Radar
 */

export class BioAnalyticsCharts {
  constructor(containerElements) {
    this.biomassCanvas = containerElements.biomassCanvas;
    this.luteinCanvas = containerElements.luteinCanvas;
    this.vpdCanvas = containerElements.vpdCanvas;

    this.biomassCtx = this.biomassCanvas.getContext("2d");
    this.luteinCtx = this.luteinCanvas.getContext("2d");
    this.vpdCtx = this.vpdCanvas ? this.vpdCanvas.getContext("2d") : null;

    this.handleResize();
    window.addEventListener("resize", () => this.handleResize());
  }

  handleResize() {
    this.initCanvas(this.biomassCanvas, this.biomassCtx);
    this.initCanvas(this.luteinCanvas, this.luteinCtx);
    if (this.vpdCanvas) this.initCanvas(this.vpdCanvas, this.vpdCtx);
  }

  initCanvas(canvas, ctx) {
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.displayWidth = rect.width;
    canvas.displayHeight = rect.height;
  }

  renderAll(simulationResult, currentDayIndex) {
    this.renderBiomassChart(simulationResult, currentDayIndex);
    this.renderLuteinChart(simulationResult, currentDayIndex);
    if (this.vpdCanvas) this.renderVpdGauge(simulationResult.vpd);
  }

  renderBiomassChart(simResult, currentDay) {
    const ctx = this.biomassCtx;
    const canvas = this.biomassCanvas;
    const w = canvas.displayWidth;
    const h = canvas.displayHeight;
    const timeline = simResult.timeline;

    ctx.clearRect(0, 0, w, h);

    // Padding
    const padL = 40;
    const padR = 20;
    const padT = 25;
    const padB = 30;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    // Max values
    const maxDay = timeline.length;
    const maxFw = Math.max(10, Math.ceil(timeline[timeline.length - 1].freshWeight * 1.15));

    // Background grid
    ctx.strokeStyle = "rgba(0, 242, 254, 0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();

      // Y-axis labels (Fresh Weight in grams)
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "10px Inter, sans-serif";
      const val = Math.round(maxFw - (maxFw / 4) * i);
      ctx.fillText(`${val}g`, 10, y + 3);
    }

    // X-axis Day labels
    for (let d = 0; d <= maxDay; d += 10) {
      const x = padL + (plotW / maxDay) * d;
      ctx.fillText(`D${d}`, x - 8, h - 10);
    }

    // Draw Fresh Weight (FW) Line
    ctx.strokeStyle = "#38ef7d";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    timeline.forEach((pt, idx) => {
      const x = padL + (plotW / (maxDay - 1)) * idx;
      const y = padT + plotH - (pt.freshWeight / maxFw) * plotH;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Area Fill
    ctx.fillStyle = "rgba(56, 239, 125, 0.12)";
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.lineTo(padL, padT + plotH);
    ctx.closePath();
    ctx.fill();

    // Current Day Cursor & Dot
    const currentPt = timeline[Math.min(timeline.length - 1, currentDay - 1)];
    if (currentPt) {
      const curX = padL + (plotW / (maxDay - 1)) * (currentDay - 1);
      const curY = padT + plotH - (currentPt.freshWeight / maxFw) * plotH;

      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(curX, padT);
      ctx.lineTo(curX, padT + plotH);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#38ef7d";
      ctx.shadowColor = "#38ef7d";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(curX, curY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Tooltip tag
      ctx.fillStyle = "#0c202d";
      ctx.fillRect(curX - 35, curY - 26, 70, 20);
      ctx.strokeStyle = "#38ef7d";
      ctx.strokeRect(curX - 35, curY - 26, 70, 20);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px Inter, sans-serif";
      ctx.fillText(`${currentPt.freshWeight}g FW`, curX - 26, curY - 12);
    }
  }

  renderLuteinChart(simResult, currentDay) {
    const ctx = this.luteinCtx;
    const canvas = this.luteinCanvas;
    const w = canvas.displayWidth;
    const h = canvas.displayHeight;
    const timeline = simResult.timeline;

    ctx.clearRect(0, 0, w, h);

    const padL = 45;
    const padR = 20;
    const padT = 25;
    const padB = 30;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const maxDay = timeline.length;
    const maxLutein = Math.max(5.0, Math.ceil(timeline[timeline.length - 1].totalLuteinMg * 1.2));

    // Background grid
    ctx.strokeStyle = "rgba(241, 196, 15, 0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "10px Inter, sans-serif";
      const val = (maxLutein - (maxLutein / 4) * i).toFixed(1);
      ctx.fillText(`${val}mg`, 8, y + 3);
    }

    // X-axis Day labels
    for (let d = 0; d <= maxDay; d += 10) {
      const x = padL + (plotW / maxDay) * d;
      ctx.fillText(`D${d}`, x - 8, h - 10);
    }

    // Highlight Elicitation phase (final 7 days)
    const elicitationStartDay = maxDay - 7;
    const elicitX = padL + (plotW / (maxDay - 1)) * elicitationStartDay;
    ctx.fillStyle = "rgba(241, 196, 15, 0.06)";
    ctx.fillRect(elicitX, padT, w - padR - elicitX, plotH);
    ctx.fillStyle = "#f1c40f";
    ctx.font = "9px Inter, sans-serif";
    ctx.fillText("⚡ UV-B 분자 유도합성", elicitX + 6, padT + 14);

    // Draw Total Lutein Yield Line (Gold #f1c40f)
    ctx.strokeStyle = "#f1c40f";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    timeline.forEach((pt, idx) => {
      const x = padL + (plotW / (maxDay - 1)) * idx;
      const y = padT + plotH - (pt.totalLuteinMg / maxLutein) * plotH;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Area Fill Golden Glow
    const luteinGrad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    luteinGrad.addColorStop(0, "rgba(241, 196, 15, 0.3)");
    luteinGrad.addColorStop(1, "rgba(241, 196, 15, 0.02)");
    ctx.fillStyle = luteinGrad;
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.lineTo(padL, padT + plotH);
    ctx.closePath();
    ctx.fill();

    // Current Day Dot
    const currentPt = timeline[Math.min(timeline.length - 1, currentDay - 1)];
    if (currentPt) {
      const curX = padL + (plotW / (maxDay - 1)) * (currentDay - 1);
      const curY = padT + plotH - (currentPt.totalLuteinMg / maxLutein) * plotH;

      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(curX, padT);
      ctx.lineTo(curX, padT + plotH);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#f1c40f";
      ctx.shadowColor = "#f1c40f";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(curX, curY, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Tooltip tag
      ctx.fillStyle = "#1e1b0c";
      ctx.fillRect(curX - 45, curY - 26, 90, 20);
      ctx.strokeStyle = "#f1c40f";
      ctx.strokeRect(curX - 45, curY - 26, 90, 20);
      ctx.fillStyle = "#f1c40f";
      ctx.font = "bold 10px Inter, sans-serif";
      ctx.fillText(`${currentPt.totalLuteinMg}mg (${currentPt.luteinConcMgPerG}mg/g)`, curX - 40, curY - 12);
    }
  }

  renderVpdGauge(vpdData) {
    if (!this.vpdCtx) return;
    const ctx = this.vpdCtx;
    const w = this.vpdCanvas.displayWidth;
    const h = this.vpdCanvas.displayHeight;

    ctx.clearRect(0, 0, w, h);

    const centerX = w / 2;
    const centerY = h * 0.82;
    const radius = Math.min(w * 0.38, 70);

    // Gauge Arc (0.0 to 2.0 kPa)
    const startAngle = Math.PI * 0.8;
    const endAngle = Math.PI * 2.2;
    const totalAngle = endAngle - startAngle;

    // Draw background track
    ctx.strokeStyle = "#16232e";
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.stroke();

    // Draw Optimal Zone (0.8 ~ 1.2 kPa)
    const optStart = startAngle + (0.8 / 2.0) * totalAngle;
    const optEnd = startAngle + (1.2 / 2.0) * totalAngle;
    ctx.strokeStyle = "rgba(46, 204, 113, 0.4)";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, optStart, optEnd);
    ctx.stroke();

    // Value Arc
    const currentVpd = Math.min(2.0, Math.max(0.0, vpdData.vpd));
    const currentAngle = startAngle + (currentVpd / 2.0) * totalAngle;

    const valueGrad = ctx.createLinearGradient(0, centerY - radius, 0, centerY);
    valueGrad.addColorStop(0, currentVpd <= 1.2 && currentVpd >= 0.8 ? "#2ecc71" : "#f39c12");
    valueGrad.addColorStop(1, "#00f2fe");

    ctx.strokeStyle = valueGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, currentAngle);
    ctx.stroke();

    // Center text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${vpdData.vpd} kPa`, centerX, centerY - 14);

    ctx.fillStyle = currentVpd >= 0.8 && currentVpd <= 1.2 ? "#2ecc71" : "#f39c12";
    ctx.font = "bold 10px Inter, sans-serif";
    ctx.fillText(vpdData.status, centerX, centerY + 5);
  }
}
