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
import { IndustrialIoTBridge } from "./industrial-iot-bridge.js";

// Core Engines
const bioEngine = new BioPhysicalEngine();
const profileManager = new PlantProfileManager();
const envEngine = new EnvironmentalEngine();
const audio = new CyberAudioEngine();
const aiOptimizer = new AutonomousAiOptimizer();
const diurnalScheduler = new DiurnalScheduler();
const i18n = new I18nManager();
const iotBridge = new IndustrialIoTBridge("chamber_bio_01");

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
  viewportCard: document.querySelector(".viewport-card"),
  plant3dContainer: document.getElementById("plant3dContainer"),
  btnCapture4K: document.getElementById("btnCapture4K"),
  btnTargetFocus: document.getElementById("btnTargetFocus"),
  btnFullscreen: document.getElementById("btnFullscreen"),
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
  btnExpandScope1: document.getElementById("btnExpandScope1"),
  btnExpandScope2: document.getElementById("btnExpandScope2"),

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
  btnApplyDiurnalSchedule: document.getElementById("btnApplyDiurnalSchedule"),

  // OJIP Chlorophyll Fluorescence Modal
  btnPamPulse: document.getElementById("btnPamPulse"),
  ojipModal: document.getElementById("ojipModal"),
  ojipClose: document.getElementById("ojipClose"),
  ojipModalTitle: document.getElementById("ojipModalTitle"),
  ojipFvFm: document.getElementById("ojipFvFm"),
  ojipPiAbs: document.getElementById("ojipPiAbs"),
  ojipVj: document.getElementById("ojipVj"),
  ojipPhiEo: document.getElementById("ojipPhiEo"),
  ojipLegend: document.getElementById("ojipLegend"),
  ojipScopeCanvas: document.getElementById("ojipScopeCanvas"),
  btnReMeasurePam: document.getElementById("btnReMeasurePam"),

  // Root Electrophysiology Modal
  btnElectrophys: document.getElementById("btnElectrophys"),
  electrophysModal: document.getElementById("electrophysModal"),
  epClose: document.getElementById("epClose"),
  epVmVal: document.getElementById("epVmVal"),
  epStateBadge: document.getElementById("epStateBadge"),
  epPumpPct: document.getElementById("epPumpPct"),
  epKChanPct: document.getElementById("epKChanPct"),
  epNrtPct: document.getElementById("epNrtPct"),
  epScopeCanvas: document.getElementById("epScopeCanvas"),
  btnTriggerIonPulse: document.getElementById("btnTriggerIonPulse"),

  // pH & Smart PID Pump
  sliderPh: document.getElementById("sliderPh"),
  inputPh: document.getElementById("inputPh"),
  phCurrentBadge: document.getElementById("phCurrentBadge"),
  pumpAcidBadge: document.getElementById("pumpAcidBadge"),
  pumpBaseBadge: document.getElementById("pumpBaseBadge"),
  ionRatioText: document.getElementById("ionRatioText"),

  // Microscope Modal
  btnOpenMicroscope: document.getElementById("btnOpenMicroscope"),
  microscopeModal: document.getElementById("microscopeModal"),
  microscopeClose: document.getElementById("microscopeClose"),
  microscopeModalTitle: document.getElementById("microscopeModalTitle"),
  cellApertureVal: document.getElementById("cellApertureVal"),
  cellTurgorBadge: document.getElementById("cellTurgorBadge"),
  cellEtrVal: document.getElementById("cellEtrVal"),
  cellAtpVal: document.getElementById("cellAtpVal"),
  cellRubiscoVal: document.getElementById("cellRubiscoVal"),
  microscopeStomaCanvas: document.getElementById("microscopeStomaCanvas"),
  btnFocusZoomTissue: document.getElementById("btnFocusZoomTissue"),

  // Sap Flow Modal
  btnSapFlow: document.getElementById("btnSapFlow"),
  sapFlowModal: document.getElementById("sapFlowModal"),
  sapFlowClose: document.getElementById("sapFlowClose"),
  sapFlowModalTitle: document.getElementById("sapFlowModalTitle"),
  sapJsVal: document.getElementById("sapJsVal"),
  sapStatusBadge: document.getElementById("sapStatusBadge"),
  sapVolFlowVal: document.getElementById("sapVolFlowVal"),
  sapPsiVal: document.getElementById("sapPsiVal"),
  sapPlcVal: document.getElementById("sapPlcVal"),
  sapFlowScopeCanvas: document.getElementById("sapFlowScopeCanvas"),
  btnXylemSeeThrough: document.getElementById("btnXylemSeeThrough"),

  // FLIR Thermal IR Elements
  btnThermalMode: document.getElementById("btnThermalMode"),
  thermalLegendBar: document.getElementById("thermalLegendBar"),
  thermalHudLeafTemp: document.getElementById("thermalHudLeafTemp"),
  thermalHudDeltaT: document.getElementById("thermalHudDeltaT"),
  thermalHudCwsi: document.getElementById("thermalHudCwsi"),

  // Industrial IoT & Modbus Bridge Modal
  btnIotBridge: document.getElementById("btnIotBridge"),
  iotBridgeModal: document.getElementById("iotBridgeModal"),
  iotBridgeClose: document.getElementById("iotBridgeClose"),
  tabModbus: document.getElementById("tabModbus"),
  tabMqtt: document.getElementById("tabMqtt"),
  modbusTabContent: document.getElementById("modbusTabContent"),
  mqttTabContent: document.getElementById("mqttTabContent"),
  modbusRegisterTableBody: document.getElementById("modbusRegisterTableBody"),
  modbusHexDump: document.getElementById("modbusHexDump"),
  mqttTopicLabel: document.getElementById("mqttTopicLabel"),
  mqttPayloadPre: document.getElementById("mqttPayloadPre"),
  btnCopyMqttJson: document.getElementById("btnCopyMqttJson"),

  // Hyperspectral NDVI/PRI Modal
  btnHyperspectral: document.getElementById("btnHyperspectral"),
  hyperspectralModal: document.getElementById("hyperspectralModal"),
  hyperspectralClose: document.getElementById("hyperspectralClose"),
  hyperspectralModalTitle: document.getElementById("hyperspectralModalTitle"),
  hsNdviVal: document.getElementById("hsNdviVal"),
  hsNdviStatus: document.getElementById("hsNdviStatus"),
  hsPriVal: document.getElementById("hsPriVal"),
  hsReflRatio: document.getElementById("hsReflRatio"),
  hsChlIndex: document.getElementById("hsChlIndex"),
  hyperspectralCanvas: document.getElementById("hyperspectralCanvas"),
  btnToggleHs3dMode: document.getElementById("btnToggleHs3dMode"),

  // Stem Cavitation Ultrasonic Acoustic Emission (UAE) Modal
  btnCavitation: document.getElementById("btnCavitation"),
  cavitationModal: document.getElementById("cavitationModal"),
  cavitationClose: document.getElementById("cavitationClose"),
  cavitationModalTitle: document.getElementById("cavitationModalTitle"),
  uaeRateVal: document.getElementById("uaeRateVal"),
  uaeStatusBadge: document.getElementById("uaeStatusBadge"),
  uaePsiVal: document.getElementById("uaePsiVal"),
  uaeFreqVal: document.getElementById("uaeFreqVal"),
  uaeAmpVal: document.getElementById("uaeAmpVal"),
  cavitationScopeCanvas: document.getElementById("cavitationScopeCanvas"),
  btnListenPlantThirst: document.getElementById("btnListenPlantThirst")
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
  console.log("🚀 BioFoundry PlantTwin Initializing...");
  try {
    i18n.updateDOM();
  } catch (e) {
    console.error("i18n error:", e);
  }

  updatePlayButtonUI();

  try {
    populateCropDropdown();
  } catch (e) {
    console.error("populateCropDropdown error:", e);
  }

  try {
    plantChamber3d = new ThreePlantChamber(DOM.plant3dContainer);
  } catch (e) {
    console.error("ThreePlantChamber init error:", e);
  }

  try {
    telemetryCharts = new LiveTelemetryCharts({
      photoScope: DOM.photoScopeChart,
      luteinScope: DOM.luteinScopeChart
    });
  } catch (e) {
    console.error("LiveTelemetryCharts init error:", e);
  }

  // Wire 3D Raycasting Bio-HUD Pin Callback
  if (plantChamber3d) {
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

      if (DOM.hudNodeTitle) DOM.hudNodeTitle.textContent = data.nodeType;
      if (data.nodeType.includes("근권") || data.nodeType.includes("흡수근") || data.nodeType.includes("Root")) {
        if (DOM.hudLeafTemp) DOM.hudLeafTemp.textContent = `${(instantPhoto.stomata.leafTemp - 2.6).toFixed(1)} °C`;
        if (DOM.hudNetAn) DOM.hudNetAn.textContent = `${(instantPhoto.netAn * 0.45).toFixed(2)}`;
        if (DOM.hudMoleculeConc) DOM.hudMoleculeConc.textContent = `${(plantState.luteinConcentration * 0.62).toFixed(2)} mg/g`;
      } else {
        if (DOM.hudLeafTemp) DOM.hudLeafTemp.textContent = `${instantPhoto.stomata.leafTemp} °C`;
        if (DOM.hudNetAn) DOM.hudNetAn.textContent = `${instantPhoto.netAn.toFixed(2)} μmol`;
        if (DOM.hudMoleculeConc) DOM.hudMoleculeConc.textContent = `${plantState.luteinConcentration.toFixed(2)} mg/g DW`;
      }

      if (DOM.hologramBioHud) {
        // Clean docked positioning on top-left of viewport without jumping around during camera rotation
        if (!DOM.hologramBioHud.style.top || DOM.hologramBioHud.style.top === "" || DOM.hologramBioHud.style.top === "auto") {
          DOM.hologramBioHud.style.top = "68px";
          DOM.hologramBioHud.style.left = "24px";
        }
        DOM.hologramBioHud.style.display = "block";
      }
    });

    plantChamber3d.setEmptyClickCallback(() => {
      if (DOM.hologramBioHud) DOM.hologramBioHud.style.display = "none";
    });
  }

  if (DOM.hudPinClose) {
    DOM.hudPinClose.addEventListener("click", () => {
      if (DOM.hologramBioHud) DOM.hologramBioHud.style.display = "none";
      if (plantChamber3d) plantChamber3d.clearPin();
    });
  }

  // Initialize Draggable HUD Cards inside 3D Viewport
  const viewportCard = document.querySelector(".viewport-card");
  const leafCard = document.getElementById("hudLeafCard");
  const rootCard = document.getElementById("hudRootCard");
  const bioPinCard = document.getElementById("hologramBioHud");

  if (viewportCard) {
    if (leafCard) makeElementDraggable(leafCard, viewportCard);
    if (rootCard) makeElementDraggable(rootCard, viewportCard);
    if (bioPinCard) makeElementDraggable(bioPinCard, viewportCard);
  }

  // Initialize Interactive Resizable Panel Layout Gutters
  initResizablePanels();

  bindEventListeners();
  buildParamEditor();
  resetPlantState();

  console.log("✅ BioFoundry PlantTwin Initialized & Running 60FPS loop");
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
  bindTwoWayControl(DOM.sliderPh, DOM.inputPh, (val) => envEngine.updateSetpoints({ phTarget: val }));

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

  // Microscope Inspector Modal
  if (DOM.btnOpenMicroscope) {
    DOM.btnOpenMicroscope.addEventListener("click", openMicroscopeInspector);
  }
  if (DOM.microscopeClose) {
    DOM.microscopeClose.addEventListener("click", () => {
      if (DOM.microscopeModal) DOM.microscopeModal.classList.remove("active");
    });
  }
  if (DOM.btnFocusZoomTissue) {
    DOM.btnFocusZoomTissue.addEventListener("click", () => {
      audio.playPulse();
      if (plantChamber3d) {
        plantChamber3d.smoothFocusCamera(new THREE.Vector3(0, 0.45, 0), 1.2, 700);
      }
    });
  }

  // Sap Flow Modal
  if (DOM.btnSapFlow) {
    DOM.btnSapFlow.addEventListener("click", openSapFlowDiagnostics);
  }
  if (DOM.sapFlowClose) {
    DOM.sapFlowClose.addEventListener("click", () => {
      if (DOM.sapFlowModal) DOM.sapFlowModal.classList.remove("active");
    });
  }
  if (DOM.btnXylemSeeThrough) {
    DOM.btnXylemSeeThrough.addEventListener("click", () => {
      audio.playPulse();
      if (plantChamber3d) {
        plantChamber3d.triggerXylemFlowVisualization();
      }
    });
  }

  // FLIR Thermal IR Camera Mode Toggle
  if (DOM.btnThermalMode) {
    DOM.btnThermalMode.addEventListener("click", toggleThermalCameraMode);
  }

  // Industrial IoT Bridge Modal
  if (DOM.btnIotBridge) {
    DOM.btnIotBridge.addEventListener("click", openIotBridgeModal);
  }
  if (DOM.iotBridgeClose) {
    DOM.iotBridgeClose.addEventListener("click", () => {
      if (DOM.iotBridgeModal) DOM.iotBridgeModal.classList.remove("active");
    });
  }
  if (DOM.tabModbus && DOM.tabMqtt) {
    DOM.tabModbus.addEventListener("click", () => {
      audio.playClick();
      DOM.tabModbus.classList.add("active");
      DOM.tabMqtt.classList.remove("active");
      if (DOM.modbusTabContent) DOM.modbusTabContent.style.display = "block";
      if (DOM.mqttTabContent) DOM.mqttTabContent.style.display = "none";
    });
    DOM.tabMqtt.addEventListener("click", () => {
      audio.playClick();
      DOM.tabMqtt.classList.add("active");
      DOM.tabModbus.classList.remove("active");
      if (DOM.modbusTabContent) DOM.modbusTabContent.style.display = "none";
      if (DOM.mqttTabContent) DOM.mqttTabContent.style.display = "block";
    });
  }
  if (DOM.btnCopyMqttJson) {
    DOM.btnCopyMqttJson.addEventListener("click", copyMqttJsonPayload);
  }

  // Hyperspectral NDVI / PRI Diagnostics Modal
  if (DOM.btnHyperspectral) {
    DOM.btnHyperspectral.addEventListener("click", openHyperspectralModal);
  }
  if (DOM.hyperspectralClose) {
    DOM.hyperspectralClose.addEventListener("click", () => {
      if (DOM.hyperspectralModal) DOM.hyperspectralModal.classList.remove("active");
    });
  }
  if (DOM.btnToggleHs3dMode) {
    DOM.btnToggleHs3dMode.addEventListener("click", toggleHyperspectral3DMode);
  }

  // Stem Xylem Ultrasonic Acoustic Emission (UAE) Cavitation Modal
  if (DOM.btnCavitation) {
    DOM.btnCavitation.addEventListener("click", openCavitationModal);
  }
  if (DOM.cavitationClose) {
    DOM.cavitationClose.addEventListener("click", () => {
      if (DOM.cavitationModal) DOM.cavitationModal.classList.remove("active");
    });
  }
  if (DOM.btnListenPlantThirst) {
    DOM.btnListenPlantThirst.addEventListener("click", triggerListenPlantThirst);
  }

  // Timeline Controls
  DOM.btnPlay.addEventListener("click", () => {
    audio.playClick();
    isRunning = !isRunning;
    updatePlayButtonUI();
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

  // Bottom Oscilloscopes Maximize/Fullscreen Expand
  function setupScopeFullscreenToggle(btnElem, canvasElem) {
    if (!btnElem || !canvasElem) return;
    const scopeCard = canvasElem.closest(".scope-card");
    if (!scopeCard) return;

    btnElem.addEventListener("click", () => {
      audio.playClick();
      const isMaximized = scopeCard.classList.toggle("maximized-overlay");
      if (isMaximized) {
        btnElem.title = "원래 크기로 축소 (ESC)";
        btnElem.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.5"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`;
      } else {
        btnElem.title = "전체화면 확대";
        btnElem.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`;
      }
      setTimeout(() => {
        if (telemetryCharts) telemetryCharts.resizeAll();
      }, 60);
    });
  }

  setupScopeFullscreenToggle(DOM.btnExpandScope1, DOM.photoScopeChart);
  setupScopeFullscreenToggle(DOM.btnExpandScope2, DOM.luteinScopeChart);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".scope-card.maximized-overlay").forEach(card => {
        card.classList.remove("maximized-overlay");
      });
      [DOM.btnExpandScope1, DOM.btnExpandScope2].forEach(btn => {
        if (btn) {
          btn.title = "전체화면 확대";
          btn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`;
        }
      });
      setTimeout(() => {
        if (telemetryCharts) telemetryCharts.resizeAll();
      }, 60);
    }
  });

  // 3D Viewport Utility Controls (4K Snapshot, Target Focus, Fullscreen, Reset Camera)
  if (DOM.btnResetCamera) {
    DOM.btnResetCamera.addEventListener("click", () => {
      audio.playClick();
      if (plantChamber3d) plantChamber3d.resetCamera();
    });
  }

  if (DOM.btnTargetFocus) {
    DOM.btnTargetFocus.addEventListener("click", () => {
      audio.playClick();
      if (plantChamber3d) {
        plantChamber3d.smoothFocusCamera(new THREE.Vector3(0, 0.48, 0), 3.2, 500);
      }
    });
  }

  if (DOM.btnCapture4K) {
    DOM.btnCapture4K.addEventListener("click", () => {
      audio.playPulse();
      const canvas = DOM.plant3dContainer.querySelector("canvas");
      if (canvas) {
        const crop = profileManager.getActiveProfile();
        const curDay = DOM.teleDay ? DOM.teleDay.textContent : "01";
        const success = DataExporter.captureCanvasSnapshot(canvas, `BioFoundry_${crop.id}_Day${curDay}.png`);
        if (success) {
          DOM.btnCapture4K.style.borderColor = "var(--emerald-primary)";
          DOM.btnCapture4K.style.color = "var(--emerald-glow)";
          setTimeout(() => {
            DOM.btnCapture4K.style.borderColor = "";
            DOM.btnCapture4K.style.color = "";
          }, 1200);
        }
      }
    });
  }

  if (DOM.btnFullscreen) {
    DOM.btnFullscreen.addEventListener("click", () => {
      audio.playClick();
      const targetElem = DOM.viewportCard || DOM.plant3dContainer;
      if (!document.fullscreenElement) {
        if (targetElem.requestFullscreen) {
          targetElem.requestFullscreen();
        } else if (targetElem.webkitRequestFullscreen) {
          targetElem.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    });
  }

  document.addEventListener("fullscreenchange", () => {
    setTimeout(() => {
      if (plantChamber3d) plantChamber3d.onResize();
    }, 80);
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

  // OJIP Chlorophyll Fluorescence Modal
  if (DOM.btnPamPulse) {
    DOM.btnPamPulse.addEventListener("click", openOJIPDiagnostics);
  }
  if (DOM.ojipClose) {
    DOM.ojipClose.addEventListener("click", () => {
      if (DOM.ojipModal) DOM.ojipModal.classList.remove("active");
    });
  }
  if (DOM.btnReMeasurePam) {
    DOM.btnReMeasurePam.addEventListener("click", openOJIPDiagnostics);
  }

  // Root Electrophysiology Modal
  if (DOM.btnElectrophys) {
    DOM.btnElectrophys.addEventListener("click", openElectrophysDiagnostics);
  }
  if (DOM.epClose) {
    DOM.epClose.addEventListener("click", () => {
      if (DOM.electrophysModal) DOM.electrophysModal.classList.remove("active");
    });
  }
  if (DOM.btnTriggerIonPulse) {
    DOM.btnTriggerIonPulse.addEventListener("click", () => {
      if (plantChamber3d) plantChamber3d.triggerIonPulseAnimation();
      openElectrophysDiagnostics();
    });
  }

  // Generic Modal Close
  if (DOM.genericModalClose) {
    DOM.genericModalClose.addEventListener("click", () => DOM.genericCodeModal.classList.remove("active"));
  }
  if (DOM.btnGenericCopy) {
    DOM.btnGenericCopy.addEventListener("click", copyGenericModalCode);
  }

  // Universal Backdrop Click Dismiss & ESC Key Dismiss for All Modals
  document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove("active");
      }
    });
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-backdrop.active").forEach(m => m.classList.remove("active"));
    }
  });
}

