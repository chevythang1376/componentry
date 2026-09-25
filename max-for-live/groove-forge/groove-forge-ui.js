// Groove Forge: the display, the step grid and the pattern brain.
//
// This runs in Max's jsui, which is the legacy JavaScript engine: ES5 only.
// No let/const, arrow functions, template strings or classes.
//
// Keep this file next to Groove Forge.amxd (Max finds it in the device's own
// folder), or freeze the device in Max to fold it into the .amxd.
//
// The grid never owns the pattern. Every step, accent, roll and lane length
// lives in a hidden Live parameter, so it is saved with the set, recalled by
// presets and undone by Live's undo. A click here only asks for a new value;
// the value that comes back from the parameter is what gets drawn. That is
// also why loading a set never regenerates a pattern: stored values arrive as
// messages, and messages never generate anything. Only the mouse and the
// Generate / Mutate / Clear / Undo buttons do.

autowatch = 0;
inlets = 1;
outlets = 1;
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

var VARIANT = jsarguments.length > 1 ? String(jsarguments[1]) : 'inst';

var LANES = 4;
var STEPS = 16;
var TAGS = ['KICK', 'CLAP', 'HATS', 'TONE'];
var COLORS = [[0.98, 0.58, 0.2], [0.98, 0.37, 0.6], [0.33, 0.82, 0.96], [0.68, 0.9, 0.33]];
var FONT = 'Arial Bold';

// Geometry, in device pixels. The jsui covers the source display and the grid;
// the live.drop, the lane buttons and the level dials sit on top of it.
var G = {
  src: [6, 4, 166, 66],
  wave: [10, 19, 158, 45],
  grid: [180, 4, 434, 94],
  rowY0: 16,
  rowPitch: 20,
  rowH: 18,
  laneX: 184,
  laneW: 38,
  padX: 226,
  padPitch: 17,
  padW: 15,
  fieldX: [500, 520, 540],
  fieldW: 18,
  diceX: 561,
  diceW: 13
};

// ------------------------------------------------------------------ state
// A mirror of the device's parameters, plus what the engine reports.
var st = {
  pat: [4369, 4112, 52300, 19660],
  acc: [4369, 4112, 17476, 17476],
  rol: [0, 0, 0, 0],
  len: [16, 16, 16, 16],
  hit: [4, 2, 7, 7],
  rot: [0, 4, 0, 0],
  on: [1, 1, 1, 1],
  stt: [0, 5, 25, 0],
  wlk: [0, 0, 30, 0],
  swd: [100, 100, 100, 100],
  ndg: [0, 0, 0, 0],
  sel: 0,
  swing: 56,
  swgrid: 0,
  style: 0,
  srcsel: 0,
  steps: [0, 0, 0, 0],
  playing: 0,
  act: [0, 0, 0, 0],
  cap: 0,
  capProg: 0,
  hasSample: 0,
  hasCap: 0,
  capFrac: 0,
  chord: [],
  held: 0,
  bufName: '',
  capName: '',
  peaks: null,
  capPeaks: null
};
var ready = false;
var undoStack = [];
var UNDO_DEPTH = 24;
var hover = null;
var drag = null;
var lastStepsCode = -1;
var lastActCode = -1;

// ------------------------------------------------------------------ bit helpers
// A lane's steps are a 16-bit mask: step 1 is bit 0.
function bit(mask, k) {
  return (mask >> k) & 1;
}
function setBit(mask, k, on) {
  return on ? (mask | (1 << k)) & 65535 : mask & ~(1 << k) & 65535;
}
function maskFrom(list) {
  var m = 0;
  for (var i = 0; i < list.length; i++) m = setBit(m, list[i], 1);
  return m;
}
function countBits(mask, len) {
  var n = 0;
  for (var k = 0; k < len; k++) n += bit(mask, k);
  return n;
}
function clampInt(v, lo, hi) {
  v = Math.round(v);
  return v < lo ? lo : v > hi ? hi : v;
}

// Maximally even: k hits over n steps, rotated r steps later.
function euclid(n, k, r) {
  n = clampInt(n, 1, 16);
  k = clampInt(k, 0, n);
  r = ((clampInt(r, 0, 15) % n) + n) % n;
  var m = 0;
  for (var i = 0; i < n; i++) {
    var j = (i - r + n) % n;
    if ((j * k) % n < k) m = setBit(m, i, 1);
  }
  return m;
}

// ------------------------------------------------------------------ talking to the device
function send(name, value) {
  outlet(0, name, value);
}
// Asks the hidden parameters for a lane's whole pattern. What comes back is
// what gets drawn.
function sendLane(l) {
  send('len' + l, st.len[l]);
  send('pat' + l, st.pat[l]);
  send('acc' + l, st.acc[l]);
  send('rol' + l, st.rol[l]);
  send('hit' + l, st.hit[l]);
  send('rot' + l, st.rot[l]);
}
function snapshot() {
  return {
    pat: st.pat.slice(),
    acc: st.acc.slice(),
    rol: st.rol.slice(),
    len: st.len.slice(),
    hit: st.hit.slice(),
    rot: st.rot.slice()
  };
}
function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > UNDO_DEPTH) undoStack.shift();
}

