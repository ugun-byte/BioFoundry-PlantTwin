/**
 * Biophysical & Biochemical Mathematical Engine (Farquhar-von Caemmerer-Berry + Secondary Metabolite Flux Balance)
 * 
 * Continuous ODE & Physics equations:
 * 1. Arrhenius Enzyme Kinetics for Vcmax, Jmax, Rd with high-temperature denaturation
 * 2. Ball-Berry-Leuning Stomatal Conductance (gs) & Intercellular CO2 (Ci)
 * 3. Light Reaction & Electron Transport Rate (J) with Spectrum Action Weighting
 * 4. Penman-Monteith Leaf Energy Balance & Infrared Leaf Temperature (T_leaf)
 * 5. Dynamic Photosystem II Quantum Yield & Photoprotective Non-Photochemical Quenching (NPQ)
 * 6. Carotenogenesis (PSY/LCYB/LCYE) & Secondary Metabolite Biosynthetic Flux (dLutein/dt)
 * 7. Carbon Partitioning & Biomass Dry Matter Integration (Leaves, Stems, Roots, Blooms)
 */

export class BioPhysicalEngine {
  constructor() {
    // Physical Constants
    this.R = 8.314; // Universal gas constant J/(mol·K)
    this.O2_ATM = 210.0; // Ambient O2 (mmol/mol)
  }

  /**
   * Arrhenius enzyme temperature response with high-temperature deactivation
   */
  arrheniusWithDeactivation(k25, Ea, T_celsius, deltaS = 640, Hd = 200000) {
    const T_k = T_celsius + 273.15;
    const T25_k = 298.15;

    const term1 = k25 * Math.exp((Ea * (T_k - T25_k)) / (T25_k * this.R * T_k));
    const term2 = (1 + Math.exp((T25_k * deltaS - Hd) / (T25_k * this.R))) /
                  (1 + Math.exp((T_k * deltaS - Hd) / (T_k * this.R)));

    return Math.max(0.001, term1 * term2);
  }

  /**
   * Calculate Stomatal Conductance (gs), Intercellular CO2 (Ci), and Leaf Temperature (T_leaf)
   */
  calculateStomataAndEnergyBalance(params, cropProfile) {
    const { ppfd, airTemp, humidity, co2Air, vpdAir, windSpeed = 0.3 } = params;

    // Saturation vapor pressure (kPa)
    const esat_air = 0.61078 * Math.exp((17.27 * airTemp) / (airTemp + 237.3));
    const e_air = esat_air * (humidity / 100);

    // Leaf Temperature estimation via energy balance (Transpirational cooling / Radiative heating)
    // High PPFD adds radiative heat load, transpiration (cooling) subtracts heat
    const netRadiation = (ppfd * 0.22); // W/m2 approximate absorbed PAR energy
    const coolingPotential = Math.max(0.2, vpdAir) * 1.6;
    const tLeafOffset = (netRadiation / 120.0) - coolingPotential;
    const leafTemp = Math.max(5, Math.min(48, airTemp + tLeafOffset));

    // Stomatal sensitivity to VPD (Ball-Berry model)
    const vpdStress = 1.0 / (1.0 + Math.max(0, vpdAir - cropProfile.vpdOptMin) * 0.85);

    // Light-driven stomatal opening
    const lightOpening = ppfd / (ppfd + 120.0);
    const gs = Math.max(0.02, cropProfile.gs_max * lightOpening * vpdStress * Math.min(1.0, co2Air / 400.0));

    // Estimate Intercellular CO2 (Ci in ppm) based on stomatal conductance
    // In typical C3 plants, Ci/Ca is ~0.7 under unstressed conditions
    const ciRatio = Math.max(0.25, Math.min(0.88, 0.72 * (gs / cropProfile.gs_max)));
    const ci = co2Air * ciRatio;

    // Transpiration rate E (mmol H2O / m2 / s)
    const esat_leaf = 0.61078 * Math.exp((17.27 * leafTemp) / (leafTemp + 237.3));
    const vpdLeaf = Math.max(0.05, esat_leaf - e_air);
    const transpirationRate = gs * (vpdLeaf / 101.3) * 1000.0; // mmol/m2/s

    return {
      leafTemp: parseFloat(leafTemp.toFixed(2)),
      vpdLeaf: parseFloat(vpdLeaf.toFixed(2)),
      gs: parseFloat(gs.toFixed(3)),
      ci: parseFloat(ci.toFixed(1)),
      transpirationRate: parseFloat(transpirationRate.toFixed(2))
    };
  }

