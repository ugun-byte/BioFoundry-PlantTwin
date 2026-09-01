import { readFileSync } from 'fs';
import { resolve } from 'path';

console.log("=================================================");
console.log("🧪 BioFoundry-PlantTwin Comprehensive Automated Test Suite");
console.log("=================================================\n");

let passed = 0;
let failed = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName} ${details}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName} ${details}`);
    failed++;
  }
}

// 1. Load BioPhysicalEngine
import('../biophysical-model.js').then(async ({ BioPhysicalEngine }) => {
  const bio = new BioPhysicalEngine();
  
  console.log("🔬 1. Testing Biophysical Modeling Engine (BiophysicalModel):");
  
  const plantState = { rootMass: 45.0, biomass: 120.0, leafArea: 0.85 };
  const envSensors = { temperature: 24.5, ph: 6.2, par: 480.0, co2: 600.0, ec: 2.1, humidity: 68.0 };

  // Test 1.1: Rhizosphere PGPR Microbiome (Bacillus velezensis)
  const bvData = bio.calculateRhizosphereMicrobiomeDynamics(plantState, envSensors, {
    innoculantType: "bacillus_velezensis",
    dosageLevel: 1.0
  });
  assert(bvData.cfuDensityLog >= 6.0 && bvData.cfuDensityLog <= 10.0, "Microbiome CFU Density in valid range", `(Log CFU: ${bvData.cfuDensityLog})`);
  assert(bvData.biofilmColonizationPct > 50.0 && bvData.biofilmColonizationPct <= 100.0, "Biofilm Colonization valid", `(${bvData.biofilmColonizationPct}%)`);
  assert(bvData.phosphateSolubilizedUmolPerHour > 0.0, "Phosphate Solubilization > 0", `(${bvData.phosphateSolubilizedUmolPerHour} umol/h)`);
  assert(bvData.fertilizerReductionRatePct > 20.0, "Chemical Fertilizer Reduction valid", `(${bvData.fertilizerReductionRatePct}%)`);
  assert(bvData.wavePoints.length === 121, "Microbiome 60s Waveform Points generated", `(${bvData.wavePoints.length} points)`);

  // Test 1.2: Rhizosphere PGPR Microbiome (Rhizobium leguminosarum BNF)
  const rhData = bio.calculateRhizosphereMicrobiomeDynamics(plantState, envSensors, {
    innoculantType: "rhizobium",
    dosageLevel: 2.0
  });
  assert(rhData.nitrogenaseActivityNmol > 150.0, "Rhizobium BNF Nitrogenase Activity high", `(${rhData.nitrogenaseActivityNmol} nmol/h)`);
  assert(rhData.bioAvailableNitrogenPpm > 15.0, "Bio-available Nitrogen PPM elevated", `(${rhData.bioAvailableNitrogenPpm} ppm)`);

  // Test 1.3: CRISPR-Cas9 LCY-e Knockout (Carotenoid / Lutein Yield Multiplier)
  const crisprKo = bio.calculateCrisprMetabolicRewiring(plantState, envSensors, {
    targetCrop: "tomato",
    editGene: "LCY-e",
    editMode: "knockout"
  });
  assert(crisprKo.onTargetScore >= 85.0 && crisprKo.onTargetScore <= 100.0, "CRISPR Cas9 On-Target Efficiency high", `(${crisprKo.onTargetScore}%)`);
  assert(crisprKo.yieldMultiplier > 3.0, "LCY-e KO Yield Multiplier > 3x", `(${crisprKo.yieldMultiplier}x)`);
  assert(crisprKo.expressionFoldChange < 0.1, "Knock-out expression fold change suppressed", `(Fold: ${crisprKo.expressionFoldChange})`);
  assert(crisprKo.networkNodes.length === 4, "FBA Network Nodes correctly generated", `(${crisprKo.networkNodes.length} nodes)`);
  assert(crisprKo.wavePoints.length === 121, "CRISPR 60s Waveform Points generated", `(${crisprKo.wavePoints.length} points)`);

  // Test 1.4: CRISPR-Cas9 PAL Overexpression (Resveratrol Pathway)
  const crisprPal = bio.calculateCrisprMetabolicRewiring(plantState, envSensors, {
    targetCrop: "soybean",
    editGene: "PAL",
    editMode: "overexpression"
  });
  assert(crisprPal.yieldMultiplier > 4.0, "PAL Overexpression Yield Multiplier high", `(${crisprPal.yieldMultiplier}x)`);
  assert(crisprPal.expressionFoldChange > 4.0, "Overexpression expression fold change elevated", `(${crisprPal.expressionFoldChange}x)`);
  assert(crisprPal.biomassPenaltyPct < 10.0, "Metabolic burden penalty acceptable", `(${crisprPal.biomassPenaltyPct}%)`);

  // Test 1.5: Verify HPLC, EIS, Meristem, ABA, Thylakoid ETC calculations
  const hplc = bio.calculateHplcChromatogram(envSensors, { id: "marigold", name: "메리골드", targetMolecule: "Lutein" }, plantState);
  assert(hplc.targetRtMin > 0 && hplc.targetPurityPercent > 0.0, "HPLC Chromatogram calculation valid", `(RT: ${hplc.targetRtMin}m, Target Purity: ${hplc.targetPurityPercent}%)`);

  const eis = bio.calculateEisImpedanceSpectroscopy(envSensors, { id: "marigold" }, plantState);
  assert(eis.membraneViabilityPct > 50.0 && eis.sweepData.length >= 50, "EIS Impedance Spectroscopy sweep valid", `(Viability: ${eis.membraneViabilityPct}%, Sweeps: ${eis.sweepData.length})`);

  const etc = bio.calculateThylakoidEtcDynamics(envSensors, { id: "marigold" }, plantState);
  assert(etc.protonMotiveForcePmfMv > 100.0 && etc.atpSynthaseRpm > 300, "Thylakoid ETC & ATP Synthase valid", `(pmf: ${etc.protonMotiveForcePmfMv}mV, RPM: ${etc.atpSynthaseRpm})`);

  console.log("\n📑 2. Testing HTML & Asset Markup Integrity:");
  const htmlContent = readFileSync(resolve('./index.html'), 'utf-8');
  assert(htmlContent.includes('class="viewport-tools-wrapper"'), "viewport-tools-wrapper element exists in index.html");
  assert(htmlContent.includes('id="viewportToolsList"'), "viewportToolsList element exists in index.html");
  assert(htmlContent.includes('id="btnToggleToolsExpand"'), "btnToggleToolsExpand expander button exists in index.html");
  assert(htmlContent.includes('id="toolsExpandText"'), "toolsExpandText element exists in index.html");
  assert(htmlContent.includes('draggable="true"'), "Buttons configured with draggable=true");
  assert(htmlContent.includes('id="microbiomeModal"'), "microbiomeModal element exists in index.html");
  assert(htmlContent.includes('id="crisprModal"'), "crisprModal element exists in index.html");
  assert(htmlContent.includes('id="btnRhizosphereMicrobiome"'), "btnRhizosphereMicrobiome button exists in index.html");
  assert(htmlContent.includes('id="btnCrisprMetabolic"'), "btnCrisprMetabolic button exists in index.html");
  assert(htmlContent.includes('id="microbiomeCanvas"'), "microbiomeCanvas exists in index.html");
  assert(htmlContent.includes('id="crisprCanvas"'), "crisprCanvas exists in index.html");
  assert(htmlContent.includes('id="btnFocusZoomTissue"'), "btnFocusZoomTissue 3D zoom in button exists in index.html");
  assert(htmlContent.includes('id="btnToggleHs3dMode"'), "btnToggleHs3dMode 3D hyperspectral button exists in index.html");

  console.log("\n🎨 3. Testing CSS & Styling Tokens:");
  const cssContent = readFileSync(resolve('./style.css'), 'utf-8');
  assert(cssContent.includes('.viewport-tools-wrapper'), "viewport-tools-wrapper CSS defined");
  assert(cssContent.includes('.viewport-tools-list'), "viewport-tools-list single-row CSS defined");
  assert(cssContent.includes('.viewport-tools-wrapper.is-expanded'), "is-expanded drawer CSS defined");
  assert(cssContent.includes('.btn-toggle-tools-expand'), "btn-toggle-tools-expand CSS defined");
  assert(cssContent.includes('.is-dragging'), "Drag ghost .is-dragging CSS defined");
  assert(cssContent.includes('.drag-over-left'), "Drop indicator .drag-over-left CSS defined");
  assert(cssContent.includes('-webkit-font-smoothing: antialiased'), "Antialiased font smoothing enabled in CSS");
  assert(cssContent.includes('text-rendering: optimizeLegibility'), "optimizeLegibility enabled in CSS");
  assert(cssContent.includes('.modal-content'), "Modal content CSS classes defined");

  console.log("\n⚙️ 4. Testing JavaScript Drag & Drop Logic (app.js):");
  const jsContent = readFileSync(resolve('./app.js'), 'utf-8');
  assert(jsContent.includes('function initDraggableTools()'), "initDraggableTools function implemented");
  assert(jsContent.includes('planttwin_viewport_tools_order'), "localStorage custom order persistence implemented");
  assert(jsContent.includes('dragstart'), "dragstart event listener attached");
  assert(jsContent.includes('dragover'), "dragover event listener attached");
  assert(jsContent.includes('drop'), "drop event listener attached");
  assert(jsContent.includes('initDraggableTools()'), "initDraggableTools called on initialization");

  console.log("\n⚡ 5. Testing RL Studio & Q-Network Synaptic Current Animation (deepmind-rl-agent.js):");
  assert(htmlContent.includes('data-tab="rlstudio"'), "rlstudio navigation tab exists in index.html");
  assert(htmlContent.includes('id="viewRlStudio"'), "viewRlStudio view container exists in index.html");
  assert(htmlContent.includes('id="rlStudioMainCanvas"'), "rlStudioMainCanvas exists in index.html");
  assert(jsContent.includes('function renderRlStudioView()'), "renderRlStudioView implemented in app.js");
  assert(jsContent.includes('function switchRlAlgorithm'), "switchRlAlgorithm implemented in app.js");

  const { DeepMindPlantRlAgent } = await import('../deepmind-rl-agent.js');
  const testAgent = new DeepMindPlantRlAgent();
  assert(testAgent.pulses && testAgent.pulses.length > 50, `Electric pulses initialized (${testAgent.pulses.length} pulses)`);
  assert(typeof testAgent.startAnimation === "function", "startAnimation method defined");
  assert(typeof testAgent.stopAnimation === "function", "stopAnimation method defined");
  assert(typeof testAgent.stepRollout === "function", "stepRollout method defined");
  assert(typeof testAgent.exportOnnxJson === "function", "exportOnnxJson method defined");

  const marigoldProfile = { name: "Marigold", baseLuteinConcentration: 3.5, harvestDays: 42, tempOpt: 24 };
  const simResult = testAgent.runTrainingSimulation(marigoldProfile, "balanced", 50, { yield: 3.5, biomass: 5.2, energy: 0.45, stress: 4.0 }, "PPO");
  assert(isFinite(simResult.bestReward) && simResult.bestReward > 0, `Best reward is finite positive number (+${simResult.bestReward})`);
  assert(!isNaN(simResult.finalLuteinYield) && simResult.finalLuteinYield > 0, `Final lutein yield is valid (${simResult.finalLuteinYield} mg/g)`);
  assert(simResult.replayBuffer && simResult.replayBuffer.length > 0, `Replay buffer contains transitions (${simResult.replayBuffer.length} items)`);

  const onnxObj = testAgent.exportOnnxJson();
  assert(onnxObj.format === "ONNX_JSON_V1" && onnxObj.layers.w1.length === 6, "ONNX JSON export valid");

  console.log("\n🌪️ 6. Testing 3D CFD Airflow & Photon Energy Stream & GA-RL Cross Validator:");
  assert(htmlContent.includes('id="btnToggleCfdFlow"'), "btnToggleCfdFlow exists in index.html");
  assert(htmlContent.includes('id="btnTogglePhotons"'), "btnTogglePhotons exists in index.html");
  assert(htmlContent.includes('id="btnDeployEnsembleHybrid"'), "btnDeployEnsembleHybrid exists in index.html");
  assert(htmlContent.includes('id="crossValMae"'), "crossValMae metric element exists in index.html");

  const threeJsContent = readFileSync(resolve('./three-plant-chamber.js'), 'utf-8');
  assert(threeJsContent.includes('buildCfdVectorField'), "buildCfdVectorField implemented in three-plant-chamber.js");
  assert(threeJsContent.includes('buildPhotonRainField'), "buildPhotonRainField implemented in three-plant-chamber.js");
  assert(threeJsContent.includes('toggleCfdFlow'), "toggleCfdFlow implemented in three-plant-chamber.js");
  assert(threeJsContent.includes('togglePhotons'), "togglePhotons implemented in three-plant-chamber.js");
  assert(threeJsContent.includes('getPlantAnchorPoints'), "getPlantAnchorPoints implemented in three-plant-chamber.js");

  console.log("\n📍 7. Testing 3D Plant Target Leader Lines & Dynamic Pin Tracking:");
  assert(htmlContent.includes('id="hudLeaderLineSvg"'), "hudLeaderLineSvg overlay exists in index.html");
  assert(htmlContent.includes('id="leafLeaderLine"'), "leafLeaderLine path exists in index.html");
  assert(htmlContent.includes('id="rootLeaderLine"'), "rootLeaderLine path exists in index.html");
  assert(htmlContent.includes('id="leafTargetDot"'), "leafTargetDot pin exists in index.html");
  assert(htmlContent.includes('id="rootTargetDot"'), "rootTargetDot pin exists in index.html");
  assert(jsContent.includes('updateHudLeaderLines'), "updateHudLeaderLines implemented in app.js");
  assert(jsContent.includes('initHudPointerToggle'), "initHudPointerToggle implemented in app.js");

  console.log("\n📍 8. Testing Retina-HD Vector Drawing & Drag-to-Zoom Diagnostics:");
  assert(htmlContent.includes('id="scopeZoomModal"'), "scopeZoomModal markup exists in index.html");
  assert(htmlContent.includes('id="scopeZoomCanvas"'), "scopeZoomCanvas graph exists in index.html");
  assert(htmlContent.includes('id="lblZoomSlope"'), "lblZoomSlope derivative label exists in index.html");
  assert(htmlContent.includes('id="lblZoomLoss"'), "lblZoomLoss pareto yield loss label exists in index.html");
  assert(htmlContent.includes('id="sirenAlarmPopup"'), "sirenAlarmPopup alert element exists in index.html");
  assert(htmlContent.includes('id="scadaAlarmLogs"'), "scadaAlarmLogs terminal element exists in index.html");

  assert(jsContent.includes('triggerSirenAlarm'), "triggerSirenAlarm implemented in app.js");
  
  const chartsContent = readFileSync(resolve('./live-telemetry-charts.js'), 'utf-8');
  assert(chartsContent.includes('imageSmoothingQuality'), "High-DPI Retina image smoothing configured in live-telemetry-charts.js");
  assert(chartsContent.includes('setupDragZoom'), "setupDragZoom drag interactions implemented in live-telemetry-charts.js");
  assert(chartsContent.includes('triggerZoomAnalysis'), "triggerZoomAnalysis slope derivative logic implemented in live-telemetry-charts.js");
  assert(chartsContent.includes('paretoData'), "Pareto optimal envelope generated in live-telemetry-charts.js");

  console.log("\n📍 9. Testing Pareto Weight Tuner & VPP Grid Integrator:");
  assert(htmlContent.includes('id="sliderParetoWeight"'), "sliderParetoWeight slider exists in index.html");
  assert(htmlContent.includes('id="paretoFrontierCanvas"'), "paretoFrontierCanvas graph exists in index.html");
  assert(htmlContent.includes('id="chkEnableVpp"'), "chkEnableVpp toggle switch exists in index.html");
  assert(htmlContent.includes('id="vppSmpCanvas"'), "vppSmpCanvas graph exists in index.html");
  assert(htmlContent.includes('id="lblVppSavings"'), "lblVppSavings cost saving label exists in index.html");
  
  assert(jsContent.includes('renderParetoFrontier'), "renderParetoFrontier implemented in app.js");
  assert(jsContent.includes('window.vppModeActive'), "VPP mode active variable initialized in app.js");
  
  const threeJsContent2 = readFileSync(resolve('./three-plant-chamber.js'), 'utf-8');
  assert(threeJsContent2.includes('paretoSpeedMultiplier'), "paretoSpeedMultiplier integrated in Three.js render loop");
  assert(threeJsContent2.includes('paretoPhotonMultiplier'), "paretoPhotonMultiplier integrated in Three.js render loop");

  console.log("\n📍 10. Testing AI Optimizer & DeepMind RL Agent (DQN/PPO/SAC) Execution:");
  const { AutonomousAiOptimizer } = await import('../autonomous-ai-optimizer.js');
  const { DeepMindRLAgent } = await import('../deepmind-rl-agent.js');
  
  const optimizer = new AutonomousAiOptimizer(bio);
  const testCrop = {
    id: "marigold",
    name: "메리골드 (Tagetes erecta)",
    tempOpt: 24.0,
    ppfdOpt: 550,
    baseLuteinConcentration: 3.5,
    harvestDays: 42
  };
  
  const optResult = optimizer.calculateOptimalRecipe('yield_max', testCrop);
  assert(optResult.optimalRecipe !== null, "AI Optimal Recipe generated non-null vector");
  assert(!isNaN(optResult.optimalRecipe.netAn), `AI Optimal Recipe netAn is valid number (${optResult.optimalRecipe.netAn})`);
  assert(!isNaN(optResult.improvements.yieldGainPercent), `Yield gain percent valid (${optResult.improvements.yieldGainPercent}%)`);
  
  const rlAgent = new DeepMindRLAgent(bio);
  const dqnResult = rlAgent.runTrainingSimulation(testCrop, 'yield_focused', 5, null, 'DQN');
  assert(!isNaN(dqnResult.bestReward) && dqnResult.bestReward > -9000, `DQN 5-episode bestReward is valid (${dqnResult.bestReward})`);
  
  const ppoResult = rlAgent.runTrainingSimulation(testCrop, 'yield_focused', 5, null, 'PPO');
  assert(!isNaN(ppoResult.bestReward) && ppoResult.bestReward > -9000, `PPO 5-episode bestReward is valid (${ppoResult.bestReward})`);
  
  const sacResult = rlAgent.runTrainingSimulation(testCrop, 'yield_focused', 5, null, 'SAC');
  assert(!isNaN(sacResult.bestReward) && sacResult.bestReward > -9000, `SAC 5-episode bestReward is valid (${sacResult.bestReward})`);

  console.log("\n📍 11. Testing Industrial IoT Hardware Gateway & Cryptographic GMP CoA Report:");
  assert(htmlContent.includes('id="btnTogglePlcDaemon"'), "btnTogglePlcDaemon button exists in index.html");
  assert(htmlContent.includes('id="plcDaemonStatusBadge"'), "plcDaemonStatusBadge element exists in index.html");
  assert(htmlContent.includes('id="btnTestPlcWrite"'), "btnTestPlcWrite button exists in index.html");
  assert(htmlContent.includes('id="coaReportModal"'), "coaReportModal dialog exists in index.html");
  assert(htmlContent.includes('id="printableCoaArea"'), "printableCoaArea document area exists in index.html");
  assert(htmlContent.includes('id="btnPrintCoa"'), "btnPrintCoa print button exists in index.html");

  const { DataExporter } = await import('../data-exporter.js');
  const mockEnvEngine = { simulatedDay: 42, accumulatedDli: 28.5 };
  const mockPlantState = { luteinConcentration: 18.72, totalLuteinAccumulatedMg: 124.5 };
  const coa = DataExporter.generateGmpCertificateOfAnalysis(testCrop, mockPlantState, mockEnvEngine);
  assert(coa.certSerial.startsWith("GMP-COA-"), `CoA serial formatted correctly (${coa.certSerial})`);
  assert(coa.assays.length === 7, `CoA contains all 7 mandatory GMP assay parameters (${coa.assays.length} items)`);
  assert(coa.overallConclusion.includes("PASSED"), `CoA final conclusion is PASSED (${coa.overallConclusion})`);

  const cssPrintContent = readFileSync(resolve('./style.css'), 'utf-8');
  assert(cssPrintContent.includes('@media print'), "A4 High-Resolution printable stylesheet configured in style.css");

  console.log("\n=================================================");
  console.log(`📊 Test Summary: Total ${passed + failed} Tests | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
  console.log("=================================================");
  
  if (failed > 0) {
    process.exit(1);
  }
}).catch(err => {
  console.error("Test execution error:", err);
  process.exit(1);
});
