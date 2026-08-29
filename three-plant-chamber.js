/**
 * High-Clarity Botanical 3D Greenhouse Engine
 * Optimized for Visual Comfort, Rich Contrast, and Organic Realism
 * 
 * Design Principles:
 * 1. Visual Comfort: Matte non-glare surfaces, balanced non-blinding daylight, zero harsh reflections.
 * 2. High Contrast: Lush deep emerald/forest greens on a sleek neutral matte studio deck.
 * 3. Organic Botanical Anatomy: Smooth curved leaves with defined leaf veins, velvety golden marigold petals, elegant ceramic planter.
 * 4. Clear Weather Dynamics: Soft sun trajectory, gentle wind flutter, toggleable irrigation mist, soothing night mode.
 */

export class ThreePlantChamber {
  constructor(containerElement) {
    this.container = containerElement;
    this.time = 0;
    this.isInitialized = false;

    this.weatherMode = "sun";
    this.windStrength = 1.0;

    this.initThree();
    this.buildSoftGreenhouseStudio();
    this.buildPhenomenaSystems();
    this.initOrganicPlant();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    window.addEventListener("resize", () => this.onResize());
  }

  initThree() {
    const w = this.container.clientWidth || 800;
    const h = this.container.clientHeight || 480;

    // 1. Scene with soft neutral daylight sky (comfort on eyes)
    this.scene = new THREE.Scene();
    this.daySkyColor = new THREE.Color(0xdce7f3); // Soft, non-glare gentle sky
    this.nightSkyColor = new THREE.Color(0x0f172a); // Soothing dark slate night
    this.scene.background = this.daySkyColor.clone();
    this.scene.fog = new THREE.FogExp2(0xdce7f3, 0.05);

    // 2. Camera focused tightly and elegantly on the plant
    this.camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 50);
    this.camera.position.set(0, 1.1, 2.7);

    // 3. Renderer with balanced gamma & soft shadows
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02; // Balanced, non-washed out exposure

    const oldCanvas = this.container.querySelector("canvas");
    if (oldCanvas) oldCanvas.remove();
    this.container.appendChild(this.renderer.domElement);

    // 4. Orbit Controls with smooth damping
    if (typeof THREE.OrbitControls !== "undefined") {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.target.set(0, 0.55, 0); // Focus on mid-plant
      this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
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

  buildSoftGreenhouseStudio() {
    // 1. Matte Studio Cultivation Deck (Non-reflective soft slate/neutral grey)
    const floorGeo = new THREE.CylinderGeometry(4.5, 4.5, 0.1, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc, // Matte clean light slate
      roughness: 0.9, // ZERO glare
      metalness: 0.0
    });
    this.floor = new THREE.Mesh(floorGeo, floorMat);
    this.floor.position.y = -0.05;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);

