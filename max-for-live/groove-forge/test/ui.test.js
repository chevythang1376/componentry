'use strict';
// The display script, run in a stand-in for Max's jsui host: the grid part
// unless a test says otherwise.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const vm = require('vm');
const { loadUI, SCRIPT, PARTS } = require('./jsui-host');
const { LANE_PARAMS } = require('../src/spec');
const { assertES5 } = require('../src/build');

const padAt = (lane, step) => [226 + step * 17 + 7, 16 + lane * 20 + 9];
const fieldAt = (lane, f) => [500 + f * 20 + 9, 16 + lane * 20 + 9];
const diceAt = (lane) => [561 + 6, 16 + lane * 20 + 9];
const bits = (m) => [...Array(16).keys()].filter((k) => (m >> k) & 1);
const last = (outs, name) => {
  for (let i = outs.length - 1; i >= 0; i--) if (outs[i][1] === name) return outs[i][2];
  return undefined;
};

// Feed the outputs back the way the hidden parameters do: set, then echo.
function echo(ui, outs) {
  for (const o of outs) if (/^(pat|acc|rol|len|hit|rot|stt)\d$/.test(o[1]) || o[1] === 'sel') ui.msg(o[1], o[2]);
}

test('parses as ES5, the only JavaScript Max\'s jsui runs (one newer token and it never loads)', () => {
  assert.doesNotThrow(() => assertES5(fs.readFileSync(SCRIPT, 'utf8'), 'the display script'));
  assert.throws(() => assertES5('f(1, 2,);', 'a trailing comma in a call'), /not ES5/);
  assert.throws(() => assertES5('var f = () => 1;', 'an arrow'), /not ES5/);
});

test('runs where the built-ins newer than ES5 are missing, as in Max\'s legacy engine', () => {
  const ui = loadUI();
  for (const gone of ['Array.prototype.includes', 'Object.assign', 'Number.isFinite', 'Math.trunc', 'String.prototype.startsWith', 'this.Map']) {
    assert.equal(vm.runInContext('typeof ' + gone, ui.sandbox), 'undefined', gone);
  }
  // and every test below runs it that way
});

test('declares one inlet and one outlet', () => {
  const ui = loadUI();
  assert.equal(ui.sandbox.inlets, 1);
  assert.equal(ui.sandbox.outlets, 1);
});

test('stored values arriving never write anything back (loading a set cannot change a pattern)', () => {
  for (const part of ['source', 'grid']) {
    const ui = loadUI({ part });
    const stored = { pat0: 4369, acc0: 1, rol0: 0, len0: 12, hit0: 3, rot0: 0, pat2: 21845, len2: 7, on1: 0, stt3: 40, wlk3: 25, swd1: 50, ndg2: -10 };
    for (const [k, v] of Object.entries(stored)) ui.msg(k, v);
    ui.msg('swingamt', 62);
    ui.msg('swgrid', 1);
    ui.msg('style', 3);
    ui.msg('sel', 2);
    ui.msg('init');
    assert.deepEqual(ui.take(), [], part);
    assert.equal(ui.state().len[0], 12);
    assert.equal(ui.state().pat[2], 21845);
    assert.equal(ui.state().on[1], 0);
  }
});

test('each part does its own share once: the source part keeps the chord, the grid part the pattern', () => {
  const source = loadUI({ part: 'source' });
  const grid = loadUI({ part: 'grid' });
  for (const ui of [source, grid]) {
    ui.msg('init');
    ui.msg('note', 60, 100);
    ui.msg('generate');
    ui.msg('mutate');
    ui.msg('clear');
    ui.msg('undo');
  }
  const fromSource = source.take().map((o) => o[1]);
  const fromGrid = grid.take().map((o) => o[1]);
  assert.deepEqual(fromSource, ['arp0', 'arp_n'], 'the source part sends the chord and nothing else');
  assert.ok(fromGrid.length > 0 && fromGrid.every((n) => /^(pat|acc|rol|len|hit|rot)\d$/.test(n)), 'the grid part writes patterns and nothing else');
});

