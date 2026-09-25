'use strict';
// groove-forge-ui.js, run in a stand-in for Max's jsui host.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { loadUI, SCRIPT } = require('./jsui-host');
const { LANE_PARAMS } = require('../src/spec');

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

test('is ES5: the jsui engine in Max 8 and 9 has no let, const, arrows, classes or template strings', () => {
  const src = fs.readFileSync(SCRIPT, 'utf8').replace(/\/\/.*$/gm, '').replace(/'(?:[^'\\]|\\.)*'/g, "''");
  for (const [re, what] of [[/\blet\s/, 'let'], [/\bconst\s/, 'const'], [/=>/, 'arrow function'], [/`/, 'template string'],
    [/\bclass\s/, 'class'], [/\.\.\.[A-Za-z_[]/, 'spread'], [/function\s*\w*\([^)]*=/, 'default parameter'],
    [/\bfor\s*\(\s*var\s+\w+\s+of\b/, 'for...of']]) {
    assert.ok(!re.test(src), 'uses ' + what);
  }
});

test('declares one inlet and one outlet', () => {
  const ui = loadUI();
  assert.equal(ui.sandbox.inlets, 1);
  assert.equal(ui.sandbox.outlets, 1);
});

test('stored values arriving never write anything back (loading a set cannot change a pattern)', () => {
  const ui = loadUI();
  const stored = { pat0: 4369, acc0: 1, rol0: 0, len0: 12, hit0: 3, rot0: 0, pat2: 21845, len2: 7, on1: 0, stt3: 40, wlk3: 25, swd1: 50, ndg2: -10 };
  for (const [k, v] of Object.entries(stored)) ui.msg(k, v);
  ui.msg('swingamt', 62);
  ui.msg('swgrid', 1);
  ui.msg('style', 3);
  ui.msg('sel', 2);
  ui.msg('init');
  assert.deepEqual(ui.take(), []);
  assert.equal(ui.state().len[0], 12);
  assert.equal(ui.state().pat[2], 21845);
  assert.equal(ui.state().on[1], 0);
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
      const ui = loadUI();
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

test('Mutate changes a little and never moves the kick off the floor', () => {
  for (let run = 0; run < 200; run++) {
    const ui = loadUI();
    ui.msg('init');
    ui.msg('mutate');
    const o = ui.take();
    const kick = last(o, 'pat0');
    for (const k of [0, 4, 8, 12]) assert.ok(bits(kick).includes(k));
    let changed = 0;
    const before = [4369, 4112, 52300, 19660];
    for (let l = 0; l < 4; l++) {
      const diff = last(o, 'pat' + l) ^ before[l];
      changed += bits(diff).length;
    }
    assert.ok(changed <= 9, `changed ${changed} steps`);
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
  const ui = loadUI();
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
  const ui = loadUI({ buffers: { '0123gfsrc': { frames, channels: 2, data } } });
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
});

test('paints in every state without a call Max would reject', () => {
  for (const variant of ['inst', 'fx']) {
    const frames = 9600;
    const data = [new Float64Array(frames).map((_, i) => Math.sin(i / 7))];
    const ui = loadUI({ variant, buffers: { buf: { frames, channels: 1, data }, cap: { frames, channels: 2, data: [data[0], data[0]] } } });
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
      const calls = ui.paint();
      assert.ok(calls.length > 100);
    }
    ui.sandbox.onidle(300, 30, 0, 0, 0, 0, 0, 0);
    ui.sandbox.onidle(510, 40, 0, 0, 0, 0, 0, 0);
    ui.sandbox.onidleout();
    ui.paint();
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
