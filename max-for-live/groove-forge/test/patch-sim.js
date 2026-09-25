'use strict';
// A small interpreter for the message side of a generated device.
//
// It runs the patch the way Max would pass messages through it: prepend,
// route, trigger, pak, expr, select, gate, counter, message boxes, the live.*
// parameter objects, the MIDI objects, thispatcher's show/hide scripting, and
// the real display script, once per jsui box. Signals are not simulated; gen~ just records every message
// it is sent. That is enough to prove the wiring: that a knob reaches the
// Param it is named for, that a click on the grid lands in the stored pattern
// and then in gen~, that the right knobs show for a lane and page.

const { loadUI } = require('./jsui-host');

const isNum = (x) => typeof x === 'number';
const numMsg = (v) => (Number.isInteger(v) ? { sel: 'int', args: [v] } : { sel: 'float', args: [v] });

// Turn an atom list into a Max message the way a message box does.
function atomsToMsg(atoms) {
  if (!atoms.length) return { sel: 'bang', args: [] };
  if (isNum(atoms[0])) return atoms.length === 1 ? numMsg(atoms[0]) : { sel: 'list', args: atoms };
  if (atoms[0] === 'bang' && atoms.length === 1) return { sel: 'bang', args: [] };
  return { sel: atoms[0], args: atoms.slice(1) };
}
function parseAtoms(text) {
  return text.trim().split(/\s+/).filter(Boolean).map((t) => (/^-?\d+(\.\d+)?$/.test(t) ? Number(t) : t));
}
// The atoms of a message, typed selector dropped (what prepend and pack see).
function msgAtoms(m) {
  if (['int', 'float', 'list', 'symbol'].includes(m.sel)) return m.args.slice();
  if (m.sel === 'bang') return [];
  return [m.sel, ...m.args];
}

class PatchSim {
  constructor(patcher, { variant, buffers = {}, uniq = '012' } = {}) {
    this.variant = variant;
    this.boxes = new Map();
    this.wires = new Map();
    this.gen = {}; // Param or buffer binding -> last value
    this.genLog = [];
    this.visible = new Map();
    this.scripts = [];
    this.queue = [];
    this.params = new Map(); // longname -> box id
    this.uis = new Map(); // jsui box id -> its running script
    this.views = {}; // part -> { ui, box }
    this.uniq = uniq;
    for (const { box } of patcher.boxes) {
      const b = { ...box };
      if (b.text) b.text = b.text.replace(/---/g, uniq); // Max for Live's device-unique names
      this.boxes.set(b.id, b);
      this.visible.set(b.id, !b.hidden);
      const lv = b.saved_attribute_attributes && b.saved_attribute_attributes.valueof;
      if (lv && lv.parameter_longname) this.params.set(lv.parameter_longname, b.id);
    }
    for (const { patchline } of patcher.lines) {
      const key = patchline.source[0] + ':' + patchline.source[1];
      if (!this.wires.has(key)) this.wires.set(key, []);
      this.wires.get(key).push(patchline.destination);
    }
    for (const b of this.boxes.values()) this.init(b, buffers);
  }

  init(b, buffers) {
    const lv = b.saved_attribute_attributes && b.saved_attribute_attributes.valueof;
    if (lv) {
      b.value = lv.parameter_initial ? lv.parameter_initial[0] : 0;
      b.isEnum = lv.parameter_type === 2;
      b.isInt = lv.parameter_type === 1;
      b.min = lv.parameter_mmin ?? 0;
      b.max = lv.parameter_mmax ?? (lv.parameter_enum ? lv.parameter_enum.length - 1 : 1);
    }
    if (b.maxclass === 'jsui') {
      const [variant, part] = b.jsarguments;
      const ui = loadUI({ variant, part, rect: b.presentation_rect, buffers });
      this.uis.set(b.id, ui);
      this.views[part] = { ui, box: b };
    }
    if (b.maxclass === 'newobj') {
      const words = parseAtoms(b.text);
      b.cls = words[0];
      b.argv = words.slice(1).filter((w) => !(typeof w === 'string' && w.startsWith('@')));
      if (b.cls === 'pak' || b.cls === 'pack') b.slots = b.argv.slice();
      if (b.cls === 'expr') b.slots = [0, 0, 0, 0];
      if (b.cls === 'gate') b.open = b.argv[1] || 0;
      if (b.cls === 'counter') b.count = b.argv.length >= 2 ? b.argv[0] : 0;
      if (b.cls === 'stripnote' || b.cls === 'borax') { b.vel = 0; b.held = new Set(); }
    }
  }

  emit(b, outlet, m) {
    for (const [dst, inlet] of this.wires.get(b.id + ':' + outlet) || []) this.send(this.boxes.get(dst), inlet, m);
  }