    // Soft Contact Shadow Disk under planter pot
    const shadowGeo = new THREE.CircleGeometry(0.75, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x64748b,
      transparent: true,
      opacity: 0.35
    });
    const shadowDisk = new THREE.Mesh(shadowGeo, shadowMat);
    shadowDisk.rotation.x = -Math.PI / 2;
    shadowDisk.position.y = 0.002;
    this.scene.add(shadowDisk);

    // 2. High-Contrast Ceramic Planter Pot (Deep Matte Slate/Charcoal)
    const potGroup = new THREE.Group();
    potGroup.position.set(0, 0.16, 0);

    // Ceramic Pot Body
    const potGeo = new THREE.CylinderGeometry(0.38, 0.28, 0.32, 32);
    const potMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Deep matte slate for maximum green contrast
      roughness: 0.8,
      metalness: 0.1
    });
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.castShadow = true;
    pot.receiveShadow = true;
    potGroup.add(pot);

    // Pot Rim
    const rimGeo = new THREE.CylinderGeometry(0.40, 0.38, 0.04, 32);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = 0.16;
    potGroup.add(rim);

    // Rich Dark Hydroponic Substrate/Soil inside pot
    const soilGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.02, 32);
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95 });
    const soil = new THREE.Mesh(soilGeo, soilMat);
    soil.position.y = 0.15;
    potGroup.add(soil);

    this.scene.add(potGroup);

    // 3. Balanced Soft Natural Lighting
    // Ambient Soft Fill
    this.ambientLight = new THREE.AmbientLight(0xf1f5f9, 0.75);
    this.scene.add(this.ambientLight);

    // Main Sun Directional Light
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.25);
    this.sunLight.position.set(2.0, 3.8, 1.8);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 10;
    this.sunLight.shadow.camera.left = -1.5;
    this.sunLight.shadow.camera.right = 1.5;
    this.sunLight.shadow.camera.top = 1.5;
    this.sunLight.shadow.camera.bottom = -1.5;
    this.sunLight.shadow.radius = 3; // Soft contact shadow
    this.scene.add(this.sunLight);

    // Subtle Cool Sky Fill
    this.fillLight = new THREE.DirectionalLight(0x93c5fd, 0.4);
    this.fillLight.position.set(-2.0, 2.5, -1.5);
    this.scene.add(this.fillLight);
  }

  buildPhenomenaSystems() {
    // 1. Rain / Irrigation Mist
    const rainCount = 150;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
      rainPos[i * 3 + 0] = (Math.random() - 0.5) * 1.5;
      rainPos[i * 3 + 1] = 0.4 + Math.random() * 1.8;
      rainPos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.025,
      transparent: true,
      opacity: 0.0
    });
    this.rainSystem = new THREE.Points(rainGeo, rainMat);
    this.scene.add(this.rainSystem);

    // 2. Breeze Stream Particles
    const breezeCount = 40;
    const breezeGeo = new THREE.BufferGeometry();
    const breezePos = new Float32Array(breezeCount * 3);

    for (let i = 0; i < breezeCount; i++) {
      breezePos[i * 3 + 0] = -1.2 + Math.random() * 2.4;
      breezePos[i * 3 + 1] = 0.3 + Math.random() * 0.9;
      breezePos[i * 3 + 2] = (Math.random() - 0.5) * 1.0;
    }

    breezeGeo.setAttribute('position', new THREE.BufferAttribute(breezePos, 3));
    const breezeMat = new THREE.PointsMaterial({
      color: 0x10b981,
      size: 0.018,
      transparent: true,
      opacity: 0.35
    });
    this.breezeSystem = new THREE.Points(breezeGeo, breezeMat);
    this.scene.add(this.breezeSystem);
  }

  initOrganicPlant() {
    this.plantGroup = new THREE.Group();
    this.plantGroup.position.set(0, 0.32, 0); // Root base at pot surface

    // 1. Organic Green Stem
    this.stemHeight = 0.75;
    this.stemMaterial = new THREE.MeshStandardMaterial({
      color: 0x1b4332, // Deep lush botanical green
      roughness: 0.7, // Matte organic texture
      metalness: 0.0
    });

    this.stemMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.024, this.stemHeight, 18),
      this.stemMaterial
    );
    this.stemMesh.position.y = this.stemHeight / 2;
    this.stemMesh.castShadow = true;
    this.stemMesh.receiveShadow = true;
    this.plantGroup.add(this.stemMesh);

    // 2. Thick Organic Curved Leaves
    this.leaves = [];
    const leafGeo = this.createOrganicLeafGeometry();

    this.leafMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d6a4f, // Rich saturated emerald
      roughness: 0.65, // Natural waxy leaf feel without blinding glare
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    const maxLeaves = 14;
    for (let i = 0; i < maxLeaves; i++) {
      const leafMesh = new THREE.Mesh(leafGeo, this.leafMaterial.clone());
      leafMesh.castShadow = true;
      leafMesh.receiveShadow = true;
      this.plantGroup.add(leafMesh);

      this.leaves.push({
        mesh: leafMesh,
        nodeHeightRatio: 0.12 + (i / maxLeaves) * 0.78,
        baseAngle: (i * 137.5 * Math.PI) / 180,
        tier: i
      });
    }

    // 3. Velvety Golden-Orange Marigold Flower
    this.flowerGroup = new THREE.Group();
    this.flowerGroup.position.set(0, this.stemHeight, 0);
    this.buildMarigoldBloom(this.flowerGroup);
    this.plantGroup.add(this.flowerGroup);

    this.scene.add(this.plantGroup);
  }

  createOrganicLeafGeometry() {
    const geom = new THREE.BufferGeometry();
    const w = 0.19;
    const l = 0.44;

    const vertices = [
      // Base
      0, 0, 0,
      -w * 0.4, 0.02, l * 0.25,
      w * 0.4, 0.02, l * 0.25,

      // Mid-leaf curve
      -w * 0.5, 0.045, l * 0.6,
      w * 0.5, 0.045, l * 0.6,

      // Tip
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

  buildMarigoldBloom(group) {
    // Green Sepal Cup
    const sepal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.038, 0.014, 0.06, 12),
      new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.8 })
    );
    sepal.position.y = 0.03;
    group.add(sepal);

    // Multi-Layer Dense Marigold Petals
    const petalGeo = new THREE.BoxGeometry(0.048, 0.010, 0.11);
    const layers = 4;
    const petalsPerLayer = 10;

    for (let l = 0; l < layers; l++) {
      const radius = 0.032 + l * 0.028;
      for (let p = 0; p < petalsPerLayer; p++) {
        const theta = (p / petalsPerLayer) * Math.PI * 2 + (l * 0.3);
        const petalMat = new THREE.MeshStandardMaterial({
          color: l % 2 === 0 ? 0xea580c : 0xf59e0b, // Rich deep orange & warm gold
          roughness: 0.65 // Velvety matte
        });
        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.position.set(Math.cos(theta) * radius, 0.055 + l * 0.018, Math.sin(theta) * radius);
        petal.rotation.y = -theta;
        petal.rotation.x = 0.32 + l * 0.08;
        petal.castShadow = true;
        group.add(petal);
      }
    }

    // Dense Amber Center
    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.052, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 })
    );
    center.position.y = 0.11;
    group.add(center);

    group.scale.set(0.01, 0.01, 0.01);
  }

  updateSimulation(plantState, envTelemetry, cropProfile) {
    if (!this.isInitialized) return;

    const { dryWeightGrams, luteinConcentration, heightCm } = plantState;
    const { simulatedHour, sensors } = envTelemetry;

    // 1. Day / Night Atmosphere Transitions
    const isDay = simulatedHour >= 6.0 && simulatedHour < 20.0;

    if (isDay) {
      const dayProgress = (simulatedHour - 6.0) / 14.0;
      const sunAngle = dayProgress * Math.PI;
      const sunX = -Math.cos(sunAngle) * 3.5;
      const sunY = Math.sin(sunAngle) * 4.2 + 0.8;

      this.sunLight.position.set(sunX, sunY, 1.8);
      this.sunLight.intensity = Math.max(0.7, Math.sin(sunAngle) * 1.35);

      this.scene.background.lerp(this.daySkyColor, 0.08);
      this.scene.fog.color.lerp(this.daySkyColor, 0.08);
      this.ambientLight.intensity = 0.75;
    } else {
      this.scene.background.lerp(this.nightSkyColor, 0.08);
      this.scene.fog.color.lerp(this.nightSkyColor, 0.08);
      this.ambientLight.intensity = 0.15;
      this.sunLight.intensity = 0.05;
    }

    // 2. Weather Mist
    if (sensors.humidity > 75) {
      this.rainSystem.material.opacity = Math.min(0.65, (sensors.humidity - 75) / 20.0);
    } else {
      this.rainSystem.material.opacity = 0.0;
    }

    // 3. Plant Stem & Leaf Growth
    const growthProgress = Math.min(1.0, heightCm / 42.0);
    const stemH = 0.18 + growthProgress * 0.95;
    this.stemMesh.scale.set(1.0 + dryWeightGrams * 0.12, stemH / this.stemHeight, 1.0 + dryWeightGrams * 0.12);
    this.stemMesh.position.y = stemH / 2;

    // Turgor wilting physics
    const turgorFactor = sensors.vpd > 1.6 ? Math.max(0.35, 1.0 - (sensors.vpd - 1.6) * 0.9) : 1.0;
    const visibleLeafCount = Math.min(this.leaves.length, Math.floor(2 + dryWeightGrams * 1.6));

    // Rich Lutein Color Shift: Forest Green (#2d6a4f) -> Rich Golden-Amber (#d97706)
    const luteinRatio = Math.min(1.0, Math.max(0.0, (luteinConcentration - 2.0) / 3.0));
    const targetLeafColor = new THREE.Color(
      0.17 + luteinRatio * 0.68, // Rich amber red
      0.42 + luteinRatio * 0.05, // Rich green-gold
      0.31 - luteinRatio * 0.25  // Blue drops
    );

    this.leaves.forEach((l, idx) => {
      if (idx < visibleLeafCount) {
        const leafProgress = Math.min(1.0, (growthProgress * 1.4) - (idx * 0.06));
        const lScale = Math.max(0.12, leafProgress * 1.05);
        l.mesh.scale.set(lScale, lScale, lScale);

        const posY = stemH * l.nodeHeightRatio;
        l.mesh.position.set(0, posY, 0);

        const droopPitch = (1.0 - turgorFactor) * 0.75;
        l.mesh.rotation.set(0.40 + droopPitch, l.baseAngle, 0.12);
        l.mesh.material.color.lerp(targetLeafColor, 0.08);
      } else {
        l.mesh.scale.set(0.001, 0.001, 0.001);
      }
    });

    // Flower Blooming
    if (dryWeightGrams > 2.0 && cropProfile.id === "marigold_lutein") {
      this.flowerGroup.position.y = stemH;
      const flowerScale = Math.min(1.1, (dryWeightGrams - 2.0) * 0.32);
      this.flowerGroup.scale.set(flowerScale, flowerScale, flowerScale);
    } else {
      this.flowerGroup.scale.set(0.001, 0.001, 0.001);
    }
  }

  animate() {
    requestAnimationFrame(this.animate);
    this.time += 0.025;

    if (this.controls) this.controls.update();

    // 1. Rain Misting Animation
    if (this.rainSystem && this.rainSystem.material.opacity > 0.01) {
      const pos = this.rainSystem.geometry.attributes.position.array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 1] -= 0.035;
        if (pos[i * 3 + 1] < 0.2) pos[i * 3 + 1] = 2.0;
      }
      this.rainSystem.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Breeze Particles Animation
    if (this.breezeSystem) {
      const pos = this.breezeSystem.geometry.attributes.position.array;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 0] += 0.014 * this.windStrength;
        if (pos[i * 3 + 0] > 1.4) pos[i * 3 + 0] = -1.4;
      }
      this.breezeSystem.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Gentle Organic Wind Sway
    if (this.plantGroup) {
      const windSwayZ = Math.sin(this.time * 1.6) * (0.02 * this.windStrength);
      const windSwayX = Math.cos(this.time * 1.2) * (0.012 * this.windStrength);
      this.plantGroup.rotation.z = windSwayZ;
      this.plantGroup.rotation.x = windSwayX;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  resetCamera() {
    if (this.camera && this.controls) {
      this.camera.position.set(0, 1.1, 2.7);
      this.controls.target.set(0, 0.55, 0);
      this.controls.update();
    }
  }
}
