'use strict';
// The .amxd container: a small binary header around the patcher JSON, with
// the files the device needs frozen inside it.
//
// This is the layout Max 9 writes when you freeze a device, recorded
// byte-for-byte against devices exported by Max (LivePilot_Analyzer.amxd, a
// frozen Max 9.1 device with a script in it, has exactly this shape):
//
//   0   "ampf"  u32 LE 4   "aaaa" | "iiii" | "mmmm"   audio effect | instrument | MIDI effect
//   12  "meta"  u32 LE 4   u32 LE 7                    7: frozen
//   24  "ptch"  u32 LE size                            everything from offset 32 to the end
//   32  "mx@c"  u32 BE 16  u32 BE 0  u32 BE content    content: 16 + every file below
//   48  the patcher JSON, then one NUL
//   ... each frozen file, as its raw bytes
//   ... dlst > one dire per file > type, fnam, sz32, of32, vers, flag, mdat
//       (each a FOURCC and a BE u32 size that counts its own 8-byte header;
//        of32 counts from the "mx@c")
//
// Frozen is not optional here. An unfrozen device looks for its scripts in
// the search path of the Max that opens it, not beside the device: it works
// where it was built and nowhere else. Frozen, the display script travels
// inside the device, and Max finds it by the name the jsui gives.
//
// The patcher JSON also carries a "project" block whose amxdtype repeats the
// device type; without it Max refuses the device ("a project without a name
// is like a day without sunshine").

const TYPES = { audio_effect: 'aaaa', instrument: 'iiii', midi_effect: 'mmmm' };
const MAX_EPOCH_OFFSET = 2082844800; // 1904-01-01 to 1970-01-01, in seconds
const FROZEN = 7;

function u32le(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n >>> 0);
  return b;
}
function u32be(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0);
  return b;
}
function chunk(tag, payload) {
  return Buffer.concat([Buffer.from(tag, 'ascii'), u32be(8 + payload.length), payload]);
}
function outer(tag, payload) {
  return Buffer.concat([Buffer.from(tag, 'ascii'), u32le(payload.length), payload]);
}
function cstring4(name) {
  const raw = Buffer.concat([Buffer.from(name, 'utf8'), Buffer.alloc(1)]);
  return Buffer.concat([raw, Buffer.alloc((4 - (raw.length % 4)) % 4)]);
}

function amxdType(deviceType) {
  const tag = TYPES[deviceType];
  if (!tag) throw new Error('unknown device type ' + deviceType);
  return Buffer.from(tag, 'ascii').readUInt32BE(0);
}

function projectBlock(deviceType, mtime) {
  return {
    version: 1,
    creationdate: mtime,
    modificationdate: mtime,
    viewrect: [0.0, 0.0, 300.0, 500.0],
    autoorganize: 1,
    hideprojectwindow: 1,
    showdependencies: 1,
    autolocalize: 0,
    contents: { patchers: {} },
    layout: {},
    searchpath: {},
    detailsvisible: 0,
    amxdtype: amxdType(deviceType),
    readonly: 0,
    devpathtype: 0,
    devpath: '.',
    sortmode: 0,
    viewmode: 0,
    includepackages: 0,
  };
}

// name:  the device's own file name ("Groove Forge.amxd"); Max files the main
//        patcher under it.
// files: [{ name, data, type }] to freeze in, e.g. a script as type TEXT.
//        A file may carry its own mdat; the rest take mtime.
// mtime: Max's epoch (seconds since 1904). Pass a fixed one to make the build
//        reproducible.
function packAmxd(patcherJson, { deviceType, name, mtime, files = [] }) {
  const tag = TYPES[deviceType];
  if (!tag) throw new Error('unknown device type ' + deviceType);
  const all = [
    { name, type: 'JSON', flag: 17, data: Buffer.concat([Buffer.from(patcherJson, 'utf8'), Buffer.alloc(1)]) },
    ...files.map((f) => ({ name: f.name, type: f.type || 'TEXT', flag: 0, mdat: f.mdat, data: Buffer.isBuffer(f.data) ? f.data : Buffer.from(f.data, 'utf8') })),
  ];
  const names = new Set();
  let at = 16;
  const dires = [];
  for (const f of all) {
    if (names.has(f.name)) throw new Error('two frozen files named ' + f.name);
    names.add(f.name);
    if (!/^[\x00-\x7e]{4}$/.test(f.type)) throw new Error('a file type is four ASCII characters: ' + JSON.stringify(f.type));
    dires.push(chunk('dire', Buffer.concat([
      chunk('type', Buffer.from(f.type, 'latin1')),
      chunk('fnam', cstring4(f.name)),
      chunk('sz32', u32be(f.data.length)),
      chunk('of32', u32be(at)),
      chunk('vers', u32be(0)),
      chunk('flag', u32be(f.flag)),
      chunk('mdat', u32be(f.mdat === undefined ? mtime : f.mdat)),
    ])));
    at += f.data.length;
  }
  const mxac = Buffer.concat([Buffer.from('mx@c', 'ascii'), u32be(16), u32be(0), u32be(at), ...all.map((f) => f.data)]);
  return Buffer.concat([
    outer('ampf', Buffer.from(tag, 'ascii')),
    outer('meta', u32le(FROZEN)),
    outer('ptch', Buffer.concat([mxac, chunk('dlst', Buffer.concat(dires))])),
  ]);
}

