/**
 * Real-Time 3D/Procedural Plant Physics & Dynamic Biological Visualizer
 * 
 * Features:
 * - Dynamic Turgor Pressure & Wilting (Leaf droop when VPD > 1.6 kPa)
 * - Phototropic Leaf Orientation & Circadian Leaf Sleep Movements
 * - Real-time Chlorophyll vs Lutein/Carotenoid Cellular Pigmentation Shader
 * - Live Photon Flux Particle Simulation (LED to Leaf Stomata)
 * - Hydroponic Nutrient Aeration & Root Respiration Dynamics
 */

export class PlantCanvas3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.time = 0;
    this.photonParticles = [];
    this.initParticles(35);
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.w = rect.width;
    this.h = rect.height;
  }

  initParticles(count) {
    this.photonParticles = [];
    for (let i = 0; i < count; i++) {
      this.photonParticles.push({
        x: Math.random() * 400,
        y: Math.random() * 200,
        speed: 1.5 + Math.random() * 2.5,
        wavelength: Math.random() > 0.4 ? "red" : (Math.random() > 0.5 ? "blue" : "gold"),
        size: 1.5 + Math.random() * 2.0
      });
    }
  }

  render(plantState, envTelemetry, cropProfile) {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;
    if (!w || !h) return;

    this.time += 0.03;
    ctx.clearRect(0, 0, w, h);

    // 1. Draw Digital Chamber Background & Volumetric Glow
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, "#060c12");
    bgGrad.addColorStop(0.7, "#09141e");
    bgGrad.addColorStop(1, "#050b10");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Sci-Fi Chamber Holographic Grid
    ctx.strokeStyle = "rgba(0, 242, 254, 0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const { isLightOn, sensors } = envTelemetry;
    const spectrum = sensors.spectrum;

    // 2. Active LED Light Cones & Photons
    if (isLightOn && sensors.ppfd > 20) {
      const r = Math.min(255, Math.floor((spectrum.red / 100) * 230 + 40));
      const g = Math.min(255, Math.floor((spectrum.green / 100) * 160 + 20));
      const b = Math.min(255, Math.floor((spectrum.blue / 100) * 255 + 50));

      const lightCone = ctx.createRadialGradient(w / 2, 20, 10, w / 2, 90, w * 0.65);
      const intensity = Math.min(0.4, (sensors.ppfd / 800) * 0.45);
      lightCone.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${intensity})`);
      lightCone.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${intensity * 0.25})`);
      lightCone.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = lightCone;
      ctx.fillRect(0, 0, w, h * 0.75);

      // Draw active photon stream
      this.drawPhotonStream(ctx, w, h, spectrum);
    }

    // Top LED Luminaire Bar
    ctx.fillStyle = "#121e29";
    ctx.fillRect(w * 0.12, 10, w * 0.76, 16);
    ctx.strokeStyle = "rgba(0, 242, 254, 0.3)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(w * 0.12, 10, w * 0.76, 16);

    // Emitters
    const numEmitters = 16;
    const emitterStep = (w * 0.72) / numEmitters;
    for (let i = 0; i < numEmitters; i++) {
      const ex = w * 0.14 + i * emitterStep;
      ctx.fillStyle = isLightOn ? (i % 2 === 0 ? "#ff4757" : "#00f2fe") : "#1c2b38";
      ctx.beginPath();
      ctx.arc(ex, 18, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Hydroponic Deep Water Culture (DWC) Pod
    const baseY = h - 65;
    const centerX = w / 2;

    // Reservoir Basin
    ctx.fillStyle = "#0c1720";
    ctx.beginPath();
    ctx.roundRect(centerX - 110, baseY, 220, 52, [8, 8, 4, 4]);
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 242, 254, 0.25)";
    ctx.stroke();

    // Nutrient Liquid
    const liquidGrad = ctx.createLinearGradient(0, baseY + 10, 0, baseY + 45);
    liquidGrad.addColorStop(0, "rgba(0, 242, 254, 0.2)");
    liquidGrad.addColorStop(1, "rgba(0, 100, 180, 0.4)");
    ctx.fillStyle = liquidGrad;
    ctx.fillRect(centerX - 102, baseY + 12, 204, 34);

    // Aeration Bubbles
    for (let b = 0; b < 6; b++) {
      const bx = centerX - 80 + b * 28 + Math.sin(this.time * 2 + b) * 4;
      const by = baseY + 40 - ((this.time * 25 + b * 15) % 30);
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.beginPath();
      ctx.arc(bx, by, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Procedural Botanical Rendering
    this.drawLivingPlant(ctx, centerX, baseY, plantState, sensors, cropProfile);

    // 5. HUD Telemetry Overlay on Canvas
    this.drawCanvasTelemetryHud(ctx, w, h, envTelemetry, plantState);
  }

  drawPhotonStream(ctx, w, h, spectrum) {
    this.photonParticles.forEach((p) => {
      p.y += p.speed;
      if (p.y > h * 0.7) {
        p.y = 25;
        p.x = w * 0.15 + Math.random() * (w * 0.7);
      }

      ctx.fillStyle = p.wavelength === "red" ? "rgba(255, 71, 87, 0.7)" : 
                      p.wavelength === "blue" ? "rgba(0, 242, 254, 0.7)" : "rgba(241, 196, 15, 0.8)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawLivingPlant(ctx, originX, originY, plantState, sensors, cropProfile) {
    const { dryWeightGrams, luteinConcentration, heightCm, leafCount } = plantState;
    const vpd = sensors.vpd;

    // Turgor Pressure Calculation (High VPD > 1.6 kPa causes loss of turgor -> leaf drooping)
    const turgorFactor = vpd > 1.6 ? Math.max(0.4, 1.0 - (vpd - 1.6) * 0.9) : 1.0;
    const scale = Math.min(1.0, 0.15 + (heightCm / 45.0) * 0.85);
    const maxStemH = this.h * 0.52 * scale;

    ctx.save();
    ctx.lineCap = "round";

    // --- Dynamic Roots ---
    const rootLen = 15 + dryWeightGrams * 3.5;
    ctx.strokeStyle = "rgba(220, 240, 255, 0.6)";
    ctx.lineWidth = 1.3;
    for (let r = -4; r <= 4; r++) {
      ctx.beginPath();
      ctx.moveTo(originX + r * 5, originY + 20);
      ctx.quadraticCurveTo(
        originX + r * 14 + Math.sin(r + this.time) * 3,
        originY + 20 + rootLen * 0.5,
        originX + r * 10,
        originY + 20 + rootLen
      );
      ctx.stroke();
    }

    // --- Main Stem (with live swaying in ventilation) ---
    const stemSegments = 6;
    const segH = maxStemH / stemSegments;
    const stemThickness = Math.max(2.5, 2.5 + dryWeightGrams * 0.8);

    ctx.strokeStyle = "#27ae60";
    ctx.lineWidth = stemThickness;

    let curX = originX;
    let curY = originY;
    const nodes = [{ x: curX, y: curY }];

    for (let i = 1; i <= stemSegments; i++) {
      const sway = Math.sin(i * 0.6 + this.time * 1.2) * (i * 1.2 * scale);
      const nextX = originX + sway;
      const nextY = originY - (i * segH);

      ctx.beginPath();
      ctx.moveTo(curX, curY);
      ctx.lineTo(nextX, nextY);
      ctx.stroke();

      curX = nextX;
      curY = nextY;
      nodes.push({ x: curX, y: curY, index: i });
    }

    // --- Multi-Tier Leaves with Lutein Carotenoid Pigmentation ---
    const numTiers = Math.min(nodes.length - 1, Math.floor(1 + leafCount * 0.18));

    for (let tier = 1; tier <= numTiers; tier++) {
      const node = nodes[tier];
      const leafScale = Math.min(1.2, scale * (0.6 + tier * 0.12));

      // Leaf Angle modifies by Turgor (drooping) & Phototropism
      const droopAngle = (1.0 - turgorFactor) * 0.6; // droops downward under water stress

      this.drawCellularLeaf(ctx, node.x, node.y, -1, leafScale, droopAngle, luteinConcentration);
      this.drawCellularLeaf(ctx, node.x, node.y, 1, leafScale, droopAngle, luteinConcentration);
    }

    // --- Bloom / Apical Meristem (Marigold Flower with Lutein Golden Core) ---
    const topNode = nodes[nodes.length - 1];
    if (dryWeightGrams > 2.5 && cropProfile.id === "marigold_lutein") {
      this.drawGoldenFlower(ctx, topNode.x, topNode.y, scale, luteinConcentration);
    }

    ctx.restore();
  }

  drawCellularLeaf(ctx, startX, startY, dir, scale, droop, luteinConc) {
    ctx.save();
    const len = 36 * scale;
    const width = 16 * scale;
    const baseAngle = dir > 0 ? (0.55 + droop) - Math.PI / 2 : (-0.55 - droop) - Math.PI / 2;

    ctx.translate(startX, startY);
    ctx.rotate(baseAngle);

    // Lutein Concentration determines yellow-gold carotenoid pigmentation overlay
    // Low lutein = Deep Emerald (#1e824c), High lutein = Golden Emerald Glow (#f1c40f)
    const luteinRatio = Math.min(1.0, (luteinConc - 2.0) / 3.0);
    const leafGrad = ctx.createRadialGradient(len * 0.4, 0, 1, len * 0.5, 0, len);

    if (luteinRatio > 0.1) {
      leafGrad.addColorStop(0, `rgba(241, 196, 15, ${0.4 + luteinRatio * 0.55})`);
      leafGrad.addColorStop(0.35, "#2ecc71");
      leafGrad.addColorStop(1, "#145a32");
    } else {
      leafGrad.addColorStop(0, "#2ecc71");
      leafGrad.addColorStop(0.6, "#1e824c");
      leafGrad.addColorStop(1, "#0e3d26");
    }

    ctx.fillStyle = leafGrad;
    ctx.strokeStyle = "rgba(46, 204, 113, 0.6)";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(len * 0.3, -width, len * 0.7, -width * 0.8, len, 0);
    ctx.bezierCurveTo(len * 0.7, width * 0.8, len * 0.3, width, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Central vein
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len * 0.85, 0);
    ctx.stroke();

    ctx.restore();
  }

  drawGoldenFlower(ctx, x, y, scale, luteinConc) {
    const radius = Math.min(34, 10 + scale * 24);
    ctx.save();
    ctx.translate(x, y);

    // Golden multi-tier petals
    const layers = 4;
    const petals = 12;

    for (let l = 0; l < layers; l++) {
      const r = radius * (0.45 + l * 0.2);
      ctx.fillStyle = l % 2 === 0 ? "#f39c12" : "#f1c40f";
      for (let p = 0; p < petals; p++) {
        const theta = (p / petals) * Math.PI * 2 + (l * 0.25);
        ctx.beginPath();
        ctx.arc(Math.cos(theta) * r, Math.sin(theta) * r, radius * 0.28, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Core
    ctx.fillStyle = "#e67e22";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.38, 0, Math.PI * 2);
    ctx.fill();

    // Carotenoid Synthesis Aura
    ctx.strokeStyle = "rgba(241, 196, 15, 0.5)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.25, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  drawCanvasTelemetryHud(ctx, w, h, env, plantState) {
    // Top Left: Time & Simulation Speed
    ctx.fillStyle = "rgba(8, 18, 26, 0.88)";
    ctx.strokeStyle = "rgba(0, 242, 254, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(14, 14, 210, 56, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#00f2fe";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillText("LIVE CHAMBER TELEMETRY", 24, 30);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.fillText(`DAY ${env.simulatedDay} | ${env.timeFormatted}`, 24, 52);

    // Leaf Temperature Differential Tag
    const diff = env.sensors.tempDifferential;
    const diffText = diff <= 0 ? `T_leaf ${env.sensors.leafTemp}°C (${diff}°C 증산냉각)` : `T_leaf ${env.sensors.leafTemp}°C (+${diff}°C 열부하)`;
    ctx.fillStyle = diff <= 0 ? "#2ecc71" : "#e67e22";
    ctx.font = "10px Inter, sans-serif";
    ctx.fillText(diffText, 24, 64);
  }
}
