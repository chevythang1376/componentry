'use strict';
// Builds both Groove Forge devices from spec.js and engine.genexpr:
//
//   Groove Forge.amxd      Max Instrument: play it from a MIDI track
//   Groove Forge FX.amxd   Max Audio Effect: feed it any track's audio
//
// Both are frozen: the display script is written inside each .amxd, so a
// device is one file that works wherever it is put.
//
// Every knob is generated from its entry in spec.js and wired to gen~ by name,
// so there is no hand-drawn patch cord to get wrong. validate() then checks
// every cord against the port counts of the object at each end, every Param in
// the engine against the knob (or patch logic) that drives it, and every Live
// parameter name for uniqueness, before anything is written.
//
//   node src/build.js            write both devices next to this folder
//   node src/build.js --check    build and validate, write nothing

const fs = require('fs');
const path = require('path');
const { LANES, LANE_PARAMS, GLOBAL_PARAMS, ENGINE_INPUTS, UNIT_STYLE, laneParamName, engineParams } = require('./spec');
const { buildEngine } = require('./genexpr');
const { packAmxd, projectBlock, MAX_EPOCH_OFFSET } = require('./amxd');

const ROOT = path.join(__dirname, '..');
// The display script, frozen into both devices under this name. A new name
// for a new layout: a stale copy of the old script, anywhere Max looks, can
// never stand in for it.
const UI_SCRIPT = 'groove-forge-display.js';
const DEVICE_HEIGHT = 169;
// A fixed date keeps the build reproducible: the same source gives the same bytes.
const BUILD_TIME = Date.UTC(2026, 8, 25) / 1000 + MAX_EPOCH_OFFSET;

// ------------------------------------------------------------------ ports
// Inlets and outlets of every object the devices use. A cord that names a
// port an object does not have is dropped by Max without a word, so the
// builder refuses to write one.
function portsFor(text) {
  const words = text.trim().split(/\s+/);
  const name = words[0];
  const args = words.slice(1).filter((w) => !w.startsWith('@'));
  const S = 'signal';
  const table = {
    'live.thisdevice': [1, ['bang', 'int', 'int']],
    'phasor~': [2, [S]],
    'plugin~': [2, [S, S]],
    'plugout~': [2, [S, S]],
    'snapshot~': [2, ['float']],
    prepend: [1, ['']],
    'buffer~': [1, ['float', 'bang']],
    'info~': [1, ['float', 'list', 'float', 'float', 'float', 'float', 'float', '', 'int', '']],
    notein: [1, ['int', 'int', 'int']],
    stripnote: [2, ['int', 'int']],
    borax: [3, ['int', 'int', 'int', 'int', 'int', 'int', 'int', 'int', 'int']],
    pack: [Math.max(1, args.length), ['']],
    pak: [Math.max(1, args.length), ['']],
    expr: [Math.max(1, (text.match(/\$[if](\d+)/g) || []).reduce((m, t) => Math.max(m, +t.slice(2)), 1)), ['']],
    counter: [5, ['int', '', '', 'int']],
    gate: [2, ['']],
    delay: [2, ['bang']],
    thispatcher: [1, ['', '']],
  };
  if (name === 't' || name === 'trigger') return { inlets: 1, outlets: args.length, types: args.map((a) => (a === 'b' ? 'bang' : a === 'i' ? 'int' : a === 'f' ? 'float' : '')) };
  if (name === 'route' || name === 'sel' || name === 'select') return { inlets: 2, outlets: args.length + 1, types: new Array(args.length + 1).fill('') };
  const t = table[name];
  if (!t) throw new Error('no port table entry for [' + text + ']');
  return { inlets: t[0], outlets: t[1].length, types: t[1] };
}

// ------------------------------------------------------------------ the patch
class Patch {
  constructor(variant) {
    this.variant = variant;
    this.boxes = [];
    this.lines = [];
    this.n = 0;
    this.byVar = new Map();
    this.paramNames = new Map();
    this.drives = new Map(); // gen~ Param name -> what sets it
    this.cursor = {};
  }
  id() {
    return 'obj-' + ++this.n;
  }
  // Patching-view position: each section gets a column, filled top to bottom,
  // so the patch is readable when opened in Max.
  place(section, w = 100, h = 22) {
    const cols = ['core', 'engine', 'ui', 'midi', 'source', 'groove', 'fx', 'lanes', 'store', 'pages'];
    let col = cols.indexOf(section);
    if (col < 0) col = cols.length;
    const c = (this.cursor[section] = this.cursor[section] || { y: 20, x: 20 + col * 190 });
    const rect = [c.x, c.y, w, h];
    c.y += h + 10;
    if (c.y > 3000) {
      c.y = 20;
      c.x += 130;
    }
    return rect;
  }
  add(box, section) {
    const id = this.id();
    box.id = id;
    if (!box.patching_rect) box.patching_rect = this.place(section, box._pw || 100, box._ph || 22);
    delete box._pw;
    delete box._ph;
    this.boxes.push({ box });
    if (box.varname) {
      if (this.byVar.has(box.varname)) throw new Error('duplicate varname ' + box.varname);
      this.byVar.set(box.varname, box);
    }
    return box;
  }
  obj(text, section, extra = {}) {
    const p = portsFor(text);
    return this.add({ maxclass: 'newobj', text, numinlets: p.inlets, numoutlets: p.outlets, outlettype: p.types, _pw: Math.max(60, text.length * 6.5 + 16), ...extra }, section);
  }
  msg(text, section) {
    return this.add({ maxclass: 'message', text, numinlets: 2, numoutlets: 1, outlettype: [''], _pw: Math.min(400, Math.max(40, text.length * 6.5 + 14)) }, section);
  }
  connect(src, outlet, dst, inlet) {
    this.lines.push({ patchline: { destination: [dst.id, inlet], source: [src.id, outlet] } });
  }
}

