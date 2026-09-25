'use strict';
// The engine, run sample by sample in the GenExpr VM.
//
// Timing is checked against the exact sample a step should land on, because a
// groove box whose steps are merely "about right" is not a groove box. At 125
// BPM and 48 kHz a 16th note is 5760 samples, so every expected position here
// can be worked out by hand.

const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('./harness');
const { engineCode } = H;

const SPB = H.spb(125); // 5760
const near = (actual, expected, tol, what) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${what}: expected ${expected} ±${tol}, got ${actual}`);

test('compiles under the strict VM: block scope, no History read after write, no stray operators', () => {
  const g = H.makeEngine({ fillmode: 1, varamt: 60, humanize: 50 }, { checked: true });
  const r = H.run(g, { samples: 4 * 4 * SPB * 4 + 100 }); // four bars, fills on
  assert.equal(g.STATS.oob, 0, 'no out-of-range buffer reads');
  assert.ok(r.starts.length > 20, 'the default groove plays');
  for (const x of [...r.L, ...r.R]) assert.ok(Number.isFinite(x));
});

test('declares exactly the Params in spec.js, and three inputs and five outputs', () => {
  const { engineParams } = require('../src/spec');
  const g = H.makeEngine();
  const declared = [...g.program.sym.param.keys()].sort();
  assert.deepEqual(declared, engineParams().map((p) => p.name).sort());
  assert.equal(g.program.nIn, 3);
  assert.equal(g.program.nOut, 5);
});

test('four on the floor lands on the sample', () => {
  const g = H.makeEngine(H.solo(0));
  const r = H.run(g, { samples: 8 * 4 * SPB - 10 });
  const kicks = H.lanes(r.starts, 0).map((s) => s.i);
  assert.equal(kicks.length, 8);
  // the very first downbeat needs one sample to see the ramp move
  near(kicks[0], 1, 0, 'first downbeat');
  for (let k = 1; k < 8; k++) near(kicks[k], k * 4 * SPB, 1, 'beat ' + (k + 1));
});

test('16th swing moves the off-beat 16ths, and only those', () => {
  for (const swing of [50, 58, 66, 75]) {
    const g = H.makeEngine(H.solo(2, { swingamt: swing, pat2: H.mask(1, 2, 3, 4, 5, 6, 7, 8), rol2: 0 }));
    const r = H.run(g, { samples: 8 * SPB + 10 });
    const hats = H.lanes(r.starts, 2).map((s) => s.i);
    assert.equal(hats.length, 8, 'swing ' + swing);
    const S = swing / 100;
    for (let k = 1; k < 8; k++) {
      const expected = (k + (k % 2 ? 2 * S - 1 : 0)) * SPB;
      near(hats[k], expected, 1, `swing ${swing}% step ${k + 1}`);
    }
  }
});

test('8th swing moves the second 8th, and the 16ths between follow it', () => {
  const S = 0.62;
  const g = H.makeEngine(H.solo(2, { swingamt: 62, swgrid: 1, pat2: H.mask(1, 2, 3, 4, 5, 6, 7, 8) }));
  const r = H.run(g, { samples: 8 * SPB + 10 });
  const hats = H.lanes(r.starts, 2).map((s) => s.i);
  const within = [0, 2 * S, 4 * S, 2 + 2 * S];
  for (let k = 1; k < 8; k++) near(hats[k], (4 * Math.floor(k / 4) + within[k % 4]) * SPB, 1, 'step ' + (k + 1));
});

test('a lane with Swing at 0% stays straight while the rest swing', () => {
  const g = H.makeEngine(H.solo(2, { swingamt: 70, swd2: 0, pat2: H.mask(1, 2, 3, 4) }));
  const hats = H.lanes(H.run(g, { samples: 4 * SPB + 10 }).starts, 2).map((s) => s.i);
  for (let k = 1; k < 4; k++) near(hats[k], k * SPB, 1, 'straight step ' + (k + 1));
});

test('Nudge moves a whole lane late or early by a share of a step', () => {
  const late = H.makeEngine(H.solo(1, { ndg1: 25, pat1: H.mask(5, 13) }));
  const l = H.lanes(H.run(late, { samples: 16 * SPB }).starts, 1).map((s) => s.i);
  near(l[0], 4.25 * SPB, 1, 'late clap');
  near(l[1], 12.25 * SPB, 1, 'late clap');
  const early = H.makeEngine(H.solo(1, { ndg1: -25, pat1: H.mask(5, 13) }));
  const e = H.lanes(H.run(early, { samples: 16 * SPB }).starts, 1).map((s) => s.i);
  near(e[0], 3.75 * SPB, 1, 'early clap');
  near(e[1], 11.75 * SPB, 1, 'early clap');
});

test('a late lane does not fire the last step of the pattern when the transport starts', () => {
  const g = H.makeEngine(H.solo(1, { ndg1: 40, pat1: H.mask(16) }));
  const r = H.run(g, { samples: 2 * SPB });
  assert.equal(H.lanes(r.starts, 1).length, 0);
});

test('lanes of different lengths run against each other (polymeter)', () => {
  const g = H.makeEngine(H.solo(3, { swingamt: 50, len3: 5, pat3: H.mask(1, 3) }));
  const r = H.run(g, { samples: 20 * SPB - 10 });
  const steps = H.lanes(r.starts, 3).map((s) => Math.round(s.i / SPB));
  assert.deepEqual(steps, [0, 2, 5, 7, 10, 12, 15, 17]);
});

test('Chance 0% and a muted lane both stay silent', () => {
  const a = H.makeEngine({ ...H.STRICT, chc0: 0 });
  assert.equal(H.lanes(H.run(a, { samples: 16 * SPB }).starts, 0).length, 0);
  const b = H.makeEngine({ ...H.STRICT, on1: 0 });
  const r = H.run(b, { samples: 16 * SPB });
  assert.equal(H.lanes(r.starts, 1).length, 0);
  assert.ok(H.lanes(r.starts, 0).length > 0, 'the other lanes keep playing');
});

test('Chance thins a lane out roughly in proportion', () => {
  const g = H.makeEngine(H.solo(2, { chc2: 50, pat2: 65535 }));
  const n = H.lanes(H.run(g, { samples: 16 * 16 * SPB, record: false }).starts, 2).length;
  assert.ok(n > 256 * 0.38 && n < 256 * 0.62, `${n} of 256 steps played at 50%`);
});

test('accented steps are louder than plain ones by the Accent amount', () => {
  const g = H.makeEngine(H.solo(2, { accamt: 50, pat2: H.mask(1, 2), acc2: H.mask(1) }));
  const hats = H.lanes(H.run(g, { samples: 2 * SPB + 10 }).starts, 2);
  near(hats[0].vel, 1, 1e-9, 'accent');
  near(hats[1].vel, 0.7, 1e-9, 'plain step at Accent 50%');
});

test('a rolled step fires x2, x3 or x4, evenly across the step it is in', () => {
  for (const [roll, n] of [[0, 2], [1, 3], [2, 4]]) {
    const g = H.makeEngine(H.solo(1, { swingamt: 50, pat1: H.mask(4), rol1: H.mask(4), rln1: roll }));
    const hits = H.lanes(H.run(g, { samples: 5 * SPB }).starts, 1);
    assert.equal(hits.length, n, 'roll ' + n);
    for (let k = 0; k < n; k++) near(hits[k].i, 3 * SPB + (k * SPB) / n, 2, `roll ${n} hit ${k + 1}`);
    for (let k = 1; k < n; k++) assert.ok(hits[k].vel < hits[k - 1].vel, 'a roll decays');
  }
});

test('a roll on a swung step divides the swung step, not the straight one', () => {
  const S = 0.66;
  // step 2 is the late one: it starts at (1 + 2S - 1) and ends at 2
  const g = H.makeEngine(H.solo(1, { swingamt: 66, pat1: H.mask(2), rol1: H.mask(2), rln1: 0 }));
  const hits = H.lanes(H.run(g, { samples: 3 * SPB }).starts, 1).map((s) => s.i);
  const start = 2 * S * SPB;
  const len = (2 - 2 * S) * SPB;
  near(hits[0], start, 1, 'roll start');
  near(hits[1], start + len / 2, 2, 'roll middle');
});

test('nothing fires while stopped, and the downbeat fires the moment play resumes', () => {
  const g = H.makeEngine(H.solo(0));
  const stopAt = 2 * 4 * SPB + 100;
  const playAt = stopAt + 30000;
  let jumped = false;
  const r = H.run(g, {
    samples: playAt + 4 * SPB,
    stopped: (i) => i >= stopAt && i < playAt,
    each: (i) => {
      if (i === playAt - 1 && !jumped) {
        jumped = true;
        return { jumpTo: 0 }; // Live restarts from the top
      }
      return null;
    },
  });
  const kicks = H.lanes(r.starts, 0).map((s) => s.i);
  assert.ok(!kicks.some((i) => i > stopAt + 10 && i < playAt), 'silent while stopped');
  const after = kicks.filter((i) => i >= playAt);
  assert.ok(after.length >= 1, 'plays again');
  near(after[0], playAt + 1, 1, 'downbeat on restart');
});

test('relocating while stopped fires nothing', () => {
  const g = H.makeEngine(H.solo(0));
  const r = H.run(g, {
    samples: 30000,
    stopped: () => true,
    from: 0.3,
    each: (i) => (i === 10000 ? { jumpTo: 0.5 } : i === 20000 ? { jumpTo: 0.0 } : null),
  });
  assert.equal(r.starts.length, 0);
});

test('a loop brace jumping back mid-bar plays from where it lands', () => {
  const g = H.makeEngine(H.solo(0, { pat0: H.mask(1, 3, 5, 7, 9, 11, 13, 15) }));
  const jumpAt = Math.round(10.5 * SPB);
  const r = H.run(g, { samples: 14 * SPB, each: (i) => (i === jumpAt ? { jumpTo: 2 / 16 } : null) });
  const kicks = H.lanes(r.starts, 0).map((s) => s.i);
  const afterJump = kicks.filter((i) => i > jumpAt);
  assert.ok(afterJump.length > 0);
  near(afterJump[0], jumpAt + 1, 1, 'step 3 plays right after the jump');
});

test('Hold mode only plays while a key is held', () => {
  const g = H.makeEngine({ ...H.STRICT, holdmode: 1, kf_gate: 0 });
  assert.equal(H.run(g, { samples: 8 * SPB }).starts.length, 0);
  g.param('kf_gate', 1);
  assert.ok(H.run(g, { samples: 8 * SPB, from: 0.5 }).starts.length > 0);
});

test('Keys: the Tone lane plays at the held note and steps through a held chord', () => {
  const g = H.makeEngine(H.solo(3, { pat3: 65535, kf_note: 67 }));
  const one = H.lanes(H.run(g, { samples: 2 * SPB }).starts, 3);
  near(one[0].semis, 7, 1e-9, 'G3 is 7 semitones over C3');
  g.param('arp_n', 3);
  g.param('arp0', 60);
  g.param('arp1', 63);
  g.param('arp2', 67);
  const chord = H.lanes(H.run(g, { samples: 7 * SPB, from: 0.25 }).starts, 3).map((s) => s.semis);
  const seq = chord.slice(0, 6);
  assert.equal(seq.length, 6);
  const cycle = new Set(seq);
  assert.deepEqual([...cycle].sort((a, b) => a - b), [0, 3, 7]);
  for (let k = 3; k < 6; k++) assert.equal(seq[k], seq[k - 3], 'the chord repeats in order');
  // a lane with Keys off ignores the keyboard
  const k = H.makeEngine(H.solo(0, { kf_note: 72 }));
  near(H.lanes(H.run(k, { samples: SPB }).starts, 0)[0].semis, -12, 1e-9, 'kick keeps its own tune');
});

test('your sample plays at its own pitch, and Tune and the file rate move it correctly', () => {
  const tone = H.sine(440, 1.0);
  const base = { pat3: H.mask(1), bld3: 100, atk3: 1, dec3: 4000, sus3: 100, gat3: 800, rel3: 100, cut3: 20000, fev3: 0, res3: 0, drv3: 0, snd3: 0, busdrive: 0, pumpamt: 0 };
  const cases = [
    [{ tun3: 0 }, 440],
    [{ tun3: 12 }, 880],
    [{ tun3: -7 }, 440 * Math.pow(2, -7 / 12)],
    [{ tun3: 0, src_sr: 44100 }, 440 * (44100 / 48000)],
  ];
  for (const [p, want] of cases) {
    const g = H.makeEngine(H.solo(3, { ...base, ...p }));
    g.setBuffer('smp', tone);
    const r = H.run(g, { samples: 12000 });
    const f = H.peakFrequency(r.L, 2000, 8192, Math.round(want * 0.8), Math.round(want * 1.2));
    near(f, want, 3, JSON.stringify(p));
  }
});

test('Start and Walk choose where in the sample each step begins', () => {
  const buf = H.sine(100, 2.0); // 96000 frames
  const g = H.makeEngine(H.solo(3, { pat3: H.mask(1, 2, 3, 4), stt3: 25, wlk3: 40, len3: 4, bld3: 100, tun3: 0 }));
  g.setBuffer('smp', buf);
  const hits = H.lanes(H.run(g, { samples: 4 * SPB + 10 }).starts, 3);
  hits.forEach((h, k) => {
    const expected = (0.25 + 0.4 * ((k % 4) / 4)) * 96000 + 1; // +1: one sample has played
    near(h.pos, expected, 1.5, 'step ' + (k + 1));
  });
});

test('with no sample loaded, every lane falls back to its synth voice', () => {
  const g = H.makeEngine({ ...H.STRICT });
  const r = H.run(g, { samples: 4 * 4 * SPB });
  assert.ok(H.rms(r.L) > 0.02, 'the empty device still grooves');
});

test('the Punch envelope sweeps the kick from high to low', () => {
  const g = H.makeEngine(H.solo(0, { pat0: H.mask(1), cut0: 20000, drv0: 0, busdrive: 0, dec0: 800 }));
  const r = H.run(g, { samples: 24000 });
  const early = H.peakFrequency(r.L, 10, 480, 60, 400);
  const late = H.peakFrequency(r.L, 9600, 4800, 30, 120);
  near(late, 50, 4, 'settles at Tune -12 below 100 Hz');
  assert.ok(early > late * 1.8, `starts high (${early} Hz in the first 10 ms)`);
});

test('the lane filter shapes the sound: low-pass removes highs, high-pass removes lows', () => {
  const measure = (fty, cut) => {
    const g = H.makeEngine(H.solo(1, { pat1: H.mask(1), fty1: fty, cut1: cut, res1: 0, dec1: 400, busdrive: 0, snd1: 0 }));
    const r = H.run(g, { samples: 9600 });
    return { lo: H.bandEnergy(r.L, 500, 4596, 100, 400), hi: H.bandEnergy(r.L, 500, 4596, 6000, 12000) };
  };
  const lp = measure(0, 300);
  const hp = measure(2, 5000);
  assert.ok(lp.lo > lp.hi * 20, 'low-pass keeps lows');
  assert.ok(hp.hi > hp.lo * 20, 'high-pass keeps highs');
});

test('ADSR: sustain holds for Length, then Release lets go', () => {
  const g = H.makeEngine(H.solo(3, { pat3: H.mask(1), atk3: 5, dec3: 20, sus3: 50, gat3: 400, rel3: 50, cut3: 20000, fev3: 0, drv3: 0, busdrive: 0, snd3: 0, pumpamt: 0 }));
  const envAt = [];
  H.run(g, { samples: 6 * SPB, record: false, each: (i, out, gg) => { envAt[i] = gg.history('ve_6') + gg.history('ve_7'); } });
  near(envAt[Math.round(0.0045 * 48000)], 0.9, 0.12, 'attack rising at 4.5 ms');
  near(envAt[2 * SPB], 0.5, 0.01, 'sustain level while held');
  near(envAt[4 * SPB - 10], 0.5, 0.01, 'still held just before Length ends');
  assert.ok(envAt[4 * SPB + Math.round(0.05 * 48000)] < 0.02, 'released within Release time');
});

test('Pump: the kick ducks the other lanes and lets them back', () => {
  const g = H.makeEngine({ ...H.STRICT, pumpamt: 100 });
  const gains = [];
  H.run(g, { samples: 4 * SPB, record: false, each: (i, o, gg) => { gains[i] = gg.history('pump_e'); } });
  assert.ok(gains[400] > 0.9, 'ducked just after the kick');
  assert.ok(gains[3 * SPB] < 0.05, 'recovered before the next beat');
});

test('Delay repeats at the tempo-locked time, ping-ponging left then right', () => {
  const g = H.makeEngine(H.solo(1, { pat1: H.mask(1), snd1: 100, dmix: 100, dfb: 50, dtime: 2, rmix: 0, busdrive: 0, dec1: 30, pan1: 0 }));
  const r = H.run(g, { samples: 9 * SPB });
  const d = 3 * SPB; // 3/16
  const first = H.peak(r.L, d - 50, d + 1500);
  assert.ok(first > 0.02, 'first echo on the left');
  assert.ok(H.peak(r.R, d - 50, d + 1500) < first * 0.1, 'and not on the right');
  assert.ok(H.peak(r.R, 2 * d - 50, 2 * d + 1500) > 0.01, 'second echo on the right');
  assert.ok(H.peak(r.L, 2500, d - 200) < first * 0.05, 'quiet between the hit and its echo');
});

test('Space adds a tail after the hit', () => {
  const wet = H.makeEngine(H.solo(1, { pat1: H.mask(1), snd1: 100, rmix: 100, dmix: 0, rsize: 80, dec1: 60 }));
  const r = H.run(wet, { samples: 6 * SPB });
  assert.ok(H.rms(r.L, 3 * SPB, 6 * SPB) > 0.002, 'reverb tail');
  const dry = H.makeEngine(H.solo(1, { pat1: H.mask(1), snd1: 100, rmix: 0, dmix: 0, dec1: 60 }));
  const d = H.run(dry, { samples: 6 * SPB });
  assert.ok(H.rms(d.L, 3 * SPB, 6 * SPB) < 1e-4, 'no tail without it');
});

test('the DJ filter: left darkens, right thins', () => {
  const band = (djf) => {
    const g = H.makeEngine({ ...H.STRICT, djf });
    const r = H.run(g, { samples: 4 * SPB });
    return { lo: H.bandEnergy(r.L, SPB, 3 * SPB, 40, 200), hi: H.bandEnergy(r.L, SPB, 3 * SPB, 5000, 10000) };
  };
  const mid = band(0);
  const lp = band(-90);
  const hp = band(90);
  assert.ok(lp.hi < mid.hi * 0.05, 'low-pass cuts the highs');
  assert.ok(hp.lo < mid.lo * 0.05, 'high-pass cuts the lows');
});

test('tempo is read off the ramp: rolls and delay follow a tempo change', () => {
  const g = H.makeEngine({ ...H.STRICT });
  H.run(g, { samples: 20000, bpm: 90, record: false });
  near(g.history('spb_h'), H.spb(90), 2, 'samples per 16th at 90 BPM');
  H.run(g, { samples: 20000, bpm: 140, record: false });
  near(g.history('spb_h'), H.spb(140), 2, 'samples per 16th at 140 BPM');
});

test('nothing gets past full scale, however hard it is pushed', () => {
  const hot = { ...H.STRICT, busdrive: 100, buscrush: 60, dfb: 95, dmix: 100, rmix: 100, rsize: 100, varamt: 100, fillmode: 1 };
  for (let l = 0; l < 4; l++) Object.assign(hot, { ['lvl' + l]: 6, ['drv' + l]: 100, ['res' + l]: 100, ['snd' + l]: 100, ['pat' + l]: 65535, ['rol' + l]: 65535 });
  const g = H.makeEngine(hot);
  g.setBuffer('smp', H.sine(60, 0.5, 48000, 2));
  const r = H.run(g, { samples: 4 * 16 * SPB });
  assert.ok(H.peak(r.L) <= 1.0 && H.peak(r.R) <= 1.0, `peak ${H.peak(r.L)}`);
  for (const x of r.L) assert.ok(Number.isFinite(x));
});

test('fills only happen in the last beat of the chosen bar', () => {
  const g = H.makeEngine({ ...H.STRICT, fillmode: 1, pat2: 0, on0: 0, on1: 0, on3: 0 }); // hats empty: only fill hits
  const hats = H.lanes(H.run(g, { samples: 8 * 16 * SPB, record: false }).starts, 2);
  assert.ok(hats.length > 0, 'the fill added hats');
  for (const h of hats) {
    const bar = Math.floor(h.i / (16 * SPB));
    const step = Math.floor((h.i % (16 * SPB)) / SPB);
    assert.equal(bar % 4, 3, 'fill bar');
    assert.ok(step >= 12, 'last beat');
  }
});

test('the UI outputs report each lane step, activity and the source state', () => {
  const g = H.makeEngine({ ...H.STRICT, len2: 12 });
  const r = H.run(g, { samples: Math.round(13.5 * SPB) });
  const steps = r.ui[2];
  assert.ok(steps >= 65536, 'playing flag');
  const s = steps - 65536;
  assert.equal(s & 15, 13, 'kick lane on step 14');
  assert.equal((s >> 8) & 15, 1, 'hats (12 steps) on its step 2');
  assert.ok(r.ui[3] > 0, 'activity');
  assert.equal(r.ui[4] & 3, 0, 'not capturing');
  assert.equal(r.ui[4] & 4, 0, 'no sample loaded');
});

test('Capture records a bar of the input on the next downbeat, then the groove plays it', () => {
  const g = H.makeEngine({ ...H.STRICT });
  g.setBuffer('cap', H.makeBuffer(48000 * 8, 2));
  const input = (i) => [Math.sin(i * 0.05) * 0.5, Math.sin(i * 0.05) * 0.5];
  // arm half-way through bar 1: recording waits for bar 2
  let armed = false;
  const bar = 16 * SPB;
  const r = H.run(g, {
    samples: 2 * bar + 1000,
    input,
    each: (i, out, gg) => {
      if (i === bar / 2 && !armed) { gg.param('capgo', 1); armed = true; }
      return null;
    },
  });
  assert.equal(g.history('cap_s'), 0, 'finished');
  near(g.history('cap_len'), bar, 2, 'one bar captured');
  const cap = g.getBuffer('cap');
  near(cap.data[0][1000], Math.sin((bar + 1000) * 0.05) * 0.5, 0.03, 'recorded from the downbeat of bar 2');
  assert.equal(r.ui[4] & 8, 8, 'status says the capture holds audio');
  // now build the groove from it
  g.param('srcsel', 1);
  g.param('bld3', 100);
  const s = H.run(g, { samples: 4 * SPB, from: 0 });
  assert.ok(H.lanes(s.starts, 3).length > 0);
  assert.ok(H.rms(s.L) > 0.01, 'plays the captured audio');
});

test('Capture while stopped starts at once', () => {
  const g = H.makeEngine({ ...H.STRICT, capgo: 1 });
  g.setBuffer('cap', H.makeBuffer(48000 * 8, 2));
  H.run(g, { samples: 100, stopped: () => true, input: () => [0.25, 0.25] });
  assert.equal(g.history('cap_s'), 2, 'recording');
  near(g.history('cap_w'), 99, 1, 'from the first sample');
});

test('Thru passes the input under the groove', () => {
  const g = H.makeEngine({ ...H.STRICT, thruamt: 100, on0: 0, on1: 0, on2: 0, on3: 0, dmix: 0, rmix: 0 });
  const tone = (i) => 0.3 * Math.sin((2 * Math.PI * 440 * i) / 48000);
  const r = H.run(g, { samples: 4000, input: (i) => [tone(i), -tone(i)] });
  for (const i of [3000, 3333, 3999]) {
    near(r.L[i], tone(i), 0.01, 'left through');
    near(r.R[i], -tone(i), 0.01, 'right through');
  }
});
