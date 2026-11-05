// All sound is synthesized with WebAudio — no external assets.
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.noiseBuffer = null;
    this.ambient = null;
    this.started = false;
  }

  start() {
    if (this.started) {
      this.ctx?.resume?.();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
      this.noiseBuffer = this.makeNoise(2.2);
      this.startAmbience();
      this.started = true;
    } catch {
      this.ctx = null;
    }
  }

  makeNoise(seconds) {
    const rate = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, Math.floor(rate * seconds), rate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    return buffer;
  }

  startAmbience() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    filter.Q.value = 0.7;
    const gain = ctx.createGain();
    gain.gain.value = 0.032;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.055;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.016;
    lfo.connect(lfoGain).connect(gain.gain);
    src.connect(filter).connect(gain).connect(this.master);
    src.start();
    lfo.start();
    this.ambient = { src, gain };
  }

  setMuted(muted) {
    this.muted = muted;
    if (!this.master || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(muted ? 0 : 0.5, t, 0.04);
  }

  tone(freq, dur, type = 'sine', vol = 0.15, glide = 0, delay = 0) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), t0);
    if (glide) osc.frequency.exponentialRampToValueAtTime(Math.max(18, freq * glide), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.02, dur * 0.3));
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  noise(dur, filterType = 'lowpass', freq = 800, vol = 0.15, freqEnd = 0, delay = 0) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(freq, t0);
    if (freqEnd) filter.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), t0 + dur);
    filter.Q.value = filterType === 'bandpass' ? 1.1 : 0.6;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t0, Math.random() * 1.2);
    src.stop(t0 + dur + 0.02);
  }

  play(name) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case 'throw':
        this.noise(0.18, 'bandpass', 900, 0.075, 300);
        this.tone(180, 0.12, 'sine', 0.06, 0.6);
        break;
      case 'impact':
        this.noise(0.22, 'lowpass', 1100, 0.13, 150);
        this.tone(95, 0.2, 'sine', 0.12, 0.55);
        break;
      case 'burst':
        this.noise(0.5, 'lowpass', 1600, 0.2, 90);
        this.tone(70, 0.5, 'triangle', 0.18, 0.4);
        break;
      case 'hit':
        this.noise(0.09, 'bandpass', 1900, 0.06, 700);
        this.tone(320, 0.07, 'square', 0.035, 0.6);
        break;
      case 'hurt':
        this.noise(0.22, 'lowpass', 700, 0.12, 120);
        this.tone(230, 0.25, 'sawtooth', 0.07, 0.4);
        break;
      case 'enemyDie':
        this.noise(0.28, 'lowpass', 900, 0.1, 100);
        this.tone(170, 0.3, 'triangle', 0.08, 0.35);
        break;
      case 'pickup':
        this.tone(740, 0.1, 'sine', 0.06, 1.6);
        this.tone(1180, 0.14, 'sine', 0.035, 1.2, 0.05);
        break;
      case 'quest':
        this.tone(392, 0.35, 'sine', 0.07);
        this.tone(523, 0.4, 'sine', 0.06, 1, 0.1);
        this.tone(659, 0.55, 'sine', 0.05, 1, 0.2);
        break;
      case 'heal':
        this.tone(523, 0.3, 'sine', 0.06, 1.5);
        this.tone(784, 0.45, 'sine', 0.045, 1.2, 0.08);
        break;
      case 'boss':
        this.noise(0.9, 'lowpass', 300, 0.16, 60);
        this.tone(58, 0.9, 'sawtooth', 0.08, 0.6);
        break;
      case 'victory':
        [392, 494, 587, 784].forEach((f, i) => this.tone(f, 1.2, 'sine', 0.07, 1, i * 0.16));
        break;
      case 'invalid':
        this.tone(140, 0.1, 'square', 0.03, 0.9);
        break;
      case 'step':
        this.noise(0.05, 'lowpass', 420, 0.018);
        break;
      default:
        break;
    }
  }
}