// ------------------------------------------------------------------ Live parameters
function unitStyle(p) {
  if (p.kind === 'enum' || p.kind === 'toggle') return undefined;
  if (p.kind === 'int') return UNIT_STYLE.int;
  if (p.id === 'djf') return UNIT_STYLE['%'];
  return UNIT_STYLE[p.unit] ?? UNIT_STYLE.float;
}

function paramAttrs(p, longname, def, { hidden = false } = {}) {
  const v = {
    parameter_longname: longname,
    parameter_shortname: p.label,
    parameter_initial_enable: 1,
    parameter_initial: [def],
  };
  if (p.kind === 'enum' || p.kind === 'toggle') {
    const items = p.kind === 'toggle' ? ['off', 'on'] : p.items;
    v.parameter_type = 2;
    v.parameter_enum = items;
    v.parameter_mmax = items.length - 1;
  } else {
    v.parameter_type = p.kind === 'int' ? 1 : 0;
    v.parameter_mmin = p.min;
    v.parameter_mmax = p.max;
    v.parameter_unitstyle = unitStyle(p);
    if (p.exp) v.parameter_exponent = p.exp;
  }
  if (hidden) v.parameter_invisible = 1;
  return v;
}

function registerParam(patch, longname, box) {
  if (patch.paramNames.has(longname)) throw new Error('duplicate Live parameter name ' + longname);
  patch.paramNames.set(longname, box.id);
}

const rgb = (c, a = 1) => [c[0], c[1], c[2], a];
const GROOVE_COLOR = [1.0, 0.72, 0.26];
// The displays paint the same colour (BG in the display script), edge to edge,
// over these cards.
const CARD_COLOR = [0.075, 0.08, 0.09, 1.0];
const FX_COLOR = [0.7, 0.62, 1.0];

// ------------------------------------------------------------------ controls
function liveDial(patch, p, { longname, def, rect, varname, color, section, hidden = false, appearance, showname = 1, shownumber = 1 }) {
  const box = patch.add({
    maxclass: 'live.dial',
    numinlets: 1,
    numoutlets: 2,
    outlettype: ['', 'float'],
    parameter_enable: 1,
    presentation: 1,
    presentation_rect: rect,
    saved_attribute_attributes: { valueof: paramAttrs(p, longname, def) },
    varname,
    showname,
    shownumber,
    ...(appearance !== undefined ? { appearance } : {}),
    ...(color ? { activedialcolor: rgb(color) } : {}),
    ...(hidden ? { hidden: 1 } : {}),
    ...(p.desc ? { annotation: p.desc, annotation_name: longname } : {}),
    _pw: 44,
    _ph: 48,
  }, section);
  registerParam(patch, longname, box);
  return box;
}

function liveMenu(patch, p, { longname, def, rect, varname, section, hidden = false }) {
  const box = patch.add({
    maxclass: 'live.menu',
    numinlets: 1,
    numoutlets: 3,
    outlettype: ['', '', 'float'],
    parameter_enable: 1,
    presentation: 1,
    presentation_rect: rect,
    saved_attribute_attributes: { valueof: paramAttrs(p, longname, def) },
    varname,
    ...(hidden ? { hidden: 1 } : {}),
    ...(p.desc ? { annotation: p.desc, annotation_name: longname } : {}),
    _pw: 100,
    _ph: 15,
  }, section);
  registerParam(patch, longname, box);
  return box;
}

function liveTab(patch, p, { longname, def, rect, varname, section, hiddenParam = false }) {
  const box = patch.add({
    maxclass: 'live.tab',
    numinlets: 1,
    numoutlets: 3,
    outlettype: ['', '', 'float'],
    parameter_enable: 1,
    presentation: 1,
    presentation_rect: rect,
    saved_attribute_attributes: { valueof: paramAttrs(p, longname, def, { hidden: hiddenParam }) },
    varname,
    ...(p.desc ? { annotation: p.desc, annotation_name: longname } : {}),
    _pw: 120,
    _ph: 15,
  }, section);
  registerParam(patch, longname, box);
  return box;
}

function liveText(patch, { longname, label, text, mode, def = 0, rect, varname, section, color, desc }) {
  const p = { kind: 'enum', items: ['off', 'on'], label };
  const box = patch.add({
    maxclass: 'live.text',
    numinlets: 1,
    numoutlets: 2,
    outlettype: ['', ''],
    parameter_enable: 1,
    presentation: 1,
    presentation_rect: rect,
    saved_attribute_attributes: { valueof: paramAttrs(p, longname, def) },
    varname,
    text,
    texton: text,
    mode,
    ...(color
      ? {
          activebgoncolor: rgb(color),
          activetextoncolor: [0.08, 0.08, 0.09, 1],
          activebgcolor: [0.16, 0.17, 0.19, 1],
          activetextcolor: rgb([color[0] * 0.8, color[1] * 0.8, color[2] * 0.8]),
          bordercolor: [0.1, 0.1, 0.11, 1],
        }
      : {}),
    ...(desc ? { annotation: desc, annotation_name: longname } : {}),
    _pw: 60,
    _ph: 18,
  }, section);
  registerParam(patch, longname, box);
  return box;
}

function liveComment(patch, text, rect, { section = 'ui', varname, hidden = false, justify = 0, size = 9 } = {}) {
  return patch.add({
    maxclass: 'live.comment',
    numinlets: 1,
    numoutlets: 0,
    presentation: 1,
    presentation_rect: rect,
    text,
    textjustification: justify,
    fontsize: size,
    ...(varname ? { varname } : {}),
    ...(hidden ? { hidden: 1 } : {}),
    _pw: Math.max(40, text.length * 6),
    _ph: 18,
  }, section);
}