// Reads a device back: its type, the patcher JSON, and every frozen file.
function unpackAmxd(buf) {
  const outers = {};
  let q = 0;
  while (q < buf.length) {
    if (q + 8 > buf.length) throw new Error('truncated chunk header at ' + q);
    const id = buf.toString('ascii', q, q + 4);
    const size = buf.readUInt32LE(q + 4);
    if (q + 8 + size > buf.length) throw new Error(`${id} runs past the end of the file`);
    outers[id] = { at: q + 8, size };
    q += 8 + size;
  }
  if (!outers.ampf || outers.ampf.at !== 8 || outers.ampf.size !== 4) throw new Error('not an .amxd (magic)');
  const tag = buf.toString('ascii', 8, 12);
  const deviceType = Object.keys(TYPES).find((k) => TYPES[k] === tag);
  if (!deviceType) throw new Error('unknown device tag ' + tag);
  const meta = outers.meta && outers.meta.size === 4 ? buf.readUInt32LE(outers.meta.at) : null;
  const ptch = outers.ptch;
  if (!ptch) throw new Error('missing ptch');
  if (ptch.at + ptch.size !== buf.length) throw new Error('ptch does not run to the end of the file');
  const base = ptch.at;
  if (buf.toString('ascii', base, base + 4) !== 'mx@c') throw new Error('missing mx@c');
  if (buf.readUInt32BE(base + 4) !== 16) throw new Error('unexpected mx@c header size');
  const content = buf.readUInt32BE(base + 12);
  const end = base + ptch.size;
  if (base + content > end) throw new Error('mx@c content runs past ptch');

  // the directory: one dire per file
  const files = [];
  const walk = (start, stop, into) => {
    let p = start;
    while (p < stop) {
      const id = buf.toString('ascii', p, p + 4);
      const size = buf.readUInt32BE(p + 4);
      if (size < 8 || p + size > stop) throw new Error(`bad chunk ${id} at ${p}`);
      if (id === 'dlst') walk(p + 8, p + size, into);
      else if (id === 'dire') {
        const f = {};
        walk(p + 8, p + size, f);
        files.push(f);
      } else into[id] = buf.subarray(p + 8, p + size);
      p += size;
    }
  };
  walk(base + content, end, {});
  const list = files.map((f) => {
    const nul = f.fnam.indexOf(0);
    const entry = {
      type: f.type.toString('latin1'),
      name: f.fnam.toString('utf8', 0, nul < 0 ? f.fnam.length : nul),
      offset: f.of32.readUInt32BE(0),
      size: f.sz32.readUInt32BE(0),
      vers: f.vers.readUInt32BE(0),
      flag: f.flag.readUInt32BE(0),
      mdat: f.mdat.readUInt32BE(0),
    };
    if (entry.offset < 16 || entry.offset + entry.size > content) throw new Error(`${entry.name} lies outside the container`);
    entry.data = buf.subarray(base + entry.offset, base + entry.offset + entry.size);
    return entry;
  });
  const main = list.find((f) => f.type === 'JSON' && f.flag === 17);
  if (!main) throw new Error('no main patcher in the directory');
  if (main.data[main.data.length - 1] !== 0) throw new Error('the patcher JSON is not NUL-terminated');
  // the files tile the content exactly: nothing overlaps, nothing is left over
  const sorted = list.slice().sort((a, b) => a.offset - b.offset);
  let expect = 16;
  for (const f of sorted) {
    if (f.offset !== expect) throw new Error(`${f.name} starts at ${f.offset}, expected ${expect}`);
    expect += f.size;
  }
  if (expect !== content) throw new Error('mx@c content size does not match its files');
  return {
    deviceType,
    meta,
    name: main.name,
    json: main.data.toString('utf8', 0, main.data.length - 1),
    files: list.filter((f) => f !== main),
    directory: list,
  };
}

module.exports = { packAmxd, unpackAmxd, projectBlock, amxdType, MAX_EPOCH_OFFSET, TYPES, FROZEN };
