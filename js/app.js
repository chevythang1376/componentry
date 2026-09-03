/* ============================================================================
   Componentry — application shell
   ========================================================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'componentry.project.v1';
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ------------------------------------------------------------- tokens */

  var TOKEN_FIELDS = [
    { t: 'section', label: 'Brand' },
    { k: 'brand', t: 'color', label: 'Primary' },
    { k: 'brand2', t: 'color', label: 'Secondary (gradients)' },
    { k: 'onBrand', t: 'color', label: 'Text on primary' },
    { t: 'section', label: 'Neutrals' },
    {
      k: 'scheme', t: 'select', label: 'Colour scheme', value: 'light',
      options: [['light', 'Light'], ['dark', 'Dark']],
      help: 'Dark swaps the five neutrals below for their dark counterparts. Brand, ' +
            'buttons and type are untouched — a scheme changes the surface a design ' +
            'sits on, not the design. Any block can differ, or swap on scroll, under Advanced.'
    },
    { k: 'ink', t: 'color', label: 'Body text', when: { scheme: ['light'] } },
    {
      k: 'hColorOn', t: 'toggle', label: 'Separate heading colour', value: false,
      help: 'Off means headings take the body colour, which is how it has always worked.'
    },
    { k: 'hColor', t: 'color', label: 'Heading text', when: { hColorOn: [true] } },
    { k: 'muted', t: 'color', label: 'Muted text', when: { scheme: ['light'] } },
    {
      k: 'inkOnDark', t: 'color', label: 'Text on dark bands',
      help: 'Used wherever a block paints its own dark surface — a colour band, a photo hero, ' +
            'a dark tile. Held apart from body text because those places are defended against ' +
            'host themes, and a dark body colour there would be invisible.'
    },
    { k: 'surface', t: 'color', label: 'Surface / card', when: { scheme: ['light'] } },
    { k: 'subtle', t: 'color', label: 'Subtle fill', when: { scheme: ['light'] } },
    { k: 'border', t: 'color', label: 'Border', when: { scheme: ['light'] } },
    { k: 'deep', t: 'color', label: 'Dark tile fill', help: 'Stays dark in either scheme, so a "dark tone" tile does not invert when the scheme flips.' },
    { t: 'section', label: 'Typography' },
    {
      k: 'font', t: 'select', label: 'Font stack', options: [
        ['inter', 'Inter (loaded from Google Fonts)'], ['system', 'System UI'],
        ['import', 'The webfont imported below'],
        ['grotesk', 'Inter if installed, else Helvetica'], ['serif', 'Serif'],
        ['slab', 'Slab'], ['rounded', 'Rounded'], ['mono', 'Monospace'], ['custom', 'Custom…']
      ],
      help: 'Importing a webfont below does not switch to it on its own — pick it here too.'
    },
    { k: 'fontCustom', t: 'text', label: 'Custom font-family', ph: '"Söhne", Helvetica, sans-serif', when: { font: ['custom'] } },
    {
      k: 'fontImport', t: 'url', label: 'Webfont @import URL', ph: 'https://fonts.googleapis.com/css2?family=…',
      help: 'Paste a Google Fonts (or similar) URL, then set Font stack above to “The webfont imported below”. The family name is read from the URL.'
    },
    { k: 'scale', t: 'range', label: 'Body size', min: 85, max: 120, step: 1, unit: '%' },
    { k: 'bodyTrack', t: 'range', label: 'Body letter spacing', min: -3, max: 12, step: 1, unit: '/100em' },
    {
      k: 'bodyLeading', t: 'range', label: 'Body line height', min: -30, max: 50, step: 5, unit: '/100',
      help: 'Nudges every component up or down from its own line height rather than replacing it.'
    },
    { k: 'hScale', t: 'range', label: 'Heading size', min: 0.7, max: 1.4, step: 0.05, unit: '\u00d7' },
    { k: 'hTrack', t: 'range', label: 'Heading letter spacing', min: -6, max: 10, step: 1, unit: '/100em' },
    { k: 'hLeading', t: 'range', label: 'Heading line height', min: -20, max: 40, step: 5, unit: '/100' },
    {
      k: 'hWeight', t: 'select', label: 'Heading weight', options: [
        ['0', 'Per component'], ['400', 'Regular'], ['500', 'Medium'], ['600', 'Semibold'],
        ['700', 'Bold'], ['800', 'Extrabold'], ['900', 'Black']
      ],
      help: '\u201cPer component\u201d keeps the weight each block was designed with.'
    },
    {
      k: 'eyebrowScale', t: 'range', label: 'Eyebrow size', min: 0.7, max: 1.5, step: 0.05, unit: '\u00d7',
      help: 'The small uppercase line above a heading — “PERFORMANCE”, “NEW FOR 2026”.'
    },
    { k: 'eyebrowTrack', t: 'range', label: 'Eyebrow letter spacing', min: -6, max: 16, step: 1, unit: '/100em' },
    {
      k: 'eyebrowWeight', t: 'select', label: 'Eyebrow weight', options: [
        ['0', 'Per component'], ['500', 'Medium'], ['600', 'Semibold'], ['700', 'Bold'], ['800', 'Extrabold']
      ]
    },
    { t: 'section', label: 'Shape' },
    { k: 'radius', t: 'range', label: 'Corner radius', min: 0, max: 32, step: 1, unit: 'px' },
    { k: 'maxWidth', t: 'range', label: 'Content width', min: 720, max: 1600, step: 20, unit: 'px' },

    { t: 'section', label: 'Buttons' },
    {
      k: 'btnPill', t: 'toggle', label: 'Fully rounded (pill)', value: false,
      help: 'Overrides the corner radius below.'
    },
    { k: 'btnRadius', t: 'range', label: 'Button corners', min: 0, max: 32, step: 1, unit: 'px', when: { btnPill: [false] } },
    {
      k: 'btnSize', t: 'select', label: 'Size',
      options: [['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large']]
    },
    { k: 'btnWeight', t: 'range', label: 'Label weight', min: 400, max: 800, step: 50 },
    { k: 'btnUpper', t: 'toggle', label: 'Uppercase labels', value: false },
    { k: 'btnTracking', t: 'range', label: 'Letter spacing', min: -2, max: 16, step: 1, unit: '/100em' },
    {
      k: 'btnBorder', t: 'range', label: 'Outline thickness', min: 1, max: 4, step: 1, unit: 'px',
      help: 'Applies to secondary / outlined buttons.'
    },
    {
      k: 'btnHover', t: 'select', label: 'Hover effect',
      options: [['lift', 'Lift'], ['darken', 'Darken'], ['none', 'None']]
    },
    { k: 'btnShadow', t: 'toggle', label: 'Glow under primary buttons', value: true }
  ];

  var PRESETS = [
    { name: 'Southwire', brand: '#96694c', brand2: '#6f4c37', ink: '#141210', muted: '#6b625a', surface: '#ffffff', subtle: '#f7f4f1', border: '#e4ddd5', onBrand: '#ffffff' },
    { name: 'Copper/Blk', brand: '#96694c', brand2: '#2b241f', ink: '#0a0a0a', muted: '#5c554e', surface: '#ffffff', subtle: '#f2efec', border: '#ded7cf', onBrand: '#ffffff' },
    { name: 'Indigo', brand: '#5b5bd6', brand2: '#0ea5e9', ink: '#0f172a', muted: '#5b6b7f', surface: '#ffffff', subtle: '#f4f6fb', border: '#e2e8f0', onBrand: '#ffffff' },
    { name: 'Forest', brand: '#15803d', brand2: '#84cc16', ink: '#14261a', muted: '#5c7065', surface: '#ffffff', subtle: '#f2f8f3', border: '#dcebe0', onBrand: '#ffffff' },
    { name: 'Ember', brand: '#ea580c', brand2: '#f59e0b', ink: '#231409', muted: '#7c6355', surface: '#ffffff', subtle: '#fdf6f0', border: '#f0e2d5', onBrand: '#ffffff' },
    { name: 'Ink', brand: '#111827', brand2: '#4b5563', ink: '#111827', muted: '#6b7280', surface: '#ffffff', subtle: '#f5f5f5', border: '#e5e5e5', onBrand: '#ffffff' },
    { name: 'Rose', brand: '#be123c', brand2: '#f43f5e', ink: '#1f0a12', muted: '#7a5460', surface: '#ffffff', subtle: '#fdf2f5', border: '#f3dde3', onBrand: '#ffffff' },
    { name: 'Ocean', brand: '#0e7490', brand2: '#22d3ee', ink: '#0b2027', muted: '#4f6b74', surface: '#ffffff', subtle: '#eff9fb', border: '#d7eaef', onBrand: '#ffffff' }
  ];

  /* -------------------------------------------------------------- state */

  var state = null;
  var history = [];
  var future = [];
  var previewScroll = 0;
  var dirty = false;

  function blankProject() {
    return {
      name: 'Untitled project',
      tokens: Object.assign({}, CB.DEFAULT_TOKENS),
      instances: [],
      selected: null
    };
  }

  function snapshot() {
    return JSON.stringify({ name: state.name, tokens: state.tokens, instances: state.instances });
  }

  var lastPushed = null;
  function pushHistory() {
    var snap = snapshot();
    if (snap === lastPushed) return;
    history.push(lastPushed === null ? snap : lastPushed);
    lastPushed = snap;
    if (history.length > 60) history.shift();
    future.length = 0;
    updateHistoryButtons();
  }

  var historyTimer;
  function pushHistoryDebounced() {
    clearTimeout(historyTimer);
    historyTimer = setTimeout(pushHistory, 700);
  }

  function restore(snap) {
    var data = JSON.parse(snap);
    state.name = data.name;
    state.tokens = data.tokens;
    state.instances = data.instances;
    if (!state.instances.some(function (i) { return i.uid === state.selected; })) {
      state.selected = state.instances.length ? state.instances[state.instances.length - 1].uid : null;
    }
    lastPushed = snap;
    renderAll();
  }

  function undo() {
    if (!history.length) return;
    future.push(snapshot());
    restore(history.pop());
    updateHistoryButtons();
    toast('Undo');
  }
  function redo() {
    if (!future.length) return;
    history.push(snapshot());
    restore(future.pop());
    updateHistoryButtons();
    toast('Redo');
  }
  function updateHistoryButtons() {
    $('#undo').disabled = !history.length;
    $('#redo').disabled = !future.length;
  }

  /* ------------------------------------------------------- persistence */

  /* Uploaded images are stored inline as data URIs, so a few photos can walk a
     project up to the browser's per-origin storage limit. That limit is around
     5 MB and hitting it means autosave simply stops — a single toast you can
     easily miss, with the work still only in memory. The budget is shown
     before that happens rather than reported after. */
  var STORAGE_BUDGET = 4000000;

  function updateBudget() {
    var el = $('#budget');
    if (!el) return;
    var used = snapshot().length;
    var pct = used / STORAGE_BUDGET;
    if (pct < 0.5) { el.hidden = true; return; }
    el.hidden = false;
    el.textContent = Math.round(pct * 100) + '% of browser storage';
    el.className = 'budget' + (pct > 0.85 ? ' is-full' : pct > 0.7 ? ' is-warn' : '');
    el.title = (used / 1048576).toFixed(1) + ' MB used, mostly embedded images. ' +
      'Past this browser\'s limit autosave stops. Use Save file to keep a copy, ' +
      'or point image fields at URLs instead of uploading.';
  }

  function save(silent) {
    try {
      localStorage.setItem(STORAGE_KEY, snapshot());
      dirty = false;
      updateBudget();
      if (!silent) toast('Saved to this browser');
    } catch (e) {
      updateBudget();
      toast('Too big for browser storage — use Save file to keep a copy, ' +
            'and shrink or unlink the largest images', true);
    }
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !Array.isArray(data.instances)) return null;
      return {
        name: data.name || 'Untitled project',
        tokens: Object.assign({}, CB.DEFAULT_TOKENS, data.tokens || {}),
        instances: data.instances,
        selected: data.instances.length ? data.instances[0].uid : null
      };
    } catch (e) { return null; }
  }

  /* -------------------------------------------------------- instances */

  function addComponent(typeId, atIndex) {
    var def = CB.get(typeId);
    if (!def) return;
    var inst = {
      uid: CB.uid('i'),
      cls: 'cb-' + typeId + '-' + Math.random().toString(36).slice(2, 7),
      type: typeId,
      props: CB.defaults(def)
    };
    if (atIndex == null || atIndex < 0) state.instances.push(inst);
    else state.instances.splice(atIndex, 0, inst);
    state.selected = inst.uid;
    pushHistory();
    renderAll();
    setTimeout(function () { scrollPreviewTo(inst.uid); }, 260);
    toast(def.name + ' added');
  }

  function indexOf(uid) {
    for (var i = 0; i < state.instances.length; i++) if (state.instances[i].uid === uid) return i;
    return -1;
  }
  function selected() {
    var i = indexOf(state.selected);
    return i === -1 ? null : state.instances[i];
  }

  function removeInstance(uid) {
    var i = indexOf(uid);
    if (i === -1) return;
    var name = (CB.get(state.instances[i].type) || {}).name || 'Component';
    state.instances.splice(i, 1);
    if (state.selected === uid) {
      state.selected = state.instances.length
        ? state.instances[Math.min(i, state.instances.length - 1)].uid : null;
    }
    pushHistory();
    renderAll();
    toast(name + ' removed');
  }

  function duplicateInstance(uid) {
    var i = indexOf(uid);
    if (i === -1) return;
    var copy = JSON.parse(JSON.stringify(state.instances[i]));
    copy.uid = CB.uid('i');
    copy.cls = 'cb-' + copy.type + '-' + Math.random().toString(36).slice(2, 7);
    state.instances.splice(i + 1, 0, copy);
    state.selected = copy.uid;
    pushHistory();
    renderAll();
  }

  function moveInstance(uid, delta) {
    var i = indexOf(uid);
    var j = i + delta;
    if (i === -1 || j < 0 || j >= state.instances.length) return;
    state.instances.splice(j, 0, state.instances.splice(i, 1)[0]);
    pushHistory();
    renderAll();
  }

  /* ---------------------------------------------------------- library */

  /* Starting from an empty canvas means knowing which of 25 blocks go together
     before you have seen any of them. These are the arrangements people
     actually build, dropped in ready to edit — the fastest way to a real page
     is to start from one and delete what you don't want. */
  var TEMPLATES = [
    {
      name: 'Landing page',
      blurb: 'Hero, proof, features, questions, close',
      blocks: ['hero-slider', 'stats-counter', 'feature-grid', 'testimonials', 'accordion', 'cta-banner']
    },
    {
      name: 'Product page',
      blurb: 'Pinned scroller, finishes, specs, enquiry',
      blocks: ['parallax-banner', 'pinned-product', 'finish-switcher', 'spec-strip', 'cta-banner']
    },
    {
      name: 'Capability page',
      blurb: 'Diagram-led, for a system or a service',
      blocks: ['split-hero', 'hotspot-diagram', 'feature-grid', 'timeline', 'cta-banner']
    },
    {
      name: 'Support page',
      blurb: 'Answers first, then a way to reach someone',
      blocks: ['split-hero', 'accordion', 'video-embed', 'cta-banner']
    }
  ];

  function applyTemplate(t) {
    pushHistory();
    t.blocks.forEach(function (id) { if (CB.get(id)) addComponent(id); });
    toast(t.name + ' added — ' + t.blocks.length + ' blocks');
  }

  function renderTemplates(host, filter) {
    var matches = TEMPLATES.filter(function (t) {
      if (!filter) return true;
      return (t.name + ' ' + t.blurb).toLowerCase().indexOf(filter) > -1;
    });
    if (!matches.length) return;

    var h = document.createElement('div');
    h.className = 'rail__group';
    h.textContent = 'Start from a page';
    host.appendChild(h);

    matches.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'lib lib--tpl';
      b.title = t.blocks.map(function (id) { return (CB.get(id) || {}).name || id; }).join(' → ');
      b.innerHTML =
        '<span class="lib__icon" aria-hidden="true">▤</span>' +
        '<span class="lib__text"><span class="lib__name">' + CB.esc(t.name) + '</span>' +
        '<span class="lib__blurb">' + CB.esc(t.blurb) + '</span></span>' +
        '<span class="lib__add" aria-hidden="true">' + t.blocks.length + '</span>';
      b.addEventListener('click', function () { applyTemplate(t); });
      host.appendChild(b);
    });
  }

  function renderLibrary(filter) {
    var host = $('#library');
    host.innerHTML = '';
    filter = (filter || '').trim().toLowerCase();

    renderTemplates(host, filter);

    var groups = {};
    var order = [];
    CB.all().forEach(function (def) {
      var hay = (def.name + ' ' + def.category + ' ' + (def.blurb || '')).toLowerCase();
      if (filter && hay.indexOf(filter) === -1) return;
      if (!groups[def.category]) { groups[def.category] = []; order.push(def.category); }
      groups[def.category].push(def);
    });

    if (!order.length) {
      // Append, never replace — a filter can match a template and no component,
      // and wiping the panel would hide the thing that did match.
      if (!host.children.length) {
        host.innerHTML = '<p class="rail__empty">Nothing matches “' + CB.esc(filter) + '”.</p>';
      }
      return;
    }

    order.forEach(function (cat) {
      var h = document.createElement('div');
      h.className = 'rail__group';
      h.textContent = cat;
      host.appendChild(h);

      groups[cat].forEach(function (def) {
        var b = document.createElement('button');
        b.className = 'lib';
        b.type = 'button';
        b.innerHTML =
          '<span class="lib__icon" aria-hidden="true">' + CB.esc(def.icon || '◻') + '</span>' +
          '<span class="lib__text"><span class="lib__name">' + CB.esc(def.name) + '</span>' +
          '<span class="lib__blurb">' + CB.esc(def.blurb || '') + '</span></span>' +
          '<span class="lib__add" aria-hidden="true">+</span>';
        b.addEventListener('click', function () { addComponent(def.id); });
        host.appendChild(b);
      });
    });
  }

  /* ----------------------------------------------------------- layers */

  var dragUid = null;

  function renderLayers() {
    var host = $('#layers');
    host.innerHTML = '';
    $('#layerCount').textContent = state.instances.length;

    if (!state.instances.length) {
      host.innerHTML = '<p class="rail__empty">The canvas is empty. Add a component from the Library tab.</p>';
      return;
    }

    state.instances.forEach(function (inst, i) {
      var def = CB.get(inst.type) || { name: inst.type, icon: '◻' };
      var row = document.createElement('div');
      row.className = 'layer' + (inst.uid === state.selected ? ' is-active' : '');
      row.draggable = true;
      row.dataset.uid = inst.uid;

      var label = inst.props.title || inst.props.name || '';
      label = String(label).split('\n')[0].trim();

      row.innerHTML =
        '<span class="layer__grip" aria-hidden="true">⠿</span>' +
        '<span class="layer__icon" aria-hidden="true">' + CB.esc(def.icon || '◻') + '</span>' +
        '<span class="layer__text">' +
          '<span class="layer__name">' + CB.esc(def.name) + '</span>' +
          (label ? '<span class="layer__sub">' + CB.esc(label) + '</span>' : '') +
        '</span>' +
        '<span class="layer__acts">' +
          '<button class="layer__act" data-a="up" title="Move up" aria-label="Move up"' + (i === 0 ? ' disabled' : '') + '>&#9650;</button>' +
          '<button class="layer__act" data-a="down" title="Move down" aria-label="Move down"' + (i === state.instances.length - 1 ? ' disabled' : '') + '>&#9660;</button>' +
          '<button class="layer__act" data-a="dup" title="Duplicate" aria-label="Duplicate">&#10697;</button>' +
          '<button class="layer__act" data-a="del" title="Delete" aria-label="Delete">&times;</button>' +
        '</span>';

      row.addEventListener('click', function (e) {
        var act = e.target.closest('.layer__act');
        if (act) {
          e.stopPropagation();
          var a = act.dataset.a;
          if (a === 'up') moveInstance(inst.uid, -1);
          else if (a === 'down') moveInstance(inst.uid, 1);
          else if (a === 'dup') duplicateInstance(inst.uid);
          else if (a === 'del') removeInstance(inst.uid);
          return;
        }
        select(inst.uid);
        scrollPreviewTo(inst.uid);
      });

      row.addEventListener('dragstart', function (e) {
        dragUid = inst.uid;
        row.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', inst.uid); } catch (err) {}
      });
      row.addEventListener('dragend', function () {
        dragUid = null;
        $$('.layer').forEach(function (r) { r.classList.remove('is-dragging', 'is-over'); });
      });
      row.addEventListener('dragover', function (e) {
        if (!dragUid || dragUid === inst.uid) return;
        e.preventDefault();
        row.classList.add('is-over');
      });
      row.addEventListener('dragleave', function () { row.classList.remove('is-over'); });
      row.addEventListener('drop', function (e) {
        e.preventDefault();
        row.classList.remove('is-over');
        if (!dragUid || dragUid === inst.uid) return;
        var from = indexOf(dragUid), to = indexOf(inst.uid);
        state.instances.splice(to, 0, state.instances.splice(from, 1)[0]);
        pushHistory();
        renderAll();
      });

      host.appendChild(row);
    });
  }

  function select(uid) {
    state.selected = uid;
    renderLayers();
    renderInspector();
    highlightPreview();
  }

  /* -------------------------------------------------------- inspector */

  function renderInspector() {
    var host = $('#inspector');
    var inst = selected();
    var title = $('#inspTitle');
    var sub = $('#inspSub');

    if (!inst) {
      title.textContent = 'Properties';
      sub.textContent = 'Nothing selected';
      host.innerHTML = '<p class="rail__empty">Select a component on the canvas — or in the Layers tab — to edit it.</p>';
      return;
    }

    var def = CB.get(inst.type);
    title.textContent = def.name;
    sub.textContent = def.category;

    // Backfill any props added since this instance was created, list entries
    // included — a field added to a list is otherwise missing from every item
    // already saved, and the panel shows it blank while the block renders the
    // default anyway.
    inst.props = CB.hydrate(def, inst.props);

    CB.Inspector.render(host, { props: CB.fields(def) }, inst.props, function () {
      dirty = true;
      pushHistoryDebounced();
      refreshPreview();
      renderLayersLabelsOnly();
    });
  }

  var labelTimer;
  function renderLayersLabelsOnly() {
    clearTimeout(labelTimer);
    labelTimer = setTimeout(renderLayers, 400);
  }

  /* Live contrast on the pairs the palette actually puts together. A colour
     picker will happily hand you an unreadable combination and say nothing —
     twice now that has shipped as a bug — so the ratio is shown while you
     choose rather than found later. */
  var CONTRAST_PAIRS = [
    ['Body text', 'ink', 'surface'],
    ['Muted text', 'muted', 'surface'],
    ['Muted on fill', 'muted', 'subtle'],
    ['Button label', 'onBrand', 'brand'],
    ['Brand on surface', 'brand', 'surface']
  ];

  function paintContrast(host) {
    var rows = CONTRAST_PAIRS.map(function (p) {
      var fg = state.tokens[p[1]], bg = state.tokens[p[2]];
      var r;
      try { r = CB.Preflight.ratio(hexToRgb(fg), hexToRgb(bg)); } catch (e) { return ''; }
      // 4.5 is the WCAG AA bar for body text, 3 the bar for large text.
      var grade = r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'Large only' : 'Fails';
      var cls = r >= 4.5 ? 'ok' : r >= 3 ? 'warn' : 'bad';
      return '<li class="ctr__row">' +
        '<span class="ctr__chip" style="background:' + CB.attr(bg) + ';color:' + CB.attr(fg) + '">Aa</span>' +
        '<span class="ctr__name">' + CB.esc(p[0]) + '</span>' +
        '<span class="ctr__val ctr__val--' + cls + '">' + r.toFixed(1) + ':1 ' + grade + '</span></li>';
    }).join('');
    host.innerHTML = '<div class="insp__section">Contrast</div><ul class="ctr__list">' + rows + '</ul>';
  }

  function hexToRgb(hex) {
    var h = String(hex || '').trim().replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var v = parseInt(h, 16);
    if (isNaN(v)) throw new Error('not a hex colour');
    return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
  }

  function renderTokens() {
    var host = $('#tokens');
    host.innerHTML = '';

    var presetWrap = document.createElement('div');
    presetWrap.className = 'presets';
    presetWrap.innerHTML = '<div class="insp__section">Palette presets</div>';
    var strip = document.createElement('div');
    strip.className = 'presets__strip';
    PRESETS.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'preset';
      b.title = p.name;
      b.innerHTML = '<span class="preset__dots">' +
        '<i style="background:' + p.brand + '"></i>' +
        '<i style="background:' + p.brand2 + '"></i>' +
        '<i style="background:' + p.subtle + '"></i>' +
        '</span><span>' + CB.esc(p.name) + '</span>';
      b.addEventListener('click', function () {
        Object.keys(p).forEach(function (k) { if (k !== 'name') state.tokens[k] = p[k]; });
        pushHistory();
        renderTokens();
        refreshPreview();
        toast(p.name + ' palette applied');
      });
      strip.appendChild(b);
    });
    presetWrap.appendChild(strip);
    host.appendChild(presetWrap);

    var fieldHost = document.createElement('div');
    host.appendChild(fieldHost);

    var contrast = document.createElement('div');
    contrast.className = 'ctr';
    host.appendChild(contrast);

    CB.Inspector.render(fieldHost, { props: TOKEN_FIELDS }, state.tokens, function () {
      dirty = true;
      pushHistoryDebounced();
      refreshPreview();
      paintContrast(contrast);
    });
    paintContrast(contrast);

    var reset = document.createElement('button');
    reset.className = 'btn btn--ghost btn--block';
    reset.type = 'button';
    reset.textContent = 'Reset tokens to defaults';
    reset.addEventListener('click', function () {
      state.tokens = Object.assign({}, CB.DEFAULT_TOKENS);
      pushHistory();
      renderTokens();
      refreshPreview();
    });
    host.appendChild(reset);
  }

  /* ---------------------------------------------------------- preview */

  var previewTimer;
  var canvasMode = 'light';

  function refreshPreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(buildPreview, 180);
  }

  function buildPreview() {
    var frame = $('#preview');
    frame.srcdoc = CB.Export.previewDoc(state.instances, state.tokens, {
      canvas: canvasMode,
      outline: true,
      selected: state.selected,
      names: state.instances.reduce(function (m, i) {
        m[i.uid] = (CB.get(i.type) || {}).name || i.type;
        return m;
      }, {})
    });
  }

  function highlightPreview() {
    var frame = $('#preview');
    if (frame.contentWindow) {
      frame.contentWindow.postMessage({ cbHighlight: state.selected }, '*');
    }
  }

  function scrollPreviewTo(uid) {
    var frame = $('#preview');
    if (frame.contentWindow) frame.contentWindow.postMessage({ cbScrollTo: uid }, '*');
  }

  window.addEventListener('message', function (e) {
    var d = e.data || {};
    if (d.cbSelect) {
      var uid = d.cbSelect;
      if (indexOf(uid) > -1 && uid !== state.selected) {
        select(uid);
        switchRail('layers');
      }
    }
    if (typeof d.cbScroll === 'number') previewScroll = d.cbScroll;
  });

  $('#preview') && $('#preview').addEventListener('load', function () {
    var w = $('#preview').contentWindow;
    if (!w) return;
    if (previewScroll) w.postMessage({ cbRestore: previewScroll }, '*');
    w.postMessage({ cbHighlight: state.selected }, '*');
  });

  /* ------------------------------------------------------------ export */

  var exportState = { format: 'embed', platform: 'generic', scope: 'all', minify: false, shared: true, editable: true };

  function openExport() {
    if (!state.instances.length) { toast('Add a component first', true); return; }
    $('#exportModal').showModal();
    renderExport();
  }

  function currentExportInstances() {
    if (exportState.scope === 'one') {
      var inst = selected();
      return inst ? [inst] : state.instances;
    }
    return state.instances;
  }

  /* Checks the project as configured, not the component defaults — see
     js/preflight.js. Collapsed to a single line when there is nothing wrong,
     so a clean project does not make you read a report. */
  function renderPreflight(insts) {
    var host = $('#preflight');
    var found;
    try {
      found = CB.Preflight.run(insts, state.tokens, {
        platform: exportState.platform,
        shared: exportState.shared
      });
    } catch (e) {
      host.innerHTML = '<p class="pf__clean">Preflight could not run: ' + CB.esc(e.message) + '</p>';
      return;
    }

    var errors = found.filter(function (f) { return f.level === 'error'; }).length;
    var warns = found.filter(function (f) { return f.level === 'warn'; }).length;

    if (!found.length) {
      host.innerHTML = '<p class="pf__clean">Preflight found nothing to fix.</p>';
      return;
    }

    var summary = errors ? errors + ' to fix' : warns ? warns + ' worth a look' : 'A note before you paste';
    var open = errors > 0;

    host.innerHTML =
      '<details class="pf"' + (open ? ' open' : '') + '>' +
      '<summary class="pf__sum pf__sum--' + (errors ? 'error' : warns ? 'warn' : 'info') + '">' +
      CB.esc(summary) + '</summary><ul class="pf__list">' +
      found.map(function (f) {
        return '<li class="pf__item pf__item--' + f.level + '">' +
          '<span class="pf__title">' + CB.esc(f.title) +
          (f.block ? ' <span class="pf__block">' + CB.esc(f.block) + '</span>' : '') + '</span>' +
          '<span class="pf__detail">' + CB.esc(f.detail) + '</span>' +
          '<span class="pf__fix">' + CB.esc(f.fix) + '</span></li>';
      }).join('') +
      '</ul></details>';
  }

  function renderExport() {
    var insts = currentExportInstances();
    var p = CB.Export.parts(insts, state.tokens, { shared: exportState.shared });
    var plat = CB.Export.PLATFORMS[exportState.platform];

    /* Only meaningful with more than one block — a single block has nothing to
       share the reset with. Show what it is actually saving rather than an
       unexplained switch. */
    var sharedLine = $('#sharedLine');
    if (insts.length > 1) {
      sharedLine.hidden = false;
      $('#sharedToggle').checked = exportState.shared;
      var full = CB.Export.parts(insts, state.tokens, { shared: false });
      var saved = full.css.length - p.css.length;
      sharedLine.querySelector('span').textContent = exportState.shared
        ? 'Reset shared — saving ' + (saved / 1024).toFixed(1) + ' kB'
        : 'Share the reset across blocks';
      sharedLine.title = 'States the reset and tokens once for the page instead of inside every block. ' +
        'Turn it off only if you are pasting these blocks into separate embeds, ' +
        'where each one has to stand on its own.';
    } else {
      sharedLine.hidden = true;
    }

    $('#platformNote').innerHTML = plat.note;
    renderPreflight(insts);

    $$('#exportModal [data-format]').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.format === exportState.format);
      b.setAttribute('aria-pressed', b.dataset.format === exportState.format);
    });
    $$('#exportModal [data-scope]').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.scope === exportState.scope);
      b.setAttribute('aria-pressed', b.dataset.scope === exportState.scope);
    });

    var oneDisabled = !selected();
    $('#exportModal [data-scope="one"]').disabled = oneDisabled;

    var host = $('#exportPanes');
    host.innerHTML = '';

    function pane(label, code, lang, hint) {
      var wrap = document.createElement('section');
      wrap.className = 'pane';
      var head = document.createElement('header');
      head.className = 'pane__head';
      head.innerHTML = '<span class="pane__title">' + CB.esc(label) +
        '<span class="pane__size">' + (code.length > 1024 ? (code.length / 1024).toFixed(1) + ' kB' : code.length + ' B') + '</span></span>';
      var copy = document.createElement('button');
      copy.className = 'btn btn--sm';
      copy.type = 'button';
      copy.textContent = 'Copy';
      copy.addEventListener('click', function () { copyText(code, copy); });
      head.appendChild(copy);
      wrap.appendChild(head);
      if (hint) {
        var hn = document.createElement('p');
        hn.className = 'pane__hint';
        hn.innerHTML = hint;
        wrap.appendChild(hn);
      }
      var pre = document.createElement('pre');
      pre.className = 'code';
      var codeEl = document.createElement('code');
      codeEl.textContent = code;
      pre.appendChild(codeEl);
      wrap.appendChild(pre);
      host.appendChild(wrap);
      return code;
    }

    var downloadName, downloadBody, downloadType = 'text/html';

    /* An editable copy of the settings, so this code can be pasted back into
       the editor later. Only rides on the formats that keep the markup whole —
       in split-files mode the HTML pane is what you would paste back, and it
       carries the comment there instead. */
    function withPayload(code, html) {
      if (!exportState.editable) return code;
      return code + '\n\n' + CB.Export.payload(insts, state.tokens, html || code, state.name);
    }

    if (exportState.format === 'embed') {
      downloadBody = pane('Paste this one block',
        withPayload(CB.Export.embed(p, { minify: exportState.minify })), 'html',
        'Markup, styles and behaviour in a single snippet — the usual choice for an HTML embed field.');
      downloadName = 'component-embed.html';
    } else if (exportState.format === 'separate') {
      var css = exportState.minify ? CB.Export.minifyCss(p.css) : p.css;
      var js = exportState.minify ? CB.Export.minifyJs(p.js) : p.js;
      pane('HTML', withPayload(p.html, CB.Export.embed(p, {})), 'html', 'Goes in the embed / rich-text module.');
      pane('CSS', css, 'css', 'Goes in your theme stylesheet or the page’s head custom code.');
      pane('JavaScript', js || '/* This selection needs no JavaScript. */', 'js',
        'Goes before &lt;/body&gt;. Safe to run more than once — it guards against double-initialisation.');
      downloadBody = CB.Export.embed(p, { minify: exportState.minify });
      downloadName = 'component-embed.html';
    } else {
      downloadBody = pane('Full HTML document',
        withPayload(CB.Export.fullDocument(p, { minify: exportState.minify, title: state.name })), 'html',
        'A complete page — use this for iframe-based embeds, or to hand off a standalone file.');
      downloadName = 'component-page.html';
    }

    $('#downloadBtn').onclick = function () {
      var blob = new Blob([downloadBody], { type: downloadType });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = downloadName;
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      toast('Downloaded ' + downloadName);
    };

    $('#copyAllBtn').onclick = function () {
      copyText(exportState.format === 'document'
        ? CB.Export.fullDocument(p, { minify: exportState.minify, title: state.name })
        : CB.Export.embed(p, { minify: exportState.minify }), $('#copyAllBtn'));
    };
  }

  function copyText(text, btn) {
    function done(ok) {
      if (!btn) return;
      var old = btn.textContent;
      btn.textContent = ok ? 'Copied' : 'Press Ctrl+C';
      btn.classList.toggle('is-ok', ok);
      setTimeout(function () { btn.textContent = old; btn.classList.remove('is-ok'); }, 1600);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { fallback(); });
    } else fallback();

    function fallback() {
      // file:// pages have no async clipboard — use the legacy path.
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      done(ok);
    }
  }

  /* ------------------------------------------------------------- chrome */

  var toastTimer;
  function toast(msg, isError) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.toggle('is-error', !!isError);
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-on'); }, 2200);
  }

  function switchRail(which) {
    $$('#leftRail [data-rail]').forEach(function (b) {
      var on = b.dataset.rail === which;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on);
    });
    $('#libraryPanel').hidden = which !== 'library';
    $('#layersPanel').hidden = which !== 'layers';
  }

  function switchInspTab(which) {
    $$('#rightRail [data-insp]').forEach(function (b) {
      var on = b.dataset.insp === which;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on);
    });
    $('#propsPanel').hidden = which !== 'props';
    $('#tokensPanel').hidden = which !== 'tokens';
  }

  function setDevice(w) {
    var stage = $('#stage');
    stage.dataset.device = w;
    $$('#deviceBar [data-device]').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.device === w);
      b.setAttribute('aria-pressed', b.dataset.device === w);
    });
    var widths = { mobile: '390px', tablet: '834px', desktop: '100%' };
    $('#frameWrap').style.maxWidth = widths[w] || '100%';
  }

  function renderAll() {
    renderLayers();
    renderInspector();
    buildPreview();
    $('#projectName').value = state.name;
    updateHistoryButtons();
    updateBudget();
  }

  /* ------------------------------------------------------------- import */

  function exportProject() {
    var blob = new Blob([JSON.stringify({
      name: state.name, tokens: state.tokens, instances: state.instances, version: 1
    }, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (state.name || 'project').replace(/[^\w\-]+/g, '-').toLowerCase() + '.componentry.json';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast('Project file downloaded');
  }

  /* Accepts either a project file or exported code — the export carries the
     same settings in a comment, so both roads lead back to an editable
     project. Returns a reason on failure rather than a bare false, because
     "that file could not be read" is not much help on its own. */
  function adoptProject(text, label) {
    var data = null;
    try { data = JSON.parse(text); } catch (e) { /* not JSON — try it as code */ }
    if (!data || !Array.isArray(data.instances)) data = CB.Export.readPayload(text);

    if (!data || !Array.isArray(data.instances)) {
      return /<[a-z]/i.test(text)
        ? 'That code has no editable copy in it. Only exports made with “Re-editable” on can come back.'
        : 'That is not a Componentry project or export.';
    }
    var unknown = data.instances.filter(function (i) { return !CB.get(i.type); });
    if (unknown.length === data.instances.length) return 'None of those components exist in this build.';

    pushHistory();
    state.name = data.name || label || 'Imported project';
    state.tokens = Object.assign({}, CB.DEFAULT_TOKENS, data.tokens || {});
    state.instances = data.instances.filter(function (i) { return CB.get(i.type); });
    state.selected = state.instances.length ? state.instances[0].uid : null;
    renderAll();
    renderTokens();
    toast('Loaded ' + state.instances.length + ' component' + (state.instances.length === 1 ? '' : 's') +
          (unknown.length ? ' — skipped ' + unknown.length + ' this build does not have' : ''));
    return null;
  }

  function importProject(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var err = adoptProject(String(reader.result), file.name.replace(/\.[^.]+$/, ''));
      if (err) toast(err, true);
    };
    reader.readAsText(file);
  }

  /* --------------------------------------------------------------- init */

  function bind() {
    $('#librarySearch').addEventListener('input', function (e) { renderLibrary(e.target.value); });

    $$('#leftRail [data-rail]').forEach(function (b) {
      b.addEventListener('click', function () { switchRail(b.dataset.rail); });
    });
    $$('#rightRail [data-insp]').forEach(function (b) {
      b.addEventListener('click', function () { switchInspTab(b.dataset.insp); });
    });
    $$('#deviceBar [data-device]').forEach(function (b) {
      b.addEventListener('click', function () { setDevice(b.dataset.device); });
    });

    $('#canvasToggle').addEventListener('click', function () {
      canvasMode = canvasMode === 'light' ? 'grid' : canvasMode === 'grid' ? 'dark' : 'light';
      $('#canvasToggle').dataset.mode = canvasMode;
      $('#canvasToggle').title = 'Canvas: ' + canvasMode;
      buildPreview();
    });

    $('#undo').addEventListener('click', undo);
    $('#redo').addEventListener('click', redo);
    $('#saveBtn').addEventListener('click', function () { save(); });
    $('#exportBtn').addEventListener('click', openExport);
    $('#closeExport').addEventListener('click', function () { $('#exportModal').close(); });

    $('#projectName').addEventListener('input', function (e) {
      state.name = e.target.value;
      dirty = true;
      pushHistoryDebounced();
    });

    $('#newBtn').addEventListener('click', function () {
      if (state.instances.length && !confirm('Start a new project? Anything unsaved will be lost.')) return;
      pushHistory();
      state = blankProject();
      renderAll();
      renderTokens();
      toast('New project');
    });

    $('#exportProjectBtn').addEventListener('click', exportProject);
    $('#importProjectBtn').addEventListener('click', function () { $('#importFile').click(); });
    $('#importFile').addEventListener('change', function (e) {
      if (e.target.files && e.target.files[0]) importProject(e.target.files[0]);
      e.target.value = '';
    });

    $$('#exportModal [data-format]').forEach(function (b) {
      b.addEventListener('click', function () { exportState.format = b.dataset.format; renderExport(); });
    });
    $$('#exportModal [data-scope]').forEach(function (b) {
      b.addEventListener('click', function () { exportState.scope = b.dataset.scope; renderExport(); });
    });
    $('#platformSelect').addEventListener('change', function (e) {
      exportState.platform = e.target.value;
      var plat = CB.Export.PLATFORMS[exportState.platform];
      if (plat.format) exportState.format = plat.format;
      renderExport();
    });
    $('#minifyToggle').addEventListener('change', function (e) {
      exportState.minify = e.target.checked;
      renderExport();
    });
    $('#sharedToggle').addEventListener('change', function (e) {
      exportState.shared = e.target.checked;
      renderExport();
    });
    $('#editableToggle').addEventListener('change', function (e) {
      exportState.editable = e.target.checked;
      renderExport();
    });

    $('#pasteCodeBtn').addEventListener('click', function () {
      $('#pasteInput').value = '';
      $('#pasteNote').textContent = '';
      $('#pasteModal').showModal();
      $('#pasteInput').focus();
    });
    $('#closePaste').addEventListener('click', function () { $('#pasteModal').close(); });
    $('#pasteImport').addEventListener('click', function () {
      var text = $('#pasteInput').value.trim();
      if (!text) { $('#pasteNote').textContent = 'Paste the code first.'; return; }
      var err = adoptProject(text, 'Pasted project');
      if (err) { $('#pasteNote').textContent = err; return; }
      $('#pasteModal').close();
    });

    document.addEventListener('keydown', function (e) {
      var mod = e.ctrlKey || e.metaKey;
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName);
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      else if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
      else if (mod && e.key.toLowerCase() === 'e') { e.preventDefault(); openExport(); }
      else if (e.key === 'Delete' && !typing && state.selected) { removeInstance(state.selected); }
    });

    window.addEventListener('beforeunload', function (e) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    });

    // Autosave — quiet, every 20s, only when something changed.
    setInterval(function () { if (dirty) save(true); }, 20000);
  }

  function init() {
    // A first run opens on an empty canvas. Seeding five blocks meant the first
    // thing anyone did was delete somebody else's page; the empty state already
    // says where to start, and the page templates are one click away.
    var restored = load();
    state = restored || blankProject();
    lastPushed = snapshot();

    bind();
    renderLibrary('');
    renderTokens();
    renderAll();
    setDevice('desktop');
    switchRail('library');
    switchInspTab('props');

    $('#year').textContent = new Date().getFullYear();
    $('#compCount').textContent = CB.all().length;
    if (restored) toast('Restored your last session');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