// A hidden, stored-only number: pattern data the grid writes and reads back.
function storeBox(patch, p, lane) {
  const longname = `${LANES[lane].name} ${p.label}`;
  const box = patch.add({
    maxclass: 'live.numbox',
    numinlets: 1,
    numoutlets: 2,
    outlettype: ['', 'float'],
    parameter_enable: 1,
    saved_attribute_attributes: { valueof: paramAttrs(p, longname, p.def[lane], { hidden: true }) },
    varname: 'gf_' + laneParamName(p, lane),
    _pw: 50,
    _ph: 15,
  }, 'store');
  registerParam(patch, longname, box);
  return box;
}

// ------------------------------------------------------------------ gen~
function genBox(patch, code, nIn, nOut) {
  const g = { n: 0, boxes: [], lines: [] };
  const gid = () => 'obj-' + ++g.n;
  const codebox = { id: gid(), maxclass: 'codebox', code, fontface: 0, fontname: '<Monospaced>', fontsize: 12.0, numinlets: nIn, numoutlets: nOut, outlettype: new Array(nOut).fill(''), patching_rect: [50, 90, 900, 700] };
  g.boxes.push({ box: codebox });
  for (let i = 1; i <= nIn; i++) {
    const b = { id: gid(), maxclass: 'newobj', text: 'in ' + i, numinlets: 0, numoutlets: 1, outlettype: [''], patching_rect: [50 + (i - 1) * 120, 30, 40, 22] };
    g.boxes.push({ box: b });
    g.lines.push({ patchline: { destination: [codebox.id, i - 1], source: [b.id, 0] } });
  }
  for (let i = 1; i <= nOut; i++) {
    const b = { id: gid(), maxclass: 'newobj', text: 'out ' + i, numinlets: 1, numoutlets: 0, patching_rect: [50 + (i - 1) * 120, 820, 45, 22] };
    g.boxes.push({ box: b });
    g.lines.push({ patchline: { destination: [b.id, 0], source: [codebox.id, i - 1] } });
  }
  const sub = {
    fileversion: 1,
    appversion: APPVERSION,
    classnamespace: 'dsp.gen',
    rect: [60.0, 80.0, 1000.0, 900.0],
    bglocked: 0,
    openinpresentation: 0,
    default_fontsize: 12.0,
    default_fontface: 0,
    default_fontname: 'Arial',
    gridonopen: 1,
    gridsize: [15.0, 15.0],
    gridsnaponopen: 1,
    objectsnaponopen: 1,
    statusbarvisible: 2,
    toolbarvisible: 1,
    lefttoolbarpinned: 0,
    toptoolbarpinned: 0,
    righttoolbarpinned: 0,
    bottomtoolbarpinned: 0,
    toolbars_unpinned_last_save: 0,
    tallnewobj: 0,
    boxanimatetime: 200,
    enablehscroll: 1,
    enablevscroll: 1,
    devicewidth: 0.0,
    description: '',
    digest: '',
    tags: '',
    style: '',
    subpatcher_template: '',
    assistshowspatchername: 0,
    boxes: g.boxes,
    lines: g.lines,
  };
  return patch.add({ maxclass: 'newobj', text: 'gen~', numinlets: nIn, numoutlets: nOut, outlettype: new Array(nOut).fill('signal'), patcher: sub, _pw: 300, _ph: 22 }, 'engine');
}

const APPVERSION = { major: 8, minor: 6, revision: 5, architecture: 'x64', modernui: 1 };

// ------------------------------------------------------------------ layout
// Device-view coordinates (the device is 169 px high).
//
// Nothing is drawn on top of anything else. Max draws the first box in a
// patcher's list in front and the last at the back, so a display listed
// before a control it covers hides it. Here the two displays (the jsui boxes)
// sit beside the controls, never under them, and the dark cards behind both
// are panels in Max's background layer, which is drawn behind every other box.
const L = {
  width: 956,
  srcCard: [6, 4, 166, 66],
  srcView: [8, 6, 162, 62],
  drop: [6, 74, 166, 22],
  gridCard: [180, 4, 434, 94],
  gridView: [222, 6, 358, 90],
  laneButton: (l) => [184, 16 + l * 20, 38, 18],
  levelDial: (l) => [582, 16 + l * 20, 18, 18],
  laneTab: [184, 106, 196, 15],
  pageTab: [386, 106, 170, 15],
  knob: (i) => [184 + i * 48, 122, 44, 46],
  menuLabel: (i) => [184 + i * 48, 126, 44, 12],
  menu: (i) => [184 + i * 48, 142, 44, 16],
  groove: 622,
  fx: 784,
};
const PAGES = ['sound', 'shape', 'groove'];

// A gate that opens once the device has settled after loading.
function pressesOnly(patch, settle, section) {
  const gate = patch.obj('gate 1 0', section);
  const open = patch.msg('1', section);
  patch.connect(settle, 0, open, 0);
  patch.connect(open, 0, gate, 0);
  return gate;
}