function openMicroscopeInspector() {
  audio.playPulse();
  const crop = profileManager.getActiveProfile();
  const envTele = envEngine.getLiveSensorTelemetry();

  // 1. Calculate Microscopic Cellular & Stomata Metrics
  const cellData = bioEngine.calculateMicroscopicCellularMetrics(envTele.sensors, crop, plantState);

  // 2. Update Modal Metrics
  if (DOM.microscopeModalTitle) {
    DOM.microscopeModalTitle.textContent = `🔬 ${crop.name}: 초고해상도 세포 & 기공(Stomata) 인스펙터`;
  }
  if (DOM.cellApertureVal) DOM.cellApertureVal.textContent = `${cellData.stomaAperturePct}%`;
  if (DOM.cellTurgorBadge) DOM.cellTurgorBadge.textContent = `공변세포 팽압: ${cellData.guardTurgorMPa} MPa`;
  if (DOM.cellEtrVal) DOM.cellEtrVal.textContent = cellData.etrRate;
  if (DOM.cellAtpVal) DOM.cellAtpVal.textContent = `${cellData.atpFluxPct}%`;
  if (DOM.cellRubiscoVal) DOM.cellRubiscoVal.textContent = `${cellData.rubiscoActivePct}%`;

  // 3. Show Modal & Render Microscope Canvas
  if (DOM.microscopeModal) {
    DOM.microscopeModal.classList.add("active");
  }

  setTimeout(() => {
    if (telemetryCharts && DOM.microscopeStomaCanvas) {
      telemetryCharts.renderMicroscopeStomaView(DOM.microscopeStomaCanvas, cellData);
    }
  }, 60);
}