  /**
   * Full Farquhar-von Caemmerer-Berry (FvCB) Photosynthesis Kinetics
   */
  calculateInstantaneousPhotosynthesis(envParams, cropProfile) {
    const stomata = this.calculateStomataAndEnergyBalance(envParams, cropProfile);
    const { ppfd, spectrum } = envParams;
    const T = stomata.leafTemp;
    const Ci = stomata.ci;

    // 1. Kinetic constants adjusted for leaf temperature
    const Vcmax = this.arrheniusWithDeactivation(cropProfile.vcmax25, cropProfile.ea_vcmax, T);
    const Jmax = this.arrheniusWithDeactivation(cropProfile.jmax25, cropProfile.ea_jmax, T);
    const Rd = cropProfile.rd25 * Math.exp(0.069 * (T - 25));

    // Michaelis-Menten constants for CO2 (Kc) and O2 (Ko)
    const Kc = 404.9 * Math.exp((79430 * (T - 25)) / (298.15 * this.R * (T + 273.15)));
    const Ko = 278.4 * Math.exp((36380 * (T - 25)) / (298.15 * this.R * (T + 273.15)));
    const GammaStar = 42.75 * Math.exp((37830 * (T - 25)) / (298.15 * this.R * (T + 273.15)));

    // 2. Spectrum Weighted Action Efficiency
    // Red (660nm) quantum yield = 1.00, Blue (450nm) = 0.88, Far-Red = 0.82, Green = 0.68
    const spectrumFactor = (
      (spectrum.red / 100) * 1.05 +
      (spectrum.blue / 100) * 0.92 +
      (spectrum.green / 100) * 0.72 +
      (spectrum.farRed / 100) * 0.86
    );

    // 3. Electron Transport Rate (J)
    const alpha = 0.35 * spectrumFactor; // Apparent quantum yield of PSII
    const theta = 0.75; // Curvature factor
    const I2 = ppfd * (1 - 0.15) * 0.5 * alpha; // Absorbed light by PSII

    const J = (I2 + Jmax - Math.sqrt(Math.pow(I2 + Jmax, 2) - 4 * theta * I2 * Jmax)) / (2 * theta);

    // 4. Rubisco-limited rate (Ac)
    const Ac = (Vcmax * (Ci - GammaStar)) / (Ci + Kc * (1 + this.O2_ATM / Ko));

    // 5. RuBP regeneration-limited rate (Aj)
    const Aj = (J * (Ci - GammaStar)) / (4 * Ci + 8 * GammaStar);

    // 6. Net CO2 Assimilation Rate (An)
    const An = Math.max(-Rd, Math.min(Ac, Aj) - Rd);

    // 7. Photosystem II Quantum Yield (Fv/Fm proxy) & Non-Photochemical Quenching (NPQ)
    const lightSaturationRatio = ppfd / Math.max(100, cropProfile.lightSaturationPoint);
    const npq = Math.max(0, (lightSaturationRatio - 0.7) * 1.8);
    const fvFm = Math.max(0.45, Math.min(0.84, 0.83 - (npq * 0.08) - (stomata.vpdLeaf > 1.6 ? 0.08 : 0)));

    return {
      netAn: parseFloat(An.toFixed(2)),
      grossAg: parseFloat((An + Rd).toFixed(2)),
      vcmax: parseFloat(Vcmax.toFixed(1)),
      jmax: parseFloat(Jmax.toFixed(1)),
      electronTransportJ: parseFloat(J.toFixed(1)),
      limitingFactor: Ac < Aj ? "Rubisco (Ac 제한)" : "RuBP/광반응 (Aj 제한)",
      fvFm: parseFloat(fvFm.toFixed(3)),
      npq: parseFloat(npq.toFixed(2)),
      stomata
    };
  }

  /**
   * Molecular Farming: Biosynthetic Enzyme Flux (Lutein / Carotenoid Synthesis Rate)
   * Calculates dLutein/dt in mg / (plant · hour)
   */
  calculateSecondaryMetaboliteFlux(instantPhoto, envParams, cropProfile, plantState) {
    const { ppfd, spectrum, uvbActive, coldShockActive, ec } = envParams;
    const { leafDryWeightGrams } = plantState;

    // 1. Base Carotenogenesis Flux from Calvin Cycle Fixed Carbon & ATP supply
    const carbonSupplyFactor = Math.max(0.1, instantPhoto.netAn / 18.0);

    // 2. Photoprotective Upregulation via Blue & UV-B Light (PSY - Phytoene Synthase enzyme activity)
    const blueRatio = (spectrum.blue || 25) / 100;
    const blueActivation = 1.0 + Math.pow(blueRatio / 0.2, 1.4) * cropProfile.spectrumSensitivity.blue;

    // UV-B induces massive photoprotective antioxidant enzyme cascade
    const uvbActivation = uvbActive ? cropProfile.spectrumSensitivity.uvb : 1.0;

    // 3. Low Temperature Shift (Cold Shock increases anthocyanin and lutein membrane stabilizers)
    const coldActivation = coldShockActive ? 1.35 : 1.0;

    // 4. Nutrient EC modulation (Mild osmotic stress shifts primary metabolism to secondary defense)
    const ecStressFactor = ec >= 2.2 ? 1.0 + (ec - 2.2) * 0.35 : 1.0;

    // Instantaneous rate of lutein synthesis (mg / gram DW per day)
    const dailyFluxPerGram = cropProfile.baseLuteinConcentration * 0.065 * 
      carbonSupplyFactor * blueActivation * uvbActivation * coldActivation * ecStressFactor;

    // Total plant hourly flux (mg / hour)
    const hourlyPlantFlux = (dailyFluxPerGram * leafDryWeightGrams) / 24.0;

    return {
      dailyFluxPerGram: parseFloat(dailyFluxPerGram.toFixed(4)),
      hourlyPlantFlux: parseFloat(hourlyPlantFlux.toFixed(4)),
      psyEnzymeActivityRatio: parseFloat((blueActivation * uvbActivation).toFixed(2)),
      stressMultiplier: parseFloat((coldActivation * ecStressFactor).toFixed(2))
    };
  }

