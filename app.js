import { BioPhysicalEngine } from "./biophysical-model.js";
import { PlantProfileManager } from "./plant-profile-manager.js";
import { EnvironmentalEngine } from "./environmental-engine.js";
import { ThreePlantChamber } from "./three-plant-chamber.js";
import { LiveTelemetryCharts } from "./live-telemetry-charts.js";
import { CyberAudioEngine } from "./sound-effects.js";
import { DataExporter } from "./data-exporter.js";
import { AutonomousAiOptimizer } from "./autonomous-ai-optimizer.js";
import { DiurnalScheduler } from "./diurnal-scheduler.js";

// Core Engines
const bioEngine = new BioPhysicalEngine();
const profileManager = new PlantProfileManager();
const envEngine = new EnvironmentalEngine();
const audio = new CyberAudioEngine();
const aiOptimizer = new AutonomousAiOptimizer();
const diurnalScheduler = new DiurnalScheduler();

let plantChamber3d = null;
let telemetryCharts = null;
let isAiAutoPilotActive = false;
let currentOptimizationObjective = 'yield_max';

// Dynamic Plant Biological State (Continuous ODE integrated state)
const plantState = {
  dryWeightGrams: 0.12,
  freshWeightGrams: 1.4,
  heightCm: 2.2,
  leafCount: 2,
  lai: 0.08,
  luteinConcentration: 3.4, // mg/g DW
  totalLuteinAccumulatedMg: 0.28,
  leafDryWeightGrams: 0.08
};

// Application Loop State
let isRunning = true;
let lastTimestamp = performance.now();

// DOM References
const DOM = {
  cropSelect: document.getElementById("cropSelect"),
  targetMoleculeText: document.getElementById("targetMoleculeText"),
  dliBadge: document.getElementById("dliBadge"),
  ppfdDisplay: document.getElementById("ppfdDisplay"),
  anLiveDisplay: document.getElementById("anLiveDisplay"),

  // Telemetry Strip
  telemetryPpfd: document.getElementById("telemetryPpfd"),
  telemetryAirTemp: document.getElementById("telemetryAirTemp"),
  telemetryLeafTemp: document.getElementById("telemetryLeafTemp"),
  telemetryVpd: document.getElementById("telemetryVpd"),
  telemetryRh: document.getElementById("telemetryRh"),
  telemetryCo2: document.getElementById("telemetryCo2"),
  telemetryEc: document.getElementById("telemetryEc"),
  telemetryFvFm: document.getElementById("telemetryFvFm"),

  // Sliders
  sliderPpfd: document.getElementById("sliderPpfd"),
  ppfdVal: document.getElementById("ppfdVal"),
  sliderPhotoperiod: document.getElementById("sliderPhotoperiod"),
  photoperiodVal: document.getElementById("photoperiodVal"),
  sliderRed: document.getElementById("sliderRed"),
  valRed: document.getElementById("valRed"),
  sliderBlue: document.getElementById("sliderBlue"),
  valBlue: document.getElementById("valBlue"),
  sliderGreen: document.getElementById("sliderGreen"),
  valGreen: document.getElementById("valGreen"),
  sliderFarRed: document.getElementById("sliderFarRed"),
  valFarRed: document.getElementById("valFarRed"),

  sliderDayTemp: document.getElementById("sliderDayTemp"),
  dayTempVal: document.getElementById("dayTempVal"),
  sliderNightTemp: document.getElementById("sliderNightTemp"),
  nightTempVal: document.getElementById("nightTempVal"),
  sliderHumidity: document.getElementById("sliderHumidity"),
  humidityVal: document.getElementById("humidityVal"),
  sliderCo2: document.getElementById("sliderCo2"),
  co2Val: document.getElementById("co2Val"),
  sliderEc: document.getElementById("sliderEc"),
  ecVal: document.getElementById("ecVal"),

  checkUvb: document.getElementById("checkUvb"),
  checkColdShift: document.getElementById("checkColdShift"),

  // 3D Viewport Controls
  diurnalStatusLabel: document.getElementById("diurnalStatusLabel"),
  btnResetCamera: document.getElementById("btnResetCamera"),

  // Timeline
  timelineSlider: document.getElementById("timelineSlider"),
  timelineDayLabel: document.getElementById("timelineDayLabel"),
  btnPlay: document.getElementById("btnPlay"),
  btnReset: document.getElementById("btnReset"),

  // KPIs
  kpiTotalLutein: document.getElementById("kpiTotalLutein"),
  kpiIncrease: document.getElementById("kpiIncrease"),
  kpiLuteinConc: document.getElementById("kpiLuteinConc"),
  kpiFreshWeight: document.getElementById("kpiFreshWeight"),
  kpiDryWeight: document.getElementById("kpiDryWeight"),
  kpiEnergyEff: document.getElementById("kpiEnergyEff"),

  // Canvases & 3D Container
  plant3dContainer: document.getElementById("plant3dContainer"),
  photoScopeChart: document.getElementById("photoScopeChart"),
  luteinScopeChart: document.getElementById("luteinScopeChart"),

  // Modals & Action buttons
  btnSoundToggle: document.getElementById("btnSoundToggle"),
  btnOpenParamEditor: document.getElementById("btnOpenParamEditor"),
  paramModal: document.getElementById("paramModal"),
  paramClose: document.getElementById("paramClose"),
  paramEditorGrid: document.getElementById("paramEditorGrid"),
  btnSaveParams: document.getElementById("btnSaveParams"),
  btnExportProfile: document.getElementById("btnExportProfile"),

  btnExportMenu: document.getElementById("btnExportMenu"),
  exportModal: document.getElementById("exportModal"),
  exportClose: document.getElementById("exportClose"),
  btnExportCSV: document.getElementById("btnExportCSV"),
  btnCapture4K: document.getElementById("btnCapture4K"),
  btnExportPlc: document.getElementById("btnExportPlc"),
  btnExportP2HModal: document.getElementById("btnExportP2HModal"),

  btnAutoTune: document.getElementById("btnAutoTune"),
  recipeModal: document.getElementById("recipeModal"),
  modalRecipeTitle: document.getElementById("modalRecipeTitle"),
  modalRecipeCode: document.getElementById("modalRecipeCode"),
  modalClose: document.getElementById("modalClose"),
  btnApplyRecipe: document.getElementById("btnApplyRecipe"),
  optTabs: document.querySelectorAll(".opt-tab"),
  optYieldGain: document.getElementById("optYieldGain"),
  optDaysSaved: document.getElementById("optDaysSaved"),
  optNetAn: document.getElementById("optNetAn"),
  optTotalRuns: document.getElementById("optTotalRuns"),

  // AI Auto-Pilot Controls
  btnAiAutoPilot: document.getElementById("btnAiAutoPilot"),
  aiAutoPilotLabel: document.getElementById("aiAutoPilotLabel"),

  // 3D Holographic Bio-HUD Pin
  hologramBioHud: document.getElementById("hologramBioHud"),
  hudNodeTitle: document.getElementById("hudNodeTitle"),
  hudPinClose: document.getElementById("hudPinClose"),
  hudLeafTemp: document.getElementById("hudLeafTemp"),
  hudNetAn: document.getElementById("hudNetAn"),
  hudMoleculeConc: document.getElementById("hudMoleculeConc"),
  hudStomatalGs: document.getElementById("hudStomatalGs"),

  // New Crop Registration Modal DOM
  btnOpenNewCropModal: document.getElementById("btnOpenNewCropModal"),
  newCropModal: document.getElementById("newCropModal"),
  newCropClose: document.getElementById("newCropClose"),
  btnCancelNewCrop: document.getElementById("btnCancelNewCrop"),
  btnSubmitNewCrop: document.getElementById("btnSubmitNewCrop"),
  newCropForm: document.getElementById("newCropForm"),
  presetButtons: document.querySelectorAll(".preset-pill"),

  // Form Fields
  regName: document.getElementById("regName"),
  regScientific: document.getElementById("regScientific"),
  regMolecule: document.getElementById("regMolecule"),
  regFormula: document.getElementById("regFormula"),
  regPubChem: document.getElementById("regPubChem"),
  regMolWeight: document.getElementById("regMolWeight"),
  regMorphology: document.getElementById("regMorphology"),
  regHarvestDays: document.getElementById("regHarvestDays"),
  regTempOpt: document.getElementById("regTempOpt"),
  regVcmax: document.getElementById("regVcmax"),
  regBaseConc: document.getElementById("regBaseConc"),
  regColor: document.getElementById("regColor"),

  genericCodeModal: document.getElementById("genericCodeModal"),
  genericModalTitle: document.getElementById("genericModalTitle"),
  genericModalCode: document.getElementById("genericModalCode"),
  genericModalClose: document.getElementById("genericModalClose"),
  btnGenericCopy: document.getElementById("btnGenericCopy"),

  // Time Scale Zoom Buttons
  scaleButtons: document.querySelectorAll(".scale-btn"),

  // Diurnal Scheduler Modal DOM
  btnOpenScheduler: document.getElementById("btnOpenScheduler"),
  schedulerModal: document.getElementById("schedulerModal"),
  schedulerClose: document.getElementById("schedulerClose"),
  btnExportDiurnalPlc: document.getElementById("btnExportDiurnalPlc"),
  btnApplyDiurnalSchedule: document.getElementById("btnApplyDiurnalSchedule"),

  warpButtons: document.querySelectorAll(".warp-btn")
};

