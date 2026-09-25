'use strict';
// A GenExpr virtual machine, for the subset src/engine.genexpr uses.
//
// Max does not run here, so this is how the engine gets heard before a person
// hears it: the expanded GenExpr is parsed, compiled to JavaScript and run
// sample by sample. The parser is deliberately stricter than gen~ is:
//
//   - variables are block scoped, as in GenExpr, so a local assigned inside
//     braces and read outside them is an error here as it is in gen~
//   - reading a History after writing it in the same sample is an error,
//     because gen~'s answer to that is not something to depend on
//   - functions, loops and stateful operators (noise, phasor, delta...) are
//     refused, because the engine is written without them on purpose
//   - a name that is also a gen~ operator is refused as a variable
//
// So code that runs here is code whose meaning does not hinge on a reading of
// gen~ that could be wrong.

const RESERVED = new Set(`
abs absdiff accum acos acosh add and asin asinh atan atan2 atanh atodb bool buffer cartopol ceil change channels
clamp clip constant cos cosh counter cycle data dbtoa dcblock degrees delay delta dim div e elapsed eq exp exp2 f
fixdenorm fixnan floor fold fract ftom gate gen gt gte history hypot i in int interp invpi isdenorm isnan latch ln
ln10 ln2 log log10 log10e log2 log2e lookup lt lte max min mix mod mstosamps mtof mul mulequals nearest neg neq noise
not or out param peek phasewrap phasor pi plusequals poke poltocar pow r radians rate rdiv round rmod rsub s sah
sample samplerate sampstoms scale selector sign sin sinh slide smoothstep splat sqrt sqrt1_2 sqrt2 step sub switch
t60 t60time tan tanh train trunc twopi halfpi vectorsize voice wave wrap xor for while if else return break continue
Buffer Data Delay History Param mc_channel voicecount
`.trim().split(/\s+/));

const FUNCS = {
  floor: [1, 'Math.floor'], ceil: [1, 'Math.ceil'], abs: [1, 'Math.abs'], sqrt: [1, 'Math.sqrt'],
  exp: [1, 'Math.exp'], log: [1, 'Math.log'], sin: [1, 'Math.sin'], cos: [1, 'Math.cos'], tan: [1, 'Math.tan'],
  tanh: [1, 'Math.tanh'], atan: [1, 'Math.atan'], pow: [2, 'Math.pow'], min: [2, 'Math.min'], max: [2, 'Math.max'],
  clamp: [3, '$clamp'], dbtoa: [1, '$dbtoa'], atodb: [1, '$atodb'], fract: [1, '$fract'],
};

// ------------------------------------------------------------------ lexer
function lex(src) {
  const toks = [];
  let i = 0;
  let line = 1;
  const push = (type, value) => toks.push({ type, value, line });
  while (i < src.length) {
    const c = src[i];
    if (c === '\n') { line++; i++; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      if (end < 0) throw new Error('unterminated comment at line ' + line);
      line += (src.slice(i, end).match(/\n/g) || []).length;
      i = end + 2;
      continue;
    }
    const num = /^(\d+\.?\d*(?:[eE][-+]?\d+)?|\.\d+(?:[eE][-+]?\d+)?)/.exec(src.slice(i, i + 40));
    if (num) { push('num', parseFloat(num[1])); i += num[1].length; continue; }
    const id = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i, i + 80));
    if (id) { push('id', id[0]); i += id[0].length; continue; }
    if (c === '"') {
      const end = src.indexOf('"', i + 1);
      push('str', src.slice(i + 1, end));
      i = end + 1;
      continue;
    }
    const two = src.slice(i, i + 2);
    if (['==', '!=', '<=', '>=', '&&', '||', '+=', '-=', '*=', '/='].includes(two)) { push('op', two); i += 2; continue; }
    if ('+-*/%<>!=?:(){},;.'.includes(c)) { push('op', c); i++; continue; }
    throw new Error(`unexpected character '${c}' at line ${line}`);
  }
  push('eof', null);
  return toks;
}

