/**
 * Species-Adaptive 3D Botanical Digital Twin Engine
 * Powered by Three.js
 * 
 * Features:
 * 1. 4 Distinct Botanical Morphologies & Geometries:
 *    - [Marigold]: Tall slender stem, golden ratio leaves, blooming golden marigold flower head.
 *    - [Organic Spinach]: Low compact rosette architecture, broad fleshy spade-shaped leaves, dense canopy.
 *    - [Superfood Kale]: Upright fibrous stalk with majestic ruffled/wavy leaves & prominent white midribs.
 *    - [Tobacco Biofactory]: Giant broad oval biomass leaves, robust stalk, apical trumpet flower cluster.
 * 2. Instantaneous Procedural Mesh Rebuilding on species switch.
 * 3. Species-specific physical growth rates, harvest timelines & pigment kinetics.
 */

export class ThreePlantChamber {
  constructor(containerElement) {
    this.container = containerElement;
    this.time = 0;
    this.isInitialized = false;

    // Active species
    this.currentSpecies = "marigold_lutein";
    this.simulatedHour = 8.0;
    this.isLightOn = true;

    this.initThree();
    this.buildBioreactorChamber();
    this.buildPhysicsParticles();
    this.buildSpeciesPlant(this.currentSpecies);
    this.setupRaycasting();

    this.onNodeClickCallback = null;
    this.pinned3DWorldPos = null;

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    window.addEventListener("resize", () => this.onResize());
  }

  initThree() {
    const w = this.container.clientWidth || 800;
    const h = this.container.clientHeight || 480;

    // 1. Scene with 100% transparent cleanroom laboratory pass-through
    this.scene = new THREE.Scene();
    this.scene.background = null;
    
    // Load laboratory backdrop texture into scene environment for realistic glass/chrome reflections
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load("assets/biofoundry_lab_background.jpg", (tex) => {
      tex.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = tex;
    });

    // 2. Camera centered precisely at balanced horizontal eye-level
    this.camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 50);
    this.camera.position.set(0, 1.05, 3.65);