// ------------------------------------------------------------------ messages in
var LANE_FIELDS = { pat: 1, acc: 1, rol: 1, len: 1, hit: 1, rot: 1, on: 1, stt: 1, wlk: 1, swd: 1, ndg: 1 };

function anything() {
  var args = arrayfromargs(arguments);
  handle(messagename, args);
}

function handle(name, args) {
  var v = args.length ? args[0] : 0;
  var m = /^([a-z]+)(\d)$/.exec(name);
  if (m && LANE_FIELDS[m[1]] && +m[2] < LANES) {
    st[m[1]][+m[2]] = Number(v);
    if (m[1] === 'len') st.len[+m[2]] = clampInt(v, 1, 16);
    return redraw();
  }
  switch (name) {
    case 'swingamt': st.swing = Number(v); return redraw();
    case 'swgrid': st.swgrid = Number(v); return redraw();
    case 'style': st.style = clampInt(v, 0, STYLES.length - 1); return;
    case 'srcsel': st.srcsel = Number(v); return redraw();
    case 'sel': st.sel = clampInt(v, 0, LANES - 1); return redraw();
    case 'steps': return onSteps(Number(v));
    case 'act': return onAct(Number(v));
    case 'stat': return onStat(Number(v));
    case 'setbuf': st.bufName = String(v); st.peaks = readPeaks(st.bufName, 1); return redraw();
    case 'setcap': st.capName = String(v); return redraw();
    case 'loaded': st.peaks = readPeaks(st.bufName, 1); st.hasSample = st.peaks ? 1 : 0; return redraw();
    case 'note': return onNote(Number(args[0]), Number(args[1]));
    case 'generate': return generateAll();
    case 'mutate': return mutateAll();
    case 'clear': return clearLane(st.sel);
    case 'undo': return undo();
    case 'init':
      ready = true;
      st.peaks = readPeaks(st.bufName, 1);
      return redraw();
    default:
      return;
  }
}

function redraw() {
  mgraphics.redraw();
}

// The engine packs every lane's step into one number, 4 bits a lane.
function onSteps(code) {
  if (code === lastStepsCode) return;
  lastStepsCode = code;
  st.playing = code >= 65536 ? 1 : 0;
  var c = code % 65536;
  for (var l = 0; l < LANES; l++) st.steps[l] = Math.floor(c / Math.pow(16, l)) % 16;
  redraw();
}
function onAct(code) {
  if (code === lastActCode) return;
  lastActCode = code;
  for (var l = 0; l < LANES; l++) st.act[l] = (Math.floor(code / Math.pow(16, l)) % 16) / 15;
  redraw();
}
// capture state + 4*(sample) + 8*(capture) + 16*(percent) + 2048*(capture length in thousandths)
function onStat(code) {
  var wasCap = st.cap;
  var hadCap = st.hasCap;
  var lastFrac = st.capFrac;
  st.cap = code % 4;
  st.hasSample = Math.floor(code / 4) % 2;
  st.hasCap = Math.floor(code / 8) % 2;
  st.capProg = (Math.floor(code / 16) % 128) / 100;
  st.capFrac = Math.floor(code / 2048) / 1000;
  if ((wasCap === 2 && st.cap !== 2) || (st.hasCap && !hadCap) || st.capFrac !== lastFrac) {
    st.capPeaks = readPeaks(st.capName, st.capFrac);
  }
  redraw();
}

// ------------------------------------------------------------------ MIDI: the held chord
// Notes held together make a chord the Keys lanes step through. Letting go
// keeps it (so it can be played and then left running); the next note after
// everything is released starts a new one.
function onNote(pitch, vel) {
  if (!(pitch >= 0 && pitch <= 127)) return;
  if (vel > 0) {
    if (st.held <= 0) st.chord = [];
    if (st.chord.indexOf(pitch) < 0) st.chord.push(pitch);
    if (st.chord.length > 8) st.chord.shift();
    st.held++;
  } else {
    st.held = Math.max(0, st.held - 1);
    return redraw();
  }
  var sorted = st.chord.slice().sort(function (a, b) { return a - b; });
  for (var i = 0; i < sorted.length; i++) send('arp' + i, sorted[i]);
  send('arp_n', sorted.length);
  redraw();
}

var NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function noteName(p) {
  return NOTE_NAMES[p % 12] + (Math.floor(p / 12) - 2);
}