function openSapFlowDiagnostics() {
  audio.playPulse();
  const crop = profileManager.getActiveProfile();
  const envTele = envEngine.getLiveSensorTelemetry();

  // 1. Trigger 3D Xylem Streamline See-Through Pulse
  if (plantChamber3d) {
    plantChamber3d.triggerXylemFlowVisualization();
  }

  // 2. Calculate Sap Flow Dynamics
  const sapData = bioEngine.calculateSapFlowDynamics(envTele.sensors, crop, plantState);

  // 3. Update Modal Metrics
  if (DOM.sapFlowModalTitle) {
    DOM.sapFlowModalTitle.textContent = `💧 ${crop.name}: 도관부(Xylem) 수액 유량(Sap Flow) & 수생리학 진단`;
  }
  if (DOM.sapJsVal) DOM.sapJsVal.textContent = `${sapData.sapFluxDensity} cm/h`;
  if (DOM.sapStatusBadge) DOM.sapStatusBadge.textContent = `● ${sapData.hydraulicStatus}`;
  if (DOM.sapVolFlowVal) DOM.sapVolFlowVal.textContent = `${sapData.volumetricFlowMlH} mL/h`;
  if (DOM.sapPsiVal) DOM.sapPsiVal.textContent = `${sapData.stemWaterPotentialMPa} MPa`;
  if (DOM.sapPlcVal) DOM.sapPlcVal.textContent = `${sapData.plcPercent}%`;

  // 4. Show Modal & Render Oscilloscope
  if (DOM.sapFlowModal) {
    DOM.sapFlowModal.classList.add("active");
  }

  setTimeout(() => {
    if (telemetryCharts && DOM.sapFlowScopeCanvas) {
      telemetryCharts.renderSapFlowScope(DOM.sapFlowScopeCanvas, sapData);
    }
  }, 60);
}

