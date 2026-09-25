'use strict';
// Renders a device's presentation view to a PNG, for reviewing the layout
// without Live.
//
// The displays (the two jsui boxes) are the real drawing code, run through the
// same stand-in host the tests use, each clipped to its own box as Max clips
// it. Boxes are drawn in Max's order: the background layer first, then the
// list from last to first, so the first box ends up in front; anything a box
// would hide in Live, it hides here too. Live draws its own knobs, menus and
// buttons, so those are approximations: right size, right place, right values,
// but Live's look. Use it to check spacing, not to judge Live's styling.
//
//   npm install --no-save @napi-rs/canvas
//   node tools/preview.js                         both devices -> preview-*.png
//   node tools/preview.js --variant fx --lane 2 --page 1 --rec --out fx.png

const fs = require('fs');
const path = require('path');

let canvasLib;
try {
  canvasLib = require('@napi-rs/canvas');
} catch (e) {
  console.error('preview needs a canvas: npm install --no-save @napi-rs/canvas');
  process.exit(1);
}
const { createCanvas, GlobalFonts } = canvasLib;
const { buildAll } = require('../src/build');
const { loadUI } = require('../test/jsui-host');
const { LANE_PARAMS } = require('../src/spec');

const FONT_FILES = [
  '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
  '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
  'C:\\Windows\\Fonts\\arialbd.ttf',
];
for (const f of FONT_FILES) if (fs.existsSync(f)) GlobalFonts.registerFromPath(f, 'Liberation Sans');

const argv = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = argv.indexOf('--' + name);
  if (i < 0) return dflt;
  const v = argv[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
};

const PAGES = ['sound', 'shape', 'groove'];
const PAGE_OF = Object.fromEntries(LANE_PARAMS.filter((p) => PAGES.includes(p.page)).map((p) => [p.id, p.page]));

function fmt(v, a) {
  const u = a.parameter_unitstyle;
  if (a.parameter_type === 2) return a.parameter_enum[v];
  if (u === 5) return (Math.abs(v) >= 10 ? v.toFixed(0) : v.toFixed(1)) + ' %';
  if (u === 4) return v.toFixed(1) + ' dB';
  if (u === 3) return v >= 1000 ? (v / 1000).toFixed(2) + ' kHz' : v.toFixed(0) + ' Hz';
  if (u === 2) return v >= 1000 ? (v / 1000).toFixed(2) + ' s' : (v < 10 ? v.toFixed(1) : v.toFixed(0)) + ' ms';
  if (u === 7) return v.toFixed(0) + ' st';
  if (u === 6) return v === 0 ? 'C' : Math.abs(v).toFixed(0) + (v < 0 ? 'L' : 'R');
  return String(v);
}

// A decaying, slightly noisy tone: something for the waveform to show.
function demoSample() {
  const frames = 48000;
  const data = [new Float64Array(frames), new Float64Array(frames)];
  let seed = 3;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < frames; i++) {
    const t = i / 48000;
    const env = Math.exp(-t * 2.5) * (0.55 + 0.45 * Math.sin(t * 17));
    const v = env * (Math.sin(2 * Math.PI * 150 * t) * 0.55 + Math.sin(2 * Math.PI * 450 * t) * 0.2 + (rnd() * 2 - 1) * 0.35 * Math.exp(-t * 6));
    data[0][i] = v;
    data[1][i] = v * 0.9;
  }
  return { frames, channels: 2, data };
}