  /**
   * 8. Michaelis-Menten Root Ion Uptake Kinetics (Nitrate NO3-, Phosphate H2PO4-, Potassium K+)
   * Flux I_i = I_max * (C_i - C_min) / (K_m + (C_i - C_min)) * TempFactor * O2Factor
   */
  calculateRootIonUptake(envParams, cropProfile, plantState = {}) {
    const { ec = 2.2, airTemp = 24.0, humidity = 70.0 } = envParams;
    const rootTemp = Math.max(12, airTemp - 2.0); // root zone temp typically cooler
    const dissolvedO2 = 21.0; // dissolved O2 %

    // Convert EC (mS/cm) to approximate macronutrient concentrations (uM)
    // Typical Hoagland solution standard: EC 2.0 -> N: 15mM, P: 1mM, K: 6mM
    const concFactor = ec / 2.0;
    const cN = Math.max(0, 15000 * concFactor); // uM NO3-
    const cP = Math.max(0, 1000 * concFactor);  // uM H2PO4-
    const cK = Math.max(0, 6000 * concFactor);  // uM K+

    // Michaelis constants (Km in uM) and Imax (umol / g DW root / h)
    const Km_N = 45.0, Imax_N = 18.0;
    const Km_P = 12.0, Imax_P = 5.2;
    const Km_K = 25.0, Imax_K = 22.0;

    // Root Temperature factor (Q10 enzyme kinetics peaking around 22-25°C)
    const tempFactor = Math.exp(-0.5 * Math.pow((rootTemp - 23.5) / 5.5, 2));

    // Oxygen factor (Root respiration ATP driven H+-ATPase proton pump)
    const o2Factor = Math.min(1.0, dissolvedO2 / 20.0);

    // Uptake fluxes (umol / g DW / h)
    const fluxN = Imax_N * (cN / (Km_N + cN)) * tempFactor * o2Factor;
    const fluxP = Imax_P * (cP / (Km_P + cP)) * tempFactor * o2Factor;
    const fluxK = Imax_K * (cK / (Km_K + cK)) * tempFactor * o2Factor;

    // Total root ion absorption score (0.0 ~ 1.0)
    const absorptionRatio = Math.min(1.0, (fluxN / Imax_N + fluxP / Imax_P + fluxK / Imax_K) / 3.0);

    return {
      fluxN: parseFloat(fluxN.toFixed(2)),
      fluxP: parseFloat(fluxP.toFixed(2)),
      fluxK: parseFloat(fluxK.toFixed(2)),
      absorptionRatio: parseFloat(absorptionRatio.toFixed(3)),
      rootTemp: parseFloat(rootTemp.toFixed(1)),
      dissolvedO2: parseFloat(dissolvedO2.toFixed(1))
    };
  }