function toggleThermalCameraMode() {
  audio.playPulse();
  const crop = profileManager.getActiveProfile();
  const envTele = envEngine.getLiveSensorTelemetry();
  const thermalData = bioEngine.calculateThermalLeafInfrared(envTele.sensors, crop, plantState);

  if (plantChamber3d) {
    const isThermal = plantChamber3d.toggleThermalCameraMode(thermalData.leafTemp, envTele.sensors.airTemp);
    if (DOM.thermalLegendBar) {
      DOM.thermalLegendBar.style.display = isThermal ? "block" : "none";
    }
    if (DOM.btnThermalMode) {
      if (isThermal) {
        DOM.btnThermalMode.style.background = "rgba(245, 158, 11, 0.45)";
        DOM.btnThermalMode.style.borderColor = "#fbbf24";
        DOM.btnThermalMode.style.boxShadow = "0 0 12px rgba(245, 158, 11, 0.6)";
      } else {
        DOM.btnThermalMode.style.background = "rgba(120, 53, 15, 0.25)";
        DOM.btnThermalMode.style.borderColor = "#f59e0b";
        DOM.btnThermalMode.style.boxShadow = "none";
      }
    }
    if (DOM.thermalHudLeafTemp) DOM.thermalHudLeafTemp.textContent = `${thermalData.leafTemp.toFixed(1)} °C`;
    if (DOM.thermalHudDeltaT) {
      DOM.thermalHudDeltaT.textContent = `${thermalData.deltaT > 0 ? '+' : ''}${thermalData.deltaT.toFixed(1)}°C`;
      DOM.thermalHudDeltaT.style.color = thermalData.deltaT < 0 ? "#34d399" : "#f43f5e";
    }
    if (DOM.thermalHudCwsi) {
      DOM.thermalHudCwsi.textContent = `${thermalData.cwsi} (${thermalData.cwsi < 0.3 ? '양호' : '주의'})`;
      DOM.thermalHudCwsi.style.color = thermalData.cwsi < 0.3 ? "#34d399" : "#f43f5e";
    }
  }
}

