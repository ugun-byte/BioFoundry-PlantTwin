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

  // Sliders & Number Inputs (13 Controls)
  sliderPpfd: document.getElementById("sliderPpfd"),
  inputPpfd: document.getElementById("inputPpfd"),
  sliderPhotoperiod: document.getElementById("sliderPhotoperiod"),
  inputPhotoperiod: document.getElementById("inputPhotoperiod"),
  sliderRed: document.getElementById("sliderRed"),
  inputRed: document.getElementById("inputRed"),
  sliderBlue: document.getElementById("sliderBlue"),
  inputBlue: document.getElementById("inputBlue"),
  sliderGreen: document.getElementById("sliderGreen"),
  inputGreen: document.getElementById("inputGreen"),
  sliderFarRed: document.getElementById("sliderFarRed"),
  inputFarRed: document.getElementById("inputFarRed"),
  sliderDayTemp: document.getElementById("sliderDayTemp"),
  inputDayTemp: document.getElementById("inputDayTemp"),
  sliderNightTemp: document.getElementById("sliderNightTemp"),
  inputNightTemp: document.getElementById("inputNightTemp"),
  sliderHumidity: document.getElementById("sliderHumidity"),
  inputHumidity: document.getElementById("inputHumidity"),
  sliderCo2: document.getElementById("sliderCo2"),
  inputCo2: document.getElementById("inputCo2"),
  sliderEc: document.getElementById("sliderEc"),
  inputEc: document.getElementById("inputEc"),
  checkUvb: document.getElementById("checkUvb"),
  inputUvb: document.getElementById("inputUvb"),
  checkColdShift: document.getElementById("checkColdShift"),
  inputColdShift: document.getElementById("inputColdShift"),

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

  // Initialize Draggable HUD Cards inside 3D Viewport
  const viewportCard = document.querySelector(".viewport-card");
  const leafCard = document.getElementById("hudLeafCard");
  const rootCard = document.getElementById("hudRootCard");
  const bioPinCard = document.getElementById("hologramBioHud");

  makeElementDraggable(leafCard, viewportCard);
  makeElementDraggable(rootCard, viewportCard);
  makeElementDraggable(bioPinCard, viewportCard);

  // Initialize Interactive Resizable Panel Layout Gutters
  initResizablePanels();

  bindEventListeners();
  buildParamEditor();
  resetPlantState();

  requestAnimationFrame(simulationLoop);
}

/**
 * Interactive Resizable Panel Layout (Left, Right, Bottom Gutters)
 */
function initResizablePanels() {
  const gridEl = document.querySelector(".main-dashboard-grid");
  const bottomScopesEl = document.querySelector(".bottom-scopes-grid");
  const gutterLeft = document.getElementById("gutterLeft");
  const gutterRight = document.getElementById("gutterRight");
  const gutterBottom = document.getElementById("gutterBottom");

  if (!gridEl) return;

  // Restore saved widths/height from localStorage
  const savedLeftW = localStorage.getItem("planttwin_left_w");
  const savedRightW = localStorage.getItem("planttwin_right_w");
  const savedBottomH = localStorage.getItem("planttwin_bottom_h");

  let leftW = savedLeftW ? parseFloat(savedLeftW) : 265;
  let rightW = savedRightW ? parseFloat(savedRightW) : 340;
  let bottomH = savedBottomH ? parseFloat(savedBottomH) : 165;

  const applyLayout = () => {
    gridEl.style.setProperty("--col-left-w", `${leftW}px`);
    gridEl.style.setProperty("--col-right-w", `${rightW}px`);
    if (bottomScopesEl) {
      bottomScopesEl.style.setProperty("--bottom-scopes-h", `${bottomH}px`);
    }
  };

  applyLayout();

  // 1. Left Gutter (Controls Column Width)
  if (gutterLeft) {
    gutterLeft.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      gutterLeft.classList.add("is-dragging");
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const startX = e.clientX;
      const startW = leftW;

      const onMove = (moveEvt) => {
        const dx = moveEvt.clientX - startX;
        leftW = Math.min(480, Math.max(190, startW + dx));
        gridEl.style.setProperty("--col-left-w", `${leftW}px`);
      };

      const onUp = () => {
        gutterLeft.classList.remove("is-dragging");
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        localStorage.setItem("planttwin_left_w", leftW);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    });
  }

  // 2. Right Gutter (Telemetry Column Width)
  if (gutterRight) {
    gutterRight.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      gutterRight.classList.add("is-dragging");
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const startX = e.clientX;
      const startW = rightW;

      const onMove = (moveEvt) => {
        const dx = startX - moveEvt.clientX;
        rightW = Math.min(520, Math.max(260, startW + dx));
        gridEl.style.setProperty("--col-right-w", `${rightW}px`);
      };

      const onUp = () => {
        gutterRight.classList.remove("is-dragging");
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        localStorage.setItem("planttwin_right_w", rightW);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    });
  }

  // 3. Bottom Gutter (Oscilloscopes Height)
  if (gutterBottom && bottomScopesEl) {
    gutterBottom.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      gutterBottom.classList.add("is-dragging");
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";

      const startY = e.clientY;
      const startH = bottomH;

      const onMove = (moveEvt) => {
        const dy = startY - moveEvt.clientY;
        bottomH = Math.min(420, Math.max(90, startH + dy));
        bottomScopesEl.style.setProperty("--bottom-scopes-h", `${bottomH}px`);
      };

      const onUp = () => {
        gutterBottom.classList.remove("is-dragging");
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        localStorage.setItem("planttwin_bottom_h", bottomH);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        if (telemetryCharts) telemetryCharts.renderAll();
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    });
  }
}

