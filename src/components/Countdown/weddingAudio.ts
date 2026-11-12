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

  // ---------- background drone (used when no /audio/bgm.mp3 is supplied) ----------
  private droneTimer: number | null = null;
  private droneOut: GainNode | null = null;

  /** one soft tanpura-like pluck: saw + octave sine through a warm low-pass, long natural decay */
  private pluck(ctx: AudioContext, out: AudioNode, freq: number, at: number) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(1, at + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 2.6);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(1400, at);
    lp.frequency.exponentialRampToValueAtTime(500, at + 2.4);
    lp.Q.value = 0.7;
    const a = ctx.createOscillator();
    a.type = "sawtooth";
    a.frequency.setValueAtTime(freq, at);
    const b = ctx.createOscillator();
    b.type = "sine";
    b.frequency.setValueAtTime(freq * 2.003, at);
    const bg = ctx.createGain();
    bg.gain.value = 0.35;
    a.connect(lp);
    b.connect(bg).connect(lp);
    lp.connect(g).connect(out);
    a.start(at);
    b.start(at);
    a.stop(at + 2.7);
    b.stop(at + 2.7);
  }

  /** Pa - Sa' - Sa' - Sa, looping every 2.8 s at a low volume, like a tanpura behind a recital */
  public startDrone() {
    const ctx = this.initCtx();
    if (!ctx || this.droneTimer !== null) return;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, ctx.currentTime);
    out.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 1.5);
    out.connect(ctx.destination);
    this.droneOut = out;
    const notes = [196.0, 261.63, 261.63, 130.81]; // G3 (Pa), C4 (Sa'), C4, C3 (Sa)
    const cycle = () => {
      const t = ctx.currentTime + 0.05;
      notes.forEach((f, i) => this.pluck(ctx, out, f, t + i * 0.7));
    };
    cycle();
    this.droneTimer = window.setInterval(cycle, 2800);
  }

  public stopDrone() {
    if (this.droneTimer !== null) window.clearInterval(this.droneTimer);
    this.droneTimer = null;
    const out = this.droneOut;
    this.droneOut = null;
    if (out && this.ctx) {
      const now = this.ctx.currentTime;
      out.gain.cancelScheduledValues(now);
      out.gain.setValueAtTime(out.gain.value, now);
      out.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      window.setTimeout(() => out.disconnect(), 600);
    }
  }

  /**
   * Traditional brass temple bell (घंटा).
   * Soft, authentic temple bell with a natural resonant decay.
   * Master gain lowered to 0.18 for a gentle, warm tone (no loud or jarring sound).
   */
  public playTempleBell() {
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.18, now);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
    masterGain.connect(ctx.destination);

    // Temple bell overtone frequencies (inharmonic metallic ratio)
    const bellPartials = [
      { freq: 740, gain: 0.5, decay: 2.2 },
      { freq: 960, gain: 0.28, decay: 1.8 },
      { freq: 1540, gain: 0.18, decay: 1.4 },
      { freq: 2420, gain: 0.12, decay: 1.0 },
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
   * Tactile scratch sound (subtle filtered low-volume whisper).
   * Throttled to avoid lag or ear fatigue.
   */
  public playScratchSound() {
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    if (now - this.lastScratchTime < 0.1) return;
    this.lastScratchTime = now;

    const duration = 0.05;
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
    filter.frequency.setValueAtTime(1200 + Math.random() * 400, now);
    filter.Q.setValueAtTime(2.5, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.016, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
  }

  /**
   * Short, soft, melodious Shehnai wedding flourish (मंगल वाद्य शहनाई).
   * Warm, emotional, traditional, gentle volume (no loud blast, no overlapping).
   */
  public playShehnaiFlourish() {
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Gentle 5-note auspicious traditional wedding flourish (Raga Yaman)
    const phrase = [
      { freq: 440.00, dur: 0.22, slideTo: 493.88 }, // A4 -> B4
      { freq: 493.88, dur: 0.24, slideTo: 554.37 }, // B4 -> C#5
      { freq: 554.37, dur: 0.32, slideTo: 659.25 }, // C#5 -> E5
      { freq: 659.25, dur: 0.38, slideTo: 739.99 }, // E5 -> F#5
      { freq: 739.99, dur: 0.65, slideTo: 739.99 }, // F#5 held serene finish
    ];

    let t = now + 0.05;

    phrase.forEach((note) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();

      osc1.type = "sawtooth";
      osc2.type = "triangle";

      // Gentle subtle vibrato (5 Hz, soft depth)
      vibrato.frequency.setValueAtTime(5.0, t);
      vibratoGain.gain.setValueAtTime(5, t);
      vibrato.connect(osc1.frequency);
      vibrato.connect(osc2.frequency);

      // Pitch portamento
      osc1.frequency.setValueAtTime(note.freq, t);
      osc1.frequency.exponentialRampToValueAtTime(note.slideTo, t + note.dur * 0.7);

      osc2.frequency.setValueAtTime(note.freq * 1.001, t);
      osc2.frequency.exponentialRampToValueAtTime(note.slideTo * 1.001, t + note.dur * 0.7);

      // Warm acoustic bandpass filter
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1450, t);
      filter.Q.setValueAtTime(2.2, t);

      // Soft volume envelope
      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0, t);
      noteGain.gain.linearRampToValueAtTime(0.09, t + 0.04);
      noteGain.gain.setValueAtTime(0.09, t + note.dur - 0.06);
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

  /**
   * Soft "whoosh" for the smoke page transition: filtered white noise, bandpass sweeping
   * 400 Hz -> 2500 Hz -> 400 Hz over ~1.4 s, low volume. Call it inside the click handler
   * (that is what lets the browser create/resume the AudioContext). Does nothing when muted.
   */
  public playWhoosh(duration = 1.4) {
    const ctx = this.initCtx(); // returns null when muted
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(400, t0);
    bp.frequency.exponentialRampToValueAtTime(2500, t0 + duration * 0.5);
    bp.frequency.exponentialRampToValueAtTime(400, t0 + duration);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.16, t0 + duration * 0.4); // low volume
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    src.connect(bp).connect(g).connect(ctx.destination);
    src.start(t0);
    src.stop(t0 + duration);
  }
}

export const weddingAudio = new WeddingAudioEngine();

