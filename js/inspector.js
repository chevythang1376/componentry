/* ============================================================================
   Inspector — turns a component's prop schema into an editing panel.
   Renders once per selection. Typing never re-renders (that would steal focus);
   only structural edits (add / remove / reorder) rebuild the affected list.
   ========================================================================== */
CB.Inspector = (function () {
  'use strict';

  var esc = CB.esc, attr = CB.attr;
  var openRows = {};      // "fieldKey:index" -> true, so rows stay open across rebuilds

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function bytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(0) + ' kB';
    return (n / 1048576).toFixed(1) + ' MB';
  }

  /* ----------------------------------------------------------- one control */
  /* get()/set() let the same code drive top-level props and list sub-fields. */

  function control(field, get, set, onInput) {
    var wrap = el('div', 'fld');
    var id = 'f-' + Math.random().toString(36).slice(2, 8);
    var v = get();
    var input;

    if (field.t !== 'toggle') {
      var lab = el('label', 'fld__label');
      lab.setAttribute('for', id);
      lab.textContent = field.label || field.k;
      wrap.appendChild(lab);
    }

    switch (field.t) {

      case 'textarea':
        input = el('textarea', 'ctl ctl--area');
        input.id = id;
        input.rows = 3;
        input.value = v == null ? '' : v;
        input.addEventListener('input', function () { set(input.value); onInput(); });
        wrap.appendChild(input);
        break;

      case 'range': {
        var row = el('div', 'ctl-range');
        input = el('input', 'ctl-slider');
        input.type = 'range';
        input.id = id;
        input.min = field.min; input.max = field.max; input.step = field.step || 1;
        input.value = v;
        var out = el('output', 'ctl-out');
        // Sliders with an `auto` sentinel read as "auto" at that value, so a
        // -4px top padding never shows up as a number the user has to decode.
        function label(val) {
          return (field.auto != null && parseFloat(val) === field.auto)
            ? 'auto' : val + (field.unit || '');
        }
        out.textContent = label(v);
        input.addEventListener('input', function () {
          out.textContent = label(input.value);
          set(parseFloat(input.value));
          onInput();
        });
        row.appendChild(input); row.appendChild(out);
        wrap.appendChild(row);
        break;
      }

      case 'color': {
        var crow = el('div', 'ctl-color');
        input = el('input', 'ctl-swatch');
        input.type = 'color';
        input.id = id;
        input.value = /^#[0-9a-f]{6}$/i.test(v || '') ? v : '#000000';
        var hex = el('input', 'ctl ctl--hex');
        hex.type = 'text';
        hex.value = v == null ? '' : v;
        hex.spellcheck = false;
        input.addEventListener('input', function () { hex.value = input.value; set(input.value); onInput(); });
        hex.addEventListener('input', function () {
          set(hex.value);
          if (/^#[0-9a-f]{6}$/i.test(hex.value)) input.value = hex.value;
          onInput();
        });
        crow.appendChild(input); crow.appendChild(hex);
        wrap.appendChild(crow);
        break;
      }

      case 'select':
        input = el('select', 'ctl ctl--select');
        input.id = id;
        (field.options || []).forEach(function (o) {
          var opt = el('option');
          opt.value = o[0]; opt.textContent = o[1];
          input.appendChild(opt);
        });
        input.value = v;
        input.addEventListener('change', function () { set(input.value); onInput(); });
        wrap.appendChild(input);
        break;

      case 'toggle': {
        var t = el('label', 'ctl-toggle');
        input = el('input');
        input.type = 'checkbox';
        input.id = id;
        input.checked = !!v;
        var track = el('span', 'ctl-toggle__track');
        var text = el('span', 'ctl-toggle__label');
        text.textContent = field.label || field.k;
        input.addEventListener('change', function () { set(input.checked); onInput(); });
        t.appendChild(input); t.appendChild(track); t.appendChild(text);
        wrap.appendChild(t);
        break;
      }

      case 'datetime':
        input = el('input', 'ctl');
        input.type = 'datetime-local';
        input.id = id;
        input.value = v || '';
        input.addEventListener('input', function () { set(input.value); onInput(); });
        wrap.appendChild(input);
        break;

      /* Date without a time. The value is a plain YYYY-MM-DD string, which sorts
         correctly as text and needs no Date object to read back. */
      case 'date':
        input = el('input', 'ctl');
        input.type = 'date';
        input.id = id;
        input.value = v || '';
        input.addEventListener('input', function () { set(input.value); onInput(); });
        wrap.appendChild(input);
        break;

      case 'image': {
        var ibox = el('div', 'ctl-image');
        var thumb = el('div', 'ctl-image__thumb');
        function paintThumb(val) {
          thumb.innerHTML = '';
          if (val) {
            var im = new Image();
            im.src = val;
            im.alt = '';
            im.onerror = function () { thumb.classList.add('is-broken'); };
            thumb.classList.remove('is-broken');
            thumb.appendChild(im);
          } else {
            thumb.textContent = '—';
          }
        }
        paintThumb(v);

        var side = el('div', 'ctl-image__side');
        input = el('input', 'ctl ctl--url');
        input.type = 'text';
        input.id = id;
        input.placeholder = 'https://… or paste a data URI';
        input.value = v == null ? '' : v;
        input.spellcheck = false;
        input.addEventListener('input', function () { set(input.value); paintThumb(input.value); onInput(); });

        var acts = el('div', 'ctl-image__acts');
        var pick = el('button', 'mini');
        pick.type = 'button';
        pick.textContent = 'Upload';
        pick.title = 'Embed a local image as a data URI';
        var file = el('input');
        file.type = 'file';
        file.accept = 'image/*';
        file.hidden = true;
        pick.addEventListener('click', function () { file.click(); });
        file.addEventListener('change', function () {
          var f = file.files && file.files[0];
          if (!f) return;
          var reader = new FileReader();
          reader.onload = function () {
            input.value = reader.result;
            set(reader.result);
            paintThumb(reader.result);
            note.textContent = 'Embedded ' + bytes(reader.result.length) + ' — large files bloat the export.';
            note.hidden = false;
            onInput();
          };
          reader.readAsDataURL(f);
          file.value = '';
        });

        var clear = el('button', 'mini');
        clear.type = 'button';
        clear.textContent = 'Clear';
        clear.addEventListener('click', function () {
          input.value = ''; set(''); paintThumb(''); note.hidden = true; onInput();
        });

        var note = el('p', 'fld__help');
        note.hidden = true;

        acts.appendChild(pick); acts.appendChild(clear); acts.appendChild(file);
        side.appendChild(input); side.appendChild(acts);
        ibox.appendChild(thumb); ibox.appendChild(side);
        wrap.appendChild(ibox);
        wrap.appendChild(note);
        break;
      }

      case 'number':
        input = el('input', 'ctl');
        input.type = 'number';
        input.id = id;
        if (field.min != null) input.min = field.min;
        if (field.max != null) input.max = field.max;
        input.value = v;
        input.addEventListener('input', function () { set(parseFloat(input.value)); onInput(); });
        wrap.appendChild(input);
        break;

      default: /* text, url */
        input = el('input', 'ctl');
        input.type = 'text';
        input.id = id;
        input.value = v == null ? '' : v;
        input.spellcheck = field.t !== 'url';
        if (field.ph) input.placeholder = field.ph;
        input.addEventListener('input', function () { set(input.value); onInput(); });
        wrap.appendChild(input);
    }

    if (field.help) {
      var h = el('p', 'fld__help');
      h.textContent = field.help;
      wrap.appendChild(h);
    }
    return wrap;
  }

  /* ---------------------------------------------------------- list editor */

  function listEditor(field, props, onInput, rerenderList) {
    var box = el('div', 'fld fld--list');

    var head = el('div', 'list__head');
    var title = el('span', 'fld__label');
    title.textContent = field.label || field.k;
    var count = el('span', 'list__count');
    head.appendChild(title); head.appendChild(count);
    box.appendChild(head);

    var rows = el('div', 'list__rows');
    box.appendChild(rows);

    function labelFor(item, i) {
      var key = field.itemLabel;
      var v = key && item ? String(item[key] || '') : '';
      v = v.replace(/\s+/g, ' ').trim();
      if (!v) v = 'Item ' + (i + 1);
      return v.length > 34 ? v.slice(0, 33) + '…' : v;
    }

    function paint() {
      var arr = props[field.k] || (props[field.k] = []);
      rows.innerHTML = '';
      count.textContent = arr.length;

      arr.forEach(function (item, i) {
        var rowKey = field.k + ':' + i;
        var row = el('div', 'lrow');
        if (openRows[rowKey]) row.classList.add('is-open');

        var rh = el('div', 'lrow__head');

        var toggle = el('button', 'lrow__toggle');
        toggle.type = 'button';
        toggle.innerHTML = '<span class="lrow__chev"></span><span class="lrow__name"></span>';
        toggle.querySelector('.lrow__name').textContent = labelFor(item, i);
        toggle.addEventListener('click', function () {
          var open = row.classList.toggle('is-open');
          if (open) openRows[rowKey] = true; else delete openRows[rowKey];
        });

        var acts = el('div', 'lrow__acts');
        function act(label, glyph, fn, disabled) {
          var b = el('button', 'lrow__act');
          b.type = 'button';
          b.title = label;
          b.setAttribute('aria-label', label);
          b.innerHTML = glyph;
          b.disabled = !!disabled;
          b.addEventListener('click', fn);
          acts.appendChild(b);
        }
        act('Move up', '&#9650;', function () {
          arr.splice(i - 1, 0, arr.splice(i, 1)[0]);
          openRows = {}; paint(); onInput();
        }, i === 0);
        act('Move down', '&#9660;', function () {
          arr.splice(i + 1, 0, arr.splice(i, 1)[0]);
          openRows = {}; paint(); onInput();
        }, i === arr.length - 1);
        act('Duplicate', '&#10697;', function () {
          arr.splice(i + 1, 0, JSON.parse(JSON.stringify(item)));
          paint(); onInput();
        });
        act('Delete', '&times;', function () {
          arr.splice(i, 1);
          openRows = {}; paint(); onInput();
        }, arr.length <= 1);

        rh.appendChild(toggle); rh.appendChild(acts);
        row.appendChild(rh);

        var body = el('div', 'lrow__body');
        /* Sub-fields honour `when` the same way top-level ones do, against the
           item's own values. A list whose entries come in kinds — a tile that is
           either a colour or a photo — otherwise has to show every field for
           every kind, which is most of them wrong most of the time. */
        var subConds = [];
        function applySubConditions() {
          subConds.forEach(function (c) {
            var show = Object.keys(c.when).every(function (key) {
              return c.when[key].indexOf(item[key]) > -1;
            });
            c.node.classList.toggle('is-hidden', !show);
          });
        }
        (field.fields || []).forEach(function (sub) {
          var node = control(
            sub,
            function () { return item[sub.k]; },
            function (val) { item[sub.k] = val; },
            function () {
              if (sub.k === field.itemLabel) toggle.querySelector('.lrow__name').textContent = labelFor(item, i);
              applySubConditions();
              onInput();
            }
          );
          if (sub.when) subConds.push({ node: node, when: sub.when });
          body.appendChild(node);
        });
        applySubConditions();
        row.appendChild(body);
        rows.appendChild(row);
      });
    }
    paint();

    var add = el('button', 'list__add');
    add.type = 'button';
    add.innerHTML = '<span>+</span> Add ' + esc((field.label || 'item').replace(/s$/, '').toLowerCase());
    add.addEventListener('click', function () {
      var blank = {};
      (field.fields || []).forEach(function (sub) { blank[sub.k] = sub.value; });
      props[field.k].push(blank);
      openRows[field.k + ':' + (props[field.k].length - 1)] = true;
      paint();
      onInput();
      rows.lastChild.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    box.appendChild(add);
    box.appendChild(pastePanel(field, props, paint, onInput));

    return box;
  }

  /* ------------------------------------------------------- paste a table

     Specs live in a spreadsheet. They always have. Filling a comparison of
     four products across twenty attributes through this inspector is eighty
     boxes, which is the kind of job people start and abandon — so the
     component would ship and go unused.

     Copying out of Excel or Sheets puts tab-separated text on the clipboard,
     so that is the format this reads first; comma-separated is accepted too,
     quotes and all, because that is what a CSV export gives you. */
  function splitRow(line, d) {
    if (d === '\t') return line.split('\t').map(function (c) { return c.trim(); });
    var out = [], cur = '', quoted = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (quoted) {
        if (ch === '"') {
          if (line[i + 1] === '"') { cur += '"'; i++; } else quoted = false;
        } else cur += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === d) { out.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    out.push(cur.trim());
    return out;
  }

  function parseTable(text) {
    var lines = String(text || '').replace(/\r\n?/g, '\n').split('\n')
      .filter(function (l) { return l.trim(); });
    if (!lines.length) return [];
    // A tab anywhere means it came from a spreadsheet, where commas are data.
    var delim = lines.join('').indexOf('\t') > -1 ? '\t' : ',';
    return lines.map(function (l) { return splitRow(l, delim); });
  }

  function normKey(s) { return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]+/g, ''); }

  /* Headers are matched to fields by their visible label, because that is what
     somebody would have typed at the top of their sheet — not by the internal
     key, which they have never seen. Both are tried anyway. A column that
     matches nothing is left out rather than guessed at, and the panel says
     which, so a silent mismatch cannot look like a successful import. */
  function mapHeaders(headers, fields) {
    return headers.map(function (h) {
      var n = normKey(h);
      if (!n) return null;
      var hit = null;
      fields.forEach(function (f) {
        if (hit) return;
        if (normKey(f.label) === n || normKey(f.k) === n) hit = f;
      });
      return hit ? hit.k : null;
    });
  }

  function coerce(sub, raw) {
    var v = String(raw == null ? '' : raw).trim();
    if (!sub) return v;
    if (sub.t === 'toggle') return /^(yes|y|true|1|on|✓)$/i.test(v);
    if (sub.t === 'range') { var n = parseFloat(v); return isNaN(n) ? sub.value : n; }
    return v;
  }

  /* ------------------------------------------------------------ the grid

     A table is edited as a table. Rows in collapsible panels work for a list
     of cards, where each entry is read on its own; they are hopeless for a
     grid, where the whole point is reading down a column and across a row.

     Pasting is the reason this exists at all. The data is already in a
     spreadsheet, so a paste anywhere in the grid fills down and across from
     that cell, growing the table to fit rather than truncating what it was
     given. */
  function blankColumn(fields) {
    var col = {};
    (fields || []).forEach(function (f) { col[f.k] = f.value; });
    return col;
  }

  /* Every row carries exactly one cell per column. A ragged grid renders a
     value under the wrong heading and looks perfectly fine doing it. */
  function squareUp(cols, rows) {
    rows.forEach(function (r) {
      r.cells = r.cells || [];
      while (r.cells.length < cols.length) r.cells.push('');
      r.cells.length = cols.length;
    });
  }

  /* A spreadsheet paste is a rectangle, and it should land as one. Filling
     down and across from the cell you pasted into — and growing the table when
     the rectangle runs past its edge — is what every spreadsheet does, which
     makes it the one behaviour nobody has to be told about. Truncating instead
     would silently lose data somebody watched themselves copy.

     Row -1 is the header, so pasting a sheet that includes its own header row
     into the top-left names the columns in the same gesture.

     Pure, and separate from the editor, because the placement arithmetic is
     what breaks and a textarea is a miserable place to test it from. */
  function applyPaste(cols, rows, ri, ci, text, colFields) {
    var table = parseTable(text);
    if (!table.length) return false;

    var widest = 0;
    table.forEach(function (r) { widest = Math.max(widest, r.length); });
    while (cols.length < ci + widest) cols.push(blankColumn(colFields));

    table.forEach(function (cells, ro) {
      var target = ri + ro;
      if (target < 0) {
        cells.forEach(function (v, co) {
          var col = cols[ci + co];
          if (col) col.label = v;
        });
        return;
      }
      while (rows.length <= target) rows.push({ group: '', cells: [] });
      squareUp(cols, rows);
      cells.forEach(function (v, co) {
        if (ci + co < cols.length) rows[target].cells[ci + co] = v;
      });
    });

    squareUp(cols, rows);
    return true;
  }

  function gridEditor(field, props, onInput, def) {
    var colsKey = field.columnsKey || 'columns';
    /* The per-column extras — image, flag, button — are declared by the
       component on its columns field, so the grid does not invent a schema of
       its own and a new extra needs changing in one place. */
    var colFields = null;
    ((def && def.props) || []).forEach(function (f) {
      if (f.k === colsKey && f.fields) colFields = f.fields;
    });

    var box = el('div', 'fld fld--grid');
    var head = el('div', 'list__head');
    var title = el('span', 'fld__label');
    title.textContent = field.label || field.k;
    var count = el('span', 'list__count');
    head.appendChild(title); head.appendChild(count);
    box.appendChild(head);

    if (field.help) {
      var help = el('p', 'fld__help');
      help.textContent = field.help;
      box.appendChild(help);
    }

    var scroll = el('div', 'grid__scroll');
    box.appendChild(scroll);

    var openCol = -1;      // which column's extras are showing
    var colOpts = el('div', 'grid__colopts');
    colOpts.hidden = true;
    box.appendChild(colOpts);

    function cols() { return props[colsKey] || (props[colsKey] = []); }
    function rows() { return props[field.k] || (props[field.k] = []); }

    function paint() {
      squareUp(cols(), rows());
      count.textContent = rows().length + ' × ' + cols().length;
      scroll.innerHTML = '';

      var t = el('table', 'grid');
      var thead = el('thead');
      var hr = el('tr');

      hr.appendChild(el('th', 'grid__gutter', 'Group'));

      cols().forEach(function (col, ci) {
        var th = el('th', 'grid__colhead' + (col.featured ? ' is-featured' : ''));
        var inp = el('input', 'grid__in grid__in--head');
        inp.type = 'text';
        inp.value = col.label == null ? '' : col.label;
        inp.placeholder = 'Column ' + (ci + 1);
        inp.addEventListener('input', function () { col.label = inp.value; onInput(); });
        inp.addEventListener('paste', function (e) { onPaste(e, -1, ci); });
        th.appendChild(inp);

        var acts = el('div', 'grid__colacts');
        var more = el('button', 'grid__mini');
        more.type = 'button';
        more.textContent = '⋯';
        more.title = 'Image, flag, button, highlight';
        more.setAttribute('aria-label', 'Options for column ' + (ci + 1));
        more.addEventListener('click', function () {
          openCol = (openCol === ci) ? -1 : ci;
          paintColOpts();
        });
        var del = el('button', 'grid__mini');
        del.type = 'button';
        del.innerHTML = '&times;';
        del.title = 'Delete this column';
        del.setAttribute('aria-label', 'Delete column ' + (ci + 1));
        del.disabled = cols().length <= 1;
        del.addEventListener('click', function () {
          cols().splice(ci, 1);
          rows().forEach(function (r) { r.cells.splice(ci, 1); });
          openCol = -1;
          paint(); paintColOpts(); onInput();
        });
        acts.appendChild(more); acts.appendChild(del);
        th.appendChild(acts);
        hr.appendChild(th);
      });

      hr.appendChild(el('th', 'grid__gutter'));
      thead.appendChild(hr);
      t.appendChild(thead);

      var tb = el('tbody');
      rows().forEach(function (r, ri) {
        var tr = el('tr');

        var gtd = el('td', 'grid__gutter');
        var gin = el('input', 'grid__in grid__in--group');
        gin.type = 'text';
        gin.value = r.group == null ? '' : r.group;
        gin.placeholder = '—';
        gin.title = 'Starts a new banded section above this row. Leave empty to continue.';
        gin.addEventListener('input', function () { r.group = gin.value; onInput(); });
        gtd.appendChild(gin);
        tr.appendChild(gtd);

        cols().forEach(function (col, ci) {
          var td = el('td', col.featured ? 'is-featured' : '');
          var inp = el('input', 'grid__in');
          inp.type = 'text';
          inp.value = r.cells[ci] == null ? '' : r.cells[ci];
          inp.dataset.r = ri; inp.dataset.c = ci;
          inp.addEventListener('input', function () { r.cells[ci] = inp.value; onInput(); });
          inp.addEventListener('paste', function (e) { onPaste(e, ri, ci); });
          td.appendChild(inp);
          tr.appendChild(td);
        });

        var atd = el('td', 'grid__gutter');
        var acts = el('div', 'grid__rowacts');
        function act(label, glyph, fn, disabled) {
          var b = el('button', 'grid__mini');
          b.type = 'button';
          b.innerHTML = glyph;
          b.title = label;
          b.setAttribute('aria-label', label);
          b.disabled = !!disabled;
          b.addEventListener('click', fn);
          acts.appendChild(b);
        }
        act('Move up', '&#9650;', function () {
          rows().splice(ri - 1, 0, rows().splice(ri, 1)[0]); paint(); onInput();
        }, ri === 0);
        act('Move down', '&#9660;', function () {
          rows().splice(ri + 1, 0, rows().splice(ri, 1)[0]); paint(); onInput();
        }, ri === rows().length - 1);
        act('Delete row', '&times;', function () {
          rows().splice(ri, 1); paint(); onInput();
        }, rows().length <= 1);
        atd.appendChild(acts);
        tr.appendChild(atd);
        tb.appendChild(tr);
      });
      t.appendChild(tb);
      scroll.appendChild(t);
    }

    function paintColOpts() {
      colOpts.innerHTML = '';
      colOpts.hidden = openCol < 0;
      if (openCol < 0) return;
      var col = cols()[openCol];
      if (!col) { colOpts.hidden = true; return; }

      var hd = el('div', 'grid__optshead');
      hd.textContent = (col.label || 'Column ' + (openCol + 1)) + ' — options';
      var close = el('button', 'grid__mini');
      close.type = 'button';
      close.innerHTML = '&times;';
      close.setAttribute('aria-label', 'Close column options');
      close.addEventListener('click', function () { openCol = -1; paintColOpts(); });
      hd.appendChild(close);
      colOpts.appendChild(hd);

      (colFields || []).forEach(function (sub) {
        if (sub.k === 'label') return;   // edited in the header itself
        colOpts.appendChild(control(
          sub,
          function () { return col[sub.k]; },
          function (v) { col[sub.k] = v; },
          function () { paint(); onInput(); }
        ));
      });
    }

    function onPaste(e, ri, ci) {
      var text = (e.clipboardData || window.clipboardData).getData('text');
      if (!text || !/[\t\n]/.test(text)) return;      // a plain value: let it through
      e.preventDefault();
      if (!applyPaste(cols(), rows(), ri, ci, text, colFields)) return;
      paint(); paintColOpts(); onInput();
    }

    var bar = el('div', 'grid__bar');
    var addRow = el('button', 'grid__act');
    addRow.type = 'button';
    addRow.innerHTML = '<span>+</span> Row';
    addRow.addEventListener('click', function () {
      rows().push({ group: '', cells: [] });
      squareUp(cols(), rows());
      paint(); onInput();
    });
    var addCol = el('button', 'grid__act');
    addCol.type = 'button';
    addCol.innerHTML = '<span>+</span> Column';
    addCol.addEventListener('click', function () {
      cols().push(blankColumn(colFields));
      squareUp(cols(), rows());
      paint(); onInput();
    });
    bar.appendChild(addRow);
    bar.appendChild(addCol);
    box.appendChild(bar);

    paint();
    return box;
  }

  /* The whole import, with no DOM in it — the panel below only collects the
     text and shows what this says about it. Kept separate so it can be tested
     against real spreadsheet output rather than by driving a textarea. */
  function importRows(text, fields, useHeaders) {
    fields = fields || [];
    var empty = { items: [], matched: 0, columns: 0, unmatched: [] };
    var table = parseTable(text);
    if (!table.length) return empty;

    var order, body, unmatched = [];
    if (useHeaders && table.length > 1) {
      order = mapHeaders(table[0], fields);
      table[0].forEach(function (h, i) { if (!order[i] && h) unmatched.push(h); });
      body = table.slice(1);
    } else {
      // No headers to go on, so columns land in the order the fields are
      // declared — which is the order they appear in the panel.
      order = fields.map(function (f) { return f.k; });
      body = table;
    }

    /* Counted from the data, not from the fields. Reporting "6 of 6 matched"
       for a single pasted sentence describes the form rather than what was
       actually read, and a count that flatters the paste is worse than none:
       it is the number someone checks before pressing Replace. */
    var cols = 0;
    body.forEach(function (r) { cols = Math.max(cols, r.length); });
    if (useHeaders && table.length > 1) cols = Math.max(cols, table[0].length);
    order = order.slice(0, cols);

    var matched = order.filter(Boolean).length;
    if (!matched) return { items: [], matched: 0, columns: cols, unmatched: unmatched };

    var items = body.map(function (cells) {
      var item = {};
      fields.forEach(function (f) { item[f.k] = f.value; });
      cells.forEach(function (cell, i) {
        var key = order[i];
        if (!key) return;
        var sub = null;
        fields.forEach(function (f) { if (f.k === key) sub = f; });
        item[key] = coerce(sub, cell);
      });
      return item;
    });

    return { items: items, matched: matched, columns: cols, unmatched: unmatched };
  }

  function pastePanel(field, props, paint, onInput) {
    var fields = field.fields || [];
    var wrap = el('div', 'paste');

    var open = el('button', 'paste__open');
    open.type = 'button';
    open.textContent = 'Paste from a spreadsheet';
    wrap.appendChild(open);

    var panel = el('div', 'paste__body');
    panel.hidden = true;
    wrap.appendChild(panel);

    var ta = el('textarea', 'paste__ta');
    ta.rows = 5;
    ta.placeholder = 'Copy the cells in Excel or Sheets, then paste here.\n' +
      'Include the header row and the columns are matched by name.';
    ta.spellcheck = false;
    panel.appendChild(ta);

    var opts = el('label', 'paste__opt');
    var hdr = document.createElement('input');
    hdr.type = 'checkbox';
    hdr.checked = true;
    var hlab = document.createElement('span');
    hlab.textContent = 'First row is column names';
    opts.appendChild(hdr); opts.appendChild(hlab);
    panel.appendChild(opts);

    var report = el('p', 'paste__report');
    panel.appendChild(report);

    var acts = el('div', 'paste__acts');
    var append = el('button', 'btn btn--sm');
    append.type = 'button';
    append.textContent = 'Add to list';
    var replace = el('button', 'btn btn--sm');
    replace.type = 'button';
    replace.textContent = 'Replace list';
    acts.appendChild(append); acts.appendChild(replace);
    panel.appendChild(acts);

    function plan() {
      var r = importRows(ta.value, fields, hdr.checked);
      if (!r.items.length && !r.matched) {
        return { items: [], ok: false, note: r.columns ? 'None of those columns match this list’s fields.' : '' };
      }
      var note = r.items.length + (r.items.length === 1 ? ' row' : ' rows') + ', ' +
                 r.matched + ' of ' + r.columns + (r.columns === 1 ? ' column' : ' columns') + ' matched';
      if (r.unmatched.length) note += ' — ignoring ' + r.unmatched.slice(0, 3).join(', ') +
        (r.unmatched.length > 3 ? ' and ' + (r.unmatched.length - 3) + ' more' : '');
      return { items: r.items, note: note, ok: r.items.length > 0 };
    }

    function refresh() {
      var r = plan();
      report.textContent = ta.value.trim() ? r.note : '';
      report.classList.toggle('is-bad', !!ta.value.trim() && !r.ok);
      append.disabled = replace.disabled = !r.ok;
    }

    function commit(mode) {
      var r = plan();
      if (!r.ok) return;
      var arr = props[field.k] || (props[field.k] = []);
      if (mode === 'replace') arr.length = 0;
      r.items.forEach(function (it) { arr.push(it); });
      ta.value = '';
      panel.hidden = true;
      open.setAttribute('aria-expanded', 'false');
      refresh();
      paint();
      onInput();
    }

    open.setAttribute('aria-expanded', 'false');
    open.addEventListener('click', function () {
      panel.hidden = !panel.hidden;
      open.setAttribute('aria-expanded', panel.hidden ? 'false' : 'true');
      if (!panel.hidden) ta.focus();
    });
    ta.addEventListener('input', refresh);
    hdr.addEventListener('change', refresh);
    append.addEventListener('click', function () { commit('append'); });
    replace.addEventListener('click', function () { commit('replace'); });
    refresh();

    return wrap;
  }

  /* -------------------------------------------------------------- render */

  function render(host, def, props, onChange) {
    host.innerHTML = '';
    openRows = {};

    var conditionals = [];

    (def.props || []).forEach(function (field) {
      if (field.t === 'section') {
        var sec = el('div', 'insp__section');
        sec.textContent = field.label;
        host.appendChild(sec);
        return;
      }

      var node;
      /* Column extras are edited from inside the grid, which owns how many
         columns there are. Two places to add a column is one place too many,
         so this field carries the values without drawing a panel of its own. */
      if (field.t === 'columns') return;

      if (field.t === 'list') {
        node = listEditor(field, props, onChange);
      } else if (field.t === 'grid') {
        node = gridEditor(field, props, onChange, def);
      } else {
        node = control(
          field,
          function () { return props[field.k]; },
          function (v) { props[field.k] = v; },
          function () { applyConditions(); onChange(); }
        );
      }

      if (field.when) conditionals.push({ node: node, when: field.when });
      host.appendChild(node);
    });

    function applyConditions() {
      conditionals.forEach(function (c) {
        var show = Object.keys(c.when).every(function (key) {
          return c.when[key].indexOf(props[key]) > -1;
        });
        c.node.classList.toggle('is-hidden', !show);
      });
    }
    applyConditions();
  }

  return {
    render: render, importRows: importRows, parseTable: parseTable,
    applyPaste: applyPaste, squareUp: squareUp, blankColumn: blankColumn
  };
})();
