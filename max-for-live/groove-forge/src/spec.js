'use strict';
// Groove Forge: every parameter, in one place.
//
// The gen~ Param declarations, the Live parameters in both devices, the jsui's
// message names and the tests are all generated from this file. A parameter
// renamed here is renamed everywhere, so no two of those can drift apart and
// leave a knob that moves nothing.
//
// Values are in the unit the knob shows (%, ms, Hz, dB, semitones). gen~
// receives exactly what the knob outputs and converts internally, so a knob
// can never be scaled one way on screen and another way in the engine.

const LANES = [
  { name: 'Kick', tag: 'KICK', color: [0.98, 0.58, 0.2] },
  { name: 'Clap', tag: 'CLAP', color: [0.98, 0.37, 0.6] },
  { name: 'Hats', tag: 'HATS', color: [0.33, 0.82, 0.96] },
  { name: 'Tone', tag: 'TONE', color: [0.68, 0.9, 0.33] },
];

// parameter_unitstyle values, in the order of the inspector's Unit Style menu.
const UNIT_STYLE = {
  int: 0, float: 1, ms: 2, Hz: 3, dB: 4, '%': 5, pan: 6, st: 7, midi: 8, custom: 9, native: 10,
};

// Per-lane parameters. `id` + lane index is the gen~ Param name (tun0, tun1...).
// `page` decides where the knob lives: one of the three editor pages, the lane
// row beside the grid, or `store` for hidden, stored-only pattern data.
const LANE_PARAMS = [
  // SOUND: what the lane is made of
  { id: 'syn', label: 'Synth', kind: 'enum', items: ['Kick', 'Clap', 'Hat', 'Tone', 'Sub'], def: [0, 1, 2, 3], page: 'sound',
    desc: 'The built-in voice layered under your sound. It also plays alone while no sample is loaded.' },
  { id: 'bld', label: 'Blend', unit: '%', min: 0, max: 100, def: [35, 45, 50, 100], page: 'sound',
    desc: 'Synth voice against your sample. 0% is all synth, 100% is all sample.' },
  { id: 'stt', label: 'Start', unit: '%', min: 0, max: 100, def: [0, 5, 25, 0], page: 'sound', jsui: true,
    desc: 'Where in your sample this lane starts playing. Click the waveform to set it for the selected lane.' },
  { id: 'wlk', label: 'Walk', unit: '%', min: 0, max: 100, def: [0, 0, 30, 0], page: 'sound', jsui: true,
    desc: 'Each step plays from further into the sample, slicing it across the pattern.' },
  { id: 'tun', label: 'Tune', unit: 'st', min: -48, max: 48, def: [-12, 0, 5, 0], page: 'sound',
    desc: 'Pitch of the sample and the synth voice, in semitones.' },
  { id: 'pch', label: 'Punch', unit: 'st', min: 0, max: 48, def: [24, 0, 0, 0], page: 'sound',
    desc: 'Pitch drop at the start of each hit. This is what turns a low sound into a kick.' },
  { id: 'pdc', label: 'P.Time', unit: 'ms', min: 2, max: 500, exp: 2.5, def: [45, 30, 20, 40], page: 'sound',
    desc: 'How quickly the Punch pitch drop settles.' },
  { id: 'drv', label: 'Drive', unit: '%', min: 0, max: 100, def: [20, 10, 0, 25], page: 'sound',
    desc: 'Saturation on this lane alone.' },

  // SHAPE: envelope and filter
  { id: 'atk', label: 'Attack', unit: 'ms', min: 0.1, max: 1000, exp: 3, def: [0.5, 0.5, 0.5, 2], page: 'shape',
    desc: 'ADSR attack time.' },
  { id: 'dec', label: 'Decay', unit: 'ms', min: 5, max: 4000, exp: 3, def: [260, 180, 45, 220], page: 'shape',
    desc: 'ADSR decay time.' },
  { id: 'sus', label: 'Sustain', unit: '%', min: 0, max: 100, def: [0, 0, 0, 30], page: 'shape',
    desc: 'ADSR sustain level, held for as long as the Length lasts.' },
  { id: 'rel', label: 'Release', unit: 'ms', min: 5, max: 4000, exp: 3, def: [80, 60, 30, 120], page: 'shape',
    desc: 'ADSR release time after the note ends.' },
  { id: 'gat', label: 'Length', unit: '%', min: 10, max: 800, exp: 2, def: [100, 100, 50, 75], page: 'shape',
    desc: 'How long each note is held, as a share of one step.' },
  { id: 'fty', label: 'Filter', kind: 'enum', items: ['LP', 'BP', 'HP'], def: [0, 1, 2, 0], page: 'shape',
    desc: 'Filter type: low-pass, band-pass or high-pass.' },
  { id: 'cut', label: 'Cutoff', unit: 'Hz', min: 20, max: 20000, exp: 3.5, def: [260, 1400, 7000, 900], page: 'shape',
    desc: 'Filter cutoff frequency.' },
  { id: 'res', label: 'Reso', unit: '%', min: 0, max: 100, def: [10, 20, 10, 35], page: 'shape',
    desc: 'Filter resonance.' },
  { id: 'fev', label: 'Env', unit: '%', min: -100, max: 100, def: [0, 0, 0, 45], page: 'shape',
    desc: 'How far the envelope sweeps the cutoff, up or down.' },

  // GROOVE: timing and placement
  { id: 'chc', label: 'Chance', unit: '%', min: 0, max: 100, def: [100, 100, 100, 100], page: 'groove',
    desc: 'Probability that each active step actually plays.' },
  { id: 'swd', label: 'Swing', unit: '%', min: 0, max: 100, def: [100, 100, 100, 100], page: 'groove', jsui: true,
    desc: 'How much of the global swing this lane follows. 0% keeps it straight.' },
  { id: 'ndg', label: 'Nudge', unit: '%', min: -50, max: 50, def: [0, 0, 0, 0], page: 'groove', jsui: true,
    desc: 'Pushes the whole lane early or late, as a share of one step.' },
  { id: 'rln', label: 'Roll', kind: 'enum', items: ['x2', 'x3', 'x4'], def: [0, 1, 0, 0], page: 'groove',
    desc: 'How many hits a rolled step fires (Alt-click a step to roll it).' },
  { id: 'kfl', label: 'Keys', kind: 'enum', items: ['Off', 'On'], def: [0, 0, 0, 1], page: 'groove',
    desc: 'Follow the notes you play: the lane plays at your note, and cycles through a held chord.' },
  { id: 'pan', label: 'Pan', unit: 'pan', min: -100, max: 100, def: [0, 0, 20, -12], page: 'groove',
    desc: 'Stereo position.' },
  { id: 'snd', label: 'Send', unit: '%', min: 0, max: 100, def: [0, 25, 12, 35], page: 'groove',
    desc: 'How much of this lane goes to the Delay and Space effects.' },

  // Beside each grid row, always visible
  { id: 'lvl', label: 'Level', unit: 'dB', min: -70, max: 6, def: [0, -2, -5, -5], page: 'row',
    desc: 'Lane volume.' },
  { id: 'on', label: 'On', kind: 'toggle', def: [1, 1, 1, 1], page: 'row', jsui: true,
    desc: 'Lane on or muted.' },

  // Pattern data: hidden, stored with the set, written by the grid.
  // A step is bit n of the mask (step 1 is bit 0), so a mask runs 0 to 65535.
  // That is a 'mask': a whole number kept in a Float parameter, because a Live
  // Int parameter holds 0-255 only and cuts the rest of the bar away. Every
  // reader rounds it: a float that has been through Live can come back a hair
  // off, and 4368.9998 must still mean 4369.
  { id: 'pat', label: 'Steps', kind: 'mask', min: 0, max: 65535, def: [4369, 4112, 52300, 19660], page: 'store', jsui: true },
  { id: 'acc', label: 'Accents', kind: 'mask', min: 0, max: 65535, def: [4369, 4112, 17476, 17476], page: 'store', jsui: true },
  { id: 'rol', label: 'Rolls', kind: 'mask', min: 0, max: 65535, def: [0, 0, 0, 0], page: 'store', jsui: true },
  { id: 'len', label: 'Steps Length', kind: 'int', min: 1, max: 16, def: [16, 16, 16, 16], page: 'store', jsui: true },
  { id: 'hit', label: 'Euclid Hits', kind: 'int', min: 0, max: 16, def: [4, 2, 7, 7], page: 'store', jsui: true, engine: false },
  { id: 'rot', label: 'Euclid Rotate', kind: 'int', min: 0, max: 15, def: [0, 4, 0, 0], page: 'store', jsui: true, engine: false },
];

