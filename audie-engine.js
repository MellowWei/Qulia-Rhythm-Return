// audio-engine.js — 427Hz Procedural Ambient Drone
// 振动本体论的声学具身 · 逻辑采样频率自己发声
//
// Repo: github.com/MellowWei/Qulia-Rhythm-Return
// Path: audio-engine.js (drop into root, import from main.js)
//
// Usage:
//   import { AudioEngine } from './audio-engine.js';
//   const audio = new AudioEngine();
//   // Must be triggered by user gesture (browser autoplay policy):
//   document.getElementById('audio-toggle').addEventListener('click', () => audio.toggle());

export class AudioEngine {
  constructor(opts = {}) {
    this.baseFreq = opts.baseFreq || 427;        // 427Hz logical sampling anchor
    this.fadeMs = opts.fadeMs || 2400;            // smooth fade in/out
    this.targetGain = opts.targetGain ?? 0.18;    // ambient level — never dominate reading
    this.ctx = null;
    this.master = null;
    this.nodes = [];
    this.lfos = [];
    this.running = false;
    this.muted = false;
  }

  async _ensureCtx() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) throw new Error('Web Audio API not supported');
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);
  }

  async start() {
    await this._ensureCtx();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    if (this.running) return;
    this.running = true;
    this.muted = false;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    // ── Layer 1: fundamental drone at 427Hz with 3-oscillator detune chorus ──
    const fundamentalGroup = this._makeDroneGroup(this.baseFreq, [-7, 0, +7], 0.45);

    // ── Layer 2: octave above (854Hz) — gentle shimmer ──
    const octaveGroup = this._makeDroneGroup(this.baseFreq * 2, [-4, +4], 0.18);

    // ── Layer 3: perfect fifth below (≈285.5Hz, 427/1.4954) — root anchor ──
    // Using just intonation 3:2 ratio inverted: 427 * 2/3
    const subFifthGroup = this._makeDroneGroup(this.baseFreq * (2 / 3), [0], 0.32);

    // ── Layer 4: brown noise wash for warmth ──
    const noise = this._makeBrownNoise(0.04);

    // ── Slow LFO modulation on master gain (breathing, ~0.07 Hz, 14s period) ──
    const breathLFO = ctx.createOscillator();
    breathLFO.frequency.value = 0.07;
    const breathDepth = ctx.createGain();
    breathDepth.gain.value = 0.04;
    breathLFO.connect(breathDepth);
    breathDepth.connect(this.master.gain);
    breathLFO.start();
    this.lfos.push(breathLFO);

    // Fade master gain in
    this.master.gain.setValueAtTime(0, now);
    this.master.gain.linearRampToValueAtTime(this.targetGain, now + this.fadeMs / 1000);

    this.nodes.push(...fundamentalGroup, ...octaveGroup, ...subFifthGroup, noise);
  }

  _makeDroneGroup(freq, detuneCents, gainLevel) {
    const ctx = this.ctx;
    const groupGain = ctx.createGain();
    groupGain.gain.value = gainLevel;

    // Lowpass filter for warmth (cutoff modulated by LFO)
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = Math.min(freq * 6, 3200);
    filter.Q.value = 0.7;

    // Filter LFO (slow sweep)
    const filterLFO = ctx.createOscillator();
    filterLFO.frequency.value = 0.05 + Math.random() * 0.04;
    const filterDepth = ctx.createGain();
    filterDepth.gain.value = freq * 0.6;
    filterLFO.connect(filterDepth);
    filterDepth.connect(filter.frequency);
    filterLFO.start();
    this.lfos.push(filterLFO);

    const oscs = [];
    for (const cents of detuneCents) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = cents;

      // Subtle pitch wobble (vibrato) per oscillator
      const vibLFO = ctx.createOscillator();
      vibLFO.frequency.value = 0.18 + Math.random() * 0.12;
      const vibDepth = ctx.createGain();
      vibDepth.gain.value = 0.6 + Math.random() * 0.4;
      vibLFO.connect(vibDepth);
      vibDepth.connect(osc.detune);
      vibLFO.start();
      this.lfos.push(vibLFO);

      osc.connect(filter);
      osc.start();
      oscs.push(osc);
    }

    filter.connect(groupGain);
    groupGain.connect(this.master);
    return [...oscs, filter, groupGain];
  }

  _makeBrownNoise(level) {
    const ctx = this.ctx;
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.4;

    const gain = ctx.createGain();
    gain.gain.value = level;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start();

    return src; // tracking the source is enough for cleanup
  }

  async stop() {
    if (!this.ctx || !this.running) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0, now + this.fadeMs / 1000);

    // Schedule actual node teardown after fade
    setTimeout(() => {
      try {
        this.nodes.forEach(n => { try { n.stop && n.stop(); n.disconnect && n.disconnect(); } catch {} });
        this.lfos.forEach(l => { try { l.stop(); l.disconnect(); } catch {} });
      } catch {}
      this.nodes = [];
      this.lfos = [];
      this.running = false;
    }, this.fadeMs + 100);
  }

  async toggle() {
    if (this.running) {
      this.muted = true;
      await this.stop();
    } else {
      this.muted = false;
      await this.start();
    }
    return !this.muted;
  }

  setVolume(v) {
    if (!this.master) return;
    const clamped = Math.max(0, Math.min(1, v));
    this.targetGain = clamped * 0.3; // cap at 0.3 absolute
    if (this.running && this.ctx) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(this.master.gain.value, now);
      this.master.gain.linearRampToValueAtTime(this.targetGain, now + 0.3);
    }
  }

  isRunning() { return this.running; }
}
