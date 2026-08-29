/**
 * BioFoundry PlantTwin - Multilingual (Korean / English) i18n Dictionary & Manager
 */

export const I18N_DICTIONARY = {
  ko: {
    // Brand & Header
    brandName: "BioFoundry PlantTwin",
    tabOverview: "통합 콕핏",
    tabTelemetry: "원격 계측",
    tabOptimization: "AI 최적화",
    tabExperiments: "가상 실험",
    tabReports: "규격서 리포트",
    btnParamEditor: "파라미터 에디터",
    btnExport: "내보내기",
    btnAutoTune: "AI 최적 레시피",
    btnAiAutoPilot: "AI 자율 운전",
    btnNewCrop: "신규 작물 등록",
    btnScheduler: "24H 스케줄러",

    // Context Strip
    targetMoleculeLabel: "타깃 유효 분자:",
    dliUnit: "mol/m²d",
    ppfdUnit: "μmol",
    anUnit: "μmol/m²s",
    diurnalDay: "주간 광합성 사이클",
    diurnalNight: "야간 암호흡 휴면",

    // Left Column: Environment Controls
    envControlsHeading: "환경 제어 시스템",
    sliderPpfd: "광량 (PPFD)",
    sliderPhotoperiod: "일장 (광주기)",
    sliderRed: "적색 분광 (Red)",
    sliderBlue: "청색 분광 (Blue)",
    sliderGreen: "녹색 분광 (Green)",
    sliderFarRed: "원적색 분광 (Far-Red)",
    sliderDayTemp: "주간 온도",
    sliderNightTemp: "야간 온도",
    sliderHumidity: "상대 습도",
    sliderCo2: "CO₂ 농도",
    sliderEc: "양액 전기전도도",
    sliderUvb: "UV-B 펄스",
    sliderColdShift: "야간 변온 (DIF)",

    // Center Column: Simulation Chamber
    chamberHeading: "3D 시뮬레이션 바이오리액터",
    btnResetCamera: "카메라 리셋",
    viewportTip: "👆 마우스 드래그: 회전 • 휠: 줌 • R: 리셋 • 잎/뿌리 클릭: 생체 HUD",
    hudLeafHeader: "엽면 생체 분석",
    hudRootHeader: "근권 환경 분석",
    hudChl: "엽록소 a/b",
    hudGs: "기공전도도",
    hudNpq: "비광화학 소광",
    hudRootRh: "근권 습도",
    hudRootTemp: "근권 수온",
    hudRootO2: "용존 산소(O₂)",
    timeWarpLabel: "시간 가속",
    stageSeedling: "유묘기",
    stageVegetative: "영양 생장기",
    stageFlowering: "개화 및 수확기",

    // Right Column: Telemetry (8)
    telemetryHeading: "실시간 센서 텔레메트리",
    teleLive: "라이브 ●",
    telePpfd: "광량 PPFD",
    teleRh: "상대습도 RH",
    teleAirTemp: "대기온도 Temp",
    teleCo2: "탄산가스 CO₂",
    teleLeafTemp: "엽온 Leaf Temp",
    teleEc: "양액 EC",
    teleVpd: "포화수차 VPD",
    teleFvFm: "광계 효율 Fv/Fm",

    // KPI (6)
    kpiHeading: "핵심 바이오 생산 지표 (KPI)",
    kpiTotalTitle: "누적 유효분자 총생산량",
    kpiGainTitle: "표준 대비 수율 증가율",
    kpiConcTitle: "건중량당 유효분자 농도",
    kpiFreshTitle: "총 생체중 (Fresh Weight)",
    kpiDryTitle: "총 건중량 (Dry Weight)",
    kpiEnergyTitle: "전력당 생산 효율",

    // Bottom Oscilloscopes
    photoScopeHeading: "광합성 속도 오실로스코프",
    luteinScopeHeading: "대사 플럭스 & 축적 스코프",
    legendAn: "순광합성 속도 An",
    legendGs: "기공전도도 gs",
    legendCi: "세포간극 CO₂ Ci",
    legendFlux: "합성 플럭스 Flux",
    legendConc: "분자 농도 Conc",
    scale1m: "1분",
    scale24h: "24시간",
    scale42d: "42일",

    // Modals
    paramModalTitle: "식물 생물리학 & 유전체 파라미터 에디터",
    btnExportJson: "JSON 내보내기",
    btnSaveParams: "변경사항 저장",
    exportModalTitle: "바이오파운드리 데이터 추출 & 연동",
    btnExportCsv: "📊 생육 시계열 텔레메트리 CSV 내보내기",
    btnExportPlc: "📜 스마트팜 BACnet / MQTT PLC 제어 스크립트",
    btnExportP2h: "🔗 Plant2Human AI (원료 규격서) 연동 페이로드",
    optModalTitle: "AI 자율 최적 환경 역추적 솔버",
    optTabYield: "분자 수확량 극대화",
    optTabSpeed: "초고속 생육 가속",
    optTabEnergy: "전력당 경제성 극대화",
    optKpiGain: "수율 증가",
    optKpiDays: "수확일 단축",
    optKpiNetAn: "순광합성(An)",
    optKpiRuns: "가상 시뮬레이션",
    btnApplyRecipe: "최적 환경 적용 & AI 자율 운전 가동",
    newCropTitle: "신규 작물 & 약리 분자 등록",
    schedulerTitle: "24시간 스마트팜 환경 자동 제어 타임테이블",
    btnApplySchedule: "스마트팜 24H 자동 운전 적용"
  },

  en: {
    // Brand & Header
    brandName: "BioFoundry PlantTwin",
    tabOverview: "Overview",
    tabTelemetry: "Telemetry",
    tabOptimization: "Optimization",
    tabExperiments: "Experiments",
    tabReports: "Reports",
    btnParamEditor: "Parameter Editor",
    btnExport: "Export",
    btnAutoTune: "AI Auto-Tune",
    btnAiAutoPilot: "AI Auto-Tune",
    btnNewCrop: "New Crop",
    btnScheduler: "Scheduler",

    // Context Strip
    targetMoleculeLabel: "Target Molecule:",
    dliUnit: "mol/m²d",
    ppfdUnit: "μmol",
    anUnit: "μmol/m²s",
    diurnalDay: "Daytime Photosynthesis Cycle",
    diurnalNight: "Night Respiration Dormancy",

    // Left Column: Environment Controls
    envControlsHeading: "Environment Controls",
    sliderPpfd: "PPFD",
    sliderPhotoperiod: "Photoperiod",
    sliderRed: "Spectrum Red",
    sliderBlue: "Spectrum Blue",
    sliderGreen: "Spectrum Green",
    sliderFarRed: "Spectrum Far-Red",
    sliderDayTemp: "Day Temp",
    sliderNightTemp: "Night Temp",
    sliderHumidity: "Humidity",
    sliderCo2: "CO₂",
    sliderEc: "EC",
    sliderUvb: "UV-B",
    sliderColdShift: "Cold Shift",

    // Center Column: Simulation Chamber
    chamberHeading: "Simulation Chamber",
    btnResetCamera: "Reset Camera",
    viewportTip: "👆 Click + drag to rotate • Scroll to zoom • R to reset • Click plant for Bio-HUD",
    hudLeafHeader: "LEAF ANALYSIS",
    hudRootHeader: "ROOT ZONE",
    hudChl: "Chl a/b",
    hudGs: "Stomatal Cond.",
    hudNpq: "NPQ",
    hudRootRh: "RH",
    hudRootTemp: "Temp",
    hudRootO2: "O₂",
    timeWarpLabel: "Time Warp",
    stageSeedling: "Seedling Stage",
    stageVegetative: "Vegetative Stage",
    stageFlowering: "Flowering & Harvest Stage",

    // Right Column: Telemetry (8)
    telemetryHeading: "Telemetry",
    teleLive: "Live ●",
    telePpfd: "PPFD",
    teleRh: "RH",
    teleAirTemp: "Air Temp",
    teleCo2: "CO₂",
    teleLeafTemp: "Leaf Temp",
    teleEc: "EC",
    teleVpd: "VPD",
    teleFvFm: "Fv/Fm",

    // KPI (6)
    kpiHeading: "KPI",
    kpiTotalTitle: "Total Lutein Accumulated",
    kpiGainTitle: "Increase vs Standard",
    kpiConcTitle: "Lutein Concentration",
    kpiFreshTitle: "Fresh Weight",
    kpiDryTitle: "Dry Weight",
    kpiEnergyTitle: "Energy Efficiency",

    // Bottom Oscilloscopes
    photoScopeHeading: "Photosynthesis Scope",
    luteinScopeHeading: "Lutein Flux Scope",
    legendAn: "A (μmol CO₂/m²/s)",
    legendGs: "gs (mol/m²/s)",
    legendCi: "Ci (ppm)",
    legendFlux: "Lutein Flux (mg/m²/h)",
    legendConc: "Lutein Conc. (mg/g DW)",
    scale1m: "1 min",
    scale24h: "24 h",
    scale42d: "42 d",

    // Modals
    paramModalTitle: "Plant Biophysical & Genomic Parameter Editor",
    btnExportJson: "Export JSON",
    btnSaveParams: "Save Changes",
    exportModalTitle: "BioFoundry Data Export & Deployment",
    btnExportCsv: "📊 Export Growth Telemetry CSV",
    btnExportPlc: "📜 Smart Farm BACnet / MQTT PLC Script",
    btnExportP2h: "🔗 Plant2Human AI Raw Specification Payload",
    optModalTitle: "AI Autonomous Optimal Environment Inverse Solver",
    optTabYield: "Maximize Molecule Yield",
    optTabSpeed: "Speed Breeding Acceleration",
    optTabEnergy: "Maximize Economic Efficiency",
    optKpiGain: "Yield Gain",
    optKpiDays: "Days Saved",
    optKpiNetAn: "Net An",
    optKpiRuns: "Virtual Runs",
    btnApplyRecipe: "Apply Optimal Recipe & Start AI Auto-Pilot",
    newCropTitle: "Register New Crop & Pharmaceutical Molecule",
    schedulerTitle: "24-Hour Smart Farm Autonomous Timetable",
    btnApplySchedule: "Deploy 24H Autonomous Schedule"
  }
};

export class I18nManager {
  constructor(defaultLang = "ko") {
    this.currentLang = localStorage.getItem("planttwin_lang") || defaultLang;
  }

  setLanguage(lang) {
    if (lang === "ko" || lang === "en") {
      this.currentLang = lang;
      localStorage.setItem("planttwin_lang", lang);
      this.updateDOM();
    }
  }

  getLanguage() {
    return this.currentLang;
  }

  t(key) {
    const dict = I18N_DICTIONARY[this.currentLang] || I18N_DICTIONARY.ko;
    return dict[key] || key;
  }

  updateDOM() {
    const dict = I18N_DICTIONARY[this.currentLang];
    if (!dict) return;

    // Update all elements with data-i18n attribute
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // Update placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (dict[key]) {
        el.placeholder = dict[key];
      }
    });

    // Update language toggle button UI
    document.querySelectorAll(".lang-code").forEach((el) => {
      if (el.getAttribute("data-lang") === this.currentLang) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    });
  }
}
