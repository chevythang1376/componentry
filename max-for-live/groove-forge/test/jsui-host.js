'use strict';
// A stand-in for Max's jsui host, enough to run groove-forge-ui.js in Node.
//
// mgraphics here only has the calls the real one is documented to have, so a
// drawing call that Max would not understand fails a test instead of leaving
// a blank box in Live. Every coordinate passed to it must be a finite number.
// Pass a canvas 2D context as `ctx` to render for real (tools/preview.js).

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SCRIPT = path.join(__dirname, '..', 'groove-forge-ui.js');

function makeMgraphics(ctx, record) {
  let size = [620, 100];
  let fontSize = 10;
  let fontFace = 'Arial Bold';
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
    get size() { return size; },
    set_source_rgba(r, g, b, a) {
      finite('set_source_rgba', [r, g, b, a]);
      if (ctx) {
        const c = `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a})`;
        ctx.fillStyle = c;
        ctx.strokeStyle = c;
      }
    },
    set_line_width(w) { finite('set_line_width', [w]); if (ctx) ctx.lineWidth = w; },
    rectangle(x, y, w, h) { finite('rectangle', [x, y, w, h]); begin(); if (ctx) ctx.rect(x, y, w, h); },
    rectangle_rounded(x, y, w, h, ow, oh) {
      finite('rectangle_rounded', [x, y, w, h, ow, oh]);
      begin();
      if (ctx) ctx.roundRect(x, y, w, h, Math.min(ow, oh) / 2);
    },
    ellipse(x, y, w, h) { finite('ellipse', [x, y, w, h]); begin(); if (ctx) ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); },
    arc(xc, yc, r, a1, a2) { finite('arc', [xc, yc, r, a1, a2]); begin(); if (ctx) ctx.arc(xc, yc, r, a1, a2); },
    move_to(x, y) { finite('move_to', [x, y]); begin(); if (ctx) ctx.moveTo(x, y); this._pt = [x, y]; },
    line_to(x, y) { finite('line_to', [x, y]); begin(); if (ctx) ctx.lineTo(x, y); },
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
    text_measure(str) {
      if (ctx) {
        ctx.font = cssFont();
        const m = ctx.measureText(String(str));
        return [m.width, fontSize];
      }
      return [String(str).length * fontSize * 0.6, fontSize];
    },
    show_text(str) {
      record.push(['show_text', String(str)]);
      if (ctx) {
        ctx.font = cssFont();
        ctx.fillText(String(str), this._pt[0], this._pt[1]);
      }
      pathOpen = false;
      if (ctx) ctx.beginPath();
    },
    _setSize(w, h) { size = [w, h]; },
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

function loadUI({ variant = 'inst', ctx = null, buffers = {}, random = null } = {}) {
  const record = [];
  const outputs = [];
  const mgraphics = makeMgraphics(ctx, record);
  const sandbox = {
    mgraphics,
    jsarguments: ['groove-forge-ui.js', variant],
    outlet: (n, ...args) => outputs.push([n, ...args]),
    post: () => {},
    arrayfromargs: (a) => Array.prototype.slice.call(a),
    Buffer: makeBufferClass(buffers),
    messagename: '',
    inlets: 0,
    outlets: 0,
    autowatch: 1,
    Date,
    Math: random ? Object.assign(Object.create(Math), { random }) : Math,
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(SCRIPT, 'utf8'), sandbox, { filename: 'groove-forge-ui.js' });
  const ui = {
    sandbox,
    record,
    outputs,
    // a message into the jsui's inlet, the way Max delivers it
    msg(name, ...args) {
      sandbox.messagename = name;
      if (typeof sandbox[name] === 'function' && !sandbox[name].local) sandbox[name](...args);
      else sandbox.anything(...args);
    },
    click(x, y, mods = {}) {
      sandbox.onclick(x, y, 1, mods.cmd ? 1 : 0, mods.shift ? 1 : 0, 0, mods.option ? 1 : 0, mods.ctrl ? 1 : 0);
    },
    drag(x, y) { sandbox.ondrag(x, y, 1, 0, 0, 0, 0, 0); },
    release(x, y) { sandbox.ondrag(x, y, 0, 0, 0, 0, 0, 0); },
    paint() { record.length = 0; sandbox.paint(); return record; },
    state: () => sandbox.st,
    take() { const o = outputs.slice(); outputs.length = 0; return o; },
  };
  return ui;
}

module.exports = { loadUI, SCRIPT };
