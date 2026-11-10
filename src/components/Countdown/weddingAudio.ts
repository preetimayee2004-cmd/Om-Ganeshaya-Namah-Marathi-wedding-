/**
 * Authentic synthesized Indian wedding audio engine using Web Audio API.
 * 100% self-contained: no external audio files required, zero CORS/network issues,
 * works with instant low-latency on mobile and desktop upon user interaction.
 */

class WeddingAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private lastScratchTime: number = 0;

  constructor() {
    // Lazy initialization on first user interaction
  }

  private initCtx(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.ctx) {
      this.ctx.suspend().catch(() => {});
    } else if (!muted && this.ctx) {
      this.ctx.resume().catch(() => {});
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Traditional brass temple bell (घंटा).
   * Generates deep brass fundamental (~720Hz) with inharmonic metallic overtones
   * and long exponential resonance.
   */
  public playTempleBell() {
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.35, now);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
    masterGain.connect(ctx.destination);

    // Temple bell overtone frequencies (inharmonic metallic ratio)
    const bellPartials = [
      { freq: 740, gain: 0.6, decay: 2.6 },
      { freq: 960, gain: 0.35, decay: 2.2 },
      { freq: 1540, gain: 0.25, decay: 1.8 },
      { freq: 2420, gain: 0.2, decay: 1.4 },
      { freq: 3680, gain: 0.15, decay: 0.9 },
    ];

    bellPartials.forEach(({ freq, gain, decay }) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      oscGain.gain.setValueAtTime(gain, now);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(oscGain);
      oscGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + decay);
    });
  }

  /**
   * Tactile scratch sound (subtle filtered noise burst).
   * Throttled to avoid overwhelming the ear.
   */
  public playScratchSound() {
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    if (now - this.lastScratchTime < 0.08) return;
    this.lastScratchTime = now;

    const duration = 0.06;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1400 + Math.random() * 600, now);
    filter.Q.setValueAtTime(3.0, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
  }

  /**
   * Magical mandala shimmer (arpeggiated crystalline chimes).
   */
  public playMandalaShimmer() {
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [880, 1108, 1320, 1661, 2217]; // Pentatonic shimmer

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = now + idx * 0.08;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.12, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.9);
    });
  }

  /**
   * Celebratory Shehnai wedding flourish (मंगल वाद्य शहनाई).
   * Synthesizes the characteristic double-reed nasal timbre, glissando,
   * and joyful Indian wedding celebration phrase (Raga Yaman / Bilawal notes).
   */
  public playShehnaiFlourish() {
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Classic auspicious Shehnai phrase notes & durations
    // Sa - Re - Ga - Ma - Pa - Dha - Ni - Taar Sa flourish
    const phrase = [
      { freq: 440, dur: 0.18, slideTo: 493.88 }, // A4 -> B4
      { freq: 493.88, dur: 0.16, slideTo: 554.37 }, // B4 -> C#5
      { freq: 554.37, dur: 0.22, slideTo: 659.25 }, // C#5 -> E5
      { freq: 659.25, dur: 0.26, slideTo: 739.99 }, // E5 -> F#5
      { freq: 739.99, dur: 0.32, slideTo: 880.00 }, // F#5 -> A5 (crescendo)
      { freq: 880.00, dur: 0.55, slideTo: 880.00 }, // A5 grand held note
      { freq: 739.99, dur: 0.15, slideTo: 659.25 },
      { freq: 880.00, dur: 0.70, slideTo: 880.00 }, // final bright celebration ring
    ];

    let t = now + 0.05;

    phrase.forEach((note) => {
      // Shehnai dual reed oscillators (sawtooth + triangle for rich nasal harmonics)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();

      osc1.type = "sawtooth";
      osc2.type = "triangle";

      // Vibrato LFO at 5.5 Hz for authentic human reed expression
      vibrato.frequency.setValueAtTime(5.5, t);
      vibratoGain.gain.setValueAtTime(8, t); // ~8 Hz vibrato depth
      vibrato.connect(osc1.frequency);
      vibrato.connect(osc2.frequency);

      // Pitch and glissando portamento
      osc1.frequency.setValueAtTime(note.freq, t);
      osc1.frequency.exponentialRampToValueAtTime(note.slideTo, t + note.dur * 0.7);

      osc2.frequency.setValueAtTime(note.freq * 1.002, t); // slight chorus detune
      osc2.frequency.exponentialRampToValueAtTime(note.slideTo * 1.002, t + note.dur * 0.7);

      // Resonant bandpass filter to shape Shehnai reed horn resonance
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1600, t);
      filter.Q.setValueAtTime(2.8, t);

      // Articulation envelope
      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0, t);
      noteGain.gain.linearRampToValueAtTime(0.18, t + 0.03);
      noteGain.gain.setValueAtTime(0.18, t + note.dur - 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, t + note.dur);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(ctx.destination);

      vibrato.start(t);
      osc1.start(t);
      osc2.start(t);

      const stopTime = t + note.dur;
      vibrato.stop(stopTime);
      osc1.stop(stopTime);
      osc2.stop(stopTime);

      t += note.dur;
    });
  }
}

export const weddingAudio = new WeddingAudioEngine();