// ------------------------------------------------------------------ the waveform
function readPeaks(name, fraction) {
  if (!name || !ready) return null;
  var b;
  try {
    b = new Buffer(name);
  } catch (e) {
    return null;
  }
  var frames = Math.floor(b.framecount() * (fraction > 0 ? Math.min(1, fraction) : 1));
  var chans = b.channelcount();
  if (!(frames > 64) || !(chans > 0)) return null;
  var cols = G.wave[2];
  var out = [];
  var biggest = 0.0001;
  for (var c = 0; c < cols; c++) {
    var a = Math.floor((c * frames) / cols);
    var n = Math.max(1, Math.min(1024, Math.floor(((c + 1) * frames) / cols) - a));
    var lo = 0;
    var hi = 0;
    for (var ch = 1; ch <= Math.min(chans, 2); ch++) {
      var chunk = b.peek(ch, a, n);
      if (typeof chunk === 'number') chunk = [chunk];
      for (var i = 0; i < chunk.length; i++) {
        if (chunk[i] < lo) lo = chunk[i];
        if (chunk[i] > hi) hi = chunk[i];
      }
    }
    out.push([lo, hi]);
    biggest = Math.max(biggest, -lo, hi);
  }
  for (var j = 0; j < out.length; j++) out[j] = [out[j][0] / biggest, out[j][1] / biggest];
  return out;
}

// ------------------------------------------------------------------ swing, as the engine plays it
// Where step k really lands, in steps from where the grid shows it. The same
// arithmetic as the engine, so the dot moves exactly as the hit does.
function stepOffset(l, k) {
  var S = 0.5 + (Math.min(75, Math.max(50, st.swing)) / 100 - 0.5) * (st.swd[l] / 100);
  var off = 0;
  if (st.swgrid > 0.5) {
    var m = k % 4;
    off = m === 1 ? 2 * S - 1 : m === 2 ? 4 * S - 2 : m === 3 ? 2 * S - 1 : 0;
  } else if (k % 2 === 1) {
    off = 2 * S - 1;
  }
  return off + st.ndg[l] / 100;
}

// ------------------------------------------------------------------ drawing
function rgba(c, a) {
  mgraphics.set_source_rgba(c[0], c[1], c[2], a === undefined ? 1 : a);
}
function mix(c, t, a) {
  return [c[0] + (t[0] - c[0]) * a, c[1] + (t[1] - c[1]) * a, c[2] + (t[2] - c[2]) * a];
}
var BG = [0.075, 0.08, 0.09];
var PANEL = [0.105, 0.11, 0.125];
var LINE = [0.2, 0.21, 0.235];
var INK = [0.86, 0.88, 0.9];
var DIM = [0.46, 0.48, 0.52];
var OFF = [0.17, 0.18, 0.2];

function roundRect(x, y, w, h, r) {
  mgraphics.rectangle_rounded(x, y, w, h, r, r);
}
function text(str, x, y, size, c, a, align) {
  mgraphics.select_font_face(FONT);
  mgraphics.set_font_size(size);
  var w = mgraphics.text_measure(str)[0];
  var tx = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
  rgba(c, a);
  mgraphics.move_to(tx, y);
  mgraphics.show_text(str);
  return w;
}

function paint() {
  drawSource();
  drawGrid();
}

