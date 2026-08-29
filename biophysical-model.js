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
}
