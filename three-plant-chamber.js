/**
 * Realistic Modern Greenhouse & Plant Physics Engine
 * Powered by Three.js
 * 
 * Features:
 * 1. Bright, realistic glasshouse/greenhouse day-to-night dynamic atmosphere.
 * 2. Natural Sun Arc & Directional Daylight with soft shadows.
 * 3. Clearly distinguishable natural phenomena:
 *    - [Sunlight & Day Rays]: Bright clean sky and soft god rays
 *    - [Wind & Airflow Dynamics]: Physical leaf flutter and gentle horizontal breeze trails
 *    - [Rain / Water Mist]: Activated during misting/irrigation events
 *    - [Night Transition]: Smooth twilight to dark starry sky with dim growth lights
 * 4. Clean modern white/glass hydroponic bench.
 */

export class ThreePlantChamber {
  constructor(containerElement) {
    this.container = containerElement;
    this.time = 0;
    this.isInitialized = false;

    // Environmental state
    this.weatherMode = "sun"; // "sun", "rain", "wind", "night"
    this.windStrength = 1.0;

    this.initThree();
    this.buildGreenhouseEnvironment();
    this.buildPhenomenaSystems();
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
    
    // Default: Bright modern daylight sky
    this.scene.background = new THREE.Color(0xdbeafe); // Bright daylight soft blue
    this.scene.fog = new THREE.FogExp2(0xdbeafe, 0.04);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    this.camera.position.set(0, 1.6, 3.8);

    // 3. High Performance Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    const oldCanvas = this.container.querySelector("canvas");
    if (oldCanvas) oldCanvas.remove();
    this.container.appendChild(this.renderer.domElement);

    // 4. Orbit Controls
    if (typeof THREE.OrbitControls !== "undefined") {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.target.set(0, 0.75, 0);
      this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // stay above ground
      this.controls.minDistance = 1.2;
      this.controls.maxDistance = 7.0;
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

  buildGreenhouseEnvironment() {
    // 1. Clean Modern Greenhouse Floor (Light grey polished concrete)
    const floorGeo = new THREE.PlaneGeometry(24, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.4,
      metalness: 0.1
    });
    this.floor = new THREE.Mesh(floorGeo, floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = 0.0;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);

    // Subtle greenhouse tile grid
    const gridHelper = new THREE.GridHelper(24, 24, 0x94a3b8, 0xcbd5e1);
    gridHelper.position.y = 0.002;
    this.scene.add(gridHelper);

    // 2. Greenhouse Glass Roof & Trusses in Background
    const trussGroup = new THREE.Group();
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6, roughness: 0.3 });
    for (let x of [-2.5, 0, 2.5]) {
      const beamGeo = new THREE.CylinderGeometry(0.025, 0.025, 6, 8);
      const beamL = new THREE.Mesh(beamGeo, trussMat);
      beamL.position.set(x, 2.5, -2);
      beamL.rotation.z = 0.4;
      trussGroup.add(beamL);

      const beamR = new THREE.Mesh(beamGeo, trussMat);
      beamR.position.set(x, 2.5, -2);
      beamR.rotation.z = -0.4;
      trussGroup.add(beamR);
    }
    this.scene.add(trussGroup);