function drawSource() {
  var s = G.src;
  var w = G.wave;
  rgba(BG);
  roundRect(s[0], s[1], s[2], s[3], 5);
  mgraphics.fill();

  text('GROOVE FORGE', s[0] + 6, s[1] + 11, 9, INK, 0.95);
  var showCap = VARIANT === 'fx' && st.srcsel > 0.5;
  var tag = VARIANT === 'fx' ? (showCap ? 'LIVE' : 'SAMPLE') : 'MIDI';
  var tagW = text(tag, s[0] + s[2] - 6, s[1] + 11, 8, DIM, 1, 'right');
  var statusX = s[0] + s[2] - 12 - tagW;

  // the waveform of whichever source the groove is built from
  var peaks = showCap ? st.capPeaks : st.peaks;
  rgba(PANEL);
  roundRect(w[0], w[1], w[2], w[3], 3);
  mgraphics.fill();
  var mid = w[1] + w[3] / 2;
  if (peaks) {
    rgba([0.62, 0.68, 0.76], 0.75);
    mgraphics.set_line_width(1);
    for (var c = 0; c < peaks.length; c++) {
      var x = w[0] + c + 0.5;
      var y0 = mid - peaks[c][1] * (w[3] / 2 - 2);
      var y1 = mid - peaks[c][0] * (w[3] / 2 - 2);
      if (y1 - y0 < 1) y1 = y0 + 1;
      mgraphics.move_to(x, y0);
      mgraphics.line_to(x, y1);
    }
    mgraphics.stroke();
  } else {
    rgba(LINE, 1);
    mgraphics.rectangle(w[0] + 4, mid, w[2] - 8, 1);
    mgraphics.fill();
    var msg = showCap ? 'press Capture' : VARIANT === 'fx' ? 'drop a sample, or Capture' : 'drop a sample';
    text(msg, w[0] + w[2] / 2, mid - 6, 8, DIM, 1, 'center');
    text('until then: synth voices', w[0] + w[2] / 2, mid + 12, 8, DIM, 0.8, 'center');
  }

  // where each lane starts in the sound, and how far Walk takes it
  for (var l = 0; l < LANES; l++) {
    var sx = w[0] + (st.stt[l] / 100) * w[2];
    var span = (st.wlk[l] / 100) * w[2] * ((st.len[l] - 1) / st.len[l]);
    var col = COLORS[l];
    var selected = l === st.sel;
    var by = w[1] + w[3] - 3 - (LANES - 1 - l) * 3;
    if (span > 0.5) {
      rgba(col, 0.35);
      mgraphics.rectangle(sx, by, Math.min(span, w[0] + w[2] - sx), 2);
      mgraphics.fill();
    }
    var glow = 0.45 + 0.55 * st.act[l];
    rgba(col, selected ? 1 : glow * 0.8);
    mgraphics.rectangle(Math.round(sx) - (selected ? 1 : 0), w[1], selected ? 2 : 1, w[3]);
    mgraphics.fill();
    // a flag at the top, lit while the lane sounds
    rgba(col, selected ? 1 : glow);
    mgraphics.move_to(sx, w[1]);
    mgraphics.line_to(sx + 5, w[1]);
    mgraphics.line_to(sx, w[1] + 5);
    mgraphics.close_path();
    mgraphics.fill();
  }

  // capture state
  if (VARIANT === 'fx') {
    if (st.cap === 2) {
      rgba([0.95, 0.25, 0.25], 0.9);
      mgraphics.rectangle(w[0], w[1] + w[3] - 2, w[2] * st.capProg, 2);
      mgraphics.fill();
      text('REC', statusX, s[1] + 11, 8, [1, 0.35, 0.35], 1, 'right');
    } else if (st.cap === 1) {
      var on = Math.floor(Date.now() / 250) % 2 === 0;
      text('ARMED', statusX, s[1] + 11, 8, [1, 0.6, 0.3], on ? 1 : 0.35, 'right');
    }
  } else if (st.chord.length) {
    var names = [];
    var sorted = st.chord.slice().sort(function (a, b) { return a - b; });
    for (var i = 0; i < sorted.length && i < 4; i++) names.push(noteName(sorted[i]));
    if (sorted.length > 4) names.push('+' + (sorted.length - 4));
    text(names.join(' '), statusX, s[1] + 11, 8, COLORS[3], st.held > 0 ? 1 : 0.55, 'right');
  }
}

function rowY(r) {
  return G.rowY0 + r * G.rowPitch;
}
function padX(k) {
  return G.padX + k * G.padPitch;
}

function drawGrid() {
  var g = G.grid;
  rgba(BG);
  roundRect(g[0], g[1], g[2], g[3], 5);
  mgraphics.fill();

  // header: step numbers and the Euclid columns
  for (var k = 0; k < STEPS; k += 4) text(String(k + 1), padX(k) + 1, g[1] + 9, 8, DIM, 1);
  var heads = ['LEN', 'HIT', 'ROT'];
  for (var f = 0; f < 3; f++) text(heads[f], G.fieldX[f] + G.fieldW / 2, g[1] + 9, 7, DIM, 1, 'center');

  for (var l = 0; l < LANES; l++) drawRow(l);
}

