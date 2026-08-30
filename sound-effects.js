/**
 * Web Audio API Futuristic Cyber-Biotech Sound Synthesizer
 * Generates instant, clean, zero-latency sci-fi clicks, hums, and activation tones without external audio assets.
 */

export class CyberAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
  }

  playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.04);
      
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {
      // Audio context policy fallback
    }
  }

  playPulse() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(880, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  playUvElicitationTone() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = "sawtooth";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(550, this.ctx.currentTime);
      osc2.frequency.setValueAtTime(825, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(this.ctx.currentTime + 0.15);
      osc2.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  }

  /**
   * Synthesizes ultrasonic micro-cavitation bubble burst pop
   */
  playCavitationPop(pitchHz = 1200) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(pitchHz, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(pitchHz * 0.35, this.ctx.currentTime + 0.025);

      gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.025);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.025);
    } catch (e) {}
  }

  /**
   * Synthesizes futuristic hyperspectral laser sweep tone
   */
  playHyperspectralScan() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1600, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {}
  }

  /**
   * Synthesizes HPLC high-pressure autosampler valve click & solvent pump tone
   */
  playHplcInjectionSound() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      // 1. Valve injection mechanical click
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = "square";
      osc1.frequency.setValueAtTime(1800, this.ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.03);
      gain1.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start();
      osc1.stop(this.ctx.currentTime + 0.03);

      // 2. High-pressure pump harmonic hum
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(220, this.ctx.currentTime + 0.03);
      osc2.frequency.linearRampToValueAtTime(440, this.ctx.currentTime + 0.18);
      gain2.gain.setValueAtTime(0.05, this.ctx.currentTime + 0.03);
      gain2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(this.ctx.currentTime + 0.03);
      osc2.stop(this.ctx.currentTime + 0.18);
    } catch (e) {}
  }

  /**
   * Synthesizes EIS AC frequency sweep chirp tone (200 Hz to 2400 Hz)
   */
  playEisFrequencySweepSound() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2400, this.ctx.currentTime + 0.22);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch (e) {}
  }

  /**
   * Synthesizes gentle rhythmic cellular mitosis division double-pulse
   */
  playMitosisPulseSound() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      [0.0, 0.09].forEach((offset, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(idx === 0 ? 520 : 780, this.ctx.currentTime + offset);
        osc.frequency.exponentialRampToValueAtTime(idx === 0 ? 300 : 420, this.ctx.currentTime + offset + 0.05);

        gain.gain.setValueAtTime(0.05, this.ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + offset + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + offset);
        osc.stop(this.ctx.currentTime + offset + 0.05);
      });
    } catch (e) {}
  }

  /**
   * Synthesizes resonant cytosolic calcium wave oscillation tone
   */
  playCalciumWaveSound() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.15);
      osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {}
  }

  /**
   * Synthesizes micro-stepping peristaltic nutrient dosing pump sound & fluid flow chime
   */
  playHydroponicPumpDosingSound() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      [0.0, 0.08, 0.16].forEach((offset, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(620 + idx * 180, this.ctx.currentTime + offset);
        osc.frequency.exponentialRampToValueAtTime(1200 + idx * 240, this.ctx.currentTime + offset + 0.06);

        gain.gain.setValueAtTime(0.04, this.ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + offset + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + offset);
        osc.stop(this.ctx.currentTime + offset + 0.06);
      });
    } catch (e) {}
  }

  /**
   * Synthesizes Plant2Human AI cloud sync data transfer chime
   */
  playCloudSyncSound() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      [0.0, 0.07, 0.14, 0.21].forEach((offset, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
        osc.frequency.setValueAtTime(freqs[idx], this.ctx.currentTime + offset);

        gain.gain.setValueAtTime(0.06, this.ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + offset + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + offset);
        osc.stop(this.ctx.currentTime + offset + 0.09);
      });
    } catch (e) {}
  }

  /**
   * Synthesizes rotary F0F1-ATP Synthase nanomotor turbine hum
   */
  playAtpSynthaseRpmSound() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(240, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(720, this.ctx.currentTime + 0.18);
      osc.frequency.exponentialRampToValueAtTime(360, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.07, this.ctx.currentTime + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {}
  }

  /**
   * Synthesizes DeepMind AlphaZero/MuZero-style RL policy convergence chime
   */
  playRlConvergenceChime() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const chords = [440, 554.37, 659.25, 880, 1108.73]; // A Major 9th cosmic arpeggio
      chords.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.06);

        gain.gain.setValueAtTime(0.05, this.ctx.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0005, this.ctx.currentTime + idx * 0.06 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + idx * 0.06);
        osc.stop(this.ctx.currentTime + idx * 0.06 + 0.4);
      });
    } catch (e) {}
  }

  /**
   * Synthesizes 3D Pareto multi-objective strategy switch tone
   */
  playParetoSwitchSound() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, this.ctx.currentTime + 0.08); // A5

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {}
  }

  /**
   * Synthesizes Industrial Modbus-TCP packet transmission ping
   */
  playModbusPacketSound() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1480, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(740, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  }

  /**
   * Synthesizes Official GMP Certificate stamping and print laser scan sound
   */
  playCoaPrintSound() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const freqs = [330, 440, 554.37, 659.25, 880];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.05);

        gain.gain.setValueAtTime(0.07, this.ctx.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.05 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + idx * 0.05);
        osc.stop(this.ctx.currentTime + idx * 0.05 + 0.25);
      });
    } catch (e) {}
  }
}