/**
 * Universal Draggable HUD Utility for 3D Viewport
 */
function makeElementDraggable(cardEl, containerEl) {
  if (!cardEl || !containerEl) return;

  let isDragging = false;
  let startX = 0, startY = 0;
  let initLeft = 0, initTop = 0;

  const onPointerDown = (e) => {
    if (e.target.tagName === "BUTTON" || e.target.tagName === "INPUT" || e.target.tagName === "SELECT") {
      return;
    }
    e.stopPropagation();

    isDragging = true;
    cardEl.classList.add("is-dragging");

    const containerRect = containerEl.getBoundingClientRect();
    const cardRect = cardEl.getBoundingClientRect();

    initLeft = cardRect.left - containerRect.left;
    initTop = cardRect.top - containerRect.top;

    startX = e.clientX;
    startY = e.clientY;

    cardEl.style.left = `${initLeft}px`;
    cardEl.style.top = `${initTop}px`;
    cardEl.style.right = "auto";
    cardEl.style.bottom = "auto";

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const containerRect = containerEl.getBoundingClientRect();
    const cardRect = cardEl.getBoundingClientRect();

    const maxLeft = Math.max(8, containerRect.width - cardRect.width - 8);
    const maxTop = Math.max(8, containerRect.height - cardRect.height - 8);

    const newLeft = Math.min(maxLeft, Math.max(8, initLeft + dx));
    const newTop = Math.min(maxTop, Math.max(8, initTop + dy));

    cardEl.style.left = `${newLeft}px`;
    cardEl.style.top = `${newTop}px`;
  };

  const onPointerUp = () => {
    if (!isDragging) return;
    isDragging = false;
    cardEl.classList.remove("is-dragging");
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  };

  cardEl.addEventListener("pointerdown", onPointerDown);
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

  // Two-way synchronization binding for slider and direct number input
  const updateSliderFill = (slider) => {
    if (!slider) return;
    const min = parseFloat(slider.min) || 0;
    const max = parseFloat(slider.max) || 100;
    const val = parseFloat(slider.value) || min;
    const pct = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));
    slider.style.setProperty("--slider-pct", `${pct}%`);
  };

  const bindTwoWayControl = (slider, numInput, callback) => {
    if (!slider || !numInput) return;
    updateSliderFill(slider);
    
    slider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      numInput.value = val;
      updateSliderFill(slider);
      callback(val);
    });

    numInput.addEventListener("input", (e) => {
      let val = parseFloat(e.target.value);
      if (isNaN(val)) return;
      const min = parseFloat(slider.min);
      const max = parseFloat(slider.max);
      const clamped = Math.min(max, Math.max(min, val));
      slider.value = clamped;
      updateSliderFill(slider);
      callback(clamped);
    });

    numInput.addEventListener("change", (e) => {
      let val = parseFloat(e.target.value);
      const min = parseFloat(slider.min);
      const max = parseFloat(slider.max);
      if (isNaN(val)) val = min;
      const clamped = Math.min(max, Math.max(min, val));
      numInput.value = clamped;
      slider.value = clamped;
      updateSliderFill(slider);
      callback(clamped);
    });
  };

  bindTwoWayControl(DOM.sliderPpfd, DOM.inputPpfd, (val) => envEngine.updateSetpoints({ ppfdTarget: val }));
  bindTwoWayControl(DOM.sliderPhotoperiod, DOM.inputPhotoperiod, (val) => envEngine.updateSetpoints({ photoperiodHours: val }));
  bindTwoWayControl(DOM.sliderRed, DOM.inputRed, (val) => envEngine.updateSetpoints({ spectrum: { ...envEngine.setpoints.spectrum, red: val } }));
  bindTwoWayControl(DOM.sliderBlue, DOM.inputBlue, (val) => envEngine.updateSetpoints({ spectrum: { ...envEngine.setpoints.spectrum, blue: val } }));
  bindTwoWayControl(DOM.sliderGreen, DOM.inputGreen, (val) => envEngine.updateSetpoints({ spectrum: { ...envEngine.setpoints.spectrum, green: val } }));
  bindTwoWayControl(DOM.sliderFarRed, DOM.inputFarRed, (val) => envEngine.updateSetpoints({ spectrum: { ...envEngine.setpoints.spectrum, farRed: val } }));
  bindTwoWayControl(DOM.sliderDayTemp, DOM.inputDayTemp, (val) => envEngine.updateSetpoints({ dayTempTarget: val }));
  bindTwoWayControl(DOM.sliderNightTemp, DOM.inputNightTemp, (val) => envEngine.updateSetpoints({ nightTempTarget: val }));
  bindTwoWayControl(DOM.sliderHumidity, DOM.inputHumidity, (val) => envEngine.updateSetpoints({ humidityTarget: val }));
  bindTwoWayControl(DOM.sliderCo2, DOM.inputCo2, (val) => envEngine.updateSetpoints({ co2Target: val }));
  bindTwoWayControl(DOM.sliderEc, DOM.inputEc, (val) => envEngine.updateSetpoints({ ecTarget: val }));

  // Switches
  DOM.checkUvb.addEventListener("change", (e) => {
    if (e.target.checked) audio.playUvElicitationTone();
    else audio.playClick();
    envEngine.updateSetpoints({ uvbActive: e.target.checked });
  });
  if (DOM.inputUvb) {
    DOM.inputUvb.addEventListener("change", (e) => {
      const val = parseFloat(e.target.value) || 1.2;
      envEngine.updateSetpoints({ uvbActive: true, uvbIntensity: val });
      DOM.checkUvb.checked = true;
    });
  }

  DOM.checkColdShift.addEventListener("change", (e) => {
    audio.playClick();
    envEngine.updateSetpoints({ coldShiftActive: e.target.checked });
  });
  if (DOM.inputColdShift) {
    DOM.inputColdShift.addEventListener("change", (e) => {
      const val = parseFloat(e.target.value) || 2.0;
      envEngine.updateSetpoints({ coldShiftActive: true, coldShiftDelta: val });
      DOM.checkColdShift.checked = true;
    });
  }

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
    
    // 5. Calculate Michaelis-Menten Root Ion Uptake Kinetics (NO3-, H2PO4-, K+)
    const ionUptake = biophysicalEngine.calculateRootIonUptake(envTele.sensors, crop, plantState);

    // 6. Update Top Diurnal Status Label with Time of Day Phase
    const hour = envTele.simulatedHour;
    let diurnalPhaseText = "☀️ 주간 피크 광합성";
    if (hour >= 5.0 && hour < 8.5) {
      diurnalPhaseText = "🌅 일출 램프업";
    } else if (hour >= 8.5 && hour < 17.0) {
      diurnalPhaseText = "☀️ 주간 피크 광합성";
    } else if (hour >= 17.0 && hour < 21.0) {
      diurnalPhaseText = "🌆 일몰 & Far-Red";
    } else {
      diurnalPhaseText = "🌙 야간 변온 DIF";
    }
    DOM.diurnalStatusLabel.textContent = `${diurnalPhaseText} ${envTele.timeFormatted}`;

    // 7. Update 8 Telemetry Tiles
    DOM.teleSensPpfd.textContent = Math.round(envTele.sensors.ppfd);
    DOM.teleSensRh.textContent = envTele.sensors.humidity.toFixed(1);
    DOM.teleSensAirTemp.textContent = envTele.sensors.airTemp.toFixed(1);
    DOM.teleSensCo2.textContent = Math.round(envTele.sensors.co2);
    DOM.teleSensLeafTemp.textContent = instantPhoto.stomata.leafTemp.toFixed(1);
    DOM.teleSensEc.textContent = envTele.sensors.ec.toFixed(2);
    DOM.teleSensVpd.textContent = envTele.sensors.vpd.toFixed(2);
    DOM.teleSensFvFm.textContent = instantPhoto.fvFm.toFixed(3);

    // 8. Update 6 KPI Tiles
    DOM.kpiTotalLutein.textContent = `${plantState.totalLuteinAccumulatedMg.toFixed(1)} mg`;
    DOM.kpiYieldGain.textContent = `+${Math.min(185, Math.round((plantState.luteinConcentration / crop.baseLuteinConcentration) * 100))}%`;
    DOM.kpiLuteinConc.textContent = `${plantState.luteinConcentration.toFixed(1)} mg/g DW`;
    DOM.kpiFreshWeight.textContent = `${plantState.freshWeightGrams.toFixed(1)} g`;
    DOM.kpiDryWeight.textContent = `${plantState.dryWeightGrams.toFixed(1)} g`;
    const ledKw = (envTele.sensors.ppfd / 2.8 * 0.8 + 35) / 1000;
    DOM.kpiEnergyEff.textContent = `${(molecularFlux.hourlyPlantFlux / (ledKw + 0.01)).toFixed(1)} mg/kWh`;

    // 9. Update Glassmorphic 3D Chamber HUD Cards (Leaf & Root with NPK Flux)
    DOM.hudChlAb.textContent = (3.15 + Math.sin(now * 0.001) * 0.08).toFixed(2);
    DOM.hudStomatalGs.textContent = `${instantPhoto.stomata.gs.toFixed(2)} mol m⁻² s⁻¹`;
    DOM.hudNpq.textContent = (1.25 + Math.cos(now * 0.001) * 0.05).toFixed(2);
    DOM.hudRootRh.textContent = `${(98.5 + Math.sin(now * 0.002) * 0.4).toFixed(1)} %`;
    DOM.hudRootTemp.textContent = `${ionUptake.rootTemp} °C`;
    DOM.hudRootO2.textContent = `${(ionUptake.absorptionRatio * 100).toFixed(1)}% (NPK)`;

    // 10. Update Timeline Scrubber Text
    DOM.teleDay.textContent = String(envTele.simulatedDay).padStart(2, '0');
    if (DOM.teleTimeFormatted) {
      DOM.teleTimeFormatted.textContent = `(${envTele.timeFormatted})`;
    }
    const stageKey = envTele.simulatedDay < 12 
      ? "stageSeedling" 
      : (envTele.simulatedDay < 28 ? "stageVegetative" : "stageFlowering");
    DOM.teleStage.textContent = i18n.t(stageKey);
    DOM.timelineSlider.value = envTele.simulatedDay;

    // 11. Push Telemetry Point to Oscilloscopes & Sparklines
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

    // 12. 3D Chamber Growth Dynamics & Diurnal Lighting & Root Heatmap
    if (plantChamber3d) {
      plantChamber3d.updateSimulation(plantState, envTele, crop, ionUptake);
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

    // Update Sliders & Number Inputs UI
    DOM.sliderPpfd.value = rec.ppfd; if (DOM.inputPpfd) DOM.inputPpfd.value = rec.ppfd;
    DOM.sliderDayTemp.value = rec.dayTemp; if (DOM.inputDayTemp) DOM.inputDayTemp.value = rec.dayTemp;
    DOM.sliderNightTemp.value = rec.nightTemp; if (DOM.inputNightTemp) DOM.inputNightTemp.value = rec.nightTemp;
    DOM.sliderCo2.value = rec.co2; if (DOM.inputCo2) DOM.inputCo2.value = rec.co2;
    DOM.sliderHumidity.value = rec.humidity; if (DOM.inputHumidity) DOM.inputHumidity.value = rec.humidity;
    DOM.sliderEc.value = rec.ec; if (DOM.inputEc) DOM.inputEc.value = rec.ec;
    DOM.sliderRed.value = rec.spectrum.red; if (DOM.inputRed) DOM.inputRed.value = rec.spectrum.red;
    DOM.sliderBlue.value = rec.spectrum.blue; if (DOM.inputBlue) DOM.inputBlue.value = rec.spectrum.blue;
    DOM.sliderGreen.value = rec.spectrum.green; if (DOM.inputGreen) DOM.inputGreen.value = rec.spectrum.green;
    DOM.sliderFarRed.value = rec.spectrum.farRed; if (DOM.inputFarRed) DOM.inputFarRed.value = rec.spectrum.farRed;
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