// Global parameters. `section` places them: the groove panel, the effects
// panel, or the source panel. `variant` limits a control to one device.
const GLOBAL_PARAMS = [
  // GROOVE panel
  { id: 'swingamt', label: 'Swing', unit: '%', min: 50, max: 75, def: 56, section: 'groove', jsui: true,
    desc: 'Swing, MPC style: 50% is straight, 66% is a triplet shuffle, 75% is the hardest lean.' },
  { id: 'swgrid', label: 'Swing Grid', kind: 'enum', items: ['1/16', '1/8'], def: 0, section: 'groove', jsui: true,
    desc: 'Swing the 16th notes, or the 8th notes.' },
  { id: 'humanize', label: 'Human', unit: '%', min: 0, max: 100, def: 10, section: 'groove',
    desc: 'Random timing (up to 12 ms late) and velocity variation.' },
  { id: 'accamt', label: 'Accent', unit: '%', min: 0, max: 100, def: 50, section: 'groove',
    desc: 'How much quieter unaccented steps are than accented ones.' },
  { id: 'varamt', label: 'Vary', unit: '%', min: 0, max: 100, def: 15, section: 'groove',
    desc: 'Ghost notes and small surprises, so a loop keeps moving.' },
  { id: 'fillmode', label: 'Fill', kind: 'enum', items: ['Off', '4 Bars', '8 Bars', '16 Bars'], def: 2, section: 'groove',
    desc: 'Play a fill in the last beat of every 4, 8 or 16 bars.' },
  { id: 'style', label: 'Style', kind: 'enum', items: ['Classic', 'Rolling', 'Minimal', 'Broken', 'Hypnotic', 'Chaos'], def: 0,
    section: 'groove', jsui: true, engine: false,
    desc: 'What Generate writes: Classic, Rolling, Minimal, Broken, Hypnotic (odd lengths) or Chaos.' },

  // FX panel
  { id: 'busdrive', label: 'Drive', unit: '%', min: 0, max: 100, def: 15, section: 'fx', desc: 'Saturation on the whole groove.' },
  { id: 'buscrush', label: 'Crush', unit: '%', min: 0, max: 100, def: 0, section: 'fx', desc: 'Bit and sample-rate reduction.' },
  { id: 'pumpamt', label: 'Pump', unit: '%', min: 0, max: 100, def: 25, section: 'fx',
    desc: 'Sidechain: the kick ducks everything else.' },
  { id: 'dtime', label: 'Time', kind: 'enum', items: ['1/16', '1/8', '3/16', '1/4', '3/8', '1/2', '1/8T', '1/4T'], def: 2,
    section: 'fx', desc: 'Delay time, locked to the tempo.' },
  { id: 'dfb', label: 'Feedback', unit: '%', min: 0, max: 95, def: 40, section: 'fx', desc: 'Delay feedback.' },
  { id: 'dmix', label: 'Delay', unit: '%', min: 0, max: 100, def: 30, section: 'fx', desc: 'Delay level.' },
  { id: 'rsize', label: 'Size', unit: '%', min: 0, max: 100, def: 55, section: 'fx', desc: 'Size of the Space reverb.' },
  { id: 'rmix', label: 'Space', unit: '%', min: 0, max: 100, def: 25, section: 'fx', desc: 'Reverb level.' },
  { id: 'djf', label: 'Filter', unit: 'pan', min: -100, max: 100, def: 0, section: 'fx',
    desc: 'DJ filter: left of centre is low-pass, right is high-pass.' },

  // SOURCE panel
  { id: 'holdmode', label: 'Play', kind: 'enum', items: ['Always', 'Hold'], def: 0, section: 'source', variant: 'inst',
    desc: 'Always: the groove runs with the transport. Hold: it only plays while you hold a key.' },
  { id: 'srcsel', label: 'Source', kind: 'enum', items: ['Sample', 'Live'], def: 0, section: 'source', variant: 'fx', jsui: true,
    desc: 'Build the groove from the dropped sample, or from audio captured off this track.' },
  { id: 'capbars', label: 'Capture Length', kind: 'enum', items: ['1 Bar', '2 Bars', '1/2 Bar'], def: 0, section: 'source', variant: 'fx',
    desc: 'How much audio Capture records.' },
  { id: 'capauto', label: 'Auto Capture', kind: 'enum', items: ['Manual', 'Every 4', 'Every 8', 'Every 16'], def: 0,
    section: 'source', variant: 'fx', desc: 'Capture again automatically every 4, 8 or 16 bars.' },
  { id: 'thruamt', label: 'Thru', unit: '%', min: 0, max: 100, def: 0, section: 'source', variant: 'fx',
    desc: 'How much of the track you are capturing from is still heard.' },
];