test('a part redraws for what it shows, not for what the other part shows', () => {
  const redraws = (part, name, ...args) => {
    const ui = loadUI({ part });
    ui.msg('init');
    const before = ui.redraws();
    ui.msg(name, ...args);
    return ui.redraws() - before;
  };
  assert.equal(redraws('grid', 'steps', 65536 + 5), 1);
  assert.equal(redraws('source', 'steps', 65536 + 5), 0);
  assert.equal(redraws('source', 'stat', 2 + 16 * 40), 1);
  assert.equal(redraws('grid', 'stat', 2 + 16 * 40), 0);
  assert.equal(redraws('grid', 'pat1', 3), 1);
  assert.equal(redraws('source', 'pat1', 3), 0);
  assert.equal(redraws('source', 'stt1', 30), 1);
  assert.equal(redraws('grid', 'stt1', 30), 0);
  for (const part of ['source', 'grid']) {
    assert.equal(redraws(part, 'sel', 2), 1, 'both show the selected lane');
    assert.equal(redraws(part, 'len2', 9), 1, 'both show lane length');
    assert.equal(redraws(part, 'act', 15), 1, 'both show activity');
  }
});

test('the engine status redraws only when it changes, except while ARMED blinks', () => {
  const ui = loadUI({ part: 'source', variant: 'fx' });
  ui.msg('init');
  let before = ui.redraws();
  for (let i = 0; i < 5; i++) ui.msg('stat', 4);
  assert.equal(ui.redraws() - before, 1, 'the same status five times is one redraw');
  before = ui.redraws();
  for (let i = 0; i < 5; i++) ui.msg('stat', 1);
  assert.equal(ui.redraws() - before, 5, 'armed: every report redraws, to blink');
});

test('a click cycles a step: off, on, accent, off', () => {
  const ui = loadUI();
  ui.msg('init');
  const [x, y] = padAt(1, 0);
  ui.click(x, y);
  let o = ui.take();
  assert.equal(last(o, 'sel'), 1, 'clicking a lane selects it');
  assert.ok(bits(last(o, 'pat1')).includes(0));
  assert.ok(!bits(last(o, 'acc1')).includes(0));
  ui.release(x, y);
  ui.click(x, y);
  o = ui.take();
  assert.ok(bits(last(o, 'acc1')).includes(0), 'second click accents');
  ui.release(x, y);
  ui.click(x, y);
  o = ui.take();
  assert.ok(!bits(last(o, 'pat1')).includes(0), 'third click clears');
  assert.ok(!bits(last(o, 'acc1')).includes(0));
});

test('Shift-click accents, Alt-click rolls, Cmd-click sets where the lane ends', () => {
  const ui = loadUI();
  ui.msg('init');
  ui.click(...padAt(2, 5), { shift: true });
  let o = ui.take();
  assert.ok(bits(last(o, 'pat2')).includes(5) && bits(last(o, 'acc2')).includes(5));
  ui.click(...padAt(2, 5), { option: true });
  o = ui.take();
  assert.ok(bits(last(o, 'rol2')).includes(5));
  ui.click(...padAt(2, 5), { option: true });
  assert.ok(!bits(last(ui.take(), 'rol2')).includes(5), 'Alt-click again unrolls');
  ui.click(...padAt(3, 11), { cmd: true });
  assert.equal(last(ui.take(), 'len3'), 12);
  ui.click(...padAt(0, 6), { ctrl: true });
  assert.equal(last(ui.take(), 'len0'), 7, 'Ctrl works where Cmd does not exist');
});