function populateCropDropdown(selectedId = null) {
  const profiles = profileManager.getAllProfiles();
  DOM.cropSelect.innerHTML = "";
  profiles.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    if (selectedId ? p.id === selectedId : p.id === profileManager.activeProfileId) {
      opt.selected = true;
    }
    DOM.cropSelect.appendChild(opt);
  });
}

// Initialize Application
function initApp() {
  populateCropDropdown();

  plantChamber3d = new ThreePlantChamber(DOM.plant3dContainer);
  telemetryCharts = new LiveTelemetryCharts({
    photoScope: DOM.photoScopeChart,
    luteinScope: DOM.luteinScopeChart
  });

  // Wire 3D Raycasting Bio-HUD Pin Callback
  plantChamber3d.setNodeClickCallback((data) => {
    audio.playPulse();
    const crop = profileManager.getActiveProfile();
    const envTele = envEngine.getLiveSensorTelemetry();
    const instantPhoto = bioEngine.calculateInstantaneousPhotosynthesis({
      ppfd: envTele.sensors.ppfd,
      airTemp: envTele.sensors.airTemp,
      humidity: envTele.sensors.humidity,
      co2Air: envTele.sensors.co2,
      vpdAir: envTele.sensors.vpd,
      spectrum: envTele.sensors.spectrum
    }, crop);

    DOM.hudNodeTitle.textContent = data.nodeType;
    DOM.hudLeafTemp.textContent = `${instantPhoto.stomata.leafTemp} °C`;
    DOM.hudNetAn.textContent = `${instantPhoto.netAn.toFixed(2)} μmol`;
    DOM.hudMoleculeConc.textContent = `${plantState.luteinConcentration.toFixed(2)} mg/g DW`;
    DOM.hudStomatalGs.textContent = `${instantPhoto.stomata.gs.toFixed(3)} mol`;

    DOM.hologramBioHud.style.left = `${data.screenX}px`;
    DOM.hologramBioHud.style.top = `${data.screenY}px`;
    DOM.hologramBioHud.classList.add("active");
  });

  DOM.hudPinClose.addEventListener("click", () => {
    DOM.hologramBioHud.classList.remove("active");
    if (plantChamber3d) plantChamber3d.clearPin();
  });

  bindEventListeners();
  buildParamEditor();
  resetPlantState();

  // Start 60 FPS Real-time Simulation Loop
  requestAnimationFrame(simulationLoop);
}

