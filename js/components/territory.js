/* Componentry — Territory Map
   Its own file because it carries a map: the outline of every state, drawn
   once at build time from US Census boundaries (see tools/us-map/build.js)
   and shipped inside the block, so nothing is fetched when the page loads. */
(function () {
  var CAT = 'Interactive';

  /* @generated us-map:start — by tools/us-map/build.js from us-atlas@3
     states-albers-10m (US Census, Albers USA, 975 x 610). Do not edit by hand. */
  var US_STATES = {
    AK: ['Alaska', 'M99 570l4-5 0 3 2-1zM93 575l4-1 2-3 4 0 2 2-9 7 1-3-2 3zM44 547l6 0 1 4-3 1zM51 505l13-5 2 0-1 4 9 0-4-6 3 4 0-4-6-2-8-12 3-3 7-1 6-9 12-3 2-3 4 1-1 3 2-3 2 3 5 0 1 3 7-1 13 3 4-2 7 2 14 73 8-2 9 10 5-9 23 20 8 1 3 6-2 5-3-7 0 4-4-1 0-3-1 3-1-5-1 3-2-2 1-3-7-4-2-3 3 0-6-4-2 1-6-7 5 8-8-5-1 1 4 3-2 2-15-7 0-4-2 3-10-1-7 3 2-2-4-3-3 0-4 3 3-3-5-4-4 3 0-2 1 9-1-2-4 3 0-2-1 4-8 4 3-5-4 0 2-7 4-3 4 1-3-2 1-3-7 4-6 11-4 3 0 2 4 2-4 5-18 13-1 4-13 4-1-2-2 3-3-2 0 3-3-1 0 3-8 1 2-3 5 0 8-7 4 0 0 2 3 0 0-4 7-4 5-6 3-10-4 2-2-3-2 5-5-6-6 3-1-13-7 2-4-6 2-4-3-7 8-10 4 2 3-3 4 0 2-2-2-5 3-2-1-2-6 4-1-3-11-1-1-5 2 0zM34 518l1-2 4 2 6 4-4 2zM185 573l2-3 7 6 2 4-6-2 2 3zM180 567l5-3 4 3-5 2-1 4zM175 556l5 3 0 7zM174 565l3-2 4 10zM169 561l3-3 3 1 2 4-3-1-1 3z'],
    AL: ['Alabama', 'M642 384l47-4 13 47 8 13-4 10 5 19-50 5-1 3 5 4 1 5-2 4-9 2 4-2-6-8-1 8-6-1-4-34 2-69z'],
    AR: ['Arkansas', 'M523 355l81-3 1 5-5 7 12-1 2 2-6 4 1 5-2 0 0 3-2 0 2 6-4 4 1 2-4 0 1 3-3 1 2 1-2 0 1 6-7 5 3 1-3 1 1 2-3 2 2 4-3 2 2 1-4 0 2 2-1 3 3 0-2 10-54 2 0-12-9-2 1-40z'],
    AZ: ['Arizona', 'M145 407l5-2 0-4-3-2 0-5 5-5 2-9 9-6-4-5-2-13 3-25 7 0 3 4 3-4 3-18 89 15-18 128-39-6-66-38z'],
    CA: ['California', 'M57 355l7 3-4 1zM50 355l4 0 1 3-3 0zM33 160l67 19-17 67 74 110 2 13 4 5-9 6-2 9-5 5 0 5 3 2 0 4-5 2-46-5-2-20-9-11-6-2 0-7-11-4-6-9-16-5-3-4 4-12-4-2 1-6-5-7-7-17 0-6 3-1 1-6-4-2-4-7 2-13 2 0 0 5 4 4-3-13 3-2-3-1-3 6-7-7 2-5-8-18 4-21-6-12 1-4 9-11z'],
    CO: ['Colorado', 'M277 237l84 10 34 2-1 23-4 69-18-2-107-11z'],
    CT: ['Connecticut', 'M871 184l28-6 3 15-17 5-11 10-2-2 4-3z'],
    DC: ['District of Columbia', 'M826 267l1-2 3 2-2 3z'],
    DE: ['Delaware', 'M845 245l6-4-1 3-1 5 8 12 4 2 3 7-11 3z'],
    FL: ['Florida', 'M794 604l6-6 5 2zM711 469l3 6 52-4 1 5 3 0 0-11 10 1 7 20 18 25 2 11 15 27 2 26-2-1-1 9 3-5 0 2-8 13 4-7-15 3-4-11-9-3-5-11-4-3-2 2-2-5 2 1-1-7-3 6-12-17 2 0 4-9-3 1-3-3 2 4-2 5-3-6-1-7 2 3 1-8-2-11-3-5-5 1-15-16-7-3-5 0-1 5-14 6 2 2 6-4-6 5-7-1-1-6-17-8-11 0-14 4 2-4-1-5-5-4 1-3z'],
    GA: ['Georgia', 'M689 380l24-3 22-3-3 8 9 3 7 11 23 18 10 19 5 2-5 7 0 12-3 6 2 0 0 6-10-1 0 11-3 0-1-5-52 4-3-6-5-19 4-10-8-13z'],
    HI: ['Hawaii', 'M305 584l5-5 0-6 12 5 10 12-15 8-3 5-6-4 1-5zM292 558l2-3 2 4 6-1 5 4-8 4-2-5zM284 558l5 2-3 2zM279 554l1-3 11 2-3 2zM258 543l7-3 6 9-9 0zM226 533l5-5 6 2-4 6z'],
    IA: ['Iowa', 'M491 195l85-2 3 6-2 3 3 9 6 1 1 3 9 9 0 7-5 7-9 3-1 4 3 7-3 6-4 3-1 4-5-5-69 2-2-3-1-17-3-2 0-10-5-12-3-6 3-8-3-9z'],
    ID: ['Idaho', 'M171 102l-1-8 14-58 14 3-5 23 4 7 0 5-2 0 6 6 6 14 6 2-8 24 3 3 7-5 2 3 2 18 5 3 3 10 1-3 7 2 2-3 12 3 3-4 4 7-9 56-49-9-49-10 9-41 4-7-5-6 19-25z'],
    IL: ['Illinois', 'M576 265l1-4 4-3 3-6-3-7 1-4 9-3 5-7 0-7-9-9 47-3 0 5 6 13 5 54-2 4 4 9-8 13 0 10-2 3 2 4-7 3 1 7-10-3-2 6-4-1-3-6 1-2-2-7-15-11 3-15-6-2-2 2-3-8-12-10-3-9z'],
    IN: ['Indiana', 'M640 230l5 1 7-3 34-3 7 59 1 8-11 2 1 4-7 7-3 8-6-5-4 8-4-2-5 5-8-4 0 3-6-1-2 3 0-10 8-13-4-9 2-4z'],
    KS: ['Kansas', 'M394 272l116 3 6 3 1 3-3 5 5 7 4 1 0 50-133-3z'],
    KY: ['Kentucky', 'M621 340l2-6 10 3-1-7 7-3-2-4 2-3 2-3 6 1 0-3 8 4 5-5 4 2 4-8 6 5 3-8 7-7-1-4 11-2-1-8 6-1 5 7 10 3 2-2 5 1 6-4 6 7 0 6 3 5 5 5 6 2-18 21-9 5-79 6 0 5-24 1 4-4z'],
    LA: ['Louisiana', 'M577 511l6 1-3 2zM535 435l54-2 0 2 2-1 0 2-1 3 2 0-2 2 2 0 1 3-2 1 4 3-5 3 3 1-2 3 1 0-8 10 2 1-2 1 1 4-2-1 2 3-3 0 1 6 37-2-2 8 7 10-6 6 5 1 2-4 2 3 3-1-3 3 2 2-7 5 14 7-3 5-2-2-3 4 2-6-2 1-9-4-7 6-5-6-8 7-2-2-6-1 0-3 3 2-1-2-4-1 0-2-2 1-4-6-5 1 1-3-7 2 3 4-5 1-17-5-13 2-2-3 4-5-1-11 4-11-6-13 0-4-5-5z'],
    MA: ['Massachusetts', 'M918 188l3-4 3 1 1 2zM871 168l13-3 19-4 6-6 2 4 3-1-3 4-1 7 5 0 7 9 7-3-3-5-2 0 3 0 4 7 0 3-1-2-5 2-9 8 4-5-2-4-5 7-2-3-1-1-5-6-6 2-28 6z'],
    MD: ['Maryland', 'M782 257l63-12 8 28 11-3-1 10-8 4-3 1-2-10-4 4-5-5 1-3 4 0-4-3-2 2 2-6-3 2 0-4 3 0-3-3 4-6 0-4-4 5-1-2 1 4-2-2-1 5-3-1 5 5-2 6 8 15-11-5 1 2-2 0-2-3-4 2 1-6 1-4 2-3-3-2-1 2-12-7-3-6-6-1-5 5-6-1-2 5-2-1-6 8z'],
    ME: ['Maine', 'M910 150l-6-6-13-42 4 1-1-4 3 0-2-3 5-10-2-6 1-13 7-19 3 0 3 4 8-6 10 4 9 30 6 0 1 7 3 3 3-2 4 5-1 6-4 1-1 6-3-2-3 6-3 0 1 3-3 1-1-4-3 1 2 9-6-10-2 3 1 10-3 4-2-2-1 3-9 6z'],
    MI: ['Michigan', 'M652 228l8-18-1-12-7-14 3-24 10-13-1 9 1 1 1-5 0 6 1-12 7-4-4-4 2-4 3-1 22 7 4 7-3 0 4 7 0 8-8 11 1 6 4 1 3-8 8-4 5 4 7 19-1 9-2 2 0-3-3 0-8 23-22 3zM601 92l13-8-7 8zM585 123l22-11 8-9 7-3 4 1-7 5-3 11 4-5-2 3 6-3 9 9 9 1 10-7 15-3 3-1 0 7 6 0 7-3 1 6-2 2 7 3 0-2 4 0 2 3-14 2-5-2 0 5-5-4-8-1-3 4-9 1-4 8-2-2 2-5-3 2-3 3-1-3-8 18-2-2 0-5-3 1 1-7-5-2 0-3-33-7z'],
    MN: ['Minnesota', 'M479 71l32 0 0-9 3 0 5 14 12 3 1 2 12-2 5 1-1 2 3 0 2 5 2-3 3 0 8 7 10-5 2 3 20 1-21 11-18 18 1 2-4 1 0 14-8 8 0 3 3 3-2 16 23 16 4 11-85 2 0-41-7-7 5-7z'],
    MO: ['Missouri', 'M502 262l69-2 5 5-1 6 3 9 12 10 3 8 2-2 6 2-3 15 15 11 2 7-1 2 3 6 4 1 0 7-4 4-1 0-2-1 1 2 0 5-3 0 2 3-2 3-12 1 5-7-1-5-81 3 0-11 0-50-4-1-5-7 3-5-1-3-6-3z'],
    MS: ['Mississippi', 'M589 433l2-10-3 0 1-3-2-2 4 0-2-1 3-2-2-4 3-2-1-2 3-1-3-1 7-5-1-6 2 0-2-1 3-1-1-3 4 0-1-2 39-3 2 2-2 69 4 34-17 3 0-1-4 4-7-10 2-8-37 2-1-6 3 0-2-3 2 1-1-4 2-1-2-1 8-10-1 0 2-3-3-1 5-3-4-3 2-1-1-3-2 0 2-2-2 0 1-3 0-2-2 1z'],
    MT: ['Montana', 'M198 39l87 16 92 11-6 68-2 22-111-14-2 12-4-7-3 4-12-3-2 3-7-2-1 3-3-10-5-3-2-18-2-3-7 5-3-3 8-24-6-2-6-14-6-6 2 0 0-5-4-7z'],
    NC: ['North Carolina', 'M756 334l103-18 9 16-11-15 5 9-3-3 1 2-2 0-4-2 3 3-7 0 3 2-3 3-3-1-2-5 0 3 2 5 11-4 2 8 2-8 3 3 0 5-5 7-7 1-2-3 2-1-3 1 2 3-9-2 11 4-4 8-4 0 4 1 5-5 4 1-3 8-2-2-1 2 3 1 7-11-7 12-3-1-6 2-9 7-5 14-10 2-25-18-20 3-1-2-3-4-2 2 0-2-25 2-12 7-22 3 0-6 4-2 2-5 16-8 5-8 2 3 4-5 5 0 1-5 4-1z'],
    ND: ['North Dakota', 'M377 66l102 5 10 69-118-6z'],
    NE: ['Nebraska', 'M365 201l92 5 7 6 4-3 10 1 13 8 5 12 0 10 3 2 1 17 2 3 8 13-116-3 1-23-34-2z'],
    NH: ['New Hampshire', 'M886 111l0-6 5-3 13 42 6 6-1 5-6 6-19 4-2-3-1-16 2-13-1-5 6-6z'],
    NJ: ['New Jersey', 'M849 246l1-2 1-3 10-10-11-10 2-5-2-2 5-10 15 5-1 7 0 1-2 4 4 1 2 15-9 22-1 0 0-5-4 0-9-4z'],
    NM: ['New Mexico', 'M265 328l107 11 0 12-9 102-68-6 1 5-32-4-1 10-16-2z'],
    NV: ['Nevada', 'M100 179l49 12 49 10-22 112-3 18-3 4-3-4-7 0-3 25-74-110z'],
    NY: ['New York', 'M768 200l12-14-5-10 9-4 16 0 11-4 9-8-3-6 2-2-4-2 0-4 14-18 5-5 24-5 6 32 2-2 1 2 4 18 0 16 5 19-4 3 2 2-1 5 4-5 14-4 5-5 0 2 4 1 3-3-20 15-11 5-3-3 1-7-15-5-5-2-4-7-5-3-72 14z'],
    OH: ['Ohio', 'M686 225l22-3 18 5 12-4 6-7 12-7 5 30-2 2 2 6-2 16-5 6-4 0-4 4 0 8-2 2-3-3-3 13-5 2-6-7-6 4-5-1-2 2-10-3-5-7-6 1z'],
    OK: ['Oklahoma', 'M372 339l18 2 133 3 0 11 4 26-1 40-14-8-1 2-15 1-4 4-5-5-3 2-5-3-3 5-1-5-4 3-4-4-4 3-5-7-6 2-13-4-4-6 0 2-6 0-5-5 2-44-54-3z'],
    OR: ['Oregon', 'M71 70l9 7-1 10 6 4 9-1 7 2 2 3 9-1 3 2 24-1 32 7 5 10-19 25 5 6-4 7-9 41-49-12-67-19 0-20 12-19 13-31 6-21 2 2z'],
    PA: ['Pennsylvania', 'M756 209l12-9 1 6 72-14 5 3 4 7 5 2-5 10 2 2-2 5 11 10-10 10-6 4-63 12-17 3-4-21z'],
    RI: ['Rhode Island', 'M902 193l-3-15 6-2 5 6-1 2-2-3 1 10z'],
    SC: ['South Carolina', 'M735 374l12-7 25-2 0 2 2-2 3 4 1 2 20-3 25 18-7 6-5 16-4 1-6 10-9 4 1 4-6 1 3 2-4 5-5-2-10-19-23-18-7-11-9-3z'],
    SD: ['South Dakota', 'M369 156l2-22 118 6-5 7 7 7 0 41-3 0 3 9-3 8 3 6-13-8-10-1-4 3-7-6-92-5z'],
    TN: ['Tennessee', 'M612 363l2-3-2-3 3 0 0-5 1-1 1 0 24-1 0-5 79-6 36-5 0 6-4 1-1 5-5 0-4 5-2-3-5 8-16 8-2 5-4 2 0 6-24 3-47 4-39 3 4-4-2-6 2 0 0-3 2 0-1-5 6-4z'],
    TX: ['Texas', 'M372 351l54 3-2 44 5 5 6 0 0-2 4 6 13 4 6-2 5 7 4-3 4 4 4-3 1 5 3-5 5 3 3-2 5 5 4-4 15-1 1-2 14 8 9 2 0 12 0 23 5 5 0 4 6 13-4 11 1 11-4 5 2 3-19 8 6-4-6 0 0-5-4 2 2 8-5 5 8-5-45 32-8 19 4 22-4-10 0-18 6-13 13-11-5 2-2-2-3 6-2-1-3 2 3 0-3 6-6-1 5 4-4 8-2 1 0-2-2 3 4 0-1 14 6 15-6 2-4-4-12-1-17-8-7-14-1-12-7-6-1-4-7-7-7-19-14-16-18-3-1 2-6 0-4 11-5 6-6-2-20-15-7-23-8-7-20-23-1-5 68 6z'],
    UT: ['Utah', 'M198 201l49 9-3 22 33 5-12 91-89-15z'],
    VA: ['Virginia', 'M855 284l8-4-9 24-1-7zM747 313l6 7 5-4 3 2 6-3 0-2 7-1 3-3-1-4 8-22 6 3 4-11 3 2 6-11 0-7 10 6 1-5 12 7 2 3-1 4-2 0 1 7 4-2 2 4 6 0 8 4-1 7-11-6 8 7 4 0 2 5-3-1 2 3-3 1 5 2 0 2-2 2-5-5-5 1 4-1 5 6 8-2 5 8-103 18-36 5 9-5z'],
    VT: ['Vermont', 'M858 118l28-7 2 11-6 6 1 5-2 13 1 16 2 3-13 3-4-18-1-2-2 2z'],
    WA: ['Washington', 'M95 31l4-3 0 3-3 1 1 5 1-2 2 2-1 3zM91 21l3 2 2-3 2 2-2 5zM184 36l-14 58 1 8-32-7-24 1-3-2-9 1-2-3-7-2-9 1-6-4 1-10-9-7-8-2 3-8 0 6 4-7-4-2 0-3 5 0-4-3-1 2 1-34 10 8 12 4 3 5 3-3 0 6-11 9 4 1-3-1 12-9-5 13-1 2-1-3-1 4 0-5-1 1 1 5 4-4 3 0 1-7 4-6 0-6-1 3-2-2 3-4-4-4 4 1 1-3 0-4-2 1 0-7z'],
    WI: ['Wisconsin', 'M560 121l18-6 2 1-3 7 3-3 5 3 5 5 33 7 0 3 5 2-1 7 3-1 0 5 2 2-5 9-1 4 2 0 5-7 3-1 2-7 2-3 2 1-10 32-1 14 3 17-47 3-1-3-6-1-3-9 2-3-3-6-4-11-23-16 2-16-3-3 0-3 8-8 0-14z'],
    WV: ['West Virginia', 'M733 295l5-2 3-13 3 3 2-2 0-8 4-4 4 0 5-6 2-16-2-6 2-2 4 21 17-3 2 12 6-8 2 1 2-5 6 1 5-5 6 1 3 6-1 5-10-6 0 7-6 11-3-2-4 11-6-3-8 22 1 4-3 3-7 1 0 2-6 3-3-2-5 4-6-7-6-2-5-5-3-5z'],
    WY: ['Wyoming', 'M369 156l-4 45-4 46-84-10-33-5 3-22 9-56 2-12z']
  };
  /* @generated us-map:end */

  var BY_NAME = {};
  Object.keys(US_STATES).forEach(function (k) { BY_NAME[US_STATES[k][0].toLowerCase()] = k; });

  /* "GA, FL, AL", "Georgia; Florida", "GA FL AL" — whatever someone pasted
     out of a sales spreadsheet. Unknown entries are kept so preflight can
     name them rather than the map silently leaving a state blank. */
  function parseStates(raw) {
    var out = { codes: [], unknown: [] };
    String(raw == null ? '' : raw).split(/[,;\n\/]+/).forEach(function (part) {
      var t = part.trim();
      if (!t) return;
      var bits = /^[A-Za-z]{2}(\s+[A-Za-z]{2})+$/.test(t) ? t.split(/\s+/) : [t];
      bits.forEach(function (b) {
        var up = b.toUpperCase().replace(/\./g, '');
        var code = US_STATES[up] ? up : BY_NAME[b.toLowerCase().replace(/\s+/g, ' ')];
        if (code) { if (out.codes.indexOf(code) < 0) out.codes.push(code); }
        else out.unknown.push(b);
      });
    });
    return out;
  }
  CB.territoryStates = { parse: parseStates, all: Object.keys(US_STATES) };

  function distributors(raw) {
    return String(raw == null ? '' : raw).split(/\r?\n/).map(function (line) {
      var bits = line.split('|');
      return { name: (bits[0] || '').trim(), url: (bits.slice(1).join('|') || '').trim() };
    }).filter(function (d) { return d.name; });
  }

  /* Fills for each territory: the brand pulled toward the page for some and
     toward the ink for others, alternating. Toward the page alone, a dark
     scheme turned half the map nearly black; alternating gives every scheme
     both lighter and darker regions, so neighbours — usually next to each
     other in the list too — never match, and none sinks into the ground. */
  var TONES = [['page', 45], ['ink', 70], ['page', 70], ['ink', 50], ['page', 38], ['ink', 85]];

  var SAMPLE = [
    ['Northeast', 'CT, ME, MA, NH, RI, VT, NY, NJ, PA', 'Jordan Ellis', 'jordan.ellis@example.com', '+1 (770) 555-0142'],
    ['Mid-Atlantic', 'DE, MD, DC, VA, WV, KY, OH', 'Priya Natarajan', 'priya.natarajan@example.com', '+1 (770) 555-0167'],
    ['Southeast', 'NC, SC, GA, FL, AL, TN, MS', 'Marcus Bell', 'marcus.bell@example.com', '+1 (770) 555-0118'],
    ['Central', 'MI, IN, IL, WI, MN, IA, MO, ND, SD, NE, KS', 'Elena Ruiz', 'elena.ruiz@example.com', '+1 (770) 555-0193'],
    ['South Central', 'TX, OK, AR, LA, NM', 'Dana Whitfield', 'dana.whitfield@example.com', '+1 (770) 555-0125'],
    ['West', 'WA, OR, CA, NV, ID, MT, WY, UT, CO, AZ, AK, HI', 'Sam Okafor', 'sam.okafor@example.com', '+1 (770) 555-0176']
  ];

  CB.register({
    id: 'territory-map',
    name: 'Territory Map',
    category: CAT,
    icon: '⌖',
    blurb: 'A map of the US by sales territory. Tap a region to see who covers it and where to buy there — no JavaScript, and every state outline ships inside the block.',
    props: [
      { t: 'section', label: 'Heading' },
      { k: 'eyebrow', t: 'text', label: 'Eyebrow', value: 'Find your rep' },
      { k: 'title', t: 'text', label: 'Section title', value: 'Who covers your area' },
      { k: 'sub', t: 'textarea', label: 'Section intro', value: 'Choose your region to see your local specialist and the distributors who stock our products there.' },

      { t: 'section', label: 'Territories' },
      {
        k: 'items', t: 'list', label: 'Territories', itemLabel: 'name', paste: true,
        fields: [
          { k: 'name', t: 'text', label: 'Territory', value: 'Territory' },
          { k: 'states', t: 'text', label: 'States', value: '', help: 'Two-letter codes or full names, separated by commas — “GA, FL, AL”. A state listed in two territories stays with the first.' },
          { k: 'rep', t: 'text', label: 'Rep', value: '' },
          { k: 'role', t: 'text', label: 'Rep title', value: 'Regional sales manager' },
          { k: 'email', t: 'text', label: 'Email', value: '' },
          { k: 'phone', t: 'text', label: 'Phone', value: '' },
          { k: 'sellers', t: 'textarea', label: 'Distributors', value: '', help: 'One per line. Add a link after a | — “Regional Electric Supply | https://…”.' },
          { k: 'note', t: 'text', label: 'Note', value: '' }
        ],
        value: SAMPLE.map(function (r) {
          return {
            name: r[0], states: r[1], rep: r[2], role: 'Regional sales manager', email: r[3], phone: r[4],
            sellers: 'Regional electrical supply | #\nIndependent distributor | #\nNational home center | #', note: ''
          };
        })
      },

      { t: 'section', label: 'Layout' },
      { k: 'layout', t: 'select', label: 'Details sit', value: 'side', options: [['side', 'Beside the map'], ['below', 'Under the map']] },
      { k: 'prompt', t: 'text', label: 'Before a region is chosen', value: 'Choose a region on the map to see who covers it.' },
      { k: 'newTab', t: 'toggle', label: 'Open distributor links in a new tab', value: true },

      { t: 'section', label: 'Style' },
      {
        k: 'bgMode', t: 'select', label: 'Background', value: 'page',
        options: CB.BG_MODES, legacy: { key: 'bg', value: 'custom' },
        help: 'Following the scheme is what lets one Light/Dark setting reach this block.'
      },
      { k: 'bg', t: 'color', label: 'Background colour', value: '#ffffff', when: { bgMode: ['custom'] } },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 0, max: 140, step: 8, unit: 'px', value: 80 }
    ],

    render: function (p, c) {
      var s = c.s;
      var group = 'cb-tm-' + c.cls;
      var target = p.newTab ? ' target="_blank" rel="noopener"' : '';
      var taken = {};
      var ts = (p.items || []).filter(function (it) { return it && it.name; }).map(function (it, i) {
        var codes = parseStates(it.states).codes.filter(function (k) {
          if (taken[k]) return false;
          taken[k] = true;
          return true;
        });
        var tone = TONES[i % TONES.length];
        return { it: it, key: 't' + (i + 1), codes: codes, toward: tone[0], tone: tone[1] };
      }).filter(function (t) { return t.codes.length; });

      function pathOf(codes) {
        return codes.map(function (k) { return US_STATES[k][1]; }).join('');
      }
      var VB = 'viewBox="0 0 975 610" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false"';
      var unassigned = Object.keys(US_STATES).filter(function (k) { return !taken[k] && US_STATES[k][1]; });

      var layers = ts.map(function (t) {
        return '<label class="cb-tm__lab" data-t="' + t.key + '">' +
          '<input class="cb-tm__r cb-sr" type="radio" name="' + c.attr(group) + '" value="' + t.key + '">' +
          '<span class="cb-sr">' + c.esc(t.it.name) + '</span>' +
          '<svg class="cb-tm__layer" ' + VB + '><path d="' + pathOf(t.codes) + '"/></svg></label>';
      }).join('\n');

      function contact(it) {
        var out = [];
        if (it.email) {
          out.push('<li><a class="cb-tm__link" href="mailto:' + c.attr(String(it.email).trim()) + '">' +
            c.esc(it.email).replace('@', '@<wbr>') + '</a></li>');
        }
        var tel = String(it.phone || '').replace(/\s*(?:ext\.?|extension|x|#)\s*\d+\s*$/i, '').replace(/[^\d+]/g, '');
        if (it.phone && tel) out.push('<li><a class="cb-tm__link" href="tel:' + c.attr(tel) + '">' + c.esc(it.phone) + '</a></li>');
        return out.length ? '<ul class="cb-tm__contact">' + out.join('') + '</ul>' : '';
      }

      var panels = ts.map(function (t) {
        var it = t.it;
        var names = t.codes.map(function (k) { return US_STATES[k][0]; }).join(', ');
        var ds = distributors(it.sellers);
        return c.dedent(`
          <article class="cb-tm__panel" data-t="${t.key}">
            <h3 class="cb-tm__name">${c.esc(it.name)}</h3>
            <p class="cb-tm__states">${c.esc(names)}</p>
            ${it.rep ? `<div class="cb-tm__part">
              <p class="cb-tm__k">Your specialist</p>
              <p class="cb-tm__rep">${c.esc(it.rep)}</p>
              ${it.role ? '<p class="cb-tm__role">' + c.esc(it.role) + '</p>' : ''}
              ${contact(it)}
            </div>` : ''}
            ${ds.length ? `<div class="cb-tm__part">
              <p class="cb-tm__k">Where to buy</p>
              <ul class="cb-tm__sellers">${ds.map(function (d) {
                return '<li>' + (d.url ? '<a class="cb-tm__link" href="' + c.url(d.url) + '"' + target + '>' + c.esc(d.name) +
                  (p.newTab ? '<span class="cb-sr"> (opens in a new tab)</span>' : '') + '</a>' : c.esc(d.name)) + '</li>';
              }).join('')}</ul>
            </div>` : ''}
            ${it.note ? '<p class="cb-tm__note">' + c.rich(it.note) + '</p>' : ''}
          </article>`);
      }).join('\n');

      var legend = ts.map(function (t) {
        return '<li><span class="cb-tm__sw" data-t="' + t.key + '" aria-hidden="true"></span>' + c.esc(t.it.name) + '</li>';
      }).join('');

      var html = c.dedent(`
        <section class="${c.cls} cb-tm">
          <div class="cb-wrap">
            ${(p.eyebrow || p.title || p.sub) ? `<header class="cb-tm__head">
              ${p.eyebrow ? '<p class="cb-tm__eyebrow">' + c.esc(p.eyebrow) + '</p>' : ''}
              ${p.title ? '<h2 class="cb-tm__title">' + c.rich(p.title) + '</h2>' : ''}
              ${p.sub ? '<p class="cb-tm__sub">' + c.rich(p.sub) + '</p>' : ''}
            </header>` : ''}
            <div class="cb-tm__layout">
              <div class="cb-tm__map" role="radiogroup" aria-label="${c.attr(p.title || 'Sales territories')}">
                <svg class="cb-tm__base" ${VB}><path d="${pathOf(unassigned)}"/></svg>
        ${c.indent(layers, 8)}
              </div>
              <div class="cb-tm__panels">
                <div class="cb-tm__prompt">
                  ${p.prompt ? '<p class="cb-tm__ask">' + c.esc(p.prompt) + '</p>' : ''}
                  <ul class="cb-tm__legend">${legend}</ul>
                </div>
        ${c.indent(panels, 8)}
              </div>
            </div>
          </div>
        </section>`);

      var tones = ts.map(function (t) {
        var fill = 'color-mix(in srgb, var(--cb-brand) ' + t.tone + '%, var(--cb-' + t.toward + '))';
        return s + ' .cb-tm__lab[data-t="' + t.key + '"] path, ' + s + ' .cb-tm__sw[data-t="' + t.key + '"] { fill: ' + fill + '; background: ' + fill + '; }';
      }).join('\n');
      var shows = ts.map(function (t) {
        return s + ':has(.cb-tm__r[value="' + t.key + '"]:checked) .cb-tm__panel[data-t="' + t.key + '"] { display: block; }';
      }).join('\n');

      var css = `
        ${s}.cb-tm { background: ${c.bg(p)}; padding-block: ${c.num(p.pad, 80)}px; }
        ${s} .cb-tm__head { max-width: 660px; margin-bottom: clamp(24px, 4vw, 40px); }
        ${s} .cb-tm__eyebrow {
          font-size: calc(.75em * var(--cb-eyebrow-scale, 1)); font-weight: var(--cb-eyebrow-weight, 700);
          letter-spacing: calc(.12em + var(--cb-eyebrow-track, 0em)); text-transform: uppercase;
          color: var(--cb-brand-ink, var(--cb-brand)); margin-bottom: 12px;
        }
        ${s} .cb-tm__title {
          font-size: calc(clamp(26px, 3.6vw, 38px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800);
          line-height: calc(1.15 + var(--cb-h-leading, 0)); letter-spacing: calc(-.02em + var(--cb-h-track, 0em)); text-wrap: balance;
        }
        ${s} .cb-tm__sub { margin-top: 10px; color: var(--cb-muted); }

        ${s} .cb-tm__layout {
          display: grid; gap: clamp(24px, 4vw, 48px); align-items: start;
          grid-template-columns: ${p.layout === 'below' ? '1fr' : 'minmax(0, 1.5fr) minmax(0, 1fr)'};
        }

        /* The map: one base drawing for states nobody covers, and one layer
           per territory stacked exactly over it. Each layer is a label around
           a radio button. The layers let clicks fall through everywhere but
           their own states, so tapping a state selects its territory. */
        ${s} .cb-tm__map { position: relative; width: 100%; aspect-ratio: 975 / 610; }
        ${s} .cb-tm__base, ${s} .cb-tm__lab, ${s} .cb-tm__layer { position: absolute; inset: 0; width: 100%; height: 100%; }
        ${s} .cb-tm__base path { fill: var(--cb-border); stroke: ${c.bg(p)}; stroke-width: 1; vector-effect: non-scaling-stroke; }
        ${s} .cb-tm__lab { display: block; pointer-events: none; z-index: 1; }
        ${s} .cb-tm__layer { display: block; overflow: visible; }
        ${s} .cb-tm__lab path {
          pointer-events: visiblePainted; cursor: pointer;
          stroke: ${c.bg(p)}; stroke-width: 1; vector-effect: non-scaling-stroke;
          transition: fill .2s ease;
        }
        ${tones}
        ${s} .cb-tm__lab:hover { z-index: 2; }
        ${s} .cb-tm__lab:hover path { stroke: var(--cb-ink); stroke-width: 1.5; }
        /* Once a territory is chosen the rest step back, so the choice reads
           at a glance rather than by its outline alone. */
        ${s} .cb-tm__map:has(.cb-tm__r:checked) .cb-tm__lab:not(:has(.cb-tm__r:checked)) path { opacity: .42; }
        ${s} .cb-tm__map:has(.cb-tm__r:checked) .cb-tm__lab:hover:not(:has(.cb-tm__r:checked)) path { opacity: .85; }
        ${s} .cb-tm__lab:has(.cb-tm__r:checked) { z-index: 3; }
        ${s} .cb-tm__lab:has(.cb-tm__r:checked) path { fill: var(--cb-brand); stroke: var(--cb-ink); stroke-width: 1.5; }
        ${s} .cb-tm__lab:has(.cb-tm__r:focus-visible) { z-index: 4; }
        ${s} .cb-tm__lab:has(.cb-tm__r:focus-visible) path { stroke: var(--cb-ink); stroke-width: 3; }

        ${s} .cb-tm__panel {
          padding: 22px 24px; border: 1px solid var(--cb-border); border-radius: var(--cb-radius);
          background: var(--cb-surface);
        }
        ${s} .cb-tm__panel + .cb-tm__panel { margin-top: 16px; }
        ${s} .cb-tm__name {
          font-size: calc(clamp(20px, 2.6vw, 28px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 700);
          line-height: calc(1.2 + var(--cb-h-leading, 0)); letter-spacing: calc(-.015em + var(--cb-h-track, 0em));
        }
        ${s} .cb-tm__states { margin-top: 6px; font-size: .85em; color: var(--cb-muted); }
        ${s} .cb-tm__part { margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--cb-border); }
        ${s} .cb-tm__k {
          font-size: calc(.75em * var(--cb-eyebrow-scale, 1)); font-weight: var(--cb-eyebrow-weight, 700);
          letter-spacing: calc(.1em + var(--cb-eyebrow-track, 0em)); text-transform: uppercase; color: var(--cb-muted);
          margin-bottom: 8px;
        }
        ${s} .cb-tm__rep { font-weight: 700; color: var(--cb-ink); }
        ${s} .cb-tm__role { font-size: .92em; color: var(--cb-muted); }
        ${s} .cb-tm__contact, ${s} .cb-tm__sellers { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; font-size: .92em; }
        ${s} .cb-tm__sellers { margin-top: 0; }
        ${s} .cb-tm__link {
          color: var(--cb-brand-ink, var(--cb-brand)); text-decoration: underline; text-underline-offset: .18em;
          overflow-wrap: anywhere;
        }
        ${s} .cb-tm__note { margin-top: 14px; font-size: .92em; color: var(--cb-muted); }
        ${s} .cb-tm__prompt { display: none; }
        ${s} .cb-tm__ask { color: var(--cb-muted); }
        ${s} .cb-tm__legend { display: flex; flex-wrap: wrap; gap: 8px 18px; margin-top: 14px; font-size: .92em; color: var(--cb-ink); }
        ${s} .cb-tm__legend li { display: flex; align-items: center; gap: 8px; }
        ${s} .cb-tm__sw { width: 14px; height: 14px; border-radius: 50%; flex: none; }

        /* One territory at a time, and a prompt until one is chosen — where
           :has() exists to decide it. Anywhere else, every territory's details
           are simply listed, which is longer but loses nothing. */
        @supports selector(:has(*)) {
          ${s} .cb-tm__panel { display: none; }
          ${s} .cb-tm__panel + .cb-tm__panel { margin-top: 0; }
          ${shows}
          ${s} .cb-tm__prompt { display: block; }
          ${s}:has(.cb-tm__r:checked) .cb-tm__prompt { display: none; }
        }

        @media (max-width: 860px) {
          ${s} .cb-tm__layout { grid-template-columns: 1fr; }
        }`;

      return { html: html, css: css, js: '' };
    }
  });
})();
