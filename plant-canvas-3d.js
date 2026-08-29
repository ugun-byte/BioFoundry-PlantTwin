/**
 * Real-Time 4K 3D Holographic Botanical & Cellular Digital Twin Renderer
 * 
 * Features:
 * 1. Interactive 3D Orbit Camera Controls (Mouse Drag Yaw/Pitch, Wheel Zoom)
 * 2. Dual Inspection Modes:
 *    - [MACRO 3D CHAMBER]: Volumetric LED spectral beams, procedural plant physics, turgor wilting, and golden lutein flowers.
 *    - [MICRO CELLULAR CHOROPLAST]: Stomatal guard cell opening/closing, Calvin cycle CO2 uptake, and Lutein crystalline accumulation.
 * 3. 4K High-DPI Crisp Holographic HUD Overlay & Biometric Bounding Reticles.
 */

export class PlantCanvas3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.time = 0;
    this.viewMode = "macro"; // "macro" or "micro"

    // 3D Camera Controls
    this.camera = {
      yaw: 0.0, // horizontal rotation angle (-0.5 to 0.5)
      pitch: 0.0, // vertical tilt (-0.3 to 0.3)
      zoom: 1.0, // 0.6 to 2.2
      targetYaw: 0.0,
      targetPitch: 0.0,
      targetZoom: 1.0,
      isDragging: false,
      lastMouseX: 0,
      lastMouseY: 0
    };

    this.photonParticles = [];
    this.cellularParticles = [];
    this.initParticles(45);
    this.initCellularParticles(30);

    this.bindCameraEvents();
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 2; // 4K crisp support
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.w = rect.width;
    this.h = rect.height;
  }

  bindCameraEvents() {
    this.canvas.addEventListener("mousedown", (e) => {
      this.camera.isDragging = true;
      this.camera.lastMouseX = e.clientX;
      this.camera.lastMouseY = e.clientY;
    });

    window.addEventListener("mousemove", (e) => {
      if (!this.camera.isDragging) return;
      const dx = e.clientX - this.camera.lastMouseX;
      const dy = e.clientY - this.camera.lastMouseY;
      this.camera.lastMouseX = e.clientX;
      this.camera.lastMouseY = e.clientY;

      this.camera.targetYaw = Math.max(-0.6, Math.min(0.6, this.camera.targetYaw + dx * 0.005));
      this.camera.targetPitch = Math.max(-0.35, Math.min(0.35, this.camera.targetPitch + dy * 0.005));
    });

    window.addEventListener("mouseup", () => {
      this.camera.isDragging = false;
    });

    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * -0.0015;
      this.camera.targetZoom = Math.max(0.6, Math.min(2.5, this.camera.targetZoom + zoomDelta));
    }, { passive: false });
  }

  setViewMode(mode) {
    this.viewMode = mode;
  }

  resetCamera() {
    this.camera.targetYaw = 0.0;
    this.camera.targetPitch = 0.0;
    this.camera.targetZoom = 1.0;
  }

  initParticles(count) {
    this.photonParticles = [];
    for (let i = 0; i < count; i++) {
      this.photonParticles.push({
        x: Math.random() * 500,
        y: Math.random() * 250,
        speed: 1.8 + Math.random() * 2.8,
        wavelength: Math.random() > 0.4 ? "red" : (Math.random() > 0.5 ? "blue" : "gold"),
        size: 1.5 + Math.random() * 2.5
      });
    }
  }

  initCellularParticles(count) {
    this.cellularParticles = [];
    for (let i = 0; i < count; i++) {
      this.cellularParticles.push({
        x: Math.random() * 300,
        y: Math.random() * 300,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        type: Math.random() > 0.5 ? "co2" : "lutein"
      });
    }
  }

  render(plantState, envTelemetry, cropProfile) {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;
    if (!w || !h) return;

    this.time += 0.03;

    // Smooth camera damping
    this.camera.yaw += (this.camera.targetYaw - this.camera.yaw) * 0.1;
    this.camera.pitch += (this.camera.targetPitch - this.camera.pitch) * 0.1;
    this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.1;

    ctx.clearRect(0, 0, w, h);

    if (this.viewMode === "micro") {
      this.renderMicroCellularView(ctx, w, h, plantState, envTelemetry, cropProfile);
    } else {
      this.renderMacro3DChamberView(ctx, w, h, plantState, envTelemetry, cropProfile);
    }

    // 4K Holographic HUD
    this.drawHolographicHUD(ctx, w, h, envTelemetry, plantState, cropProfile);
  }

  renderMacro3DChamberView(ctx, w, h, plantState, envTelemetry, cropProfile) {
    // 1. Deep Futuristic Chamber Backdrop with Cyber Grid
    const bgGrad = ctx.createRadialGradient(w / 2, h * 0.4, 50, w / 2, h * 0.5, w * 0.8);
    bgGrad.addColorStop(0, "#081522");
    bgGrad.addColorStop(0.6, "#04090e");
    bgGrad.addColorStop(1, "#020508");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Dynamic 3D Transform Context
    ctx.save();
    ctx.translate(w / 2, h * 0.85);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.rotate(this.camera.yaw * 0.4);

    const { isLightOn, sensors } = envTelemetry;
    const spectrum = sensors.spectrum;

    // 2. 3D Volumetric LED Light Array
    if (isLightOn && sensors.ppfd > 20) {
      const r = Math.min(255, Math.floor((spectrum.red / 100) * 240 + 30));
      const g = Math.min(255, Math.floor((spectrum.green / 100) * 170 + 20));
      const b = Math.min(255, Math.floor((spectrum.blue / 100) * 255 + 50));

      const beamGrad = ctx.createLinearGradient(0, -h * 0.8, 0, 0);
      const intensity = Math.min(0.42, (sensors.ppfd / 800) * 0.48);
      beamGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${intensity})`);
      beamGrad.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${intensity * 0.2})`);
      beamGrad.addColorStop(1, "rgba(0,0,0,0)");

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(-w * 0.35, -h * 0.78);
      ctx.lineTo(w * 0.35, -h * 0.78);
      ctx.lineTo(w * 0.45, 0);
      ctx.lineTo(-w * 0.45, 0);
      ctx.closePath();
      ctx.fill();
    }

    // Top LED Fixture with Holographic Wings
    ctx.fillStyle = "#11202c";
    ctx.strokeStyle = "rgba(0, 242, 254, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-w * 0.38, -h * 0.82, w * 0.76, 22, 6);
    ctx.fill();
    ctx.stroke();

    // Laser photon diodes
    const diodeCount = 18;
    const diodeStep = (w * 0.7) / diodeCount;
    for (let i = 0; i < diodeCount; i++) {
      const dx = -w * 0.35 + i * diodeStep;
      ctx.fillStyle = isLightOn ? (i % 3 === 0 ? "#00f2fe" : (i % 3 === 1 ? "#ff4757" : "#ffd32a")) : "#1a2c3a";
      ctx.shadowColor = isLightOn ? "#00f2fe" : "transparent";
      ctx.shadowBlur = isLightOn ? 8 : 0;
      ctx.beginPath();
      ctx.arc(dx, -h * 0.82 + 11, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 3. Hydroponic Digital Pod & Aeration Base
    ctx.fillStyle = "#0c1822";
    ctx.strokeStyle = "rgba(56, 239, 125, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-120, -10, 240, 56, [10, 10, 4, 4]);
    ctx.fill();
    ctx.stroke();

    // Glowing Nutrient Solution
    const liqGrad = ctx.createLinearGradient(0, 0, 0, 40);
    liqGrad.addColorStop(0, "rgba(0, 242, 254, 0.25)");
    liqGrad.addColorStop(1, "rgba(0, 140, 220, 0.5)");
    ctx.fillStyle = liqGrad;
    ctx.fillRect(-112, 5, 224, 35);

    // 4. Procedural 3D Plant Model
    this.drawMacroPlant(ctx, plantState, sensors, cropProfile);

    ctx.restore();
  }

  drawMacroPlant(ctx, plantState, sensors, cropProfile) {
    const { dryWeightGrams, luteinConcentration, heightCm, leafCount } = plantState;
    const vpd = sensors.vpd;

    const turgorFactor = vpd > 1.6 ? Math.max(0.35, 1.0 - (vpd - 1.6) * 0.95) : 1.0;
    const scale = Math.min(1.0, 0.15 + (heightCm / 45.0) * 0.85);
    const maxStemH = this.h * 0.56 * scale;

    ctx.save();
    ctx.lineCap = "round";

    // --- Dynamic Roots in Solution ---
    const rootLen = 20 + dryWeightGrams * 4.0;
    ctx.strokeStyle = "rgba(225, 245, 255, 0.65)";
    ctx.lineWidth = 1.4;
    for (let r = -5; r <= 5; r++) {
      ctx.beginPath();
      ctx.moveTo(r * 8, 5);
      ctx.quadraticCurveTo(
        r * 18 + Math.sin(r + this.time) * 4,
        5 + rootLen * 0.5,
        r * 12,
        5 + rootLen
      );
      ctx.stroke();
    }

    // --- Main 3D Stem with dynamic sway ---
    const stemSegments = 7;
    const segH = maxStemH / stemSegments;
    const stemThickness = Math.max(2.8, 3.0 + dryWeightGrams * 0.9);

    ctx.strokeStyle = "#27ae60";
    ctx.lineWidth = stemThickness;

    let curX = 0;
    let curY = 0;
    const nodes = [{ x: 0, y: 0 }];

    for (let i = 1; i <= stemSegments; i++) {
      const sway = Math.sin(i * 0.5 + this.time * 1.4) * (i * 1.5 * scale) + (this.camera.yaw * 30 * i / stemSegments);
      const nextX = sway;
      const nextY = -(i * segH);

      ctx.beginPath();
      ctx.moveTo(curX, curY);
      ctx.lineTo(nextX, nextY);
      ctx.stroke();

      curX = nextX;
      curY = nextY;
      nodes.push({ x: curX, y: curY, index: i });
    }

    // --- Leaves with Lutein Carotenoid Pigmentation ---
    const numTiers = Math.min(nodes.length - 1, Math.floor(1 + leafCount * 0.2));

    for (let tier = 1; tier <= numTiers; tier++) {
      const node = nodes[tier];
      const leafScale = Math.min(1.3, scale * (0.65 + tier * 0.14));
      const droopAngle = (1.0 - turgorFactor) * 0.7;

      this.draw3DLeaf(ctx, node.x, node.y, -1, leafScale, droopAngle, luteinConcentration);
      this.draw3DLeaf(ctx, node.x, node.y, 1, leafScale, droopAngle, luteinConcentration);
    }

    // --- Blooming Golden Marigold Flower / Apical Flower ---
    const topNode = nodes[nodes.length - 1];
    if (dryWeightGrams > 2.2 && cropProfile.id === "marigold_lutein") {
      this.draw3DFlower(ctx, topNode.x, topNode.y, scale, luteinConcentration);
    }

    ctx.restore();
  }

  draw3DLeaf(ctx, x, y, dir, scale, droop, luteinConc) {
    ctx.save();
    const len = 42 * scale;
    const width = 18 * scale;
    const angle = dir > 0 ? (0.6 + droop) - Math.PI / 2 : (-0.6 - droop) - Math.PI / 2;

    ctx.translate(x, y);
    ctx.rotate(angle);

    const luteinRatio = Math.min(1.0, (luteinConc - 2.0) / 3.0);
    const grad = ctx.createRadialGradient(len * 0.45, 0, 1, len * 0.5, 0, len);

    if (luteinRatio > 0.1) {
      grad.addColorStop(0, `rgba(255, 211, 42, ${0.45 + luteinRatio * 0.5})`);
      grad.addColorStop(0.35, "#2ecc71");
      grad.addColorStop(1, "#145a32");
    } else {
      grad.addColorStop(0, "#2ecc71");
      grad.addColorStop(0.65, "#1e824c");
      grad.addColorStop(1, "#0a3d20");
    }

    ctx.fillStyle = grad;
    ctx.strokeStyle = "rgba(0, 242, 254, 0.4)";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(len * 0.3, -width, len * 0.7, -width * 0.8, len, 0);
    ctx.bezierCurveTo(len * 0.7, width * 0.8, len * 0.3, width, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Vein
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len * 0.85, 0);
    ctx.stroke();

    ctx.restore();
  }

  draw3DFlower(ctx, x, y, scale, luteinConc) {
    const radius = Math.min(38, 12 + scale * 26);
    ctx.save();
    ctx.translate(x, y);

    for (let l = 0; l < 4; l++) {
      const r = radius * (0.45 + l * 0.2);
      ctx.fillStyle = l % 2 === 0 ? "#f39c12" : "#ffd32a";
      for (let p = 0; p < 14; p++) {
        const theta = (p / 14) * Math.PI * 2 + (l * 0.22);
        ctx.beginPath();
        ctx.arc(Math.cos(theta) * r, Math.sin(theta) * r, radius * 0.26, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = "#e67e22";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.36, 0, Math.PI * 2);
    ctx.fill();

    // Molecular Halo
    ctx.strokeStyle = "rgba(255, 211, 42, 0.6)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Micro Cellular View: Stomatal Pore & Chloroplast Calvin Cycle
   */
  renderMicroCellularView(ctx, w, h, plantState, envTelemetry, cropProfile) {
    ctx.fillStyle = "#02070c";
    ctx.fillRect(0, 0, w, h);

    const centerX = w / 2;
    const centerY = h / 2;

    // Outer Guard Cells (Kidney-shaped stomata)
    const gsRatio = Math.min(1.0, envTelemetry.sensors.vpd < 1.4 ? 0.85 : 0.2);
    const apertureWidth = 8 + gsRatio * 28;

    // Guard Cell Left
    ctx.fillStyle = "#1e824c";
    ctx.strokeStyle = "#38ef7d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(centerX - 40 - apertureWidth * 0.3, centerY, 55, 95, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Guard Cell Right
    ctx.beginPath();
    ctx.ellipse(centerX + 40 + apertureWidth * 0.3, centerY, 55, 95, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Central Stomatal Aperture Pore
    ctx.fillStyle = "#010406";
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, apertureWidth, 75, 0, 0, Math.PI * 2);
    ctx.fill();

    // Chloroplast Granum & Lutein Crystals inside cell
    for (let g = 0; g < 8; g++) {
      const angle = (g / 8) * Math.PI * 2;
      const gx = centerX + Math.cos(angle) * 110;
      const gy = centerY + Math.sin(angle) * 70;

      // Chloroplast Thylakoid Stacks
      ctx.fillStyle = "#2ecc71";
      ctx.shadowColor = "#38ef7d";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(gx, gy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Lutein Crystals in Chromoplast
      ctx.fillStyle = "#ffd32a";
      ctx.beginPath();
      ctx.arc(gx + 5, gy - 4, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // CO2 molecules floating into pore
    this.cellularParticles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < centerX - 120 || p.x > centerX + 120) p.vx *= -1;
      if (p.y < centerY - 100 || p.y > centerY + 100) p.vy *= -1;

      ctx.fillStyle = p.type === "co2" ? "rgba(0, 242, 254, 0.85)" : "rgba(255, 211, 42, 0.9)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.type === "co2" ? 3 : 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Micro Mode Annotation
    ctx.fillStyle = "#00f2fe";
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🔬 기공 세포(Stomatal Cell) & 엽록체 루테인 결정 실시간 미세 관찰", centerX, 40);

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText(`기공 개폐도: ${(gsRatio * 100).toFixed(0)}% | CO₂ 유입 속도: ${envTelemetry.sensors.co2} ppm | 엽온: ${envTelemetry.sensors.leafTemp}°C`, centerX, 60);
    ctx.textAlign = "left"; // reset
  }

  drawHolographicHUD(ctx, w, h, env, plantState, cropProfile) {
    // Holographic Corner Brackets on Viewport
    ctx.strokeStyle = "rgba(0, 242, 254, 0.5)";
    ctx.lineWidth = 2;

    const bLen = 18;
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(12, 12 + bLen);
    ctx.lineTo(12, 12);
    ctx.lineTo(12 + bLen, 12);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(w - 12 - bLen, 12);
    ctx.lineTo(w - 12, 12);
    ctx.lineTo(w - 12, 12 + bLen);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(12, h - 12 - bLen);
    ctx.lineTo(12, h - 12);
    ctx.lineTo(12 + bLen, h - 12);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(w - 12 - bLen, h - 12);
    ctx.lineTo(w - 12, h - 12);
    ctx.lineTo(w - 12, h - 12 - bLen);
    ctx.stroke();

    // Mode Pill Badge Top Left
    ctx.fillStyle = "rgba(6, 16, 24, 0.9)";
    ctx.strokeStyle = "rgba(0, 242, 254, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(24, 24, 210, 50, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#00f2fe";
    ctx.font = "bold 11px Inter, monospace";
    ctx.fillText(`4K 3D DIGITAL TWIN | ${this.viewMode.toUpperCase()} VIEW`, 36, 42);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px Inter, sans-serif";
    ctx.fillText(`Day ${env.simulatedDay} (${env.timeFormatted})`, 36, 62);
  }
}