function drawRow(l) {
  var y = rowY(l);
  var h = G.rowH;
  var col = COLORS[l];
  var on = st.on[l] > 0.5;
  var len = st.len[l];
  var selected = l === st.sel;
  var fade = on ? 1 : 0.35;

  if (selected) {
    rgba(col, 0.07);
    roundRect(G.laneX + G.laneW + 1, y - 1, G.diceX + G.diceW - G.laneX - G.laneW, h + 2, 3);
    mgraphics.fill();
    rgba(col, 0.9);
    mgraphics.rectangle(G.laneX + G.laneW + 1, y + 1, 2, h - 2);
    mgraphics.fill();
  }

  // beat groups
  for (var b = 0; b < 4; b++) {
    rgba(b % 2 ? PANEL : [0.09, 0.095, 0.108], 1);
    roundRect(padX(b * 4) - 1, y - 1, G.padPitch * 4, h + 2, 3);
    mgraphics.fill();
  }

  for (var k = 0; k < STEPS; k++) {
    var x = padX(k);
    var inLane = k < len;
    var isOn = bit(st.pat[l], k);
    var isAcc = bit(st.acc[l], k);
    var isRoll = bit(st.rol[l], k);
    var playing = st.playing && inLane && st.steps[l] === k;
    var hovered = hover && hover.kind === 'pad' && hover.lane === l && hover.step === k;

    if (!inLane) {
      rgba([0.12, 0.125, 0.14], 1);
      roundRect(x, y, G.padW, h, 3);
      mgraphics.fill();
      rgba(DIM, 0.35);
      mgraphics.rectangle(x + G.padW / 2 - 1, y + h / 2 - 1, 2, 2);
      mgraphics.fill();
      continue;
    }
    // the pad
    rgba(isOn ? mix(OFF, col, 0.22 * fade) : OFF, 1);
    roundRect(x, y, G.padW, h, 3);
    mgraphics.fill();

    if (isOn) {
      // the hit leans by exactly as much as swing and nudge move it
      var lean = stepOffset(l, k) * 7;
      if (lean > 5) lean = 5;
      if (lean < -3) lean = -3;
      var bw = 8;
      var bx = x + 3.5 + lean;
      var bh = isAcc ? h - 4 : h - 8;
      var byy = y + h - 2 - bh;
      rgba(isAcc ? col : mix(col, OFF, 0.35), fade);
      roundRect(bx, byy, bw, bh, 2);
      mgraphics.fill();
      if (isRoll) {
        var n = 2;
        rgba(BG, 0.85);
        for (var r = 1; r <= n; r++) {
          mgraphics.rectangle(bx, byy + (bh * r) / (n + 1), bw, 1);
        }
        mgraphics.fill();
      }
    }
    if (playing) {
      rgba([1, 1, 1], 0.55 + 0.45 * st.act[l]);
      mgraphics.set_line_width(1.5);
      roundRect(x - 0.5, y - 0.5, G.padW + 1, h + 1, 3);
      mgraphics.stroke();
    } else if (hovered) {
      rgba([1, 1, 1], 0.25);
      mgraphics.set_line_width(1);
      roundRect(x + 0.5, y + 0.5, G.padW - 1, h - 1, 3);
      mgraphics.stroke();
    }
  }

  // LEN / HIT / ROT
  var vals = [st.len[l], st.hit[l], st.rot[l]];
  for (var f = 0; f < 3; f++) {
    var fx = G.fieldX[f];
    var active = drag && drag.kind === 'field' && drag.lane === l && drag.field === f;
    var hov = hover && hover.kind === 'field' && hover.lane === l && hover.field === f;
    rgba(active ? mix(OFF, col, 0.5) : hov ? mix(OFF, col, 0.25) : OFF, 1);
    roundRect(fx, y, G.fieldW, h, 3);
    mgraphics.fill();
    text(String(vals[f]), fx + G.fieldW / 2, y + h - 5, 9, active || hov ? INK : mix(INK, col, 0.3), fade, 'center');
  }

  // a die: regenerate this lane in the current style
  var dx = G.diceX;
  var dh = hover && hover.kind === 'dice' && hover.lane === l;
  rgba(dh ? col : DIM, dh ? 1 : 0.8);
  mgraphics.set_line_width(1);
  roundRect(dx + 0.5, y + 2.5, G.diceW - 1, h - 5, 2);
  mgraphics.stroke();
  var cx = dx + G.diceW / 2;
  var cy = y + h / 2;
  var pips = [[-2.5, -2.5], [0, 0], [2.5, 2.5]];
  for (var p = 0; p < pips.length; p++) {
    mgraphics.rectangle(cx + pips[p][0] - 0.75, cy + pips[p][1] - 0.75, 1.5, 1.5);
  }
  mgraphics.fill();
}

// ------------------------------------------------------------------ the mouse
function hitTest(x, y) {
  var w = G.wave;
  if (x >= w[0] && x < w[0] + w[2] && y >= w[1] && y < w[1] + w[3]) return { kind: 'wave' };
  for (var l = 0; l < LANES; l++) {
    var ry = rowY(l);
    if (y < ry - 1 || y > ry + G.rowH + 1) continue;
    if (x >= G.padX - 1 && x < G.padX + STEPS * G.padPitch) {
      var k = Math.floor((x - G.padX + 1) / G.padPitch);
      if (k >= 0 && k < STEPS) return { kind: 'pad', lane: l, step: k };
    }
    for (var f = 0; f < 3; f++) {
      if (x >= G.fieldX[f] && x < G.fieldX[f] + G.fieldW) return { kind: 'field', lane: l, field: f };
    }
    if (x >= G.diceX && x < G.diceX + G.diceW) return { kind: 'dice', lane: l };
  }
  return null;
}