function openIotBridgeModal() {
  audio.playPulse();
  const crop = profileManager.getActiveProfile();
  const envTele = envEngine.getLiveSensorTelemetry();
  const instantPhoto = bioEngine.calculateInstantaneousPhotosynthesis(envTele.sensors, crop, plantState);
  const sapData = bioEngine.calculateSapFlowDynamics(envTele.sensors, crop, plantState);
  const thermalData = bioEngine.calculateThermalLeafInfrared(envTele.sensors, crop, plantState);

  const bioSummary = {
    leafTemp: thermalData.leafTemp,
    sapFluxDensity: sapData.sapFluxDensity,
    stemWaterPotential: sapData.stemWaterPotentialMPa,
    cwsi: thermalData.cwsi,
    gs: instantPhoto.stomata.gs,
    totalMetabolite: plantState.totalLuteinAccumulatedMg
  };

  const actuators = {
    acidPump: !!(envTele.phPid && envTele.phPid.acidPumpActive),
    basePump: !!(envTele.phPid && envTele.phPid.basePumpActive)
  };

  // 1. Generate Modbus Holding Registers
  const modbusList = iotBridge.generateModbusRegisterMap(envTele, bioSummary, actuators);
  const hexFrame = iotBridge.generateModbusTcpHexFrame();

  if (DOM.modbusRegisterTableBody) {
    DOM.modbusRegisterTableBody.innerHTML = modbusList.map(reg => `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
        <td style="padding: 5px 10px; font-family: monospace; color: #a78bfa;">${reg.addr}</td>
        <td style="padding: 5px 10px; font-family: monospace; color: #e9d5ff; font-weight: 600;">${reg.name}</td>
        <td style="padding: 5px 10px; font-family: monospace; color: #34d399; font-weight: 700;">${reg.value}</td>
        <td style="padding: 5px 10px; color: var(--text-muted);">${reg.unit}</td>
        <td style="padding: 5px 10px; color: #38bdf8;">${reg.scale}</td>
        <td style="padding: 5px 10px; color: var(--text-secondary); font-size: 10px;">${reg.desc}</td>
      </tr>
    `).join("");
  }

  if (DOM.modbusHexDump) {
    DOM.modbusHexDump.textContent = hexFrame.hexDump;
  }

  // 2. Generate MQTT JSON Payload
  const mqttData = iotBridge.generateMqttPayloads(envTele, bioSummary, crop);
  if (DOM.mqttTopicLabel) {
    DOM.mqttTopicLabel.textContent = mqttData.telemetryTopic;
  }
  if (DOM.mqttPayloadPre) {
    DOM.mqttPayloadPre.textContent = JSON.stringify(mqttData.telemetryPayload, null, 2);
  }

  // 3. Show Modal
  if (DOM.iotBridgeModal) {
    DOM.iotBridgeModal.classList.add("active");
  }
}