  /**
   * 9. Chlorophyll a Fluorescence OJIP Polyphasic Transient Model (JIP-Test)
   * Calculates dynamic fluorescence induction curve F(t) from 10 us to 1 s
   * based on Photosystem II (PSII) acceptor side QA, Plastoquinone (PQ) pool, and PSI acceptor reduction.
   */
  calculateOJIPTransient(envParams = {}, cropProfile = {}, plantState = {}) {
    const { ppfd = 450, airTemp = 24.0, humidity = 70.0 } = envParams;
    const ojip = cropProfile.ojipParams || {
      fo: 250,
      fj: 600,
      fi: 1050,
      fm: 1500,
      pqPool: 40,
      piAbs: 4.5,
      lhcSize: 1.2,
      phiPSII: 0.832
    };

    // Environmental Stress Factors
    const tempDeviation = Math.max(0, Math.abs(airTemp - (cropProfile.tempOpt || 24.0)) - 4.0);
    const heatStress = Math.min(0.40, tempDeviation * 0.04);
    const npqQuenching = Math.max(0, (ppfd - 600) / 1200) * 0.25;

    // Modulated cardinal points
    const Fo = Math.round(ojip.fo * (1.0 + heatStress * 0.45));
    const Fm = Math.round(ojip.fm * (1.0 - heatStress * 0.35 - npqQuenching));
    const Fv = Fm - Fo;
    const FvFm = Math.max(0.40, Math.min(0.85, Fv / Fm));

    const Fj = Math.round(ojip.fj * (1.0 + heatStress * 0.20));
    const Fi = Math.round(ojip.fi * (1.0 - npqQuenching * 0.5));

    // JIP-Test Kinetic Parameters
    const Vj = Math.max(0.05, Math.min(0.95, (Fj - Fo) / (Fm - Fo)));
    const Vi = Math.max(0.20, Math.min(0.98, (Fi - Fo) / (Fm - Fo)));
    const Mo = Math.max(0.5, 4.0 * (Fj - Fo) / (Fm - Fo));
    const Sm = (ojip.pqPool || 40) * (1.0 - heatStress * 0.5);
    const phiPo = FvFm;
    const psiEo = 1.0 - Vj;
    const phiEo = phiPo * psiEo;
    const piAbs = Math.max(0.5, ojip.piAbs * (1.0 - heatStress * 1.2 - npqQuenching));

    // Generate 60 Logarithmic Time Points from 10^-5 s (10 us) to 10^0 s (1 s)
    const points = [];
    const numPoints = 60;
    const logMin = -5.0; // 10^-5 s (10 us)
    const logMax = 0.0;  // 10^0 s (1 s)

    const tO = 2.0e-5;  // 20 us
    const tJ = 2.0e-3;  // 2 ms
    const tI = 3.0e-2;  // 30 ms
    const tP = 3.0e-1;  // 300 ms

    for (let k = 0; k < numPoints; k++) {
      const logT = logMin + (k / (numPoints - 1)) * (logMax - logMin);
      const t = Math.pow(10, logT);

      let fVal = Fo;
      if (t < tJ) {
        const p = Math.max(0, (logT - (-5.0)) / (Math.log10(tJ) - (-5.0)));
        fVal = Fo + (Fj - Fo) * Math.pow(p, 1.2);
      } else if (t < tI) {
        const p = (logT - Math.log10(tJ)) / (Math.log10(tI) - Math.log10(tJ));
        fVal = Fj + (Fi - Fj) * Math.sin(p * Math.PI / 2);
      } else {
        const p = Math.min(1.0, (logT - Math.log10(tI)) / (Math.log10(tP) - Math.log10(tI)));
        fVal = Fi + (Fm - Fi) * (1.0 / (1.0 + Math.exp(-5.0 * (p - 0.5))));
      }

      fVal = Math.min(Fm, Math.max(Fo, fVal));

      points.push({
        t: parseFloat(t.toExponential(3)),
        logT: parseFloat(logT.toFixed(3)),
        timeLabel: t < 1e-3 ? `${Math.round(t * 1e6)} μs` : (t < 1 ? `${Math.round(t * 1e3)} ms` : `${t.toFixed(1)} s`),
        f: Math.round(fVal),
        relV: parseFloat(((fVal - Fo) / (Fm - Fo)).toFixed(3))
      });
    }

    return {
      speciesId: cropProfile.id || "marigold_lutein",
      speciesName: cropProfile.name || "작물",
      cardinalPoints: { Fo, Fj, Fi, Fm, Fv },
      jipMetrics: {
        fvFm: parseFloat(FvFm.toFixed(3)),
        vj: parseFloat(Vj.toFixed(3)),
        vi: parseFloat(Vi.toFixed(3)),
        phiEo: parseFloat(phiEo.toFixed(3)),
        piAbs: parseFloat(piAbs.toFixed(2)),
        sm: Math.round(Sm),
        heatStressIndex: parseFloat((heatStress * 100).toFixed(1))
      },
      points
    };
  }