// ------------------------------------------------------------------ build one device
function buildDevice(variant) {
  const P = new Patch(variant);
  const code = buildEngine();
  const byId = Object.fromEntries(GLOBAL_PARAMS.map((p) => [p.id, p]));

  // ---- lifecycle, transport, engine, output
  const thisdevice = P.obj('live.thisdevice', 'core');
  const init = P.obj('t b b b b b', 'core');
  P.connect(thisdevice, 0, init, 0);
  const ramp = P.obj('phasor~ 1n @lock 1', 'core');
  const gen = genBox(P, code, 3, 5);
  P.connect(ramp, 0, gen, 0);
  const gain = P.add({
    maxclass: 'live.gain~',
    numinlets: 2,
    numoutlets: 5,
    outlettype: ['signal', 'signal', '', 'float', 'list'],
    parameter_enable: 1,
    presentation: 1,
    presentation_rect: [L.fx + 140, 6, 28, 158],
    orientation: 0,
    showname: 0,
    shownumber: 1,
    channels: 2,
    saved_attribute_attributes: { valueof: { parameter_longname: 'Output', parameter_shortname: 'Out', parameter_type: 0, parameter_mmin: -70.0, parameter_mmax: 6.0, parameter_initial_enable: 1, parameter_initial: [0.0], parameter_unitstyle: 4 } },
    varname: 'gf_output',
    annotation: 'Output level of the whole groove.',
    annotation_name: 'Output',
    _pw: 48,
    _ph: 140,
  }, 'engine');
  registerParam(P, 'Output', gain);
  const plugout = P.obj('plugout~', 'engine');
  P.connect(gen, 0, gain, 0);
  P.connect(gen, 1, gain, 1);
  P.connect(gain, 0, plugout, 0);
  P.connect(gain, 1, plugout, 1);
  if (variant === 'fx') {
    const plugin = P.obj('plugin~', 'engine');
    P.connect(plugin, 0, gen, 1);
    P.connect(plugin, 1, gen, 2);
  }

  // Every message to gen~ goes through one prepend per Param.
  const toGen = (source, outlet, name, why) => {
    const pre = P.obj('prepend ' + name, 'engine');
    P.connect(source, outlet, pre, 0);
    P.connect(pre, 0, gen, 0);
    if (P.drives.has(name)) throw new Error('two things drive gen~ Param ' + name);
    P.drives.set(name, why);
    return pre;
  };

  // ---- the displays: the waveform (source) and the step grid (grid)
  // One script, two jsui boxes. Each gets every display message and acts on
  // its own share; both answer through the same route.
  const view = (part, rect, patchingY, annotationName, annotation) => P.add({
    maxclass: 'jsui',
    filename: UI_SCRIPT,
    jsarguments: [variant, part, rect[0], rect[1]],
    numinlets: 1,
    numoutlets: 1,
    outlettype: [''],
    border: 0,
    parameter_enable: 0,
    presentation: 1,
    presentation_rect: rect,
    varname: 'gf_' + part,
    annotation,
    annotation_name: annotationName,
    // The same size in patching as in presentation. A jsui whose two sizes
    // differ keeps mapping its drawing and its mouse to the patching one, so
    // in Live it would draw at the wrong scale. Each gets its own spot, clear
    // of the patching columns.
    patching_rect: [1960, patchingY, rect[2], rect[3]],
  }, 'ui');
  const views = [
    view('source', L.srcView, 20, 'Your Sound', 'The sound every lane is built from. Each lane\'s start is marked in its colour, with Walk as a bar underneath; click or drag to move the selected lane\'s Start.'),
    view('grid', L.gridView, 100, 'Step Grid', 'Click a step: on, accent, off. Shift-click: accent. Alt-click: roll. Cmd/Ctrl-click: the lane ends here. Drag LEN, HIT and ROT up or down; HIT and ROT write a Euclidean rhythm. The die rewrites one lane.'),
  ];
  const toViews = (source, outlet) => views.forEach((v) => P.connect(source, outlet, v, 0));
  const toUI = (source, outlet, name) => {
    const pre = P.obj('prepend ' + name, 'ui');
    P.connect(source, outlet, pre, 0);
    toViews(pre, 0);
    return pre;
  };
  const uiMsg = (text) => {
    const m = P.msg(text, 'ui');
    toViews(m, 0);
    return m;
  };

  // engine -> display, 25 times a second
  ['steps', 'act', 'stat'].forEach((name, i) => {
    const snap = P.obj('snapshot~ 40', 'ui');
    P.connect(gen, 2 + i, snap, 0);
    toUI(snap, 0, name);
  });

  // ---- your sound: the sample buffer and its capture twin
  // [t ---name] turns a device-unique buffer name into a message; an object
  // box is where Max for Live is guaranteed to replace the dashes.
  const srcBuf = P.obj('buffer~ ---gfsrc', 'source');
  const capBuf = P.obj(variant === 'fx' ? 'buffer~ ---gfcap 8000 2' : 'buffer~ ---gfcap 20 2', 'source');
  const srcName = P.obj('t ---gfsrc', 'source');
  const capName = P.obj('t ---gfcap', 'source');
  const info = P.obj('info~ ---gfsrc', 'source');
  const bindSmp = P.obj('prepend smp', 'source');
  const bindCap = P.obj('prepend cap', 'source');
  P.connect(srcName, 0, bindSmp, 0);
  P.connect(bindSmp, 0, gen, 0);
  P.connect(capName, 0, bindCap, 0);
  P.connect(bindCap, 0, gen, 0);
  toUI(srcName, 0, 'setbuf');
  toUI(capName, 0, 'setcap');
  toGen(info, 0, 'src_sr', 'info~ reports the sample rate of the loaded file');

  const drop = P.add({
    maxclass: 'live.drop',
    numinlets: 1,
    numoutlets: 2,
    outlettype: ['', ''],
    parameter_enable: 1,
    presentation: 1,
    presentation_rect: L.drop,
    legend: 'Drop your sound here',
    saved_attribute_attributes: { valueof: { parameter_longname: 'Sample', parameter_shortname: 'Sample' } },
    varname: 'gf_sample',
    annotation: 'Drop any audio file or clip here. Every lane is built from it; the synth voices fill in whatever it lacks.',
    annotation_name: 'Sample',
    _pw: 150,
    _ph: 22,
  }, 'source');
  registerParam(P, 'Sample', drop);
  const replace = P.obj('prepend replace', 'source');
  P.connect(drop, 0, replace, 0);
  P.connect(replace, 0, srcBuf, 0);
  const onLoad = P.obj('t b b', 'source');
  P.connect(srcBuf, 1, onLoad, 0);
  P.connect(onLoad, 1, info, 0);
  P.connect(onLoad, 0, uiMsg('loaded'), 0);

  // load order: bind the buffers, read the file rate, then tell the display
  P.connect(init, 4, srcName, 0);
  P.connect(init, 3, capName, 0);
  P.connect(init, 2, info, 0);
  P.connect(init, 1, uiMsg('init'), 0);
  const settle = P.obj('delay 300', 'core');
  P.connect(init, 0, settle, 0);

  // ---- per-lane controls
  const laneControls = []; // [lane][page] -> boxes to show/hide
  const startDials = [];
  for (let l = 0; l < LANES.length; l++) {
    laneControls.push(PAGES.map(() => []));
    const lane = LANES[l];
    for (const page of PAGES) {
      const params = LANE_PARAMS.filter((p) => p.page === page);
      params.forEach((p, i) => {
        const longname = `${lane.name} ${p.label}`;
        const name = laneParamName(p, l);
        const visible = l === 0 && page === 'sound';
        let box;
        if (p.kind === 'enum') {
          const label = liveComment(P, p.label, L.menuLabel(i), { section: 'lanes', varname: 'gf_lbl_' + name, hidden: !visible, justify: 1 });
          laneControls[l][PAGES.indexOf(page)].push(label);
          box = liveMenu(P, p, { longname, def: p.def[l], rect: L.menu(i), varname: 'gf_' + name, section: 'lanes', hidden: !visible });
        } else {
          box = liveDial(P, p, { longname, def: p.def[l], rect: L.knob(i), varname: 'gf_' + name, color: lane.color, section: 'lanes', hidden: !visible });
        }
        laneControls[l][PAGES.indexOf(page)].push(box);
        const pre = toGen(box, 0, name, longname);
        if (p.jsui) toViews(pre, 0);
        if (p.id === 'stt') startDials[l] = box;
      });
    }
    // on/off and level, beside the grid row
    const onP = LANE_PARAMS.find((p) => p.id === 'on');
    const onBox = liveText(P, { longname: `${lane.name} On`, label: 'On', text: lane.tag, mode: 1, def: 1, rect: L.laneButton(l), varname: 'gf_on' + l, section: 'lanes', color: lane.color, desc: onP.desc });
    const onPre = toGen(onBox, 0, 'on' + l, `${lane.name} On`);
    toViews(onPre, 0);
    const lvlP = LANE_PARAMS.find((p) => p.id === 'lvl');
    const lvl = liveDial(P, lvlP, { longname: `${lane.name} Level`, def: lvlP.def[l], rect: L.levelDial(l), varname: 'gf_lvl' + l, color: lane.color, section: 'lanes', appearance: 1, showname: 0, shownumber: 0 });
    toGen(lvl, 0, 'lvl' + l, `${lane.name} Level`);
  }

  // ---- pattern storage, and the grid's writes into it
  const stores = {};
  for (const p of LANE_PARAMS.filter((q) => q.page === 'store')) {
    for (let l = 0; l < LANES.length; l++) {
      const name = laneParamName(p, l);
      const box = storeBox(P, p, l);
      stores[name] = box;
      if (p.engine === false) toUI(box, 0, name);
      else toViews(toGen(box, 0, name, 'stored pattern data'), 0);
    }
  }
  const routeNames = [...Object.keys(stores), 'stt0', 'stt1', 'stt2', 'stt3', 'sel'];
  const route = P.obj('route ' + routeNames.join(' '), 'ui');
  views.forEach((v) => P.connect(v, 0, route, 0));

  // ---- lane and page selection, and which knobs show
  const laneTab = liveTab(P, { kind: 'enum', items: LANES.map((x) => x.tag), label: 'Lane' }, { longname: 'Edit Lane', def: 0, rect: L.laneTab, varname: 'gf_lanetab', section: 'pages', hiddenParam: true });
  const pageTab = liveTab(P, { kind: 'enum', items: PAGES.map((x) => x.toUpperCase()), label: 'Page' }, { longname: 'Edit Page', def: 0, rect: L.pageTab, varname: 'gf_pagetab', section: 'pages', hiddenParam: true });
  toUI(laneTab, 0, 'sel');
  const pak = P.obj('pak 0 0', 'pages');
  P.connect(laneTab, 0, pak, 0);
  P.connect(pageTab, 0, pak, 1);
  const group = P.obj('expr $i1*3+$i2', 'pages');
  P.connect(pak, 0, group, 0);
  const order = P.obj('t i b', 'pages');
  P.connect(group, 0, order, 0);
  const thisPatcher = P.obj('thispatcher', 'pages');
  const all = [];
  laneControls.forEach((pages) => pages.forEach((boxes) => boxes.forEach((b) => all.push(b.varname))));
  const hideAll = P.msg(all.map((v) => 'script hide ' + v).join(', '), 'pages');
  P.connect(order, 1, hideAll, 0);
  P.connect(hideAll, 0, thisPatcher, 0);
  const groups = [];
  for (let l = 0; l < LANES.length; l++) for (let pg = 0; pg < PAGES.length; pg++) groups.push(laneControls[l][pg]);
  const sel = P.obj('sel ' + groups.map((_, i) => i).join(' '), 'pages');
  P.connect(order, 0, sel, 0);
  groups.forEach((boxes, i) => {
    const show = P.msg(boxes.map((b) => 'script show ' + b.varname).join(', '), 'pages');
    P.connect(sel, i, show, 0);
    P.connect(show, 0, thisPatcher, 0);
  });
  // once everything has loaded, re-assert the selection so the right knobs show
  P.connect(settle, 0, laneTab, 0);
  P.connect(settle, 0, pageTab, 0);

  // the grid's outlet: pattern writes go to storage, Start clicks to the Start
  // knobs, lane clicks to the lane tab; the chord (arp_n, arpN) goes to gen~
  routeNames.forEach((name, i) => {
    if (stores[name]) P.connect(route, i, stores[name], 0);
    else if (/^stt\d$/.test(name)) P.connect(route, i, startDials[+name[3]], 0);
    else if (name === 'sel') P.connect(route, i, laneTab, 0);
  });
  P.connect(route, routeNames.length, gen, 0);
  if (variant === 'inst') {
    P.drives.set('arp_n', 'the held chord, from the display');
    for (let i = 0; i < 8; i++) P.drives.set('arp' + i, 'the held chord, from the display');
  }

  // ---- GROOVE panel
  const G0 = L.groove;
  const gDial = (id, rect, extra = {}) => {
    const p = byId[id];
    const box = liveDial(P, p, { longname: p.label, def: p.def, rect, varname: 'gf_' + id, color: GROOVE_COLOR, section: 'groove', ...extra });
    const pre = toGen(box, 0, id, p.label);
    if (p.jsui) toViews(pre, 0);
    return box;
  };
  gDial('swingamt', [G0, 4, 62, 80]);
  const grid = liveTab(P, byId.swgrid, { longname: 'Swing Grid', def: 0, rect: [G0 + 4, 86, 56, 13], varname: 'gf_swgrid', section: 'groove' });
  toViews(toGen(grid, 0, 'swgrid', 'Swing Grid'), 0);
  gDial('humanize', [G0 + 64, 3, 44, 46]);
  gDial('accamt', [G0 + 64, 53, 44, 46]);
  gDial('varamt', [G0 + 110, 3, 44, 46]);
  liveComment(P, 'Fill', [G0 + 110, 57, 44, 12], { section: 'groove', justify: 1 });
  const fill = liveMenu(P, byId.fillmode, { longname: 'Fill', def: byId.fillmode.def, rect: [G0 + 110, 71, 44, 15], varname: 'gf_fillmode', section: 'groove' });
  toGen(fill, 0, 'fillmode', 'Fill');

  liveComment(P, 'Style', [G0, 106, 34, 15], { section: 'groove' });
  const style = liveMenu(P, byId.style, { longname: 'Style', def: 0, rect: [G0 + 34, 106, 120, 15], varname: 'gf_style', section: 'groove' });
  toUI(style, 0, 'style');
  // Live restores every parameter when a set loads, buttons included, and
  // again on a preset recall. A restored value is a number, a press is a bang:
  // [route bang] keeps only presses, and the gate stays shut until the set has
  // loaded. Without both, loading a set would press GENERATE on it.
  const actions = pressesOnly(P, settle, 'groove');
  toViews(actions, 0);
  const button = (label, message, rect, desc) => {
    const b = liveText(P, { longname: label, label, text: label.toUpperCase(), mode: 0, rect, varname: 'gf_btn_' + message, section: 'groove', desc });
    const press = P.obj('route bang', 'groove');
    P.connect(b, 0, press, 0);
    const m = P.msg(message, 'groove');
    P.connect(press, 0, m, 0);
    P.connect(m, 0, actions, 1);
    return b;
  };
  button('Generate', 'generate', [G0, 125, 76, 18], 'Write a new groove on every lane, in the chosen Style.');
  button('Mutate', 'mutate', [G0 + 78, 125, 76, 18], 'Change a few steps and accents. The kick keeps its floor.');
  button('Clear', 'clear', [G0, 147, 76, 16], 'Empty the selected lane.');
  button('Undo', 'undo', [G0 + 78, 147, 76, 16], 'Step back through pattern edits.');

  // ---- FX panel
  const F0 = L.fx;
  const fxSlot = (i, row) => [F0 + i * 46, [4, 56, 110][row], 44, 46];
  const fDial = (id, i, row) => {
    const p = byId[id];
    const box = liveDial(P, p, { longname: p.label, def: p.def, rect: fxSlot(i, row), varname: 'gf_' + id, color: FX_COLOR, section: 'fx' });
    toGen(box, 0, id, p.label);
  };
  fDial('busdrive', 0, 0);
  fDial('buscrush', 1, 0);
  fDial('pumpamt', 2, 0);
  liveComment(P, 'Time', [F0, 60, 44, 12], { section: 'fx', justify: 1 });
  const dtime = liveMenu(P, byId.dtime, { longname: 'Delay Time', def: byId.dtime.def, rect: [F0, 74, 44, 15], varname: 'gf_dtime', section: 'fx' });
  toGen(dtime, 0, 'dtime', 'Delay Time');
  fDial('dfb', 1, 1);
  fDial('dmix', 2, 1);
  fDial('rsize', 0, 2);
  fDial('rmix', 1, 2);
  fDial('djf', 2, 2);

  // ---- SOURCE panel, bottom left
  if (variant === 'inst') {
    const hold = liveTab(P, byId.holdmode, { longname: 'Play', def: 0, rect: [6, 106, 166, 16], varname: 'gf_holdmode', section: 'source' });
    toGen(hold, 0, 'holdmode', 'Play');
    liveComment(P, 'Play notes: lanes with Keys on follow them. Hold a chord and they step through it; it stays when you let go.', [6, 126, 166, 40], { section: 'source', size: 8.5 });

    // MIDI from the track: the last note and whether any key is down go
    // straight to gen~; the chord goes through the display (it keeps the list)
    const notein = P.obj('notein', 'midi');
    const strip = P.obj('stripnote', 'midi');
    P.connect(notein, 1, strip, 1);
    P.connect(notein, 0, strip, 0);
    toGen(strip, 0, 'kf_note', 'the last note played');
    const borax = P.obj('borax', 'midi');
    P.connect(notein, 1, borax, 1);
    P.connect(notein, 0, borax, 0);
    P.connect(init, 1, borax, 2);
    const anyDown = P.obj('expr $i1 > 0', 'midi');
    P.connect(borax, 2, anyDown, 0);
    toGen(anyDown, 0, 'kf_gate', 'keys held (borax)');
    const pack = P.obj('pack 0 0', 'midi');
    P.connect(notein, 1, pack, 1);
    P.connect(notein, 0, pack, 0);
    toUI(pack, 0, 'note');
  } else {
    const srcsel = liveTab(P, byId.srcsel, { longname: 'Source', def: 0, rect: [6, 106, 166, 16], varname: 'gf_srcsel', section: 'source' });
    toViews(toGen(srcsel, 0, 'srcsel', 'Source'), 0);
    const capture = liveText(P, { longname: 'Capture', label: 'Capture', text: 'CAPTURE', mode: 0, rect: [6, 126, 80, 18], varname: 'gf_capture', section: 'source', color: [0.95, 0.3, 0.3], desc: 'Record this track into the groove: starts on the next downbeat (at once while stopped) and switches the Source to Live.' });
    const capPress = P.obj('route bang', 'source');
    P.connect(capture, 0, capPress, 0);
    const capGate = pressesOnly(P, settle, 'source');
    P.connect(capPress, 0, capGate, 1);
    const capOrder = P.obj('t b b', 'source');
    P.connect(capGate, 0, capOrder, 0);
    const toLive = P.msg('1', 'source');
    P.connect(capOrder, 1, toLive, 0);
    P.connect(toLive, 0, srcsel, 0);
    const count = P.obj('counter 1 1000000', 'source');
    P.connect(capOrder, 0, count, 0);
    toGen(count, 0, 'capgo', 'the Capture button');
    const bars = liveMenu(P, byId.capbars, { longname: 'Capture Length', def: 0, rect: [90, 126, 82, 18], varname: 'gf_capbars', section: 'source' });
    toGen(bars, 0, 'capbars', 'Capture Length');
    const auto = liveMenu(P, byId.capauto, { longname: 'Auto Capture', def: 0, rect: [6, 148, 80, 16], varname: 'gf_capauto', section: 'source' });
    toGen(auto, 0, 'capauto', 'Auto Capture');
    liveComment(P, 'Thru', [90, 149, 30, 14], { section: 'source' });
    const thru = P.add({
      maxclass: 'live.numbox',
      numinlets: 1,
      numoutlets: 2,
      outlettype: ['', 'float'],
      parameter_enable: 1,
      presentation: 1,
      presentation_rect: [120, 148, 52, 16],
      saved_attribute_attributes: { valueof: paramAttrs(byId.thruamt, 'Thru', byId.thruamt.def) },
      varname: 'gf_thruamt',
      annotation: byId.thruamt.desc,
      annotation_name: 'Thru',
      _pw: 50,
      _ph: 15,
    }, 'source');
    registerParam(P, 'Thru', thru);
    toGen(thru, 0, 'thruamt', 'Thru');
    // A dropped sample becomes the source. The gate stays shut while the set
    // loads, so a stored sample coming back cannot override a stored Live.
    const dropGate = P.obj('gate 1 0', 'source');
    const opened = P.msg('1', 'source');
    P.connect(settle, 0, opened, 0);
    P.connect(opened, 0, dropGate, 0);
    const dropped = P.obj('t b', 'source');
    P.connect(drop, 0, dropped, 0);
    P.connect(dropped, 0, dropGate, 1);
    const toSample = P.msg('0', 'source');
    P.connect(dropGate, 0, toSample, 0);
    P.connect(toSample, 0, srcsel, 0);
  }

  // ---- the dark cards behind the displays, last in the list and in the
  // background layer: behind everything, by both of Max's rules
  const card = (rect, varname, patchingY) => P.add({
    maxclass: 'panel',
    angle: 270.0,
    background: 1,
    bgcolor: CARD_COLOR,
    border: 0,
    ignoreclick: 1,
    mode: 0,
    numinlets: 1,
    numoutlets: 0,
    presentation: 1,
    presentation_rect: rect,
    proportion: 0.39,
    rounded: 6,
    varname,
    patching_rect: [2340, patchingY, rect[2], rect[3]],
  }, 'ui');
  card(L.srcCard, 'gf_card_source', 20);
  card(L.gridCard, 'gf_card_grid', 100);

  return { patch: P, code };
}