function copyMqttJsonPayload() {
  if (DOM.mqttPayloadPre) {
    navigator.clipboard.writeText(DOM.mqttPayloadPre.textContent).then(() => {
      DOM.btnCopyMqttJson.textContent = "✅ 복사 완료";
      setTimeout(() => {
        DOM.btnCopyMqttJson.textContent = "📋 MQTT JSON 페이로드 복사";
      }, 1200);
    });
  }
}

function openHyperspectralModal() {
  audio.playHyperspectralScan();
  const crop = profileManager.getActiveProfile();
  const envTele = envEngine.getLiveSensorTelemetry();
  const hsData = bioEngine.calculateHyperspectralReflectance(envTele.sensors, crop, plantState);

  if (DOM.hyperspectralModalTitle) {
    DOM.hyperspectralModalTitle.textContent = `🌈 ${crop.name}: 엽면 초분광 반사율(Hyperspectral) NDVI / PRI 분석`;
  }
  if (DOM.hsNdviVal) DOM.hsNdviVal.textContent = hsData.ndvi.toFixed(3);
  if (DOM.hsNdviStatus) DOM.hsNdviStatus.textContent = `● ${hsData.status}`;
  if (DOM.hsPriVal) {
    DOM.hsPriVal.textContent = `${hsData.pri > 0 ? '+' : ''}${hsData.pri.toFixed(4)}`;
    DOM.hsPriVal.style.color = hsData.pri > 0 ? "#10b981" : "#f43f5e";
  }
  if (DOM.hsReflRatio) DOM.hsReflRatio.textContent = `${hsData.r680} / ${hsData.r800}`;
  if (DOM.hsChlIndex) DOM.hsChlIndex.textContent = hsData.chlorophyllIndex.toFixed(2);

  if (DOM.hyperspectralModal) {
    DOM.hyperspectralModal.classList.add("active");
  }

  setTimeout(() => {
    if (telemetryCharts && DOM.hyperspectralCanvas) {
      telemetryCharts.renderHyperspectralScope(DOM.hyperspectralCanvas, hsData);
    }
  }, 60);
}

function toggleHyperspectral3DMode() {
  audio.playPulse();
  const crop = profileManager.getActiveProfile();
  const envTele = envEngine.getLiveSensorTelemetry();
  const hsData = bioEngine.calculateHyperspectralReflectance(envTele.sensors, crop, plantState);

  if (plantChamber3d) {
    const isHs = plantChamber3d.toggleHyperspectralCameraMode(hsData.ndvi);
    if (DOM.btnToggleHs3dMode) {
      DOM.btnToggleHs3dMode.textContent = isHs ? "✅ 3D 초분광(NDVI) 의사색상 활성화 중 (클릭 시 원복)" : "🌈 3D 초분광(NDVI) 의사색상 모드 전환";
    }
  }
}

function openCavitationModal() {
  audio.playCavitationPop(1100);
  const crop = profileManager.getActiveProfile();
  const envTele = envEngine.getLiveSensorTelemetry();
  const sapDynamics = bioEngine.calculateSapFlowDynamics(envTele.sensors, crop, plantState);
  const uaeData = bioEngine.calculateUltrasonicAcousticEmissions(envTele.sensors, crop, plantState, sapDynamics);

  if (DOM.cavitationModalTitle) {
    DOM.cavitationModalTitle.textContent = `🔊 ${crop.name}: 도관 기포 파열(Cavitation) 초음파 음향 방출(UAE) 스코프`;
  }
  if (DOM.uaeRateVal) DOM.uaeRateVal.textContent = `${uaeData.uaeRateEventsPerMin} Evt/min`;
  if (DOM.uaeStatusBadge) {
    DOM.uaeStatusBadge.textContent = `● ${uaeData.cavitationRisk}`;
    DOM.uaeStatusBadge.style.color = uaeData.uaeRateEventsPerMin < 10.0 ? "#34d399" : (uaeData.uaeRateEventsPerMin < 40.0 ? "#fbbf24" : "#f43f5e");
  }
  if (DOM.uaePsiVal) DOM.uaePsiVal.textContent = `${uaeData.psiStemMPa} MPa`;
  if (DOM.uaeFreqVal) DOM.uaeFreqVal.textContent = `${uaeData.peakFreqKhz} kHz`;
  if (DOM.uaeAmpVal) DOM.uaeAmpVal.textContent = `${uaeData.amplitudeDb} dB_AE`;

  if (DOM.cavitationModal) {
    DOM.cavitationModal.classList.add("active");
  }

  setTimeout(() => {
    if (telemetryCharts && DOM.cavitationScopeCanvas) {
      telemetryCharts.renderCavitationScope(DOM.cavitationScopeCanvas, uaeData);
    }
  }, 60);
}

