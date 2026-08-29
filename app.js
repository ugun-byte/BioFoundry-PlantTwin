/**
 * BioFoundry PlantTwin - Main Application Controller
 * Enterprise B2B Phytochemical & Bio-Manufacturing Digital Twin
 */

import { BioPhysicalEngine } from "./biophysical-model.js";
import { PlantProfileManager } from "./plant-profile-manager.js";
import { EnvironmentalEngine } from "./environmental-engine.js";
import { ThreePlantChamber } from "./three-plant-chamber.js";
import { LiveTelemetryCharts } from "./live-telemetry-charts.js";
import { CyberAudioEngine } from "./sound-effects.js";
import { DataExporter } from "./data-exporter.js";
import { AutonomousAiOptimizer } from "./autonomous-ai-optimizer.js";
import { DiurnalScheduler } from "./diurnal-scheduler.js";
import { I18nManager } from "./i18n.js";

// Core Engines
const bioEngine = new BioPhysicalEngine();
const profileManager = new PlantProfileManager();
const envEngine = new EnvironmentalEngine();
const audio = new CyberAudioEngine();
const aiOptimizer = new AutonomousAiOptimizer();
const diurnalScheduler = new DiurnalScheduler();
const i18n = new I18nManager();

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
  luteinConcentration: 18.7, // mg/g DW
  totalLuteinAccumulatedMg: 132.4,
  leafDryWeightGrams: 0.08
};

// Application Loop State
let isRunning = true;
let lastTimestamp = performance.now();