// ------------------------------------------------------------------ checks
function validate({ patch }) {
  const ids = new Map(patch.boxes.map(({ box }) => [box.id, box]));
  for (const { patchline } of patch.lines) {
    const [sid, out] = patchline.source;
    const [did, inl] = patchline.destination;
    const s = ids.get(sid);
    const d = ids.get(did);
    if (!s || !d) throw new Error(`cord between missing boxes ${sid} -> ${did}`);
    if (out >= s.numoutlets) throw new Error(`[${s.text || s.maxclass}] has no outlet ${out}`);
    if (inl >= d.numinlets) throw new Error(`[${d.text || d.maxclass}] has no inlet ${inl}`);
  }
  // every engine Param is driven by exactly one thing (or, in the Audio
  // Effect, deliberately left at its default: there are no keys to follow)
  const expectIdle = patch.variant === 'fx' ? ['kf_note', 'kf_gate', 'arp_n', ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => 'arp' + i), 'holdmode'] : ['srcsel', 'capbars', 'capauto', 'thruamt', 'capgo'];
  for (const p of engineParams()) {
    if (expectIdle.includes(p.name)) {
      if (patch.drives.has(p.name)) throw new Error(`gen~ Param ${p.name} should be idle in ${patch.variant}`);
      continue;
    }
    if (!patch.drives.has(p.name)) throw new Error(`nothing sets gen~ Param ${p.name} in ${patch.variant}`);
  }
  for (const name of patch.drives.keys()) {
    if (!engineParams().some((p) => p.name === name)) throw new Error(`a prepend targets ${name}, which gen~ does not declare`);
  }
  // presentation stays inside the device
  for (const { box } of patch.boxes) {
    if (!box.presentation) continue;
    const [x, y, w, h] = box.presentation_rect;
    if (x < 0 || y < 0 || x + w > L.width || y + h > DEVICE_HEIGHT) throw new Error(`${box.varname || box.maxclass} is outside the device: ${box.presentation_rect}`);
  }
  // Nothing in front covers anything else: only background-layer panels may
  // sit under another box. A display drawn over a control hides it in Live.
  const shown = patch.boxes.map((b) => b.box).filter((b) => b.presentation);
  const overlaps = (a, b) => {
    const [ax, ay, aw, ah] = a.presentation_rect;
    const [bx, by, bw, bh] = b.presentation_rect;
    return ax < bx + bw && bx < ax + aw && ay < by + bh && by < ay + ah;
  };
  for (const box of shown.filter((b) => b.maxclass === 'jsui')) {
    for (const other of shown) {
      if (other === box || other.background) continue;
      if (overlaps(box, other)) throw new Error(`${other.varname || other.maxclass} is under the display ${box.varname}`);
    }
    // a jsui maps itself to its patching size, and places its drawing by
    // the origin it is given
    if (box.patching_rect[2] !== box.presentation_rect[2] || box.patching_rect[3] !== box.presentation_rect[3]) throw new Error(`${box.varname} is a different size in patching and presentation`);
    if (box.jsarguments[2] !== box.presentation_rect[0] || box.jsarguments[3] !== box.presentation_rect[1]) throw new Error(`${box.varname} is told the wrong origin`);
  }
  // background panels are last in the list: at the back even by list order
  let seenBackground = false;
  for (const { box } of patch.boxes) {
    if (box.background) seenBackground = true;
    else if (seenBackground) throw new Error(`${box.varname || box.text || box.maxclass} comes after a background panel`);
  }
  // live.* names Live will show must be short enough to read
  for (const [name] of patch.paramNames) if (name.length > 31) throw new Error('parameter name too long: ' + name);
  return true;
}