// ------------------------------------------------------------------ parser
function parse(src) {
  const toks = lex(src);
  let p = 0;
  const peek = () => toks[p];
  const next = () => toks[p++];
  const is = (type, value) => toks[p].type === type && (value === undefined || toks[p].value === value);
  const expect = (type, value) => {
    const t = next();
    if (t.type !== type || (value !== undefined && t.value !== value)) {
      throw new Error(`line ${t.line}: expected ${value || type}, got ${t.value}`);
    }
    return t;
  };

  const decls = [];
  const DECL = new Set(['Buffer', 'Delay', 'History', 'Param', 'Data']);
  while (is('id') && DECL.has(peek().value)) {
    const kind = next().value;
    const name = expect('id').value;
    const args = [];
    expect('op', '(');
    if (!is('op', ')')) {
      do {
        if (is('str')) args.push(next().value);
        else {
          let sign = 1;
          if (is('op', '-')) { next(); sign = -1; }
          args.push(sign * expect('num').value);
        }
      } while (is('op', ',') && next());
    }
    expect('op', ')');
    expect('op', ';');
    decls.push({ kind, name, args, line: toks[p - 1].line });
  }

  function parseBlock() {
    expect('op', '{');
    const body = [];
    while (!is('op', '}')) body.push(parseStatement());
    expect('op', '}');
    return body;
  }

  function parseStatement() {
    const t = peek();
    if (t.type === 'id' && DECL.has(t.value)) throw new Error(`line ${t.line}: declaration after code`);
    if (t.type === 'id' && t.value === 'if') {
      next();
      expect('op', '(');
      const cond = parseExpr();
      expect('op', ')');
      const then = parseBlock();
      let otherwise = null;
      if (is('id', 'else')) {
        next();
        otherwise = is('id', 'if') ? [parseStatement()] : parseBlock();
      }
      return { type: 'if', cond, then, otherwise, line: t.line };
    }
    if (t.type === 'id' && ['for', 'while', 'return', 'break', 'continue'].includes(t.value)) {
      throw new Error(`line ${t.line}: '${t.value}' is not used by this engine and not supported by the VM`);
    }
    if (t.type === 'id' && toks[p + 1].type === 'op' && ['=', '+=', '-=', '*=', '/='].includes(toks[p + 1].value)) {
      const name = next().value;
      const op = next().value;
      const value = parseExpr();
      expect('op', ';');
      return { type: 'assign', name, op, value, line: t.line };
    }
    if (t.type === 'id' && toks[p + 1].type === 'id') {
      throw new Error(`line ${t.line}: function definitions are not allowed in the engine`);
    }
    const expr = parseExpr();
    expect('op', ';');
    return { type: 'expr', expr, line: t.line };
  }

  const BIN = [['||'], ['&&'], ['==', '!='], ['<', '>', '<=', '>='], ['+', '-'], ['*', '/', '%']];

  function parseExpr() {
    const cond = parseBinary(0);
    if (is('op', '?')) {
      next();
      const a = parseExpr();
      expect('op', ':');
      const b = parseExpr();
      return { type: 'cond', cond, a, b };
    }
    return cond;
  }
  function parseBinary(level) {
    if (level >= BIN.length) return parseUnary();
    let left = parseBinary(level + 1);
    while (is('op') && BIN[level].includes(peek().value)) {
      const op = next().value;
      const right = parseBinary(level + 1);
      left = { type: 'bin', op, left, right };
    }
    return left;
  }
  function parseUnary() {
    if (is('op', '-')) { next(); return { type: 'neg', arg: parseUnary() }; }
    if (is('op', '+')) { next(); return parseUnary(); }
    if (is('op', '!')) { next(); return { type: 'not', arg: parseUnary() }; }
    return parsePostfix();
  }
  function parseArgs() {
    const args = [];
    const named = {};
    expect('op', '(');
    if (!is('op', ')')) {
      do {
        if (is('id') && toks[p + 1].type === 'op' && toks[p + 1].value === '=') {
          const k = next().value;
          next();
          named[k] = expect('str').value;
        } else args.push(parseExpr());
      } while (is('op', ',') && next());
    }
    expect('op', ')');
    return { args, named };
  }
  function parsePostfix() {
    const t = next();
    if (t.type === 'num') return { type: 'num', value: t.value };
    if (t.type === 'op' && t.value === '(') {
      const e = parseExpr();
      expect('op', ')');
      return e;
    }
    if (t.type === 'id') {
      if (is('op', '(')) {
        const { args, named } = parseArgs();
        return { type: 'call', name: t.value, args, named, line: t.line };
      }
      if (is('op', '.')) {
        next();
        const method = expect('id').value;
        const { args, named } = parseArgs();
        return { type: 'method', obj: t.value, method, args, named, line: t.line };
      }
      return { type: 'var', name: t.value, line: t.line };
    }
    throw new Error(`line ${t.line}: unexpected '${t.value}'`);
  }

  const body = [];
  while (!is('eof')) body.push(parseStatement());
  return { decls, body };
}

