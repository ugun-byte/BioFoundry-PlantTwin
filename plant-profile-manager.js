/**
 * Plant Profile & Genomic/Physiological Parameter Manager
 * 100% Dynamic Zero-Hardcoding Registry Engine with LocalStorage Persistence
 */

export class PlantProfileManager {
  constructor() {
    this.defaultProfiles = {
      marigold_lutein: {
        id: "marigold_lutein",
        name: "메리골드",
        nameEn: "Marigold",
        scientificName: "Tagetes erecta L.",
        targetMolecule: "루테인",
        targetMoleculeEn: "Lutein (C40H56O2)",
        chemicalFormula: "C₄₀H₅₆O₂",
        pubchemCid: 5281243,
        molecularWeight: 568.87,
        harvestDays: 42,
        morphologyType: "marigold",
        leafColor: "#22c55e",
        
        vcmax25: 75.0,
        jmax25: 145.0,
        rd25: 1.1,
        ea_vcmax: 65000,
        ea_jmax: 48000,
        lightSaturationPoint: 650,
        gs_max: 0.42,
        
        tempOpt: 24.5,
        tempMin: 12.0,
        tempMax: 36.0,
        vpdOptMin: 0.80,
        vpdOptMax: 1.25,
        
        sla: 24.0,
        maxLai: 4.5,
        k_extinction: 0.65,
        leafPartitionRatio: 0.62,
        stemPartitionRatio: 0.22,
        rootPartitionRatio: 0.16,
        
        baseLuteinConcentration: 3.4,
        spectrumSensitivity: { blue: 0.95, uvb: 1.85, farRed: 0.82 },
        ojipParams: { fo: 240, fj: 580, fi: 1020, fm: 1420, pqPool: 36, piAbs: 4.25, lhcSize: 1.15, phiPSII: 0.831 }
      },

      spinach_carotenoid: {
        id: "spinach_carotenoid",
        name: "유기농 시금치",
        nameEn: "Organic Spinach",
        scientificName: "Spinacia oleracea",
        targetMolecule: "복합 카로티노이드",
        targetMoleculeEn: "Carotenoid Complex & Chlorophyll",
        chemicalFormula: "C₄₀H₅₆ / C₄₀H₅₆O₂",
        pubchemCid: 5280489,
        molecularWeight: 536.87,
        harvestDays: 28,
        morphologyType: "spinach",
        leafColor: "#15803d",
        
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
        spectrumSensitivity: { blue: 0.75, uvb: 1.45, farRed: 0.92 },
        ojipParams: { fo: 310, fj: 690, fi: 1180, fm: 1890, pqPool: 42, piAbs: 5.40, lhcSize: 1.45, phiPSII: 0.836 }
      },

      kale_antioxidant: {
        id: "kale_antioxidant",
        name: "슈퍼푸드 케일",
        nameEn: "Superfood Kale",
        scientificName: "Brassica oleracea var. sabellica",
        targetMolecule: "설포라판 & 퀘르세틴",
        targetMoleculeEn: "Sulforaphane & Quercetin",
        chemicalFormula: "C₆H₁₁NOS₂ / C₁₅H₁₀O₇",
        pubchemCid: 5350,
        molecularWeight: 177.29,
        harvestDays: 35,
        morphologyType: "kale",
        leafColor: "#047857",
        
        vcmax25: 92.0,
        jmax25: 178.0,
        rd25: 1.2,
        ea_vcmax: 64000,
        ea_jmax: 47000,
        lightSaturationPoint: 700,
        gs_max: 0.45,
        
        tempOpt: 21.0,
        tempMin: 8.0,
        tempMax: 32.0,
        vpdOptMin: 0.75,
        vpdOptMax: 1.20,
        
        sla: 22.0,
        maxLai: 4.8,
        k_extinction: 0.68,
        leafPartitionRatio: 0.70,
        stemPartitionRatio: 0.18,
        rootPartitionRatio: 0.12,
        
        baseLuteinConcentration: 3.8,
        spectrumSensitivity: { blue: 1.10, uvb: 2.10, farRed: 0.85 },
        ojipParams: { fo: 220, fj: 540, fi: 960, fm: 1350, pqPool: 32, piAbs: 3.85, lhcSize: 1.05, phiPSII: 0.837 }
      },

      tobacco_recombinant: {
        id: "tobacco_recombinant",
        name: "바이오 담배",
        nameEn: "Bio-Tobacco",
        scientificName: "Nicotiana benthamiana",
        targetMolecule: "치료용 재조합 단백질",
        targetMoleculeEn: "Recombinant Therapeutic mAb",
        chemicalFormula: "Recombinant Biomacromolecule",
        pubchemCid: 0,
        molecularWeight: 145000.0,
        harvestDays: 55,
        morphologyType: "tobacco",
        leafColor: "#16a34a",
        
        vcmax25: 68.0,
        jmax25: 135.0,
        rd25: 0.95,
        ea_vcmax: 63000,
        ea_jmax: 46000,
        lightSaturationPoint: 600,
        gs_max: 0.38,
        
        tempOpt: 25.0,
        tempMin: 15.0,
        tempMax: 35.0,
        vpdOptMin: 0.85,
        vpdOptMax: 1.30,
        
        sla: 28.0,
        maxLai: 5.2,
        k_extinction: 0.62,
        leafPartitionRatio: 0.58,
        stemPartitionRatio: 0.28,
        rootPartitionRatio: 0.14,
        
        baseLuteinConcentration: 2.5,
        spectrumSensitivity: { blue: 0.85, uvb: 1.60, farRed: 0.75 },
        ojipParams: { fo: 270, fj: 640, fi: 1250, fm: 1680, pqPool: 54, piAbs: 4.80, lhcSize: 1.30, phiPSII: 0.839 }
      },

      grape_resveratrol: {
        id: "grape_resveratrol",
        name: "호장근 / 포도",
        nameEn: "Knotweed / Grape",
        scientificName: "Polygonum / Vitis",
        targetMolecule: "트랜스-레스베라트롤",
        targetMoleculeEn: "trans-Resveratrol (Anti-Aging)",
        chemicalFormula: "C₁₄H₁₂O₃",
        pubchemCid: 445154,
        molecularWeight: 228.24,
        harvestDays: 48,
        morphologyType: "tobacco",
        leafColor: "#15803d",
        
        vcmax25: 78.0,
        jmax25: 152.0,
        rd25: 1.05,
        ea_vcmax: 64000,
        ea_jmax: 47000,
        lightSaturationPoint: 620,
        gs_max: 0.40,
        
        tempOpt: 23.5,
        tempMin: 10.0,
        tempMax: 34.0,
        vpdOptMin: 0.80,
        vpdOptMax: 1.25,
        
        sla: 26.0,
        maxLai: 4.6,
        k_extinction: 0.64,
        leafPartitionRatio: 0.60,
        stemPartitionRatio: 0.24,
        rootPartitionRatio: 0.16,
        
        baseLuteinConcentration: 3.1,
        spectrumSensitivity: { blue: 1.25, uvb: 2.45, farRed: 0.88 },
        ojipParams: { fo: 235, fj: 570, fi: 1050, fm: 1460, pqPool: 38, piAbs: 4.60, lhcSize: 1.20, phiPSII: 0.839 }
      },

      algae_astaxanthin: {
        id: "algae_astaxanthin",
        name: "미세조류 헤마토코쿠스",
        nameEn: "Microalgae Haematococcus",
        scientificName: "Haematococcus pluvialis",
        targetMolecule: "천연 아스타잔틴",
        targetMoleculeEn: "Natural Astaxanthin (Anti-Oxidant)",
        chemicalFormula: "C₄₀H₅₂O₄",
        pubchemCid: 5281224,
        molecularWeight: 596.84,
        harvestDays: 21,
        morphologyType: "spinach",
        leafColor: "#b91c1c",
        
        vcmax25: 95.0,
        jmax25: 185.0,
        rd25: 1.4,
        ea_vcmax: 66000,
        ea_jmax: 49000,
        lightSaturationPoint: 850,
        gs_max: 0.50,
        
        tempOpt: 22.0,
        tempMin: 14.0,
        tempMax: 30.0,
        vpdOptMin: 0.60,
        vpdOptMax: 1.00,
        
        sla: 35.0,
        maxLai: 5.5,
        k_extinction: 0.72,
        leafPartitionRatio: 0.85,
        stemPartitionRatio: 0.05,
        rootPartitionRatio: 0.10,
        
        baseLuteinConcentration: 5.8,
        spectrumSensitivity: { blue: 1.40, uvb: 2.80, farRed: 0.95 },
        ojipParams: { fo: 280, fj: 680, fi: 1220, fm: 1750, pqPool: 48, piAbs: 5.80, lhcSize: 1.50, phiPSII: 0.840 }
      }
    };

    this.profiles = {};
    this.loadProfiles();
    this.activeProfileId = Object.keys(this.profiles)[0] || "marigold_lutein";
  }