  /**
   * 10. Root Plasma Membrane Electrophysiology & Ion Channel Gating Model
   * Computes Membrane Potential (V_m in mV), H+-ATPase proton pump flux,
   * AKT1 K+ inward rectifier gating, NRT1.1 transceptor activity, and Slow Wave Potential.
   */
  calculateRootElectrophysiology(envParams = {}, cropProfile = {}, plantState = {}) {
    const { ec = 2.2, airTemp = 24.0, humidity = 70.0 } = envParams;
    const rootTemp = Math.max(12, airTemp - 2.0);
    const pH = envParams.pH || 6.2; // Rhizosphere pH

    // 1. Electrogenic H+-ATPase Proton Pump Voltage Contribution (Delta V_pump)
    const tempPump = Math.exp(-0.5 * Math.pow((rootTemp - 23.5) / 5.0, 2));
    const pHEffect = 1.0 / (1.0 + Math.pow(10, Math.abs(pH - 6.0) - 1.2));
    const pumpMax = 65.0; // mV hyperpolarizing contribution
    const deltaVpump = pumpMax * tempPump * pHEffect;

    // 2. Diffusion Potential (Goldman-Hodgkin-Katz GHK approximation for Plant Root)
    const ecRatio = Math.max(0.2, ec / 2.0);
    const vDiff = -85.0 - 15.0 * Math.log(ecRatio);

    // 3. Total Steady-State Membrane Potential (V_m in mV)
    const Vm = vDiff - deltaVpump;

    // 4. Voltage-Gated Ion Channel Open Probabilities (P_open, 0 ~ 100%)
    const kChannelOpen = Math.min(100, Math.max(5, 100 / (1.0 + Math.exp((Vm - (-135.0)) / 12.0))));
    const nrtActivity = Math.min(100, Math.max(10, 85.0 * tempPump * (1.0 / (1.0 + Math.exp(-1.5 * (ecRatio - 0.8))))));
    const pmfDrive = Math.min(100, Math.max(10, (Math.abs(Vm) / 160.0) * 100.0 * pHEffect));
    const protonPumpPct = Math.min(100, Math.max(5, (deltaVpump / pumpMax) * 100.0));

    // Polarization Diagnostic Label
    let stateLabel = "과분극 (Hyperpolarized, 왕성한 양분 흡수)";
    let stateColor = "#10b981"; // Emerald
    if (Vm > -110.0) {
      stateLabel = "탈분극 (Depolarized, 이온 채널 폐쇄 스트레스)";
      stateColor = "#f87171"; // Red
    } else if (Vm > -135.0) {
      stateLabel = "중간 전위 (Moderate, 정상 휴지 전위)";
      stateColor = "#38bdf8"; // Blue
    }

    // Generate 40-point Action Potential / Slow Wave Potential (SWP) Waveform
    const wavePoints = [];
    const baseVm = Vm;
    for (let i = 0; i < 40; i++) {
      const t = i;
      const noise = Math.sin(t * 0.45) * 1.5 + Math.cos(t * 0.9) * 0.8;
      wavePoints.push({
        timeSec: (i * 0.5).toFixed(1),
        voltage: parseFloat((baseVm + noise).toFixed(1))
      });
    }

    return {
      membranePotential: parseFloat(Vm.toFixed(1)),
      stateLabel,
      stateColor,
      protonPumpPct: Math.round(protonPumpPct),
      kChannelOpen: Math.round(kChannelOpen),
      nrtActivity: Math.round(nrtActivity),
      pmfDrive: Math.round(pmfDrive),
      rhizospherePH: parseFloat(pH.toFixed(1)),
      wavePoints
    };
  }

  /**
   * 11. Microscopic Cellular Organelle & Stomatal Dynamics Model
   * Computes Guard Cell Turgor (MPa), Stomatal Aperture (%),
   * Chloroplast Thylakoid Light/Dark Reaction Flux, and Rubisco Carboxylation.
   */
  calculateMicroscopicCellularMetrics(envParams = {}, cropProfile = {}, plantState = {}) {
    const { ppfd = 450, airTemp = 24.0, vpd = 1.05, co2 = 800 } = envParams;

    // 1. Guard Cell Osmotic Turgor & Aperture Opening % (0 ~ 100%)
    // Light (PPFD) activates H+-ATPase -> K+ influx -> swells guard cell -> opens stoma
    // High VPD (> 1.5 kPa) or extreme CO2 (> 1400 ppm) induces stomatal closure (ABA signaling)
    const lightDrive = Math.min(1.0, ppfd / (cropProfile.lightSaturationPoint || 650));
    const vpdPenalty = vpd > 1.4 ? Math.max(0.15, 1.0 - (vpd - 1.4) * 0.85) : 1.0;
    const co2Penalty = co2 > 1200 ? Math.max(0.4, 1.0 - (co2 - 1200) / 2000) : 1.0;
    const tempOpt = Math.exp(-0.5 * Math.pow((airTemp - (cropProfile.tempOpt || 24.0)) / 6.0, 2));

    const apertureRatio = Math.max(0.05, Math.min(1.0, lightDrive * vpdPenalty * co2Penalty * tempOpt));
    const guardTurgorMPa = parseFloat((0.4 + apertureRatio * 1.8).toFixed(2)); // 0.4 MPa closed -> 2.2 MPa wide open

    // 2. Chloroplast Thylakoid Membrane Light Reaction & ETR
    const etrRate = parseFloat((apertureRatio * (ppfd * 0.28)).toFixed(1)); // Electron Transport Rate (umol e- / m2 s)
    const atpFluxPct = Math.round(Math.min(100, (etrRate / 180.0) * 100));

    // 3. Stroma Dark Reaction & Rubisco Carboxylation Activation
    const rubiscoActivePct = Math.round(Math.min(100, Math.max(10, tempOpt * (co2 / 1000.0) * 95.0)));

    return {
      stomaAperturePct: Math.round(apertureRatio * 100),
      guardTurgorMPa,
      etrRate,
      atpFluxPct,
      rubiscoActivePct,
      leafTemp: parseFloat((airTemp - (apertureRatio * 2.2)).toFixed(1))
    };
  }

