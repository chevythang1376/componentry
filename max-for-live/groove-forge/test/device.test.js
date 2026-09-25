'use strict';
// The generated devices: their container, their parameters, and their wiring,
// the last run through a message-passing simulation of the patch with the real
// jsui inside it.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { buildAll, L, UI_SCRIPT, CARD_COLOR } = require('../src/build');
const { unpackAmxd, amxdType, FROZEN } = require('../src/amxd');
const { loadUI, SCRIPT } = require('./jsui-host');
const { buildEngine } = require('../src/genexpr');
const { engineParams, LANE_PARAMS, GLOBAL_PARAMS, LANES } = require('../src/spec');
const { PatchSim } = require('./patch-sim');

const devices = buildAll({ write: false });
const byVariant = Object.fromEntries(devices.map((d) => [d.variant, d]));
const patcherOf = (d) => JSON.parse(d.json).patcher;
const sim = (variant, opts) => {
  const s = new PatchSim(patcherOf(byVariant[variant]), { variant, ...opts });
  return s;
};
const bits = (m) => [...Array(16).keys()].filter((k) => (m >> k) & 1);

test('each .amxd is a frozen device of the right type: its patcher and its display script, in one file', () => {
  const script = fs.readFileSync(SCRIPT);
  for (const d of devices) {
    const u = unpackAmxd(d.bytes);
    assert.equal(u.deviceType, d.deviceType);
    assert.equal(u.meta, FROZEN);
    assert.equal(u.name, d.file, 'Max files the main patcher under the device\'s own name');
    assert.equal(u.json, d.json);
    const main = u.directory[0];
    assert.deepEqual([main.type, main.flag, main.offset, main.size], ['JSON', 17, 16, Buffer.byteLength(d.json) + 1]);
    assert.equal(u.files.length, 1, 'one frozen file');
    const [js] = u.files;
    assert.deepEqual([js.type, js.name, js.flag], ['TEXT', UI_SCRIPT, 0]);
    assert.ok(js.data.equals(script), 'the frozen script is the source, byte for byte');
    const p = JSON.parse(u.json).patcher;
    assert.equal(p.project.amxdtype, amxdType(d.deviceType));
    assert.deepEqual(p.project.contents, { patchers: {} });
    assert.equal(p.openinpresentation, 1);
    assert.equal(p.devicewidth, L.width);
    const jsuis = p.boxes.filter((b) => b.box.maxclass === 'jsui').map((b) => b.box);
    assert.equal(jsuis.length, 2);
    for (const j of jsuis) assert.equal(j.filename, UI_SCRIPT, 'the displays load the script by the name it is frozen under');
  }
  assert.equal(byVariant.inst.deviceType, 'instrument');
  assert.equal(byVariant.fx.deviceType, 'audio_effect');
});

test('the committed .amxd files are exactly what the sources build (run npm run build after editing)', () => {
  for (const d of devices) {
    const file = path.join(__dirname, '..', d.file);
    assert.ok(fs.existsSync(file), d.file + ' exists');
    assert.ok(fs.readFileSync(file).equals(d.bytes), d.file + ' is stale: run npm run build');
  }
});

test('the build is reproducible: same source, same bytes', () => {
  const again = buildAll({ write: false });
  for (let i = 0; i < devices.length; i++) assert.ok(again[i].bytes.equals(devices[i].bytes));
});

test('gen~ carries the expanded engine, with three inlets and five outlets', () => {
  for (const d of devices) {
    const gen = patcherOf(d).boxes.find((b) => b.box.text === 'gen~').box;
    const codebox = gen.patcher.boxes.find((b) => b.box.maxclass === 'codebox').box;
    assert.equal(codebox.code, buildEngine());
    assert.equal(gen.numinlets, 3);
    assert.equal(gen.numoutlets, 5);
    assert.equal(gen.patcher.classnamespace, 'dsp.gen');
  }
});