// DOM References
const DOM = {
  // Navigation & Header
  navTabs: document.querySelectorAll(".nav-tab-btn"),
  btnLangToggle: document.getElementById("btnLangToggle"),
  btnAudioMute: document.getElementById("btnAudioMute"),
  btnOpenParamEditor: document.getElementById("btnOpenParamEditor"),
  btnExportMenu: document.getElementById("btnExportMenu"),
  btnAutoTune: document.getElementById("btnAutoTune"),
  btnAiAutoPilot: document.getElementById("btnAiAutoPilot"),
  aiAutoPilotLabel: document.getElementById("aiAutoPilotLabel"),
  btnOpenNewCropModal: document.getElementById("btnOpenNewCropModal"),
  btnOpenScheduler: document.getElementById("btnOpenScheduler"),

  // Context Meta Strip
  cropSelect: document.getElementById("cropSelect"),
  metaTargetMolecule: document.getElementById("metaTargetMolecule"),
  metaDli: document.getElementById("metaDli"),
  metaPpfd: document.getElementById("metaPpfd"),
  metaAn: document.getElementById("metaAn"),
  diurnalStatusLabel: document.getElementById("diurnalStatusLabel"),

  // Sliders & Toggles (13 Controls)
  sliderPpfd: document.getElementById("sliderPpfd"),
  valPpfd: document.getElementById("valPpfd"),
  sliderPhotoperiod: document.getElementById("sliderPhotoperiod"),
  valPhotoperiod: document.getElementById("valPhotoperiod"),
  sliderRed: document.getElementById("sliderRed"),
  valRed: document.getElementById("valRed"),
  sliderBlue: document.getElementById("sliderBlue"),
  valBlue: document.getElementById("valBlue"),
  sliderGreen: document.getElementById("sliderGreen"),
  valGreen: document.getElementById("valGreen"),
  sliderFarRed: document.getElementById("sliderFarRed"),
  valFarRed: document.getElementById("valFarRed"),
  sliderDayTemp: document.getElementById("sliderDayTemp"),
  valDayTemp: document.getElementById("valDayTemp"),
  sliderNightTemp: document.getElementById("sliderNightTemp"),
  valNightTemp: document.getElementById("valNightTemp"),
  sliderHumidity: document.getElementById("sliderHumidity"),
  valHumidity: document.getElementById("valHumidity"),
  sliderCo2: document.getElementById("sliderCo2"),
  valCo2: document.getElementById("valCo2"),
  sliderEc: document.getElementById("sliderEc"),
  valEc: document.getElementById("valEc"),
  checkUvb: document.getElementById("checkUvb"),
  valUvb: document.getElementById("valUvb"),
  checkColdShift: document.getElementById("checkColdShift"),
  valColdShift: document.getElementById("valColdShift"),

  // 3D Simulation Chamber & HUD
  plant3dContainer: document.getElementById("plant3dContainer"),
  btnCapture4K: document.getElementById("btnCapture4K"),
  btnResetCamera: document.getElementById("btnResetCamera"),
  hudChlAb: document.getElementById("hudChlAb"),
  hudStomatalGs: document.getElementById("hudStomatalGs"),
  hudNpq: document.getElementById("hudNpq"),
  hudRootRh: document.getElementById("hudRootRh"),
  hudRootTemp: document.getElementById("hudRootTemp"),
  hudRootO2: document.getElementById("hudRootO2"),
  hologramBioHud: document.getElementById("hologramBioHud"),
  hudNodeTitle: document.getElementById("hudNodeTitle"),
  hudPinClose: document.getElementById("hudPinClose"),
  hudLeafTemp: document.getElementById("hudLeafTemp"),
  hudNetAn: document.getElementById("hudNetAn"),
  hudMoleculeConc: document.getElementById("hudMoleculeConc"),

  // Timeline
  btnPlay: document.getElementById("btnPlay"),
  btnReset: document.getElementById("btnReset"),
  timelineSlider: document.getElementById("timelineSlider"),
  teleDay: document.getElementById("teleDay"),
  teleHarvestDay: document.getElementById("teleHarvestDay"),
  teleTimeFormatted: document.getElementById("teleTimeFormatted"),
  teleStage: document.getElementById("teleStage"),
  warpButtons: document.querySelectorAll(".warp-btn"),

  // Telemetry Tiles (8)
  teleSensPpfd: document.getElementById("teleSensPpfd"),
  teleSensRh: document.getElementById("teleSensRh"),
  teleSensAirTemp: document.getElementById("teleSensAirTemp"),
  teleSensCo2: document.getElementById("teleSensCo2"),
  teleSensLeafTemp: document.getElementById("teleSensLeafTemp"),
  teleSensEc: document.getElementById("teleSensEc"),
  teleSensVpd: document.getElementById("teleSensVpd"),
  teleSensFvFm: document.getElementById("teleSensFvFm"),

  // KPI Tiles (6)
  kpiTotalLutein: document.getElementById("kpiTotalLutein"),
  kpiYieldGain: document.getElementById("kpiYieldGain"),
  kpiLuteinConc: document.getElementById("kpiLuteinConc"),
  kpiFreshWeight: document.getElementById("kpiFreshWeight"),
  kpiDryWeight: document.getElementById("kpiDryWeight"),
  kpiEnergyEff: document.getElementById("kpiEnergyEff"),

  // Bottom Oscilloscopes
  photoScopeChart: document.getElementById("photoScopeChart"),
  luteinScopeChart: document.getElementById("luteinScopeChart"),
  scaleButtons: document.querySelectorAll(".range-btn"),

  // Modals
  paramModal: document.getElementById("paramModal"),
  paramClose: document.getElementById("paramClose"),
  paramGrid: document.getElementById("paramGrid"),
  btnSaveParams: document.getElementById("btnSaveParams"),
  btnExportProfile: document.getElementById("btnExportProfile"),

  exportModal: document.getElementById("exportModal"),
  exportClose: document.getElementById("exportClose"),
  btnExportCSV: document.getElementById("btnExportCSV"),
  btnExportPlc: document.getElementById("btnExportPlc"),
  btnExportP2HModal: document.getElementById("btnExportP2HModal"),

  recipeModal: document.getElementById("recipeModal"),
  modalClose: document.getElementById("modalClose"),
  modalRecipeTitle: document.getElementById("modalRecipeTitle"),
  modalRecipeCode: document.getElementById("modalRecipeCode"),
  paretoCanvas: document.getElementById("paretoCanvas"),
  btnApplyRecipe: document.getElementById("btnApplyRecipe"),
  optTabs: document.querySelectorAll(".opt-tab"),
  optYieldGain: document.getElementById("optYieldGain"),
  optDaysSaved: document.getElementById("optDaysSaved"),
  optNetAn: document.getElementById("optNetAn"),
  optTotalRuns: document.getElementById("optTotalRuns"),

  genericCodeModal: document.getElementById("genericCodeModal"),
  genericModalTitle: document.getElementById("genericModalTitle"),
  genericModalCode: document.getElementById("genericModalCode"),
  genericModalClose: document.getElementById("genericModalClose"),
  btnGenericCopy: document.getElementById("btnGenericCopy"),

  newCropModal: document.getElementById("newCropModal"),
  newCropClose: document.getElementById("newCropClose"),
  btnCancelNewCrop: document.getElementById("btnCancelNewCrop"),
  btnSubmitNewCrop: document.getElementById("btnSubmitNewCrop"),
  presetButtons: document.querySelectorAll("[data-preset]"),
  regName: document.getElementById("regName"),
  regScientific: document.getElementById("regScientific"),
  regMolecule: document.getElementById("regMolecule"),
  regFormula: document.getElementById("regFormula"),
  regHarvestDays: document.getElementById("regHarvestDays"),
  regTempOpt: document.getElementById("regTempOpt"),

  schedulerModal: document.getElementById("schedulerModal"),
  schedulerClose: document.getElementById("schedulerClose"),
  btnExportDiurnalPlc: document.getElementById("btnExportDiurnalPlc"),
  btnApplyDiurnalSchedule: document.getElementById("btnApplyDiurnalSchedule")
};

