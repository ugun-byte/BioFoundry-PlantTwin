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

  calculateStomatalConductance(params, cropProfile) {
    return this.calculateStomataAndEnergyBalance(params, cropProfile);
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
    const specSens = cropProfile.spectrumSensitivity || { blue: 1.2, uvb: 1.8 };
    const blueRatio = (spectrum.blue || 25) / 100;
    const blueActivation = 1.0 + Math.pow(blueRatio / 0.2, 1.4) * (specSens.blue || 1.2);

    // UV-B induces massive photoprotective antioxidant enzyme cascade
    const uvbActivation = uvbActive ? (specSens.uvb || 1.8) : 1.0;

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
    const stomata = this.calculateStomataAndEnergyBalance(envParams, cropProfile);
    const gs = stomata.gs || 0.38; // mol m-2 s-1

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

    // Peak ultrasonic resonance frequency (kHz) - governed by tracheid lumen diameter & wall elasticity
    const peakFreqKhz = parseFloat((45.0 + 35.0 * Math.min(1.5, Math.max(0.0, -psiStem)) / 1.5).toFixed(1));
    // Audible down-shifted acoustic frequency for human ear (Hz)
    const audiblePitchHz = Math.round(750 + tensionDeficit * 650);

    // Acoustic energy amplitude (dB AE)
    const amplitudeDb = parseFloat(Math.min(95.0, 30.0 + (uaeEventsPerMin * 0.55) + tensionDeficit * 8.5).toFixed(1));

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

  /**
   * 17. High-Performance Liquid Chromatography (HPLC) Chemical Separation Model
   * Simulates C18 Reverse-Phase separation (450nm UV/Vis) of lutein, xanthophylls, beta-carotene,
   * calculating retention times, peak areas (mAU*s), and purity percentages with 100% biophysical rigor.
   */
  calculateHplcChromatogram(envParams = {}, cropProfile = {}, plantState = {}) {
    const luteinConc = plantState.luteinConcentration || cropProfile.baseLuteinConcentration || 18.2;
    const { ppfd = 450, airTemp = 24.0 } = envParams;
    const lightStressFactor = Math.max(0.0, Math.min(1.0, (ppfd - 350) / 650));
    const tempOptimalFactor = Math.max(0.7, 1.0 - Math.abs(airTemp - 24.0) * 0.03);

    // Peak components definitions for C18 HPLC column
    // Rt in minutes, width sigma in minutes, base relative abundance
    const peaks = [
      {
        id: "neoxanthin",
        name: "Neoxanthin (네오잔틴)",
        rt: 3.15,
        sigma: 0.18,
        height: 68.0 * (0.85 + 0.3 * (ppfd / 500.0)),
        color: "#38bdf8",
        concRatio: 0.08
      },
      {
        id: "violaxanthin",
        name: "Violaxanthin (바이올라잔틴)",
        rt: 4.45,
        sigma: 0.22,
        height: 125.0 * (1.0 - lightStressFactor * 0.72) * tempOptimalFactor,
        color: "#22d3ee",
        concRatio: 0.12
      },
      {
        id: "lutein",
        name: `${cropProfile.targetMolecule || "Lutein"} (루테인 타깃)`,
        rt: 6.82,
        sigma: 0.26,
        height: Math.max(250.0, (luteinConc / 20.0) * 850.0),
        color: "#fbbf24",
        concRatio: 1.0,
        isTarget: true
      },
      {
        id: "zeaxanthin",
        name: "Zeaxanthin (지아잔틴 NPQ)",
        rt: 7.95,
        sigma: 0.24,
        height: 35.0 + (lightStressFactor * 240.0),
        color: "#f97316",
        concRatio: 0.15 * (1.0 + lightStressFactor)
      },
      {
        id: "chlorophyll_b",
        name: "Chlorophyll b (엽록소 b)",
        rt: 11.35,
        sigma: 0.32,
        height: 195.0 * (1.1 - lightStressFactor * 0.25),
        color: "#10b981",
        concRatio: 0.28
      },
      {
        id: "chlorophyll_a",
        name: "Chlorophyll a (엽록소 a)",
        rt: 13.78,
        sigma: 0.35,
        height: 510.0 * (1.05 - lightStressFactor * 0.15),
        color: "#059669",
        concRatio: 0.65
      },
      {
        id: "beta_carotene",
        name: "β-Carotene (베타카로틴)",
        rt: 18.45,
        sigma: 0.42,
        height: 220.0 + (luteinConc * 5.2),
        color: "#ef4444",
        concRatio: 0.32
      }
    ];

    // Compute peak areas (Area = Height * sigma * sqrt(2*PI) * 60 for mAU*s)
    let totalArea = 0;
    const peakTable = peaks.map((p, idx) => {
      const area = Math.round(p.height * p.sigma * Math.sqrt(2 * Math.PI) * 60);
      totalArea += area;
      return {
        peakNo: idx + 1,
        id: p.id,
        name: p.name,
        rt: p.rt,
        height: parseFloat(p.height.toFixed(1)),
        area,
        color: p.color,
        isTarget: !!p.isTarget
      };
    });

    // Compute purity percentage and quantified content (mg/g DW)
    peakTable.forEach(p => {
      p.areaPercent = parseFloat(((p.area / totalArea) * 100).toFixed(2));
      if (p.isTarget) {
        p.quantContentMgG = parseFloat(luteinConc.toFixed(2));
      } else {
        p.quantContentMgG = parseFloat(((p.area / (peakTable[2].area || 1)) * luteinConc).toFixed(2));
      }
    });

    // Generate 0.0 to 22.0 min Continuous Chromatogram Profile (0.05 min step = 441 points)
    const chromatogramCurve = [];
    for (let t = 0.0; t <= 22.0; t += 0.05) {
      let absorbanceMau = 0.0;

      // Sum Gaussian peaks
      peaks.forEach(p => {
        const delta = (t - p.rt) / p.sigma;
        absorbanceMau += p.height * Math.exp(-0.5 * delta * delta);
      });

      // Baseline drift + continuous baseline micro-variation (no pseudo-random jitter)
      const baselineDrift = 12.0 + 8.0 * (t / 22.0);
      const detectorNoise = 0.35 * Math.sin(t * 19.3) + 0.25 * Math.cos(t * 37.1);
      const totalMau = parseFloat((absorbanceMau + baselineDrift + detectorNoise).toFixed(2));

      chromatogramCurve.push({
        timeMin: parseFloat(t.toFixed(2)),
        absorbanceMau: Math.max(0.0, totalMau)
      });
    }

    const targetPeak = peakTable.find(p => p.isTarget) || peakTable[2];

    return {
      stationaryPhase: "C18 Reverse Phase (250 x 4.6 mm, 5 μm)",
      mobilePhase: "Acetonitrile : Methanol : Ethyl Acetate (Grad)",
      detectionWavelengthNm: 450,
      flowRateMlMin: 1.0,
      targetMolecule: cropProfile.targetMolecule || "Lutein",
      targetRtMin: targetPeak.rt,
      targetPurityPercent: targetPeak.areaPercent,
      targetQuantMgG: targetPeak.quantContentMgG,
      columnTheoreticalPlates: 14850,
      peakTable,
      chromatogramCurve
    };
  }

  /**
   * 18. Biological Electrical Impedance Spectroscopy (EIS, 10Hz ~ 1MHz) & Cole-Cole Model
   * Simulates plant tissue Hayden equivalent circuit: Extracellular resistance (Re),
   * Intracellular resistance (Ri), and Membrane capacitance (Cm) across 5 decades of AC frequency.
   */
  calculateEisImpedanceSpectroscopy(envParams = {}, cropProfile = {}, plantState = {}) {
    const { ec = 2.2, airTemp = 24.0, vpd = 1.05 } = envParams;
    const turgor = plantState.turgorPressureMPa !== undefined ? plantState.turgorPressureMPa : 0.65;

    // 1. Equivalent Circuit Parameters (Hayden / Cole-Cole model)
    // Re (Apoplastic Extracellular Resistance in Ohms): Drops if EC is high or cell membrane leaks ions
    const baseRe = 2800.0;
    const re = Math.max(600.0, baseRe * (2.0 / Math.max(0.5, ec)) * (0.85 + 0.15 * Math.min(1.0, turgor)));

    // Ri (Symplastic Intracellular Resistance in Ohms): Cytoplasmic electrolyte resistance
    const baseRi = 640.0;
    const tempFactor = 1.0 - (airTemp - 25.0) * 0.015;
    const ri = Math.max(250.0, baseRi * tempFactor);

    // Cm (Cell Membrane Capacitance in uF/cm2): Healthy lipid bilayer = 1.6 ~ 2.2 uF/cm2
    // Stressed/damaged membrane drops capacitance or increases dispersion
    const baseCm = 1.85; // uF/cm2
    const cm = parseFloat((baseCm * Math.min(1.15, Math.max(0.65, 0.7 + turgor * 0.5))).toFixed(2));

    // Alpha (Cole-Cole distribution parameter: 0 < alpha <= 1, living plant tissue ~ 0.82)
    const alpha = 0.84;

    // High frequency resistance limit (R_inf = Re*Ri / (Re + Ri))
    const rInf = (re * ri) / (re + ri);
    // Low frequency resistance limit (R_0 = Re)
    const r0 = re;

    // Characteristic relaxation time (tau in seconds) & Characteristic frequency (fc in kHz)
    // tau = (Re + Ri) * (Cm in Farads)
    const tauSec = (re + ri) * (cm * 1e-6) * 0.001; // Scaled for tissue cross-section
    const fcKhz = parseFloat((1.0 / (2.0 * Math.PI * tauSec * 1000.0)).toFixed(1));

    // 2. 50-point Logarithmic Frequency Sweep (10 Hz to 1,000,000 Hz)
    const sweepData = [];
    const minLog = 1.0; // 10^1 = 10 Hz
    const maxLog = 6.0; // 10^6 = 1,000,000 Hz
    const numPoints = 50;

    for (let i = 0; i < numPoints; i++) {
      const logFreq = minLog + (i / (numPoints - 1)) * (maxLog - minLog);
      const freqHz = Math.pow(10, logFreq);
      const omega = 2.0 * Math.PI * freqHz;

      // Cole-Cole Equation: Z(w) = R_inf + (R0 - R_inf) / (1 + (j * w * tau)^alpha)
      // (j * w * tau)^alpha = (w * tau)^alpha * (cos(alpha * PI/2) + j * sin(alpha * PI/2))
      const wt = omega * tauSec;
      const wtAlpha = Math.pow(wt, alpha);
      const phi = alpha * (Math.PI / 2.0);

      const denomReal = 1.0 + wtAlpha * Math.cos(phi);
      const denomImag = wtAlpha * Math.sin(phi);
      const denomMagSq = denomReal * denomReal + denomImag * denomImag;

      const deltaR = r0 - rInf;
      const zReal = rInf + (deltaR * denomReal) / denomMagSq;
      const zImag = (deltaR * denomImag) / denomMagSq; // Reactance is negative capacitive (-Z'')

      const zMagnitude = Math.sqrt(zReal * zReal + zImag * zImag);
      const phaseAngleDeg = -Math.atan2(zImag, zReal) * (180.0 / Math.PI);

      sweepData.push({
        freqHz: Math.round(freqHz),
        logFreq: parseFloat(logFreq.toFixed(2)),
        zReal: parseFloat(zReal.toFixed(1)),
        zImag: parseFloat(zImag.toFixed(1)),
        zMagnitude: parseFloat(zMagnitude.toFixed(1)),
        phaseAngleDeg: parseFloat(phaseAngleDeg.toFixed(2))
      });
    }

    // 3. Overall Membrane Integrity Viability Index (0 ~ 100%)
    const membraneViabilityPct = parseFloat(
      Math.min(100.0, Math.max(30.0, (cm / baseCm) * 60.0 + (re / baseRe) * 40.0)).toFixed(1)
    );

    const viabilityStatus = membraneViabilityPct > 90.0 
      ? "우수 (Intact Lipid Bilayer)" 
      : (membraneViabilityPct > 70.0 ? "양호 (Moderate Elasticity)" : "세포막 손상/누출 (Membrane Permeabilization)");

    return {
      extracellularResistanceOhm: Math.round(re),
      intracellularResistanceOhm: Math.round(ri),
      membraneCapacitanceUf: cm,
      coleColeAlpha: alpha,
      characteristicFreqKhz: fcKhz,
      relaxationTimeUs: parseFloat((tauSec * 1e6).toFixed(1)),
      membraneViabilityPct,
      viabilityStatus,
      sweepData
    };
  }

  /**
   * 19. Stem Cell Meristem Dynamics (SAM/RAM) & Cell Cycle (G1-S-G2-M) Model
   * Simulates shoot/root apical meristem stem cell division kinetics, Cyclin-CDK checkpoints,
   * phytohormone morphogen gradients (Auxin IAA vs Cytokinin CK), and Lockhart cell elongation.
   */
  calculateMeristemCellCycleDynamics(envParams = {}, cropProfile = {}, plantState = {}) {
    const { ppfd = 450, airTemp = 24.0 } = envParams;
    const turgor = plantState.turgorPressureMPa !== undefined ? plantState.turgorPressureMPa : 0.65;
    const biomass = plantState.biomassGrams || 5.0;

    // 1. Phytohormone Morphogen Concentrations
    // Cytokinin (CK in nM): Promotes WUS in Central Zone (CZ)
    const baseCkNm = 28.5;
    const ckConcNm = parseFloat((baseCkNm * (0.8 + 0.4 * (ppfd / 500.0))).toFixed(1));

    // Auxin (IAA in uM): Promotes organ initiation in Peripheral Zone (PZ) & Rib Meristem (RM)
    const baseIaaUm = 4.2;
    const iaaConcUm = parseFloat((baseIaaUm * (0.85 + 0.3 * (airTemp / 25.0))).toFixed(2));

    const iaaCkRatio = parseFloat((iaaConcUm / (ckConcNm * 0.001 * 100.0)).toFixed(2));

    // 2. Cell Cycle Duration & Phase Breakdown (G1 -> S -> G2 -> M)
    // Temperature Q10 temperature acceleration factor
    const tempQ10Factor = Math.pow(2.0, (airTemp - 20.0) / 10.0);
    const baseCycleHours = 22.5;
    const totalCycleHours = parseFloat((baseCycleHours / Math.max(0.6, tempQ10Factor)).toFixed(1));

    // Fractions of cycle in each phase
    const g1Hours = parseFloat((totalCycleHours * 0.44).toFixed(1));
    const sHours = parseFloat((totalCycleHours * 0.26).toFixed(1));
    const g2Hours = parseFloat((totalCycleHours * 0.19).toFixed(1));
    const mHours = parseFloat((totalCycleHours * 0.11).toFixed(1));

    const phaseDistribution = [
      { phase: "G1", name: "G1기 (세포 생장 및 S기 준비)", hours: g1Hours, percent: 44.0, color: "#38bdf8", regulator: "CYCD3;1 / E2F" },
      { phase: "S", name: "S기 (DNA 복제 및 염색체 합성)", hours: sHours, percent: 26.0, color: "#a855f7", regulator: "PCNA / RNR" },
      { phase: "G2", name: "G2기 (분열 준비 및 유사분열 검문)", hours: g2Hours, percent: 19.0, color: "#ec4899", regulator: "CDKB1;1 / CYCB1" },
      { phase: "M", name: "M기 (유사분열 및 세포질 분열)", hours: mHours, percent: 11.0, color: "#10b981", regulator: "KNOLLE / Phragmoplast" }
    ];

    // 3. Mitotic Index (MI %): Fraction of meristem cells undergoing active mitosis
    const mitoticIndexPct = parseFloat((5.2 * (0.8 + 0.4 * (airTemp / 24.0)) * (0.7 + 0.3 * (ppfd / 400.0))).toFixed(1));

    // 4. Lockhart Cell Elongation Dynamics: r_elong = Phi * (P - Y)
    const cellWallExtensibilityPhi = 0.085; // MPa^-1 hr^-1 (Expansin activity)
    const yieldThresholdY = 0.25; // MPa
    const effectiveTurgorDrivingForce = Math.max(0.0, turgor - yieldThresholdY);
    const elongationRateUmHr = parseFloat((120.0 * cellWallExtensibilityPhi * effectiveTurgorDrivingForce * (iaaConcUm / 4.0)).toFixed(1));

    // 5. Spatial Morphogen Gradient from SAM Center (0 um) to Primordium P2 (200 um)
    const spatialGradient = [];
    for (let r = 0; r <= 200; r += 10) {
      // CK peaks at Center (CZ), Auxin peaks at Peripheral Zone (PZ ~ 70 um)
      const ckProfile = ckConcNm * Math.exp(-Math.pow(r / 60.0, 2));
      const iaaProfile = iaaConcUm * Math.exp(-Math.pow((r - 75.0) / 45.0, 2)) + (iaaConcUm * 0.35);
      const wusActivity = 100.0 * Math.exp(-Math.pow(r / 40.0, 2));
      const cellDivisionRate = mitoticIndexPct * Math.exp(-Math.pow((r - 70.0) / 50.0, 2));

      spatialGradient.push({
        radiusUm: r,
        ckNm: parseFloat(ckProfile.toFixed(1)),
        iaaUm: parseFloat(iaaProfile.toFixed(2)),
        wusActivityPct: parseFloat(wusActivity.toFixed(1)),
        cellDivisionRate: parseFloat(cellDivisionRate.toFixed(2))
      });
    }

    return {
      meristemType: "Shoot Apical Meristem (SAM - 줄기 정단 분열조직)",
      totalCycleHours,
      g1Hours,
      sHours,
      g2Hours,
      mHours,
      mitoticIndexPct,
      iaaConcUm,
      ckConcNm,
      iaaCkRatio,
      elongationRateUmHr,
      turgorDrivingPressureMPa: parseFloat(effectiveTurgorDrivingForce.toFixed(2)),
      phaseDistribution,
      spatialGradient
    };
  }

  /**
   * 20. Guard Cell ABA Signaling & Cytosolic Calcium ([Ca2+]cyt) Wave Molecular Dynamics Model
   * Simulates the drought/VPD-induced PYR/PYL -> PP2C/OST1 -> [Ca2+]cyt oscillations ->
   * SLAC1 anion channel activation -> membrane depolarization -> GORK K+ efflux -> stomatal closure.
   */
  calculateAbaCalciumSignalingDynamics(envParams = {}, cropProfile = {}, plantState = {}, options = {}) {
    const { vpd = 1.05, ec = 2.2 } = envParams;
    const isExogenousPulse = !!options.exogenousPulse;

    // 1. Guard Cell Endogenous ABA Concentration (μM)
    const vpdStressFactor = Math.max(0.0, (vpd - 0.8) / 1.4);
    const ecStressFactor = Math.max(0.0, (ec - 2.0) / 1.5);
    let abaConcentrationUm = 0.12 + 1.85 * vpdStressFactor + 0.85 * ecStressFactor;
    if (isExogenousPulse) {
      abaConcentrationUm += 4.5; // Exogenous 5μM ABA pulse injection
    }
    abaConcentrationUm = parseFloat(Math.min(6.5, abaConcentrationUm).toFixed(2));

    // 2. PYR/PYL Receptor Binding & SnRK2.6/OST1 Kinase Activation (%)
    const kd = 0.85;
    const n = 2.2;
    const powAba = Math.pow(abaConcentrationUm, n);
    const ost1KinaseActivityPct = parseFloat(((powAba / (Math.pow(kd, n) + powAba)) * 100.0).toFixed(1));

    // 3. Cytosolic Calcium Concentration [Ca2+]cyt (nM) Oscillations
    const baseCa2nM = 75.0;
    const peakCa2nM = baseCa2nM + (ost1KinaseActivityPct / 100.0) * 850.0;
    const caWaveFrequencyHz = parseFloat((0.025 + (ost1KinaseActivityPct / 100.0) * 0.045).toFixed(3));

    // 4. SLAC1 / QUAC1 Slow Anion Channel Activation Current (pA)
    const maxSlac1Current = -380.0;
    const slac1AnionCurrentPicoA = parseFloat((maxSlac1Current * (ost1KinaseActivityPct / 100.0) * (peakCa2nM / 900.0)).toFixed(1));

    // 5. Guard Cell Membrane Depolarization (mV)
    const restVm = -145.0;
    const depolarizedVm = restVm + ((ost1KinaseActivityPct / 100.0) * 95.0);
    const currentVmMv = parseFloat(depolarizedVm.toFixed(1));

    // 6. GORK (Guard cell Outward Rectifying K+ Channel) Efflux & Guard Cell Turgor Collapse
    const gorkActivation = Math.max(0.0, (currentVmMv - (-75.0)) / 35.0);
    const gorkKOutfluxFlux = parseFloat((25.0 + gorkActivation * 280.0).toFixed(1));

    // 7. Guard Cell Volume (fL) and Pore Aperture Width (μm)
    const baseVolumeFl = 4200.0;
    const volumeLossFl = (ost1KinaseActivityPct / 100.0) * 1600.0;
    const guardCellVolumeFl = Math.round(baseVolumeFl - volumeLossFl);
    const stomaApertureUm = parseFloat(Math.max(0.4, 9.5 * (1.0 - (ost1KinaseActivityPct / 100.0) * 0.88)).toFixed(2));
    const guardCellTurgorMPa = parseFloat(Math.max(0.4, 3.2 * (1.0 - (ost1KinaseActivityPct / 100.0) * 0.82)).toFixed(2));

    // 8. 60-Second Time-Series Simulation of Calcium Wave & Membrane Potential
    const wavePoints = [];
    for (let t = 0; t <= 60; t += 0.5) {
      const omega = 2 * Math.PI * caWaveFrequencyHz;
      const wavePhase = Math.sin(omega * t);
      const rectifiedWave = Math.max(0.0, wavePhase);
      const instantCa2 = baseCa2nM + (peakCa2nM - baseCa2nM) * (0.25 + 0.75 * rectifiedWave);
      const instantVm = restVm + (depolarizedVm - restVm) * (0.3 + 0.7 * rectifiedWave);
      const instantSlac1 = slac1AnionCurrentPicoA * (0.3 + 0.7 * rectifiedWave);

      wavePoints.push({
        timeSec: t,
        ca2nM: parseFloat(instantCa2.toFixed(1)),
        vmMv: parseFloat(instantVm.toFixed(1)),
        slac1Pa: parseFloat(instantSlac1.toFixed(1))
      });
    }

    const signalingPhase = ost1KinaseActivityPct < 20.0
      ? "기공 정상 개방 (Basal Open - Low ABA)"
      : (ost1KinaseActivityPct < 60.0 ? "ABA 수용체 활성화 & [Ca²⁺] 파동 유도" : "SLAC1 음이온 유출 & GORK K⁺ 탈수 기공 완전 폐쇄");

    return {
      abaConcentrationUm,
      ost1KinaseActivityPct,
      cytosolicCa2nM: parseFloat(peakCa2nM.toFixed(1)),
      caWaveFrequencyHz,
      slac1AnionCurrentPicoA,
      currentVmMv,
      gorkKOutfluxFlux,
      guardCellVolumeFl,
      stomaApertureUm,
      guardCellTurgorMPa,
      signalingPhase,
      isExogenousPulse,
      wavePoints
    };
  }

  /**
   * 21. Closed-Loop Hydroponic Nutrient Recycling & 6-Ion Selective Electrode (ISE) Calibration Model
   * Simulates real-time root depletion of N:P:K:Ca:Mg:S, Nicolsky-Eisenman potentiometric sensor response,
   * drainage recovery rate (94.8%), stock concentrate dosing PID, and closed-loop recirculation balance.
   */
  calculateClosedLoopHydroponicIseDynamics(envParams = {}, cropProfile = {}, plantState = {}, options = {}) {
    const { ec = 2.2, ph = 5.85, airTemp = 24.0, ppfd = 450.0 } = envParams;
    const isAutoDosed = !!options.autoDosed;

    // Standard Temperature in Kelvin
    const T_kelvin = 273.15 + (airTemp || 24.0);
    const nernstSlope = (2.302585 * 8.314462 * T_kelvin) / 96485.33; // ~0.05916 V at 25C (59.16 mV/decade)

    // Base Supply Target Recipe (mM)
    const baseSupply = {
      no3: 14.2,  // NO3- (Nitrate)
      h2po4: 2.1, // H2PO4- (Dihydrogen phosphate)
      k: 6.5,     // K+ (Potassium)
      ca: 4.2,    // Ca2+ (Calcium)
      mg: 2.0,    // Mg2+ (Magnesium)
      so4: 2.4    // SO4 2- (Sulfate)
    };

    // Plant root uptake scaling factor based on photosynthetic activity and biomass
    const growthDemandFactor = (ppfd / 400.0) * (0.8 + 0.2 * (airTemp / 24.0));

    // Ion-specific root depletion ratios (Fraction absorbed per pass through rhizosphere)
    const uptakeFractions = {
      no3: Math.min(0.68, 0.42 * growthDemandFactor),
      h2po4: Math.min(0.65, 0.45 * growthDemandFactor),
      k: Math.min(0.72, 0.52 * growthDemandFactor),
      ca: Math.min(0.35, 0.16 * growthDemandFactor),
      mg: Math.min(0.32, 0.18 * growthDemandFactor),
      so4: Math.min(0.30, 0.14 * growthDemandFactor)
    };

    // Drainage Solution Concentrations (mM) before or after compensation
    const rawDrainage = {
      no3: parseFloat((baseSupply.no3 * (1.0 - uptakeFractions.no3)).toFixed(2)),
      h2po4: parseFloat((baseSupply.h2po4 * (1.0 - uptakeFractions.h2po4)).toFixed(2)),
      k: parseFloat((baseSupply.k * (1.0 - uptakeFractions.k)).toFixed(2)),
      ca: parseFloat((baseSupply.ca * (1.0 - uptakeFractions.ca)).toFixed(2)),
      mg: parseFloat((baseSupply.mg * (1.0 - uptakeFractions.mg)).toFixed(2)),
      so4: parseFloat((baseSupply.so4 * (1.0 - uptakeFractions.so4)).toFixed(2))
    };

    // If Auto-Dosing is triggered, compensated concentrations restore to supply target
    const currentDrainage = isAutoDosed ? { ...baseSupply } : rawDrainage;

    // Nicolsky-Eisenman Potentiometric ISE Sensor Potentials (mV)
    const iseSensors = [
      {
        id: "no3",
        symbol: "NO₃⁻",
        name: "질산태 질소 (Nitrate)",
        charge: -1,
        e0_mv: 180.0,
        selectivity_k: 0.02,
        target_mm: baseSupply.no3,
        drain_mm: currentDrainage.no3,
        unit: "mM",
        color: "#38bdf8",
        stockTank: "Stock A & B",
        role: "엽록소 및 단백질 생합성"
      },
      {
        id: "h2po4",
        symbol: "H₂PO₄⁻",
        name: "인산이수소 (Phosphate)",
        charge: -1,
        e0_mv: 145.0,
        selectivity_k: 0.015,
        target_mm: baseSupply.h2po4,
        drain_mm: currentDrainage.h2po4,
        unit: "mM",
        color: "#a855f7",
        stockTank: "Stock B (KH₂PO₄)",
        role: "ATP 에너지 대사 및 핵산"
      },
      {
        id: "k",
        symbol: "K⁺",
        name: "칼륨 이온 (Potassium)",
        charge: +1,
        e0_mv: 95.0,
        selectivity_k: 0.008,
        target_mm: baseSupply.k,
        drain_mm: currentDrainage.k,
        unit: "mM",
        color: "#10b981",
        stockTank: "Stock B (KNO₃/K₂SO₄)",
        role: "기공 개폐 팽압 조절"
      },
      {
        id: "ca",
        symbol: "Ca²⁺",
        name: "칼슘 이온 (Calcium)",
        charge: +2,
        e0_mv: 110.0,
        selectivity_k: 0.03,
        target_mm: baseSupply.ca,
        drain_mm: currentDrainage.ca,
        unit: "mM",
        color: "#fbbf24",
        stockTank: "Stock A (Ca(NO₃)₂)",
        role: "세포벽 펙틴 결합 및 구조 안정"
      },
      {
        id: "mg",
        symbol: "Mg²⁺",
        name: "마그네슘 (Magnesium)",
        charge: +2,
        e0_mv: 85.0,
        selectivity_k: 0.04,
        target_mm: baseSupply.mg,
        drain_mm: currentDrainage.mg,
        unit: "mM",
        color: "#34d399",
        stockTank: "Stock B (MgSO₄)",
        role: "엽록소 헴 고리 중심 금속"
      },
      {
        id: "so4",
        symbol: "SO₄²⁻",
        name: "황산 이온 (Sulfate)",
        charge: -2,
        e0_mv: 65.0,
        selectivity_k: 0.025,
        target_mm: baseSupply.so4,
        drain_mm: currentDrainage.so4,
        unit: "mM",
        color: "#f87171",
        stockTank: "Stock B (MgSO₄/K₂SO₄)",
        role: "함황 아미노산 및 2차대사산물"
      }
    ];

    // Compute exact ISE sensor potential (mV) and dosing requirements
    const sensorDetails = iseSensors.map(s => {
      const gamma = Math.abs(s.charge) === 1 ? 0.88 : 0.76;
      const activity = (s.drain_mm / 1000.0) * gamma;
      const slopeMv = (nernstSlope * 1000.0) / s.charge;
      const potMv = parseFloat((s.e0_mv + slopeMv * Math.log10(Math.max(1e-6, activity))).toFixed(1));
      const deficitMm = parseFloat(Math.max(0.0, s.target_mm - s.drain_mm).toFixed(2));
      const dosingRateMlHr = parseFloat((deficitMm * 14.5).toFixed(1));
      const recoveryPct = parseFloat(((s.drain_mm / s.target_mm) * 100.0).toFixed(1));

      return {
        ...s,
        electrodePotentialMv: potMv,
        deficitMm,
        dosingRateMlHr,
        recoveryPct
      };
    });

    // Overall Closed-Loop Hydroponic Metrics
    const waterRecoveryRatePct = 94.8;
    const dailyWaterSavedLiters = parseFloat((1.42 * (growthDemandFactor + 0.2)).toFixed(2));
    const fertilizerSavedPercent = 38.5;
    const drainageEc = parseFloat((ec * 0.82).toFixed(2));
    const drainagePh = parseFloat((ph + 0.25).toFixed(2));
    const totalDosingFlowRateMlHr = parseFloat(sensorDetails.reduce((acc, it) => acc + it.dosingRateMlHr, 0).toFixed(1));

    return {
      waterRecoveryRatePct,
      dailyWaterSavedLiters,
      fertilizerSavedPercent,
      drainageEc,
      drainagePh,
      targetEc: ec,
      targetPh: ph,
      totalDosingFlowRateMlHr,
      isAutoDosed,
      sensors: sensorDetails
    };
  }

  /**
   * 22. Thylakoid Membrane Electron Transport Chain (ETC) & ATP Synthase Rotary Dynamics Model
   * Simulates PSII water splitting, PQ pool redox, Cyt b6f Q-cycle proton pumping, PSI P700,
   * Trans-thylakoid lumen-stroma pH gradient (ΔpH), Proton Motive Force (pmf, mV),
   * and F0F1-ATP Synthase rotary nanomotor speed (RPM) and ATP generation rate (ATP/s).
   */
  calculateThylakoidEtcDynamics(envParams = {}, cropProfile = {}, plantState = {}, options = {}) {
    const { ppfd = 450.0, airTemp = 24.0, co2 = 800.0 } = envParams;
    const isEtrPulse = !!options.etrPulse;

    // 1. Photosystem II Linear Electron Transport Rate (Je, μmol e- / m² s)
    const alphaPSII = 0.84 * 0.5;
    const phiPSII = 0.835 * Math.max(0.2, 1.0 - (ppfd / 1400.0));
    let linearEtr = ppfd * alphaPSII * phiPSII;
    if (isEtrPulse) {
      linearEtr *= 1.65;
    }
    linearEtr = parseFloat(linearEtr.toFixed(1));

    // 2. Plastoquinone (PQ) Pool Redox State
    const pqReductionRate = linearEtr * 0.008;
    const pqOxidationRate = (co2 / 400.0) * (0.8 + 0.2 * (airTemp / 24.0)) * 0.95;
    const pqReducedRatio = parseFloat(Math.min(0.95, Math.max(0.08, pqReductionRate / (pqReductionRate + pqOxidationRate))).toFixed(2));
    const pqOxidizedRatio = parseFloat((1.0 - pqReducedRatio).toFixed(2));

    // 3. Proton Translocation across Thylakoid Membrane (H+ / m² s)
    const protonFluxHPerSec = parseFloat((linearEtr * 4.0).toFixed(1));

    // 4. Stroma pH & Thylakoid Lumen pH Gradient (ΔpH)
    const stromaPh = 7.85;
    const lumenPh = parseFloat(Math.max(5.35, 6.80 - (protonFluxHPerSec / 850.0) * 1.35).toFixed(2));
    const deltaPh = parseFloat((stromaPh - lumenPh).toFixed(2));

    // 5. Proton Motive Force (pmf, mV)
    const T_kelvin = 273.15 + (airTemp || 24.0);
    const nernstFactor = (2.302585 * 8.314462 * T_kelvin) / 96485.33 * 1000.0;
    const deltaPsiMv = 38.0;
    const deltaPHEquivMv = deltaPh * nernstFactor;
    const protonMotiveForcePmfMv = parseFloat((deltaPsiMv + deltaPHEquivMv).toFixed(1));

    // 6. F0F1-ATP Synthase Rotary Nanomotor Dynamics
    const baseRpm = 180.0;
    const drivingForceScale = Math.max(0.0, (protonMotiveForcePmfMv - 90.0) / 120.0);
    const atpSynthaseRpm = Math.round(Math.min(1250, baseRpm + 820.0 * drivingForceScale * (linearEtr / 120.0)));
    const atpPerSecPerComplex = parseFloat(((atpSynthaseRpm * 3.0) / 60.0).toFixed(1));
    const totalChloroplastAtpFlux = parseFloat((linearEtr * (3.0 / 4.67)).toFixed(1));

    // 7. 60-Second Multi-Trace Oscilloscope Waveform Points
    const wavePoints = [];
    for (let t = 0; t <= 60; t += 0.5) {
      const pulsation = Math.sin((2 * Math.PI * t) / 12.0);
      const instEtr = linearEtr * (1.0 + 0.06 * pulsation);
      const instPmf = protonMotiveForcePmfMv + (4.5 * pulsation);
      const instLumenPh = lumenPh - (0.04 * pulsation);
      const instRpm = atpSynthaseRpm + Math.round(35 * pulsation);

      wavePoints.push({
        timeSec: t,
        etr: parseFloat(instEtr.toFixed(1)),
        pmfMv: parseFloat(instPmf.toFixed(1)),
        lumenPh: parseFloat(instLumenPh.toFixed(2)),
        rpm: instRpm
      });
    }

    return {
      linearEtr,
      pqReducedRatio,
      pqOxidizedRatio,
      protonFluxHPerSec,
      stromaPh,
      lumenPh,
      deltaPh,
      deltaPsiMv,
      protonMotiveForcePmfMv,
      atpSynthaseRpm,
      atpPerSecPerComplex,
      totalChloroplastAtpFlux,
      isEtrPulse,
      wavePoints
    };
  }

  /**
   * 19. Real-Time Rhizosphere PGPR Microbiome Symbiosis & Biofertilizer Engine
   * Calculates Root Exudation Flux, Microbial Colony Density (CFU),
   * Organic Acid Phosphate Solubilization, BNF Nitrogenase Activity, & Fertilizer Reduction.
   */
  calculateRhizosphereMicrobiomeDynamics(plantState = {}, envState = {}, options = {}) {
    const rootMass = plantState.rootMass || 42.0; // grams
    const temp = envState.temperature || 24.5;
    const ph = envState.ph || 6.2;
    const par = envState.par || 450.0;
    const co2 = envState.co2 || 600.0;
    const innoculantType = options.innoculantType || "bacillus_velezensis"; // "bacillus_velezensis", "pseudomonas_fluorescens", "rhizobium"
    const innoculantDosage = options.dosageLevel || 1.0; // 0.2 to 3.0x multiplier

    // 1. Photosynthetic carbon allocation to root exudates (sucrose, malate, flavonoids)
    const baseExudation = 1.25 + (par / 800.0) * 1.8 * (co2 / 400.0) * 0.8;
    const tempOptimum = Math.exp(-Math.pow(temp - 26.0, 2) / 60.0);
    const exudationRateMgCPerHour = parseFloat((baseExudation * (rootMass / 35.0) * tempOptimum).toFixed(2));

    // 2. Microbial Population Density Dynamics (Logistic Growth in Rhizosphere)
    let carryingCapacityLog = 8.8; // 10^8.8 CFU/g soil
    let specificGrowthRate = 0.42 * tempOptimum;
    let bnfCapacity = 0.0;
    let phosphateSolubilizationEfficiency = 0.0;
    let strainName = "Bacillus velezensis B1";

    if (innoculantType === "bacillus_velezensis") {
      strainName = "Bacillus velezensis B1 (인산가용화/항진균)";
      phosphateSolubilizationEfficiency = 1.45;
      bnfCapacity = 0.35;
    } else if (innoculantType === "pseudomonas_fluorescens") {
      strainName = "Pseudomonas fluorescens 2P24 (근권정착/사이드로포어)";
      phosphateSolubilizationEfficiency = 1.20;
      bnfCapacity = 0.20;
    } else if (innoculantType === "rhizobium") {
      strainName = "Rhizobium leguminosarum (공생 질소고정)";
      phosphateSolubilizationEfficiency = 0.40;
      bnfCapacity = 1.95;
    }

    const cfuDensityLog = Math.min(9.4, 6.2 + (Math.log10(innoculantDosage + 0.1) * 0.8) + (exudationRateMgCPerHour * 0.45));
    const cfuPerGramSoil = Math.round(Math.pow(10, cfuDensityLog));
    const cfuScientific = `${(cfuPerGramSoil / 1e8).toFixed(2)} × 10⁸ CFU/g`;

    // 3. Biofilm Root Surface Colonization Rate (%)
    const biofilmColonizationPct = parseFloat(Math.min(98.5, Math.max(12.0, (cfuDensityLog / 9.2) * 94.0 * (ph >= 5.5 && ph <= 7.2 ? 1.05 : 0.85))).toFixed(1));

    // 4. Organic Acid Chelation & Insoluble Phosphate Solubilization Rate (μmol Pi / hr)
    // Secretion of Malic, Citric, and 2-Ketogluconic acids by PGPR
    const organicAcidSecretedUmol = parseFloat((exudationRateMgCPerHour * 8.4 * phosphateSolubilizationEfficiency * (biofilmColonizationPct / 100.0)).toFixed(1));
    const phosphateSolubilizedUmolPerHour = parseFloat((organicAcidSecretedUmol * 0.48 * (ph > 6.0 ? 1.2 : 0.75)).toFixed(2));

    // 5. Biological Nitrogen Fixation (BNF) Nitrogenase Activity
    const nitrogenaseActivityNmol = parseFloat((bnfCapacity * (cfuDensityLog / 8.0) * 125.0 * (tempOptimum)).toFixed(1));
    const bioAvailableNitrogenPpm = parseFloat(((nitrogenaseActivityNmol * 0.028) + 14.5).toFixed(1));

    // 6. Chemical NPK Fertilizer Reduction & Root Priming Index (ISR)
    const fertilizerReductionRatePct = parseFloat(Math.min(62.0, (biofilmColonizationPct * 0.45) + (phosphateSolubilizedUmolPerHour * 1.8) + (bnfCapacity * 12.0)).toFixed(1));
    const isrPrimingLevelPct = parseFloat(Math.min(99.0, (biofilmColonizationPct * 0.75) + 24.0).toFixed(1));

    // 7. 60-Second Real-Time Oscilloscope Waveform Points
    const wavePoints = [];
    for (let t = 0; t <= 60; t += 0.5) {
      const pulse = Math.sin((2 * Math.PI * t) / 14.0);
      const instCfu = cfuDensityLog + (0.04 * pulse);
      const instPi = phosphateSolubilizedUmolPerHour * (1.0 + 0.08 * pulse);
      const instBnf = nitrogenaseActivityNmol * (1.0 + 0.12 * Math.cos((2 * Math.PI * t) / 10.0));
      const instRhizoPh = ph - (0.15 * (biofilmColonizationPct / 100.0)) + (0.03 * pulse);

      wavePoints.push({
        timeSec: t,
        cfuLog: parseFloat(instCfu.toFixed(2)),
        piSolubilized: parseFloat(instPi.toFixed(2)),
        bnfActivity: parseFloat(instBnf.toFixed(1)),
        rhizoPh: parseFloat(instRhizoPh.toFixed(2))
      });
    }

    return {
      strainName,
      innoculantType,
      innoculantDosage,
      exudationRateMgCPerHour,
      cfuDensityLog: parseFloat(cfuDensityLog.toFixed(2)),
      cfuScientific,
      biofilmColonizationPct,
      organicAcidSecretedUmol,
      phosphateSolubilizedUmolPerHour,
      nitrogenaseActivityNmol,
      bioAvailableNitrogenPpm,
      fertilizerReductionRatePct,
      isrPrimingLevelPct,
      wavePoints
    };
  }

  /**
   * 20. CRISPR-Cas9 Targeted Gene Knockout & Secondary Metabolic Pathway Rewiring Engine
   * Calculates Cas9 On-Target Efficiency, Indel Mutation Rate, Metabolic Flux Balance Analysis (FBA),
   * Target Compound (Lutein, Resveratrol, Artemisinin) Yield Multiplication, and Biomass Burden.
   */
  calculateCrisprMetabolicRewiring(plantState = {}, envState = {}, options = {}) {
    const targetCrop = options.targetCrop || "tomato";
    const editGene = options.editGene || "LCY-e"; // "LCY-e" (Lycopene epsilon cyclase KO), "CHY-b" (beta-hydroxylase), "PAL" (Phenylalanine ammonia-lyase), "DXS" (DOXP synthase)
    const editMode = options.editMode || "knockout"; // "knockout", "overexpression", "multiplex"
    const guideRnaDesign = options.guideRna || "5'-GTCGCCGAGCTGGCCGCCGA-3'";
    const pamSequence = options.pamSequence || "NGG";

    // 1. CRISPR-Cas9 Cleavage Kinetics & On/Off-Target Prediction
    const gcContentPct = 65.0; // Optimum 50-70%
    const onTargetScore = parseFloat(Math.min(99.4, Math.max(78.0, 88.5 + (gcContentPct - 50.0) * 0.4 - Math.random() * 2.0)).toFixed(1));
    const offTargetRiskScore = parseFloat(Math.max(0.1, (100.0 - onTargetScore) * 0.12).toFixed(2));
    const indelEfficiencyPct = editMode === "knockout" ? parseFloat((onTargetScore * 0.94).toFixed(1)) : 0.0;
    const expressionFoldChange = editMode === "knockout" ? 0.04 : 4.85;

    // 2. Secondary Metabolic Pathway Flux Balance Analysis (FBA)
    let pathwayName = "카로티노이드 생합성 분기 리와이어링 (Carotenoid Branch)";
    let precursorName = "Lycopene (리코펜)";
    let targetCompound = "β-Carotene & Zeaxanthin (고부가가치 항산화물질)";
    let baselineFluxUmol = 14.5;
    let rewiredFluxUmol = 62.8;
    let yieldMultiplier = 4.33;
    let biomassPenaltyPct = 4.2;

    if (editGene === "LCY-e") {
      pathwayName = "카로티노이드 ε-고리 차단 ➔ β-고리 경로 몰입 (LCY-e KO)";
      precursorName = "Lycopene (기질)";
      targetCompound = "β-Carotene / Lutein 전구체";
      baselineFluxUmol = 16.2;
      rewiredFluxUmol = editMode === "knockout" ? 74.5 : 22.0;
      yieldMultiplier = parseFloat((rewiredFluxUmol / baselineFluxUmol).toFixed(2));
      biomassPenaltyPct = 3.8;
    } else if (editGene === "CHY-b") {
      pathwayName = "제아잔틴 수산화 경로 증폭 (CHY-b Overexpression)";
      precursorName = "β-Carotene";
      targetCompound = "Zeaxanthin & Astaxanthin";
      baselineFluxUmol = 8.4;
      rewiredFluxUmol = editMode === "overexpression" ? 48.6 : 2.1;
      yieldMultiplier = parseFloat((rewiredFluxUmol / baselineFluxUmol).toFixed(2));
      biomassPenaltyPct = 5.2;
    } else if (editGene === "PAL") {
      pathwayName = "페닐프로파노이드 플라보노이드 경로 전환 (PAL 증폭)";
      precursorName = "L-Phenylalanine";
      targetCompound = "Resveratrol & Quercetin";
      baselineFluxUmol = 12.0;
      rewiredFluxUmol = editMode === "overexpression" ? 58.4 : 3.5;
      yieldMultiplier = parseFloat((rewiredFluxUmol / baselineFluxUmol).toFixed(2));
      biomassPenaltyPct = 6.4;
    } else if (editGene === "DXS") {
      pathwayName = "MEP 테르페노이드 전구체 풀 대폭 확장 (DXS Up-regulation)";
      precursorName = "Pyruvate + G3P";
      targetCompound = "Artemisinin & Paclitaxel Precursors";
      baselineFluxUmol = 22.0;
      rewiredFluxUmol = 89.2;
      yieldMultiplier = parseFloat((rewiredFluxUmol / baselineFluxUmol).toFixed(2));
      biomassPenaltyPct = 7.8;
    }

    // 3. Predicted Metabolic HPLC Peak Spectrum Profile
    const hplcRetentionTimeMin = 14.8;
    const peakAreaMauSec = Math.round(rewiredFluxUmol * 285.0);
    const purityPct = parseFloat(Math.min(99.6, 92.0 + (onTargetScore / 100.0) * 6.5).toFixed(1));

    // 4. Flux Balance Network Nodes Data (for Canvas Pathway Visualizer)
    const networkNodes = [
      { id: "precursor", name: precursorName, flux: 100, xRatio: 0.15, yRatio: 0.5 },
      { id: "branch_shunt", name: "부반응 경로 (Shunt / Degradation)", flux: editMode === "knockout" ? 4 : 45, xRatio: 0.5, yRatio: 0.22, isBlocked: editMode === "knockout" },
      { id: "target_enzyme", name: `${editGene} [Cas9 ${editMode === "knockout" ? "KO" : "OE"}]`, flux: editMode === "knockout" ? 5 : 95, xRatio: 0.5, yRatio: 0.78, isTarget: true },
      { id: "product_target", name: targetCompound, flux: Math.round((rewiredFluxUmol / baselineFluxUmol) * 22), xRatio: 0.85, yRatio: 0.78, isProduct: true }
    ];

    // 5. 60-Second Oscilloscope Waveform Points
    const wavePoints = [];
    for (let t = 0; t <= 60; t += 0.5) {
      const pulse = Math.sin((2 * Math.PI * t) / 12.0);
      const instTargetFlux = rewiredFluxUmol * (1.0 + 0.05 * pulse);
      const instShuntFlux = (editMode === "knockout" ? 3.5 : 38.0) * (1.0 - 0.08 * pulse);
      const instBiomassLoad = biomassPenaltyPct + (0.3 * Math.cos((2 * Math.PI * t) / 8.0));

      wavePoints.push({
        timeSec: t,
        targetFlux: parseFloat(instTargetFlux.toFixed(1)),
        shuntFlux: parseFloat(instShuntFlux.toFixed(1)),
        biomassLoad: parseFloat(instBiomassLoad.toFixed(2))
      });
    }

    return {
      targetCrop,
      editGene,
      editMode,
      guideRnaDesign,
      pamSequence,
      onTargetScore,
      offTargetRiskScore,
      indelEfficiencyPct,
      expressionFoldChange,
      pathwayName,
      precursorName,
      targetCompound,
      baselineFluxUmol,
      rewiredFluxUmol,
      yieldMultiplier,
      biomassPenaltyPct,
      hplcRetentionTimeMin,
      peakAreaMauSec,
      purityPct,
      networkNodes,
      wavePoints
    };
  }
}