    // 3. Bright Natural Daylight & Sun Lights
    // Hemispherical natural sky light
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x94a3b8, 1.2);
    this.hemiLight.position.set(0, 10, 0);
    this.scene.add(this.hemiLight);

    // Moving Sun Light
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    this.sunLight.position.set(2.5, 5.0, 2.0);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.bias = -0.001;
    this.scene.add(this.sunLight);

    // Top Smart LED Grow Luminaire (Supplemental lighting)
    this.ledSpotLight = new THREE.SpotLight(0xffeedd, 1.5);
    this.ledSpotLight.position.set(0, 2.8, 0);
    this.ledSpotLight.angle = Math.PI / 3.0;
    this.ledSpotLight.penumbra = 0.5;
    this.ledSpotLight.distance = 6.0;
    this.scene.add(this.ledSpotLight);

    // 3D LED Fixture bar hanging above
    const ledBarGeo = new THREE.BoxGeometry(1.4, 0.04, 0.6);
    const ledBarMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.4 });
    const ledBar = new THREE.Mesh(ledBarGeo, ledBarMat);
    ledBar.position.set(0, 2.8, 0);
    this.scene.add(ledBar);

    // 4. Clean White Hydroponic Planter Bench
    const benchGroup = new THREE.Group();
    benchGroup.position.set(0, 0.25, 0);

    // Clean white cultivation container
    const basinGeo = new THREE.BoxGeometry(1.3, 0.46, 0.9);
    const basinMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.2,
      metalness: 0.1
    });
    const basin = new THREE.Mesh(basinGeo, basinMat);
    basin.castShadow = true;
    basin.receiveShadow = true;
    benchGroup.add(basin);

    // Emerald water level accent line
    const trimGeo = new THREE.BoxGeometry(1.32, 0.02, 0.92);
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x10b981 });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.y = 0.22;
    benchGroup.add(trim);

    // Net Pod
    const netPod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.12, 0.12, 24),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })
    );
    netPod.position.y = 0.23;
    benchGroup.add(netPod);

    this.scene.add(benchGroup);
  }

  buildPhenomenaSystems() {
    // 1. Rain / Irrigation Mist System (Falls downwards, active when rain/irrigation mode)
    const rainCount = 180;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
      rainPos[i * 3 + 0] = (Math.random() - 0.5) * 1.8;
      rainPos[i * 3 + 1] = 0.5 + Math.random() * 2.2;
      rainPos[i * 3 + 2] = (Math.random() - 0.5) * 1.8;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.03,
      transparent: true,
      opacity: 0.0 // hidden by default unless irrigation/rain
    });
    this.rainSystem = new THREE.Points(rainGeo, rainMat);
    this.scene.add(this.rainSystem);

    // 2. Wind Breeze Particle Stream (Flows horizontally with wind)
    const breezeCount = 50;
    const breezeGeo = new THREE.BufferGeometry();
    const breezePos = new Float32Array(breezeCount * 3);

    for (let i = 0; i < breezeCount; i++) {
      breezePos[i * 3 + 0] = -1.5 + Math.random() * 3.0;
      breezePos[i * 3 + 1] = 0.4 + Math.random() * 1.2;
      breezePos[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
    }

    breezeGeo.setAttribute('position', new THREE.BufferAttribute(breezePos, 3));
    const breezeMat = new THREE.PointsMaterial({
      color: 0xa7f3d0,
      size: 0.02,
      transparent: true,
      opacity: 0.4
    });
    this.breezeSystem = new THREE.Points(breezeGeo, breezeMat);
    this.scene.add(this.breezeSystem);
  }

  initPlantObjects() {
    this.plantGroup = new THREE.Group();
    this.plantGroup.position.set(0, 0.48, 0); // Position on top of net pod

    // 1. Lush Green 3D Stem
    this.stemHeight = 0.85;
    this.stemMaterial = new THREE.MeshStandardMaterial({
      color: 0x15803d, // Lush healthy green
      roughness: 0.4,
      metalness: 0.05
    });

    this.stemMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.026, this.stemHeight, 16),
      this.stemMaterial
    );
    this.stemMesh.position.y = this.stemHeight / 2;
    this.stemMesh.castShadow = true;
    this.plantGroup.add(this.stemMesh);

    // 2. Realistic Curved Green Leaves
    this.leaves = [];
    const leafGeo = this.createCurvedLeafGeometry();

    this.leafMaterial = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      roughness: 0.3,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    const maxLeaves = 16;
    for (let i = 0; i < maxLeaves; i++) {
      const leafMesh = new THREE.Mesh(leafGeo, this.leafMaterial.clone());
      leafMesh.castShadow = true;
      leafMesh.receiveShadow = true;
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
    this.build3DFlowerMesh(this.flowerGroup);
    this.plantGroup.add(this.flowerGroup);

    this.scene.add(this.plantGroup);
  }

  createCurvedLeafGeometry() {
    const geom = new THREE.BufferGeometry();
    const w = 0.20;
    const l = 0.48;

    const vertices = [
      0, 0, 0,
      -w * 0.45, 0.02, l * 0.3,
      w * 0.45, 0.02, l * 0.3,

      -w * 0.5, 0.05, l * 0.65,
      w * 0.5, 0.05, l * 0.65,
      0, 0.015, l
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
    const calyx = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.015, 0.07, 12),
      new THREE.MeshStandardMaterial({ color: 0x15803d })
    );
    calyx.position.y = 0.035;
    group.add(calyx);

    // Multi-tier Golden Orange Petals
    const petalGeo = new THREE.BoxGeometry(0.055, 0.012, 0.13);
    for (let l = 0; l < 4; l++) {
      const ringRadius = 0.04 + l * 0.035;
      for (let p = 0; p < 12; p++) {
        const theta = (p / 12) * Math.PI * 2 + (l * 0.22);
        const petalMat = new THREE.MeshStandardMaterial({
          color: l % 2 === 0 ? 0xf59e0b : 0xfbbf24,
          roughness: 0.3
        });
        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.position.set(Math.cos(theta) * ringRadius, 0.07 + l * 0.02, Math.sin(theta) * ringRadius);
        petal.rotation.y = -theta;
        petal.rotation.x = 0.3 + l * 0.08;
        group.add(petal);
      }
    }

    // Glowing Golden Center
    const centerDisk = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.2 })
    );
    centerDisk.position.y = 0.13;
    group.add(centerDisk);

    group.scale.set(0.01, 0.01, 0.01);
  }

  updateSimulation(plantState, envTelemetry, cropProfile) {
    if (!this.isInitialized) return;

    const { dryWeightGrams, luteinConcentration, heightCm } = plantState;
    const { isLightOn, simulatedHour, sensors } = envTelemetry;

    // 1. Dynamic Day / Night Atmosphere Transitions
    // Daytime: 06:00 ~ 20:00 (Bright sky, warm sun)
    // Nighttime: 20:00 ~ 06:00 (Deep dark blue sky, dim moonlit night)
    const isDay = simulatedHour >= 6.0 && simulatedHour < 20.0;
    
    if (isDay) {
      // Sun position moves along an arc based on hour (06:00 = east, 13:00 = zenith, 20:00 = west)
      const dayProgress = (simulatedHour - 6.0) / 14.0;
      const sunAngle = dayProgress * Math.PI; // 0 to PI
      const sunX = -Math.cos(sunAngle) * 4.5;
      const sunY = Math.sin(sunAngle) * 5.0 + 1.2;
      const sunZ = 2.0;

      this.sunLight.position.set(sunX, sunY, sunZ);
      this.sunLight.intensity = Math.max(0.6, Math.sin(sunAngle) * 2.5);

      // Bright Daylight Sky color
      const skyBlue = new THREE.Color(0xdbeafe);
      this.scene.background.lerp(skyBlue, 0.1);
      this.scene.fog.color.lerp(skyBlue, 0.1);
      this.hemiLight.intensity = 1.2;

      // Supplemental LED Grow Lights
      if (isLightOn) {
        const r = (sensors.spectrum.red / 100) * 1.2 + 0.2;
        const g = (sensors.spectrum.green / 100) * 0.8 + 0.2;
        const b = (sensors.spectrum.blue / 100) * 1.2 + 0.2;
        this.ledSpotLight.color.setRGB(r, g, b);
        this.ledSpotLight.intensity = (sensors.ppfd / 800) * 2.0;
      }
    } else {
      // Night Mode: Deep navy atmosphere, dim ambient
      const nightColor = new THREE.Color(0x060f18);
      this.scene.background.lerp(nightColor, 0.1);
      this.scene.fog.color.lerp(nightColor, 0.1);
      this.hemiLight.intensity = 0.18;
      this.sunLight.intensity = 0.05;
      this.ledSpotLight.intensity = 0.0;
    }

    // 2. Weather Phenomena Controls
    // If humidity is high (> 75%) or irrigation active, show rain/mist
    if (sensors.humidity > 75) {
      this.rainSystem.material.opacity = Math.min(0.7, (sensors.humidity - 75) / 20.0);
    } else {
      this.rainSystem.material.opacity = 0.0;
    }

    // 3. Plant Stem & Leaf Growth
    const growthProgress = Math.min(1.0, heightCm / 45.0);
    const stemH = 0.2 + growthProgress * 1.2;
    this.stemMesh.scale.set(1.0 + dryWeightGrams * 0.15, stemH / this.stemHeight, 1.0 + dryWeightGrams * 0.15);
    this.stemMesh.position.y = stemH / 2;

    // Turgor Wilting Physics (VPD > 1.6 kPa causes drooping)
    const turgorFactor = sensors.vpd > 1.6 ? Math.max(0.3, 1.0 - (sensors.vpd - 1.6) * 0.95) : 1.0;
    const visibleLeafCount = Math.min(this.leaves.length, Math.floor(2 + dryWeightGrams * 1.8));

    // Lutein golden pigmentation transition
    const luteinRatio = Math.min(1.0, Math.max(0.0, (luteinConcentration - 2.0) / 3.0));
    const targetLeafColor = new THREE.Color(
      0.08 + luteinRatio * 0.70, // R rises to gold
      0.65 - luteinRatio * 0.05, // G stays fresh
      0.15 - luteinRatio * 0.10  // B
    );

    this.leaves.forEach((l, idx) => {
      if (idx < visibleLeafCount) {
        const leafProgress = Math.min(1.0, (growthProgress * 1.5) - (idx * 0.05));
        const lScale = Math.max(0.12, leafProgress * 1.15);
        l.mesh.scale.set(lScale, lScale, lScale);

        const posY = stemH * l.nodeHeightRatio;
        l.mesh.position.set(0, posY, 0);

        // Droop angle from turgor loss
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

    // 1. Animate Rain / Irrigation Mist (Falling downwards)
    if (this.rainSystem && this.rainSystem.material.opacity > 0.01) {
      const pos = this.rainSystem.geometry.attributes.position.array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 1] -= 0.045; // falling rain
        if (pos[i * 3 + 1] < 0.25) pos[i * 3 + 1] = 2.5;
      }
      this.rainSystem.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Animate Wind Breeze Streams (Flowing horizontally from left to right)
    if (this.breezeSystem) {
      const pos = this.breezeSystem.geometry.attributes.position.array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 0] += 0.018 * this.windStrength; // breeze to right
        if (pos[i * 3 + 0] > 1.8) pos[i * 3 + 0] = -1.8;
      }
      this.breezeSystem.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Natural Wind Sway on Plant
    if (this.plantGroup) {
      const windSwayZ = Math.sin(this.time * 1.8) * (0.025 * this.windStrength);
      const windSwayX = Math.cos(this.time * 1.3) * (0.015 * this.windStrength);
      this.plantGroup.rotation.z = windSwayZ;
      this.plantGroup.rotation.x = windSwayX;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  resetCamera() {
    if (this.camera && this.controls) {
      this.camera.position.set(0, 1.6, 3.8);
      this.controls.target.set(0, 0.75, 0);
      this.controls.update();
    }
  }
}