test('every Live parameter is well formed: in range, named once, enums complete', () => {
  for (const d of devices) {
    const names = new Set();
    for (const { box } of patcherOf(d).boxes) {
      const v = box.saved_attribute_attributes && box.saved_attribute_attributes.valueof;
      if (!v || box.maxclass === 'live.drop') continue;
      assert.ok(!names.has(v.parameter_longname), 'duplicate ' + v.parameter_longname);
      names.add(v.parameter_longname);
      assert.ok(v.parameter_shortname, v.parameter_longname + ' has a short name');
      if (v.parameter_type === 2) {
        assert.equal(v.parameter_enum.length, v.parameter_mmax + 1);
        assert.ok(v.parameter_initial[0] >= 0 && v.parameter_initial[0] <= v.parameter_mmax);
      } else {
        assert.ok(v.parameter_initial[0] >= v.parameter_mmin && v.parameter_initial[0] <= v.parameter_mmax, v.parameter_longname);
      }
    }
  }
});

test('each display is the same size in patching and presentation, and is told where it sits', () => {
  for (const d of devices) {
    const boxes = patcherOf(d).boxes;
    const views = boxes.filter((b) => b.box.maxclass === 'jsui').map((b) => b.box);
    assert.deepEqual(views.map((j) => j.jsarguments.slice(0, 2)), [[d.variant, 'source'], [d.variant, 'grid']]);
    assert.deepEqual(views.map((j) => j.presentation_rect), [L.srcView, L.gridView]);
    for (const j of views) {
      // a jsui maps its drawing and its mouse to its patching size
      assert.deepEqual(j.patching_rect.slice(2), j.presentation_rect.slice(2));
      // and draws and hears the mouse relative to this origin
      assert.deepEqual(j.jsarguments.slice(2), j.presentation_rect.slice(0, 2));
      // nothing else in the patching view sits on top of it
      for (const { box } of boxes) {
        if (box === j) continue;
        const [x, y, w, h] = box.patching_rect;
        const [jx, jy, jw, jh] = j.patching_rect;
        assert.ok(!(x < jx + jw && jx < x + w && y < jy + jh && jy < y + h), `${box.text || box.maxclass} overlaps ${j.varname} in the patching view`);
      }
    }
  }
});

test('nothing sits under a display: in Live a jsui listed before a control hides it', () => {
  for (const d of devices) {
    const shown = patcherOf(d).boxes.map((b) => b.box).filter((b) => b.presentation);
    for (const j of shown.filter((b) => b.maxclass === 'jsui')) {
      for (const b of shown) {
        if (b === j || b.background) continue;
        const [ax, ay, aw, ah] = j.presentation_rect;
        const [bx, by, bw, bh] = b.presentation_rect;
        assert.ok(!(ax < bx + bw && bx < ax + aw && ay < by + bh && by < ay + ah), `${b.varname || b.maxclass} is under ${j.varname}`);
      }
    }
  }
});

test('the dark cards are background panels, at the back of the list, the colour the displays paint', () => {
  const BG = loadUI().sandbox.BG;
  for (const d of devices) {
    const boxes = patcherOf(d).boxes.map((b) => b.box);
    const cards = boxes.filter((b) => b.maxclass === 'panel');
    assert.deepEqual(cards.map((c) => c.presentation_rect), [L.srcCard, L.gridCard]);
    assert.deepEqual(boxes.slice(-cards.length), cards, 'last in the list');
    for (const c of cards) {
      assert.equal(c.background, 1);
      assert.equal(c.ignoreclick, 1);
      assert.deepEqual(c.bgcolor, [...BG, 1]);
    }
    assert.deepEqual(CARD_COLOR, [...BG, 1]);
    // each display lies inside its card, clear of the rounded corners
    const [sv, gv] = [L.srcView, L.gridView];
    for (const [v, c] of [[sv, L.srcCard], [gv, L.gridCard]]) {
      assert.ok(v[0] >= c[0] + 2 && v[1] >= c[1] + 2 && v[0] + v[2] <= c[0] + c[2] - 2 && v[1] + v[3] <= c[1] + c[3] - 2);
    }
  }
});