function onclick(x, y, but, cmd, shift, capslock, option, ctrl) {
  var t = hitTest(x, y);
  drag = null;
  if (!t) return;
  if (t.kind === 'wave') {
    drag = { kind: 'wave' };
    setStartFromX(x);
    return;
  }
  if (t.lane !== st.sel) {
    st.sel = t.lane;
    send('sel', t.lane);
  }
  if (t.kind === 'pad') return padDown(t.lane, t.step, cmd || ctrl, shift, option);
  if (t.kind === 'field') {
    pushUndo();
    drag = { kind: 'field', lane: t.lane, field: t.field, y0: y, v0: [st.len, st.hit, st.rot][t.field][t.lane] };
    return redraw();
  }
  if (t.kind === 'dice') {
    pushUndo();
    generateLane(t.lane, st.style);
    sendLane(t.lane);
    return redraw();
  }
}
onclick.local = 1;

function padDown(l, k, cmd, shift, option) {
  pushUndo();
  if (cmd) {
    // Cmd/Ctrl-click: the lane ends here
    st.len[l] = k + 1;
    send('len' + l, st.len[l]);
    return redraw();
  }
  if (k >= st.len[l]) {
    st.len[l] = k + 1;
    send('len' + l, st.len[l]);
  }
  var on = bit(st.pat[l], k);
  var acc = bit(st.acc[l], k);
  var roll = bit(st.rol[l], k);
  var state;
  if (option) {
    // Alt-click: roll
    state = { on: 1, acc: on ? acc : 0, roll: on ? 1 - roll : 1 };
  } else if (shift) {
    // Shift-click: accent
    state = { on: 1, acc: on ? 1 - acc : 1, roll: on ? roll : 0 };
  } else {
    // click cycles: off, on, accent, off
    state = !on ? { on: 1, acc: 0, roll: 0 } : !acc ? { on: 1, acc: 1, roll: roll } : { on: 0, acc: 0, roll: 0 };
  }
  applyPad(l, k, state);
  drag = { kind: 'paint', lane: l, state: state, last: k };
  redraw();
}

function applyPad(l, k, s) {
  st.pat[l] = setBit(st.pat[l], k, s.on);
  st.acc[l] = setBit(st.acc[l], k, s.on && s.acc);
  st.rol[l] = setBit(st.rol[l], k, s.on && s.roll);
  st.hit[l] = countBits(st.pat[l], st.len[l]);
  send('pat' + l, st.pat[l]);
  send('acc' + l, st.acc[l]);
  send('rol' + l, st.rol[l]);
  send('hit' + l, st.hit[l]);
}

function setStartFromX(x) {
  var w = G.wave;
  var v = Math.max(0, Math.min(100, ((x - w[0]) / w[2]) * 100));
  st.stt[st.sel] = v;
  send('stt' + st.sel, Math.round(v * 10) / 10);
  redraw();
}

function ondrag(x, y, but, cmd, shift, capslock, option, ctrl) {
  if (!drag) return;
  if (!but) {
    drag = null;
    return redraw();
  }
  if (drag.kind === 'wave') return setStartFromX(x);
  if (drag.kind === 'paint') {
    var t = hitTest(x, rowY(drag.lane) + G.rowH / 2);
    if (t && t.kind === 'pad' && t.step !== drag.last && t.step < st.len[drag.lane]) {
      drag.last = t.step;
      applyPad(drag.lane, t.step, drag.state);
      redraw();
    }
    return;
  }
  if (drag.kind === 'field') {
    var steps = Math.round((drag.y0 - y) / 6);
    var l = drag.lane;
    if (drag.field === 0) {
      var len = clampInt(drag.v0 + steps, 1, 16);
      if (len !== st.len[l]) {
        st.len[l] = len;
        if (st.hit[l] > len) st.hit[l] = len;
        if (st.rot[l] > len - 1) st.rot[l] = len - 1;
        send('len' + l, len);
        send('hit' + l, st.hit[l]);
        send('rot' + l, st.rot[l]);
      }
    } else {
      var lim = drag.field === 1 ? st.len[l] : st.len[l] - 1;
      var v = clampInt(drag.v0 + steps, 0, lim);
      var cur = drag.field === 1 ? st.hit[l] : st.rot[l];
      if (v !== cur) {
        if (drag.field === 1) st.hit[l] = v;
        else st.rot[l] = v;
        applyEuclid(l);
        sendLane(l);
      }
    }
    redraw();
  }
}
ondrag.local = 1;

function onidle(x, y, but, cmd, shift, capslock, option, ctrl) {
  var t = hitTest(x, y);
  var same = (!t && !hover) || (t && hover && t.kind === hover.kind && t.lane === hover.lane && t.step === hover.step && t.field === hover.field);
  if (!same) {
    hover = t;
    redraw();
  }
}
onidle.local = 1;

function onidleout() {
  if (hover) {
    hover = null;
    redraw();
  }
}
onidleout.local = 1;

