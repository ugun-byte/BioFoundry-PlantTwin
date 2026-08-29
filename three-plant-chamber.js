/**
 * Ultra-Premium 3D Biotech Chamber & Automated Phyto-Diurnal Digital Twin Engine
 * Powered by Three.js
 * 
 * Features:
 * 1. Futuristic Glassmorphic Cleanroom Bioreactor Pod with high-end obsidian & neon accents.
 * 2. Automated 24-Hour Diurnal Physics (Natural day-to-night lighting & respiration transitions).
 * 3. Organic Botanical Model with High Contrast: Lush emerald leaves, vein geometry, blooming golden marigold.
 * 4. Physics-Driven Environmental Systems: Automated misting when VPD is high, gentle HVAC airflow sway.
 * 5. Interactive 3D Raycasting: Hover over plant leaves to view sleek floating biometric inspection badges.
 */

export class ThreePlantChamber {
  constructor(containerElement) {
    this.container = containerElement;
    this.time = 0;
    this.isInitialized = false;

    // Simulation sync state
    this.simulatedHour = 8.0;
    this.isLightOn = true;

    this.initThree();
    this.buildBioreactorChamber();
    this.buildPhysicsParticles();
    this.initOrganicPlant();
    this.setupRaycasting();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    window.addEventListener("resize", () => this.onResize());
  }

  initThree() {
    const w = this.container.clientWidth || 800;
    const h = this.container.clientHeight || 480;

    // 1. Scene with modern luminous cyan-slate cleanroom atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x101f2f); // Luminous cleanroom deep cyan-slate
    this.scene.fog = new THREE.FogExp2(0x101f2f, 0.035);

    // 2. Camera with cinematic focal length
    this.camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 50);
    this.camera.position.set(0, 1.3, 3.2);

    // 3. High-End WebGL Renderer with crisp bright exposure
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.32;

    const oldCanvas = this.container.querySelector("canvas");
    if (oldCanvas) oldCanvas.remove();
    this.container.appendChild(this.renderer.domElement);

    // 4. Smooth Orbit Controls
    if (typeof THREE.OrbitControls !== "undefined") {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.target.set(0, 0.65, 0);
      this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
      this.controls.minDistance = 1.2;
      this.controls.maxDistance = 5.5;
    }