  // A value arriving at a parameter object: set it, then output it.
  setParam(b, v, output = true) {
    if (b.isEnum || b.isInt || b.maxclass === 'live.tab' || b.maxclass === 'live.menu' || b.maxclass === 'live.text') v = Math.round(v);
    v = Math.min(b.max, Math.max(b.min, v));
    b.value = v;
    if (output) this.emit(b, 0, b.isEnum || b.isInt ? { sel: 'int', args: [v] } : numMsg(v));
  }

  send(b, inlet, m) {
    const atoms = msgAtoms(m);
    switch (b.maxclass) {
      case 'live.dial':
      case 'live.numbox':
      case 'live.menu':
      case 'live.tab':
      case 'live.text':
        if (m.sel === 'bang') {
          if (b.maxclass === 'live.text' && b.mode === 0) return this.emit(b, 0, { sel: 'bang', args: [] });
          return this.emit(b, 0, b.isEnum || b.isInt ? { sel: 'int', args: [b.value] } : numMsg(b.value));
        }
        if (isNum(atoms[0])) return this.setParam(b, atoms[0]);
        throw new Error(`${b.varname} got ${m.sel}`);
      case 'live.gain~':
      case 'live.drop':
      case 'live.comment':
      case 'panel':
        return;
      case 'message': {
        for (const part of b.text.split(/\s*,\s*/)) this.emit(b, 0, atomsToMsg(parseAtoms(part)));
        return;
      }
      case 'jsui': {
        const ui = this.uis.get(b.id);
        const before = ui.outputs.length;
        ui.msg(m.sel === 'int' || m.sel === 'float' ? 'msg_' + m.sel : m.sel, ...m.args);
        return this.flushUI(b, before);
      }
      case 'newobj':
        return this.obj(b, inlet, m, atoms);
      default:
        throw new Error('no behaviour for ' + b.maxclass);
    }
  }

  flushUI(box, from = 0) {
    const outs = this.uis.get(box.id).outputs.splice(from);
    for (const o of outs) this.emit(box, o[0], atomsToMsg(o.slice(1)));
  }

  // the grid part, and the source part
  get ui() {
    return this.views.grid.ui;
  }
  get sourceUI() {
    return this.views.source.ui;
  }
  // everything any display has sent and not yet passed on
  pendingOutputs() {
    return [...this.uis.values()].flatMap((ui) => ui.outputs);
  }

  obj(b, inlet, m, atoms) {
    const a = b.argv;
    switch (b.cls) {
      case 'gen~': {
        if (inlet !== 0) return;
        if (m.sel === 'int' || m.sel === 'float' || m.sel === 'list' || m.sel === 'bang') throw new Error('gen~ got a bare ' + m.sel);
        this.gen[m.sel] = m.args[0];
        this.genLog.push([m.sel, ...m.args]);
        return;
      }
      case 'prepend':
        return this.emit(b, 0, { sel: a[0], args: atoms });
      case 'route': {
        if (inlet !== 0) return;
        const first = ['int', 'float', 'list'].includes(m.sel) ? m.args[0] : m.sel;
        const rest = ['int', 'float', 'list'].includes(m.sel) ? m.args.slice(1) : m.args;
        const i = a.indexOf(first);
        if (i >= 0) return this.emit(b, i, atomsToMsg(rest));
        return this.emit(b, a.length, m);
      }
      case 't':
      case 'trigger':
        for (let i = a.length - 1; i >= 0; i--) {
          const f = a[i];
          if (f === 'b') this.emit(b, i, { sel: 'bang', args: [] });
          else if (f === 'i') this.emit(b, i, { sel: 'int', args: [Math.trunc(atoms[0] ?? 0)] });
          else if (f === 'f') this.emit(b, i, { sel: 'float', args: [atoms[0] ?? 0] });
          else if (f === 'l' || f === 'a') this.emit(b, i, m);
          else if (f === 's') this.emit(b, i, { sel: 'symbol', args: [String(atoms[0])] });
          else this.emit(b, i, isNum(f) ? numMsg(f) : { sel: 'symbol', args: [f] });
        }
        return;
      case 'pak':
      case 'pack':
        if (m.sel === 'list' && inlet === 0) m.args.forEach((v, i) => (b.slots[i] = v));
        else if (atoms.length) b.slots[inlet] = atoms[0];
        if (b.cls === 'pack' && inlet !== 0) return;
        return this.emit(b, 0, { sel: 'list', args: b.slots.slice() });
      case 'expr': {
        if (m.sel === 'list') m.args.forEach((v, i) => (b.slots[i] = v));
        else if (atoms.length) b.slots[inlet] = atoms[0];
        if (inlet !== 0) return;
        const js = b.text.slice(5).replace(/\$[if](\d+)/g, (_, n) => `(${b.slots[n - 1]})`);
        // eslint-disable-next-line no-new-func
        const v = new Function('return (' + js + ') ? (' + js + ') : 0;')();
        return this.emit(b, 0, numMsg(typeof v === 'boolean' ? +v : v));
      }
      case 'sel':
      case 'select': {
        if (inlet !== 0) return;
        const i = a.indexOf(atoms[0]);
        if (i >= 0) return this.emit(b, i, { sel: 'bang', args: [] });
        return this.emit(b, a.length, m);
      }
      case 'gate':
        if (inlet === 0) { b.open = atoms[0]; return; }
        if (b.open) this.emit(b, 0, m);
        return;
      case 'counter':
        if (inlet !== 0) return;
        this.emit(b, 0, { sel: 'int', args: [b.count] });
        b.count++;
        return;
      case 'delay':
        if (inlet === 0 && m.sel === 'bang') this.queue.push(() => this.emit(b, 0, { sel: 'bang', args: [] }));
        return;
      case 'thispatcher': {
        if (m.sel !== 'script') throw new Error('thispatcher got ' + m.sel);
        const [cmd, name] = m.args;
        const target = [...this.boxes.values()].find((x) => x.varname === name);
        if (!target) throw new Error('script ' + cmd + ' of unknown ' + name);
        this.scripts.push([cmd, name]);
        this.visible.set(target.id, cmd === 'show');
        return;
      }
      case 'buffer~':
        if (m.sel === 'replace') this.emit(b, 1, { sel: 'bang', args: [] });
        return;
      case 'info~':
        return this.emit(b, 0, { sel: 'float', args: [44100] });
      case 'stripnote':
        if (inlet === 1) { b.vel = atoms[0]; return; }
        if (b.vel > 0) {
          this.emit(b, 1, { sel: 'int', args: [b.vel] });
          this.emit(b, 0, { sel: 'int', args: [atoms[0]] });
        }
        return;
      case 'borax':
        if (inlet === 1) { b.vel = atoms[0]; return; }
        if (inlet === 2) { b.held.clear(); return this.emit(b, 2, { sel: 'int', args: [0] }); }
        if (b.vel > 0) b.held.add(atoms[0]);
        else b.held.delete(atoms[0]);
        return this.emit(b, 2, { sel: 'int', args: [b.held.size] });
      case 'live.thisdevice':
      case 'phasor~':
      case 'plugin~':
      case 'plugout~':
      case 'snapshot~':
      case 'notein':
      case 'thisdevice':
        return;
      default:
        throw new Error('no behaviour for [' + b.text + ']');
    }
  }