// ------------------------------------------------------------------ serialise
function patcherJson({ patch }, deviceType) {
  const p = {
    patcher: {
      fileversion: 1,
      appversion: APPVERSION,
      classnamespace: 'box',
      rect: [80.0, 100.0, 1600.0, 900.0],
      openrect: [0.0, 0.0, L.width, DEVICE_HEIGHT],
      bglocked: 0,
      openinpresentation: 1,
      default_fontsize: 9.0,
      default_fontface: 0,
      default_fontname: 'Arial Bold',
      gridonopen: 1,
      gridsize: [8.0, 8.0],
      gridsnaponopen: 1,
      objectsnaponopen: 1,
      statusbarvisible: 2,
      toolbarvisible: 1,
      lefttoolbarpinned: 0,
      toptoolbarpinned: 0,
      righttoolbarpinned: 0,
      bottomtoolbarpinned: 0,
      toolbars_unpinned_last_save: 0,
      tallnewobj: 0,
      boxanimatetime: 500,
      enablehscroll: 1,
      enablevscroll: 1,
      devicewidth: L.width,
      description: 'Groove Forge: turns your sound into a techno groove.',
      digest: '',
      tags: '',
      style: '',
      subpatcher_template: '',
      assistshowspatchername: 0,
      boxes: patch.boxes,
      lines: patch.lines,
      latency: 0,
      is_mpe: 0,
      external_mpe_tuning_enabled: 0,
      minimum_live_version: '',
      minimum_max_version: '',
      platform_compatibility: 0,
      autosave: 0,
      project: projectBlock(deviceType, BUILD_TIME),
    },
  };
  return JSON.stringify(p, null, '\t');
}