    // 3. High-End WebGL Renderer with Alpha transparency & ACES Tone Mapping
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      premultipliedAlpha: false,
      powerPreference: "high-performance"
    });
    this.renderer.setClearColor(0x000000, 0.0);
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    const oldCanvas = this.container.querySelector("canvas");
    if (oldCanvas) oldCanvas.remove();
    this.renderer.domElement.style.background = "transparent";
    this.container.style.background = "transparent";
    this.container.appendChild(this.renderer.domElement);

    // 4. Smooth Orbit Controls with full horizontal and below-horizon rotation
    if (typeof THREE.OrbitControls !== "undefined") {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.target.set(0, 1.02, 0);
      this.controls.minPolarAngle = 0.05; // allows full top-down aerial view
      this.controls.maxPolarAngle = Math.PI * 0.62; // allows ~112° below horizon tilt to clearly view roots!
      this.controls.minDistance = 0.8;
      this.controls.maxDistance = 5.5;
    }

    window.addEventListener("resize", () => this.onResize());
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => this.onResize());
      ro.observe(this.container);
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
    const chamberGroup = new THREE.Group();

    // 1. Heavy Titanium Base Plinth (Pedestal)
    const baseGeo = new THREE.CylinderGeometry(1.25, 1.35, 0.14, 48);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x141c26,
      metalness: 0.90,
      roughness: 0.20
    });
    this.basePedestal = new THREE.Mesh(baseGeo, baseMat);
    this.basePedestal.position.y = 0.07;
    this.basePedestal.receiveShadow = true;
    chamberGroup.add(this.basePedestal);

    // Base Polished Chrome Bezel Ring
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.96,
      roughness: 0.12
    });
    const baseTrimGeo = new THREE.TorusGeometry(1.26, 0.022, 16, 64);
    const baseTrim = new THREE.Mesh(baseTrimGeo, chromeMat);
    baseTrim.rotation.x = Math.PI / 2;
    baseTrim.position.y = 0.14;
    chamberGroup.add(baseTrim);

    // Clean Cyber Grid Floor
    const grid = new THREE.GridHelper(10, 20, 0x10b981, 0x111e2e);
    grid.position.y = 0.001;
    chamberGroup.add(grid);

    // 2. Large Outer Cylindrical Reinforced Glass Capsule Enclosure (Full Plant Encapsulation)
    const glassGeo = new THREE.CylinderGeometry(1.15, 1.15, 1.82, 64, 1, true);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xebf8ff,
      transparent: true,
      opacity: 0.36,
      roughness: 0.03,
      metalness: 0.12,
      transmission: 0.85,
      ior: 1.54,
      reflectivity: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.glassCapsule = new THREE.Mesh(glassGeo, glassMat);
    this.glassCapsule.position.y = 1.04;
    chamberGroup.add(this.glassCapsule);

    // Curved Glass Cylinder Specular Highlight Rim Ring (Top & Bottom Gaskets)
    const glassGasketTop = new THREE.Mesh(new THREE.TorusGeometry(1.16, 0.015, 16, 64), chromeMat);
    glassGasketTop.rotation.x = Math.PI / 2;
    glassGasketTop.position.y = 1.95;
    chamberGroup.add(glassGasketTop);

    const glassGasketBottom = new THREE.Mesh(new THREE.TorusGeometry(1.16, 0.015, 16, 64), chromeMat);
    glassGasketBottom.rotation.x = Math.PI / 2;
    glassGasketBottom.position.y = 0.14;
    chamberGroup.add(glassGasketBottom);

    // 4 Vertical Structural Chrome Pillars framing the glass vessel
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const strut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 1.82, 16),
        chromeMat
      );
      strut.position.set(Math.cos(angle) * 1.16, 1.04, Math.sin(angle) * 1.16);
      chamberGroup.add(strut);

      // Glowing LED Indicator Strip on each pillar
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.008, 1.70, 0.008),
        new THREE.MeshBasicMaterial({ color: 0x00f2fe })
      );
      strip.position.set(Math.cos(angle) * 1.17, 1.04, Math.sin(angle) * 1.17);
      chamberGroup.add(strip);
    }

    // 3. Middle Floating Hydroponic / Aeroponic Collar Plate
    const collarGroup = new THREE.Group();
    collarGroup.position.set(0, 0.46, 0);

    const plateGeo = new THREE.CylinderGeometry(1.13, 1.13, 0.04, 48);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.3
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    collarGroup.add(plate);

    // Net Cup Collar
    const netCollarGeo = new THREE.CylinderGeometry(0.24, 0.18, 0.06, 24);
    const netCollarMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const netCollar = new THREE.Mesh(netCollarGeo, netCollarMat);
    netCollar.position.y = 0.03;
    collarGroup.add(netCollar);

    // Glowing Aeroponic Basin Fluid Indicator Ring
    const basinRingGeo = new THREE.TorusGeometry(1.14, 0.012, 16, 48);
    const basinRingMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const basinRing = new THREE.Mesh(basinRingGeo, basinRingMat);
    basinRing.rotation.x = Math.PI / 2;
    collarGroup.add(basinRing);

    // 4 Miniature Aeroponic Misting Nozzles in Root Basin
    this.mistingNozzles = [];
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const noz = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.02, 0.04, 12),
        new THREE.MeshStandardMaterial({ color: 0x00f2fe, metalness: 0.9, roughness: 0.1 })
      );
      noz.position.set(Math.cos(angle) * 0.45, -0.06, Math.sin(angle) * 0.45);
      noz.rotation.z = Math.cos(angle) * 0.6;
      noz.rotation.x = Math.sin(angle) * 0.6;
      collarGroup.add(noz);
      this.mistingNozzles.push(noz);
    }

    // Lower Nutrient Fluid Layer at base
    const liquidGeo = new THREE.CylinderGeometry(1.12, 1.12, 0.05, 48);
    const liquidMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      roughness: 0.15,
      transparent: true,
      opacity: 0.6,
      emissive: 0x059669,
      emissiveIntensity: 0.25
    });
    const liquid = new THREE.Mesh(liquidGeo, liquidMat);
    liquid.position.y = -0.34;
    collarGroup.add(liquid);

    chamberGroup.add(collarGroup);

    // 4. Top Titanium Cap & Circular LED Halo Array
    const topCapGroup = new THREE.Group();
    topCapGroup.position.set(0, 1.96, 0);

    const topFixtureGeo = new THREE.CylinderGeometry(1.25, 1.25, 0.14, 48);
    const topFixture = new THREE.Mesh(topFixtureGeo, baseMat);
    topCapGroup.add(topFixture);

    // Top Chrome Trim Ring
    const topTrimGeo = new THREE.TorusGeometry(1.26, 0.02, 16, 64);
    const topTrim = new THREE.Mesh(topTrimGeo, chromeMat);
    topTrim.rotation.x = Math.PI / 2;
    topTrim.position.y = -0.07;
    topCapGroup.add(topTrim);

    // 4 Ceiling Humidification Misting Nozzles
    this.topNozzles = [];
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const noz = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.035, 0.08, 16),
        chromeMat
      );
      noz.position.set(Math.cos(angle) * 0.72, -0.06, Math.sin(angle) * 0.72);
      topCapGroup.add(noz);
      this.topNozzles.push(noz);
    }

    // Circular LED Halo Ring Luminaire
    const ledHaloGeo = new THREE.TorusGeometry(0.68, 0.045, 16, 64);
    this.ledHaloMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 2.8,
      roughness: 0.2
    });
    this.ledHaloMesh = new THREE.Mesh(ledHaloGeo, this.ledHaloMat);
    this.ledHaloMesh.rotation.x = Math.PI / 2;
    this.ledHaloMesh.position.y = -0.06;
    topCapGroup.add(this.ledHaloMesh);

    chamberGroup.add(topCapGroup);
    this.scene.add(chamberGroup);

    // 5. Realistic Physical Lighting
    this.ambientLight = new THREE.AmbientLight(0x1e293b, 1.6);
    this.scene.add(this.ambientLight);

    // Downward Spotlight through Halo Ring
    this.growSpotLight = new THREE.SpotLight(0xfffaed, 5.0);
    this.growSpotLight.position.set(0, 1.94, 0);
    this.growSpotLight.angle = Math.PI / 3.0;
    this.growSpotLight.penumbra = 0.55;
    this.growSpotLight.decay = 1.3;
    this.growSpotLight.distance = 4.0;
    this.growSpotLight.castShadow = true;
    this.growSpotLight.shadow.mapSize.width = 1024;
    this.growSpotLight.shadow.mapSize.height = 1024;
    this.growSpotLight.shadow.bias = -0.0005;
    this.scene.add(this.growSpotLight);

    // Fill Lighting
    this.sideFillLight = new THREE.PointLight(0x00f2fe, 0.8, 5);
    this.sideFillLight.position.set(1.6, 1.3, 1.6);
    this.scene.add(this.sideFillLight);

    this.accentGoldLight = new THREE.PointLight(0x10b981, 0.6, 5);
    this.accentGoldLight.position.set(-1.6, 1.0, -1.4);
    this.scene.add(this.accentGoldLight);
  }

  buildPhysicsParticles() {
    // 1. 4 Ceiling Downward Misting Sprays from 4 Nozzles (Balanced, Clear Vapor Droplets)
    const mistCount = 100;
    const mistGeo = new THREE.BufferGeometry();
    const mistPos = new Float32Array(mistCount * 3);
    this.mistVelocities = [];

    const nozzleAngles = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4];
    for (let i = 0; i < mistCount; i++) {
      const nIdx = i % 4;
      const angle = nozzleAngles[nIdx];
      const nozzleX = Math.cos(angle) * 0.72;
      const nozzleZ = Math.sin(angle) * 0.72;
      const spread = Math.random();

      mistPos[i * 3 + 0] = nozzleX + (Math.random() - 0.5) * 0.45 * spread;
      mistPos[i * 3 + 1] = 2.18 - spread * 1.35;
      mistPos[i * 3 + 2] = nozzleZ + (Math.random() - 0.5) * 0.45 * spread;

      this.mistVelocities.push({
        nIdx,
        speed: 0.004 + Math.random() * 0.006,
        angle: angle
      });
    }

    mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPos, 3));
    const mistMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.016,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    this.mistSystem = new THREE.Points(mistGeo, mistMat);
    this.scene.add(this.mistSystem);

    // 2. Airflow Streamline Particles (Clear Breeze)
    const breezeCount = 24;
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
      size: 0.013,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending
    });
    this.breezeSystem = new THREE.Points(breezeGeo, breezeMat);
    this.scene.add(this.breezeSystem);

    // 3. Aeroponic Root Zone Misting Spray System
    const rootMistCount = 65;
    const rootMistGeo = new THREE.BufferGeometry();
    const rootMistPos = new Float32Array(rootMistCount * 3);

    for (let i = 0; i < rootMistCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.04 + Math.random() * 0.28;
      rootMistPos[i * 3 + 0] = Math.cos(angle) * radius;
      rootMistPos[i * 3 + 1] = 0.22 + Math.random() * 0.20; // within basin height (0.20 to 0.42)
      rootMistPos[i * 3 + 2] = Math.sin(angle) * radius;
    }

    rootMistGeo.setAttribute('position', new THREE.BufferAttribute(rootMistPos, 3));
    const rootMistMat = new THREE.PointsMaterial({
      color: 0x00f2fe,
      size: 0.014,
      transparent: true,
      opacity: 0.48,
      blending: THREE.AdditiveBlending
    });
    this.rootMistSystem = new THREE.Points(rootMistGeo, rootMistMat);
    this.scene.add(this.rootMistSystem);

    // 4. Real-time 3D CFD Airflow Streamline Vector Field (180 Particles)
    this.buildCfdVectorField(180);

    // 5. Quantum Photon Energy Density Rain System (135 Photons)
    this.buildPhotonRainField(135);
  }

  buildCfdVectorField(count = 180) {
    this.cfdVectorCount = count;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    this.cfdParticles = [];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.18 + Math.random() * 0.92;
      const y = 0.45 + Math.random() * 1.70;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      pos[i * 3 + 0] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      colors[i * 3 + 0] = 0.0;
      colors[i * 3 + 1] = 0.92;
      colors[i * 3 + 2] = 1.0;

      this.cfdParticles.push({
        angle,
        radius,
        y,
        speedY: 0.0035 + Math.random() * 0.007,
        angularSpeed: 0.005 + Math.random() * 0.009,
        phase: Math.random() * Math.PI * 2
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.017,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.cfdVectorSystem = new THREE.Points(geo, mat);
    this.cfdVectorSystem.visible = true;
    this.showCfdFlow = true;
    this.scene.add(this.cfdVectorSystem);
  }

  buildPhotonRainField(count = 135) {
    this.photonCount = count;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    this.photonParticles = [];

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 1.5;
      const z = (Math.random() - 0.5) * 1.5;
      const y = 0.5 + Math.random() * 1.70;

      pos[i * 3 + 0] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      colors[i * 3 + 0] = 0.22;
      colors[i * 3 + 1] = 0.74;
      colors[i * 3 + 2] = 0.97;

      this.photonParticles.push({
        x,
        z,
        y,
        speed: 0.006 + Math.random() * 0.009
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.015,
      vertexColors: true,
      transparent: true,
      opacity: 0.48,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.photonStreamSystem = new THREE.Points(geo, mat);
    this.photonStreamSystem.visible = true;
    this.showPhotons = true;
    this.scene.add(this.photonStreamSystem);
  }

  toggleCfdFlow(forcedState = null) {
    this.showCfdFlow = forcedState !== null ? forcedState : !this.showCfdFlow;
    if (this.cfdVectorSystem) this.cfdVectorSystem.visible = this.showCfdFlow;
    return this.showCfdFlow;
  }

  togglePhotons(forcedState = null) {
    this.showPhotons = forcedState !== null ? forcedState : !this.showPhotons;
    if (this.photonStreamSystem) this.photonStreamSystem.visible = this.showPhotons;
    return this.showPhotons;
  }

  setCropSpecies(cropProfile) {
    this.currentCrop = typeof cropProfile === "object" ? cropProfile : { id: cropProfile };
    this.buildSpeciesPlant(this.currentCrop);
  }

  buildSpeciesPlant(cropProfile) {
    if (this.plantGroup) {
      this.scene.remove(this.plantGroup);
    }

    this.plantGroup = new THREE.Group();
    this.plantGroup.position.set(0, 0.48, 0); // Root collar top
    this.leaves = [];
    this.flowerGroup = null;

    const prof = (typeof cropProfile === "object" && cropProfile !== null) ? cropProfile : { id: String(cropProfile || "marigold_lutein") };
    const cropId = prof.id || "marigold_lutein";
    const morphology = prof.morphologyType || 
      (cropId.includes("spinach") ? "spinach" : 
      (cropId.includes("kale") ? "kale" : 
      (cropId.includes("tobacco") ? "tobacco" : "marigold")));

    const leafColorHex = prof.leafColor || "#22c55e";

    if (morphology === "spinach") {
      this.buildSpinachPlant(leafColorHex);
    } else if (morphology === "kale") {
      this.buildKalePlant(leafColorHex);
    } else if (morphology === "tobacco") {
      this.buildTobaccoPlant(leafColorHex);
    } else {
      // Default: Marigold type
      this.buildMarigoldPlant(leafColorHex);
    }

    // Build Procedural 3D Aeroponic Root System
    this.buildRootArchitecture();

    // Build 3D Xylem Capillary Streamline Flow System
    this.buildXylemStreamlines();

    this.scene.add(this.plantGroup);
  }

  buildXylemStreamlines() {
    if (this.xylemStreamlineSystem && this.plantGroup) {
      this.plantGroup.remove(this.xylemStreamlineSystem);
    }
    const particleCount = 80;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    this.xylemParticleMeta = [];
    this.currentSapSpeedMultiplier = 1.0;

    const col1 = new THREE.Color(0x00f2fe);
    const col2 = new THREE.Color(0x38bdf8);
    const maxH = this.stemHeight || 0.85;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.003 + Math.random() * 0.009;
      const y = Math.random() * maxH;

      pos[i * 3 + 0] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(angle) * radius;

      const c = Math.random() > 0.4 ? col1 : col2;
      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      this.xylemParticleMeta.push({
        baseAngle: angle,
        baseRadius: radius,
        speed: 0.003 + Math.random() * 0.0035
      });
    }

    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.009,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    this.xylemStreamlineSystem = new THREE.Points(geo, mat);
    this.plantGroup.add(this.xylemStreamlineSystem);
  }

  buildRootArchitecture() {
    this.rootGroup = new THREE.Group();
    this.rootGroup.position.set(0, 0, 0); // Root base at net collar (y=0 in plantGroup)

    const rootMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.4,
      metalness: 0.1,
      emissive: 0x00f2fe,
      emissiveIntensity: 0.45
    });

    // 1. Central Taproot (Extended down into misting basin)
    this.taprootMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.003, 0.36, 14),
      rootMat
    );
    this.taprootMesh.position.y = -0.18;
    this.taprootMesh.castShadow = true;
    this.rootGroup.add(this.taprootMesh);

    // 2. 24 Secondary & Tertiary Lateral Roots radiating in realistic 3D bell shape
    this.lateralRoots = [];
    const lateralCount = 24;
    for (let i = 0; i < lateralCount; i++) {
      const angle = (i / lateralCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
      const depthRatio = 0.15 + (i / lateralCount) * 0.80;
      const length = 0.16 + Math.random() * 0.12;

      const latMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.002, length, 8),
        rootMat
      );
      latMesh.position.set(
        Math.cos(angle) * (0.02 + depthRatio * 0.06),
        -depthRatio * 0.28,
        Math.sin(angle) * (0.02 + depthRatio * 0.06)
      );
      latMesh.rotation.z = Math.cos(angle) * (0.35 + depthRatio * 0.25);
      latMesh.rotation.x = Math.sin(angle) * (0.35 + depthRatio * 0.25);
      latMesh.castShadow = true;
      this.rootGroup.add(latMesh);
      this.lateralRoots.push({ mesh: latMesh, baseLength: length, angle });
    }

    this.buildRootIonStreamParticles();
    this.plantGroup.add(this.rootGroup);
  }

  buildRootIonStreamParticles() {
    const particleCount = 120;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    this.ionParticleMeta = [];

    const ionColors = [
      new THREE.Color(0x00f2fe), // NO3- Cyan
      new THREE.Color(0xfbbf24), // K+ Amber
      new THREE.Color(0x10b981)  // H2PO4- Emerald
    ];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.02 + Math.random() * 0.10;
      const y = -0.02 - Math.random() * 0.32;
      pos[i * 3 + 0] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(angle) * radius;

      const col = ionColors[i % 3];
      colors[i * 3 + 0] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      this.ionParticleMeta.push({
        baseAngle: angle,
        baseRadius: radius,
        speed: 0.0025 + Math.random() * 0.0035,
        ionType: i % 3
      });
    }

    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.010,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    this.rootIonStreamSystem = new THREE.Points(geo, mat);
    this.rootGroup.add(this.rootIonStreamSystem);
  }

  /**
   * 1. Marigold: Slender tall stem, golden ratio leaves, full blooming flower head
   */
  buildMarigoldPlant(leafColorHex = "#22c55e") {
    this.stemHeight = 0.85;
    this.stemMaterial = new THREE.MeshStandardMaterial({
      color: 0x166534,
      roughness: 0.5,
      metalness: 0.1
    });

    this.stemMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.028, this.stemHeight, 18),
      this.stemMaterial
    );
    this.stemMesh.position.y = this.stemHeight / 2;
    this.stemMesh.castShadow = true;
    this.plantGroup.add(this.stemMesh);

    // Leaves
    const leafGeo = this.createMarigoldLeafGeo();
    const leafMat = new THREE.MeshStandardMaterial({
      color: leafColorHex || 0x22c55e,
      roughness: 0.4,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    const maxLeaves = 16;
    for (let i = 0; i < maxLeaves; i++) {
      const leafMesh = new THREE.Mesh(leafGeo, leafMat.clone());
      leafMesh.castShadow = true;
      leafMesh.receiveShadow = true;
      this.plantGroup.add(leafMesh);

      this.leaves.push({
        mesh: leafMesh,
        nodeHeightRatio: 0.12 + (i / maxLeaves) * 0.78,
        baseAngle: (i * 137.5 * Math.PI) / 180,
        type: "marigold"
      });
    }

    // Blooming Flower Head
    this.flowerGroup = new THREE.Group();
    this.flowerGroup.position.set(0, this.stemHeight, 0);

    const sepal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.018, 0.07, 14),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 })
    );
    sepal.position.y = 0.035;
    this.flowerGroup.add(sepal);

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
        this.flowerGroup.add(petal);
      }
    }

    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.25, emissive: 0xb45309, emissiveIntensity: 0.3 })
    );
    center.position.y = 0.14;
    this.flowerGroup.add(center);
    this.flowerGroup.scale.set(0.01, 0.01, 0.01);
    this.plantGroup.add(this.flowerGroup);
  }

  createMarigoldLeafGeo() {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(-0.09, 0.12, -0.08, 0.28);
    shape.quadraticCurveTo(-0.04, 0.42, 0, 0.48);
    shape.quadraticCurveTo(0.04, 0.42, 0.08, 0.28);
    shape.quadraticCurveTo(0.09, 0.12, 0, 0);

    const extrudeSettings = { depth: 0.005, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.002, bevelThickness: 0.002 };
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.rotateX(Math.PI / 2);
    geom.computeVertexNormals();
    return geom;
  }

  /**
   * 2. Organic Spinach: Low compact rosette, broad spade-shaped fleshy leaves
   */
  buildSpinachPlant() {
    this.stemHeight = 0.38; // Short base stalk
    this.stemMaterial = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.6 });
    this.stemMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.035, this.stemHeight, 16), this.stemMaterial);
    this.stemMesh.position.y = this.stemHeight / 2;
    this.plantGroup.add(this.stemMesh);

    // Broad Spoon/Spade-shaped Fleshy Leaves
    const spinachLeafGeo = this.createSpinachLeafGeo();
    const spinachMat = new THREE.MeshStandardMaterial({
      color: 0x15803d, // Dark glossy spinach green
      roughness: 0.28,
      metalness: 0.08,
      side: THREE.DoubleSide
    });

    const leafCount = 14;
    for (let i = 0; i < leafCount; i++) {
      const leafMesh = new THREE.Mesh(spinachLeafGeo, spinachMat.clone());
      leafMesh.castShadow = true;
      leafMesh.receiveShadow = true;
      this.plantGroup.add(leafMesh);

      this.leaves.push({
        mesh: leafMesh,
        nodeHeightRatio: 0.08 + (i / leafCount) * 0.70,
        baseAngle: (i * 137.5 * Math.PI) / 180,
        type: "spinach"
      });
    }
  }

  createSpinachLeafGeo() {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(-0.16, 0.15, -0.14, 0.38);
    shape.quadraticCurveTo(-0.06, 0.52, 0, 0.58);
    shape.quadraticCurveTo(0.06, 0.52, 0.14, 0.38);
    shape.quadraticCurveTo(0.16, 0.15, 0, 0);

    const geom = new THREE.ExtrudeGeometry(shape, { depth: 0.006, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.002, bevelThickness: 0.002 });
    geom.rotateX(Math.PI / 2);
    geom.computeVertexNormals();
    return geom;
  }

  /**
   * 3. Molecular Farming Tobacco
   */
  buildTobaccoPlant() {
    this.stemHeight = 1.05;
    this.stemMaterial = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
    this.stemMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.038, this.stemHeight, 18), this.stemMaterial);
    this.stemMesh.position.y = this.stemHeight / 2;
    this.plantGroup.add(this.stemMesh);

    const tobaccoLeafGeo = this.createTobaccoLeafGeo();
    const tobaccoMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.35, side: THREE.DoubleSide });

    const leafCount = 18;
    for (let i = 0; i < leafCount; i++) {
      const leafMesh = new THREE.Mesh(tobaccoLeafGeo, tobaccoMat.clone());
      leafMesh.castShadow = true;
      leafMesh.receiveShadow = true;
      this.plantGroup.add(leafMesh);

      this.leaves.push({
        mesh: leafMesh,
        nodeHeightRatio: 0.10 + (i / leafCount) * 0.80,
        baseAngle: (i * 137.5 * Math.PI) / 180,
        type: "tobacco"
      });
    }
  }

  createTobaccoLeafGeo() {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(-0.18, 0.20, -0.15, 0.50);
    shape.quadraticCurveTo(-0.06, 0.70, 0, 0.78);
    shape.quadraticCurveTo(0.06, 0.70, 0.15, 0.50);
    shape.quadraticCurveTo(0.18, 0.20, 0, 0);

    const geom = new THREE.ExtrudeGeometry(shape, { depth: 0.006, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.002, bevelThickness: 0.002 });
    geom.rotateX(Math.PI / 2);
    geom.computeVertexNormals();
    return geom;
  }

  /**
   * 4. Medical Kale: Upright thick stalk, dense curly frilly cabbage leaves
   */
  buildKalePlant() {
    this.stemHeight = 0.65;
    this.stemMaterial = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.6 });
    this.stemMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.038, this.stemHeight, 18), this.stemMaterial);
    this.stemMesh.position.y = this.stemHeight / 2;
    this.plantGroup.add(this.stemMesh);

    const kaleLeafGeo = this.createKaleLeafGeo();
    const kaleMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.35, side: THREE.DoubleSide });

    const leafCount = 14;
    for (let i = 0; i < leafCount; i++) {
      const leafMesh = new THREE.Mesh(kaleLeafGeo, kaleMat.clone());
      leafMesh.castShadow = true;
      leafMesh.receiveShadow = true;
      this.plantGroup.add(leafMesh);

      this.leaves.push({
        mesh: leafMesh,
        nodeHeightRatio: 0.12 + (i / leafCount) * 0.75,
        baseAngle: (i * 137.5 * Math.PI) / 180,
        type: "kale"
      });
    }
  }

  createKaleLeafGeo() {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(-0.14, 0.15, -0.12, 0.35);
    shape.quadraticCurveTo(-0.05, 0.48, 0, 0.54);
    shape.quadraticCurveTo(0.05, 0.48, 0.12, 0.35);
    shape.quadraticCurveTo(0.14, 0.15, 0, 0);

    const geom = new THREE.ExtrudeGeometry(shape, { depth: 0.006, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.002, bevelThickness: 0.002 });
    geom.rotateX(Math.PI / 2);
    geom.computeVertexNormals();
    return geom;
  }

  /**
   * 24-Hour Diurnal Lighting & Sun/Shadow Transition Engine
   */
  updateDiurnalLighting(simulatedHour, isLightOn, sensors) {
    if (!this.growSpotLight || !this.ledHaloMat || !this.ambientLight) return;

    if (!isLightOn || sensors.ppfd < 10) {
      // Night DIF mode
      this.growSpotLight.color.setHex(0x0f172a);
      this.growSpotLight.intensity = 0.25;
      this.ledHaloMat.emissive.setHex(0x09131d);
      this.ledHaloMat.emissiveIntensity = 0.2;
      this.ambientLight.color.setHex(0x060c16);
      this.ambientLight.intensity = 0.6;
      return;
    }

    // Spectrum Color based on sliders
    const r = Math.min(1.0, (sensors.spectrum.red / 100) * 1.3 + 0.1);
    const g = Math.min(1.0, (sensors.spectrum.green / 100) * 0.9 + 0.1);
    const b = Math.min(1.0, (sensors.spectrum.blue / 100) * 1.4 + 0.2);
    const spectrumColor = new THREE.Color(r, g, b);

    // Diurnal Time-of-Day Transition (06h Sunrise -> 12h Peak -> 18h Sunset -> 22h Night)
    if (simulatedHour >= 5.0 && simulatedHour < 8.5) {
      // Sunrise Dawn Ramp-up
      const p = (simulatedHour - 5.0) / 3.5;
      const dawnColor = new THREE.Color(0xffaa66).lerp(spectrumColor, p);
      this.growSpotLight.color.copy(dawnColor);
      this.growSpotLight.intensity = (sensors.ppfd / 800) * (1.2 + p * 3.8);
      this.ledHaloMat.emissive.copy(dawnColor);
      this.ledHaloMat.emissiveIntensity = 0.8 + p * 2.4;
      this.ambientLight.color.setHex(0x1a2130);
      this.ambientLight.intensity = 1.0 + p * 0.6;
    } else if (simulatedHour >= 8.5 && simulatedHour < 17.0) {
      // Peak Daytime Photosynthesis
      this.growSpotLight.color.copy(spectrumColor);
      this.growSpotLight.intensity = (sensors.ppfd / 800) * 5.2;
      this.ledHaloMat.emissive.copy(spectrumColor);
      this.ledHaloMat.emissiveIntensity = Math.min(3.6, (sensors.ppfd / 800) * 3.2 + 0.4);
      this.ambientLight.color.setHex(0x1e293b);
      this.ambientLight.intensity = 1.6;
    } else if (simulatedHour >= 17.0 && simulatedHour < 21.0) {
      // Sunset & Far-Red Twilight
      const p = (simulatedHour - 17.0) / 4.0;
      const sunsetColor = spectrumColor.clone().lerp(new THREE.Color(0xff5522), p * 0.75);
      this.growSpotLight.color.copy(sunsetColor);
      this.growSpotLight.intensity = (sensors.ppfd / 800) * Math.max(0.4, 5.2 * (1 - p * 0.8));
      this.ledHaloMat.emissive.copy(sunsetColor);
      this.ledHaloMat.emissiveIntensity = Math.max(0.4, 3.2 * (1 - p * 0.7));
      this.ambientLight.color.setHex(0x1e1620);
      this.ambientLight.intensity = Math.max(0.7, 1.6 - p * 0.8);
    } else {
      // Night Respiration
      this.growSpotLight.color.setHex(0x0f172a);
      this.growSpotLight.intensity = 0.25;
      this.ledHaloMat.emissive.setHex(0x09131d);
      this.ledHaloMat.emissiveIntensity = 0.2;
      this.ambientLight.color.setHex(0x060c16);
      this.ambientLight.intensity = 0.6;
    }
  }

  /**
   * Automated Diurnal Simulation Update (Strictly Capped at Maturity Harvest Date)
   */
  updateSimulation(plantState, envTelemetry, cropProfile, ionUptake = null) {
    if (!this.isInitialized || !this.plantGroup) return;

    const { dryWeightGrams, luteinConcentration } = plantState;
    const { isLightOn, simulatedHour, sensors } = envTelemetry;
    this.simulatedHour = simulatedHour;
    this.isLightOn = isLightOn;
    this.currentPpfd = sensors.ppfd;
    this.currentAirflowSpeed = sensors.airflowSpeed;

    // 1. 24-Hour Diurnal Lighting & Spectrum
    this.updateDiurnalLighting(simulatedHour, isLightOn, sensors);

    // 2. Mist opacity
    if (sensors.vpd > 1.4 || sensors.humidity > 70) {
      this.mistSystem.material.opacity = Math.min(0.55, (sensors.vpd - 1.0) * 0.6);
    } else {
      this.mistSystem.material.opacity = 0.15;
    }

    // 3. Species-Specific Ontogenetic Growth Modeling (Day 1 Sprout -> Day 42 Full Bloom, Strictly Capped at Maturity)
    const harvestDays = cropProfile.harvestDays || 42;
    const rawSimulatedDay = envTelemetry.simulatedDay || 1;
    // Strict maturity cap: Growth freezes at maximum harvest maturity (e.g. Day 42)
    const simulatedDay = Math.min(harvestDays, Math.max(1, rawSimulatedDay));
    const dayRatio = Math.min(1.0, Math.max(0.02, simulatedDay / harvestDays));
    const dayNorm = Math.min(1.0, Math.max(0.0, (simulatedDay - 1) / Math.max(1, harvestDays - 1))); // Strictly capped at 1.0

    // Dynamic 3D Root Architecture Elongation & Michaelis-Menten Root Ion Heatmap
    if (this.rootGroup) {
      const rootScale = Math.min(1.30, 0.35 + dayRatio * 0.95);
      this.rootGroup.scale.set(rootScale, rootScale * 1.10, rootScale);

      // Calculate Michaelis-Menten Root Ion Uptake Heatmap (Cyan -> Emerald -> Radiant Gold)
      const absRatio = ionUptake && typeof ionUptake.absorptionRatio === "number" ? ionUptake.absorptionRatio : 0.72;
      
      const heatColor = new THREE.Color();
      if (absRatio < 0.5) {
        // Low: Cyan (0x00f2fe) -> Emerald (0x10b981)
        const t = absRatio / 0.5;
        heatColor.setRGB(0.0, 0.95 * (1 - t) + 0.72 * t, 1.0 * (1 - t) + 0.50 * t);
      } else {
        // High: Emerald (0x10b981) -> Radiant Gold/Amber (0xfbbf24)
        const t = (absRatio - 0.5) / 0.5;
        heatColor.setRGB(0.06 * (1 - t) + 0.98 * t, 0.72 * (1 - t) + 0.75 * t, 0.50 * (1 - t) + 0.14 * t);
      }

      if (this.taprootMesh && this.taprootMesh.material) {
        this.taprootMesh.material.emissive.lerp(heatColor, 0.12);
        this.taprootMesh.material.emissiveIntensity = 0.25 + absRatio * 0.35;
      }
      if (this.lateralRoots) {
        this.lateralRoots.forEach((lat) => {
          if (lat.mesh && lat.mesh.material) {
            lat.mesh.material.emissive.lerp(heatColor, 0.12);
            lat.mesh.material.emissiveIntensity = 0.25 + absRatio * 0.35;
          }
        });
      }
    }

    // Stem height and thickness scaling (Day 1 starts as healthy seedling 0.22m, growing to 0.85m at Day 42, then capped)
    const minStemH = 0.22;
    const adultStemH = this.currentSpecies === "spinach_carotenoid" ? 0.45 : (this.currentSpecies === "tobacco_recombinant" ? 1.05 : 0.85);
    const stemH = minStemH + Math.pow(dayNorm, 0.85) * (adultStemH - minStemH);
    const stemThick = Math.max(0.35, 0.38 + dayNorm * 0.70);
    this.stemMesh.scale.set(stemThick, Math.max(0.25, stemH / this.stemHeight), stemThick);
    this.stemMesh.position.y = stemH / 2;

    const turgorFactor = sensors.vpd > 1.6 ? Math.max(0.35, 1.0 - (sensors.vpd - 1.6) * 0.9) : 1.0;

    // Foliage leaves count and growth (Day 1: 4 healthy leaves -> Day 42: 16 full broad leaves, capped)
    const visibleLeafCount = Math.min(this.leaves.length, Math.max(4, Math.floor(4 + dayNorm * 12)));

    // Lutein Color Shift
    const luteinRatio = Math.min(1.0, Math.max(0.0, (luteinConcentration - 2.0) / 3.0));
    const targetLeafColor = new THREE.Color(
      0.13 + luteinRatio * 0.72,
      0.77 - luteinRatio * 0.05,
      0.36 - luteinRatio * 0.25
    );

    this.leaves.forEach((l, idx) => {
      if (idx < visibleLeafCount) {
        // Individual leaf size scaling
        const leafMaturity = Math.max(0.45, Math.min(1.0, (dayNorm * 16 - idx * 0.5 + 1.0) / 2.0));
        const lScale = (0.42 + dayNorm * 0.70) * leafMaturity;

        // Position along the stem
        const posY = Math.max(0.06, stemH * (0.15 + (idx / Math.max(1, visibleLeafCount)) * 0.78));
        l.mesh.position.set(0, posY, 0);
        l.mesh.scale.set(lScale, lScale, lScale);

        // Species-specific drooping angles and 3D rotation
        const basePitch = l.type === "spinach" ? 0.65 : (l.type === "tobacco" ? 0.50 : 0.42);
        const droopPitch = (1.0 - turgorFactor) * 0.55;
        l.mesh.rotation.set(basePitch + droopPitch, l.baseAngle, 0.12);

        if (l.mesh.material && !this.isThermalMode) {
          l.mesh.material.color.lerp(targetLeafColor, 0.08);
        }
      } else {
        l.mesh.scale.set(0.0001, 0.0001, 0.0001);
      }
    });

    // Flower Blooming Ontogeny: Appears as floral bud from Day 20, expands to full bloom by Day 32~42, capped
    if (this.flowerGroup) {
      this.flowerGroup.position.set(0, stemH, 0);
      if (simulatedDay < 20) {
        this.flowerGroup.scale.set(0.0001, 0.0001, 0.0001);
      } else if (simulatedDay < 32) {
        const budRatio = (simulatedDay - 20) / 12.0;
        const budScale = 0.12 + budRatio * 0.38;
        this.flowerGroup.scale.set(budScale, budScale, budScale);
      } else {
        const bloomRatio = Math.min(1.0, (simulatedDay - 32) / Math.max(1, harvestDays - 32));
        const flowerScale = 0.50 + bloomRatio * 0.65;
        this.flowerGroup.scale.set(flowerScale, flowerScale, flowerScale);
      }
    }
  }

  animate() {
    requestAnimationFrame(this.animate);
    this.time += 0.015;

    if (this.controls) this.controls.update();

    // 1. Ceiling Nozzle Downward Mist Cone Vapor Particles
    if (this.mistSystem && this.mistVelocities) {
      const pos = this.mistSystem.geometry.attributes.position.array;
      const count = pos.length / 3;
      const nozzleAngles = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4];

      for (let i = 0; i < count; i++) {
        const vel = this.mistVelocities[i];
        pos[i * 3 + 1] -= vel.speed * 0.75;
        pos[i * 3 + 0] += Math.sin(this.time * 1.4 + i) * 0.0009;
        pos[i * 3 + 2] += Math.cos(this.time * 1.4 + i) * 0.0009;

        // Reset particle back at ceiling nozzle
        if (pos[i * 3 + 1] < 0.75) {
          const angle = nozzleAngles[vel.nIdx];
          pos[i * 3 + 0] = Math.cos(angle) * 0.72 + (Math.random() - 0.5) * 0.08;
          pos[i * 3 + 1] = 2.18;
          pos[i * 3 + 2] = Math.sin(angle) * 0.72 + (Math.random() - 0.5) * 0.08;
        }
      }
      this.mistSystem.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Airflow Breeze Particles
    if (this.breezeSystem) {
      const pos = this.breezeSystem.geometry.attributes.position.array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 0] += 0.006;
        if (pos[i * 3 + 0] > 1.4) pos[i * 3 + 0] = -1.4;
      }
      this.breezeSystem.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Aeroponic Root Zone Misting Spray Droplets
    if (this.rootMistSystem) {
      const pos = this.rootMistSystem.geometry.attributes.position.array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 1] -= 0.003;
        pos[i * 3 + 0] += Math.sin(this.time * 1.5 + i) * 0.0008;
        pos[i * 3 + 2] += Math.cos(this.time * 1.5 + i) * 0.0008;
        if (pos[i * 3 + 1] < 0.22) {
          pos[i * 3 + 1] = 0.40;
        }
      }
      this.rootMistSystem.geometry.attributes.position.needsUpdate = true;
    }

    // 4. Plant Mechanical Wind Sway
    if (this.plantGroup) {
      const swayZ = Math.sin(this.time * 1.1) * 0.011;
      const swayX = Math.cos(this.time * 0.9) * 0.007;
      this.plantGroup.rotation.z = swayZ;
      this.plantGroup.rotation.x = swayX;
    }

    // 5. Bio-Electric Root Ion Stream Particles Flow
    if (this.rootIonStreamSystem && this.ionParticleMeta) {
      const pos = this.rootIonStreamSystem.geometry.attributes.position.array;
      const count = pos.length / 3;
      for (let i = 0; i < count; i++) {
        const meta = this.ionParticleMeta[i];
        pos[i * 3 + 1] += meta.speed * 0.75;
        if (pos[i * 3 + 1] > -0.01) {
          pos[i * 3 + 1] = -0.34;
        }
        meta.baseAngle += 0.015;
        pos[i * 3 + 0] = Math.cos(meta.baseAngle) * (meta.baseRadius * (1.0 + pos[i * 3 + 1] * 0.4));
        pos[i * 3 + 2] = Math.sin(meta.baseAngle) * (meta.baseRadius * (1.0 + pos[i * 3 + 1] * 0.4));
      }
      this.rootIonStreamSystem.geometry.attributes.position.needsUpdate = true;
    }

    // 6. Xylem Sap Flow Upward Water Streamlines Animation
    if (this.xylemStreamlineSystem && this.xylemParticleMeta) {
      const pos = this.xylemStreamlineSystem.geometry.attributes.position.array;
      const count = pos.length / 3;
      const maxH = this.stemHeight || 0.85;
      const speedMult = (this.currentSapSpeedMultiplier || 1.0) * 0.75;

      for (let i = 0; i < count; i++) {
        const meta = this.xylemParticleMeta[i];
        pos[i * 3 + 1] += meta.speed * speedMult;
        if (pos[i * 3 + 1] > maxH) {
          pos[i * 3 + 1] = 0.01;
        }
        meta.baseAngle += 0.011;
        pos[i * 3 + 0] = Math.cos(meta.baseAngle) * meta.baseRadius;
        pos[i * 3 + 2] = Math.sin(meta.baseAngle) * meta.baseRadius;
      }
      this.xylemStreamlineSystem.geometry.attributes.position.needsUpdate = true;
    }

    // 7. CFD Airflow Vector Field Particles (Helical Downward Vortex - Balanced Clear Motion)
    if (this.cfdVectorSystem && this.cfdVectorSystem.visible && this.cfdParticles) {
      const pos = this.cfdVectorSystem.geometry.attributes.position.array;
      const colors = this.cfdVectorSystem.geometry.attributes.color.array;
      const count = pos.length / 3;
      const speedMult = (this.currentAirflowSpeed || 1.0) * 0.75 * (window.paretoSpeedMultiplier !== undefined ? window.paretoSpeedMultiplier : 1.0);
      const isWarm = (this.currentTemp || 24.0) > 27.0;

      const drawCountCfd = Math.max(15, Math.min(count, Math.floor(count * (window.paretoSpeedMultiplier !== undefined ? window.paretoSpeedMultiplier : 1.0))));
      this.cfdVectorSystem.geometry.setDrawRange(0, drawCountCfd);

      for (let i = 0; i < count; i++) {
        const p = this.cfdParticles[i];
        p.y -= p.speedY * speedMult;
        p.angle += p.angularSpeed * speedMult;

        if (p.y < 0.45) {
          p.y = 2.15;
          p.radius = 0.20 + Math.random() * 0.90;
        }

        // Swirl around plant canopy
        const currentR = p.radius * (1.0 + Math.sin(this.time * 1.5 + p.phase) * 0.06);
        pos[i * 3 + 0] = Math.cos(p.angle) * currentR;
        pos[i * 3 + 1] = p.y;
        pos[i * 3 + 2] = Math.sin(p.angle) * currentR;

        // Dynamic Temperature/CO2 Color Shading
        if (isWarm) {
          colors[i * 3 + 0] = 0.98; // Amber/Rose
          colors[i * 3 + 1] = 0.45;
          colors[i * 3 + 2] = 0.15;
        } else {
          colors[i * 3 + 0] = 0.0;  // Cyan/Sky Blue
          colors[i * 3 + 1] = 0.85;
          colors[i * 3 + 2] = 0.98;
        }
      }
      this.cfdVectorSystem.geometry.attributes.position.needsUpdate = true;
      this.cfdVectorSystem.geometry.attributes.color.needsUpdate = true;
    }

    // 8. Quantum Photon Energy Density Stream (Balanced Soft Light Droplets)
    if (this.photonStreamSystem && this.photonStreamSystem.visible && this.photonParticles) {
      const pos = this.photonStreamSystem.geometry.attributes.position.array;
      const count = pos.length / 3;
      const ppfdRatio = Math.max(0.3, Math.min(2.2, (this.currentPpfd || 450) / 450)) * 0.75 * (window.paretoPhotonMultiplier !== undefined ? window.paretoPhotonMultiplier : 1.0);

      const drawCountPhoton = Math.max(15, Math.min(count, Math.floor(count * (window.paretoPhotonMultiplier !== undefined ? window.paretoPhotonMultiplier : 1.0))));
      this.photonStreamSystem.geometry.setDrawRange(0, drawCountPhoton);

      for (let i = 0; i < count; i++) {
        const p = this.photonParticles[i];
        p.y -= p.speed * ppfdRatio;

        if (p.y < 0.50) {
          p.y = 2.25;
          p.x = (Math.random() - 0.5) * 1.5;
          p.z = (Math.random() - 0.5) * 1.5;
        }

        pos[i * 3 + 0] = p.x;
        pos[i * 3 + 1] = p.y;
        pos[i * 3 + 2] = p.z;
      }
      this.photonStreamSystem.geometry.attributes.position.needsUpdate = true;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  get3dScreenPosition(worldPos) {
    if (!this.camera || !this.renderer || !this.container) return null;
    const v = worldPos.clone();
    v.project(this.camera);
    const rect = this.container.getBoundingClientRect();
    const x = ((v.x + 1) / 2) * rect.width;
    const y = ((-v.y + 1) / 2) * rect.height;
    const isVisible = v.z < 1.0;
    return { x, y, isVisible };
  }

  getPlantAnchorPoints() {
    // 1. High Upper Leaf Canopy Anchor (Outer Foliage Tip: y ~ 0.82-0.95, x ~ +0.16)
    let leafWorld = new THREE.Vector3(0.14, 0.82, 0.08);
    if (this.leaves && this.leaves.length > 0) {
      // Pick the topmost active mature leaf in the foliage
      const targetLeaf = this.leaves.slice().reverse().find(l => l.mesh && l.mesh.visible) || this.leaves[this.leaves.length - 1];
      if (targetLeaf && targetLeaf.mesh) {
        targetLeaf.mesh.getWorldPosition(leafWorld);
        leafWorld.y += 0.08;
        leafWorld.x += 0.06;
      }
    } else if (this.stemMesh) {
      this.stemMesh.getWorldPosition(leafWorld);
      leafWorld.y += 0.35;
      leafWorld.x += 0.12;
    }

    // 2. Low Aeroponic Rhizosphere Basin Anchor (Bottom Basin Zone: y ~ 0.22, x ~ -0.12)
    let rootWorld = new THREE.Vector3(-0.12, 0.22, 0.04);
    if (this.taprootMesh) {
      this.taprootMesh.getWorldPosition(rootWorld);
      rootWorld.y -= 0.14; // Bottom tip in aeroponics nutrient mist basin
      rootWorld.x -= 0.08;
    } else if (this.rootGroup) {
      this.rootGroup.getWorldPosition(rootWorld);
      rootWorld.y -= 0.24;
      rootWorld.x -= 0.08;
    }

    const points = {
      leafScreen: this.get3dScreenPosition(leafWorld),
      rootScreen: this.get3dScreenPosition(rootWorld)
    };

    if (this.pinMarker && this.pinMarker.visible && this.pinned3DWorldPos) {
      points.pinScreen = this.get3dScreenPosition(this.pinned3DWorldPos);
    }

    return points;
  }

  setupRaycasting() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // 3D Pin Marker Ring
    const markerGeo = new THREE.RingGeometry(0.025, 0.045, 32);
    const markerMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    this.pinMarker = new THREE.Mesh(markerGeo, markerMat);
    this.pinMarker.visible = false;
    this.scene.add(this.pinMarker);

    // Click handler with drag threshold (Only triggers on clean click, NEVER on camera rotation drag)
    let startX = 0, startY = 0;
    this.container.addEventListener("pointerdown", (e) => {
      startX = e.clientX;
      startY = e.clientY;
    });

    this.container.addEventListener("pointerup", (e) => {
      // Don't trigger if clicked on any interactive HUD elements or buttons
      if (e.target.closest("#hologramBioHud") || e.target.closest(".chamber-hud-card") || e.target.closest(".btn-viewport-action") || e.target.closest(".viewport-reset-btn") || e.target.closest(".btn-tool-icon") || e.target.closest(".btn")) return;

      // Ignore if user dragged mouse to rotate camera (distance > 5px)
      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (dist > 5) return;

      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      if (!this.plantGroup) return;

      // Filter strictly to visible plant tissues only (excl. empty floor, glass, particles)
      const interactiveTargets = [];
      if (this.stemMesh && this.stemMesh.visible && this.stemMesh.scale.y > 0.05) {
        interactiveTargets.push(this.stemMesh);
      }
      if (this.taprootMesh && this.taprootMesh.visible) {
        interactiveTargets.push(this.taprootMesh);
      }
      if (this.lateralRoots) {
        this.lateralRoots.forEach(l => {
          if (l.mesh && l.mesh.visible) interactiveTargets.push(l.mesh);
        });
      }
      if (this.flowerGroup && this.flowerGroup.visible && this.flowerGroup.scale.x > 0.05) {
        this.flowerGroup.traverse(obj => {
          if (obj.isMesh) interactiveTargets.push(obj);
        });
      }
      if (this.leaves) {
        this.leaves.forEach(l => {
          if (l.mesh && l.mesh.visible && l.mesh.scale.x > 0.05) {
            interactiveTargets.push(l.mesh);
          }
        });
      }

      const intersects = this.raycaster.intersectObjects(interactiveTargets, false);

      if (intersects.length > 0) {
        const hit = intersects[0];
        this.pinned3DWorldPos = hit.point.clone();
        this.pinMarker.position.copy(hit.point);
        this.pinMarker.position.y += 0.01;
        this.pinMarker.rotation.x = -Math.PI / 2;
        this.pinMarker.visible = true;

        let nodeType = "엽육 광합성 세포 (Mesophyll Cell)";
        if (hit.object === this.stemMesh) {
          nodeType = "주원경 목질부 도관 (Main Xylem Stalk)";
        } else if (hit.object === this.taprootMesh) {
          nodeType = "근권 주근 중심주 (Taproot Core Zone)";
        } else if (this.lateralRoots && this.lateralRoots.some(l => l.mesh === hit.object)) {
          nodeType = "근권 에어로포닉 흡수근 (Root Cap & Hair Zone)";
        } else if (this.flowerGroup && this.flowerGroup.children.includes(hit.object)) {
          nodeType = "정단 화경 & 꽃잎 (Apical Floral Petal)";
        } else {
          // Identify leaf index
          const leafMatchIdx = this.leaves.findIndex(l => l.mesh === hit.object);
          nodeType = leafMatchIdx >= 0 ? `제 ${leafMatchIdx + 1}엽 상위 엽맥 (Leaf #${leafMatchIdx + 1})` : "엽신 광합성 조직 (Lamina Tissue)";
        }

        // 1. 3D Pulse Glow on Clicked Tissue Mesh
        this.pulseHighlightNode(hit.object);

        // 2. Smooth Zoom-in Focus Camera Animation
        this.smoothFocusCamera(hit.point, 1.4, 750);

        if (this.onNodeClickCallback) {
          this.onNodeClickCallback({
            nodeType,
            point3D: hit.point
          });
        }
      } else {
        // Clicked on empty floor/chamber space -> dismiss pin HUD
        this.clearPin();
        if (this.onEmptyClickCallback) {
          this.onEmptyClickCallback();
        }
      }
    });
  }

  pulseHighlightNode(hitObject) {
    if (!hitObject || !hitObject.material) return;
    const mat = hitObject.material;
    const origEmissive = mat.emissive ? mat.emissive.getHex() : 0x000000;
    const origIntensity = mat.emissiveIntensity !== undefined ? mat.emissiveIntensity : 0;

    const pulseColor = new THREE.Color(0x00f2fe);
    const startTime = performance.now();
    const duration = 1200;

    const anim = (now) => {
      const p = (now - startTime) / duration;
      if (p < 1.0) {
        const glow = Math.sin(p * Math.PI) * 1.6;
        if (mat.emissive) {
          mat.emissive.lerp(pulseColor, 0.4);
          mat.emissiveIntensity = origIntensity + glow;
        }
        requestAnimationFrame(anim);
      } else {
        if (mat.emissive) {
          mat.emissive.setHex(origEmissive);
          mat.emissiveIntensity = origIntensity;
        }
      }
    };
    requestAnimationFrame(anim);
  }

  smoothFocusCamera(targetPos, distance = 1.35, duration = 800) {
    if (!this.camera || !this.controls) return;

    const startCamPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();

    const dir = new THREE.Vector3().subVectors(startCamPos, startTarget).normalize();
    const endTarget = targetPos.clone();
    const endCamPos = targetPos.clone().add(dir.multiplyScalar(distance));

    const startTime = performance.now();

    const anim = (now) => {
      const p = Math.min(1.0, (now - startTime) / duration);
      const ease = 1.0 - Math.pow(1.0 - p, 3);

      this.camera.position.lerpVectors(startCamPos, endCamPos, ease);
      this.controls.target.lerpVectors(startTarget, endTarget, ease);
      this.controls.update();

      if (p < 1.0) {
        requestAnimationFrame(anim);
      }
    };
    requestAnimationFrame(anim);
  }

  project3DToScreen(worldPos) {
    if (!this.camera || !this.renderer) return { x: 0, y: 0 };
    const vector = worldPos.clone();
    vector.project(this.camera);

    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = ((vector.x + 1) * rect.width) / 2;
    const y = ((-vector.y + 1) * rect.height) / 2;
    return { x, y, visible: vector.z < 1.0 };
  }

  clearPin() {
    this.pinned3DWorldPos = null;
    if (this.pinMarker) this.pinMarker.visible = false;
  }

  setNodeClickCallback(cb) {
    this.onNodeClickCallback = cb;
  }

  setEmptyClickCallback(cb) {
    this.onEmptyClickCallback = cb;
  }

  resetCamera() {
    if (this.camera && this.controls) {
      const startCam = this.camera.position.clone();
      const startTgt = this.controls.target.clone();
      const endCam = new THREE.Vector3(0, 1.05, 3.65);
      const endTgt = new THREE.Vector3(0, 1.02, 0);

      const startTime = performance.now();
      const duration = 650;

      const anim = (now) => {
        const p = Math.min(1.0, (now - startTime) / duration);
        const ease = 1.0 - Math.pow(1.0 - p, 3);
        this.camera.position.lerpVectors(startCam, endCam, ease);
        this.controls.target.lerpVectors(startTgt, endTgt, ease);
        this.controls.update();
        if (p < 1.0) requestAnimationFrame(anim);
      };
      requestAnimationFrame(anim);
    }
  }

  /**
   * PAM Chlorophyll a Fluorescence Saturating Flash & 685nm Crimson Fluo Pulse
   */
  triggerPamFluorescenceFlash(onComplete = null) {
    if (!this.isInitialized || this.pamFlashActive) return;

    this.pamFlashActive = true;
    const startTime = performance.now();
    const flashDuration = 1400; // 1.4 seconds biological fluorescence induction
    const flColor = new THREE.Color(0xf43f5e); // 685nm deep crimson chlorophyll fluorescence

    const animateFlash = (now) => {
      const elapsed = now - startTime;
      const progress = elapsed / flashDuration;

      if (progress < 1.0) {
        // Phase A: Initial saturating actinic white pulse (0ms ~ 180ms)
        if (progress < 0.15) {
          const p = progress / 0.15;
          if (this.growSpotLight) this.growSpotLight.intensity = 5.2 + (1.0 - p) * 12.0;
          if (this.ledHaloMat) this.ledHaloMat.emissiveIntensity = 3.0 + (1.0 - p) * 6.0;
        }

        // Phase B: Chlorophyll Fluorescence Transient (Peak Fm -> Quenching decay)
        let fluoIntensity = 0;
        if (progress < 0.25) {
          // O -> J -> I -> P Rise
          fluoIntensity = Math.sin((progress / 0.25) * Math.PI / 2) * 1.8;
        } else {
          // P -> S -> M -> T Quenching relaxation
          const p = (progress - 0.25) / 0.75;
          fluoIntensity = 1.8 * Math.exp(-p * 3.5);
        }

        // Apply 685nm crimson glow to all leaves
        if (this.leaves) {
          this.leaves.forEach(l => {
            if (l.mesh && l.mesh.material) {
              l.mesh.material.emissive.lerp(flColor, 0.35);
              l.mesh.material.emissiveIntensity = fluoIntensity;
            }
          });
        }

        requestAnimationFrame(animateFlash);
      } else {
        // Restore normal state
        this.pamFlashActive = false;
        if (this.leaves) {
          this.leaves.forEach(l => {
            if (l.mesh && l.mesh.material) {
              l.mesh.material.emissive.setHex(0x000000);
              l.mesh.material.emissiveIntensity = 0.0;
            }
          });
        }
        if (typeof onComplete === "function") onComplete();
      }
    };

    requestAnimationFrame(animateFlash);
  }

  /**
   * Root Electrophysiology Ion Pulse Wave Animation
   */
  triggerIonPulseAnimation(onComplete = null) {
    if (!this.rootGroup) return;
    const pulseMat = this.taprootMesh ? this.taprootMesh.material : null;
    if (!pulseMat) return;

    const originalEmissive = pulseMat.emissive.getHex();
    const originalIntensity = pulseMat.emissiveIntensity;

    const start = performance.now();
    const duration = 1200;
    const pulseColor = new THREE.Color(0x00f2fe);

    const anim = (now) => {
      const p = (now - start) / duration;
      if (p < 1.0) {
        const intensity = Math.sin(p * Math.PI) * 2.2;
        pulseMat.emissive.lerp(pulseColor, 0.4);
        pulseMat.emissiveIntensity = 0.4 + intensity;

        if (this.lateralRoots) {
          this.lateralRoots.forEach(l => {
            if (l.mesh && l.mesh.material) {
              l.mesh.material.emissive.lerp(pulseColor, 0.4);
              l.mesh.material.emissiveIntensity = 0.4 + intensity;
            }
          });
        }
        requestAnimationFrame(anim);
      } else {
        pulseMat.emissive.setHex(originalEmissive);
        pulseMat.emissiveIntensity = originalIntensity;
        if (this.lateralRoots) {
          this.lateralRoots.forEach(l => {
            if (l.mesh && l.mesh.material) {
              l.mesh.material.emissive.setHex(originalEmissive);
              l.mesh.material.emissiveIntensity = originalIntensity;
            }
          });
        }
        if (typeof onComplete === "function") onComplete();
      }
    };
    requestAnimationFrame(anim);
  }

  setSapFlowSpeed(jsCmH) {
    this.currentSapSpeedMultiplier = Math.max(0.2, Math.min(3.5, (jsCmH || 14.5) / 14.0));
  }

  triggerXylemFlowVisualization(onComplete = null) {
    if (!this.stemMesh || !this.stemMesh.material) return;
    const mat = this.stemMesh.material;
    const origOpacity = mat.opacity !== undefined ? mat.opacity : 1.0;
    const origTransparent = mat.transparent;

    mat.transparent = true;
    mat.opacity = 0.35;

    if (this.xylemStreamlineSystem && this.xylemStreamlineSystem.material) {
      this.xylemStreamlineSystem.material.size = 0.018;
      this.xylemStreamlineSystem.material.opacity = 1.0;
    }

    setTimeout(() => {
      mat.opacity = origOpacity;
      mat.transparent = origTransparent;
      if (this.xylemStreamlineSystem && this.xylemStreamlineSystem.material) {
        this.xylemStreamlineSystem.material.size = 0.009;
        this.xylemStreamlineSystem.material.opacity = 0.85;
      }
      if (typeof onComplete === "function") onComplete();
    }, 2800);
  }

  getFlirIronbowColor(tempC) {
    const minT = 18.0, maxT = 32.0;
    const norm = Math.max(0.0, Math.min(1.0, (tempC - minT) / (maxT - minT)));

    let r = 0, g = 0, b = 0;
    if (norm < 0.2) {
      const t = norm / 0.2;
      r = 0.2 + 0.1 * t; g = 0.05 * t; b = 0.5 + 0.5 * t;
    } else if (norm < 0.45) {
      const t = (norm - 0.2) / 0.25;
      r = 0.1 * (1 - t); g = 0.8 * t; b = 1.0;
    } else if (norm < 0.7) {
      const t = (norm - 0.45) / 0.25;
      r = t; g = 0.9 + 0.1 * t; b = 1.0 - t;
    } else if (norm < 0.9) {
      const t = (norm - 0.7) / 0.2;
      r = 1.0; g = 0.7 * (1 - t); b = 0.0;
    } else {
      const t = (norm - 0.9) / 0.1;
      r = 1.0; g = 0.6 + 0.4 * t; b = t;
    }
    return new THREE.Color(r, g, b);
  }

  toggleThermalCameraMode(tLeaf = 22.5, airTemp = 24.0) {
    this.isThermalMode = !this.isThermalMode;

    if (this.isThermalMode) {
      this.leaves.forEach((l, idx) => {
        if (l.mesh && l.mesh.material) {
          if (!l.originalColor) l.originalColor = l.mesh.material.color.clone();
          if (!l.originalRoughness) l.originalRoughness = l.mesh.material.roughness;

          const leafTempGrad = tLeaf - (0.4 * (idx % 3));
          const thermalColor = this.getFlirIronbowColor(leafTempGrad);
          l.mesh.material.color.copy(thermalColor);
          l.mesh.material.emissive.copy(thermalColor).multiplyScalar(0.25);
          l.mesh.material.roughness = 0.2;
        }
      });

      if (this.stemMesh && this.stemMesh.material) {
        if (!this.stemOriginalColor) this.stemOriginalColor = this.stemMesh.material.color.clone();
        const stemColor = this.getFlirIronbowColor(airTemp + 0.6);
        this.stemMesh.material.color.copy(stemColor);
        this.stemMesh.material.emissive.copy(stemColor).multiplyScalar(0.2);
      }

      if (this.ambientLight) this.ambientLight.color.setHex(0x38bdf8);
    } else {
      this.leaves.forEach(l => {
        if (l.mesh && l.mesh.material && l.originalColor) {
          l.mesh.material.color.copy(l.originalColor);
          l.mesh.material.emissive.setHex(0x000000);
          l.mesh.material.roughness = l.originalRoughness || 0.4;
        }
      });
      if (this.stemMesh && this.stemMesh.material && this.stemOriginalColor) {
        this.stemMesh.material.color.copy(this.stemOriginalColor);
        this.stemMesh.material.emissive.setHex(0x000000);
      }
      if (this.ambientLight) this.ambientLight.color.setHex(0xffffff);
    }

    return this.isThermalMode;
  }

  getNdviColor(ndviVal) {
    const norm = Math.max(0.0, Math.min(1.0, (ndviVal - 0.3) / 0.6));
    // Ochre (0.0) -> Gold (0.3) -> Lime/Emerald (0.7) -> Vibrant Cyan-Green (1.0)
    const c1 = new THREE.Color(0xd97706);
    const c2 = new THREE.Color(0xfbbf24);
    const c3 = new THREE.Color(0x10b981);
    const c4 = new THREE.Color(0x00f2fe);
    if (norm < 0.33) return c1.clone().lerp(c2, norm / 0.33);
    if (norm < 0.66) return c2.clone().lerp(c3, (norm - 0.33) / 0.33);
    return c3.clone().lerp(c4, (norm - 0.66) / 0.34);
  }

  toggleHyperspectralCameraMode(ndvi = 0.82) {
    this.isHyperspectralMode = !this.isHyperspectralMode;

    if (this.isHyperspectralMode) {
      this.leaves.forEach((l, idx) => {
        if (l.mesh && l.mesh.material) {
          if (!l.originalColor) l.originalColor = l.mesh.material.color.clone();
          const localNdvi = Math.max(0.35, Math.min(0.95, ndvi + (idx % 2 === 0 ? 0.04 : -0.05)));
          const ndviCol = this.getNdviColor(localNdvi);
          l.mesh.material.color.copy(ndviCol);
          l.mesh.material.emissive.copy(ndviCol).multiplyScalar(0.4);
          l.mesh.material.roughness = 0.15;
        }
      });
      if (this.ambientLight) this.ambientLight.color.setHex(0x10b981);
    } else {
      this.leaves.forEach(l => {
        if (l.mesh && l.mesh.material && l.originalColor) {
          l.mesh.material.color.copy(l.originalColor);
          l.mesh.material.emissive.setHex(0x000000);
          l.mesh.material.roughness = l.originalRoughness || 0.4;
        }
      });
      if (this.ambientLight) this.ambientLight.color.setHex(0xffffff);
    }

    return this.isHyperspectralMode;
  }

  triggerCavitationAcousticPulse() {
    if (!this.stemMesh || !this.stemMesh.material) return;
    const mat = this.stemMesh.material;
    const origEmissive = mat.emissive ? mat.emissive.clone() : new THREE.Color(0x000000);

    mat.emissive.setHex(0x00f2fe);
    mat.emissiveIntensity = 0.8;

    if (this.xylemStreamlineSystem && this.xylemStreamlineSystem.material) {
      this.xylemStreamlineSystem.material.size = 0.022;
    }

    setTimeout(() => {
      mat.emissive.copy(origEmissive);
      mat.emissiveIntensity = 0.0;
      if (this.xylemStreamlineSystem && this.xylemStreamlineSystem.material) {
        this.xylemStreamlineSystem.material.size = 0.009;
      }
    }, 200);
  }
}

