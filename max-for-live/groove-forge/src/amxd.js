'use strict';
// The .amxd container: a small binary header around the patcher JSON.
//
// This is the layout Max 8 and 9 write for an unfrozen device, as recorded
// byte-for-byte against devices exported by Max (py2max's m4l.py documents
// the same layout and tests it against real exports):
//
//   0   "ampf"                   magic
//   4   u32 LE  4                format version
//   8   "aaaa" | "iiii" | "mmmm" audio effect | instrument | MIDI effect
//   12  "ptch"                   chunk id
//   16  u32 LE  size             everything from offset 20 to the end
//   20  "mx@c"                   container
//   24  u32 BE  16               header size
//   28  u32 BE  0                flags
//   32  u32 BE  16 + json + 1    container content size
//   36  JSON, then one NUL
//   ... dlst > dire > type, fnam, sz32, of32, vers, flag, mdat   (each FOURCC + BE u32 size incl. header)
//
// The patcher JSON also carries a "project" block whose amxdtype repeats the
// device type; without it Max refuses the device ("a project without a name
// is like a day without sunshine").

const TYPES = { audio_effect: 'aaaa', instrument: 'iiii', midi_effect: 'mmmm' };
const MAX_EPOCH_OFFSET = 2082844800; // 1904-01-01 to 1970-01-01, in seconds

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
function pad4(buf) {
  const extra = (4 - (buf.length % 4)) % 4;
  return Buffer.concat([buf, Buffer.alloc(extra)]);
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

// mtime is in Max's epoch (seconds since 1904). Pass a fixed one to make the
// build reproducible.
function packAmxd(patcherJson, { deviceType, filename, mtime }) {
  const tag = TYPES[deviceType];
  if (!tag) throw new Error('unknown device type ' + deviceType);
  const json = Buffer.concat([Buffer.from(patcherJson, 'utf8'), Buffer.alloc(1)]);
  const dire = Buffer.concat([
    chunk('type', Buffer.from('JSON', 'ascii')),
    chunk('fnam', pad4(Buffer.concat([Buffer.from(filename, 'utf8'), Buffer.alloc(1)]))),
    chunk('sz32', u32be(json.length)),
    chunk('of32', u32be(16)),
    chunk('vers', u32be(0)),
    chunk('flag', u32be(17)),
    chunk('mdat', u32be(mtime)),
  ]);
  const dlst = chunk('dlst', chunk('dire', dire));
  const mxac = Buffer.concat([Buffer.from('mx@c', 'ascii'), u32be(16), u32be(0), u32be(16 + json.length), json]);
  const body = Buffer.concat([mxac, dlst]);
  return Buffer.concat([Buffer.from('ampf', 'ascii'), u32le(4), Buffer.from(tag, 'ascii'), Buffer.from('ptch', 'ascii'), u32le(body.length), body]);
}

function unpackAmxd(buf) {
  if (buf.toString('ascii', 0, 4) !== 'ampf') throw new Error('not an .amxd (magic)');
  if (buf.readUInt32LE(4) !== 4) throw new Error('unexpected .amxd version ' + buf.readUInt32LE(4));
  const tag = buf.toString('ascii', 8, 12);
  const deviceType = Object.keys(TYPES).find((k) => TYPES[k] === tag);
  if (!deviceType) throw new Error('unknown device tag ' + tag);
  if (buf.toString('ascii', 12, 16) !== 'ptch') throw new Error('missing ptch');
  if (buf.readUInt32LE(16) !== buf.length - 20) throw new Error('ptch size does not match the file');
  if (buf.toString('ascii', 20, 24) !== 'mx@c') throw new Error('missing mx@c');
  const contentSize = buf.readUInt32BE(32);
  const jsonEnd = 36 + contentSize - 16;
  if (buf[jsonEnd - 1] !== 0) throw new Error('JSON is not NUL-terminated where the header says');
  const json = buf.toString('utf8', 36, jsonEnd - 1);
  // walk the trailer
  let p = jsonEnd;
  const chunks = {};
  const walk = (start, end) => {
    let q = start;
    while (q < end) {
      const id = buf.toString('ascii', q, q + 4);
      const size = buf.readUInt32BE(q + 4);
      if (size < 8 || q + size > end) throw new Error(`bad chunk ${id} at ${q}`);
      if (id === 'dlst' || id === 'dire') walk(q + 8, q + size);
      else chunks[id] = buf.subarray(q + 8, q + size);
      q += size;
    }
  };
  walk(p, buf.length);
  return { deviceType, json, chunks };
}

module.exports = { packAmxd, unpackAmxd, projectBlock, amxdType, MAX_EPOCH_OFFSET, TYPES };