const DEVICES = [
  { variant: 'inst', deviceType: 'instrument', file: 'Groove Forge.amxd' },
  { variant: 'fx', deviceType: 'audio_effect', file: 'Groove Forge FX.amxd' },
];

// Max's jsui runs the legacy engine: ES5. One newer token and the script
// fails to load, and Live shows jsui's placeholder where the display should
// be. So the script is parsed as ES5 before it is frozen in.
function assertES5(source, label) {
  let acorn;
  try {
    acorn = require('acorn');
  } catch (e) {
    throw new Error('the build parses the display script with acorn: run npm install first');
  }
  try {
    acorn.parse(source, { ecmaVersion: 5, sourceType: 'script' });
  } catch (e) {
    throw new Error(`${label} is not ES5, the only JavaScript Max's jsui runs: ${e.message}`);
  }
}

function displayScript() {
  const data = fs.readFileSync(path.join(__dirname, UI_SCRIPT));
  assertES5(data.toString('utf8'), UI_SCRIPT);
  return data;
}

function buildAll({ write = true } = {}) {
  const out = [];
  const script = displayScript();
  for (const d of DEVICES) {
    const built = buildDevice(d.variant);
    validate(built);
    const json = patcherJson(built, d.deviceType);
    const bytes = packAmxd(json, { deviceType: d.deviceType, name: d.file, mtime: BUILD_TIME, files: [{ name: UI_SCRIPT, type: 'TEXT', data: script }] });
    if (write) fs.writeFileSync(path.join(ROOT, d.file), bytes);
    out.push({ ...d, bytes, json, built });
  }
  return out;
}

module.exports = { buildAll, buildDevice, validate, patcherJson, portsFor, assertES5, L, DEVICES, UI_SCRIPT, CARD_COLOR };

if (require.main === module) {
  const check = process.argv.includes('--check');
  for (const d of buildAll({ write: !check })) {
    const params = d.built.patch.paramNames.size;
    console.log(`${check ? 'checked' : 'wrote'} ${d.file}: ${d.bytes.length} bytes, ${d.built.patch.boxes.length} objects, ${d.built.patch.lines.length} cords, ${params} Live parameters`);
  }
}
