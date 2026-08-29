/**
 * True 3D WebGL Virtual Bioreactor Chamber & Procedural Plant Physics Engine
 * Powered by Three.js & Real-Time Bio-Physics
 * 
 * Features:
 * 1. True 3D Grow Chamber Environment with Physical Shading & Shadows
 * 2. 3D Procedural Plant Mesh (Stems, 3D Curved Leaves with Turgor Physics, Blooming Flowers, Roots)
 * 3. Environmental Phenomena Particle Systems:
 *    - Volumetric Photon Light Beams & Streaming Light Quantum Particles
 *    - Transpiration Water Vapor / Mist rising from stomata
 *    - Ambient CO2 Gas Diffusion Particles
 *    - Submerged Nutrient Solution Aeration Bubbles
 * 4. Interactive 3D Orbit Controls & 3D Raycasting Inspection
 */

export class ThreePlantChamber {
  constructor(containerElement) {
    this.container = containerElement;
    this.time = 0;
    this.isInitialized = false;

    // View mode: "macro" or "micro"
    this.viewMode = "macro";

    this.initThree();
    this.buildChamberEnvironment();
    this.buildParticleSystems();
    this.initPlantObjects();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    window.addEventListener("resize", () => this.onResize());
  }

  initThree() {
    const w = this.container.clientWidth || 800;
    const h = this.container.clientHeight || 480;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x03070b);
    this.scene.fog = new THREE.FogExp2(0x03070b, 0.035);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    this.camera.position.set(0, 1.8, 4.2);

    // 3. Renderer with high performance & shadows
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // Clear previous canvas if any
    const oldCanvas = this.container.querySelector("canvas");
    if (oldCanvas) oldCanvas.remove();

    this.container.appendChild(this.renderer.domElement);

