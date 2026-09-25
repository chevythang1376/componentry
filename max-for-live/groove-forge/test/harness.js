'use strict';
// Runs the engine the way Live would: a bar ramp that creeps forward while the
// transport plays and holds still while it is stopped, parameters set by name,
// and a trace of every voice that starts.

const { buildEngine } = require('../src/genexpr');
const { GenInstance, makeBuffer } = require('./genexpr-vm');

const SR = 48000;
let cachedCode = null;
const engineCode = () => (cachedCode = cachedCode || buildEngine());

// Parameters that make timing deterministic: no humanize, no ghosts, no fills.
const STRICT = { humanize: 0, varamt: 0, fillmode: 0 };

function makeEngine(params = {}, { sampleRate = SR, checked = false } = {}) {
  const g = new GenInstance(engineCode(), { sampleRate, checked });
  for (const [k, v] of Object.entries(params)) g.param(k, v);
  const idx = (name) => g.program.sym.history.get(name).index;
  g.voiceIdx = [];
  for (let v = 0; v < 8; v++) {
    g.voiceIdx.push({ age: idx('vt_' + v), vel: idx('vv_' + v), semis: idx('vm_' + v), pos: idx('vp_' + v), stage: idx('vs_' + v) });
  }
  return g;
}

// Samples per 16th note.
const spb = (bpm, sr = SR) => (sr * 60) / bpm / 4;

// transport: { bpm, from: startPhase (bars, may exceed 1), stops: [[startSample, endSample]...] }
// Returns { L, R, starts: [{ i, lane, voice, vel, semis }], ui: [out3, out4, out5 at the end] }
function run(g, { samples, bpm = 125, from = 0, stopped = () => false, input = null, each = null, record = true } = {}) {
  const sr = g.sampleRate;
  const inc = bpm / 240 / sr;
  let pos = from;
  const L = record ? new Float32Array(samples) : null;
  const R = record ? new Float32Array(samples) : null;
  const starts = [];
  const H = g.H;
  const inBuf = [0, 0, 0];
  for (let i = 0; i < samples; i++) {
    const halted = stopped(i);
    inBuf[0] = pos - Math.floor(pos);
    if (input) {
      const s = input(i);
      inBuf[1] = s[0];
      inBuf[2] = s[1];
    }
    const out = g.tick(inBuf);
    if (record) {
      L[i] = out[0];
      R[i] = out[1];
    }
    for (let v = 0; v < 8; v++) {
      const vi = g.voiceIdx[v];
      if (H[vi.age] === 1) starts.push({ i, lane: v >> 1, voice: v, vel: H[vi.vel], semis: H[vi.semis], pos: H[vi.pos] });
    }
    // A jump lands on the next sample, the way a relocate reaches the ramp.
    const r = each ? each(i, out, g) : null;
    if (r && typeof r.jumpTo === 'number') pos = r.jumpTo;
    else if (!halted) pos += inc;
  }
  return { L, R, starts, ui: Array.from(g.OUT) };
}

const lanes = (starts, lane) => starts.filter((s) => s.lane === lane);

function sine(freq, seconds, sr = SR, channels = 1) {
  const n = Math.round(seconds * sr);
  const b = makeBuffer(n, channels);
  for (let c = 0; c < channels; c++) for (let i = 0; i < n; i++) b.data[c][i] = 0.8 * Math.sin((2 * Math.PI * freq * i) / sr);
  return b;
}

// Energy in a band, by a direct DFT over a window (small, exact, no FFT needed).
function bandEnergy(x, from, to, fLo, fHi, sr = SR) {
  let e = 0;
  const n = to - from;
  for (let f = fLo; f <= fHi; f += Math.max(1, (fHi - fLo) / 40)) {
    let re = 0;
    let im = 0;
    for (let i = 0; i < n; i++) {
      const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n);
      re += x[from + i] * w * Math.cos((2 * Math.PI * f * i) / sr);
      im += x[from + i] * w * Math.sin((2 * Math.PI * f * i) / sr);
    }
    e += re * re + im * im;
  }
  return e;
}

// Strongest frequency between fLo and fHi, to 1 Hz.
function peakFrequency(x, from, n, fLo, fHi, sr = SR) {
  let best = fLo;
  let bestE = -1;
  for (let f = fLo; f <= fHi; f += 1) {
    let re = 0;
    let im = 0;
    for (let i = 0; i < n; i++) {
      const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n);
      re += x[from + i] * w * Math.cos((2 * Math.PI * f * i) / sr);
      im += x[from + i] * w * Math.sin((2 * Math.PI * f * i) / sr);
    }
    const e = re * re + im * im;
    if (e > bestE) { bestE = e; best = f; }
  }
  return best;
}

const rms = (x, from = 0, to = x.length) => {
  let s = 0;
  for (let i = from; i < to; i++) s += x[i] * x[i];
  return Math.sqrt(s / Math.max(1, to - from));
};
const peak = (x, from = 0, to = x.length) => {
  let p = 0;
  for (let i = from; i < to; i++) p = Math.max(p, Math.abs(x[i]));
  return p;
};

// Pattern mask from 1-based step numbers, the way a person reads a grid.
const mask = (...steps) => steps.reduce((m, s) => m | (1 << (s - 1)), 0);

// Everything off except one lane, so its hits can be told apart.
function solo(lane, extra = {}) {
  const p = { ...STRICT };
  for (let l = 0; l < 4; l++) p['on' + l] = l === lane ? 1 : 0;
  return { ...p, ...extra };
}

module.exports = { SR, STRICT, makeEngine, run, spb, lanes, sine, bandEnergy, peakFrequency, rms, peak, mask, solo, engineCode, makeBuffer };