  loadProfiles() {
    try {
      const saved = localStorage.getItem("BioFoundry_Custom_Profiles");
      if (saved) {
        const parsed = JSON.parse(saved);
        this.profiles = { ...this.defaultProfiles, ...parsed };
      } else {
        this.profiles = { ...this.defaultProfiles };
      }
    } catch (e) {
      this.profiles = { ...this.defaultProfiles };
    }
  }

  saveProfiles() {
    try {
      localStorage.setItem("BioFoundry_Custom_Profiles", JSON.stringify(this.profiles));
    } catch (e) {
      console.warn("LocalStorage save error:", e);
    }
  }

  getAllProfiles() {
    return Object.values(this.profiles);
  }

  getActiveProfile() {
    return this.profiles[this.activeProfileId] || this.profiles["marigold_lutein"];
  }

  setActiveProfile(id) {
    if (this.profiles[id]) {
      this.activeProfileId = id;
      return true;
    }
    return false;
  }

  getProfile(id) {
    return this.profiles[id] || null;
  }

  registerNewSpecies(profileData) {
    return this.registerNewProfile(profileData);
  }

  /**
   * Register a new custom plant species
   */
  registerNewProfile(profileData) {
    const id = profileData.id || `crop_${Date.now()}`;
    const newProfile = {
      id: id,
      name: profileData.name || "신규 바이오 식물",
      nameEn: profileData.nameEn || profileData.name || "New Bio-Plant Species",
      scientificName: profileData.scientificName || "Botanical species sp.",
      targetMolecule: profileData.targetMolecule || "유효 대사산물",
      targetMoleculeEn: profileData.targetMoleculeEn || profileData.targetMolecule || "Target Phytochemical",
      chemicalFormula: profileData.chemicalFormula || "C₂₀H₃₀O",
      pubchemCid: parseInt(profileData.pubchemCid, 10) || 0,
      molecularWeight: parseFloat(profileData.molecularWeight) || 300.0,
      harvestDays: parseInt(profileData.harvestDays, 10) || 35,
      morphologyType: profileData.morphologyType || "marigold",
      leafColor: profileData.leafColor || "#22c55e",

      vcmax25: parseFloat(profileData.vcmax25) || 80.0,
      jmax25: parseFloat(profileData.jmax25) || 155.0,
      rd25: parseFloat(profileData.rd25) || 1.1,
      ea_vcmax: 64000,
      ea_jmax: 47000,
      lightSaturationPoint: parseFloat(profileData.lightSaturationPoint) || 600,
      gs_max: parseFloat(profileData.gs_max) || 0.45,

      tempOpt: parseFloat(profileData.tempOpt) || 23.0,
      tempMin: parseFloat(profileData.tempMin) || 10.0,
      tempMax: parseFloat(profileData.tempMax) || 34.0,
      vpdOptMin: parseFloat(profileData.vpdOptMin) || 0.75,
      vpdOptMax: parseFloat(profileData.vpdOptMax) || 1.20,

      sla: parseFloat(profileData.sla) || 26.0,
      maxLai: parseFloat(profileData.maxLai) || 4.2,
      k_extinction: parseFloat(profileData.k_extinction) || 0.65,
      leafPartitionRatio: 0.65,
      stemPartitionRatio: 0.20,
      rootPartitionRatio: 0.15,

      baseLuteinConcentration: parseFloat(profileData.baseLuteinConcentration) || 3.5,
      spectrumSensitivity: { blue: 0.90, uvb: 1.80, farRed: 0.80 }
    };

    this.profiles[id] = newProfile;
    this.activeProfileId = id;
    this.saveProfiles();
    return newProfile;
  }

  deleteProfile(id) {
    if (this.defaultProfiles[id]) {
      alert("기본 표준 작물 프로필은 삭제할 수 없습니다.");
      return false;
    }
    delete this.profiles[id];
    this.saveProfiles();
    this.activeProfileId = Object.keys(this.profiles)[0] || "marigold_lutein";
    return true;
  }

  updateParameter(key, value) {
    const profile = this.getActiveProfile();
    if (profile && profile[key] !== undefined) {
      profile[key] = isNaN(value) ? value : parseFloat(value);
      this.saveProfiles();
      return true;
    }
    return false;
  }

  exportProfileJson() {
    return JSON.stringify(this.getActiveProfile(), null, 2);
  }
}