function populateCropDropdown(selectedId = null) {
  const profiles = profileManager.getAllProfiles();
  DOM.cropSelect.innerHTML = "";
  profiles.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.name} (${p.scientificName})`;
    if (selectedId && p.id === selectedId) opt.selected = true;
    DOM.cropSelect.appendChild(opt);
  });
}

function initApp() {
  i18n.updateDOM();
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
    if (data.nodeType.includes("근권") || data.nodeType.includes("흡수근") || data.nodeType.includes("Root")) {
      DOM.hudLeafTemp.textContent = `${(instantPhoto.stomata.leafTemp - 2.6).toFixed(1)} °C`;
      DOM.hudNetAn.textContent = `${(instantPhoto.netAn * 0.45).toFixed(2)}`;
      DOM.hudMoleculeConc.textContent = `${(plantState.luteinConcentration * 0.62).toFixed(2)} mg/g`;
    } else {
      DOM.hudLeafTemp.textContent = `${instantPhoto.stomata.leafTemp} °C`;
      DOM.hudNetAn.textContent = `${instantPhoto.netAn.toFixed(2)} μmol`;
      DOM.hudMoleculeConc.textContent = `${plantState.luteinConcentration.toFixed(2)} mg/g DW`;
    }

    DOM.hologramBioHud.style.left = `${data.screenX}px`;
    DOM.hologramBioHud.style.top = `${data.screenY}px`;
    DOM.hologramBioHud.style.display = "block";
  });

  if (DOM.hudPinClose) {
    DOM.hudPinClose.addEventListener("click", () => {
      DOM.hologramBioHud.style.display = "none";
      if (plantChamber3d) plantChamber3d.clearPin();
    });
  }

  bindEventListeners();
  buildParamEditor();
  resetPlantState();

  requestAnimationFrame(simulationLoop);
}

function bindEventListeners() {
  // Language Switcher Toggle
  if (DOM.btnLangToggle) {
    DOM.btnLangToggle.addEventListener("click", () => {
      audio.playClick();
      const current = i18n.getLanguage();
      const nextLang = current === "ko" ? "en" : "ko";
      i18n.setLanguage(nextLang);
      populateCropDropdown(profileManager.getActiveProfile().id);
    });
  }

  // Navigation Tabs
  DOM.navTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      audio.playClick();
      DOM.navTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
    });
  });

  // Audio Toggle
  DOM.btnAudioMute.addEventListener("click", () => {
    audio.playClick();
    alert("🔊 앰비언트 바이오리액터 음향이 토글되었습니다.");
  });

  // Crop Selector
  DOM.cropSelect.addEventListener("change", (e) => {
    audio.playPulse();
    const cropId = e.target.value;
    profileManager.setActiveProfile(cropId);
    const crop = profileManager.getActiveProfile();
    DOM.metaTargetMolecule.textContent = `${crop.targetMolecule} (${crop.chemicalFormula})`;
    if (plantChamber3d) plantChamber3d.setCropSpecies(crop);
    buildParamEditor();
    resetPlantState();
  });

  // Sliders binding
  const bindSlider = (slider, displayEl, callback) => {
    if (!slider || !displayEl) return;
    slider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      displayEl.textContent = val;
      callback(val);
    });
  };

  bindSlider(DOM.sliderPpfd, DOM.valPpfd, (val) => envEngine.updateSetpoints({ ppfdTarget: val }));
  bindSlider(DOM.sliderPhotoperiod, DOM.valPhotoperiod, (val) => envEngine.updateSetpoints({ photoperiodHours: val }));
  bindSlider(DOM.sliderRed, DOM.valRed, (val) => envEngine.updateSetpoints({ spectrum: { ...envEngine.setpoints.spectrum, red: val } }));
  bindSlider(DOM.sliderBlue, DOM.valBlue, (val) => envEngine.updateSetpoints({ spectrum: { ...envEngine.setpoints.spectrum, blue: val } }));
  bindSlider(DOM.sliderGreen, DOM.valGreen, (val) => envEngine.updateSetpoints({ spectrum: { ...envEngine.setpoints.spectrum, green: val } }));
  bindSlider(DOM.sliderFarRed, DOM.valFarRed, (val) => envEngine.updateSetpoints({ spectrum: { ...envEngine.setpoints.spectrum, farRed: val } }));
  bindSlider(DOM.sliderDayTemp, DOM.valDayTemp, (val) => envEngine.updateSetpoints({ dayTempTarget: val }));
  bindSlider(DOM.sliderNightTemp, DOM.valNightTemp, (val) => envEngine.updateSetpoints({ nightTempTarget: val }));
  bindSlider(DOM.sliderHumidity, DOM.valHumidity, (val) => envEngine.updateSetpoints({ humidityTarget: val }));
  bindSlider(DOM.sliderCo2, DOM.valCo2, (val) => envEngine.updateSetpoints({ co2Target: val }));
  bindSlider(DOM.sliderEc, DOM.valEc, (val) => envEngine.updateSetpoints({ ecTarget: val }));

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

  // Timeline Controls
  DOM.btnPlay.addEventListener("click", () => {
    audio.playClick();
    isRunning = !isRunning;
    DOM.btnPlay.innerHTML = isRunning 
      ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`
      : `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
  });

  DOM.btnReset.addEventListener("click", () => {
    audio.playClick();
    resetPlantState();
  });

  DOM.timelineSlider.addEventListener("input", (e) => {
    seekToDay(parseInt(e.target.value, 10));
  });

  DOM.warpButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      audio.playClick();
      DOM.warpButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      envEngine.setTimeWarp(parseFloat(btn.getAttribute("data-speed")));
    });
  });

  // Time Scale Zoom Buttons
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

  // 3D Viewport Controls
  DOM.btnResetCamera.addEventListener("click", () => {
    audio.playClick();
    if (plantChamber3d) plantChamber3d.resetCamera();
  });

  DOM.btnCapture4K.addEventListener("click", () => {
    audio.playPulse();
    const canvas = DOM.plant3dContainer.querySelector("canvas");
    DataExporter.captureCanvasSnapshot(canvas, `BioFoundry_PlantTwin_${profileManager.getActiveProfile().id}.png`);
  });

  // AI Auto-Pilot Switch
  DOM.btnAiAutoPilot.addEventListener("click", toggleAiAutoPilot);
  DOM.btnAutoTune.addEventListener("click", showAutoTuneModal);
  DOM.modalClose.addEventListener("click", () => DOM.recipeModal.classList.remove("active"));
  DOM.btnApplyRecipe.addEventListener("click", applyAutoTuneRecipe);

  DOM.optTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      audio.playClick();
      DOM.optTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentOptimizationObjective = tab.getAttribute("data-obj");
      runOptimizationAndDisplay();
    });
  });

  // Parameter Editor Modal
  DOM.btnOpenParamEditor.addEventListener("click", () => {
    audio.playClick();
    buildParamEditor();
    DOM.paramModal.classList.add("active");
  });
  DOM.paramClose.addEventListener("click", () => DOM.paramModal.classList.remove("active"));
  DOM.btnSaveParams.addEventListener("click", saveEditedParams);
  DOM.btnExportProfile.addEventListener("click", exportProfileJson);

  // Export Modal
  DOM.btnExportMenu.addEventListener("click", () => {
    audio.playClick();
    DOM.exportModal.classList.add("active");
  });
  DOM.exportClose.addEventListener("click", () => DOM.exportModal.classList.remove("active"));

  DOM.btnExportCSV.addEventListener("click", () => {
    audio.playPulse();
    DataExporter.exportTelemetryCSV(telemetryCharts.history, profileManager.getActiveProfile(), envEngine.setpoints);
  });

  DOM.btnExportPlc.addEventListener("click", () => {
    audio.playClick();
    const plcData = DataExporter.generateSmartFarmScript(profileManager.getActiveProfile(), envEngine, plantState);
    showGenericCodeModal("📜 스마트팜 BACnet / MQTT PLC 제어 스크립트", plcData);
  });

  DOM.btnExportP2HModal.addEventListener("click", () => {
    audio.playClick();
    const p2hData = generatePlant2HumanPayload();
    showGenericCodeModal("🔗 Plant2Human AI (localhost:3006) 원료 규격 연동 페이로드", p2hData);
  });

  // New Crop Modal
  DOM.btnOpenNewCropModal.addEventListener("click", () => {
    audio.playPulse();
    DOM.newCropModal.classList.add("active");
  });
  DOM.newCropClose.addEventListener("click", () => DOM.newCropModal.classList.remove("active"));
  DOM.btnCancelNewCrop.addEventListener("click", () => DOM.newCropModal.classList.remove("active"));
  DOM.btnSubmitNewCrop.addEventListener("click", submitNewCropForm);

  DOM.presetButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      audio.playClick();
      fillPresetForm(btn.getAttribute("data-preset"));
    });
  });

  // Scheduler Modal
  DOM.btnOpenScheduler.addEventListener("click", () => {
    audio.playPulse();
    DOM.schedulerModal.classList.add("active");
  });
  DOM.schedulerClose.addEventListener("click", () => DOM.schedulerModal.classList.remove("active"));

  DOM.btnExportDiurnalPlc.addEventListener("click", () => {
    audio.playPulse();
    const crop = profileManager.getActiveProfile();
    const timetable = diurnalScheduler.generate24HourPlcTimetable(crop);
    showGenericCodeModal(`24시간 스마트팜 PLC 스케줄: ${crop.name}`, timetable);
  });

  DOM.btnApplyDiurnalSchedule.addEventListener("click", () => {
    audio.playPulse();
    diurnalScheduler.enabled = true;
    DOM.schedulerModal.classList.remove("active");
    alert("🌿 스마트팜 24시간 자동 일주기 스케줄러가 활성화되었습니다!");
  });

  // Generic Modal Close
  DOM.genericModalClose.addEventListener("click", () => DOM.genericCodeModal.classList.remove("active"));
  DOM.btnGenericCopy.addEventListener("click", copyGenericModalCode);
}

function resetPlantState() {
  const crop = profileManager.getActiveProfile();
  DOM.timelineSlider.max = crop.harvestDays;
  seekToDay(1);
  DOM.timelineSlider.value = 1;
  DOM.teleHarvestDay.textContent = crop.harvestDays;
}

function seekToDay(targetDay) {
  const crop = profileManager.getActiveProfile();
  const dayClamped = Math.min(crop.harvestDays, Math.max(1, targetDay));
  envEngine.simulatedTotalSeconds = (dayClamped - 1) * 86400 + 12 * 3600;
  envEngine.simulatedDay = dayClamped;
  envEngine.simulatedHour = 12.0;

  const logistic = 1 / (1 + Math.exp(-0.2 * (dayClamped - 20)));
  plantState.dryWeightGrams = +(0.1 + 18.5 * logistic).toFixed(1);
  plantState.freshWeightGrams = +(plantState.dryWeightGrams * 10.2).toFixed(1);
  plantState.heightCm = +(2.0 + 38.0 * logistic).toFixed(1);
  plantState.leafCount = Math.floor(2 + dayClamped * 0.7);
  plantState.lai = +(0.05 + (crop.maxLai - 0.05) * logistic).toFixed(2);
  plantState.leafDryWeightGrams = +(plantState.dryWeightGrams * crop.leafPartitionRatio).toFixed(1);
  plantState.luteinConcentration = +(crop.baseLuteinConcentration * (1.0 + (envEngine.setpoints.uvbActive && dayClamped >= (crop.harvestDays - 7) ? 0.6 : 0.2))).toFixed(1);
  plantState.totalLuteinAccumulatedMg = +(plantState.luteinConcentration * plantState.leafDryWeightGrams).toFixed(1);
}

/**
 * 60 FPS Real-time Continuous Physics Loop
 */
function simulationLoop(now) {
  const dtRealSeconds = Math.min(0.1, (now - lastTimestamp) / 1000.0);
  lastTimestamp = now;

  if (isRunning) {
    // 1. Advance Environment Engine
    envEngine.tick(dtRealSeconds);

    const crop = profileManager.getActiveProfile();
    const envTele = envEngine.getLiveSensorTelemetry();

    // Diurnal Schedule if enabled
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

    // 2. FvCB Photosynthesis
    const instantPhoto = bioEngine.calculateInstantaneousPhotosynthesis({
      ppfd: envTele.sensors.ppfd,
      airTemp: envTele.sensors.airTemp,
      humidity: envTele.sensors.humidity,
      co2Air: envTele.sensors.co2,
      vpdAir: envTele.sensors.vpd,
      spectrum: envTele.sensors.spectrum
    }, crop);

    // 3. Phytochemical Flux
    const isLateStage = envTele.simulatedDay >= (crop.harvestDays - 7);
    const molecularFlux = bioEngine.calculateSecondaryMetaboliteFlux(instantPhoto, {
      ppfd: envTele.sensors.ppfd,
      spectrum: envTele.sensors.spectrum,
      uvbActive: envEngine.setpoints.uvbActive && isLateStage,
      coldShockActive: envEngine.setpoints.coldShiftActive && isLateStage,
      ec: envTele.sensors.ec
    }, crop, plantState);

    // 4. Integration
    const dtSimSeconds = dtRealSeconds * envEngine.timeWarp;
    const dtSimHours = dtSimSeconds / 3600.0;
    const dBiomass = Math.max(0, (instantPhoto.netAn * 3600 * 30 / 1e6) * (1 - Math.exp(-crop.k_extinction * plantState.lai)) * 0.04 * dtSimHours);

    plantState.dryWeightGrams += dBiomass;
    plantState.freshWeightGrams = plantState.dryWeightGrams * 10.2;
    plantState.leafDryWeightGrams = plantState.dryWeightGrams * crop.leafPartitionRatio;
    plantState.totalLuteinAccumulatedMg += molecularFlux.hourlyPlantFlux * dtSimHours;
    plantState.luteinConcentration = plantState.leafDryWeightGrams > 0 
      ? (plantState.totalLuteinAccumulatedMg / plantState.leafDryWeightGrams) 
      : crop.baseLuteinConcentration;

    // 5. Update Context Meta Strip
    const dli = (envEngine.setpoints.ppfdTarget * envEngine.setpoints.photoperiodHours * 3600) / 1e6;
    DOM.metaDli.textContent = dli.toFixed(1);
    DOM.metaPpfd.textContent = Math.round(envTele.sensors.ppfd);
    DOM.metaAn.textContent = instantPhoto.netAn.toFixed(1);
    
    const isDay = envTele.simulatedHour >= 6.0 && envTele.simulatedHour < 22.0;
    const diurnalKey = isDay ? "diurnalDay" : "diurnalNight";
    DOM.diurnalStatusLabel.textContent = `${i18n.t(diurnalKey)} ${envTele.timeFormatted}`;

    // 6. Update 8 Telemetry Tiles
    DOM.teleSensPpfd.textContent = Math.round(envTele.sensors.ppfd);
    DOM.teleSensRh.textContent = envTele.sensors.humidity.toFixed(1);
    DOM.teleSensAirTemp.textContent = envTele.sensors.airTemp.toFixed(1);
    DOM.teleSensCo2.textContent = Math.round(envTele.sensors.co2);
    DOM.teleSensLeafTemp.textContent = instantPhoto.stomata.leafTemp.toFixed(1);
    DOM.teleSensEc.textContent = envTele.sensors.ec.toFixed(2);
    DOM.teleSensVpd.textContent = envTele.sensors.vpd.toFixed(2);
    DOM.teleSensFvFm.textContent = instantPhoto.fvFm.toFixed(3);

    // 7. Update 6 KPI Tiles
    DOM.kpiTotalLutein.textContent = `${plantState.totalLuteinAccumulatedMg.toFixed(1)} mg`;
    DOM.kpiYieldGain.textContent = `+${Math.min(185, Math.round((plantState.luteinConcentration / crop.baseLuteinConcentration) * 100))}%`;
    DOM.kpiLuteinConc.textContent = `${plantState.luteinConcentration.toFixed(1)} mg/g DW`;
    DOM.kpiFreshWeight.textContent = `${plantState.freshWeightGrams.toFixed(1)} g`;
    DOM.kpiDryWeight.textContent = `${plantState.dryWeightGrams.toFixed(1)} g`;
    const ledKw = (envTele.sensors.ppfd / 2.8 * 0.8 + 35) / 1000;
    DOM.kpiEnergyEff.textContent = `${(molecularFlux.hourlyPlantFlux / (ledKw + 0.01)).toFixed(1)} mg/kWh`;

    // 8. Update Glassmorphic 3D Chamber HUD Cards
    DOM.hudChlAb.textContent = (3.15 + Math.sin(now * 0.001) * 0.08).toFixed(2);
    DOM.hudStomatalGs.textContent = `${instantPhoto.stomata.gs.toFixed(2)} mol m⁻² s⁻¹`;
    DOM.hudNpq.textContent = (1.25 + Math.cos(now * 0.001) * 0.05).toFixed(2);
    DOM.hudRootRh.textContent = `${(98.5 + Math.sin(now * 0.002) * 0.4).toFixed(1)} %`;
    DOM.hudRootTemp.textContent = `${(envTele.sensors.airTemp - 2.2).toFixed(1)} °C`;
    DOM.hudRootO2.textContent = `${(21.2 + Math.cos(now * 0.002) * 0.2).toFixed(1)} %`;

    // 9. Update Timeline Scrubber Text
    DOM.teleDay.textContent = String(envTele.simulatedDay).padStart(2, '0');
    if (DOM.teleTimeFormatted) {
      DOM.teleTimeFormatted.textContent = `(${envTele.timeFormatted})`;
    }
    const stageKey = envTele.simulatedDay < 12 
      ? "stageSeedling" 
      : (envTele.simulatedDay < 28 ? "stageVegetative" : "stageFlowering");
    DOM.teleStage.textContent = i18n.t(stageKey);
    DOM.timelineSlider.value = envTele.simulatedDay;

    // 10. Push Telemetry Point to Oscilloscopes & Sparklines
    if (telemetryCharts) {
      telemetryCharts.pushTelemetryPoint({
        an: instantPhoto.netAn,
        gs: instantPhoto.stomata.gs,
        ci: envTele.sensors.co2 * 0.65,
        luteinFlux: molecularFlux.hourlyPlantFlux,
        luteinConc: plantState.luteinConcentration,
        luteinTotal: plantState.totalLuteinAccumulatedMg,
        biomass: plantState.dryWeightGrams,
        freshWeight: plantState.freshWeightGrams,
        energyEff: molecularFlux.hourlyPlantFlux / (ledKw + 0.01),
        ppfd: envTele.sensors.ppfd,
        rh: envTele.sensors.humidity,
        airTemp: envTele.sensors.airTemp,
        co2: envTele.sensors.co2,
        leafTemp: instantPhoto.stomata.leafTemp,
        ec: envTele.sensors.ec,
        vpd: envTele.sensors.vpd,
        fvfm: instantPhoto.fvFm
      });
    }

    // 11. 3D Chamber Growth Dynamics
    if (plantChamber3d) {
      plantChamber3d.updateSimulation(plantState, envTele, crop);
    }
  }

  requestAnimationFrame(simulationLoop);
}

function toggleAiAutoPilot() {
  isAiAutoPilotActive = !isAiAutoPilotActive;
  audio.playPulse();

  const switchBadge = DOM.btnAiAutoPilot.querySelector(".switch-badge");
  if (isAiAutoPilotActive) {
    DOM.btnAiAutoPilot.classList.add("active");
    switchBadge.textContent = "ON";
    const crop = profileManager.getActiveProfile();
    const res = aiOptimizer.searchOptimalEnvironment(crop, currentOptimizationObjective);
    const rec = res.optimalRecipe;

    envEngine.updateSetpoints({
      ppfdTarget: rec.ppfd,
      dayTempTarget: rec.dayTemp,
      nightTempTarget: rec.nightTemp,
      co2Target: rec.co2,
      humidityTarget: rec.humidity,
      ecTarget: rec.ec,
      spectrum: rec.spectrum,
      uvbActive: rec.uvbActive,
      coldShiftActive: rec.coldShiftActive,
      photoperiodHours: rec.photoperiod
    });

    // Update Sliders UI
    DOM.sliderPpfd.value = rec.ppfd; DOM.valPpfd.textContent = rec.ppfd;
    DOM.sliderDayTemp.value = rec.dayTemp; DOM.valDayTemp.textContent = rec.dayTemp;
    DOM.sliderNightTemp.value = rec.nightTemp; DOM.valNightTemp.textContent = rec.nightTemp;
    DOM.sliderCo2.value = rec.co2; DOM.valCo2.textContent = rec.co2;
    DOM.sliderHumidity.value = rec.humidity; DOM.valHumidity.textContent = rec.humidity;
    DOM.sliderEc.value = rec.ec; DOM.valEc.textContent = rec.ec;
    DOM.sliderRed.value = rec.spectrum.red; DOM.valRed.textContent = rec.spectrum.red;
    DOM.sliderBlue.value = rec.spectrum.blue; DOM.valBlue.textContent = rec.spectrum.blue;
    DOM.sliderGreen.value = rec.spectrum.green; DOM.valGreen.textContent = rec.spectrum.green;
    DOM.sliderFarRed.value = rec.spectrum.farRed; DOM.valFarRed.textContent = rec.spectrum.farRed;
    DOM.checkUvb.checked = rec.uvbActive;
    DOM.checkColdShift.checked = rec.coldShiftActive;
  } else {
    DOM.btnAiAutoPilot.classList.remove("active");
    switchBadge.textContent = "OFF";
  }
}

function showAutoTuneModal() {
  audio.playPulse();
  runOptimizationAndDisplay();
  DOM.recipeModal.classList.add("active");
}

function runOptimizationAndDisplay() {
  const crop = profileManager.getActiveProfile();
  const res = aiOptimizer.searchOptimalEnvironment(crop, currentOptimizationObjective);

  DOM.modalRecipeTitle.textContent = `${i18n.t("optModalTitle")}: ${crop.name} (${crop.targetMolecule})`;
  DOM.optYieldGain.textContent = `+${res.improvements.yieldGainPercent}%`;
  DOM.optDaysSaved.textContent = `-${res.improvements.daysSaved}일 (${res.improvements.acceleratedDays}일차)`;
  DOM.optNetAn.textContent = `${res.improvements.netPhotosynthesis} μmol`;
  DOM.optTotalRuns.textContent = `${res.totalSimulations}회`;

  const displayObj = {
    objective: res.objective,
    recipe: res.optimalRecipe,
    improvements: res.improvements,
    biologicalRationale: res.scientificExplanation
  };

  DOM.modalRecipeCode.textContent = JSON.stringify(displayObj, null, 2);

  if (DOM.paretoCanvas && res.landscape) {
    setTimeout(() => {
      aiOptimizer.drawParetoLandscapeCanvas(DOM.paretoCanvas, res.landscape);
    }, 60);
  }
}

function applyAutoTuneRecipe() {
  audio.playPulse();
  isAiAutoPilotActive = false;
  toggleAiAutoPilot();
  DOM.recipeModal.classList.remove("active");
  alert("✨ AI 역추적 최적 레시피가 스마트 바이오리액터에 성공적으로 배포되었습니다!");
}

function buildParamEditor() {
  const crop = profileManager.getActiveProfile();
  DOM.paramGrid.innerHTML = "";

  const fields = [
    { key: "name", label: i18n.getLanguage() === "ko" ? "식물명" : "Plant Name", val: crop.name },
    { key: "targetMolecule", label: i18n.getLanguage() === "ko" ? "타깃 약리 성분" : "Target Molecule", val: crop.targetMolecule },
    { key: "chemicalFormula", label: i18n.getLanguage() === "ko" ? "화학식" : "Chemical Formula", val: crop.chemicalFormula },
    { key: "harvestDays", label: i18n.getLanguage() === "ko" ? "수확 주기(일)" : "Harvest Days", val: crop.harvestDays },
    { key: "tempOpt", label: i18n.getLanguage() === "ko" ? "최적 생육온도(°C)" : "Optimal Temp (°C)", val: crop.tempOpt },
    { key: "vcmax25", label: "Rubisco Vcmax(μmol/m²s)", val: crop.vcmax25 },
    { key: "jmax25", label: "전자전달 Jmax(μmol/m²s)", val: crop.jmax25 },
    { key: "baseLuteinConcentration", label: i18n.getLanguage() === "ko" ? "기저 농도(mg/g DW)" : "Base Conc (mg/g DW)", val: crop.baseLuteinConcentration }
  ];

  fields.forEach(f => {
    const card = document.createElement("div");
    card.className = "param-card";
    card.innerHTML = `
      <div class="param-field">
        <label>${f.label}</label>
        <input type="text" data-key="${f.key}" value="${f.val}">
      </div>
    `;
    DOM.paramGrid.appendChild(card);
  });
}

function saveEditedParams() {
  audio.playPulse();
  const inputs = DOM.paramGrid.querySelectorAll("input");
  inputs.forEach(input => {
    const key = input.getAttribute("data-key");
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

function submitNewCropForm() {
  audio.playPulse();
  const newProfile = {
    name: DOM.regName.value || "신규 작물",
    scientificName: DOM.regScientific.value || "Species L.",
    targetMolecule: DOM.regMolecule.value || "Phytochemical",
    chemicalFormula: DOM.regFormula.value || "C40H56O2",
    harvestDays: parseInt(DOM.regHarvestDays.value, 10) || 40,
    tempOpt: parseFloat(DOM.regTempOpt.value) || 24.0,
    baseLuteinConcentration: 4.5,
    leafColor: "#22c55e",
    morphologyType: "marigold"
  };

  const registered = profileManager.registerNewSpecies(newProfile);
  populateCropDropdown(registered.id);
  profileManager.setActiveProfile(registered.id);
  DOM.metaTargetMolecule.textContent = `${registered.targetMolecule} (${registered.chemicalFormula})`;
  if (plantChamber3d) plantChamber3d.setCropSpecies(registered);
  resetPlantState();
  DOM.newCropModal.classList.remove("active");
  alert(`✨ [${registered.name}] 신규 작물이 바이오파운드리에 등록되었습니다!`);
}

function fillPresetForm(key) {
  const presets = {
    ginseng: { name: "고려인삼", scientific: "Panax ginseng", molecule: "진세노사이드 Rg3", formula: "C42H72O13", days: 45, temp: 21.0 },
    centella: { name: "병풀/센텔라", scientific: "Centella asiatica", molecule: "마데카소사이드", formula: "C48H78O19", days: 30, temp: 25.0 },
    resveratrol: { name: "고기능 포도", scientific: "Vitis vinifera", molecule: "레스베라트롤", formula: "C14H12O3", days: 40, temp: 23.5 }
  };
  const p = presets[key];
  if (!p) return;
  DOM.regName.value = p.name;
  DOM.regScientific.value = p.scientific;
  DOM.regMolecule.value = p.molecule;
  DOM.regFormula.value = p.formula;
  DOM.regHarvestDays.value = p.days;
  DOM.regTempOpt.value = p.temp;
}

function generatePlant2HumanPayload() {
  const crop = profileManager.getActiveProfile();
  return {
    sourcePlatform: "BioFoundry_PlantTwin_v4.5",
    timestamp: new Date().toISOString(),
    cropMetadata: {
      id: crop.id,
      name: crop.name,
      targetMolecule: crop.targetMolecule,
      formula: crop.chemicalFormula
    },
    predictedBioAssay: {
      purityConcentrationMgG: +plantState.luteinConcentration.toFixed(2),
      totalHarvestMg: +plantState.totalLuteinAccumulatedMg.toFixed(2),
      confidenceInterval95: [+(plantState.luteinConcentration * 0.93).toFixed(2), +(plantState.luteinConcentration * 1.07).toFixed(2)],
      modelConfidenceScore: "89.4%"
    }
  };
}

function showGenericCodeModal(title, payload) {
  DOM.genericModalTitle.textContent = title;
  DOM.genericModalCode.textContent = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
  DOM.exportModal.classList.remove("active");
  DOM.genericCodeModal.classList.add("active");
}

function copyGenericModalCode() {
  navigator.clipboard.writeText(DOM.genericModalCode.textContent).then(() => {
    DOM.btnGenericCopy.textContent = "✅ 복사 완료";
    setTimeout(() => {
      DOM.btnGenericCopy.textContent = "클립보드 복사";
      DOM.genericCodeModal.classList.remove("active");
    }, 1200);
  });
}

// Launch application on DOM ready
window.addEventListener("DOMContentLoaded", initApp);