test('pattern storage is hidden from the device and from automation, but stored', () => {
  for (const d of devices) {
    const stores = patcherOf(d).boxes.filter((b) => /^gf_(pat|acc|rol|len|hit|rot)\d$/.test(b.box.varname || ''));
    assert.equal(stores.length, 24);
    for (const { box } of stores) {
      assert.ok(!box.presentation);
      assert.equal(box.saved_attribute_attributes.valueof.parameter_invisible, 1);
    }
  }
});

test('no two visible boxes overlap, displays included (the cards are behind them all)', () => {
  for (const d of devices) {
    const boxes = patcherOf(d).boxes.map((b) => b.box).filter((b) => b.presentation && !b.hidden && !b.background);
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const [ax, ay, aw, ah] = boxes[i].presentation_rect;
        const [bx, by, bw, bh] = boxes[j].presentation_rect;
        const overlap = ax < bx + bw && bx < ax + aw && ay < by + bh && by < ay + ah;
        assert.ok(!overlap, `${boxes[i].varname || boxes[i].text} overlaps ${boxes[j].varname || boxes[j].text}`);
      }
    }
  }
});

test('the lane editor holds every lane parameter, one page at a time', () => {
  const p = patcherOf(byVariant.inst);
  const pageParams = LANE_PARAMS.filter((q) => ['sound', 'shape', 'groove'].includes(q.page));
  for (let l = 0; l < LANES.length; l++) {
    for (const q of pageParams) {
      const box = p.boxes.find((b) => b.box.varname === 'gf_' + q.id + l);
      assert.ok(box, 'control for ' + q.id + l);
      assert.equal(!!box.box.hidden, !(l === 0 && q.page === 'sound'), 'only Kick SOUND shows before load');
    }
  }
});

