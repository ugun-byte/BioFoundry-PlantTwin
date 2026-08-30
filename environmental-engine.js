/**
 * Virtual Smart Grow Chamber & Dynamic Telemetry Sensor Subsystem
 * 
 * Features:
 * 1. Continuous high-resolution Clock with Time Warp (1x ~ 3600x)
 * 2. Diurnal Sinusoidal Cycles (Day/Night thermal dynamics, lighting photoperiod, relative humidity shifts)
 * 3. 8-Channel Virtual IoT Sensor telemetry with realistic thermal inertia & signal noise
 * 4. Dynamic Environmental Disturbances & Closed-loop PID Actuator Responses
 */

export class EnvironmentalEngine {
  constructor() {
    // Current Simulation Time
    this.simulatedTotalSeconds = 0; // Total seconds from start of growth
    this.simulatedDay = 1;
    this.simulatedHour = 8.0; // Starts at 08:00 AM (Daylight ON)
    this.timeWarp = 60.0; // 1 second real-time = 60 seconds simulated
    
    // Actuator Setpoints (Controlled by User / AI Controller)
    this.setpoints = {
      ppfdTarget: 380,
      photoperiodHours: 16,
      spectrum: { red: 55, blue: 30, green: 10, farRed: 5 },
      dayTempTarget: 24.0,
      nightTempTarget: 17.5,
      humidityTarget: 65.0,
      co2Target: 850,
      ecTarget: 2.1,
      phTarget: 6.2,
      uvbActive: true,
      coldShiftActive: true
    };

    // Actual Chamber Physics States (Dynamic variables with inertia)
    this.currentPhysics = {
      ppfdActual: 380,
      spectrumActual: { red: 55, blue: 30, green: 10, farRed: 5 },
      airTempActual: 24.0,
      humidityActual: 65.0,
      co2Actual: 850,
      ecActual: 2.1,
      phActual: 6.2,
      isLightOn: true,
      vpdActual: 0.95,
      leafTempActual: 23.4
    };

    // Environmental Disturbances / Noise state
    this.disturbanceActive = false;
    this.disturbanceType = null;
    this.noiseTimer = 0;

    // Smart Hydroponic pH Neutralization PID Controller & Ion Balance State
    this.ionBalance = {
      no3Ratio: 0.85, // 85% Nitrate
      nh4Ratio: 0.15  // 15% Ammonium
    };

    this.phPid = {
      kp: 1.6,
      ki: 0.08,
      kd: 0.35,
      integral: 0,
      prevError: 0,
      acidPumpActive: false,
      basePumpActive: false,
      dosingRateMlMin: 0,
      minRunTimer: 0
    };
  }

  setIonBalance(no3Ratio, nh4Ratio) {
    this.ionBalance.no3Ratio = Math.max(0.05, Math.min(0.95, no3Ratio));
    this.ionBalance.nh4Ratio = Math.max(0.05, Math.min(0.95, nh4Ratio));
  }

  updateSetpoints(newSetpoints) {
    this.setpoints = { ...this.setpoints, ...newSetpoints };
  }

  setTimeWarp(speed) {
    this.timeWarp = Math.max(1, Math.min(7200, speed));
  }

