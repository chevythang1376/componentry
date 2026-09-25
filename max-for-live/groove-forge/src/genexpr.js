'use strict';
// Expands src/engine.genexpr into the plain GenExpr that goes into gen~.
//
//   //@params                 the Param declarations, from spec.js
//   //@lanes ... //@end       repeated for each lane, $L = 0..3
//   //@voices ... //@end      repeated for each voice, $V = 0..7, $L = its lane, $J = 0|1
//   //@if <expr> ... //@fi    kept only when <expr> holds (L, V and J in scope)
//   ${NAME}                   TABLES[NAME][L]
//
// Lanes and voices are unrolled here instead of looped in gen~ so that every
// voice reads its own lane's Params by name and keeps its state in plain
// History variables: no indexed tables, no functions, nothing gen~ has to guess.

const fs = require('fs');
const path = require('path');
const { engineParams, LANES } = require('./spec');

const VOICES_PER_LANE = 2;

// Per-lane constants the template reads with ${NAME}.
const TABLES = {
  // how readily Vary adds a ghost note to an empty step
  GHOST: ['0.06', '0.22', '0.45', '0.35'],
  // how much Human delays the lane (the kick barely moves: it is the clock)
  HUMW: ['0.25', '1', '1', '0.8'],
  // the kick is what pumps; everything else is pumped
  PUMPED: ['1', 'pmg', 'pmg', 'pmg'],
};

function formatNumber(v) {
  if (!Number.isFinite(v)) throw new Error('non-finite default ' + v);
  return Number.isInteger(v) ? String(v) : String(+v.toFixed(6));
}

function evalCondition(expr, ctx) {
  if (!/^[\sLVJ0-9=!<>&|()+\-*%]+$/.test(expr)) throw new Error('bad //@if expression: ' + expr);
  // eslint-disable-next-line no-new-func
  return !!new Function('L', 'V', 'J', 'return (' + expr + ');')(ctx.L, ctx.V, ctx.J);
}

function substitute(line, ctx) {
  let out = line.replace(/\$\{([A-Z_]+)\}/g, (m, name) => {
    const table = TABLES[name];
    if (!table) throw new Error('unknown table ${' + name + '}');
    return table[ctx.L];
  });
  out = out.replace(/\$([LVJ])(?![A-Za-z0-9_])/g, (m, k) => String(ctx[k]));
  return out;
}

// Keeps lines whose //@if conditions all hold; drops the directive lines.
function applyConditions(lines, ctx) {
  const out = [];
  const stack = [];
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('//@if ')) {
      stack.push(evalCondition(t.slice(6), ctx));
      continue;
    }
    if (t === '//@fi') {
      if (!stack.length) throw new Error('//@fi without //@if');
      stack.pop();
      continue;
    }
    if (stack.every(Boolean)) out.push(line);
  }
  if (stack.length) throw new Error('//@if without //@fi');
  return out;
}

function expand(template) {
  const all = template.split(/\r?\n/);
  const codeAt = all.findIndex((l) => l.trim() === '//@code');
  if (codeAt < 0) throw new Error('template has no //@code line');
  const lines = all.slice(codeAt + 1);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t === '//@params') {
      for (const p of engineParams()) out.push('Param ' + p.name + '(' + formatNumber(p.def) + ');');
      continue;
    }
    if (t === '//@lanes' || t === '//@voices') {
      const body = [];
      let j = i + 1;
      while (j < lines.length && lines[j].trim() !== '//@end') {
        if (/^\/\/@(lanes|voices)$/.test(lines[j].trim())) throw new Error('nested repeat block at line ' + (j + 1));
        body.push(lines[j]);
        j++;
      }
      if (j >= lines.length) throw new Error('unterminated ' + t + ' at line ' + (i + 1));
      const contexts = [];
      if (t === '//@lanes') {
        for (let L = 0; L < LANES.length; L++) contexts.push({ L, V: -1, J: -1 });
      } else {
        for (let V = 0; V < LANES.length * VOICES_PER_LANE; V++) {
          contexts.push({ V, L: Math.floor(V / VOICES_PER_LANE), J: V % VOICES_PER_LANE });
        }
      }
      for (const ctx of contexts) {
        for (const line of applyConditions(body, ctx)) out.push(substitute(line, ctx));
      }
      i = j;
      continue;
    }
    if (t.startsWith('//@')) throw new Error('directive outside a block: ' + t + ' (line ' + (i + 1) + ')');
    out.push(lines[i]);
  }
  const code = out.join('\n');
  const stray = code.match(/.*\$.*/);
  if (stray) throw new Error('unexpanded template token in: ' + stray[0]);
  return code;
}

// Names written in lane blocks and in voice blocks share the _0.._3 suffix
// space. A prefix used in both would silently merge a lane variable with a
// voice variable, so it is refused here rather than debugged by ear.
function checkSuffixCollisions(template) {
  const collect = (tag) => {
    const re = new RegExp('//@' + tag + '\\n([\\s\\S]*?)//@end', 'g');
    const prefixes = new Set();
    let m;
    while ((m = re.exec(template))) {
      for (const id of m[1].match(/\b[A-Za-z][A-Za-z0-9]*_\$[LV]\b/g) || []) prefixes.add(id.replace(/_\$[LV]$/, ''));
    }
    return prefixes;
  };
  const lanes = collect('lanes');
  const voices = collect('voices');
  // voice blocks legitimately read lane values through _$L
  const voiceOwn = new Set();
  const re = /\/\/@voices\n([\s\S]*?)\/\/@end/g;
  let m;
  while ((m = re.exec(template))) {
    for (const id of m[1].match(/\b[A-Za-z][A-Za-z0-9]*_\$V\b/g) || []) voiceOwn.add(id.replace(/_\$V$/, ''));
  }
  const clash = [...voiceOwn].filter((p) => lanes.has(p));
  if (clash.length) throw new Error('lane and voice variables share a prefix: ' + clash.join(', '));
  return { lanes, voices: voiceOwn };
}

function buildEngine() {
  const template = fs.readFileSync(path.join(__dirname, 'engine.genexpr'), 'utf8');
  checkSuffixCollisions(template);
  return expand(template);
}

module.exports = { buildEngine, expand, TABLES };

if (require.main === module) process.stdout.write(buildEngine() + '\n');
