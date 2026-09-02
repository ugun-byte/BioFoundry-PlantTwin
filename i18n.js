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
    tabRlStudio: "강화학습 스튜디오",
    tabExperiments: "가상 실험",
    tabReports: "규격서 리포트",
    btnParamEditor: "파라미터 에디터",
    btnExport: "내보내기",
    btnAutoTune: "AI 최적 레시피",
    btnAiAutoPilot: "AI 자율 운전",
    btnNewCrop: "신규 작물 등록",
    btnScheduler: "24H 스케줄러",
    btnPlant2Human: "Plant2Human 연동",

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

    // Center Column: Simulation Chamber & 3D Viewport Tools
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

    // Viewport Tools Drawer Buttons
    toolMicroscope: "세포 현미경",
    toolThermal: "FLIR 열화상 IR",
    toolHyperspectral: "초분광 NDVI/PRI",
    toolCavitation: "도관 초음파(UAE)",
    toolSapFlow: "수액 유량(Sap)",
    toolElectrophys: "근권 막전위(Vm)",
    toolPam: "PAM 형광 진단",
    toolHplc: "HPLC 크로마토",
    toolEis: "생체 임피던스(EIS)",
    toolMeristem: "세포 분열주기(SAM)",
    toolAba: "ABA 칼슘 파동(Ca²⁺)",
    toolHydroponic: "스마트 양액 폐쇄 루프(ISE)",
    toolThylakoid: "틸라코이드 ETC / ATP",
    toolPareto: "3D 파레토 다목적",
    toolRlAgent: "AI 강화학습",
    toolGmpCoa: "GMP 의약품 인증(CoA)",
    toolP2h: "Plant2Human",
    toolMicrobiome: "근권 미생물(PGPR)",
    toolCrispr: "CRISPR 유전자 편집",
    toolIotBridge: "IoT/Modbus 브릿지",
    toolCfdFlow: "CFD 기류 벡터",
    toolPhotons: "광양자(Photon) 스트림",
    toolsExpand: "펼치기 ▾",
    toolsCollapse: "접기 ▴",

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
    btnApplySchedule: "스마트팜 24H 자동 운전 적용",

    // Diurnal & Alarms
    diurnalSunrise: "🌅 일출 램프업",
    diurnalDayPeak: "☀️ 주간 피크 광합성",
    diurnalSunset: "🌆 일몰 & Far-Red",
    diurnalNightDif: "🌙 야간 변온 DIF",
    alarmDefaultTitle: "[위험] 기류/광합성 변화율 급변 감지!",
    alarmAnTitle: "광합성 탄소동화율(An) 급변 감지",
    alarmPpfdTitle: "조명 PPFD 조도 급변 감지",
    alarmCo2Title: "이산화탄소(CO₂) 농도 급변 감지",
    alarmSurge: "급상승",
    alarmDrop: "급감",
    alarmRateLabel: "변화율:",
    alarmVppTitle: "VPP 전력 피크 감축 기동",
    alarmVppDesc: "전력 도매 단가(SMP > 200원) 급등으로 피크 감축 운전 자동 진입 (조명/환기 0.64kW 감축)",
    alarmPlcConnectSuccessTitle: "실제 하드웨어 PLC 연동 성공",
    alarmPlcConnectSuccessDesc: "Node.js IoT Gateway 데몬(Modbus-TCP 5020 / WS 8092)에 실시간 연결되었습니다.",
    alarmPlcDisconnectTitle: "PLC 데몬 미연결",
    alarmPlcDisconnectDesc: "먼저 'PLC 하드웨어 데몬 연결' 버튼을 눌러 게이트웨이에 접속하세요.",
    alarmPlcWriteTitle: "FC06 제어값 전송",
    alarmPlcWriteDesc: "Modbus 레지스터 40001 (SETPOINT_PPFD) 쓰기 패킷 전송 완료",
    optimalStatus: "양호",
    cautionStatus: "주의"
  },

  en: {
    // Brand & Header
    brandName: "BioFoundry PlantTwin",
    tabOverview: "Cockpit Overview",
    tabTelemetry: "Telemetry SCADA",
    tabOptimization: "AI Optimization",
    tabRlStudio: "RL Studio",
    tabExperiments: "Virtual Lab",
    tabReports: "Reports & CoA",
    btnParamEditor: "Parameter Editor",
    btnExport: "Export",
    btnAutoTune: "AI Auto-Tune",
    btnAiAutoPilot: "AI Auto-Pilot",
    btnNewCrop: "New Crop",
    btnScheduler: "24H Scheduler",
    btnPlant2Human: "Plant2Human Link",

    // Context Strip
    targetMoleculeLabel: "Target Molecule:",
    dliUnit: "mol/m²d",
    ppfdUnit: "μmol",
    anUnit: "μmol/m²s",
    diurnalDay: "Daytime Photosynthesis Cycle",
    diurnalNight: "Night Respiration Dormancy",

    // Left Column: Environment Controls
    envControlsHeading: "Environmental Controls",
    sliderPpfd: "Light Flux (PPFD)",
    sliderPhotoperiod: "Photoperiod (Hours)",
    sliderRed: "Red Spectrum (660nm)",
    sliderBlue: "Blue Spectrum (450nm)",
    sliderGreen: "Green Spectrum (525nm)",
    sliderFarRed: "Far-Red Spectrum (730nm)",
    sliderDayTemp: "Day Temperature",
    sliderNightTemp: "Night Temperature",
    sliderHumidity: "Relative Humidity (RH)",
    sliderCo2: "CO₂ Concentration",
    sliderEc: "Nutrient EC",
    sliderUvb: "UV-B Pulse Stress",
    sliderColdShift: "Diurnal Cold Shift (DIF)",

    // Center Column: Simulation Chamber & 3D Viewport Tools
    chamberHeading: "3D Bioreactor Chamber",
    btnResetCamera: "Reset Camera",
    viewportTip: "👆 Click + drag to rotate • Scroll to zoom • R to reset • Click plant for Bio-HUD",
    hudLeafHeader: "LEAF BIO-ANALYSIS",
    hudRootHeader: "ROOT ZONE ANALYSIS",
    hudChl: "Chl a/b Ratio",
    hudGs: "Stomatal Conductance",
    hudNpq: "NPQ Quenching",
    hudRootRh: "Root Zone RH",
    hudRootTemp: "Root Zone Temp",
    hudRootO2: "Dissolved O₂",
    timeWarpLabel: "Time Warp",
    stageSeedling: "Seedling Stage",
    stageVegetative: "Vegetative Stage",
    stageFlowering: "Flowering & Harvest Stage",

    // Viewport Tools Drawer Buttons
    toolMicroscope: "Cell Microscopy",
    toolThermal: "FLIR Thermal IR",
    toolHyperspectral: "Hyperspectral NDVI",
    toolCavitation: "Cavitation (UAE)",
    toolSapFlow: "Sap Flow Dynamics",
    toolElectrophys: "Root Electrophys (Vm)",
    toolPam: "PAM Fluorescence",
    toolHplc: "HPLC Analysis",
    toolEis: "Bio-Impedance (EIS)",
    toolMeristem: "Meristem Cycle (SAM)",
    toolAba: "ABA Calcium Wave",
    toolHydroponic: "Closed-Loop ISE",
    toolThylakoid: "Thylakoid ETC / ATP",
    toolPareto: "3D Pareto Studio",
    toolRlAgent: "AI Reinforcement Learning",
    toolGmpCoa: "GMP Pharma CoA",
    toolP2h: "Plant2Human Link",
    toolMicrobiome: "Microbiome (PGPR)",
    toolCrispr: "CRISPR Gene Editing",
    toolIotBridge: "IoT / Modbus Bridge",
    toolCfdFlow: "CFD Flow Vectors",
    toolPhotons: "Photon Energy Stream",
    toolsExpand: "Expand ▾",
    toolsCollapse: "Collapse ▴",

    // Right Column: Telemetry (8)
    telemetryHeading: "Real-Time Telemetry",
    teleLive: "LIVE ●",
    telePpfd: "PPFD Flux",
    teleRh: "Humidity RH",
    teleAirTemp: "Air Temp",
    teleCo2: "CO₂ Level",
    teleLeafTemp: "Leaf Temp",
    teleEc: "Nutrient EC",
    teleVpd: "VPD Deficit",
    teleFvFm: "PSII Fv/Fm",

    // KPI (6)
    kpiHeading: "Core Bio-Production KPIs",
    kpiTotalTitle: "Cumulative Target Molecule",
    kpiGainTitle: "Yield Gain vs Benchmark",
    kpiConcTitle: "Concentration per Dry Weight",
    kpiFreshTitle: "Total Fresh Weight",
    kpiDryTitle: "Total Dry Weight",
    kpiEnergyTitle: "Energy Efficiency",

    // Bottom Oscilloscopes
    photoScopeHeading: "Photosynthesis Real-Time Scope",
    luteinScopeHeading: "Metabolic Flux & Accumulation Scope",
    legendAn: "Net An (μmol/m²s)",
    legendGs: "Stomatal gs (mol/m²s)",
    legendCi: "Intercellular Ci (ppm)",
    legendFlux: "Biosynthesis Flux (mg/h)",
    legendConc: "Concentration (mg/g DW)",
    scale1m: "1 min",
    scale24h: "24 hours",
    scale42d: "42 days",

    // Modals
    paramModalTitle: "Plant Biophysical & Genomic Parameter Editor",
    btnExportJson: "Export JSON",
    btnSaveParams: "Save Changes",
    exportModalTitle: "BioFoundry Data Export & Cloud Bridge",
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
    btnApplySchedule: "Deploy 24H Autonomous Schedule",

    // Diurnal & Alarms
    diurnalSunrise: "🌅 Sunrise Ramp-Up",
    diurnalDayPeak: "☀️ Daytime Peak Photosynthesis",
    diurnalSunset: "🌆 Sunset & Far-Red",
    diurnalNightDif: "🌙 Night DIF Dormancy",
    alarmDefaultTitle: "[WARNING] Rapid Rate of Change Detected!",
    alarmAnTitle: "Rapid Photosynthesis (An) Flux Shift",
    alarmPpfdTitle: "Rapid PPFD Irradiance Shift",
    alarmCo2Title: "Rapid CO₂ Concentration Shift",
    alarmSurge: "Rapid Surge",
    alarmDrop: "Rapid Drop",
    alarmRateLabel: "Rate:",
    alarmVppTitle: "VPP Peak Demand Curtailment Active",
    alarmVppDesc: "Auto-curtailment triggered by peak wholesale power tariff (SMP > 200 KRW/kWh).",
    alarmPlcConnectSuccessTitle: "Live Hardware PLC Link Established",
    alarmPlcConnectSuccessDesc: "Real-time connected to IoT Gateway (Modbus-TCP 5020 / WS 8092).",
    alarmPlcDisconnectTitle: "PLC Daemon Not Connected",
    alarmPlcDisconnectDesc: "Please click 'Connect PLC Hardware Daemon' button first.",
    alarmPlcWriteTitle: "FC06 Control Write Transmitted",
    alarmPlcWriteDesc: "Modbus register 40001 (SETPOINT_PPFD) write frame transmitted.",
    optimalStatus: "Optimal",
    cautionStatus: "Caution"
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