  /**
   * 12. Smart Hydroponic Nutrient Ion Balance (NO3- vs NH4+) & pH Drift Model
   * Nitrate (NO3-) uptake alkalinizes root zone (OH- excretion).
   * Ammonium (NH4+) uptake acidifies root zone (H+ excretion).
   */
  calculateNutrientChemicalBalance(envParams = {}, cropProfile = {}, ionConfig = {}) {
    const { ec = 2.2, currentPH = 6.2, targetPH = 6.2 } = envParams;
    const { no3Ratio = 0.85, nh4Ratio = 0.15 } = ionConfig;

    // Total nitrogen absorption flux (mmol / L / day proxy)
    const totalNFlux = (ec / 2.0) * 3.5;
    const no3Flux = totalNFlux * no3Ratio;
    const nh4Flux = totalNFlux * nh4Ratio;

    // Net proton flux: NH4+ releases H+ (+1), NO3- releases HCO3-/OH- (-1)
    const netHPlusFlux = (nh4Flux * 1.0) - (no3Flux * 0.88); // positive = acidifying, negative = alkalinizing

    // Raw chemical pH drift velocity (pH units per minute in recirculation basin)
    const bufferCapacity = 0.45; // mM/pH buffer capacity of standard nutrient solution
    const driftVelocity = (-netHPlusFlux * 0.008) / bufferCapacity;

    return {
      no3Flux: parseFloat(no3Flux.toFixed(2)),
      nh4Flux: parseFloat(nh4Flux.toFixed(2)),
      netHPlusFlux: parseFloat(netHPlusFlux.toFixed(3)),
      driftVelocity: parseFloat(driftVelocity.toFixed(4)),
      currentPH: parseFloat(currentPH.toFixed(2)),
      targetPH: parseFloat(targetPH.toFixed(2)),
      pHDeviation: parseFloat((currentPH - targetPH).toFixed(2))
    };
  }

  /**
   * 13. Xylem Sap Flow & Hydraulic Conductance / Water Potential Dynamics
   * Computes Sap Flux Density (Js in cm/h), Total Sap Flow Rate (Qsap in mL/h),
   * Stem Water Potential (Psi_stem in MPa), and Percent Loss of Conductivity (PLC %).
   */
  calculateSapFlowDynamics(envParams = {}, cropProfile = {}, plantState = {}) {
    const { ppfd = 450, airTemp = 24.0, vpd = 1.05, ec = 2.2 } = envParams;
    const freshWeight = plantState.freshWeightGrams || 150.0;

    // 1. Transpiration driving force: VPD & Light & Stomatal Aperture
    const lightFactor = Math.min(1.0, ppfd / (cropProfile.lightSaturationPoint || 650));
    const vpdDrive = Math.max(0.1, vpd);
    const tempOpt = Math.exp(-0.5 * Math.pow((airTemp - (cropProfile.tempOpt || 24.0)) / 7.0, 2));

    // Sap Flux Density (Js in cm/h, typical range: 2 ~ 32 cm/h in greenhouse crops)
    const baseFluxDensity = 14.5 * lightFactor * Math.sqrt(vpdDrive) * tempOpt;
    const Js = parseFloat(Math.max(1.2, baseFluxDensity).toFixed(1));

    // 2. Total Stem Volumetric Sap Flow (Q_sap in mL/h)
    const xylemAreaCm2 = 0.45 * Math.pow(freshWeight / 150.0, 0.65);
    const Qsap = parseFloat((Js * xylemAreaCm2 * 7.5).toFixed(1)); // mL/h

    // 3. Stem Water Potential (Psi_stem in MPa)
    const psiNutrient = -0.036 * ec;
    const rHydraulic = 0.0085;
    const psiStem = parseFloat((psiNutrient - (Qsap * rHydraulic)).toFixed(2));

    // 4. Percent Loss of Hydraulic Conductivity (PLC %) via Cavitation Vulnerability
    const psi50 = -2.2;
    const plc = Math.min(100, Math.max(0.5, 100 / (1.0 + Math.exp(-3.5 * (psiStem - psi50)))));

    // 5. 24-Hour Diurnal Sap Flow Curve Projection
    const diurnalCurve = [];
    for (let h = 0; h < 24; h++) {
      const solarH = Math.sin(((h - 6) / 16) * Math.PI);
      const dayJs = h >= 6 && h <= 22 ? Math.max(0.5, Js * solarH) : 0.8;
      diurnalCurve.push({
        hour: h,
        js: parseFloat(dayJs.toFixed(1)),
        qSap: parseFloat((dayJs * xylemAreaCm2 * 7.5).toFixed(1))
      });
    }

    return {
      sapFluxDensity: Js,
      volumetricFlowMlH: Qsap,
      stemWaterPotentialMPa: psiStem,
      plcPercent: parseFloat(plc.toFixed(1)),
      xylemAreaCm2: parseFloat(xylemAreaCm2.toFixed(2)),
      hydraulicStatus: psiStem > -0.8 ? "최적 수분 유동 (Optimal Hydration)" : (psiStem > -1.2 ? "경미한 수분 스트레스 (Mild Deficit)" : "도관 수분 결핍 (Severe Stress)"),
      diurnalCurve
    };
  }