test('dragging paints the same state along the row, and only that row', () => {
  const ui = loadUI();
  ui.msg('init');
  ui.msg('pat3', 0);
  ui.click(...padAt(3, 0));
  for (let k = 1; k < 8; k++) ui.drag(padAt(3, k)[0], padAt(1, k)[1]); // wander onto another row
  ui.release(0, 0);
  const o = ui.take();
  assert.deepEqual(bits(last(o, 'pat3')), [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.equal(last(o, 'pat1'), undefined);
});

test('HIT and ROT write a Euclidean rhythm and keep accents that still land', () => {
  const ui = loadUI();
  ui.msg('init');
  ui.msg('len2', 16);
  ui.msg('pat2', 0);
  ui.msg('acc2', 1 << 4);
  ui.msg('hit2', 0);
  ui.msg('rot2', 0);
  const [hx, hy] = fieldAt(2, 1);
  ui.click(hx, hy);
  ui.drag(hx, hy - 24); // 4 up
  ui.release(hx, hy - 24);
  let o = ui.take();
  assert.deepEqual(bits(last(o, 'pat2')), [0, 4, 8, 12]);
  assert.deepEqual(bits(last(o, 'acc2')), [4], 'accent on step 5 survives');
  echo(ui, o);
  const [rx, ry] = fieldAt(2, 2);
  ui.click(rx, ry);
  ui.drag(rx, ry - 12); // rotate 2
  ui.release(rx, ry - 12);
  o = ui.take();
  assert.deepEqual(bits(last(o, 'pat2')), [2, 6, 10, 14]);
  assert.equal(last(o, 'rot2'), 2);
});

test('LEN shortens a lane and keeps HIT and ROT inside it', () => {
  const ui = loadUI();
  ui.msg('init');
  ui.msg('hit1', 9);
  ui.msg('rot1', 12);
  const [x, y] = fieldAt(1, 0);
  ui.click(x, y);
  ui.drag(x, y + 48); // 8 down: 16 -> 8
  ui.release(x, y + 48);
  const o = ui.take();
  assert.equal(last(o, 'len1'), 8);
  assert.equal(last(o, 'hit1'), 8);
  assert.equal(last(o, 'rot1'), 7);
});

test('the die rewrites its own lane and no other', () => {
  const ui = loadUI({ random: () => 0.37 });
  ui.msg('init');
  ui.click(...diceAt(2));
  const lanes = new Set(ui.take().filter((o) => /\d$/.test(o[1])).map((o) => o[1].slice(-1)));
  assert.deepEqual([...lanes], ['2']);
});

test('Generate writes a valid, style-true groove in every style', () => {
  for (let style = 0; style < 6; style++) {
    for (let run = 0; run < 150; run++) {
      const ui = loadUI({ random: seeded(style * 1000 + run + 1) });
      ui.msg('init');
      ui.msg('style', style);
      ui.msg('generate');
      const o = ui.take();
      for (let l = 0; l < 4; l++) {
        const len = last(o, 'len' + l);
        const pat = last(o, 'pat' + l);
        const acc = last(o, 'acc' + l);
        const rol = last(o, 'rol' + l);
        assert.ok(len >= 1 && len <= 16, `style ${style} lane ${l} len ${len}`);
        assert.equal(acc & ~pat, 0, 'accents only on steps that play');
        assert.equal(rol & ~pat, 0, 'rolls only on steps that play');
        assert.ok(pat >= 0 && pat <= 65535);
        assert.equal(last(o, 'hit' + l), bits(pat).filter((k) => k < len).length);
        if (l === 0) assert.ok(bits(pat).some((k) => k < len), 'the kick always plays');
        if (l === 0 && style !== 3 && style !== 5) {
          for (const k of [0, 4, 8, 12]) assert.ok(bits(pat).includes(k), 'four on the floor');
        }
      }
      if (style === 4) {
        const lens = [0, 1, 2, 3].map((l) => last(o, 'len' + l));
        assert.ok(lens.some((n) => n !== 16), 'Hypnotic runs lanes at odd lengths');
      }
    }
  }
});

// A seeded generator, so the randomised tests are the same every run.
function seeded(seed) {
  let x = seed >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}

test('Mutate changes a little and never moves the kick off the floor', () => {
  const before = [4369, 4112, 52300, 19660];
  for (let run = 0; run < 300; run++) {
    const ui = loadUI({ random: seeded(run + 1) });
    ui.msg('init');
    ui.msg('mutate');
    const o = ui.take();
    const kick = last(o, 'pat0');
    for (const k of [0, 4, 8, 12]) assert.ok(bits(kick).includes(k));
    // the kick changes at most one step; other lanes make one or two changes,
    // and a change that moves a hit touches two steps
    assert.ok(bits(kick ^ before[0]).length <= 1, 'kick');
    for (let l = 1; l < 4; l++) assert.ok(bits(last(o, 'pat' + l) ^ before[l]).length <= 4, `lane ${l}, run ${run}`);
  }
});

test('Clear empties the selected lane and Undo brings it back', () => {
  const ui = loadUI();
  ui.msg('init');
  ui.msg('sel', 2);
  ui.msg('clear');
  let o = ui.take();
  assert.equal(last(o, 'pat2'), 0);
  echo(ui, o);
  ui.msg('undo');
  o = ui.take();
  assert.equal(last(o, 'pat2'), 52300);
  assert.equal(last(o, 'acc2'), 17476);
});

test('Undo walks back through several edits', () => {
  const ui = loadUI();
  ui.msg('init');
  ui.msg('generate');
  echo(ui, ui.take());
  const afterGen = ui.state().pat.slice();
  ui.msg('mutate');
  echo(ui, ui.take());
  ui.click(...padAt(1, 3));
  ui.release(0, 0);
  echo(ui, ui.take());
  ui.msg('undo');
  echo(ui, ui.take());
  ui.msg('undo');
  echo(ui, ui.take());
  assert.deepEqual([...ui.state().pat], [...afterGen]);
  ui.msg('undo');
  echo(ui, ui.take());
  assert.deepEqual([...ui.state().pat], [4369, 4112, 52300, 19660]);
});

test('a held chord goes to the engine sorted, and stays after the keys are let go', () => {
  const ui = loadUI({ part: 'source' });
  ui.msg('init');
  ui.msg('note', 67, 100);
  ui.msg('note', 60, 100);
  ui.take();
  ui.msg('note', 64, 90);
  let o = ui.take();
  assert.equal(last(o, 'arp_n'), 3);
  assert.deepEqual([last(o, 'arp0'), last(o, 'arp1'), last(o, 'arp2')], [60, 64, 67]);
  assert.equal(o[o.length - 1][1], 'arp_n', 'notes are set before the count that makes them live');
  ui.msg('note', 60, 0);
  ui.msg('note', 64, 0);
  ui.msg('note', 67, 0);
  assert.deepEqual(ui.take(), [], 'letting go keeps the chord');
  ui.msg('note', 62, 100);
  o = ui.take();
  assert.equal(last(o, 'arp_n'), 1, 'a new note after letting go starts a new chord');
  assert.equal(last(o, 'arp0'), 62);
});

test('engine reports decode: steps, playing, activity and capture status', () => {
  const ui = loadUI({ variant: 'fx' });
  ui.msg('init');
  ui.msg('steps', 65536 + 3 + 5 * 16 + 11 * 256 + 15 * 4096);
  assert.deepEqual([...ui.state().steps], [3, 5, 11, 15]);
  assert.equal(ui.state().playing, 1);
  ui.msg('act', 15 + 0 * 16 + 5 * 256);
  assert.deepEqual([...ui.state().act].map((a) => Math.round(a * 15)), [15, 0, 5, 0]);
  ui.msg('stat', 2 + 4 + 16 * 37 + 2048 * 500);
  assert.equal(ui.state().cap, 2);
  assert.equal(ui.state().hasSample, 1);
  assert.equal(ui.state().capProg, 0.37);
  assert.equal(ui.state().capFrac, 0.5);
});

test('the waveform is read from the buffer, and a click on it sets where the selected lane starts', () => {
  const frames = 48000;
  const data = [new Float64Array(frames), new Float64Array(frames)];
  for (let i = 0; i < frames; i++) data[0][i] = data[1][i] = 0.5 * Math.sin(i / 20) * (i < frames / 2 ? 1 : 0.25);
  const ui = loadUI({ part: 'source', buffers: { '0123gfsrc': { frames, channels: 2, data } } });
  ui.msg('setbuf', '0123gfsrc');
  assert.equal(ui.state().peaks, null, 'nothing is read before the device has loaded');
  ui.msg('init');
  const peaks = ui.state().peaks;
  assert.equal(peaks.length, 158);
  assert.ok(Math.abs(peaks[10][1] - 1) < 0.01, 'normalised to the loudest part');
  assert.ok(peaks[150][1] < 0.3, 'the quiet half draws smaller');
  ui.msg('sel', 3);
  ui.click(10 + 79, 40);
  const o = ui.take();
  assert.equal(last(o, 'stt3'), 50);
  ui.release(10 + 79, 40);
  ui.click(20, 10); // the title, not the waveform
  assert.deepEqual(ui.take(), []);
});

test('the grid part never reads the sample: only the part that draws it does', () => {
  let reads = 0;
  const buffers = new Proxy({}, { get: () => { reads++; return { frames: 4800, channels: 1, data: [new Float64Array(4800)] }; } });
  const ui = loadUI({ part: 'grid', buffers });
  ui.msg('setbuf', 'x');
  ui.msg('init');
  ui.msg('loaded');
  ui.msg('setcap', 'y');
  ui.msg('stat', 8 + 2048 * 500);
  assert.equal(reads, 0);
  assert.equal(ui.state().peaks, null);
});

test('paints in every state inside its own box, without a call Max would reject', () => {
  for (const [variant, part] of [['inst', 'source'], ['inst', 'grid'], ['fx', 'source'], ['fx', 'grid']]) {
    const frames = 9600;
    const data = [new Float64Array(frames).map((_, i) => Math.sin(i / 7))];
    const ui = loadUI({ variant, part, buffers: { buf: { frames, channels: 1, data }, cap: { frames, channels: 2, data: [data[0], data[0]] } } });
    ui.paint();
    ui.msg('setbuf', 'buf');
    ui.msg('setcap', 'cap');
    ui.msg('init');
    for (const stat of [0, 1, 2 + 16 * 50, 8 + 2048 * 250, 4 + 8 + 2048 * 1000]) {
      ui.msg('stat', stat);
      ui.msg('srcsel', stat & 8 ? 1 : 0);
      ui.msg('steps', 65536 + 7 + 7 * 16 + 7 * 256 + 7 * 4096);
      ui.msg('act', 65535);
      ui.msg('note', 60, 100);
      ui.msg('swingamt', 75);
      ui.msg('swgrid', stat & 1);
      ui.msg('ndg2', -50);
      ui.msg('len3', 5);
      ui.msg('rol1', 65535);
      ui.msg('on2', 0);
      // every lane started at each end of the sound, walked all the way
      for (let l = 0; l < 4; l++) {
        ui.msg('stt' + l, stat & 4 ? 100 : 0);
        ui.msg('wlk' + l, 100);
      }
      const calls = ui.paint();
      assert.ok(calls.length > (part === 'grid' ? 100 : 30), `${variant} ${part} draws`);
    }
    const [x, y, w, h] = PARTS[part];
    for (const [hx, hy] of [[x + 1, y + 1], [x + w / 2, y + h / 2], [x + w - 1, y + h - 1], [300, 30], [510, 40], [60, 40]]) {
      if (hx >= x && hx < x + w && hy >= y && hy < y + h) ui.hover(hx, hy);
      ui.paint();
    }
    ui.leave();
    ui.paint();
  }
});

test('the parts sit where the geometry expects: the waveform in the source part, pads, fields and dice in the grid part', () => {
  const inside = (r, x, y) => x >= r[0] && y >= r[1] && x < r[0] + r[2] && y < r[1] + r[3];
  const { G } = loadUI().sandbox;
  const [wx, wy, ww, wh] = G.wave;
  assert.ok(inside(PARTS.source, wx, wy) && inside(PARTS.source, wx + ww - 1, wy + wh - 1), 'the waveform');
  for (let l = 0; l < 4; l++) {
    const [px, py] = padAt(l, 0);
    const [qx] = padAt(l, 15);
    const [dx] = diceAt(l);
    assert.ok(inside(PARTS.grid, px - 7, py - 9) && inside(PARTS.grid, qx + 8, py + 9), 'pads of lane ' + l);
    assert.ok(inside(PARTS.grid, dx + 6, py), 'the die of lane ' + l);
  }
});

test('the swing lean drawn on a step is the engine\'s own offset', () => {
  const ui = loadUI();
  ui.msg('swingamt', 66);
  const off = (l, k) => ui.sandbox.stepOffset(l, k);
  assert.ok(Math.abs(off(2, 1) - 0.32) < 1e-9);
  assert.equal(off(2, 2), 0);
  ui.msg('swd2', 50);
  assert.ok(Math.abs(off(2, 1) - 0.16) < 1e-9);
  ui.msg('swgrid', 1);
  ui.msg('swd2', 100);
  assert.ok(Math.abs(off(2, 2) - (4 * 0.66 - 2)) < 1e-9);
  ui.msg('ndg2', 20);
  assert.ok(Math.abs(off(2, 0) - 0.2) < 1e-9);
});

test('every lane field the jsui listens for is a real parameter in spec.js', () => {
  const ids = new Set(LANE_PARAMS.filter((p) => p.jsui).map((p) => p.id));
  const fields = Object.keys(loadUI().sandbox.LANE_FIELDS);
  assert.deepEqual(fields.sort(), [...ids].sort());
});