// HIT and ROT write a Euclidean pattern. Accents and rolls that still land on
// a hit are kept, so turning HIT does not wipe out the feel.
function applyEuclid(l) {
  var p = euclid(st.len[l], st.hit[l], st.rot[l]);
  var keep = 0;
  for (var k = 16; k-- > 0;) keep = setBit(keep, k, k >= st.len[l] ? bit(st.pat[l], k) : bit(p, k));
  st.pat[l] = keep;
  st.acc[l] = andMask(st.acc[l], keep);
  st.rol[l] = andMask(st.rol[l], keep);
}
function andMask(a, b) {
  return a & b & 65535;
}

// ------------------------------------------------------------------ the pattern brain
// Each style knows what a techno kick, clap, hat and tone line do in it, and
// rolls the dice inside those rules, so Generate is never the same twice and
// never stops sounding like the style it is in.
var STYLES = ['Classic', 'Rolling', 'Minimal', 'Broken', 'Hypnotic', 'Chaos'];

var rnd = Math.random;
function chance(p) {
  return rnd() < p;
}
function pick(list) {
  return list[Math.floor(rnd() * list.length) % list.length];
}
function range(a, b) {
  return a + Math.floor(rnd() * (b - a + 1));
}

var FOUR = [0, 4, 8, 12];
var OFFBEATS = [2, 6, 10, 14];
var ROLLING = [1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15];

function lanePlan(l, style) {
  var len = 16;
  var pat = 0;
  var acc = 0;
  var rol = 0;
  var k;
  var name = STYLES[style] || 'Classic';

  if (name === 'Chaos') {
    len = l === 0 ? pick([16, 16, 12, 14]) : range(5, 16);
    var dens = [0.32, 0.22, 0.5, 0.42][l];
    for (k = 0; k < len; k++) {
      if (chance(dens)) pat = setBit(pat, k, 1);
    }
    if (l === 0) pat = setBit(pat, 0, 1);
    for (k = 0; k < len; k++) {
      if (bit(pat, k) && chance(0.3)) acc = setBit(acc, k, 1);
      if (bit(pat, k) && l > 0 && chance(0.1)) rol = setBit(rol, k, 1);
    }
    return { len: len, pat: pat, acc: acc, rol: rol };
  }

  if (l === 0) {
    if (name === 'Broken') {
      pat = pick([maskFrom([0, 6, 10]), maskFrom([0, 3, 8, 11]), maskFrom([0, 7, 10, 13]), euclid(16, 5, 0), maskFrom([0, 4, 7, 10])]);
    } else {
      pat = maskFrom(FOUR);
      if (name === 'Classic' && chance(0.2)) pat = setBit(pat, pick([7, 14, 15]), 1);
      if (name === 'Rolling' && chance(0.15)) pat = setBit(pat, 15, 1);
    }
    acc = andMask(maskFrom(FOUR), pat);
    if (!acc) acc = setBit(0, firstBit(pat), 1);
    return { len: 16, pat: pat, acc: acc, rol: 0 };
  }

  if (l === 1) {
    if (name === 'Minimal') pat = chance(0.6) ? maskFrom([12]) : maskFrom([4, 12]);
    else if (name === 'Rolling') pat = chance(0.5) ? maskFrom([12]) : maskFrom([4, 12]);
    else if (name === 'Hypnotic') pat = maskFrom([12]);
    else pat = maskFrom([4, 12]);
    acc = pat;
    if (name === 'Classic' && chance(0.35)) pat = setBit(pat, pick([15, 7, 11]), 1);
    if (name === 'Broken') pat = setBit(pat, pick([3, 9, 13, 15]), 1);
    if ((name === 'Classic' || name === 'Rolling') && chance(0.2)) rol = andMask(setBit(0, 15, 1), pat);
    return { len: 16, pat: pat, acc: acc, rol: rol };
  }

  if (l === 2) {
    if (name === 'Rolling') {
      pat = 65535;
      for (k = 0; k < 16; k++) if (k % 4 !== 2 && chance(0.15)) pat = setBit(pat, k, 0);
      acc = maskFrom(OFFBEATS);
      if (chance(0.35)) rol = setBit(0, pick([7, 15]), 1);
    } else if (name === 'Minimal') {
      pat = maskFrom(OFFBEATS);
      if (chance(0.4)) pat = setBit(pat, pick([3, 11, 15]), 1);
      acc = maskFrom(OFFBEATS);
    } else if (name === 'Broken') {
      pat = euclid(16, pick([7, 9, 11]), range(0, 3));
      acc = andMask(maskFrom(OFFBEATS), pat);
    } else if (name === 'Hypnotic') {
      len = pick([10, 12, 14]);
      pat = euclid(len, Math.round(len * pick([0.45, 0.55, 0.6])), range(0, 2));
      acc = andMask(euclid(len, Math.max(1, Math.round(len / 4)), 1), pat);
    } else {
      pat = maskFrom(OFFBEATS);
      for (k = 1; k < 16; k += 2) if (chance(0.3)) pat = setBit(pat, k, 1);
      acc = maskFrom(OFFBEATS);
      if (chance(0.3)) rol = setBit(0, 15, 1);
      if (rol) pat = setBit(pat, 15, 1);
    }
    return { len: len, pat: pat, acc: andMask(acc, pat), rol: andMask(rol, pat) };
  }

  // tone
  if (name === 'Rolling') {
    pat = maskFrom(ROLLING);
    for (k = 0; k < 16; k++) if (bit(pat, k) && k % 4 !== 2 && chance(0.2)) pat = setBit(pat, k, 0);
    acc = andMask(maskFrom(OFFBEATS), pat);
  } else if (name === 'Minimal') {
    pat = euclid(16, range(3, 5), range(1, 3));
    acc = pat;
  } else if (name === 'Broken') {
    pat = euclid(16, range(5, 7), range(1, 4));
    for (k = 0; k < 16; k++) if (bit(pat, k) && chance(0.4)) acc = setBit(acc, k, 1);
  } else if (name === 'Hypnotic') {
    len = pick([7, 9, 11, 13]);
    pat = euclid(len, range(3, Math.min(6, len - 2)), range(0, 2));
    acc = setBit(0, firstBit(pat), 1);
  } else {
    pat = pick([maskFrom(OFFBEATS), maskFrom([2, 3, 6, 7, 10, 11, 14]), maskFrom([3, 6, 10, 13, 15]), maskFrom([1, 3, 6, 9, 11, 14])]);
    for (k = 0; k < 16; k++) if (bit(pat, k) && chance(0.4)) acc = setBit(acc, k, 1);
  }
  return { len: len, pat: pat, acc: andMask(acc, pat), rol: 0 };
}