  /**
   * Advance continuous physical simulation clock by dtRealSeconds
   */
  tick(dtRealSeconds) {
    const dtSimSeconds = dtRealSeconds * this.timeWarp;
    this.simulatedTotalSeconds += dtSimSeconds;

    // Calculate current simulated day and 24h clock
    const totalHours = this.simulatedTotalSeconds / 3600.0;
    this.simulatedDay = Math.floor(totalHours / 24.0) + 1;
    this.simulatedHour = (totalHours % 24.0);

    // 1. Photoperiod Lighting State (e.g. 16h photoperiod: 06:00 to 22:00)
    const lightStartHour = 6.0;
    const lightEndHour = lightStartHour + this.setpoints.photoperiodHours;
    
    let isDaylightPeriod = false;
    if (lightEndHour <= 24.0) {
      isDaylightPeriod = (this.simulatedHour >= lightStartHour && this.simulatedHour < lightEndHour);
    } else {
      isDaylightPeriod = (this.simulatedHour >= lightStartHour || this.simulatedHour < (lightEndHour - 24.0));
    }

    this.currentPhysics.isLightOn = isDaylightPeriod;

    // 2. Light Target & Transition (Soft LED ramping over 15 simulated minutes)
    const targetPpfd = isDaylightPeriod ? this.setpoints.ppfdTarget : 0;
    this.currentPhysics.ppfdActual += (targetPpfd - this.currentPhysics.ppfdActual) * Math.min(1.0, dtSimSeconds / 300.0);

    // Spectrum Tracking
    this.currentPhysics.spectrumActual = { ...this.setpoints.spectrum };

    // 3. Thermal Diurnal Cycle (Diurnal sinusoidal curve + HVAC thermal inertia)
    const targetTemp = isDaylightPeriod ? this.setpoints.dayTempTarget : this.setpoints.nightTempTarget;
    
    // Add small continuous natural diurnal curve (+- 0.8°C peak at 14:00)
    const solarAngle = ((this.simulatedHour - 14.0) / 24.0) * Math.PI * 2;
    const naturalFluctuation = Math.cos(solarAngle) * 0.65;
    
    const finalTempSetpoint = targetTemp + (isDaylightPeriod ? naturalFluctuation : -naturalFluctuation * 0.5);
    this.currentPhysics.airTempActual += (finalTempSetpoint - this.currentPhysics.airTempActual) * Math.min(1.0, dtSimSeconds / 600.0);

    // 4. Relative Humidity & CO2 Dynamics (Plants transpire water & consume CO2 during day)
    const targetHumidity = isDaylightPeriod ? this.setpoints.humidityTarget : (this.setpoints.humidityTarget + 8.0);
    this.currentPhysics.humidityActual += (targetHumidity - this.currentPhysics.humidityActual) * Math.min(1.0, dtSimSeconds / 450.0);

    const targetCo2 = isDaylightPeriod ? this.setpoints.co2Target : 450; // Night respiration venting
    this.currentPhysics.co2Actual += (targetCo2 - this.currentPhysics.co2Actual) * Math.min(1.0, dtSimSeconds / 350.0);

    // 5. Fertigation EC & Dynamic Chemical pH with Anti-Chattering PID Neutralization
    this.currentPhysics.ecActual += (this.setpoints.ecTarget - this.currentPhysics.ecActual) * Math.min(1.0, dtSimSeconds / 1200.0);

    // Biological chemical pH drift based on Nitrate vs Ammonium ratio
    const bioPhDriftRate = (this.ionBalance.no3Ratio * 0.003 - this.ionBalance.nh4Ratio * 0.004) * (dtSimSeconds / 60.0);
    this.currentPhysics.phActual += bioPhDriftRate;

    // Closed-Loop PID Controller calculation for Acid/Base Auto-Dosing with Deadband & Hysteresis
    const phError = this.currentPhysics.phActual - this.setpoints.phTarget;
    this.phPid.integral = Math.max(-3.0, Math.min(3.0, this.phPid.integral + phError * dtRealSeconds));
    const phDerivative = (phError - this.phPid.prevError) / Math.max(0.01, dtRealSeconds);
    this.phPid.prevError = phError;

    const pidControlOut = this.phPid.kp * phError + this.phPid.ki * this.phPid.integral + this.phPid.kd * phDerivative;

    // Minimum run timer countdown
    if (this.phPid.minRunTimer > 0) {
      this.phPid.minRunTimer -= dtRealSeconds;
    }

    // Schmitt Trigger Hysteresis (Turn on at |error| > 0.08, turn off at |error| < 0.02 after minRunTimer expires)
    if (!this.phPid.acidPumpActive && !this.phPid.basePumpActive) {
      if (phError > 0.08) {
        this.phPid.acidPumpActive = true;
        this.phPid.basePumpActive = false;
        this.phPid.minRunTimer = 2.5; // Run for at least 2.5s to prevent chattering
      } else if (phError < -0.08) {
        this.phPid.acidPumpActive = false;
        this.phPid.basePumpActive = true;
        this.phPid.minRunTimer = 2.5;
      }
    } else if (this.phPid.acidPumpActive) {
      if (phError <= 0.02 && this.phPid.minRunTimer <= 0) {
        this.phPid.acidPumpActive = false;
        this.phPid.dosingRateMlMin = 0;
      }
    } else if (this.phPid.basePumpActive) {
      if (phError >= -0.02 && this.phPid.minRunTimer <= 0) {
        this.phPid.basePumpActive = false;
        this.phPid.dosingRateMlMin = 0;
      }
    }

    // Apply dosing neutral correction smoothly
    if (this.phPid.acidPumpActive) {
      this.phPid.dosingRateMlMin = parseFloat(Math.min(10.0, Math.max(1.0, Math.abs(pidControlOut) * 2.8)).toFixed(1));
      const neutralCorrection = (this.phPid.dosingRateMlMin / 60.0) * 0.012 * dtSimSeconds;
      this.currentPhysics.phActual -= neutralCorrection;
    } else if (this.phPid.basePumpActive) {
      this.phPid.dosingRateMlMin = parseFloat(Math.min(10.0, Math.max(1.0, Math.abs(pidControlOut) * 2.8)).toFixed(1));
      const neutralCorrection = (this.phPid.dosingRateMlMin / 60.0) * 0.012 * dtSimSeconds;
      this.currentPhysics.phActual += neutralCorrection;
    }

    // 6. Calculate VPD based on actual physical values
    const esat = 0.61078 * Math.exp((17.27 * this.currentPhysics.airTempActual) / (this.currentPhysics.airTempActual + 237.3));
    const eair = esat * (this.currentPhysics.humidityActual / 100.0);
    this.currentPhysics.vpdActual = Math.max(0.05, esat - eair);

    this.noiseTimer += dtRealSeconds;
  }

