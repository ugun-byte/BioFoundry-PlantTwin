/**
 * 24-Hour Smart Farm Diurnal Timetable Scheduler & Industrial PLC Automation Generator
 * 
 * Features:
 * 1. 4-Phase Diurnal Profile (Sunrise Ramp -> Peak Solar -> Sunset Elicitation -> Night Cold DIF)
 * 2. Real-time Setpoint Interpolator (PPFD, Spectrum, Day/Night DIF, CO2, Humidity, Mist)
 * 3. 24-Step Industrial Automation Timetable Generator (BACnet, MQTT, Modbus RTU)
 */

export class DiurnalScheduler {
  constructor() {
    this.enabled = true;

    // 4 Distinct Photobiological Phases
    this.schedule = {
      sunrise: {
        startHour: 6.0,
        endHour: 8.0,
        name: "일출 램프업 (Sunrise Ramp)",
        ppfdStart: 100,
        ppfdEnd: 420,
        tempStart: 18.0,
        tempEnd: 24.0,
        co2: 800,
        humidity: 70,
        spectrum: { red: 50, blue: 35, green: 10, farRed: 5 },
        uvb: false,
        misting: true
      },
      day_peak: {
        startHour: 8.0,
        endHour: 16.0,
        name: "피크 광합성 (Peak Photosynthesis)",
        ppfd: 480,
        temp: 24.5,
        co2: 950,
        humidity: 62,
        spectrum: { red: 55, blue: 30, green: 10, farRed: 5 },
        uvb: true, // UV-B Elicitation for secondary metabolite boost
        misting: false
      },
      sunset: {
        startHour: 16.0,
        endHour: 22.0,
        name: "일몰 & 원적색광 유도 (Sunset & Far-Red)",
        ppfdStart: 420,
        ppfdEnd: 120,
        tempStart: 24.0,
        tempEnd: 19.0,
        co2: 750,
        humidity: 68,
        spectrum: { red: 45, blue: 25, green: 10, farRed: 20 }, // High Far-Red for End-of-Day response
        uvb: false,
        misting: false
      },
      night_dif: {
        startHour: 22.0,
        endHour: 6.0, // overnight
        name: "야간 암호흡 & 변온 DIF (Night Cold Shock)",
        ppfd: 0,
        temp: 16.5, // Cold shock DIF for metabolite condensation
        co2: 500,
        humidity: 75,
        spectrum: { red: 0, blue: 0, green: 0, farRed: 0 },
        uvb: false,
        misting: false
      }
    };
  }

  /**
   * Get dynamic setpoints interpolated at a given hour (0.00 ~ 23.99)
   */
  getScheduledSetpoints(hour) {
    if (!this.enabled) return null;

    const s = this.schedule;

    // 1. Sunrise
    if (hour >= s.sunrise.startHour && hour < s.sunrise.endHour) {
      const progress = (hour - s.sunrise.startHour) / (s.sunrise.endHour - s.sunrise.startHour);
      return {
        phase: "sunrise",
        phaseName: s.sunrise.name,
        ppfd: Math.round(s.sunrise.ppfdStart + (s.sunrise.ppfdEnd - s.sunrise.ppfdStart) * progress),
        temp: +(s.sunrise.tempStart + (s.sunrise.tempEnd - s.sunrise.tempStart) * progress).toFixed(1),
        co2: s.sunrise.co2,
        humidity: s.sunrise.humidity,
        spectrum: { ...s.sunrise.spectrum },
        uvb: s.sunrise.uvb,
        misting: s.sunrise.misting
      };
    }

    // 2. Day Peak
    if (hour >= s.day_peak.startHour && hour < s.day_peak.endHour) {
      return {
        phase: "day_peak",
        phaseName: s.day_peak.name,
        ppfd: s.day_peak.ppfd,
        temp: s.day_peak.temp,
        co2: s.day_peak.co2,
        humidity: s.day_peak.humidity,
        spectrum: { ...s.day_peak.spectrum },
        uvb: s.day_peak.uvb,
        misting: s.day_peak.misting
      };
    }

    // 3. Sunset
    if (hour >= s.sunset.startHour && hour < s.sunset.endHour) {
      const progress = (hour - s.sunset.startHour) / (s.sunset.endHour - s.sunset.startHour);
      return {
        phase: "sunset",
        phaseName: s.sunset.name,
        ppfd: Math.round(s.sunset.ppfdStart + (s.sunset.ppfdEnd - s.sunset.ppfdStart) * progress),
        temp: +(s.sunset.tempStart + (s.sunset.tempEnd - s.sunset.tempStart) * progress).toFixed(1),
        co2: s.sunset.co2,
        humidity: s.sunset.humidity,
        spectrum: { ...s.sunset.spectrum },
        uvb: s.sunset.uvb,
        misting: s.sunset.misting
      };
    }

    // 4. Night DIF
    return {
      phase: "night_dif",
      phaseName: s.night_dif.name,
      ppfd: s.night_dif.ppfd,
      temp: s.night_dif.temp,
      co2: s.night_dif.co2,
      humidity: s.night_dif.humidity,
      spectrum: { ...s.night_dif.spectrum },
      uvb: s.night_dif.uvb,
      misting: s.night_dif.misting
    };
  }

  /**
   * Export 24-step hour-by-hour PLC automation profile
   */
  generate24HourPlcTimetable(cropProfile) {
    const steps = [];
    for (let h = 0; h < 24; h++) {
      const sp = this.getScheduledSetpoints(h + 0.5);
      steps.push({
        hour: `${String(h).padStart(2, '0')}:00`,
        phase: sp.phaseName,
        target_ppfd_umol: sp.ppfd,
        target_temp_celsius: sp.temp,
        target_co2_ppm: sp.co2,
        target_rh_pct: sp.humidity,
        spectrum_rgb_fr: `R${sp.spectrum.red}:B${sp.spectrum.blue}:G${sp.spectrum.green}:FR${sp.spectrum.farRed}`,
        uvb_relay_active: sp.uvb,
        misting_relay_active: sp.misting
      });
    }

    return {
      metadata: {
        deviceType: "SmartFarm_PLC_BACnet_IP",
        crop: cropProfile ? cropProfile.name : "Custom Plant",
        targetMolecule: cropProfile ? cropProfile.targetMolecule : "Phytochemical",
        protocol: "MQTT / Modbus-TCP / BACnet",
        generatedAt: new Date().toISOString(),
        version: "v4.2-Diurnal-Auto"
      },
      diurnalTimetable: steps
    };
  }
}
