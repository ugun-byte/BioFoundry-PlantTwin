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

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    window.addEventListener("resize", () => this.onResize());
  }

  initThree() {
    const w = this.container.clientWidth || 800;
    const h = this.container.clientHeight || 480;

    // 1. Scene with luminous cleanroom deep cyan-slate atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x101f2f);
    this.scene.fog = new THREE.FogExp2(0x101f2f, 0.035);

    // 2. Camera
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
    // 1. Hexagonal Base Pedestal
    const baseGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.18, 6);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x162838,
      metalness: 0.8,
      roughness: 0.25
    });
    this.basePedestal = new THREE.Mesh(baseGeo, baseMat);
    this.basePedestal.position.y = 0.09;
    this.basePedestal.receiveShadow = true;
    this.scene.add(this.basePedestal);

    // Neon Cyan Ring on base
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
      color: 0x1a2e40,
      metalness: 0.65,
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
    // 1. Automated Humidity Mist Particles
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
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    this.mistSystem = new THREE.Points(mistGeo, mistMat);
    this.scene.add(this.mistSystem);

    // 2. Airflow Streamline Particles
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

    const cropId = cropProfile.id || "marigold_lutein";
    const morphology = cropProfile.morphologyType || 
      (cropId.includes("spinach") ? "spinach" : 
      (cropId.includes("kale") ? "kale" : 
      (cropId.includes("tobacco") ? "tobacco" : "marigold")));

    const leafColorHex = cropProfile.leafColor || "#22c55e";

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

    this.scene.add(this.plantGroup);
  }

  /**
   * 1. Marigold: Slender tall stem, golden ratio leaves, full blooming flower head
   */
  buildMarigoldPlant() {
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
      color: 0x22c55e,
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
    const indices = [0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4];
    geom.setIndex(indices);
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
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
    const geom = new THREE.BufferGeometry();
    const w = 0.32; // Wider spade shape
    const l = 0.44;
    const vertices = [
      0, 0, 0,
      -w * 0.55, 0.03, l * 0.35,
      w * 0.55, 0.03, l * 0.35,
      -w * 0.60, 0.06, l * 0.70,
      w * 0.60, 0.06, l * 0.70,
      0, 0.03, l
    ];
    const indices = [0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4];
    geom.setIndex(indices);
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.computeVertexNormals();
    return geom;
  }

  /**
   * 3. Superfood Kale: Upright fibrous stalk with majestic ruffled/wavy leaves & white midrib
   */
  buildKalePlant() {
    this.stemHeight = 0.75;
    this.stemMaterial = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.7 });
    this.stemMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.036, this.stemHeight, 18), this.stemMaterial);
    this.stemMesh.position.y = this.stemHeight / 2;
    this.plantGroup.add(this.stemMesh);

    // Ruffled Kale Leaf Geometry
    const kaleLeafGeo = this.createKaleLeafGeo();
    const kaleMat = new THREE.MeshStandardMaterial({
      color: 0x047857, // Blue-green dark kale
      roughness: 0.65,
      side: THREE.DoubleSide
    });

    const leafCount = 14;
    for (let i = 0; i < leafCount; i++) {
      const leafMesh = new THREE.Mesh(kaleLeafGeo, kaleMat.clone());
      leafMesh.castShadow = true;
      leafMesh.receiveShadow = true;
      this.plantGroup.add(leafMesh);

      this.leaves.push({
        mesh: leafMesh,
        nodeHeightRatio: 0.15 + (i / leafCount) * 0.75,
        baseAngle: (i * 137.5 * Math.PI) / 180,
        type: "kale"
      });
    }
  }

  createKaleLeafGeo() {
    const geom = new THREE.BufferGeometry();
    const w = 0.28;
    const l = 0.58;
    // Ruffled undulating vertices
    const vertices = [
      0, 0, 0,
      -w * 0.45, 0.08, l * 0.25,
      w * 0.45, -0.04, l * 0.25,
      -w * 0.65, -0.06, l * 0.55,
      w * 0.65, 0.09, l * 0.55,
      0, 0.02, l
    ];
    const indices = [0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4];
    geom.setIndex(indices);
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.computeVertexNormals();
    return geom;
  }

  /**
   * 4. Tobacco Biofactory: Giant broad fan biomass leaves & tall robust trunk
   */
  buildTobaccoPlant() {
    this.stemHeight = 1.05; // Tallest biomass crop
    this.stemMaterial = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.5 });
    this.stemMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.045, this.stemHeight, 18), this.stemMaterial);
    this.stemMesh.position.y = this.stemHeight / 2;
    this.plantGroup.add(this.stemMesh);

    // Giant Broad Oval Leaves
    const tobaccoLeafGeo = this.createTobaccoLeafGeo();
    const tobaccoMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      roughness: 0.45,
      side: THREE.DoubleSide
    });

    const leafCount = 18;
    for (let i = 0; i < leafCount; i++) {
      const leafMesh = new THREE.Mesh(tobaccoLeafGeo, tobaccoMat.clone());
      leafMesh.castShadow = true;
      leafMesh.receiveShadow = true;
      this.plantGroup.add(leafMesh);

      this.leaves.push({
        mesh: leafMesh,
        nodeHeightRatio: 0.10 + (i / leafCount) * 0.82,
        baseAngle: (i * 137.5 * Math.PI) / 180,
        type: "tobacco"
      });
    }

    // Apical Inflorescence (Flower Cluster at Top)
    this.flowerGroup = new THREE.Group();
    this.flowerGroup.position.set(0, this.stemHeight, 0);

    for (let f = 0; f < 6; f++) {
      const theta = (f / 6) * Math.PI * 2;
      const fl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.008, 0.09, 8),
        new THREE.MeshStandardMaterial({ color: 0xfda4af, roughness: 0.4 }) // Delicate pink/white
      );
      fl.position.set(Math.cos(theta) * 0.06, 0.06, Math.sin(theta) * 0.06);
      fl.rotation.x = 0.4;
      this.flowerGroup.add(fl);
    }
    this.flowerGroup.scale.set(0.01, 0.01, 0.01);
    this.plantGroup.add(this.flowerGroup);
  }

  createTobaccoLeafGeo() {
    const geom = new THREE.BufferGeometry();
    const w = 0.38; // Giant broad leaf
    const l = 0.65;
    const vertices = [
      0, 0, 0,
      -w * 0.45, 0.03, l * 0.28,
      w * 0.45, 0.03, l * 0.28,
      -w * 0.58, 0.07, l * 0.62,
      w * 0.58, 0.07, l * 0.62,
      0, 0.02, l
    ];
    const indices = [0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4];
    geom.setIndex(indices);
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.computeVertexNormals();
    return geom;
  }

  /**
   * Automated Diurnal Simulation Update
   */
  updateSimulation(plantState, envTelemetry, cropProfile) {
    if (!this.isInitialized || !this.plantGroup) return;

    const { dryWeightGrams, luteinConcentration, heightCm } = plantState;
    const { isLightOn, simulatedHour, sensors } = envTelemetry;
    this.simulatedHour = simulatedHour;
    this.isLightOn = isLightOn;

    // 1. Lighting Spectrum & Intensity
    const isDay = simulatedHour >= 6.0 && simulatedHour < 22.0;

    if (isDay && isLightOn && sensors.ppfd > 10) {
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
      this.growSpotLight.intensity = 0.2;
      this.ledDiodes.forEach((diode) => {
        diode.material.color.setHex(0x0f283d);
      });
      this.ambientLight.color.setHex(0x0b1d2e);
      this.ambientLight.intensity = 0.45;
    }

    // 2. Mist opacity
    if (sensors.vpd > 1.4 || sensors.humidity > 70) {
      this.mistSystem.material.opacity = Math.min(0.55, (sensors.vpd - 1.0) * 0.6);
    } else {
      this.mistSystem.material.opacity = 0.15;
    }

    // 3. Species-Specific Morphological Scaling
    const maxPlantH = this.currentSpecies === "spinach_carotenoid" ? 22.0 : (this.currentSpecies === "tobacco_recombinant" ? 65.0 : 45.0);
    const growthProgress = Math.min(1.0, heightCm / maxPlantH);
    const stemH = (this.currentSpecies === "spinach_carotenoid" ? 0.12 : 0.22) + growthProgress * (this.stemHeight - 0.2);
    
    this.stemMesh.scale.set(1.0 + dryWeightGrams * 0.12, stemH / this.stemHeight, 1.0 + dryWeightGrams * 0.12);
    this.stemMesh.position.y = stemH / 2;

    const turgorFactor = sensors.vpd > 1.6 ? Math.max(0.35, 1.0 - (sensors.vpd - 1.6) * 0.9) : 1.0;
    const visibleLeafCount = Math.min(this.leaves.length, Math.floor(2 + dryWeightGrams * 1.8));

    // Lutein Color Shift
    const luteinRatio = Math.min(1.0, Math.max(0.0, (luteinConcentration - 2.0) / 3.0));
    const targetLeafColor = new THREE.Color(
      0.13 + luteinRatio * 0.72,
      0.77 - luteinRatio * 0.05,
      0.36 - luteinRatio * 0.25
    );

    this.leaves.forEach((l, idx) => {
      if (idx < visibleLeafCount) {
        const leafProgress = Math.min(1.0, (growthProgress * 1.5) - (idx * 0.04));
        const lScale = Math.max(0.12, leafProgress * 1.15);
        l.mesh.scale.set(lScale, lScale, lScale);

        const posY = stemH * l.nodeHeightRatio;
        l.mesh.position.set(0, posY, 0);

        // Species-specific drooping angles
        const basePitch = l.type === "spinach" ? 0.65 : (l.type === "tobacco" ? 0.50 : 0.42);
        const droopPitch = (1.0 - turgorFactor) * 0.85;
        l.mesh.rotation.set(basePitch + droopPitch, l.baseAngle, 0.15);

        if (cropProfile.id === "marigold_lutein") {
          l.mesh.material.color.lerp(targetLeafColor, 0.08);
        }
      } else {
        l.mesh.scale.set(0.001, 0.001, 0.001);
      }
    });

    // Flower Blooming
    if (this.flowerGroup) {
      if (dryWeightGrams > 2.0) {
        this.flowerGroup.position.y = stemH;
        const flowerScale = Math.min(1.2, (dryWeightGrams - 2.0) * 0.35);
        this.flowerGroup.scale.set(flowerScale, flowerScale, flowerScale);
      } else {
        this.flowerGroup.scale.set(0.001, 0.001, 0.001);
      }
    }
  }

  animate() {
    requestAnimationFrame(this.animate);
    this.time += 0.025;

    if (this.controls) this.controls.update();

    // 1. Mist Vapor Particles
    if (this.mistSystem) {
      const pos = this.mistSystem.geometry.attributes.position.array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 1] += 0.006;
        pos[i * 3 + 0] += Math.sin(this.time + i) * 0.0015;
        if (pos[i * 3 + 1] > 2.2) pos[i * 3 + 1] = 0.5;
      }
      this.mistSystem.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Airflow Breeze Particles
    if (this.breezeSystem) {
      const pos = this.breezeSystem.geometry.attributes.position.array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 0] += 0.012;
        if (pos[i * 3 + 0] > 1.4) pos[i * 3 + 0] = -1.4;
      }
      this.breezeSystem.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Plant Mechanical Wind Sway
    if (this.plantGroup) {
      const swayZ = Math.sin(this.time * 1.5) * 0.016;
      const swayX = Math.cos(this.time * 1.2) * 0.010;
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
