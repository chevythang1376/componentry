'use strict';
// A stand-in for Max's jsui host, enough to run the display script in Node.
//
// mgraphics here only has the calls the real one is documented to have, so a
// drawing call that Max would not understand fails a test instead of leaving
// a blank box in Live. Every coordinate passed to it must be a finite number,
// and every shape must land inside the jsui's own box: Max clips a jsui to its
// box, so anything drawn outside it would silently go missing.
//
// The script runs in its own realm with the ES2015 and later built-ins taken
// out, as in Max's legacy engine, so calling one fails here too.
//
// Pass a canvas 2D context as `ctx` to render for real (tools/preview.js).

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { L, UI_SCRIPT } = require('../src/build');

const SCRIPT = path.join(__dirname, '..', 'src', UI_SCRIPT);
// Where each part sits in the device, as the build places it.
const PARTS = { source: L.srcView, grid: L.gridView };

// Built-ins newer than ES5, removed from the script's realm.
const NEWER = `
  ['includes', 'find', 'findIndex', 'fill', 'copyWithin', 'entries', 'keys', 'values', 'flat', 'flatMap', 'at', 'findLast', 'findLastIndex', 'toSorted', 'toReversed', 'with']
    .forEach(function (k) { delete Array.prototype[k]; });
  ['from', 'of'].forEach(function (k) { delete Array[k]; });
  ['assign', 'entries', 'values', 'fromEntries', 'is', 'getOwnPropertySymbols', 'setPrototypeOf'].forEach(function (k) { delete Object[k]; });
  ['includes', 'startsWith', 'endsWith', 'repeat', 'padStart', 'padEnd', 'codePointAt', 'normalize', 'trimStart', 'trimEnd', 'at', 'replaceAll', 'matchAll']
    .forEach(function (k) { delete String.prototype[k]; });
  ['isFinite', 'isNaN', 'isInteger', 'isSafeInteger', 'parseFloat', 'parseInt', 'EPSILON', 'MAX_SAFE_INTEGER', 'MIN_SAFE_INTEGER'].forEach(function (k) { delete Number[k]; });
  ['sign', 'trunc', 'cbrt', 'log2', 'log10', 'log1p', 'expm1', 'hypot', 'fround', 'clz32', 'imul', 'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh']
    .forEach(function (k) { delete Math[k]; });
  ['Map', 'Set', 'WeakMap', 'WeakSet', 'Symbol', 'Promise', 'Proxy', 'Reflect', 'BigInt', 'globalThis'].forEach(function (k) { delete this[k]; }, this);
`;

function makeMgraphics(ctx, record, size) {
  let fontSize = 10;
  let fontFace = 'Arial Bold';
  const inside = (name, x0, y0, x1, y1, slack = 0.5) => {
    const [w, h] = size;
    if (Math.min(x0, x1) < -slack || Math.max(x0, x1) > w + slack || Math.min(y0, y1) < -slack || Math.max(y0, y1) > h + slack) {
      throw new Error(`mgraphics.${name} reaches ${[x0, y0, x1, y1].map((v) => +v.toFixed(1))}, outside the ${w}x${h} jsui`);
    }
  };
  const finite = (name, args) => {
    for (const a of args) {
      if (typeof a === 'number' && !Number.isFinite(a)) throw new Error(`mgraphics.${name} got ${a}`);
    }
    record.push([name, ...args]);
  };
  const cssFont = () => {
    const bold = /bold/i.test(fontFace);
    return `${bold ? 'bold ' : ''}${fontSize}px "Liberation Sans", Arial, sans-serif`;
  };
  const measure = (str) => {
    if (ctx) {
      ctx.font = cssFont();
      return ctx.measureText(String(str)).width;
    }
    return String(str).length * fontSize * 0.6;
  };
  let pathOpen = false;
  const begin = () => {
    if (ctx && !pathOpen) {
      ctx.beginPath();
      pathOpen = true;
    }
  };
  const mg = {
    relative_coords: 0,
    autofill: 0,
    init() {},
    redraw() { record.redraws = (record.redraws || 0) + 1; },
    get size() { return size.slice(); },
    set_source_rgba(r, g, b, a) {
      finite('set_source_rgba', [r, g, b, a]);
      if (ctx) {
        const c = `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a})`;
        ctx.fillStyle = c;
        ctx.strokeStyle = c;
      }
    },
    set_line_width(w) { finite('set_line_width', [w]); if (ctx) ctx.lineWidth = w; },
    rectangle(x, y, w, h) { finite('rectangle', [x, y, w, h]); inside('rectangle', x, y, x + w, y + h); begin(); if (ctx) ctx.rect(x, y, w, h); },
    rectangle_rounded(x, y, w, h, ow, oh) {
      finite('rectangle_rounded', [x, y, w, h, ow, oh]);
      inside('rectangle_rounded', x, y, x + w, y + h);
      begin();
      if (ctx) ctx.roundRect(x, y, w, h, Math.min(ow, oh) / 2);
    },
    ellipse(x, y, w, h) { finite('ellipse', [x, y, w, h]); inside('ellipse', x, y, x + w, y + h); begin(); if (ctx) ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); },
    arc(xc, yc, r, a1, a2) { finite('arc', [xc, yc, r, a1, a2]); inside('arc', xc - r, yc - r, xc + r, yc + r); begin(); if (ctx) ctx.arc(xc, yc, r, a1, a2); },
    move_to(x, y) { finite('move_to', [x, y]); inside('move_to', x, y, x, y); begin(); if (ctx) ctx.moveTo(x, y); this._pt = [x, y]; },
    line_to(x, y) { finite('line_to', [x, y]); inside('line_to', x, y, x, y); begin(); if (ctx) ctx.lineTo(x, y); },
    close_path() { record.push(['close_path']); if (ctx) ctx.closePath(); },
    fill() { record.push(['fill']); if (ctx) ctx.fill(); pathOpen = false; },
    fill_preserve() { record.push(['fill_preserve']); if (ctx) ctx.fill(); },
    stroke() { record.push(['stroke']); if (ctx) ctx.stroke(); pathOpen = false; },
    stroke_preserve() { record.push(['stroke_preserve']); if (ctx) ctx.stroke(); },
    save() { if (ctx) ctx.save(); },
    restore() { if (ctx) ctx.restore(); },
    translate(x, y) { finite('translate', [x, y]); if (ctx) ctx.translate(x, y); },
    select_font_face(name) { fontFace = String(name); },
    set_font_size(s) { finite('set_font_size', [s]); fontSize = s; },
    text_measure(str) { return [measure(str), fontSize]; },
    show_text(str) {
      record.push(['show_text', String(str)]);
      // the text runs right of the point, from its ascent down to its baseline
      inside('show_text "' + str + '"', this._pt[0], this._pt[1] - fontSize * 0.75, this._pt[0] + measure(str), this._pt[1], 1);
      if (ctx) {
        ctx.font = cssFont();
        ctx.fillText(String(str), this._pt[0], this._pt[1]);
      }
      pathOpen = false;
      if (ctx) ctx.beginPath();
    },
  };
  return mg;
}