function bindEventListeners() {
  // Audio Toggle
  DOM.btnSoundToggle.addEventListener("click", () => {
    audio.enabled = !audio.enabled;
    DOM.btnSoundToggle.innerHTML = audio.enabled 
      ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`
      : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;
  });

  // Crop Selector
  DOM.cropSelect.addEventListener("change", (e) => {
    audio.playClick();
    profileManager.setActiveProfile(e.target.value);
    const crop = profileManager.getActiveProfile();
    DOM.targetMoleculeText.textContent = `${crop.targetMolecule} (${crop.chemicalFormula})`;
    if (plantChamber3d) {
      plantChamber3d.setCropSpecies(crop);
    }
    buildParamEditor();
    resetPlantState();
  });

  // New Crop Registration Modal Handlers
  DOM.btnOpenNewCropModal.addEventListener("click", () => {
    audio.playPulse();
    DOM.newCropModal.classList.add("active");
  });

  const closeNewCropModal = () => DOM.newCropModal.classList.remove("active");
  DOM.newCropClose.addEventListener("click", closeNewCropModal);
  DOM.btnCancelNewCrop.addEventListener("click", closeNewCropModal);

  DOM.presetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      audio.playClick();
      const presetKey = btn.getAttribute("data-preset");
      fillPresetForm(presetKey);
    });
  });

  DOM.btnSubmitNewCrop.addEventListener("click", submitNewCropForm);

  DOM.btnResetCamera.addEventListener("click", () => {
    audio.playClick();
    if (plantChamber3d) plantChamber3d.resetCamera();
  });

  // Time Warp Speed Buttons
  DOM.warpButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      audio.playClick();
      DOM.warpButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const speed = parseFloat(btn.getAttribute("data-speed"));
      envEngine.setTimeWarp(speed);
    });
  });

  // Sliders Handlers
  const bindSlider = (slider, displayEl, unit, callback) => {
    slider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      displayEl.textContent = `${val} ${unit}`;
      callback(val);
    });
  };

  bindSlider(DOM.sliderPpfd, DOM.ppfdVal, "μmol/m²/s", (val) => {
    envEngine.updateSetpoints({ ppfdTarget: val });
    DOM.ppfdDisplay.textContent = `${val} μmol`;
  });

  bindSlider(DOM.sliderPhotoperiod, DOM.photoperiodVal, "시간/일", (val) => {
    envEngine.updateSetpoints({ photoperiodHours: val });
  });

  bindSlider(DOM.sliderDayTemp, DOM.dayTempVal, "°C", (val) => {
    envEngine.updateSetpoints({ dayTempTarget: val });
  });

  bindSlider(DOM.sliderNightTemp, DOM.nightTempVal, "°C", (val) => {
    envEngine.updateSetpoints({ nightTempTarget: val });
  });

  bindSlider(DOM.sliderHumidity, DOM.humidityVal, "%", (val) => {
    envEngine.updateSetpoints({ humidityTarget: val });
  });

  bindSlider(DOM.sliderCo2, DOM.co2Val, "ppm", (val) => {
    envEngine.updateSetpoints({ co2Target: val });
  });

  bindSlider(DOM.sliderEc, DOM.ecVal, "dS/m", (val) => {
    envEngine.updateSetpoints({ ecTarget: val });
  });

  // Spectrum Handlers
  const spectrumControls = [
    { el: DOM.sliderRed, disp: DOM.valRed, key: "red" },
    { el: DOM.sliderBlue, disp: DOM.valBlue, key: "blue" },
    { el: DOM.sliderGreen, disp: DOM.valGreen, key: "green" },
    { el: DOM.sliderFarRed, disp: DOM.valFarRed, key: "farRed" }
  ];

  spectrumControls.forEach(({ el, disp, key }) => {
    el.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      disp.textContent = `${val}%`;
      const currentSpectrum = { ...envEngine.setpoints.spectrum, [key]: val };
      envEngine.updateSetpoints({ spectrum: currentSpectrum });
    });
  });

  // Switches
  DOM.checkUvb.addEventListener("change", (e) => {
    if (e.target.checked) audio.playUvElicitationTone();
    else audio.playClick();
    envEngine.updateSetpoints({ uvbActive: e.target.checked });
  });

  DOM.checkColdShift.addEventListener("change", (e) => {
    audio.playClick();
    envEngine.updateSetpoints({ coldShiftActive: e.target.checked });
  });

  // Timeline & Playback
  DOM.btnPlay.addEventListener("click", () => {
    audio.playClick();
    isRunning = !isRunning;
    DOM.btnPlay.innerHTML = isRunning 
      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`
      : `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
  });

  DOM.btnReset.addEventListener("click", () => {
    audio.playClick();
    resetPlantState();
  });

  // Time Scale Zoom Pills Handlers
  DOM.scaleButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      audio.playClick();
      const scale = btn.getAttribute("data-scale");
      DOM.scaleButtons.forEach(b => {
        if (b.getAttribute("data-scale") === scale) b.classList.add("active");
        else b.classList.remove("active");
      });
      if (telemetryCharts) telemetryCharts.setTimeScale(scale);
    });
  });

  // Diurnal Scheduler Modal
  if (DOM.btnOpenScheduler) {
    DOM.btnOpenScheduler.addEventListener("click", () => {
      audio.playPulse();
      DOM.schedulerModal.classList.add("active");
    });
  }
  if (DOM.schedulerClose) {
    DOM.schedulerClose.addEventListener("click", () => DOM.schedulerModal.classList.remove("active"));
  }

  if (DOM.btnExportDiurnalPlc) {
    DOM.btnExportDiurnalPlc.addEventListener("click", () => {
      audio.playPulse();
      const crop = profileManager.getActiveProfile();
      const timetable = diurnalScheduler.generate24HourPlcTimetable(crop);
      DOM.genericModalTitle.textContent = `24시간 스마트팜 PLC 스케줄: ${crop.name}`;
      DOM.genericModalCode.textContent = JSON.stringify(timetable, null, 2);
      DOM.genericCodeModal.classList.add("active");
    });
  }

  if (DOM.btnApplyDiurnalSchedule) {
    DOM.btnApplyDiurnalSchedule.addEventListener("click", () => {
      audio.playPulse();
      diurnalScheduler.enabled = true;
      DOM.schedulerModal.classList.remove("active");
      alert("🌿 스마트팜 24시간 자동 일주기 스케줄러가 활성화되었습니다!\n(일출 디밍 -> 피크 광합성 -> 일몰 Far-Red -> 야간 변온 DIF가 실시간 자동 제어됩니다)");
    });
  }

  DOM.timelineSlider.addEventListener("input", (e) => {
    const targetDay = parseInt(e.target.value, 10);
    seekToDay(targetDay);
  });

  // Modals & Exporters
  DOM.btnOpenParamEditor.addEventListener("click", () => {
    audio.playClick();
    buildParamEditor();
    DOM.paramModal.classList.add("active");
  });
  DOM.paramClose.addEventListener("click", () => DOM.paramModal.classList.remove("active"));
  DOM.btnSaveParams.addEventListener("click", saveEditedParams);
  DOM.btnExportProfile.addEventListener("click", exportProfileJson);

  DOM.btnExportMenu.addEventListener("click", () => {
    audio.playClick();
    DOM.exportModal.classList.add("active");
  });
  DOM.exportClose.addEventListener("click", () => DOM.exportModal.classList.remove("active"));

  DOM.btnExportCSV.addEventListener("click", () => {
    audio.playPulse();
    DataExporter.exportTelemetryCSV(telemetryCharts.history, profileManager.getActiveProfile(), envEngine.setpoints);
  });

  DOM.btnCapture4K.addEventListener("click", () => {
    audio.playPulse();
    const canvas = DOM.plant3dContainer.querySelector("canvas");
    DataExporter.captureCanvasSnapshot(canvas, `BioFoundry_4K_${profileManager.getActiveProfile().id}.png`);
  });

  DOM.btnExportPlc.addEventListener("click", () => {
    audio.playClick();
    const plcData = DataExporter.generateSmartFarmScript(profileManager.getActiveProfile(), envEngine, plantState);
    showGenericCodeModal("📜 스마트팜 BACnet / MQTT PLC 제어 스크립트", plcData);
  });

  DOM.btnExportP2HModal.addEventListener("click", () => {
    audio.playClick();
    const p2hData = generatePlant2HumanPayload();
    showGenericCodeModal("🔗 Plant2Human AI (localhost:3006) 바이오 파운드리 페이로드", p2hData);
  });

  DOM.btnAutoTune.addEventListener("click", showAutoTuneModal);
  DOM.modalClose.addEventListener("click", () => DOM.recipeModal.classList.remove("active"));
  DOM.btnApplyRecipe.addEventListener("click", applyAutoTuneRecipe);

  // AI Auto-Pilot Toggle
  DOM.btnAiAutoPilot.addEventListener("click", toggleAiAutoPilot);

  // AI Optimizer Objective Tabs
  DOM.optTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      audio.playClick();
      DOM.optTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      currentOptimizationObjective = tab.getAttribute("data-obj");
      runOptimizationAndDisplay();
    });
  });
}

function resetPlantState() {
  const crop = profileManager.getActiveProfile();
  envEngine.simulatedTotalSeconds = 0;
  envEngine.simulatedDay = 1;
  envEngine.simulatedHour = 6.0;

  plantState.dryWeightGrams = 0.10;
  plantState.freshWeightGrams = 1.2;
  plantState.heightCm = 1.8;
  plantState.leafCount = 2;
  plantState.lai = 0.05;
  plantState.luteinConcentration = crop.baseLuteinConcentration;
  plantState.totalLuteinAccumulatedMg = 0.15;
  plantState.leafDryWeightGrams = 0.06;

  DOM.timelineSlider.max = crop.harvestDays;
  DOM.timelineSlider.value = 1;
}

function seekToDay(targetDay) {
  const crop = profileManager.getActiveProfile();
  const dayClamped = Math.min(crop.harvestDays, Math.max(1, targetDay));
  envEngine.simulatedTotalSeconds = (dayClamped - 1) * 86400 + 8 * 3600;
  envEngine.simulatedDay = dayClamped;
  envEngine.simulatedHour = 8.0;

  const progress = (dayClamped - 1) / (crop.harvestDays - 1);
  const logistic = 1 / (1 + Math.exp(-0.2 * (dayClamped - 20)));

  plantState.dryWeightGrams = 0.1 + 6.5 * logistic;
  plantState.freshWeightGrams = plantState.dryWeightGrams * 11.2;
  plantState.heightCm = 2.0 + 38.0 * logistic;
  plantState.leafCount = Math.floor(2 + dayClamped * 0.7);
  plantState.lai = 0.05 + (crop.maxLai - 0.05) * logistic;
  plantState.leafDryWeightGrams = plantState.dryWeightGrams * crop.leafPartitionRatio;
  plantState.luteinConcentration = crop.baseLuteinConcentration * (1.0 + (envEngine.setpoints.uvbActive && dayClamped >= (crop.harvestDays - 7) ? 0.6 : 0.2));
  plantState.totalLuteinAccumulatedMg = plantState.luteinConcentration * plantState.leafDryWeightGrams;
}

/**
 * 60 FPS Real-time continuous ODE physics simulation loop
 */
function simulationLoop(now) {
  const dtRealSeconds = Math.min(0.1, (now - lastTimestamp) / 1000.0);
  lastTimestamp = now;

  if (isRunning) {
    // 1. Advance Environment Physics
    envEngine.tick(dtRealSeconds);

    const crop = profileManager.getActiveProfile();
    const envTele = envEngine.getLiveSensorTelemetry();

    // 1-1. Apply Diurnal Timetable Schedule if enabled (and not overridden by AI Auto-Pilot)
    if (diurnalScheduler.enabled && !isAiAutoPilotActive) {
      const scheduled = diurnalScheduler.getScheduledSetpoints(envTele.simulatedHour);
      if (scheduled) {
        envEngine.updateSetpoints({
          ppfdTarget: scheduled.ppfd,
          dayTempTarget: scheduled.temp,
          humidityTarget: scheduled.humidity,
          co2Target: scheduled.co2,
          spectrum: scheduled.spectrum,
          uvbActive: scheduled.uvb
        });
      }
    }

    // 2. Compute Farquhar-von Caemmerer-Berry Photosynthesis
    const instantPhoto = bioEngine.calculateInstantaneousPhotosynthesis({
      ppfd: envTele.sensors.ppfd,
      airTemp: envTele.sensors.airTemp,
      humidity: envTele.sensors.humidity,
      co2Air: envTele.sensors.co2,
      vpdAir: envTele.sensors.vpd,
      spectrum: envTele.sensors.spectrum
    }, crop);

    // 3. Compute Molecular Farming Lutein Biosynthetic Flux
    const isLateStage = envTele.simulatedDay >= (crop.harvestDays - 7);
    const molecularFlux = bioEngine.calculateSecondaryMetaboliteFlux(instantPhoto, {
      ppfd: envTele.sensors.ppfd,
      spectrum: envTele.sensors.spectrum,
      uvbActive: envEngine.setpoints.uvbActive && isLateStage,
      coldShockActive: envEngine.setpoints.coldShiftActive && isLateStage,
      ec: envTele.sensors.ec
    }, crop, plantState);

    // 4. Numerical Integration (Euler ODE step per dtSimSeconds)
    const dtSimSeconds = dtRealSeconds * envEngine.timeWarp;
    const dtSimHours = dtSimSeconds / 3600.0;

    const lightInterception = 1 - Math.exp(-crop.k_extinction * plantState.lai);
    const netAnGramsPerM2Hour = (instantPhoto.netAn * 3600 * 30) / 1000000.0;
    const plantGroundAreaM2 = 0.04;
    const dBiomassGrams = Math.max(0, netAnGramsPerM2Hour * lightInterception * plantGroundAreaM2 * dtSimHours);

    plantState.dryWeightGrams += dBiomassGrams;
    plantState.freshWeightGrams = plantState.dryWeightGrams * 11.0;
    plantState.leafDryWeightGrams = plantState.dryWeightGrams * crop.leafPartitionRatio;

    const leafAreaM2 = (plantState.leafDryWeightGrams / 1000.0) * crop.sla;
    plantState.lai = Math.min(crop.maxLai, leafAreaM2 / plantGroundAreaM2);
    plantState.heightCm = Math.min(48.0, 2.0 + Math.pow(plantState.dryWeightGrams, 0.65) * 12.0);
    plantState.leafCount = Math.min(32, Math.floor(2 + (plantState.dryWeightGrams / 0.35)));

    // Lutein Accumulation Pool Integration
    const dLuteinMg = molecularFlux.hourlyPlantFlux * dtSimHours;
    plantState.totalLuteinAccumulatedMg += dLuteinMg;
    plantState.luteinConcentration = plantState.leafDryWeightGrams > 0 
      ? (plantState.totalLuteinAccumulatedMg / plantState.leafDryWeightGrams) 
      : crop.baseLuteinConcentration;

    // 5. Update UI Telemetry Readouts
    DOM.telemetryPpfd.textContent = `${envTele.sensors.ppfd} μmol`;
    DOM.telemetryAirTemp.textContent = `${envTele.sensors.airTemp} °C`;
    DOM.telemetryLeafTemp.textContent = `${instantPhoto.stomata.leafTemp} °C`;
    DOM.telemetryVpd.textContent = `${envTele.sensors.vpd} kPa`;
    DOM.telemetryRh.textContent = `${envTele.sensors.humidity} %`;
    DOM.telemetryCo2.textContent = `${envTele.sensors.co2} ppm`;
    DOM.telemetryEc.textContent = `${envTele.sensors.ec} dS/m`;
    DOM.telemetryFvFm.textContent = `${instantPhoto.fvFm}`;

    const dli = (envEngine.setpoints.ppfdTarget * envEngine.setpoints.photoperiodHours * 3600) / 1000000.0;
    DOM.dliBadge.textContent = `DLI: ${dli.toFixed(1)} mol/m²d`;
    DOM.anLiveDisplay.textContent = `${instantPhoto.netAn.toFixed(2)} μmol/m²s`;
    const dayStr = String(envTele.simulatedDay).padStart(2, '0');
    const maxDayStr = String(crop.harvestDays).padStart(2, '0');
    DOM.timelineDayLabel.textContent = `Day ${dayStr} / ${maxDayStr} (${envTele.timeFormatted})`;
    DOM.timelineSlider.value = envTele.simulatedDay;

    const isDay = envTele.simulatedHour >= 6.0 && envTele.simulatedHour < 22.0;
    const sunSvg = `<svg class="hud-svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffd32a" stroke-width="2.2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line></svg>`;
    const moonSvg = `<svg class="hud-svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a29bfe" stroke-width="2.2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    DOM.diurnalStatusLabel.innerHTML = isDay 
      ? `${sunSvg} <span>주간 광합성 사이클 (${envTele.timeFormatted})</span>` 
      : `${moonSvg} <span>야간 암호흡 휴면 (${envTele.timeFormatted})</span>`;

    // Update KPI Scorecards
    DOM.kpiTotalLutein.textContent = `${plantState.totalLuteinAccumulatedMg.toFixed(2)} mg`;
    const baselineYield = crop.baseLuteinConcentration * (crop.harvestDays * 0.12);
    const increasePct = baselineYield > 0 ? ((plantState.totalLuteinAccumulatedMg - baselineYield) / baselineYield) * 100 : 0;
    DOM.kpiIncrease.textContent = `${increasePct >= 0 ? '+' : ''}${increasePct.toFixed(0)}% (표준재배 대비)`;

    DOM.kpiLuteinConc.textContent = `${plantState.luteinConcentration.toFixed(2)} mg/g`;
    DOM.kpiFreshWeight.textContent = `${plantState.freshWeightGrams.toFixed(1)} g`;
    DOM.kpiDryWeight.textContent = `건중량 ${plantState.dryWeightGrams.toFixed(2)}g`;

    const totalKwh = (envEngine.setpoints.ppfdTarget / 2.4 * envEngine.setpoints.photoperiodHours * envTele.simulatedDay) / 1000.0;
    const mgPerKwh = totalKwh > 0 ? (plantState.totalLuteinAccumulatedMg / totalKwh) : 0;
    DOM.kpiEnergyEff.textContent = `${mgPerKwh.toFixed(2)} mg/kWh`;

    // 6. Push to Streaming Oscilloscope Charts
    telemetryCharts.pushTelemetryPoint({
      an: instantPhoto.netAn,
      transpiration: instantPhoto.stomata.transpirationRate,
      luteinFlux: molecularFlux.hourlyPlantFlux,
      luteinTotal: plantState.totalLuteinAccumulatedMg,
      biomass: plantState.dryWeightGrams,
      leafTemp: instantPhoto.stomata.leafTemp,
      airTemp: envTele.sensors.airTemp,
      vpd: envTele.sensors.vpd
    });

    // 7. Update True 3D Physical Bioreactor Plant & Lighting
    if (plantChamber3d) plantChamber3d.updateSimulation(plantState, envTele, crop);

    // 8. Update live Raycast Bio-HUD tracking position & metrics if pinned
    if (plantChamber3d && plantChamber3d.pinned3DWorldPos && DOM.hologramBioHud.classList.contains("active")) {
      const sp = plantChamber3d.project3DToScreen(plantChamber3d.pinned3DWorldPos);
      if (sp.visible) {
        DOM.hologramBioHud.style.left = `${sp.x}px`;
        DOM.hologramBioHud.style.top = `${sp.y}px`;
        DOM.hudLeafTemp.textContent = `${instantPhoto.stomata.leafTemp} °C`;
        DOM.hudNetAn.textContent = `${instantPhoto.netAn.toFixed(2)} μmol`;
        DOM.hudMoleculeConc.textContent = `${plantState.luteinConcentration.toFixed(2)} mg/g DW`;
        DOM.hudStomatalGs.textContent = `${instantPhoto.stomata.gs.toFixed(3)} mol`;
      }
    }
  }

  requestAnimationFrame(simulationLoop);
}

function buildParamEditor() {
  const crop = profileManager.getActiveProfile();
  DOM.paramEditorGrid.innerHTML = "";

  const editableFields = [
    { key: "vcmax25", label: "Vcmax25 (최대 루비스코 탄소고정 속도)", unit: "μmol/m²s" },
    { key: "jmax25", label: "Jmax25 (최대 전자전달 속도)", unit: "μmol e-/m²s" },
    { key: "rd25", label: "Rd25 (미토콘드리아 암호흡)", unit: "μmol/m²s" },
    { key: "gs_max", label: "gs_max (최대 기공전도도)", unit: "mol H2O/m²s" },
    { key: "sla", label: "SLA (비엽면적 Specific Leaf Area)", unit: "m²/kg DW" },
    { key: "maxLai", label: "최대 엽면적지수 (Max LAI)", unit: "" },
    { key: "k_extinction", label: "군락 광소멸계수 (k)", unit: "" },
    { key: "baseLuteinConcentration", label: "기저 루테인 농도 (Base Lutein)", unit: "mg/g DW" },
    { key: "tempOpt", label: "최적 생육 온도 (Temp Opt)", unit: "°C" },
    { key: "vpdOptMin", label: "최적 하한 VPD (VPD Min)", unit: "kPa" },
    { key: "vpdOptMax", label: "최적 상한 VPD (VPD Max)", unit: "kPa" },
    { key: "harvestDays", label: "총 재배 일수 (Harvest Days)", unit: "일" }
  ];

  editableFields.forEach(({ key, label, unit }) => {
    const div = document.createElement("div");
    div.className = "param-field";
    div.innerHTML = `
      <label>${label} ${unit ? `(${unit})` : ''}</label>
      <input type="number" id="param_${key}" step="0.1" value="${crop[key]}">
    `;
    DOM.paramEditorGrid.appendChild(div);
  });
}

function saveEditedParams() {
  audio.playClick();
  const inputs = DOM.paramEditorGrid.querySelectorAll("input");
  inputs.forEach((input) => {
    const key = input.id.replace("param_", "");
    profileManager.updateParameter(key, input.value);
  });
  DOM.paramModal.classList.remove("active");
}

function exportProfileJson() {
  audio.playClick();
  const jsonStr = profileManager.exportProfileJson();
  navigator.clipboard.writeText(jsonStr).then(() => {
    alert("식물 생물리학/유전체 파라미터 JSON이 클립보드에 복사되었습니다.");
  });
}

let pendingOptimizationResult = null;

function showAutoTuneModal() {
  audio.playPulse();
  runOptimizationAndDisplay();
  DOM.recipeModal.classList.add("active");
}

function runOptimizationAndDisplay() {
  const crop = profileManager.getActiveProfile();
  const res = aiOptimizer.searchOptimalEnvironment(crop, currentOptimizationObjective);
  pendingOptimizationResult = res;

  DOM.modalRecipeTitle.innerHTML = `<svg class="hud-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/></svg> AI 역추적 최적화: <b>${crop.name}</b> (${crop.targetMolecule})`;
  DOM.optYieldGain.textContent = `+${res.improvements.yieldGainPercent}%`;
  DOM.optDaysSaved.textContent = `-${res.improvements.daysSaved}일 (${res.improvements.acceleratedDays}일차)`;
  DOM.optNetAn.textContent = `${res.improvements.netPhotosynthesis} μmol`;
  DOM.optTotalRuns.textContent = `${res.totalSimulations}회 가상 탐색`;

  const recipe = res.optimalRecipe;
  const displayObj = {
    targetObjective: res.objective === 'yield_max' ? "🥇 분자 수확량 극대화" : (res.objective === 'speed_breeding' ? "⚡ 초고속 생육 가속" : "🌱 전력당 경제성 극대화"),
    optimizedSetpoints: {
      ppfd: `${recipe.ppfd} μmol/m²s`,
      spectrum: `R ${recipe.spectrum.red}% | B ${recipe.spectrum.blue}% | G ${recipe.spectrum.green}% | FR ${recipe.spectrum.farRed}%`,
      dayTemperature: `${recipe.dayTemp} °C`,
      nightTemperature: `${recipe.nightTemp} °C (일교차 DIF: -${(recipe.dayTemp - recipe.nightTemp).toFixed(1)}°C)`,
      carbonDioxide: `${recipe.co2} ppm`,
      targetHumidity: `${recipe.humidity} %`,
      photoperiod: `${recipe.photoperiod} hours/day`,
      nutrientEc: `${recipe.ec} dS/m`,
      uvbElicitation: recipe.uvbActive ? "활성화 (PSY 유전자 발현)" : "비활성"
    },
    scientificBiologicalRationale: res.scientificExplanation
  };

  DOM.modalRecipeCode.textContent = JSON.stringify(displayObj, null, 2);
}

function applyAutoTuneRecipe() {
  audio.playPulse();
  if (!pendingOptimizationResult) return;
  const s = pendingOptimizationResult.optimalRecipe;

  envEngine.updateSetpoints({
    ppfdTarget: s.ppfd,
    photoperiodHours: s.photoperiod,
    spectrum: { ...s.spectrum },
    dayTempTarget: s.dayTemp,
    nightTempTarget: s.nightTemp,
    humidityTarget: s.humidity,
    co2Target: s.co2,
    ecTarget: s.ec,
    uvbActive: s.uvbActive,
    coldShiftActive: s.coldShiftActive
  });

  DOM.sliderPpfd.value = s.ppfd;
  DOM.ppfdVal.textContent = `${s.ppfd} μmol/m²/s`;
  DOM.sliderPhotoperiod.value = s.photoperiod;
  DOM.photoperiodVal.textContent = `${s.photoperiod} 시간/일`;

  DOM.sliderRed.value = s.spectrum.red;
  DOM.valRed.textContent = `${s.spectrum.red}%`;
  DOM.sliderBlue.value = s.spectrum.blue;
  DOM.valBlue.textContent = `${s.spectrum.blue}%`;
  DOM.sliderGreen.value = s.spectrum.green;
  DOM.valGreen.textContent = `${s.spectrum.green}%`;
  DOM.sliderFarRed.value = s.spectrum.farRed;
  DOM.valFarRed.textContent = `${s.spectrum.farRed}%`;

  DOM.sliderDayTemp.value = s.dayTemp;
  DOM.dayTempVal.textContent = `${s.dayTemp} °C`;
  DOM.sliderNightTemp.value = s.nightTemp;
  DOM.nightTempVal.textContent = `${s.nightTemp} °C`;
  DOM.sliderHumidity.value = s.humidity;
  DOM.humidityVal.textContent = `${s.humidity} %`;
  DOM.sliderCo2.value = s.co2;
  DOM.co2Val.textContent = `${s.co2} ppm`;
  DOM.sliderEc.value = s.ec;
  DOM.ecVal.textContent = `${s.ec} dS/m`;

  DOM.checkUvb.checked = s.uvbActive;
  DOM.checkColdShift.checked = s.coldShiftActive;

  setAiAutoPilot(true);
  DOM.recipeModal.classList.remove("active");
  alert(`🤖 AI 자율 제어 모드가 가동되었습니다!\n시뮬레이터가 계산한 이론상 100% 최적 환경(광량 ${s.ppfd}μmol, CO2 ${s.co2}ppm, R:B:G:FR)으로 자동 전환되었습니다.`);
}

function toggleAiAutoPilot() {
  setAiAutoPilot(!isAiAutoPilotActive);
}

function setAiAutoPilot(active) {
  isAiAutoPilotActive = active;
  if (isAiAutoPilotActive) {
    audio.playPulse();
    DOM.btnAiAutoPilot.classList.add("active");
    DOM.aiAutoPilotLabel.textContent = "AI 자율 최적화: ON";
  } else {
    audio.playClick();
    DOM.btnAiAutoPilot.classList.remove("active");
    DOM.aiAutoPilotLabel.textContent = "AI 자율 최적화: OFF";
  }
}

function generatePlant2HumanPayload() {
  const crop = profileManager.getActiveProfile();
  return {
    bridgeProtocol: "Plant2Human-Molecular-Farming-Bridge-v1",
    connectionTarget: "http://localhost:3006/api/molecular-farming",
    linkedProject: "P2H-9942 (눈 건강 루테인 원료)",
    timestamp: new Date().toISOString(),
    moleculeData: {
      pubchemCid: crop.pubchemCid,
      compoundName: crop.targetMolecule,
      formula: crop.chemicalFormula,
      sourceBotanical: crop.name
    },
    digitalTwinSimulation: {
      simulatedDay: envEngine.simulatedDay,
      totalYieldPerPlantMg: parseFloat(plantState.totalLuteinAccumulatedMg.toFixed(2)),
      purityConcentrationMgPerG: parseFloat(plantState.luteinConcentration.toFixed(2)),
      leafAreaIndex: parseFloat(plantState.lai.toFixed(2)),
      recommendedLightSpectrum: `R${envEngine.setpoints.spectrum.red}:B${envEngine.setpoints.spectrum.blue}:G${envEngine.setpoints.spectrum.green}:FR${envEngine.setpoints.spectrum.farRed}`,
      telemetrySensors: envEngine.getLiveSensorTelemetry().sensors
    },
    status: "READY_FOR_BIO_FOUNDRY_PRODUCTION"
  };
}

function showGenericCodeModal(title, jsonPayload) {
  DOM.genericModalTitle.textContent = title;
  DOM.genericModalCode.textContent = JSON.stringify(jsonPayload, null, 2);
  DOM.exportModal.classList.remove("active");
  DOM.genericCodeModal.classList.add("active");
}

function copyGenericModalCode() {
  const text = DOM.genericModalCode.textContent;
  navigator.clipboard.writeText(text).then(() => {
    DOM.btnGenericCopy.textContent = "✅ 복사 완료";
    setTimeout(() => {
      DOM.btnGenericCopy.textContent = "클립보드 복사";
      DOM.genericCodeModal.classList.remove("active");
    }, 1200);
  });
}

function fillPresetForm(key) {
  const presets = {
    ginseng: {
      name: "고려인삼 (Panax ginseng)",
      scientific: "Panax ginseng C.A. Mey.",
      molecule: "사포닌 진세노사이드 (Ginsenoside Rg3)",
      formula: "C₄₂H₇₂O₁₃",
      pubchem: 9918693,
      molWeight: 785.0,
      morphology: "spinach",
      harvestDays: 45,
      tempOpt: 21.0,
      vcmax: 72.0,
      baseConc: 5.2,
      color: "#166534"
    },
    centella: {
      name: "병풀/센텔라 (Centella asiatica)",
      scientific: "Centella asiatica (L.) Urb.",
      molecule: "마데카소사이드 & 아시아티코사이드",
      formula: "C₄₈H₇₈O₁₉",
      pubchem: 3083544,
      molWeight: 959.1,
      morphology: "spinach",
      harvestDays: 30,
      tempOpt: 25.0,
      vcmax: 82.0,
      baseConc: 6.8,
      color: "#15803d"
    },
    resveratrol: {
      name: "고기능 포도 (Vitis vinifera)",
      scientific: "Vitis vinifera L.",
      molecule: "항노화 레스베라트롤 (Resveratrol)",
      formula: "C₁₄H₁₂O₃",
      pubchem: 445154,
      molWeight: 228.24,
      morphology: "marigold",
      harvestDays: 40,
      tempOpt: 23.5,
      vcmax: 78.0,
      baseConc: 4.0,
      color: "#1e824c"
    },
    lycopene: {
      name: "고기능성 완숙 토마토",
      scientific: "Solanum lycopersicum",
      molecule: "항산화 고순도 라이코펜 (Lycopene)",
      formula: "C₄₀H₅₆",
      pubchem: 446925,
      molWeight: 536.87,
      morphology: "tobacco",
      harvestDays: 48,
      tempOpt: 24.0,
      vcmax: 90.0,
      baseConc: 7.5,
      color: "#15803d"
    },
    cbd: {
      name: "의약용 헴프 (Cannabis sativa)",
      scientific: "Cannabis sativa subsp. sativa",
      molecule: "고순도 칸나비디올 (CBD / Terpenes)",
      formula: "C₂₁H₃₀O₂",
      pubchem: 644019,
      molWeight: 314.46,
      morphology: "kale",
      harvestDays: 42,
      tempOpt: 24.5,
      vcmax: 88.0,
      baseConc: 5.5,
      color: "#047857"
    }
  };

  const p = presets[key];
  if (!p) return;

  DOM.regName.value = p.name;
  DOM.regScientific.value = p.scientific;
  DOM.regMolecule.value = p.molecule;
  DOM.regFormula.value = p.formula;
  DOM.regPubChem.value = p.pubchem;
  DOM.regMolWeight.value = p.molWeight;
  DOM.regMorphology.value = p.morphology;
  DOM.regHarvestDays.value = p.harvestDays;
  DOM.regTempOpt.value = p.tempOpt;
  DOM.regVcmax.value = p.vcmax;
  DOM.regBaseConc.value = p.baseConc;
  DOM.regColor.value = p.color;
}

function submitNewCropForm() {
  if (!DOM.regName.value || !DOM.regMolecule.value) {
    alert("식물명과 타깃 분자명은 필수 입력 항목입니다.");
    return;
  }

  audio.playPulse();
  const newProfileData = {
    id: `custom_${DOM.regName.value.replace(/[^a-zA-Z0-9가-힣]/g, "_").toLowerCase()}_${Date.now().toString().slice(-4)}`,
    name: DOM.regName.value,
    scientificName: DOM.regScientific.value || "Custom Botanical sp.",
    targetMolecule: DOM.regMolecule.value,
    chemicalFormula: DOM.regFormula.value || "C20H30O",
    pubchemCid: parseInt(DOM.regPubChem.value, 10) || 0,
    molecularWeight: parseFloat(DOM.regMolWeight.value) || 300,
    morphologyType: DOM.regMorphology.value,
    harvestDays: parseInt(DOM.regHarvestDays.value, 10) || 35,
    tempOpt: parseFloat(DOM.regTempOpt.value) || 23.0,
    vcmax25: parseFloat(DOM.regVcmax.value) || 80.0,
    baseLuteinConcentration: parseFloat(DOM.regBaseConc.value) || 4.0,
    leafColor: DOM.regColor.value || "#22c55e"
  };

  const created = profileManager.registerNewProfile(newProfileData);
  populateCropDropdown(created.id);

  DOM.targetMoleculeText.textContent = `${created.targetMolecule} (${created.chemicalFormula})`;
  if (plantChamber3d) {
    plantChamber3d.setCropSpecies(created);
  }

  buildParamEditor();
  resetPlantState();

  DOM.newCropModal.classList.remove("active");
  alert(`✨ '${created.name}' (${created.targetMolecule})이 성공적으로 등록되었습니다!\n생물리학 시뮬레이터 및 3D 바이오리액터가 새 유전체 환경으로 즉시 전환 가동됩니다.`);
}

// Start Application
window.addEventListener("DOMContentLoaded", initApp);