// ------------------------------------------------------------------ compiler
function compile(src, opts = {}) {
  const checked = opts.checked !== false;
  const ast = parse(src);
  const sym = { param: new Map(), history: new Map(), buffer: new Map(), delay: new Map(), data: new Map() };
  const declared = new Set();
  for (const d of ast.decls) {
    if (RESERVED.has(d.name)) throw new Error(`line ${d.line}: '${d.name}' is a gen~ operator name`);
    if (declared.has(d.name)) throw new Error(`line ${d.line}: '${d.name}' declared twice`);
    declared.add(d.name);
    if (d.kind === 'Param') sym.param.set(d.name, { index: sym.param.size, def: d.args[0] ?? 0 });
    else if (d.kind === 'History') sym.history.set(d.name, { index: sym.history.size, init: d.args[0] ?? 0 });
    else if (d.kind === 'Buffer') sym.buffer.set(d.name, { index: sym.buffer.size, bind: d.args[0] ?? d.name });
    else if (d.kind === 'Delay') sym.delay.set(d.name, { index: sym.delay.size, size: d.args[0] });
    else if (d.kind === 'Data') sym.data.set(d.name, { index: sym.data.size, size: d.args[0], channels: d.args[1] ?? 1 });
  }

  const outputsUsed = new Set();
  const inputsUsed = new Set();
  const scopes = [new Map()];
  let localCount = 0;
  const lookupLocal = (name) => {
    for (let i = scopes.length - 1; i >= 0; i--) if (scopes[i].has(name)) return scopes[i].get(name);
    return null;
  };

  function emitExpr(e) {
    switch (e.type) {
      case 'num': return String(e.value);
      case 'neg': return `(-${emitExpr(e.arg)})`;
      case 'not': return `(${emitExpr(e.arg)} ? 0 : 1)`;
      case 'cond': return `(${emitExpr(e.cond)} ? ${emitExpr(e.a)} : ${emitExpr(e.b)})`;
      case 'bin': {
        const a = emitExpr(e.left);
        const b = emitExpr(e.right);
        if (['<', '>', '<=', '>=', '==', '!='].includes(e.op)) {
          const op = e.op === '==' ? '===' : e.op === '!=' ? '!==' : e.op;
          return `((${a} ${op} ${b}) ? 1 : 0)`;
        }
        if (e.op === '&&') return `((${a}) && (${b}) ? 1 : 0)`;
        if (e.op === '||') return `((${a}) || (${b}) ? 1 : 0)`;
        return `(${a} ${e.op} ${b})`;
      }
      case 'var': {
        const n = e.name;
        const local = lookupLocal(n);
        if (local) return local;
        if (sym.param.has(n)) return `P[${sym.param.get(n).index}]`;
        if (sym.history.has(n)) {
          const i = sym.history.get(n).index;
          return checked ? `$hread(${i})` : `H[${i}]`;
        }
        const inm = /^in(\d+)$/.exec(n);
        if (inm) { inputsUsed.add(+inm[1]); return `IN[${+inm[1] - 1}]`; }
        if (n === 'samplerate') return 'SR';
        if (n === 'pi') return 'Math.PI';
        if (n === 'twopi') return '(2*Math.PI)';
        if (/^out\d+$/.test(n)) throw new Error(`line ${e.line}: outputs cannot be read (${n})`);
        throw new Error(`line ${e.line}: '${n}' is not defined in this scope`);
      }
      case 'call': {
        const n = e.name;
        if (n === 'peek') {
          const b = bufRef(e.args[0], e.line);
          return `$peek(${b}, ${emitExpr(e.args[1])}, ${e.args[2] ? emitExpr(e.args[2]) : '0'})`;
        }
        if (n === 'poke') {
          const b = bufRef(e.args[0], e.line);
          return `$poke(${b}, ${emitExpr(e.args[1])}, ${emitExpr(e.args[2])}, ${e.args[3] ? emitExpr(e.args[3]) : '0'})`;
        }
        if (n === 'dim') return `${bufRef(e.args[0], e.line)}.frames`;
        if (n === 'channels') return `${bufRef(e.args[0], e.line)}.channels`;
        const f = FUNCS[n];
        if (!f) throw new Error(`line ${e.line}: '${n}()' is not an operator the engine is allowed to use`);
        if (e.args.length !== f[0]) throw new Error(`line ${e.line}: ${n}() takes ${f[0]} arguments`);
        return `${f[1]}(${e.args.map(emitExpr).join(', ')})`;
      }
      case 'method': {
        if (!sym.delay.has(e.obj)) throw new Error(`line ${e.line}: '${e.obj}' is not a Delay`);
        const d = `D[${sym.delay.get(e.obj).index}]`;
        if (e.method === 'read') {
          const interp = e.named.interp || 'none';
          if (!['none', 'linear'].includes(interp)) throw new Error(`line ${e.line}: interp="${interp}"`);
          return `${d}.read(${emitExpr(e.args[0])}, ${interp === 'linear' ? 1 : 0})`;
        }
        if (e.method === 'write') return `${d}.write(${emitExpr(e.args[0])})`;
        throw new Error(`line ${e.line}: Delay has no method ${e.method}`);
      }
      default: throw new Error('bad node ' + e.type);
    }
  }
  function bufRef(arg, line) {
    if (arg.type !== 'var') throw new Error(`line ${line}: buffer argument must be a name`);
    if (sym.buffer.has(arg.name)) return `B[${sym.buffer.get(arg.name).index}]`;
    if (sym.data.has(arg.name)) return `DA[${sym.data.get(arg.name).index}]`;
    throw new Error(`line ${line}: '${arg.name}' is not a Buffer or Data`);
  }

  function emitBlock(stmts, indent) {
    scopes.push(new Map());
    const out = stmts.map((s) => emitStmt(s, indent)).join('\n');
    scopes.pop();
    return out;
  }
  function emitStmt(s, ind) {
    const pad = '  '.repeat(ind);
    if (s.type === 'if') {
      let code = `${pad}if (${emitExpr(s.cond)}) {\n${emitBlock(s.then, ind + 1)}\n${pad}}`;
      if (s.otherwise) code += ` else {\n${emitBlock(s.otherwise, ind + 1)}\n${pad}}`;
      return code;
    }
    if (s.type === 'expr') return `${pad}${emitExpr(s.expr)};`;
    // assignment
    const n = s.name;
    if (RESERVED.has(n)) throw new Error(`line ${s.line}: '${n}' is a gen~ operator name`);
    const rhs = s.op === '=' ? emitExpr(s.value) : `${emitExpr({ type: 'var', name: n, line: s.line })} ${s.op[0]} (${emitExpr(s.value)})`;
    const om = /^out(\d+)$/.exec(n);
    if (om) { outputsUsed.add(+om[1]); return `${pad}OUT[${+om[1] - 1}] = ${rhs};`; }
    if (sym.param.has(n)) throw new Error(`line ${s.line}: Param '${n}' cannot be assigned`);
    if (sym.history.has(n)) {
      const i = sym.history.get(n).index;
      return checked ? `${pad}$hwrite(${i}, ${rhs});` : `${pad}H[${i}] = ${rhs};`;
    }
    if (sym.buffer.has(n) || sym.delay.has(n) || sym.data.has(n)) throw new Error(`line ${s.line}: cannot assign '${n}'`);
    const local = lookupLocal(n);
    if (local) return `${pad}${local} = ${rhs};`;
    if (s.op !== '=') throw new Error(`line ${s.line}: '${n}' used before assignment`);
    const js = `v${localCount++}_${n}`;
    const code = `${pad}let ${js} = ${rhs};`;
    scopes[scopes.length - 1].set(n, js);
    return code;
  }

  const bodyJs = emitBlock(ast.body, 2);
  const nOut = Math.max(0, ...outputsUsed);
  const nIn = Math.max(1, ...inputsUsed);

  const factory = new Function('SR', 'P', 'H', 'HW', 'B', 'D', 'DA', 'IN', 'OUT', 'STATS', `
    const $clamp = (x, lo, hi) => Math.min(Math.max(x, lo), hi);
    const $dbtoa = (x) => Math.pow(10, x / 20);
    const $atodb = (x) => 20 * Math.log10(x);
    const $fract = (x) => x - Math.floor(x);
    const WRITTEN = new Uint8Array(H.length);
    const $hread = (i) => {
      if (WRITTEN[i]) throw new Error('History #' + i + ' read after it was written in the same sample');
      return H[i];
    };
    const $hwrite = (i, v) => { HW[i] = v; WRITTEN[i] = 1; };
    const $peek = (b, idx, ch) => {
      idx = Math.floor(idx); ch = Math.floor(ch);
      if (idx < 0 || idx >= b.frames || ch < 0 || ch >= b.channels) { STATS.oob++; return 0; }
      return b.data[ch][idx];
    };
    const $poke = (b, v, idx, ch) => {
      idx = Math.floor(idx); ch = Math.floor(ch);
      if (idx < 0 || idx >= b.frames || ch < 0 || ch >= b.channels) { STATS.oobWrite++; return 0; }
      b.data[ch][idx] = v; return 0;
    };
    return function frame() {
${bodyJs}
      ${checked ? 'H.set(HW); WRITTEN.fill(0);' : ''}
    };
  `);

  return { sym, nIn, nOut, factory, js: bodyJs };
}