function triggerListenPlantThirst() {
  const crop = profileManager.getActiveProfile();
  const envTele = envEngine.getLiveSensorTelemetry();
  const sapDynamics = bioEngine.calculateSapFlowDynamics(envTele.sensors, crop, plantState);
  const uaeData = bioEngine.calculateUltrasonicAcousticEmissions(envTele.sensors, crop, plantState, sapDynamics);

  audio.playCavitationPop(uaeData.audiblePitchHz || 1200);
  if (plantChamber3d) {
    plantChamber3d.triggerCavitationAcousticPulse();
  }

  if (DOM.btnListenPlantThirst) {
    DOM.btnListenPlantThirst.style.borderColor = "#f472b6";
    DOM.btnListenPlantThirst.style.boxShadow = "0 0 14px rgba(244, 114, 182, 0.7)";
    setTimeout(() => {
      DOM.btnListenPlantThirst.style.borderColor = "rgba(236, 72, 153, 0.4)";
      DOM.btnListenPlantThirst.style.boxShadow = "none";
    }, 400);
  }
}

function openElectrophysDiagnostics() {
  audio.playPulse();
  const crop = profileManager.getActiveProfile();
  const envTele = envEngine.getLiveSensorTelemetry();

  // 1. Trigger 3D Root Ion Pulse Wave
  if (plantChamber3d) {
    plantChamber3d.triggerIonPulseAnimation();
  }

  // 2. Calculate Root Electrophysiology
  const electroData = bioEngine.calculateRootElectrophysiology(envTele.sensors, crop, plantState);

  // 3. Update Metric Tiles
  if (DOM.epModalTitle) {
    DOM.epModalTitle.textContent = `⚡ 근권 세포막 전위(Vm) & 이온 채널 개폐: ${crop.name}`;
  }
  if (DOM.epVmVal) DOM.epVmVal.textContent = `${electroData.membranePotential} mV`;
  if (DOM.epStateBadge) {
    DOM.epStateBadge.textContent = `● ${electroData.stateLabel}`;
    DOM.epStateBadge.style.color = electroData.stateColor;
  }
  if (DOM.epPumpPct) DOM.epPumpPct.textContent = `${electroData.protonPumpPct}%`;
  if (DOM.epKChanPct) DOM.epKChanPct.textContent = `${electroData.kChannelOpen}%`;
  if (DOM.epNrtPct) DOM.epNrtPct.textContent = `${electroData.nrtActivity}%`;

  // 4. Show Modal & Render Oscilloscope
  if (DOM.electrophysModal) {
    DOM.electrophysModal.classList.add("active");
  }

  setTimeout(() => {
    if (telemetryCharts && DOM.epScopeCanvas) {
      telemetryCharts.renderElectrophysScope(DOM.epScopeCanvas, electroData);
    }
  }, 60);
}

