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
    { k: 'ink', t: 'color', label: 'Body text' },
    { k: 'muted', t: 'color', label: 'Muted text' },
    { k: 'surface', t: 'color', label: 'Surface / card' },
    { k: 'subtle', t: 'color', label: 'Subtle fill' },
    { k: 'border', t: 'color', label: 'Border' },
    { t: 'section', label: 'Typography' },
    {
      k: 'font', t: 'select', label: 'Font stack', options: [
        ['system', 'System UI'], ['grotesk', 'Inter / grotesk'], ['serif', 'Serif'],
        ['slab', 'Slab'], ['rounded', 'Rounded'], ['mono', 'Monospace'], ['custom', 'Custom…']
      ]
    },
    { k: 'fontCustom', t: 'text', label: 'Custom font-family', ph: '"Söhne", Helvetica, sans-serif', when: { font: ['custom'] } },
    { k: 'fontImport', t: 'url', label: 'Webfont @import URL', ph: 'https://fonts.googleapis.com/css2?family=…', help: 'Optional. Emitted as an @import at the top of the exported CSS.' },
    { k: 'scale', t: 'range', label: 'Base size', min: 85, max: 120, step: 1, unit: '%' },
    { t: 'section', label: 'Shape' },
    { k: 'radius', t: 'range', label: 'Corner radius', min: 0, max: 32, step: 1, unit: 'px' },
    { k: 'maxWidth', t: 'range', label: 'Content width', min: 720, max: 1600, step: 20, unit: 'px' }
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

  function save(silent) {
    try {
      localStorage.setItem(STORAGE_KEY, snapshot());
      dirty = false;
      if (!silent) toast('Saved to this browser');
    } catch (e) {
      toast('Could not save — storage may be full', true);
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

  function renderLibrary(filter) {
    var host = $('#library');
    host.innerHTML = '';
    filter = (filter || '').trim().toLowerCase();

    var groups = {};
    var order = [];
    CB.all().forEach(function (def) {
      var hay = (def.name + ' ' + def.category + ' ' + (def.blurb || '')).toLowerCase();
      if (filter && hay.indexOf(filter) === -1) return;
      if (!groups[def.category]) { groups[def.category] = []; order.push(def.category); }
      groups[def.category].push(def);
    });

    if (!order.length) {
      host.innerHTML = '<p class="rail__empty">No components match “' + CB.esc(filter) + '”.</p>';
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

    // Backfill any props added since this instance was created.
    inst.props = Object.assign(CB.defaults(def), inst.props);

    CB.Inspector.render(host, def, inst.props, function () {
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
    CB.Inspector.render(fieldHost, { props: TOKEN_FIELDS }, state.tokens, function () {
      dirty = true;
      pushHistoryDebounced();
      refreshPreview();
    });

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

  var exportState = { format: 'embed', platform: 'generic', scope: 'all', minify: false };

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

  function renderExport() {
    var insts = currentExportInstances();
    var p = CB.Export.parts(insts, state.tokens);
    var plat = CB.Export.PLATFORMS[exportState.platform];

    $('#platformNote').innerHTML = plat.note;

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

    if (exportState.format === 'embed') {
      downloadBody = pane('Paste this one block',
        CB.Export.embed(p, { minify: exportState.minify }), 'html',
        'Markup, styles and behaviour in a single snippet — the usual choice for an HTML embed field.');
      downloadName = 'component-embed.html';
    } else if (exportState.format === 'separate') {
      var css = exportState.minify ? CB.Export.minifyCss(p.css) : p.css;
      var js = exportState.minify ? CB.Export.minifyJs(p.js) : p.js;
      pane('HTML', p.html, 'html', 'Goes in the embed / rich-text module.');
      pane('CSS', css, 'css', 'Goes in your theme stylesheet or the page’s head custom code.');
      pane('JavaScript', js || '/* This selection needs no JavaScript. */', 'js',
        'Goes before &lt;/body&gt;. Safe to run more than once — it guards against double-initialisation.');
      downloadBody = CB.Export.embed(p, { minify: exportState.minify });
      downloadName = 'component-embed.html';
    } else {
      downloadBody = pane('Full HTML document',
        CB.Export.fullDocument(p, { minify: exportState.minify, title: state.name }), 'html',
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

  function importProject(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (!data || !Array.isArray(data.instances)) throw new Error('Not a Componentry project file');
        pushHistory();
        state.name = data.name || 'Imported project';
        state.tokens = Object.assign({}, CB.DEFAULT_TOKENS, data.tokens || {});
        state.instances = data.instances;
        state.selected = data.instances.length ? data.instances[0].uid : null;
        renderAll();
        renderTokens();
        toast('Imported ' + state.instances.length + ' component' + (state.instances.length === 1 ? '' : 's'));
      } catch (e) {
        toast('That file could not be read', true);
      }
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

  function seedDemo() {
    ['parallax-banner', 'feature-grid', 'carousel', 'accordion', 'cta-banner'].forEach(function (id) {
      if (!CB.get(id)) return;
      state.instances.push({
        uid: CB.uid('i'),
        cls: 'cb-' + id + '-' + Math.random().toString(36).slice(2, 7),
        type: id,
        props: CB.defaults(CB.get(id))
      });
    });
    state.selected = state.instances[0].uid;
  }

  function init() {
    var restored = load();
    state = restored || blankProject();
    if (!restored) seedDemo();
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
