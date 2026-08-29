/**
 * Plant Profile & Genomic/Physiological Parameter Manager
 * Fully dynamic: NO hardcoded bottlenecks. Every biological parameter can be edited in real time.
 */

export class PlantProfileManager {
  constructor() {
    this.profiles = {
      marigold_lutein: {
        id: "marigold_lutein",
        name: "메리골드 (Tagetes erecta) - 루테인 바이오파운드리",
        scientificName: "Tagetes erecta L.",
        targetMolecule: "고순도 루테인 (Lutein & Zeaxanthin)",
        chemicalFormula: "C₄₀H₅₆O₂",
        pubchemCid: 5281243,
        molecularWeight: 568.87,
        harvestDays: 42,
        
        // Photosynthesis FvCB parameters (25°C baseline)
        vcmax25: 75.0, // umol CO2 / m2 / s (Maximum Rubisco carboxylation capacity)
        jmax25: 145.0, // umol e- / m2 / s (Maximum electron transport rate)
        rd25: 1.1,    // umol CO2 / m2 / s (Mitochondrial dark respiration)
        ea_vcmax: 65000, // Activation energy J/mol
        ea_jmax: 48000,
        lightSaturationPoint: 650, // umol/m2/s
        gs_max: 0.42, // mol H2O / m2 / s (Maximum stomatal conductance)
        
        // Temperature & Microclimate tolerances
        tempOpt: 24.5,
        tempMin: 12.0,
        tempMax: 36.0,
        vpdOptMin: 0.80,
        vpdOptMax: 1.25,
        
        // Morphology & Biomass Allocation
        sla: 24.0, // Specific Leaf Area (m2 leaf / kg dry weight)
        maxLai: 4.5, // Maximum Leaf Area Index
        k_extinction: 0.65, // Light extinction coefficient
        leafPartitionRatio: 0.62, // % of fixed carbon allocated to leaves
        stemPartitionRatio: 0.22,
        rootPartitionRatio: 0.16,
        
        // Secondary Metabolite (Molecular Farming)
        baseLuteinConcentration: 3.4, // mg / g dry leaf weight
        spectrumSensitivity: {
          blue: 0.95, // Sensitivity exponent for blue LED elicitation
          uvb: 1.85,  // Multiplier for UV-B enzyme upregulation (PSY gene)
          farRed: 0.82
        }
      },

      spinach_carotenoid: {
        id: "spinach_carotenoid",
        name: "유기농 시금치 (Spinacia oleracea) - 엽록소/카로틴 복합체",
        scientificName: "Spinacia oleracea",
        targetMolecule: "복합 카로티노이드 (Carotenoid Complex)",
        chemicalFormula: "C₄₀H₅₆ / C₄₀H₅₆O₂",
        pubchemCid: 5280489,
        molecularWeight: 536.87,
        harvestDays: 32,
        
        vcmax25: 88.0,
        jmax25: 165.0,
        rd25: 1.3,
        ea_vcmax: 62000,
        ea_jmax: 45000,
        lightSaturationPoint: 520,
        gs_max: 0.48,
        
        tempOpt: 19.5,
        tempMin: 6.0,
        tempMax: 28.0,
        vpdOptMin: 0.70,
        vpdOptMax: 1.10,
        
        sla: 32.0,
        maxLai: 3.8,
        k_extinction: 0.70,
        leafPartitionRatio: 0.75,
        stemPartitionRatio: 0.12,
        rootPartitionRatio: 0.13,
        
        baseLuteinConcentration: 4.2,
        spectrumSensitivity: {
          blue: 0.75,
          uvb: 1.45,
          farRed: 0.92
        }
      },

      tobacco_recombinant: {
        id: "tobacco_recombinant",
        name: "담배 (Nicotiana benthamiana) - 재조합 단백질 바이오공장",
        scientificName: "Nicotiana benthamiana",
        targetMolecule: "치료용 재조합 단백질 (Recombinant Protein / mAb)",
        chemicalFormula: "Recombinant Biomacromolecule",
        pubchemCid: 0,
        molecularWeight: 145000.0,
        harvestDays: 35,
        
        vcmax25: 92.0,
        jmax25: 180.0,
        rd25: 1.4,
        ea_vcmax: 68000,
        ea_jmax: 51000,
        lightSaturationPoint: 780,
        gs_max: 0.52,
        
        tempOpt: 25.5,
        tempMin: 15.0,
        tempMax: 36.0,
        vpdOptMin: 0.85,
        vpdOptMax: 1.30,
        
        sla: 22.0,
        maxLai: 5.5,
        k_extinction: 0.60,
        leafPartitionRatio: 0.68,
        stemPartitionRatio: 0.20,
        rootPartitionRatio: 0.12,
        
        baseLuteinConcentration: 2.1, // Target expressed protein % of TSP
        spectrumSensitivity: {
          blue: 0.65,
          uvb: 1.25,
          farRed: 1.25
        }
      },

      kale_antioxidant: {
        id: "kale_antioxidant",
        name: "슈퍼푸드 케일 (Brassica oleracea) - 설포라판 & 플라보노이드",
        scientificName: "Brassica oleracea var. sabellica",
        targetMolecule: "설포라판 & 퀘르세틴 (Sulforaphane / Quercetin)",
        chemicalFormula: "C₆H₁₁NOS₂ / C₁₅H₁₀O₇",
        pubchemCid: 5350,
        molecularWeight: 177.29,
        harvestDays: 38,
        
        vcmax25: 82.0,
        jmax25: 155.0,
        rd25: 1.2,
        ea_vcmax: 64000,
        ea_jmax: 47000,
        lightSaturationPoint: 600,
        gs_max: 0.44,
        
        tempOpt: 20.5,
        tempMin: 8.0,
        tempMax: 30.0,
        vpdOptMin: 0.75,
        vpdOptMax: 1.18,
        
        sla: 26.0,
        maxLai: 4.4,
        k_extinction: 0.68,
        leafPartitionRatio: 0.70,
        stemPartitionRatio: 0.18,
        rootPartitionRatio: 0.12,
        
        baseLuteinConcentration: 3.9,
        spectrumSensitivity: {
          blue: 0.88,
          uvb: 1.95,
          farRed: 0.88
        }
      }
    };

    this.activeKey = "marigold_lutein";
  }

  getActiveProfile() {
    return this.profiles[this.activeKey];
  }

  setActiveProfile(key) {
    if (this.profiles[key]) {
      this.activeKey = key;
      return true;
    }
    return false;
  }

  updateParameter(paramName, value) {
    const active = this.getActiveProfile();
    if (active && active[paramName] !== undefined) {
      active[paramName] = typeof active[paramName] === "number" ? parseFloat(value) : value;
      return true;
    }
    return false;
  }

  getAllProfiles() {
    return Object.values(this.profiles);
  }

  exportProfileJson() {
    return JSON.stringify(this.getActiveProfile(), null, 2);
  }

  importProfileJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.id && parsed.name && parsed.vcmax25) {
        this.profiles[parsed.id] = parsed;
        this.activeKey = parsed.id;
        return { success: true, profile: parsed };
      }
      return { success: false, error: "필수 생물학 파라미터(id, name, vcmax25 등)가 누락되었습니다." };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}
