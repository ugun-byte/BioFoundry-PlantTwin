/**
 * Procedural Plant & Molecular Pigmentation Canvas Renderer
 * 
 * Renders realistic plant growth morphology from Day 1 to Day 45:
 * - Hydroponic chamber & LED spectrum lighting glow
 * - Dynamic botanical branching, stem thickening, leaf expansion
 * - Molecular lutein/carotenoid pigmentation density
 * - Flower bud and blooming stage
 * - Real-time environmental particle effects
 */

export class PlantCanvasRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext("2d");
    this.animationFrameId = null;
    this.currentDay = 1;
    this.maxDay = 45;
    this.cropType = "marigold_lutein";
    this.spectrum = { red: 55, blue: 30, green: 10, farRed: 5 };
    this.uvbActive = false;
    this.luteinDensity = 1.0; // multiplier
    this.particleTime = 0;

    // Handle high DPI displays
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.displayWidth = rect.width;
    this.displayHeight = rect.height;
    this.render();
  }

  updateState(state) {
    if (state.currentDay !== undefined) this.currentDay = state.currentDay;
    if (state.maxDay !== undefined) this.maxDay = state.maxDay;
    if (state.cropType !== undefined) this.cropType = state.cropType;
    if (state.spectrum !== undefined) this.spectrum = state.spectrum;
    if (state.uvbActive !== undefined) this.uvbActive = state.uvbActive;
    if (state.luteinDensity !== undefined) this.luteinDensity = state.luteinDensity;
    this.render();
  }

  getSpectrumLightColor() {
    // Blend RGB + Far-Red into chamber lighting tint
    const r = Math.min(255, Math.floor((this.spectrum.red / 100) * 230 + (this.spectrum.farRed / 100) * 120 + 40));
    const g = Math.min(255, Math.floor((this.spectrum.green / 100) * 180 + 30));
    const b = Math.min(255, Math.floor((this.spectrum.blue / 100) * 255 + 50));
    return { r, g, b };
  }

  render() {
    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Hydroponic Chamber Background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, h);
    bgGradient.addColorStop(0, "#081017");
    bgGradient.addColorStop(0.7, "#0b151e");
    bgGradient.addColorStop(1, "#070e14");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, w, h);

    // Chamber Grid lines (Digital Twin feel)
    ctx.strokeStyle = "rgba(0, 242, 254, 0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 2. Draw Top LED Grow Light Bar with active Spectrum Glow
    const lightColor = this.getSpectrumLightColor();
    const ledGlow = ctx.createRadialGradient(w / 2, 20, 10, w / 2, 80, w * 0.6);
    ledGlow.addColorStop(0, `rgba(${lightColor.r}, ${lightColor.g}, ${lightColor.b}, 0.28)`);
    ledGlow.addColorStop(0.6, `rgba(${lightColor.r}, ${lightColor.g}, ${lightColor.b}, 0.08)`);
    ledGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = ledGlow;
    ctx.fillRect(0, 0, w, h * 0.7);

    // Physical LED Fixture
    ctx.fillStyle = "#16232e";
    ctx.fillRect(w * 0.15, 12, w * 0.7, 14);
    ctx.strokeStyle = "#00f2fe33";
    ctx.strokeRect(w * 0.15, 12, w * 0.7, 14);

    // LED emitter diodes
    const diodeCount = 14;
    const diodeSpacing = (w * 0.66) / diodeCount;
    for (let i = 0; i < diodeCount; i++) {
      const dx = w * 0.17 + i * diodeSpacing;
      ctx.fillStyle = `rgb(${lightColor.r}, ${lightColor.g}, ${lightColor.b})`;
      ctx.beginPath();
      ctx.arc(dx, 19, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // UV-B Tube Glow (if active)
    if (this.uvbActive) {
      ctx.fillStyle = "rgba(180, 70, 255, 0.4)";
      ctx.fillRect(w * 0.2, 28, w * 0.6, 4);
      ctx.shadowColor = "#b446ff";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "rgba(220, 140, 255, 0.9)";
      ctx.fillRect(w * 0.22, 29, w * 0.56, 2);
      ctx.shadowBlur = 0; // reset
    }

    // 3. Draw Hydroponic Pod & Substrate
    const baseY = h - 65;
    const centerX = w / 2;

    // Nutrient Reservoir Base
    ctx.fillStyle = "#0d1b24";
    ctx.beginPath();
    ctx.roundRect(centerX - 110, baseY, 220, 50, [10, 10, 4, 4]);
    ctx.fill();
    ctx.strokeStyle = "#00f2fe44";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Liquid Level & Bubbles
    const waterGrad = ctx.createLinearGradient(0, baseY + 10, 0, baseY + 45);
    waterGrad.addColorStop(0, "rgba(0, 242, 254, 0.15)");
    waterGrad.addColorStop(1, "rgba(0, 120, 200, 0.35)");
    ctx.fillStyle = waterGrad;
    ctx.fillRect(centerX - 100, baseY + 12, 200, 32);

    // Growing Net Pot
    ctx.fillStyle = "#1e2e3b";
    ctx.beginPath();
    ctx.moveTo(centerX - 35, baseY);
    ctx.lineTo(centerX + 35, baseY);
    ctx.lineTo(centerX + 26, baseY + 28);
    ctx.lineTo(centerX - 26, baseY + 28);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#38ef7d66";
    ctx.stroke();

    // 4. Procedural Plant Growth Geometry
    const growthProgress = Math.min(1.0, this.currentDay / this.maxDay);
    this.drawPlant(ctx, centerX, baseY, growthProgress);

    // 5. Molecular Carotenoid / Lutein Elicitation Particles
    this.drawMolecularParticles(ctx, centerX, baseY, growthProgress);

    // 6. Draw HUD Badge on Canvas
    this.drawHudOverlay(ctx, w, h);
  }

  drawPlant(ctx, originX, originY, progress) {
    // Growth stages: Seedling (0~0.2) -> Vegetative (0.2~0.6) -> Maturation/Flower (0.6~1.0)
    const scale = 0.2 + progress * 0.8;
    const maxStemHeight = this.displayHeight * 0.48 * scale;
    const stemSegments = 5;
    const segmentHeight = maxStemHeight / stemSegments;

    // Stem base color (healthy green with subtle lutein golden gradient in late stage)
    const stemColor = progress > 0.7 
      ? `rgb(${Math.floor(50 + progress * 40)}, ${Math.floor(180 - progress * 30)}, 60)` 
      : "#27ae60";

    ctx.save();
    ctx.lineCap = "round";

    // --- Draw Roots underwater ---
    const rootLength = 12 + progress * 24;
    ctx.strokeStyle = "rgba(230, 240, 255, 0.55)";
    ctx.lineWidth = 1.2;
    for (let r = -3; r <= 3; r++) {
      ctx.beginPath();
      ctx.moveTo(originX + r * 6, originY + 25);
      ctx.quadraticCurveTo(
        originX + r * 16 + Math.sin(r + this.particleTime) * 4,
        originY + 25 + rootLength * 0.6,
        originX + r * 12,
        originY + 25 + rootLength
      );
      ctx.stroke();
    }

    // --- Draw Main Stem ---
    ctx.strokeStyle = stemColor;
    ctx.lineWidth = Math.max(2, 2.5 + progress * 6.5);

    let currentX = originX;
    let currentY = originY;

    const stemPoints = [{ x: currentX, y: currentY }];

    for (let i = 1; i <= stemSegments; i++) {
      const sway = Math.sin(i * 0.7 + this.particleTime * 0.05) * (i * 1.5 * progress);
      const targetY = originY - (i * segmentHeight);
      const targetX = originX + sway;

      ctx.beginPath();
      ctx.moveTo(currentX, currentY);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();

      currentX = targetX;
      currentY = targetY;
      stemPoints.push({ x: currentX, y: currentY, index: i });
    }

    // --- Draw Leaves at Nodes ---
    const totalLeafTiers = Math.min(6, Math.floor(1 + progress * 6));

    for (let tier = 1; tier < stemPoints.length; tier++) {
      if (tier > totalLeafTiers) break;
      const pt = stemPoints[tier];
      const leafScale = Math.min(1.0, (progress * 1.5) - (tier * 0.12));

      if (leafScale > 0.05) {
        // Left & Right leaf pair
        this.drawLeaf(ctx, pt.x, pt.y, -1, leafScale, tier, progress);
        this.drawLeaf(ctx, pt.x, pt.y, 1, leafScale, tier, progress);
      }
    }

    // --- Draw Top Crown / Flowers (Marigold Golden Flower or Canopy) ---
    const topPt = stemPoints[stemPoints.length - 1];
    if (progress > 0.35) {
      if (this.cropType === "marigold_lutein") {
        this.drawMarigoldFlower(ctx, topPt.x, topPt.y, (progress - 0.35) / 0.65);
      } else {
        // Top apical rosette for leafy greens
        this.drawLeaf(ctx, topPt.x, topPt.y, 0, (progress - 0.2) * 1.2, 5, progress);
      }
    }

    ctx.restore();
  }

  drawLeaf(ctx, startX, startY, direction, scale, tier, totalProgress) {
    ctx.save();
    const leafLen = (28 + tier * 8) * scale;
    const leafWidth = (14 + tier * 5) * scale;
    const angle = (direction === 0 ? -Math.PI / 2 : (direction * 0.65) - Math.PI / 2);

    ctx.translate(startX, startY);
    ctx.rotate(angle);

    // Leaf Color: Blends Chlorophyll Emerald (#11998e) with Lutein Gold (#f39c12)
    // High lutein density shifts leaf highlight to vibrant golden-emerald
    const luteinGlow = Math.min(1.0, (this.luteinDensity - 1.0) / 1.5);
    const leafGrad = ctx.createRadialGradient(leafLen * 0.4, 0, 2, leafLen * 0.5, 0, leafLen);
    
    if (luteinGlow > 0.2) {
      leafGrad.addColorStop(0, `rgba(241, 196, 15, ${0.4 + luteinGlow * 0.5})`); // Lutein golden core
      leafGrad.addColorStop(0.4, "#2ecc71");
      leafGrad.addColorStop(1, "#1b4d3e");
    } else {
      leafGrad.addColorStop(0, "#2ecc71");
      leafGrad.addColorStop(0.7, "#1e824c");
      leafGrad.addColorStop(1, "#0e3d26");
    }

    ctx.fillStyle = leafGrad;
    ctx.strokeStyle = "rgba(46, 204, 113, 0.6)";
    ctx.lineWidth = 1;

    // Bezier leaf shape
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(leafLen * 0.3, -leafWidth, leafLen * 0.7, -leafWidth * 0.8, leafLen, 0);
    ctx.bezierCurveTo(leafLen * 0.7, leafWidth * 0.8, leafLen * 0.3, leafWidth, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Central leaf vein
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(leafLen * 0.85, 0);
    ctx.stroke();

    ctx.restore();
  }

  drawMarigoldFlower(ctx, x, y, flowerProgress) {
    const radius = Math.min(32, 6 + flowerProgress * 26);
    ctx.save();
    ctx.translate(x, y);

    // Flower Receptacle (Calyx green base)
    ctx.fillStyle = "#1e824c";
    ctx.beginPath();
    ctx.arc(0, 6, radius * 0.35, 0, Math.PI);
    ctx.fill();

    // Multi-layer Lutein Golden Petals (Marigold)
    const layers = Math.min(4, Math.floor(1 + flowerProgress * 3));
    const petalsPerLayer = 12;

    for (let l = 0; l < layers; l++) {
      const layerRadius = radius * (0.45 + (l * 0.2));
      const petalColor = l % 2 === 0 ? "#f39c12" : "#e67e22";
      const highlight = l === layers - 1 ? "#f1c40f" : petalColor;

      ctx.fillStyle = highlight;
      for (let p = 0; p < petalsPerLayer; p++) {
        const theta = (p / petalsPerLayer) * Math.PI * 2 + (l * 0.25);
        const px = Math.cos(theta) * layerRadius;
        const py = Math.sin(theta) * layerRadius;

        ctx.beginPath();
        ctx.arc(px, py, radius * 0.28, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Flower Golden Core (High Lutein Density Center)
    const coreGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, radius * 0.4);
    coreGrad.addColorStop(0, "#f1c40f");
    coreGrad.addColorStop(0.7, "#e67e22");
    coreGrad.addColorStop(1, "#d35400");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Molecular synthesis glow ring
    ctx.strokeStyle = "rgba(241, 196, 15, 0.45)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  drawMolecularParticles(ctx, originX, originY, progress) {
    this.particleTime += 0.04;
    const count = Math.floor(10 + this.luteinDensity * 12);
    const plantHeight = this.displayHeight * 0.45 * progress;

    ctx.save();
    for (let i = 0; i < count; i++) {
      const seed = i * 137.5;
      const py = originY - (Math.sin(this.particleTime * 0.6 + seed) * 0.5 + 0.5) * plantHeight;
      const px = originX + Math.cos(this.particleTime * 0.8 + seed) * (30 + progress * 50);
      const alpha = 0.2 + (Math.sin(this.particleTime * 2 + seed) * 0.5 + 0.5) * 0.6;
      const size = 1.5 + Math.sin(seed) * 1.5;

      // Golden Lutein / Cyan Photosynthetic energy particle
      ctx.fillStyle = i % 3 === 0 ? `rgba(241, 196, 15, ${alpha})` : `rgba(0, 242, 254, ${alpha * 0.8})`;
      ctx.shadowColor = "#f1c40f";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawHudOverlay(ctx, w, h) {
    // HUD Top Left Badge
    ctx.fillStyle = "rgba(10, 24, 34, 0.85)";
    ctx.strokeStyle = "rgba(0, 242, 254, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(16, 16, 195, 52, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#00f2fe";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillText("DIGITAL TWIN CANOPY", 26, 32);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px Inter, sans-serif";
    ctx.fillText(`DAY ${this.currentDay} / ${this.maxDay}`, 26, 54);

    // Live Molecular Status Pill
    const isElicited = this.uvbActive || this.luteinDensity > 1.8;
    ctx.fillStyle = isElicited ? "rgba(241, 196, 15, 0.2)" : "rgba(46, 204, 113, 0.2)";
    ctx.strokeStyle = isElicited ? "#f1c40f" : "#2ecc71";
    ctx.beginPath();
    ctx.roundRect(w - 170, 16, 154, 28, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isElicited ? "#f1c40f" : "#2ecc71";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillText(isElicited ? "⚡ 분자 유도합성 가동" : "🌿 표준 광합성 모드", w - 156, 34);
  }
}