for (const variant of ['inst', 'fx']) {
  test(`${variant}: loading sets every engine Param from its knob, binds the buffers, and shows Kick SOUND`, () => {
    const s = sim(variant);
    s.load();
    for (const p of engineParams()) {
      const idle = variant === 'fx' ? /^(kf_|arp|holdmode)/.test(p.name) : /^(srcsel|capbars|capauto|thruamt|capgo)$/.test(p.name);
      const loadedBy = /^(kf_|arp|capgo)/.test(p.name); // set by playing or pressing, not by loading
      if (idle || loadedBy) continue;
      assert.ok(p.name in s.gen, `${p.name} reached gen~`);
      if (p.name !== 'src_sr') assert.equal(s.gen[p.name], p.def, `${p.name} default`);
    }
    assert.equal(s.gen.smp, '012gfsrc', 'sample buffer bound by its device-unique name');
    assert.equal(s.gen.cap, '012gfcap');
    assert.equal(s.sourceUI.state().bufName, '012gfsrc');
    assert.ok(s.isShown('gf_tun0') && s.isShown('gf_syn0') && s.isShown('gf_lbl_syn0'));
    assert.ok(!s.isShown('gf_tun1') && !s.isShown('gf_atk0') && !s.isShown('gf_chc3'));
  });

  test(`${variant}: a stored set loads without the grid rewriting anything`, () => {
    const s = sim(variant);
    s.load({ 'Kick Steps': 1 + 256, 'Tone Steps Length': 7, 'Hats Accents': 4, 'Edit Lane': 2, 'Edit Page': 1 });
    assert.equal(s.gen.pat0, 257);
    assert.equal(s.gen.len3, 7);
    assert.equal(s.ui.state().pat[0], 257);
    assert.deepEqual(s.pendingOutputs(), []);
    assert.ok(s.isShown('gf_cut2'), 'Hats SHAPE shows');
    assert.ok(!s.isShown('gf_tun0'));
  });

  test(`${variant}: loading a set or recalling a preset never presses a button`, () => {
    const s = sim(variant);
    const stored = { 'Kick Steps': 1 + 16, 'Clap Steps': 4096, 'Hats Steps': 4, 'Tone Steps': 2, Generate: 0, Mutate: 0, Clear: 0, Undo: 0 };
    s.load(stored);
    s.recall(stored);
    assert.deepEqual([s.gen.pat0, s.gen.pat1, s.gen.pat2, s.gen.pat3], [17, 4096, 4, 2], 'patterns as stored');
    assert.equal(s.ui.state().pat[2], 4);
    if (variant === 'fx') {
      assert.equal(s.gen.srcsel, 0, 'Capture did not fire');
      assert.equal(s.gen.capgo, undefined);
    }
  });

  test(`${variant}: clicking the grid lands in the stored pattern, then in gen~`, () => {
    const s = sim(variant);
    s.load();
    s.uiDo((ui) => { ui.click(226 + 2 * 17 + 7, 16 + 1 * 20 + 9); ui.release(0, 0); }); // Clap, step 3
    assert.ok(bits(s.param('Clap Steps').value).includes(2), 'stored');
    assert.ok(bits(s.gen.pat1).includes(2), 'engine');
    assert.equal(s.param('Edit Lane').value, 1, 'the clicked lane is now the one being edited');
    assert.ok(s.isShown('gf_tun1') && !s.isShown('gf_tun0'), 'and its knobs show');
  });

  test(`${variant}: choosing a lane and a page shows exactly those knobs`, () => {
    const s = sim(variant);
    s.load();
    const pages = ['sound', 'shape', 'groove'];
    const editor = LANE_PARAMS.filter((q) => pages.includes(q.page));
    for (const [lane, page] of [[3, 2], [0, 1], [2, 0], [1, 2], [0, 0]]) {
      s.turn('Edit Lane', lane);
      s.turn('Edit Page', page);
      for (let l = 0; l < LANES.length; l++) {
        for (const q of editor) {
          const want = l === lane && q.page === pages[page];
          assert.equal(s.isShown('gf_' + q.id + l), want, `${q.id}${l} with lane ${lane} page ${page}`);
          if (q.kind === 'enum') assert.equal(s.isShown('gf_lbl_' + q.id + l), want, 'its label too');
        }
      }
    }
  });

  test(`${variant}: knobs reach gen~ by name, and the ones the display draws reach it too`, () => {
    const s = sim(variant);
    s.load();
    s.turn('Hats Cutoff', 5000);
    assert.equal(s.gen.cut2, 5000);
    s.turn('Swing', 66);
    assert.equal(s.gen.swingamt, 66);
    assert.equal(s.ui.state().swing, 66);
    s.turn('Tone Start', 42);
    assert.equal(s.gen.stt3, 42);
    assert.equal(s.ui.state().stt[3], 42);
    s.turn('Clap On', 0);
    assert.equal(s.gen.on1, 0);
    assert.equal(s.ui.state().on[1], 0);
    s.turn('Filter', -60);
    assert.equal(s.gen.djf, -60);
    s.turn('Delay Time', 5);
    assert.equal(s.gen.dtime, 5);
  });

  test(`${variant}: clicking the waveform moves the selected lane's Start knob`, () => {
    const s = sim(variant);
    s.load();
    s.turn('Edit Lane', 2);
    s.uiDo((ui) => ui.click(10 + 158 * 0.75, 40), 'source');
    assert.equal(s.param('Hats Start').value, 75);
    assert.equal(s.gen.stt2, 75);
    assert.equal(s.sourceUI.state().stt[2], 75, 'the marker moves with it');
  });

  test(`${variant}: both displays hear what they draw, and each press or note does its work once`, () => {
    const s = sim(variant);
    s.load();
    s.uiDo((ui) => { ui.click(226 + 5 * 17 + 7, 16 + 3 * 20 + 9); ui.release(0, 0); });
    assert.equal(s.ui.state().sel, 3);
    assert.equal(s.sourceUI.state().sel, 3, 'a lane picked on the grid is the lane the waveform edits');
    s.turn('Tone Walk', 40);
    assert.equal(s.sourceUI.state().wlk[3], 40);
    const count = (name) => s.genLog.filter((m) => m[0] === name).length;
    const before = count('pat0');
    s.press('Generate');
    assert.equal(count('pat0') - before, 1, 'one Generate, one new kick pattern');
    if (variant === 'inst') {
      const notes = count('arp_n');
      s.note(62, 100);
      assert.equal(count('arp_n') - notes, 1, 'one note, one chord update');
    }
  });

  test(`${variant}: Generate, Mutate, Clear and Undo drive the stored patterns`, () => {
    const s = sim(variant);
    s.load();
    s.turn('Style', 4);
    s.press('Generate');
    const lens = [0, 1, 2, 3].map((l) => s.gen['len' + l]);
    assert.ok(lens.some((n) => n !== 16), 'Hypnotic reached gen~');
    s.turn('Edit Lane', 1);
    s.press('Clear');
    assert.equal(s.gen.pat1, 0);
    s.press('Undo');
    assert.notEqual(s.gen.pat1, 0);
    s.press('Mutate');
    for (const k of [0, 4, 8, 12]) {
      if (lens[0] === 16 && bits(s.param('Kick Steps').value).includes(k)) assert.ok(bits(s.gen.pat0).includes(k));
    }
  });
}