function firstBit(mask) {
  for (var k = 0; k < 16; k++) if (bit(mask, k)) return k;
  return 0;
}

function generateLane(l, style) {
  var p = lanePlan(l, style);
  st.len[l] = p.len;
  st.pat[l] = p.pat;
  st.acc[l] = andMask(p.acc, p.pat);
  st.rol[l] = andMask(p.rol, p.pat);
  st.hit[l] = countBits(p.pat, p.len);
  st.rot[l] = 0;
}

function generateAll() {
  pushUndo();
  for (var l = 0; l < LANES; l++) {
    generateLane(l, st.style);
    sendLane(l);
  }
  redraw();
}

// Small, musical changes: a step moves, appears or goes, an accent shifts.
// The kick's downbeats are never touched: they are what holds it together.
function mutateAll() {
  pushUndo();
  for (var l = 0; l < LANES; l++) {
    var len = st.len[l];
    var changes = l === 0 ? (chance(0.4) ? 1 : 0) : range(1, 2);
    for (var c = 0; c < changes; c++) {
      var r = rnd();
      var hits = [];
      for (var k = 0; k < len; k++) if (bit(st.pat[l], k)) hits.push(k);
      if (l === 0) {
        var spots = [2, 3, 6, 7, 10, 11, 14, 15];
        var s = pick(spots);
        if (s < len) st.pat[l] = setBit(st.pat[l], s, 1 - bit(st.pat[l], s));
      } else if (r < 0.45 || !hits.length) {
        var t = range(0, len - 1);
        st.pat[l] = setBit(st.pat[l], t, 1 - bit(st.pat[l], t));
      } else if (r < 0.7) {
        var from = pick(hits);
        var to = (from + (chance(0.5) ? 1 : len - 1)) % len;
        if (!bit(st.pat[l], to)) {
          st.pat[l] = setBit(setBit(st.pat[l], from, 0), to, 1);
          st.acc[l] = setBit(setBit(st.acc[l], to, bit(st.acc[l], from)), from, 0);
        }
      } else if (r < 0.9) {
        var a = pick(hits);
        st.acc[l] = setBit(st.acc[l], a, 1 - bit(st.acc[l], a));
      } else if (l === 1 || l === 2) {
        var h = pick(hits);
        st.rol[l] = setBit(st.rol[l], h, 1 - bit(st.rol[l], h));
      }
    }
    st.acc[l] = andMask(st.acc[l], st.pat[l]);
    st.rol[l] = andMask(st.rol[l], st.pat[l]);
    st.hit[l] = countBits(st.pat[l], len);
    sendLane(l);
  }
  redraw();
}

function clearLane(l) {
  pushUndo();
  st.pat[l] = 0;
  st.acc[l] = 0;
  st.rol[l] = 0;
  st.hit[l] = 0;
  sendLane(l);
  redraw();
}

function undo() {
  if (!undoStack.length) return;
  var s = undoStack.pop();
  st.pat = s.pat;
  st.acc = s.acc;
  st.rol = s.rol;
  st.len = s.len;
  st.hit = s.hit;
  st.rot = s.rot;
  for (var l = 0; l < LANES; l++) sendLane(l);
  redraw();
}