  flushQueue() {
    while (this.queue.length) this.queue.shift()();
  }

  // What happens when Live loads the device: every parameter object restores
  // and outputs its value, then live.thisdevice fires, then scheduled things run.
  load(stored = {}) {
    for (const b of this.boxes.values()) {
      if (b.value === undefined) continue;
      const lv = b.saved_attribute_attributes.valueof;
      if (lv.parameter_longname in stored) b.value = stored[lv.parameter_longname];
      // buttons too: Live restores their stored 0 like any other parameter
      this.emit(b, 0, b.isEnum || b.isInt ? { sel: 'int', args: [b.value] } : numMsg(b.value));
    }
    const dev = [...this.boxes.values()].find((b) => b.cls === 'live.thisdevice');
    this.emit(dev, 0, { sel: 'bang', args: [] });
    this.flushQueue();
  }

  // A preset recall or Live's undo: stored values come back, nothing else runs.
  recall(stored = {}) {
    for (const b of this.boxes.values()) {
      if (b.value === undefined) continue;
      const lv = b.saved_attribute_attributes.valueof;
      if (lv.parameter_longname in stored) b.value = stored[lv.parameter_longname];
      this.emit(b, 0, b.isEnum || b.isInt ? { sel: 'int', args: [b.value] } : numMsg(b.value));
    }
    this.flushQueue();
  }

  byVar(v) {
    const b = [...this.boxes.values()].find((x) => x.varname === v);
    if (!b) throw new Error('no box ' + v);
    return b;
  }
  param(longname) {
    return this.boxes.get(this.params.get(longname));
  }
  // Turn a knob, pick a menu item, press a button: what the mouse does.
  turn(longname, v) {
    this.setParam(this.param(longname), v);
    this.flushQueue();
  }
  press(longname) {
    this.emit(this.param(longname), 0, { sel: 'bang', args: [] });
    this.flushQueue();
  }
  drop(path) {
    const d = [...this.boxes.values()].find((b) => b.maxclass === 'live.drop');
    this.emit(d, 0, { sel: 'symbol', args: [path] });
    this.flushQueue();
  }
  note(pitch, vel) {
    const n = [...this.boxes.values()].find((b) => b.cls === 'notein');
    this.emit(n, 2, { sel: 'int', args: [1] });
    this.emit(n, 1, { sel: 'int', args: [vel] });
    this.emit(n, 0, { sel: 'int', args: [pitch] });
  }
  // Use a display with the mouse: the grid part unless told otherwise.
  uiDo(fn, part = 'grid') {
    const { ui, box } = this.views[part];
    const before = ui.outputs.length;
    fn(ui);
    this.flushUI(box, before);
    this.flushQueue();
  }
  isShown(varname) {
    return this.visible.get(this.byVar(varname).id);
  }
}

module.exports = { PatchSim };