test('inst: the keyboard sets the note, the gate and the chord', () => {
  const s = sim('inst');
  s.load();
  s.note(64, 100);
  assert.equal(s.gen.kf_note, 64);
  assert.equal(s.gen.kf_gate, 1);
  s.note(67, 90);
  s.note(71, 90);
  assert.equal(s.gen.arp_n, 3);
  assert.deepEqual([s.gen.arp0, s.gen.arp1, s.gen.arp2], [64, 67, 71]);
  s.note(64, 0);
  s.note(67, 0);
  assert.equal(s.gen.kf_gate, 1, 'still one key down');
  s.note(71, 0);
  assert.equal(s.gen.kf_gate, 0);
  assert.equal(s.gen.kf_note, 71, 'the last note stays');
  assert.equal(s.gen.arp_n, 3, 'and so does the chord');
  s.turn('Play', 1);
  assert.equal(s.gen.holdmode, 1);
});

test('fx: Capture switches the source to Live and asks gen~ to record, every press', () => {
  const s = sim('fx');
  s.load();
  assert.equal(s.gen.srcsel, 0);
  s.press('Capture');
  assert.equal(s.gen.srcsel, 1);
  const first = s.gen.capgo;
  assert.ok(first > 0, 'a press is a change gen~ can see');
  s.press('Capture');
  assert.notEqual(s.gen.capgo, first, 'and so is the next one');
  s.turn('Auto Capture', 2);
  assert.equal(s.gen.capauto, 2);
  s.turn('Thru', 50);
  assert.equal(s.gen.thruamt, 50);
});

test('fx: dropping a sample makes it the source, but a stored sample reloading does not override Live', () => {
  const s = sim('fx');
  // while the set loads, the stored sample comes back after Source = Live
  s.turn('Source', 1);
  s.drop('/Users/me/stored.wav');
  assert.equal(s.gen.srcsel, 1, 'a reload during load leaves Source alone');
  s.load({ Source: 1 });
  assert.equal(s.gen.srcsel, 1);
  s.drop('/Users/me/new.wav');
  assert.equal(s.gen.srcsel, 0, 'a drop by hand switches to the sample');
  assert.equal(s.gen.src_sr, 44100, 'and the file rate reaches gen~');
});

test('every global knob in spec.js exists on the device it belongs to', () => {
  for (const d of devices) {
    const p = patcherOf(d);
    for (const g of GLOBAL_PARAMS) {
      const belongs = !g.variant || g.variant === d.variant;
      const box = p.boxes.find((b) => b.box.varname === 'gf_' + g.id);
      assert.equal(!!box, belongs, `${g.id} on ${d.variant}`);
    }
  }
});