  /**
   * Sample 8-Channel Virtual IoT Sensor Telemetry with realistic physical sensor noise
   */
  getLiveSensorTelemetry(bioModelResult) {
    const p = this.currentPhysics;
    const noise = (scale) => (Math.sin(this.noiseTimer * 3.7 + scale * 10) * 0.5 + (Math.random() - 0.5) * 0.5) * scale;

    const sensorPpfd = Math.max(0, Math.round(p.ppfdActual + noise(2.5)));
    const sensorAirTemp = parseFloat((p.airTempActual + noise(0.08)).toFixed(2));
    const sensorLeafTemp = bioModelResult && bioModelResult.stomata ? bioModelResult.stomata.leafTemp : sensorAirTemp;
    const sensorHumidity = Math.max(10, Math.min(99, parseFloat((p.humidityActual + noise(0.4)).toFixed(1))));
    const sensorVpd = parseFloat((p.vpdActual + noise(0.015)).toFixed(3));
    const sensorCo2 = Math.max(300, Math.round(p.co2Actual + noise(6.0)));
    const sensorEc = parseFloat((p.ecActual + noise(0.01)).toFixed(2));
    const sensorPh = parseFloat((p.phActual + noise(0.01)).toFixed(2));

    const hours = Math.floor(this.simulatedHour);
    const minutes = Math.floor((this.simulatedHour % 1) * 60);
    const timeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    return {
      simulatedDay: this.simulatedDay,
      simulatedHour: parseFloat(this.simulatedHour.toFixed(2)),
      timeFormatted,
      isLightOn: p.isLightOn,
      sensors: {
        ppfd: sensorPpfd,
        spectrum: { ...p.spectrumActual },
        airTemp: sensorAirTemp,
        leafTemp: sensorLeafTemp,
        tempDifferential: parseFloat((sensorLeafTemp - sensorAirTemp).toFixed(2)),
        humidity: sensorHumidity,
        vpd: sensorVpd,
        co2: sensorCo2,
        ec: sensorEc,
        ph: sensorPh,
        fvFm: bioModelResult ? bioModelResult.fvFm : 0.82
      },
      phPid: { ...this.phPid },
      ionBalance: { ...this.ionBalance }
    };
  }
}