    // 4. Orbit Controls
    if (typeof THREE.OrbitControls !== "undefined") {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.target.set(0, 0.9, 0);
      this.controls.maxPolarAngle = Math.PI / 2 + 0.05; // don't go below floor
      this.controls.minDistance = 1.2;
      this.controls.maxDistance = 8.0;
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

  buildChamberEnvironment() {
    // Floor Grid & Platform
    const floorGeo = new THREE.PlaneGeometry(16, 16);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x07111a,
      roughness: 0.7,
      metalness: 0.3
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Holographic Cyber Floor Grid
    const gridHelper = new THREE.GridHelper(16, 32, 0x00f2fe, 0x0b2535);
    gridHelper.position.y = 0.0;
    this.scene.add(gridHelper);

    // Ambient Lighting
    this.ambientLight = new THREE.AmbientLight(0x0a1c2a, 0.8);
    this.scene.add(this.ambientLight);

    // Top Main LED Grow Light (Spotlight)
    this.growSpotLight = new THREE.SpotLight(0xffffff, 4.5);
    this.growSpotLight.position.set(0, 3.2, 0);
    this.growSpotLight.angle = Math.PI / 3.2;
    this.growSpotLight.penumbra = 0.6;
    this.growSpotLight.decay = 1.8;
    this.growSpotLight.distance = 7.0;
    this.growSpotLight.castShadow = true;
    this.growSpotLight.shadow.mapSize.width = 1024;
    this.growSpotLight.shadow.mapSize.height = 1024;
    this.growSpotLight.shadow.bias = -0.001;
    this.scene.add(this.growSpotLight);

    // Secondary fill light
    this.fillLight = new THREE.PointLight(0x00f2fe, 0.6, 6);
    this.fillLight.position.set(2, 2.5, 2);
    this.scene.add(this.fillLight);

    // UV-B Emitter Light (Violet)
    this.uvLight = new THREE.PointLight(0xc56cf0, 0.0, 5);
    this.uvLight.position.set(0, 2.9, 0);
    this.scene.add(this.uvLight);

    // 3D Physical LED Luminaire Fixture hanging from ceiling
    const ledFixtureGroup = new THREE.Group();
    ledFixtureGroup.position.set(0, 3.1, 0);

    const fixtureBodyGeo = new THREE.BoxGeometry(1.6, 0.06, 0.8);
    const fixtureBodyMat = new THREE.MeshStandardMaterial({ color: 0x162432, metalness: 0.8, roughness: 0.3 });
    const fixtureBody = new THREE.Mesh(fixtureBodyGeo, fixtureBodyMat);
    ledFixtureGroup.add(fixtureBody);

    // 4 LED Light Bars on fixture
    this.ledBars = [];
    for (let b = -1.5; b <= 1.5; b++) {
      const barGeo = new THREE.BoxGeometry(1.4, 0.02, 0.1);
      const barMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set(0, -0.035, b * 0.22);
      ledFixtureGroup.add(bar);
      this.ledBars.push(bar);
    }

    // Suspension cables
    const cableMat = new THREE.MeshBasicMaterial({ color: 0x475569 });
    for (let cx of [-0.7, 0.7]) {
      for (let cz of [-0.35, 0.35]) {
        const cableGeo = new THREE.CylinderGeometry(0.005, 0.005, 1.2);
        const cable = new THREE.Mesh(cableGeo, cableMat);
        cable.position.set(cx, 0.6, cz);
        ledFixtureGroup.add(cable);
      }
    }

    this.scene.add(ledFixtureGroup);

    // 3D Hydroponic Basin (DWC Basin)
    const basinGroup = new THREE.Group();
    basinGroup.position.set(0, 0.25, 0);

    // Basin Box Container
    const basinGeo = new THREE.BoxGeometry(1.4, 0.48, 1.0);
    const basinMat = new THREE.MeshStandardMaterial({
      color: 0x0c1c28,
      roughness: 0.4,
      metalness: 0.6,
      transparent: true,
      opacity: 0.92
    });
    const basin = new THREE.Mesh(basinGeo, basinMat);
    basin.receiveShadow = true;
    basin.castShadow = true;
    basinGroup.add(basin);

    // Basin rim accent
    const rimGeo = new THREE.BoxGeometry(1.44, 0.04, 1.04);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, metalness: 0.9, roughness: 0.2 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = 0.24;
    basinGroup.add(rim);

    // Nutrient Liquid Surface
    const waterGeo = new THREE.PlaneGeometry(1.3, 0.9);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x00a8ff,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.75
    });
    this.waterSurface = new THREE.Mesh(waterGeo, waterMat);
    this.waterSurface.rotation.x = -Math.PI / 2;
    this.waterSurface.position.y = 0.21;
    basinGroup.add(this.waterSurface);

    // Net Pod / Plant Collar
    const netPodGeo = new THREE.CylinderGeometry(0.18, 0.12, 0.15, 24);
    const netPodMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const netPod = new THREE.Mesh(netPodGeo, netPodMat);
    netPod.position.y = 0.23;
    basinGroup.add(netPod);