  /**
   * 14. Leaf Infrared (IR) Thermography & Transpirational Cooling Model
   * Energy balance between net radiation (Rnet), latent heat flux (lambda*E),
   * sensible heat (H), and leaf temperature (Tleaf).
   */
  calculateThermalLeafInfrared(envParams = {}, cropProfile = {}, plantState = {}) {
    const { ppfd = 450, airTemp = 24.0, vpd = 1.05 } = envParams;
    const stomata = this.calculateStomatalConductance(envParams, cropProfile, plantState);
    const gs = stomata.gs; // mol m-2 s-1

    // 1. Net solar radiation absorbed by canopy (W/m2)
    const rNet = (ppfd * 0.219) * 0.85;

    // 2. Latent heat flux of transpiration (lambda * E in W/m2)
    const transpirationRate = gs * (vpd / 101.3) * 1000.0; // mmol m-2 s-1
    const latentHeatVaporization = 44.0; // J/mmol
    const lambdaE = Math.min(rNet * 0.95, transpirationRate * latentHeatVaporization);

    // 3. Boundary layer convective conductance
    const gb = 0.85;
    const cpAir = 29.3;
    const radiativeConductance = 4 * 0.98 * (5.67e-8) * Math.pow(airTemp + 273.15, 3) / cpAir;
    const gThermal = (gb + radiativeConductance) * cpAir;

    // 4. Leaf-to-Air Temperature Delta (Delta T = Tleaf - Tair)
    const sensibleHeatH = rNet - lambdaE;
    const deltaT = parseFloat((sensibleHeatH / Math.max(15.0, gThermal)).toFixed(2));
    const tLeaf = parseFloat((airTemp + deltaT).toFixed(2));

    // 5. Crop Water Stress Index (CWSI, 0.0 ~ 1.0)
    const deltaTWet = -3.2; // maximum transpirational cooling
    const deltaTDry = 4.5;  // completely closed stomata
    const cwsi = parseFloat(Math.min(1.0, Math.max(0.0, (deltaT - deltaTWet) / (deltaTDry - deltaTWet))).toFixed(2));

    return {
      airTemp: parseFloat(airTemp.toFixed(1)),
      leafTemp: tLeaf,
      deltaT,
      coolingPowerWatts: parseFloat(lambdaE.toFixed(1)),
      cwsi,
      transpirationMmol: parseFloat(transpirationRate.toFixed(2)),
      thermalStatus: cwsi < 0.25 ? "풍부한 증산 냉각 (Optimal Cooling)" : (cwsi < 0.6 ? "보통 증산 (Moderate Cooling)" : "기공 폐쇄 고온 스트레스 (Thermal Stress)")
    };
  }