// Set by patch logic rather than a knob, but still gen~ Params.
const ENGINE_INPUTS = [
  { id: 'src_sr', def: 0 },   // sample rate of the loaded file, from info~
  { id: 'capgo', def: 0 },    // changes every time Capture is pressed
  { id: 'kf_note', def: 60 }, // last note played
  { id: 'kf_gate', def: 0 },  // 1 while any key is held
  { id: 'arp_n', def: 0 },    // notes in the held chord
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ id: 'arp' + i, def: 60 })),
];

function laneParamName(p, lane) {
  return p.id + lane;
}

// Every gen~ Param, with its default, in declaration order.
function engineParams() {
  const out = [];
  for (const p of GLOBAL_PARAMS) {
    if (p.engine === false) continue;
    out.push({ name: p.id, def: p.def });
  }
  for (const p of LANE_PARAMS) {
    if (p.engine === false) continue;
    for (let l = 0; l < LANES.length; l++) out.push({ name: laneParamName(p, l), def: p.def[l] });
  }
  for (const p of ENGINE_INPUTS) out.push({ name: p.id, def: p.def });
  return out;
}

module.exports = { LANES, UNIT_STYLE, LANE_PARAMS, GLOBAL_PARAMS, ENGINE_INPUTS, laneParamName, engineParams };