// A buffer~ as the JS Buffer object sees it: 1-based channels.
function makeBufferClass(buffers) {
  return function Buffer(name) {
    const b = buffers[name];
    this.framecount = () => (b ? b.frames : 0);
    this.channelcount = () => (b ? b.channels : 0);
    this.peek = (ch, frame, count) => {
      const out = [];
      for (let i = 0; i < count; i++) out.push(b && b.data[ch - 1] ? b.data[ch - 1][frame + i] || 0 : 0);
      return count === 1 ? out[0] : out;
    };
  };
}

// One jsui box running the script: `part` is 'source' or 'grid', placed where
// the build places it unless `rect` says otherwise. Mouse calls take device
// pixels, like the geometry in the script, and arrive in the box's own pixels,
// the way Max delivers them.
function loadUI({ variant = 'inst', part = 'grid', rect = PARTS[part], ctx = null, buffers = {}, random = null } = {}) {
  const record = [];
  const outputs = [];
  const [ox, oy, w, h] = rect;
  const mgraphics = makeMgraphics(ctx, record, [w, h]);
  const sandbox = {
    mgraphics,
    jsarguments: [UI_SCRIPT, variant, part, ox, oy],
    outlet: (n, ...args) => outputs.push([n, ...args]),
    post: () => {},
    arrayfromargs: (a) => Array.prototype.slice.call(a),
    Buffer: makeBufferClass(buffers),
    messagename: '',
    inlets: 0,
    outlets: 0,
    autowatch: 1,
    Date,
  };
  vm.createContext(sandbox);
  vm.runInContext(NEWER, sandbox);
  if (random) vm.runInContext('Math.random = __random; delete this.__random;', Object.assign(sandbox, { __random: random }));
  vm.runInContext(fs.readFileSync(SCRIPT, 'utf8'), sandbox, { filename: UI_SCRIPT });
  const local = (x, y) => [x - ox, y - oy];
  const within = (x, y, what) => {
    if (x < ox || y < oy || x >= ox + w || y >= oy + h) throw new Error(`${what} at ${x},${y} is outside the ${part} part (${rect})`);
  };
  const ui = {
    part,
    rect,
    sandbox,
    record,
    outputs,
    // a message into the jsui's inlet, the way Max delivers it
    msg(name, ...args) {
      sandbox.messagename = name;
      if (typeof sandbox[name] === 'function' && !sandbox[name].local) sandbox[name](...args);
      else sandbox.anything(...args);
    },
    // Max only sends a click or a hover to the box under the mouse; a drag
    // keeps going to the box it started in, wherever the mouse goes.
    click(x, y, mods = {}) {
      within(x, y, 'a click');
      sandbox.onclick(...local(x, y), 1, mods.cmd ? 1 : 0, mods.shift ? 1 : 0, 0, mods.option ? 1 : 0, mods.ctrl ? 1 : 0);
    },
    drag(x, y) { sandbox.ondrag(...local(x, y), 1, 0, 0, 0, 0, 0); },
    release(x, y) { sandbox.ondrag(...local(x, y), 0, 0, 0, 0, 0, 0); },
    hover(x, y) {
      within(x, y, 'the mouse');
      sandbox.onidle(...local(x, y), 0, 0, 0, 0, 0, 0);
    },
    leave() { sandbox.onidleout(); },
    paint() { record.length = 0; sandbox.paint(); return record; },
    redraws() { return record.redraws || 0; },
    state: () => sandbox.st,
    take() { const o = outputs.slice(); outputs.length = 0; return o; },
  };
  return ui;
}

module.exports = { loadUI, SCRIPT, PARTS };