// ------------------------------------------------------------------ runtime
class DelayLine {
  constructor(size) {
    this.size = size;
    this.buf = new Float64Array(size);
    this.w = 0;
    this.maxRead = 0;
  }
  read(t, linear) {
    if (!(t >= 0) || t > this.size - 1) throw new Error(`delay read of ${t} samples from a ${this.size}-sample line`);
    if (t > this.maxRead) this.maxRead = t;
    const pos = this.w - t;
    const i0 = Math.floor(pos);
    const frac = pos - i0;
    const a = this.buf[((i0 % this.size) + this.size) % this.size];
    if (!linear || frac === 0) return a;
    const b = this.buf[(((i0 + 1) % this.size) + this.size) % this.size];
    return a + (b - a) * frac;
  }
  write(x) {
    this.buf[this.w] = x;
    this.w = (this.w + 1) % this.size;
    return 0;
  }
}

function makeBuffer(frames, channels) {
  const data = [];
  for (let c = 0; c < channels; c++) data.push(new Float64Array(frames));
  return { frames, channels, data };
}

// A running gen~ instance: set params by name, bind buffers, process samples.
class GenInstance {
  constructor(src, { sampleRate = 48000, checked = true } = {}) {
    this.program = compile(src, { checked });
    const { sym } = this.program;
    this.sampleRate = sampleRate;
    this.P = new Float64Array(sym.param.size);
    for (const v of sym.param.values()) this.P[v.index] = v.def;
    this.H = new Float64Array(sym.history.size);
    for (const v of sym.history.values()) this.H[v.index] = v.init;
    this.HW = Float64Array.from(this.H);
    this.B = [...sym.buffer.values()].map(() => makeBuffer(0, 1));
    this.D = [...sym.delay.values()].map((d) => new DelayLine(d.size));
    this.DA = [...sym.data.values()].map((d) => makeBuffer(d.size, d.channels));
    this.IN = new Float64Array(Math.max(3, this.program.nIn));
    this.OUT = new Float64Array(Math.max(1, this.program.nOut));
    this.STATS = { oob: 0, oobWrite: 0 };
    this.frame = this.program.factory(sampleRate, this.P, this.H, this.HW, this.B, this.D, this.DA, this.IN, this.OUT, this.STATS);
  }
  param(name, value) {
    const p = this.program.sym.param.get(name);
    if (!p) throw new Error('no Param ' + name);
    this.P[p.index] = value;
  }
  getParam(name) { return this.P[this.program.sym.param.get(name).index]; }
  history(name) { return this.H[this.program.sym.history.get(name).index]; }
  buffer(name, frames, channels) {
    const b = this.program.sym.buffer.get(name);
    if (!b) throw new Error('no Buffer ' + name);
    const buf = makeBuffer(frames, channels);
    this.B[b.index] = buf;
    return buf;
  }
  setBuffer(name, buf) { this.B[this.program.sym.buffer.get(name).index] = buf; }
  getBuffer(name) { return this.B[this.program.sym.buffer.get(name).index]; }
  delay(name) { return this.D[this.program.sym.delay.get(name).index]; }
  tick(inputs) {
    if (inputs) for (let i = 0; i < inputs.length; i++) this.IN[i] = inputs[i];
    this.frame();
    return this.OUT;
  }
}

module.exports = { lex, parse, compile, GenInstance, makeBuffer, RESERVED };
