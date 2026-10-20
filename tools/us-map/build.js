// Builds the simplified US state outlines that Territory Map ships with.
//
// Source: us-atlas@3, states-albers-10m.json — US Census boundaries, already
// projected to Albers USA in a 975 x 610 frame with Alaska and Hawaii inset.
//   https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json
//
// Usage:  node tools/us-map/build.js path/to/states-albers-10m.json
//
// Writes the block of generated data between the @generated markers in
// js/components/territory.js. Nothing is fetched at run time; the block
// carries these paths in its own markup.
//
// Borders are simplified once, as the shared arcs the topology already
// stores, before they are stitched into states. Simplifying each state on
// its own would move a shared border differently on either side of it and
// open slivers between neighbours.

const fs = require('fs');
const path = require('path');

const SRC = process.argv[2];
if (!SRC) { console.error('usage: node tools/us-map/build.js states-albers-10m.json'); process.exit(1); }
const TOLERANCE = +(process.argv[3] || 1.6);   // px in the 975-wide frame
const MIN_AREA = 6;                            // px^2; smaller islands are dropped

const POSTAL = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO', '09': 'CT', '10': 'DE',
  '11': 'DC', '12': 'FL', '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA',
  '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME', '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN',
  '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH', '34': 'NJ', '35': 'NM',
  '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
  '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA',
  '54': 'WV', '55': 'WI', '56': 'WY'
};

const topo = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const [sx, sy] = topo.transform.scale;
const [tx, ty] = topo.transform.translate;

// Quantized, delta-encoded arcs to absolute coordinates.
const arcs = topo.arcs.map(arc => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; });
});

// Douglas-Peucker, keeping both ends so junctions between arcs stay put.
function simplify(pts, tol) {
  if (pts.length < 3) return pts.slice();
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
    let best = -1, far = 0;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i];
      const d = len === 0 ? Math.hypot(px - ax, py - ay) : Math.abs(dy * px - dx * py + bx * ay - by * ax) / len;
      if (d > far) { far = d; best = i; }
    }
    if (far > tol && best > 0) { keep[best] = 1; stack.push([a, best], [best, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const simple = arcs.map(a => simplify(a, TOLERANCE));

function ringFromArcs(idx) {
  const out = [];
  idx.forEach(i => {
    const a = i < 0 ? simple[~i].slice().reverse() : simple[i];
    a.forEach((p, k) => { if (k === 0 && out.length) return; out.push(p); });
  });
  return out;
}
function area(ring) {
  let s = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) s += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  return Math.abs(s / 2);
}
// Whole pixels, relative moves after the first: the smallest honest path. One
// `l` covers every pair after it, a minus sign is its own separator, and the
// closing point is left to `z`.
function pathFor(rings) {
  return rings.map(ring => {
    const r = ring.map(([x, y]) => [Math.round(x), Math.round(y)])
      .filter((p, i, all) => i === 0 || p[0] !== all[i - 1][0] || p[1] !== all[i - 1][1]);
    if (r.length > 1 && r[r.length - 1][0] === r[0][0] && r[r.length - 1][1] === r[0][1]) r.pop();
    let d = 'M' + r[0][0] + ' ' + r[0][1], [px, py] = r[0], steps = '';
    for (let i = 1; i < r.length; i++) {
      for (const n of [r[i][0] - px, r[i][1] - py]) steps += (steps && n >= 0 ? ' ' : '') + n;
      [px, py] = r[i];
    }
    return d + (steps ? 'l' + steps : '') + 'z';
  }).join('');
}

const states = {};
let dropped = 0;
topo.objects.states.geometries.forEach(g => {
  const code = POSTAL[g.id];
  if (!code) throw new Error('no postal code for FIPS ' + g.id + ' (' + (g.properties || {}).name + ')');
  const polys = g.type === 'Polygon' ? [g.arcs] : g.arcs;
  const rings = [];
  polys.forEach(poly => poly.forEach(ringIdx => {
    const ring = ringFromArcs(ringIdx);
    if (ring.length < 4 || area(ring) < MIN_AREA) { dropped++; return; }
    rings.push(ring);
  }));
  states[code] = { name: g.properties.name, d: pathFor(rings) };
});

const codes = Object.keys(states).sort();
const lines = codes.map(k => '    ' + k + ": ['" + states[k].name.replace(/'/g, "\\'") + "', '" + states[k].d + "']");
const block = [
  '  /* @generated us-map:start — by tools/us-map/build.js from us-atlas@3',
  '     states-albers-10m (US Census, Albers USA, 975 x 610). Do not edit by hand. */',
  '  var US_STATES = {',
  lines.join(',\n'),
  '  };',
  '  /* @generated us-map:end */'
].join('\n');

const target = path.join(__dirname, '..', '..', 'js', 'components', 'territory.js');
const src = fs.readFileSync(target, 'utf8');
const re = /  \/\* @generated us-map:start[\s\S]*?\/\* @generated us-map:end \*\//;
if (!re.test(src)) throw new Error('markers not found in ' + target);
fs.writeFileSync(target, src.replace(re, () => block));

const bytes = codes.reduce((n, k) => n + states[k].d.length, 0);
console.log(codes.length + ' states, ' + bytes + ' characters of path data, ' + dropped + ' tiny rings dropped, tolerance ' + TOLERANCE + 'px');
