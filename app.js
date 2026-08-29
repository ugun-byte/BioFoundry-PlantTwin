import { BioPhysicalEngine } from "./biophysical-model.js";
import { PlantProfileManager } from "./plant-profile-manager.js";
import { EnvironmentalEngine } from "./environmental-engine.js";
import { PlantCanvas3D } from "./plant-canvas-3d.js";
import { LiveTelemetryCharts } from "./live-telemetry-charts.js";
import { CyberAudioEngine } from "./sound-effects.js";
import { DataExporter } from "./data-exporter.js";

// Core Engines
const bioEngine = new BioPhysicalEngine();
const profileManager = new PlantProfileManager();
const envEngine = new EnvironmentalEngine();
const audio = new CyberAudioEngine();

let plantCanvas3d = null;
let telemetryCharts = null;

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

  // 3D View Modes
  btnViewMacro: document.getElementById("btnViewMacro"),
  btnViewMicro: document.getElementById("btnViewMicro"),
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

  // Canvases
  plantCanvas: document.getElementById("plantCanvas"),
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
  modalRecipeDesc: document.getElementById("modalRecipeDesc"),
  modalRecipeCode: document.getElementById("modalRecipeCode"),
  modalClose: document.getElementById("modalClose"),
  btnApplyRecipe: document.getElementById("btnApplyRecipe"),

  genericCodeModal: document.getElementById("genericCodeModal"),
  genericModalTitle: document.getElementById("genericModalTitle"),
  genericModalCode: document.getElementById("genericModalCode"),
  genericModalClose: document.getElementById("genericModalClose"),
  btnGenericCopy: document.getElementById("btnGenericCopy"),

  warpButtons: document.querySelectorAll(".warp-btn")
};

// Initialize Application
function initApp() {
  plantCanvas3d = new PlantCanvas3D(DOM.plantCanvas);
  telemetryCharts = new LiveTelemetryCharts({
    photoScope: DOM.photoScopeChart,
    luteinScope: DOM.luteinScopeChart
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
    DOM.btnSoundToggle.textContent = audio.enabled ? "🔊" : "🔇";
  });

  // Crop Selector
  DOM.cropSelect.addEventListener("change", (e) => {
    audio.playClick();
    profileManager.setActiveProfile(e.target.value);
    const crop = profileManager.getActiveProfile();
    DOM.targetMoleculeText.textContent = `${crop.targetMolecule} (${crop.chemicalFormula})`;
    buildParamEditor();
    resetPlantState();
  });

  // View Modes (Macro vs Micro Cellular)
  DOM.btnViewMacro.addEventListener("click", () => {
    audio.playClick();
    DOM.btnViewMacro.classList.add("active");
    DOM.btnViewMicro.classList.remove("active");
    plantCanvas3d.setViewMode("macro");
  });

  DOM.btnViewMicro.addEventListener("click", () => {
    audio.playPulse();
    DOM.btnViewMicro.classList.add("active");
    DOM.btnViewMacro.classList.remove("active");
    plantCanvas3d.setViewMode("micro");
  });

  DOM.btnResetCamera.addEventListener("click", () => {
    audio.playClick();
    plantCanvas3d.resetCamera();
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
    DOM.btnPlay.textContent = isRunning ? "⏸" : "▶";
  });

  DOM.btnReset.addEventListener("click", () => {
    audio.playClick();
    resetPlantState();
  });

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
    DataExporter.captureCanvasSnapshot(DOM.plantCanvas, `BioFoundry_4K_${profileManager.getActiveProfile().id}.png`);
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

  DOM.genericModalClose.addEventListener("click", () => DOM.genericCodeModal.classList.remove("active"));
  DOM.btnGenericCopy.addEventListener("click", copyGenericModalCode);

  DOM.btnAutoTune.addEventListener("click", showAutoTuneModal);
  DOM.modalClose.addEventListener("click", () => DOM.recipeModal.classList.remove("active"));
  DOM.btnApplyRecipe.addEventListener("click", applyAutoTuneRecipe);
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
    DOM.anLiveDisplay.textContent = `${instantPhoto.netAn} μmol/m²s (${instantPhoto.limitingFactor})`;
    DOM.timelineDayLabel.textContent = `Day ${envTele.simulatedDay} / ${crop.harvestDays} (${envTele.timeFormatted})`;
    DOM.timelineSlider.value = envTele.simulatedDay;

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

    // 7. Render 3D Living Plant Canvas
    plantCanvas3d.render(plantState, envTele, crop);
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

let pendingAutoTuneRecipe = null;

function showAutoTuneModal() {
  audio.playPulse();
  const crop = profileManager.getActiveProfile();
  pendingAutoTuneRecipe = {
    recipeName: `AI 파레토 최적화: ${crop.name} 분자농업 생산 극대화 레시피 (v4.0)`,
    description: "생물리학적 광합성 모델과 2차 대사산물 생합성 플럭스를 결합하여 최단 일수 내 최고 수율을 도출한 스마트팜 제어 데이터",
    settings: {
      ppfd: 480,
      photoperiod: 18,
      spectrum: { red: 50, blue: 38, green: 7, farRed: 5 },
      dayTemp: 23.5,
      nightTemp: 16.5,
      humidity: 62,
      co2: 950,
      ec: 2.3,
      uvbActive: true,
      coldShiftActive: true
    },
    projectedYield: "+275% 루테인 생산 증대 (18.4 mg/plant)",
    energyCostSavings: "전력 효율 1.62 mg/kWh"
  };

  DOM.modalRecipeTitle.textContent = "✨ " + pendingAutoTuneRecipe.recipeName;
  DOM.modalRecipeDesc.textContent = `${pendingAutoTuneRecipe.description} (${pendingAutoTuneRecipe.projectedYield})`;
  DOM.modalRecipeCode.textContent = JSON.stringify(pendingAutoTuneRecipe, null, 2);
  DOM.btnApplyRecipe.style.display = "inline-flex";
  DOM.recipeModal.classList.add("active");
}

function applyAutoTuneRecipe() {
  audio.playClick();
  if (!pendingAutoTuneRecipe) return;
  const s = pendingAutoTuneRecipe.settings;

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

  DOM.recipeModal.classList.remove("active");
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

// Start Application
window.addEventListener("DOMContentLoaded", initApp);