function openOJIPDiagnostics() {
  audio.playPulse();
  const crop = profileManager.getActiveProfile();
  const envTele = envEngine.getLiveSensorTelemetry();

  // 1. Trigger 3D PAM Saturating Flash & Crimson Fluorescence Pulse
  if (plantChamber3d) {
    plantChamber3d.triggerPamFluorescenceFlash();
  }

  // 2. Calculate Active Crop OJIP Kinetic Data
  const primaryOJIP = bioEngine.calculateOJIPTransient(envTele.sensors, crop, plantState);

  // 3. Calculate Comparison Species Curves for Overlays
  const allProfiles = profileManager.getAllProfiles();
  const compList = allProfiles
    .filter(p => p.id !== crop.id)
    .map(p => bioEngine.calculateOJIPTransient(envTele.sensors, p, plantState));

  // 4. Update Modal Titles and Key JIP Metrics
  if (DOM.ojipModalTitle) {
    DOM.ojipModalTitle.textContent = `🔬 OJIP 엽록소 형광 진단: ${crop.name}`;
  }
  if (DOM.ojipFvFm) DOM.ojipFvFm.textContent = primaryOJIP.jipMetrics.fvFm.toFixed(3);
  if (DOM.ojipPiAbs) DOM.ojipPiAbs.textContent = primaryOJIP.jipMetrics.piAbs.toFixed(2);
  if (DOM.ojipVj) DOM.ojipVj.textContent = primaryOJIP.jipMetrics.vj.toFixed(3);
  if (DOM.ojipPhiEo) DOM.ojipPhiEo.textContent = primaryOJIP.jipMetrics.phiEo.toFixed(3);

  if (DOM.ojipLegend) {
    DOM.ojipLegend.textContent = `● ${crop.name} (실시간)`;
  }

  // 5. Show Modal & Render Scope
  if (DOM.ojipModal) {
    DOM.ojipModal.classList.add("active");
  }

  setTimeout(() => {
    if (telemetryCharts && DOM.ojipScopeCanvas) {
      telemetryCharts.renderOJIPScope(DOM.ojipScopeCanvas, primaryOJIP, compList);
    }
  }, 60);
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

  const dayRatio = (dayClamped - 1) / Math.max(1, crop.harvestDays - 1);
  const logistic = 1 / (1 + Math.exp(-0.2 * (dayClamped - 20)));
  plantState.dryWeightGrams = +(0.1 + 18.5 * logistic).toFixed(1);
  plantState.freshWeightGrams = +(plantState.dryWeightGrams * 10.2).toFixed(1);
  plantState.heightCm = +(8.0 + (crop.harvestDays === 42 ? 77.0 : 40.0) * Math.pow(dayRatio, 0.9)).toFixed(1);
  plantState.leafCount = Math.floor(2 + dayRatio * 14);
  plantState.lai = +(0.05 + (crop.maxLai - 0.05) * logistic).toFixed(2);
  plantState.leafDryWeightGrams = +(plantState.dryWeightGrams * crop.leafPartitionRatio).toFixed(1);
  plantState.luteinConcentration = +(crop.baseLuteinConcentration * (1.0 + (envEngine.setpoints.uvbActive && dayClamped >= (crop.harvestDays - 7) ? 0.6 : 0.2))).toFixed(1);
  plantState.totalLuteinAccumulatedMg = +(plantState.luteinConcentration * plantState.leafDryWeightGrams).toFixed(1);

  // Live Instantaneous UI and 3D Update on Drag
  const envTele = envEngine.getLiveSensorTelemetry();
  DOM.teleDay.textContent = String(dayClamped).padStart(2, '0');
  if (DOM.teleTimeFormatted) {
    DOM.teleTimeFormatted.textContent = `(${envTele.timeFormatted})`;
  }
  const stageKey = dayClamped < 12 
    ? "stageSeedling" 
    : (dayClamped < 28 ? "stageVegetative" : "stageFlowering");
  DOM.teleStage.textContent = i18n.t(stageKey);

  const ionUptake = bioEngine.calculateRootIonUptake(envTele.sensors, crop, plantState);
  if (plantChamber3d) {
    plantChamber3d.updateSimulation(plantState, envTele, crop, ionUptake);
  }
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
    const ionUptake = bioEngine.calculateRootIonUptake(envTele.sensors, crop, plantState);

    // 5b. Calculate Dynamic Xylem Sap Flow & Modulate 3D Streamline Velocity
    const sapFlowData = bioEngine.calculateSapFlowDynamics(envTele.sensors, crop, plantState);
    if (plantChamber3d && plantChamber3d.setSapFlowSpeed) {
      plantChamber3d.setSapFlowSpeed(sapFlowData.sapFluxDensity);
    }

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

    // 9b. Update Smart pH and PID Auto-Dosing Pump Badges
    if (DOM.phCurrentBadge) {
      DOM.phCurrentBadge.textContent = `${envTele.sensors.ph.toFixed(2)} pH`;
    }
    if (DOM.pumpAcidBadge && envTele.phPid) {
      if (envTele.phPid.acidPumpActive) {
        DOM.pumpAcidBadge.style.background = "rgba(244, 63, 94, 0.25)";
        DOM.pumpAcidBadge.style.borderColor = "rgba(244, 63, 94, 0.6)";
        DOM.pumpAcidBadge.style.color = "#fda4af";
        DOM.pumpAcidBadge.textContent = `산(HNO₃) 투입: ${envTele.phPid.dosingRateMlMin} mL/min`;
      } else {
        DOM.pumpAcidBadge.style.background = "rgba(255, 255, 255, 0.05)";
        DOM.pumpAcidBadge.style.borderColor = "rgba(255, 255, 255, 0.1)";
        DOM.pumpAcidBadge.style.color = "var(--text-muted)";
        DOM.pumpAcidBadge.textContent = "산(HNO₃) 펌프: 대기";
      }
    }
    if (DOM.pumpBaseBadge && envTele.phPid) {
      if (envTele.phPid.basePumpActive) {
        DOM.pumpBaseBadge.style.background = "rgba(0, 242, 254, 0.25)";
        DOM.pumpBaseBadge.style.borderColor = "rgba(0, 242, 254, 0.6)";
        DOM.pumpBaseBadge.style.color = "#67e8f9";
        DOM.pumpBaseBadge.textContent = `알칼리(KOH) 투입: ${envTele.phPid.dosingRateMlMin} mL/min`;
      } else {
        DOM.pumpBaseBadge.style.background = "rgba(255, 255, 255, 0.05)";
        DOM.pumpBaseBadge.style.borderColor = "rgba(255, 255, 255, 0.1)";
        DOM.pumpBaseBadge.style.color = "var(--text-muted)";
        DOM.pumpBaseBadge.textContent = "알칼리(KOH) 펌프: 대기";
      }
    }

    // 9c. Update Thermal IR HUD Legend if Active
    if (plantChamber3d && plantChamber3d.isThermalMode) {
      const thermalLive = bioEngine.calculateThermalLeafInfrared(envTele.sensors, crop, plantState);
      if (DOM.thermalHudLeafTemp) DOM.thermalHudLeafTemp.textContent = `${thermalLive.leafTemp.toFixed(1)} °C`;
      if (DOM.thermalHudDeltaT) {
        DOM.thermalHudDeltaT.textContent = `${thermalLive.deltaT > 0 ? '+' : ''}${thermalLive.deltaT.toFixed(1)}°C`;
        DOM.thermalHudDeltaT.style.color = thermalLive.deltaT < 0 ? "#34d399" : "#f43f5e";
      }
      if (DOM.thermalHudCwsi) {
        DOM.thermalHudCwsi.textContent = `${thermalLive.cwsi} (${thermalLive.cwsi < 0.3 ? '양호' : '주의'})`;
        DOM.thermalHudCwsi.style.color = thermalLive.cwsi < 0.3 ? "#34d399" : "#f43f5e";
      }
    }

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

function updatePlayButtonUI() {
  if (!DOM.btnPlay) return;
  DOM.btnPlay.innerHTML = isRunning 
    ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`
    : `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
  DOM.btnPlay.title = isRunning ? "일시정지" : "재생";
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

// Launch application on DOM ready or immediately if already loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