    this.scene.add(basinGroup);
  }

  buildParticleSystems() {
    // 1. Photon Stream Particles (Streaming down from LEDs)
    const photonCount = 280;
    const photonGeo = new THREE.BufferGeometry();
    const photonPos = new Float32Array(photonCount * 3);
    const photonColors = new Float32Array(photonCount * 3);

    for (let i = 0; i < photonCount; i++) {
      photonPos[i * 3 + 0] = (Math.random() - 0.5) * 1.4;
      photonPos[i * 3 + 1] = 0.4 + Math.random() * 2.6;
      photonPos[i * 3 + 2] = (Math.random() - 0.5) * 0.9;

      // Color mix: Cyan, Red, Gold
      const rVal = Math.random() > 0.4 ? 1.0 : 0.0;
      const gVal = Math.random() > 0.6 ? 0.9 : 0.4;
      const bVal = Math.random() > 0.5 ? 1.0 : 0.2;
      photonColors[i * 3 + 0] = rVal;
      photonColors[i * 3 + 1] = gVal;
      photonColors[i * 3 + 2] = bVal;
    }

    photonGeo.setAttribute('position', new THREE.BufferAttribute(photonPos, 3));
    photonGeo.setAttribute('color', new THREE.BufferAttribute(photonColors, 3));

    const photonMat = new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.photonSystem = new THREE.Points(photonGeo, photonMat);
    this.scene.add(this.photonSystem);

    // 2. Transpiration Water Mist Particles (Rising from plant leaves)
    const mistCount = 120;
    const mistGeo = new THREE.BufferGeometry();
    const mistPos = new Float32Array(mistCount * 3);

    for (let i = 0; i < mistCount; i++) {
      mistPos[i * 3 + 0] = (Math.random() - 0.5) * 0.8;
      mistPos[i * 3 + 1] = 0.5 + Math.random() * 1.2;
      mistPos[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
    }

    mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPos, 3));

    const mistMat = new THREE.PointsMaterial({
      color: 0x38ef7d,
      size: 0.025,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });

    this.mistSystem = new THREE.Points(mistGeo, mistMat);
    this.scene.add(this.mistSystem);

    // 3. Submerged Aeration Bubbles in Hydroponic Basin
    const bubbleCount = 60;
    const bubbleGeo = new THREE.BufferGeometry();
    const bubblePos = new Float32Array(bubbleCount * 3);

    for (let i = 0; i < bubbleCount; i++) {
      bubblePos[i * 3 + 0] = (Math.random() - 0.5) * 1.1;
      bubblePos[i * 3 + 1] = 0.05 + Math.random() * 0.38;
      bubblePos[i * 3 + 2] = (Math.random() - 0.5) * 0.75;
    }

    bubbleGeo.setAttribute('position', new THREE.BufferAttribute(bubblePos, 3));
    const bubbleMat = new THREE.PointsMaterial({
      color: 0x00f2fe,
      size: 0.03,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    this.bubbleSystem = new THREE.Points(bubbleGeo, bubbleMat);
    this.scene.add(this.bubbleSystem);
  }

  initPlantObjects() {
    this.plantGroup = new THREE.Group();
    this.plantGroup.position.set(0, 0.48, 0); // Origin at top of net pod

    // 1. Stem Mesh (Multi-segment spine)
    this.stemSegments = 12;
    this.stemRadius = 0.028;
    this.stemHeight = 0.85;

    this.stemMaterial = new THREE.MeshStandardMaterial({
      color: 0x27ae60,
      roughness: 0.5,
      metalness: 0.1
    });

    this.stemMesh = new THREE.Mesh(new THREE.CylinderGeometry(this.stemRadius * 0.6, this.stemRadius, this.stemHeight, 16), this.stemMaterial);
    this.stemMesh.position.y = this.stemHeight / 2;
    this.stemMesh.castShadow = true;
    this.plantGroup.add(this.stemMesh);

    // 2. Leaf Meshes
    this.leaves = [];
    const leafGeo = this.createCurvedLeafGeometry();
    
    this.leafMaterial = new THREE.MeshStandardMaterial({
      color: 0x2ecc71,
      roughness: 0.35,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    const maxLeaves = 16;
    for (let i = 0; i < maxLeaves; i++) {
      const leafMesh = new THREE.Mesh(leafGeo, this.leafMaterial.clone());
      leafMesh.castShadow = true;
      leafMesh.receiveShadow = true;
      leafMesh.scale.set(0.01, 0.01, 0.01); // starts small, grows with biomass
      this.plantGroup.add(leafMesh);

      this.leaves.push({
        mesh: leafMesh,
        nodeHeightRatio: 0.15 + (i / maxLeaves) * 0.75,
        baseAngle: (i * 137.5 * Math.PI) / 180, // Fibonacci phyllotaxis
        tier: i
      });
    }

    // 3. Blooming Marigold Flower at top
    this.flowerGroup = new THREE.Group();
    this.flowerGroup.position.set(0, this.stemHeight, 0);
    this.build3DFlowerMesh(this.flowerGroup);
    this.plantGroup.add(this.flowerGroup);

    // 4. Submerged Roots
    this.rootGroup = new THREE.Group();
    this.rootGroup.position.set(0, -0.05, 0);
    const rootMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
    for (let r = 0; r < 14; r++) {
      const rAngle = (r / 14) * Math.PI * 2;
      const rootMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.001, 0.35, 6), rootMat);
      rootMesh.position.set(Math.cos(rAngle) * 0.06, -0.18, Math.sin(rAngle) * 0.06);
      rootMesh.rotation.z = (Math.random() - 0.5) * 0.5;
      rootMesh.rotation.x = (Math.random() - 0.5) * 0.5;
      this.rootGroup.add(rootMesh);
    }
    this.plantGroup.add(this.rootGroup);

    this.scene.add(this.plantGroup);
  }

  createCurvedLeafGeometry() {
    const geom = new THREE.BufferGeometry();
    const width = 0.22;
    const length = 0.52;

    const vertices = [
      0, 0, 0,
      -width * 0.4, 0.03, length * 0.3,
      width * 0.4, 0.03, length * 0.3,

      -width * 0.5, 0.06, length * 0.6,
      width * 0.5, 0.06, length * 0.6,
      0, 0.02, length
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

  build3DFlowerMesh(group) {
    // Flower Calyx Base
    const calyx = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.02, 0.08, 12), new THREE.MeshStandardMaterial({ color: 0x1e824c }));
    calyx.position.y = 0.04;
    group.add(calyx);

    // Multi-tier 3D Petal Rings
    this.petals = [];
    const petalGeo = new THREE.BoxGeometry(0.06, 0.015, 0.14);
    const layers = 4;
    const petalsPerLayer = 12;

    for (let l = 0; l < layers; l++) {
      const ringRadius = 0.05 + l * 0.04;
      for (let p = 0; p < petalsPerLayer; p++) {
        const theta = (p / petalsPerLayer) * Math.PI * 2 + (l * 0.25);
        const petalMat = new THREE.MeshStandardMaterial({
          color: l % 2 === 0 ? 0xf39c12 : 0xffd32a,
          roughness: 0.3,
          metalness: 0.1
        });
        const petalMesh = new THREE.Mesh(petalGeo, petalMat);
        petalMesh.position.set(Math.cos(theta) * ringRadius, 0.08 + l * 0.025, Math.sin(theta) * ringRadius);
        petalMesh.rotation.y = -theta;
        petalMesh.rotation.x = 0.35 + l * 0.1;
        group.add(petalMesh);
        this.petals.push(petalMesh);
      }
    }

    // Glowing Central Golden Disk
    const centerDisk = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xe67e22, roughness: 0.2, emissive: 0xd35400, emissiveIntensity: 0.35 })
    );
    centerDisk.position.y = 0.15;
    group.add(centerDisk);

    group.scale.set(0.01, 0.01, 0.01); // scales as plant matures
  }

  updateSimulation(plantState, envTelemetry, cropProfile) {
    if (!this.isInitialized) return;

    const { dryWeightGrams, luteinConcentration, heightCm } = plantState;
    const { isLightOn, sensors } = envTelemetry;
    const spectrum = sensors.spectrum;

    // 1. Update Lighting Intensity & Spectrum Color
    if (isLightOn && sensors.ppfd > 10) {
      const r = Math.min(1.0, (spectrum.red / 100) * 1.2 + 0.1);
      const g = Math.min(1.0, (spectrum.green / 100) * 0.8 + 0.1);
      const b = Math.min(1.0, (spectrum.blue / 100) * 1.3 + 0.2);

      const color = new THREE.Color(r, g, b);
      this.growSpotLight.color = color;
      this.growSpotLight.intensity = (sensors.ppfd / 800) * 5.0;

      this.ledBars.forEach((bar) => {
        bar.material.color = color;
      });

      // UV-B Lighting
      if (sensors.spectrum.uvbActive || envTelemetry.sensors.uvb) {
        this.uvLight.intensity = 2.5;
      } else {
        this.uvLight.intensity = 0.0;
      }
    } else {
      this.growSpotLight.intensity = 0.05; // Night ambient
      this.ledBars.forEach((bar) => { bar.material.color.setHex(0x112233); });
      this.uvLight.intensity = 0.0;
    }

    // 2. Physical Plant Growth Morphology Scaling
    const growthProgress = Math.min(1.0, heightCm / 45.0);
    const stemH = 0.2 + growthProgress * 1.2;
    this.stemMesh.scale.set(1.0 + dryWeightGrams * 0.15, stemH / this.stemHeight, 1.0 + dryWeightGrams * 0.15);
    this.stemMesh.position.y = stemH / 2;

    // Turgor Pressure Drooping (VPD > 1.6 kPa causes wilting physics)
    const turgorFactor = sensors.vpd > 1.6 ? Math.max(0.3, 1.0 - (sensors.vpd - 1.6) * 0.95) : 1.0;

    // Update Leaves
    const visibleLeafCount = Math.min(this.leaves.length, Math.floor(2 + dryWeightGrams * 1.8));

    // Lutein Carotenoid Pigmentation Shift: Emerald Green -> Golden Lutein
    const luteinRatio = Math.min(1.0, Math.max(0.0, (luteinConcentration - 2.0) / 3.0));
    const targetLeafColor = new THREE.Color(
      0.18 + luteinRatio * 0.65, // R increases for yellow-gold
      0.80 - luteinRatio * 0.10, // G stays lush
      0.25 - luteinRatio * 0.15  // B shifts
    );

    this.leaves.forEach((l, idx) => {
      if (idx < visibleLeafCount) {
        const leafProgress = Math.min(1.0, (growthProgress * 1.6) - (idx * 0.05));
        const lScale = Math.max(0.1, leafProgress * 1.15);
        l.mesh.scale.set(lScale, lScale, lScale);

        // Position along stem
        const posY = stemH * l.nodeHeightRatio;
        l.mesh.position.set(0, posY, 0);

        // Turgor angle: Wilts downward when turgor is low
        const droopPitch = (1.0 - turgorFactor) * 0.85;
        l.mesh.rotation.set(0.45 + droopPitch, l.baseAngle, 0.2);

        // Update Material Color
        l.mesh.material.color.lerp(targetLeafColor, 0.1);
      } else {
        l.mesh.scale.set(0.001, 0.001, 0.001);
      }
    });

    // 3. Update Flower Blooming
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

    // 1. Animate Photons Streaming
    if (this.photonSystem) {
      const pos = this.photonSystem.geometry.attributes.position.array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 1] -= 0.035; // fall speed
        if (pos[i * 3 + 1] < 0.45) {
          pos[i * 3 + 1] = 3.0; // reset to top
        }
      }
      this.photonSystem.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Animate Transpiration Mist
    if (this.mistSystem) {
      const pos = this.mistSystem.geometry.attributes.position.array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 1] += 0.008; // float up
        pos[i * 3 + 0] += Math.sin(this.time + i) * 0.002;
        if (pos[i * 3 + 1] > 2.2) {
          pos[i * 3 + 1] = 0.5;
        }
      }
      this.mistSystem.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Animate Hydroponic Bubbles
    if (this.bubbleSystem) {
      const pos = this.bubbleSystem.geometry.attributes.position.array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 1] += 0.006;
        if (pos[i * 3 + 1] > 0.45) {
          pos[i * 3 + 1] = 0.05;
        }
      }
      this.bubbleSystem.geometry.attributes.position.needsUpdate = true;
    }

    // 4. Physical Wind & Natural Plant Flutter
    if (this.plantGroup) {
      const windSway = Math.sin(this.time * 1.5) * 0.02;
      this.plantGroup.rotation.z = windSway;
      this.plantGroup.rotation.x = Math.cos(this.time * 1.1) * 0.015;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  resetCamera() {
    if (this.camera && this.controls) {
      this.camera.position.set(0, 1.8, 4.2);
      this.controls.target.set(0, 0.9, 0);
      this.controls.update();
    }
  }
}