  /**
   * 15. Canopy Hyperspectral Reflectance & Optical Pigment Index Model (400nm ~ 900nm)
   * Calculates NDVI (Normalized Difference Vegetation Index) & PRI (Photochemical Reflectance Index)
   * based on chlorophyll concentration, lutein/xanthophyll cycle activation, and canopy LAI.
   */
  calculateHyperspectralReflectance(envParams = {}, cropProfile = {}, plantState = {}) {
    const { ppfd = 450 } = envParams;
    const lai = plantState.lai || 1.2;
    const luteinConc = plantState.luteinConcentration || cropProfile.baseLuteinConcentration || 18.0;
    const chlTotal = 3.2 + Math.min(1.5, lai * 0.4);

    // 1. Red absorption (680nm) & NIR reflection plateau (800nm)
    const r680 = Math.max(0.02, 0.12 * Math.exp(-0.65 * chlTotal));
    const r800 = Math.min(0.88, 0.45 + 0.35 * (1.0 - Math.exp(-0.75 * lai)));
    const ndvi = parseFloat(((r800 - r680) / (r800 + r680)).toFixed(3));

    // 2. Xanthophyll de-epoxidation cycle (531nm vs 570nm reference)
    // High light excess (PPFD > 600) drives Violaxanthin -> Zeaxanthin (531nm reflectance drops)
    const lightStressFactor = Math.max(0.0, Math.min(1.0, (ppfd - 350) / 650));
    const r570 = 0.185;
    const delta531 = 0.018 * (1.0 - lightStressFactor * 1.6);
    const r531 = r570 + delta531;
    const pri = parseFloat(((r531 - r570) / (r531 + r570)).toFixed(4));

    // 3. 21-point Hyperspectral Signature Curve (400nm to 900nm in 25nm steps)
    const spectralCurve = [];
    for (let wl = 400; wl <= 900; wl += 25) {
      let refl = 0.05;
      if (wl < 500) {
        // Blue Soret band absorption
        refl = 0.04 + 0.02 * Math.sin(((wl - 400) / 100) * Math.PI);
      } else if (wl <= 600) {
        // Green reflectance peak (550nm)
        refl = 0.08 + 0.11 * Math.sin(((wl - 500) / 100) * Math.PI) - (lightStressFactor * 0.015);
      } else if (wl <= 685) {
        // Red Chlorophyll a/b strong absorption trough
        refl = 0.04 + 0.03 * (1.0 - Math.sin(((wl - 600) / 85) * Math.PI));
      } else if (wl <= 750) {
        // Steep "Red Edge" inflection
        const t = (wl - 685) / 65.0;
        refl = 0.05 + (r800 - 0.05) * Math.pow(t, 1.8);
      } else {
        // NIR scattering plateau (750nm ~ 900nm)
        refl = r800 + 0.02 * Math.sin(((wl - 750) / 150) * Math.PI);
      }
      spectralCurve.push({
        wavelength: wl,
        reflectance: parseFloat(refl.toFixed(4))
      });
    }

    return {
      ndvi,
      pri,
      r680: parseFloat(r680.toFixed(3)),
      r800: parseFloat(r800.toFixed(3)),
      r531: parseFloat(r531.toFixed(3)),
      r570: parseFloat(r570.toFixed(3)),
      chlorophyllIndex: parseFloat((r800 / r680 - 1.0).toFixed(2)),
      xanthophyllRatio: parseFloat((1.0 - lightStressFactor).toFixed(2)),
      status: ndvi > 0.75 ? "최우수 활력 (Lush Biomass)" : (ndvi > 0.55 ? "정상 생장 (Normal Canopy)" : "색소 결핍 / 황화 (Chlorosis)"),
      priStatus: pri > 0.0 ? "최적 광이용효율 (High LUE)" : "비광화학 소광 / 강광 방어 (Active NPQ)",
      spectralCurve
    };
  }

  /**
   * 16. Stem Xylem Ultrasonic Acoustic Emission (UAE, 20-100kHz) Cavitation Model
   * Quantifies micro-cavitation air-seeding pop events in xylem tracheids under hydraulic tension.
   */
  calculateUltrasonicAcousticEmissions(envParams = {}, cropProfile = {}, plantState = {}, sapDynamics = null) {
    const psiStem = sapDynamics && typeof sapDynamics.stemWaterPotentialMPa === "number" 
      ? sapDynamics.stemWaterPotentialMPa 
      : -0.68;

    // Cavitation vulnerability threshold: Arabidopsis/Herbaceous ~ -1.4 MPa
    const psiCrit = -1.35;
    const maxUaeRate = 180.0; // max events / min under catastrophic drought

    // Sigmoidal air-seeding cavitation burst rate
    const tensionDeficit = Math.max(0.0, -psiStem - 0.5);
    const uaeEventsPerMin = parseFloat(
      (maxUaeRate / (1.0 + Math.exp(-4.2 * (-psiStem - Math.abs(psiCrit))))).toFixed(1)
    );

    // Peak ultrasonic resonance frequency (kHz)
    const peakFreqKhz = parseFloat((55.0 + Math.random() * 15.0).toFixed(1));
    // Audible down-shifted acoustic frequency for human ear (Hz)
    const audiblePitchHz = Math.round(750 + tensionDeficit * 650);

    // Acoustic energy amplitude (dB AE)
    const amplitudeDb = parseFloat(Math.min(95, 30.0 + (uaeEventsPerMin / 2.0) + Math.random() * 8.0).toFixed(1));

    const cavitationRisk = uaeEventsPerMin < 5.0 
      ? "안전 (Hydraulic Safe)" 
      : (uaeEventsPerMin < 35.0 ? "도관 기포 발생 주의 (Mild Cavitation)" : "도관 폐쇄 위험 (Severe Embolism)");

    return {
      psiStemMPa: psiStem,
      uaeRateEventsPerMin: uaeEventsPerMin,
      peakFreqKhz,
      audiblePitchHz,
      amplitudeDb,
      cavitationRisk,
      isBurstActive: uaeEventsPerMin > 12.0
    };
  }
}