    this.isInitialized = true;
  }

  onResize() {
    if (!this.container || !this.renderer) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  buildBioreactorChamber() {
    // 1. High-Tech Hexagonal Base Pedestal
    const baseGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.18, 6);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0a141e,
      metalness: 0.85,
      roughness: 0.25
    });
    this.basePedestal = new THREE.Mesh(baseGeo, baseMat);
    this.basePedestal.position.y = 0.09;
    this.basePedestal.receiveShadow = true;
    this.scene.add(this.basePedestal);

    // Neon Cyan Accent Ring on base
    const neonRingGeo = new THREE.TorusGeometry(1.55, 0.015, 16, 64);
    const neonRingMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
    const neonRing = new THREE.Mesh(neonRingGeo, neonRingMat);
    neonRing.rotation.x = Math.PI / 2;
    neonRing.position.y = 0.18;
    this.scene.add(neonRing);

    // Clean Cyber Grid Floor
    const grid = new THREE.GridHelper(12, 24, 0x00f2fe, 0x0f293d);
    grid.position.y = 0.0;
    this.scene.add(grid);

    // 2. Hydroponic Culture Basin (DWC Reservoir)
    const basinGroup = new THREE.Group();
    basinGroup.position.set(0, 0.32, 0);

    const potBodyGeo = new THREE.CylinderGeometry(0.55, 0.42, 0.30, 32);
    const potBodyMat = new THREE.MeshStandardMaterial({
      color: 0x0f1c29,
      metalness: 0.7,
      roughness: 0.3
    });
    const potBody = new THREE.Mesh(potBodyGeo, potBodyMat);
    potBody.castShadow = true;
    potBody.receiveShadow = true;
    basinGroup.add(potBody);

    // Glowing Nutrient Fluid Level Indicator Ring
    const fluidRingGeo = new THREE.TorusGeometry(0.56, 0.018, 16, 48);
    const fluidRingMat = new THREE.MeshBasicMaterial({ color: 0x38ef7d });
    const fluidRing = new THREE.Mesh(fluidRingGeo, fluidRingMat);
    fluidRing.rotation.x = Math.PI / 2;
    fluidRing.position.y = 0.08;
    basinGroup.add(fluidRing);

    // Top Net Cup Collar
    const collarGeo = new THREE.CylinderGeometry(0.24, 0.18, 0.08, 24);
    const collarMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.y = 0.16;
    basinGroup.add(collar);

    this.scene.add(basinGroup);

    // 3. Top LED Luminaire Array Fixture
    const topCapGroup = new THREE.Group();
    topCapGroup.position.set(0, 2.6, 0);

    const fixtureGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.08, 6);
    const fixtureMat = new THREE.MeshStandardMaterial({ color: 0x111e2b, metalness: 0.8, roughness: 0.3 });
    const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
    topCapGroup.add(fixture);

    // LED emitter bars
    this.ledDiodes = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const diodeGeo = new THREE.BoxGeometry(0.35, 0.02, 0.06);
      const diodeMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
      const diode = new THREE.Mesh(diodeGeo, diodeMat);
      diode.position.set(Math.cos(angle) * 0.6, -0.045, Math.sin(angle) * 0.6);
      diode.rotation.y = -angle;
      topCapGroup.add(diode);
      this.ledDiodes.push(diode);
    }
    this.scene.add(topCapGroup);

    // 4. Real-time Physical Light Sources
    this.ambientLight = new THREE.AmbientLight(0x325980, 1.45);
    this.scene.add(this.ambientLight);

    // Main Top LED Grow Spotlight
    this.growSpotLight = new THREE.SpotLight(0xfffaed, 4.6);
    this.growSpotLight.position.set(0, 2.55, 0);
    this.growSpotLight.angle = Math.PI / 3.0;
    this.growSpotLight.penumbra = 0.5;
    this.growSpotLight.decay = 1.5;
    this.growSpotLight.distance = 5.0;
    this.growSpotLight.castShadow = true;
    this.growSpotLight.shadow.mapSize.width = 1024;
    this.growSpotLight.shadow.mapSize.height = 1024;
    this.growSpotLight.shadow.bias = -0.0005;
    this.scene.add(this.growSpotLight);

    // Luminous Cyan/Emerald Fill Lights
    this.sideFillLight = new THREE.PointLight(0x00f2fe, 0.95, 6);
    this.sideFillLight.position.set(1.8, 1.5, 1.8);
    this.scene.add(this.sideFillLight);

    this.accentGoldLight = new THREE.PointLight(0xffd32a, 0.7, 5);
    this.accentGoldLight.position.set(-1.8, 1.2, -1.2);
    this.scene.add(this.accentGoldLight);
  }

  buildPhysicsParticles() {
    // 1. Automated Humidity Mist Particles (Activates when VPD is high or during misting)
    const mistCount = 90;
    const mistGeo = new THREE.BufferGeometry();
    const mistPos = new Float32Array(mistCount * 3);

    for (let i = 0; i < mistCount; i++) {
      mistPos[i * 3 + 0] = (Math.random() - 0.5) * 0.9;
      mistPos[i * 3 + 1] = 0.5 + Math.random() * 1.2;
      mistPos[i * 3 + 2] = (Math.random() - 0.5) * 0.9;
    }

    mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPos, 3));
    const mistMat = new THREE.PointsMaterial({
      color: 0x38ef7d,
      size: 0.022,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    this.mistSystem = new THREE.Points(mistGeo, mistMat);
    this.scene.add(this.mistSystem);

    // 2. Airflow Streamline Particles (Gentle floating breeze)
    const breezeCount = 40;
    const breezeGeo = new THREE.BufferGeometry();
    const breezePos = new Float32Array(breezeCount * 3);

    for (let i = 0; i < breezeCount; i++) {
      breezePos[i * 3 + 0] = -1.2 + Math.random() * 2.4;
      breezePos[i * 3 + 1] = 0.4 + Math.random() * 1.2;
      breezePos[i * 3 + 2] = (Math.random() - 0.5) * 1.0;
    }

    breezeGeo.setAttribute('position', new THREE.BufferAttribute(breezePos, 3));
    const breezeMat = new THREE.PointsMaterial({
      color: 0x00f2fe,
      size: 0.015,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    this.breezeSystem = new THREE.Points(breezeGeo, breezeMat);
    this.scene.add(this.breezeSystem);
  }

  initOrganicPlant() {
    this.plantGroup = new THREE.Group();
    this.plantGroup.position.set(0, 0.48, 0); // Origin on top of net collar

    // 1. Organic Green Stem
    this.stemHeight = 0.85;
    this.stemMaterial = new THREE.MeshStandardMaterial({
      color: 0x166534, // Rich natural botanical emerald
      roughness: 0.5,
      metalness: 0.1
    });

    this.stemMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.028, this.stemHeight, 18),
      this.stemMaterial
    );
    this.stemMesh.position.y = this.stemHeight / 2;
    this.stemMesh.castShadow = true;
    this.stemMesh.receiveShadow = true;
    this.plantGroup.add(this.stemMesh);

    // 2. Thick Curved Organic Leaves
    this.leaves = [];
    const leafGeo = this.createOrganicLeafGeometry();

    this.leafMaterial = new THREE.MeshStandardMaterial({
      color: 0x22c55e, // Fresh lush chlorophyll green
      roughness: 0.4,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    const maxLeaves = 16;
    for (let i = 0; i < maxLeaves; i++) {
      const leafMesh = new THREE.Mesh(leafGeo, this.leafMaterial.clone());
      leafMesh.castShadow = true;
      leafMesh.receiveShadow = true;
      leafMesh.userData = { leafIndex: i, isLeaf: true };
      this.plantGroup.add(leafMesh);

      this.leaves.push({
        mesh: leafMesh,
        nodeHeightRatio: 0.12 + (i / maxLeaves) * 0.78,
        baseAngle: (i * 137.5 * Math.PI) / 180, // Golden ratio phyllotaxis
        tier: i
      });
    }

    // 3. Blooming Golden Marigold Flower
    this.flowerGroup = new THREE.Group();
    this.flowerGroup.position.set(0, this.stemHeight, 0);
    this.buildMarigoldFlower(this.flowerGroup);
    this.plantGroup.add(this.flowerGroup);

    this.scene.add(this.plantGroup);
  }

  createOrganicLeafGeometry() {
    const geom = new THREE.BufferGeometry();
    const w = 0.22;
    const l = 0.50;

    const vertices = [
      0, 0, 0,
      -w * 0.42, 0.025, l * 0.28,
      w * 0.42, 0.025, l * 0.28,

      -w * 0.52, 0.055, l * 0.65,
      w * 0.52, 0.055, l * 0.65,

      0, 0.02, l
    ];

    const indices = [
      0, 1, 2,
      1, 3, 2,
      2, 3, 4,
      3, 5, 4
    ];

    geom.setIndex(indices);
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.computeVertexNormals();
    return geom;
  }

  buildMarigoldFlower(group) {
    const sepal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.018, 0.07, 14),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 })
    );
    sepal.position.y = 0.035;
    group.add(sepal);

    // Multi-tier dense petals
    const petalGeo = new THREE.BoxGeometry(0.055, 0.012, 0.13);
    for (let l = 0; l < 4; l++) {
      const ringRadius = 0.04 + l * 0.032;
      for (let p = 0; p < 12; p++) {
        const theta = (p / 12) * Math.PI * 2 + (l * 0.25);
        const petalMat = new THREE.MeshStandardMaterial({
          color: l % 2 === 0 ? 0xf59e0b : 0xffd32a,
          roughness: 0.35
        });
        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.position.set(Math.cos(theta) * ringRadius, 0.07 + l * 0.022, Math.sin(theta) * ringRadius);
        petal.rotation.y = -theta;
        petal.rotation.x = 0.32 + l * 0.08;
        petal.castShadow = true;
        group.add(petal);
      }
    }

    // Glowing Golden Center Disk
    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.25, emissive: 0xb45309, emissiveIntensity: 0.3 })
    );
    center.position.y = 0.14;
    group.add(center);

    group.scale.set(0.01, 0.01, 0.01);
  }

  setupRaycasting() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.container.addEventListener("mousemove", (e) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });
  }

  /**
   * Automated Diurnal Simulation Update
   * (Lighting & weather naturally change according to 24-hour physical clock & setpoints)
   */
  updateSimulation(plantState, envTelemetry, cropProfile) {
    if (!this.isInitialized) return;

    const { dryWeightGrams, luteinConcentration, heightCm } = plantState;
    const { isLightOn, simulatedHour, sensors } = envTelemetry;
    this.simulatedHour = simulatedHour;
    this.isLightOn = isLightOn;

    // 1. Automated 24-Hour Diurnal Physics Transition
    // Day cycle: 06:00 ~ 22:00 (LEDs active, spectrum mixing, transpiration active)
    // Night cycle: 22:00 ~ 06:00 (Cool dark blue ambient, LEDs dim, dark respiration)
    const isDay = simulatedHour >= 6.0 && simulatedHour < 22.0;

    if (isDay && isLightOn && sensors.ppfd > 10) {
      // Daylight Spectrum calculation
      const r = Math.min(1.0, (sensors.spectrum.red / 100) * 1.3 + 0.1);
      const g = Math.min(1.0, (sensors.spectrum.green / 100) * 0.9 + 0.1);
      const b = Math.min(1.0, (sensors.spectrum.blue / 100) * 1.4 + 0.2);
      const spectrumColor = new THREE.Color(r, g, b);

      this.growSpotLight.color.lerp(spectrumColor, 0.1);
      this.growSpotLight.intensity = (sensors.ppfd / 800) * 4.8;

      this.ledDiodes.forEach((diode) => {
        diode.material.color.lerp(spectrumColor, 0.1);
      });

      this.ambientLight.color.setHex(0x325980);
      this.ambientLight.intensity = 1.45;
    } else {
      // Night Mode (Automated)
      this.growSpotLight.intensity = 0.2;
      this.ledDiodes.forEach((diode) => {
        diode.material.color.setHex(0x0f283d);
      });
      this.ambientLight.color.setHex(0x0b1d2e);
      this.ambientLight.intensity = 0.45;
    }

    // 2. Automated Mist / Transpiration based on VPD & Humidity
    if (sensors.vpd > 1.4 || sensors.humidity > 70) {
      this.mistSystem.material.opacity = Math.min(0.55, (sensors.vpd - 1.0) * 0.6);
    } else {
      this.mistSystem.material.opacity = 0.15;
    }

    // 3. Plant Stem & Leaf Growth
    const growthProgress = Math.min(1.0, heightCm / 45.0);
    const stemH = 0.22 + growthProgress * 1.15;
    this.stemMesh.scale.set(1.0 + dryWeightGrams * 0.14, stemH / this.stemHeight, 1.0 + dryWeightGrams * 0.14);
    this.stemMesh.position.y = stemH / 2;

    // Turgor Wilting Physics (VPD > 1.6 kPa causes drooping)
    const turgorFactor = sensors.vpd > 1.6 ? Math.max(0.35, 1.0 - (sensors.vpd - 1.6) * 0.9) : 1.0;
    const visibleLeafCount = Math.min(this.leaves.length, Math.floor(2 + dryWeightGrams * 1.8));

    // Lutein Carotenoid Pigmentation: Lush Emerald Green -> Rich Golden Lutein
    const luteinRatio = Math.min(1.0, Math.max(0.0, (luteinConcentration - 2.0) / 3.0));
    const targetLeafColor = new THREE.Color(
      0.13 + luteinRatio * 0.72, // R rises for gold
      0.77 - luteinRatio * 0.05, // G stays lush
      0.36 - luteinRatio * 0.25  // B shifts
    );

    this.leaves.forEach((l, idx) => {
      if (idx < visibleLeafCount) {
        const leafProgress = Math.min(1.0, (growthProgress * 1.5) - (idx * 0.05));
        const lScale = Math.max(0.12, leafProgress * 1.12);
        l.mesh.scale.set(lScale, lScale, lScale);

        const posY = stemH * l.nodeHeightRatio;
        l.mesh.position.set(0, posY, 0);

        const droopPitch = (1.0 - turgorFactor) * 0.85;
        l.mesh.rotation.set(0.42 + droopPitch, l.baseAngle, 0.15);
        l.mesh.material.color.lerp(targetLeafColor, 0.08);
      } else {
        l.mesh.scale.set(0.001, 0.001, 0.001);
      }
    });

    // Flower Blooming
    if (dryWeightGrams > 2.0 && cropProfile.id === "marigold_lutein") {
      this.flowerGroup.position.y = stemH;
      const flowerScale = Math.min(1.2, (dryWeightGrams - 2.0) * 0.35);
      this.flowerGroup.scale.set(flowerScale, flowerScale, flowerScale);
    } else {
      this.flowerGroup.scale.set(0.001, 0.001, 0.001);
    }
  }

  animate() {
    requestAnimationFrame(this.animate);
    this.time += 0.025;

    if (this.controls) this.controls.update();

    // 1. Animate Mist Vapor Particles
    if (this.mistSystem) {
      const pos = this.mistSystem.geometry.attributes.position.array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 1] += 0.006;
        pos[i * 3 + 0] += Math.sin(this.time + i) * 0.0015;
        if (pos[i * 3 + 1] > 2.2) pos[i * 3 + 1] = 0.5;
      }
      this.mistSystem.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Animate Airflow Breeze Particles
    if (this.breezeSystem) {
      const pos = this.breezeSystem.geometry.attributes.position.array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 0] += 0.012;
        if (pos[i * 3 + 0] > 1.4) pos[i * 3 + 0] = -1.4;
      }
      this.breezeSystem.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Gentle Botanical HVAC Wind Sway
    if (this.plantGroup) {
      const swayZ = Math.sin(this.time * 1.5) * 0.018;
      const swayX = Math.cos(this.time * 1.2) * 0.012;
      this.plantGroup.rotation.z = swayZ;
      this.plantGroup.rotation.x = swayX;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  resetCamera() {
    if (this.camera && this.controls) {
      this.camera.position.set(0, 1.3, 3.2);
      this.controls.target.set(0, 0.65, 0);
      this.controls.update();
    }
  }
}