function render({ variant, lane = 0, page = 0, rec = false, empty = false, scale = 2 }) {
  const d = buildAll({ write: false }).find((x) => x.variant === variant);
  const P = JSON.parse(d.json).patcher;
  const W = P.devicewidth;
  const H = 169;
  const canvas = createCanvas(W * scale, (H + 18) * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  const TXT = '#d6d6d6';
  const DIM = '#9a9a9a';
  const rgba = (a) => `rgba(${Math.round(a[0] * 255)},${Math.round(a[1] * 255)},${Math.round(a[2] * 255)},${a[3] ?? 1})`;
  const rrect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  };
  const label = (t, x, y, size = 9, color = TXT, align = 'center') => {
    ctx.font = `bold ${size}px "Liberation Sans", Arial, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(t, x, y);
    ctx.textAlign = 'left';
  };

  // Live's device frame: a title bar over the body
  ctx.fillStyle = '#2b2b2b';
  ctx.fillRect(0, 0, W, H + 18);
  ctx.fillStyle = '#5f5f5f';
  ctx.fillRect(0, 0, W, 16);
  label(d.file.replace(/\.amxd$/, ''), 22, 12, 10, '#e8e8e8', 'left');
  ctx.translate(0, 18);
  ctx.fillStyle = '#414141';
  ctx.fillRect(0, 0, W, H);

  // a display, drawn by its own code, clipped to its box
  const display = (box) => {
    const [x, y, w, h] = box.presentation_rect;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.translate(x, y);
    const [, part] = box.jsarguments;
    const ui = loadUI({ variant, part, rect: box.presentation_rect, ctx, buffers: empty ? {} : { smp: demoSample() } });
    ui.msg('setbuf', 'smp');
    ui.msg('init');
    ui.msg('loaded');
    ui.msg('swingamt', 58);
    ui.msg('len3', 12);
    ui.msg('rol2', 1 << 15);
    ui.msg('sel', lane);
    ui.msg('steps', 65536 + 6 + 6 * 16 + 6 * 256 + 6 * 4096);
    ui.msg('act', 12 + 3 * 16 + 9 * 256 + 14 * 4096);
    if (variant === 'inst' && !empty) {
      ui.msg('note', 60, 100);
      ui.msg('note', 63, 100);
      ui.msg('note', 67, 100);
    }
    if (variant === 'fx' && rec) ui.msg('stat', 2 + 16 * 60);
    ui.paint();
    ctx.restore();
  };

  // Max's order: background layer, then the list from last (back) to first (front)
  const shown = P.boxes.map((b) => b.box).filter((b) => b.presentation);
  const order = [...shown.filter((b) => b.background).reverse(), ...shown.filter((b) => !b.background).reverse()];
  for (const box of order) {
    const m = /^gf_(?:lbl_)?([a-z]+)(\d)$/.exec(box.varname || '');
    let hidden = box.hidden;
    if (m && PAGE_OF[m[1]]) hidden = !(+m[2] === lane && PAGES[page] === PAGE_OF[m[1]]);
    if (hidden) continue;
    const [x, y, w, h] = box.presentation_rect;
    const a = (box.saved_attribute_attributes && box.saved_attribute_attributes.valueof) || {};
    let v = a.parameter_initial ? a.parameter_initial[0] : 0;
    if (box.varname === 'gf_lanetab') v = lane;
    if (box.varname === 'gf_pagetab') v = page;
    switch (box.maxclass) {
      case 'panel':
        rrect(x, y, w, h, (box.rounded || 0) / 2);
        ctx.fillStyle = rgba(box.bgcolor);
        ctx.fill();
        break;
      case 'jsui':
        display(box);
        break;
      case 'live.dial': {
        const col = box.activedialcolor ? rgba(box.activedialcolor) : '#f0a030';
        const tiny = box.appearance === 1;
        const cx = x + w / 2;
        const r = tiny ? Math.min(w, h) / 2 - 2 : Math.min(w * 0.36, (h - 22) / 2);
        const cy = tiny ? y + h / 2 : y + 11 + r + 1;
        const a0 = Math.PI * 0.75;
        const a1 = Math.PI * 2.25;
        let t = (v - a.parameter_mmin) / (a.parameter_mmax - a.parameter_mmin);
        if (a.parameter_exponent) t = Math.pow(t, 1 / a.parameter_exponent);
        ctx.lineWidth = tiny ? 2 : 2.5;
        ctx.strokeStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.arc(cx, cy, r, a0, a1);
        ctx.stroke();
        const from = a.parameter_mmin < 0 && a.parameter_mmax > 0 ? a0 + (a1 - a0) * (-a.parameter_mmin / (a.parameter_mmax - a.parameter_mmin)) : a0;
        const to = a0 + (a1 - a0) * t;
        ctx.strokeStyle = col;
        ctx.beginPath();
        ctx.arc(cx, cy, r, Math.min(from, to), Math.max(from, to));
        ctx.stroke();
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(to) * r * 0.35, cy + Math.sin(to) * r * 0.35);
        ctx.lineTo(cx + Math.cos(to) * r, cy + Math.sin(to) * r);
        ctx.stroke();
        if (!tiny) {
          label(a.parameter_shortname, cx, y + 9);
          label(fmt(v, a), cx, y + h - 2, 9, DIM);
        }
        break;
      }
      case 'live.menu':
        rrect(x, y, w, h, 2);
        ctx.fillStyle = '#2e2e2e';
        ctx.fill();
        label(fmt(v, a), x + 4, y + h - 4, 9, TXT, 'left');
        ctx.fillStyle = DIM;
        ctx.beginPath();
        ctx.moveTo(x + w - 9, y + h / 2 - 2);
        ctx.lineTo(x + w - 3, y + h / 2 - 2);
        ctx.lineTo(x + w - 6, y + h / 2 + 2);
        ctx.fill();
        break;
      case 'live.tab': {
        const items = a.parameter_enum;
        const iw = w / items.length;
        items.forEach((it, i) => {
          rrect(x + i * iw + 0.5, y, iw - 1, h, 1);
          ctx.fillStyle = i === v ? '#e8a23a' : '#2e2e2e';
          ctx.fill();
          label(it, x + i * iw + iw / 2, y + h - 4, 8.5, i === v ? '#111' : TXT);
        });
        break;
      }
      case 'live.text': {
        const on = box.mode === 1 && v === 1;
        rrect(x, y, w, h, 2);
        ctx.fillStyle = on && box.activebgoncolor ? rgba(box.activebgoncolor) : box.activebgcolor ? rgba(box.activebgcolor) : '#2e2e2e';
        ctx.fill();
        label(box.text, x + w / 2, y + h / 2 + 3.5, 9, on ? '#111' : box.activetextcolor ? rgba(box.activetextcolor) : TXT);
        break;
      }
      case 'live.numbox':
        rrect(x, y, w, h, 2);
        ctx.fillStyle = '#2e2e2e';
        ctx.fill();
        label(fmt(v, a), x + w / 2, y + h - 4, 9);
        break;
      case 'live.comment': {
        const size = box.fontsize || 9;
        ctx.font = `bold ${size}px "Liberation Sans", Arial, sans-serif`;
        const lines = [];
        let line = '';
        for (const word of box.text.split(' ')) {
          const t = line ? line + ' ' + word : word;
          if (ctx.measureText(t).width > w - 2 && line) {
            lines.push(line);
            line = word;
          } else line = t;
        }
        lines.push(line);
        let ly = y + size + 1;
        for (const ln of lines) {
          label(ln, box.textjustification === 1 ? x + w / 2 : x + 1, ly, size, size < 9 ? DIM : TXT, box.textjustification === 1 ? 'center' : 'left');
          ly += size + 2;
        }
        break;
      }
      case 'live.drop':
        ctx.setLineDash([3, 2]);
        rrect(x + 0.5, y + 0.5, w - 1, h - 1, 3);
        ctx.strokeStyle = '#8a8a8a';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
        label(box.legend, x + w / 2, y + h / 2 + 3, 9, DIM);
        break;
      case 'live.gain~': {
        rrect(x, y, w, h, 2);
        ctx.fillStyle = '#2a2a2a';
        ctx.fill();
        for (let ch = 0; ch < 2; ch++) {
          const lvl = 0.62 - ch * 0.05;
          const g = ctx.createLinearGradient(0, y + h, 0, y);
          g.addColorStop(0, '#3fbf5f');
          g.addColorStop(0.7, '#d8c83a');
          g.addColorStop(1, '#e04a3a');
          ctx.fillStyle = g;
          ctx.fillRect(x + 6 + ch * 7, y + h - 12 - (h - 20) * lvl, 5, (h - 20) * lvl);
        }
        const fy = y + h - 12 - (h - 20) * (1 - 6 / 76);
        ctx.fillStyle = '#d8d8d8';
        ctx.beginPath();
        ctx.moveTo(x + w - 2, fy);
        ctx.lineTo(x + w - 8, fy - 4);
        ctx.lineTo(x + w - 8, fy + 4);
        ctx.fill();
        label('0.0', x + w / 2, y + h - 2, 8, DIM);
        break;
      }
      default:
        break;
    }
  }
  return canvas.toBuffer('image/png');
}

const variants = flag('variant') ? [flag('variant')] : ['inst', 'fx'];
for (const variant of variants) {
  const out = flag('out', path.join(__dirname, '..', `preview-${variant}.png`));
  fs.writeFileSync(out, render({
    variant,
    lane: +flag('lane', variant === 'fx' ? 2 : 0),
    page: +flag('page', variant === 'fx' ? 1 : 0),
    rec: !!flag('rec', variant === 'fx'),
    empty: !!flag('empty', false),
    scale: +flag('scale', 2),
  }));
  console.log('wrote', path.relative(process.cwd(), out));
}
