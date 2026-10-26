/* ============================================================================
   Rich text — a small formatting editor for the Article's text.

   The Article stores plain text with a few marks (## heading, **bold**, …)
   and turns it into HTML when the code is generated, so there is no parser in
   the page. This edits that same text by sight: the toolbar formats, and every
   change is written straight back as marks. What is stored, exported and
   tested does not change, and Text shows the marks themselves for anyone who
   would rather type them.

   Everything goes through CB.article — blocks() reads the text, text() writes
   it — so what the editor shows and what the page gets cannot drift apart.
   ========================================================================== */
CB.RichText = (function () {
  'use strict';

  var STYLES = [
    ['p', 'Paragraph'], ['small', 'Small text'], ['large', 'Large text'], ['xl', 'Extra large'],
    ['h2', 'Heading'], ['h3', 'Subheading'], ['quote', 'Quote'], ['list', 'List']
  ];
  var ALIGNS = [['left', 'Align left'], ['center', 'Centre'], ['right', 'Align right'], ['justify', 'Justify']];
  var MODE_KEY = 'cb-rte-mode';

  /* Coloured words are held in the editor as <font color>, because that is
     what the browser's own colour command splits and merges correctly across
     a selection. The colours are the panel's own, so they read as what they
     are here, and only these three are read back: a colour pasted in from
     somewhere else is dropped rather than guessed at. */
  var COLOURS = [['ink', 'Text colour', '#f3efeb'], ['muted', 'Muted', '#9c9289'], ['brand', 'Copper', '#d7a97f']];
  function hexOf(token) {
    for (var i = 0; i < COLOURS.length; i++) if (COLOURS[i][0] === token) return COLOURS[i][2];
    return '';
  }
  function tokenOf(colour) {
    var c = String(colour || '').trim().toLowerCase(), m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c);
    if (m) c = '#' + [m[1], m[2], m[3]].map(function (v) { return ('0' + (+v).toString(16)).slice(-2); }).join('');
    for (var i = 0; i < COLOURS.length; i++) if (COLOURS[i][2] === c) return COLOURS[i][0];
    return '';
  }

  /* Small line icons, drawn in currentColor so they follow the panel. */
  var ICON = {
    link: '<path d="M7 9.5a3 3 0 0 0 4.2.2l2-2a3 3 0 0 0-4.2-4.2l-.9.9"/><path d="M9 6.5a3 3 0 0 0-4.2-.2l-2 2a3 3 0 0 0 4.2 4.2l.9-.9"/>',
    ul: '<circle cx="3" cy="4" r="1"/><circle cx="3" cy="8" r="1"/><circle cx="3" cy="12" r="1"/><path d="M6 4h8M6 8h8M6 12h8"/>',
    ol: '<path d="M2.2 2.8h1v3M2 5.8h2.2M2 9.6c0-.6.5-1 1.1-1s1.1.4 1.1 1c0 .7-2.2 1.4-2.2 2.4h2.2M6.5 4h7.5M6.5 8h7.5M6.5 12h7.5"/>',
    hr: '<path d="M2 8h12"/><path d="M5 4.5h6M5 11.5h6" opacity=".45"/>',
    image: '<rect x="2" y="3" width="12" height="10" rx="1.5"/><circle cx="6" cy="6.5" r="1.2"/><path d="M2.5 12l3.8-3.8 2.7 2.7 1.8-1.8 2.7 2.7"/>',
    left: '<path d="M2 3.5h12M2 6.5h8M2 9.5h12M2 12.5h8"/>',
    center: '<path d="M2 3.5h12M4 6.5h8M2 9.5h12M4 12.5h8"/>',
    right: '<path d="M2 3.5h12M6 6.5h8M2 9.5h12M6 12.5h8"/>',
    justify: '<path d="M2 3.5h12M2 6.5h12M2 9.5h12M2 12.5h7"/>'
  };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ------------------------------------------------- blocks → editable HTML */

  function figureHtml(b) {
    var src = b.src === 'placeholder' ? CB.ph(240, 135, '', '#96694c', '#2b241f') : b.src;
    return '<figure class="rte-fig" contenteditable="false" data-src="' + CB.attr(b.src) + '" data-alt="' +
      CB.attr(b.alt || '') + '" data-caption="' + CB.attr(b.caption || '') + '">' +
      '<img src="' + CB.url(src) + '" alt="">' +
      '<span class="rte-fig__text"><b>Image</b> ' + CB.esc(b.alt || 'no description yet') +
      (b.caption ? '<i>' + CB.esc(b.caption) + '</i>' : '') + '</span></figure>';
  }

  /* The page's coloured spans, as the editor holds them. */
  function inline(t) {
    var html = CB.article.inline(t);
    if (html.indexOf('cb-ar__c--') < 0) return html;
    var box = document.createElement('div');
    box.innerHTML = html;
    Array.prototype.forEach.call(box.querySelectorAll('span[class^="cb-ar__c--"]'), function (sp) {
      var f = document.createElement('font');
      f.setAttribute('color', hexOf(sp.className.replace('cb-ar__c--', '')));
      while (sp.firstChild) f.appendChild(sp.firstChild);
      sp.parentNode.replaceChild(f, sp);
    });
    return box.innerHTML;
  }
  function classes(b) {
    var c = [b.size ? 'is-' + b.size : '', b.align ? 'al-' + b.align : '', b.color ? 'c-' + b.color : ''].filter(Boolean).join(' ');
    return c ? ' class="' + c + '"' : '';
  }

  function blockHtml(b) {
    switch (b.type) {
      case 'hr': return '<hr>';
      case 'h': return b.level === 3 ? '<h4' + classes(b) + '>' + inline(b.text) + '</h4>' : '<h3' + classes(b) + '>' + inline(b.text) + '</h3>';
      case 'ul': case 'ol':
        return '<' + b.type + '>' + b.items.map(function (t) { return '<li>' + (inline(t) || '<br>') + '</li>'; }).join('') + '</' + b.type + '>';
      case 'quote':
        return '<blockquote>' + b.lines.map(function (t) { return '<p>' + (inline(t) || '<br>') + '</p>'; }).join('') + '</blockquote>';
      case 'figure': return figureHtml(b);
      default:
        return '<p' + classes(b) + '>' + (inline(b.text) || '<br>') + '</p>';
    }
  }

  /* ------------------------------------------------- editable DOM → blocks
     Has to read anything, not only what this editor writes: a paste from a
     document or a web page arrives as whatever markup that source used. */

  var BLOCK = /^(P|DIV|H[1-6]|UL|OL|LI|BLOCKQUOTE|HR|FIGURE|TABLE|THEAD|TBODY|TFOOT|TR|TD|TH|SECTION|ARTICLE|HEADER|FOOTER|MAIN|ASIDE|NAV|PRE|DL|DT|DD|ADDRESS)$/;

  /* Spaces stay outside the marks, since a run of asterisks only opens
     before a word and only closes after one: "** bold**" would not be bold. */
  function wrap(m, s) {
    var lead = /^\s*/.exec(s)[0], trail = /\s*$/.exec(s)[0], core = s.trim();
    return core ? lead + m + core + m + trail : s;
  }

  /* encodeURIComponent leaves brackets alone, and a ) would end the address. */
  var HREF_CHARS = { '(': '%28', ')': '%29' };
  function linkMark(label, href) {
    label = label.replace(/[\[\]]/g, '').trim();
    href = String(href).trim().replace(/\s/g, '%20').replace(/[()]/g, function (ch) { return HREF_CHARS[ch]; });
    if (!label) return '';
    return href ? '[' + label + '](' + href + ')' : label;
  }

  /* Text typed here is words: an asterisk in it is written \* so it can
     never start a mark.

     `colour` is the colour the surrounding text already has, so a run is
     only marked where it changes \u2014 and never inside a link, which has its
     own colour and whose words the link mark could not carry. */
  function marksOf(node, colour, inLink) {
    var out = '';
    colour = colour || 'ink';
    Array.prototype.forEach.call(node.childNodes, function (n) {
      if (n.nodeType === 3) { out += n.nodeValue.replace(/[\s\u00a0]+/g, ' ').replace(/\*/g, '\\*'); return; }
      if (n.nodeType !== 1) return;
      var tag = n.tagName, st = n.style || {};
      if (tag === 'BR') { out += ' '; return; }
      if (tag === 'UL' || tag === 'OL' || tag === 'SCRIPT' || tag === 'STYLE') return;
      var own = inLink ? '' : tokenOf(tag === 'FONT' ? n.getAttribute('color') : st.color);
      var link = tag === 'A' && !!n.getAttribute('href');
      var inner = marksOf(n, own || colour, inLink || link);
      if (own && own !== colour) {
        var lead = /^\s*/.exec(inner)[0], trail = /\s*$/.exec(inner)[0], core = inner.trim();
        if (core) inner = lead + '[' + core + ']{' + own + '}' + trail;
      }
      var w = st.fontWeight, f = st.fontStyle;
      /* Google Docs wraps a whole paste in <b style="font-weight:normal">, so
         the tag alone is not enough to call something bold. */
      var bold = ((tag === 'B' || tag === 'STRONG') && !/^(normal|[1-5]00)$/.test(w)) || /^(bold|bolder|[6-9]00)$/.test(w);
      var ital = ((tag === 'I' || tag === 'EM') && f !== 'normal') || f === 'italic';
      if (link) inner = linkMark(inner, n.getAttribute('href'));
      if (bold && ital) inner = wrap('***', inner);
      else if (bold) inner = wrap('**', inner);
      else if (ital) inner = wrap('*', inner);
      out += inner;
    });
    return out;
  }

  /* A paragraph's or heading's own settings: the editor's classes, or for a
     paste, the alignment its source gave it. */
  function settingsOf(n) {
    var cl = n.classList, pick = function (prefix, list) {
      for (var i = 0; i < list.length; i++) if (cl.contains(prefix + list[i])) return list[i];
      return '';
    };
    var align = pick('al-', ['left', 'center', 'right', 'justify']);
    if (!align && /^(center|right|justify)$/.test(n.style && n.style.textAlign)) align = n.style.textAlign;
    return { size: pick('is-', ['small', 'large', 'xl']), align: align, color: pick('c-', ['ink', 'muted', 'brand']) };
  }

  function blocksOf(root) {
    var blocks = [], loose = null;     // inline content found between blocks

    function line(n, colour) { return marksOf(n, colour).replace(/\s+/g, ' ').trim(); }
    function hasBlocks(n) {
      return Array.prototype.some.call(n.children, function (c) { return BLOCK.test(c.tagName); });
    }
    function endLoose() {
      if (!loose) return;
      var t = line(loose);
      if (t) blocks.push({ type: 'p', size: '', align: '', color: '', text: t });
      loose = null;
    }
    function listItems(list, items) {
      Array.prototype.forEach.call(list.children, function (li) {
        var t = line(li);
        if (t) items.push(t);
        Array.prototype.forEach.call(li.children, function (c) {
          if (c.tagName === 'UL' || c.tagName === 'OL') listItems(c, items);
        });
      });
      return items;
    }

    function walk(parent) {
      Array.prototype.forEach.call(parent.childNodes, function (n) {
        if (n.nodeType === 3) {
          if (n.nodeValue.trim()) (loose = loose || document.createElement('p')).appendChild(n.cloneNode());
          return;
        }
        if (n.nodeType !== 1) return;
        var tag = n.tagName;
        if (!BLOCK.test(tag)) {
          if (tag !== 'SCRIPT' && tag !== 'STYLE' && tag !== 'META') (loose = loose || document.createElement('p')).appendChild(n.cloneNode(true));
          return;
        }
        endLoose();
        var t, a;
        if (/^H[1-6]$/.test(tag)) {
          a = settingsOf(n);
          if ((t = line(n, a.color))) blocks.push({ type: 'h', level: /^H[1-3]$/.test(tag) ? 2 : 3, align: a.align, color: a.color, text: t });
        }
        else if (tag === 'UL' || tag === 'OL') {
          var items = listItems(n, []);
          if (items.length) blocks.push({ type: tag === 'OL' ? 'ol' : 'ul', items: items });
        }
        else if (tag === 'LI') { if ((t = line(n))) blocks.push({ type: 'ul', items: [t] }); }
        else if (tag === 'BLOCKQUOTE') {
          var lines = [];
          if (hasBlocks(n)) {
            Array.prototype.forEach.call(n.children, function (c) {
              if (c.tagName === 'UL' || c.tagName === 'OL') lines = lines.concat(listItems(c, []));
              else if ((t = line(c))) lines.push(t);
            });
          } else if ((t = line(n))) lines.push(t);
          if (lines.length) blocks.push({ type: 'quote', lines: lines });
        }
        else if (tag === 'HR') blocks.push({ type: 'hr' });
        else if (tag === 'FIGURE') {
          if (n.hasAttribute('data-src')) {
            blocks.push({ type: 'figure', src: n.getAttribute('data-src'), alt: n.getAttribute('data-alt') || '',
                          caption: n.getAttribute('data-caption') || '' });
          } else {
            var img = n.querySelector('img'), cap = n.querySelector('figcaption');
            var src = img && img.getAttribute('src');
            if (src && /^https?:/i.test(src)) blocks.push({ type: 'figure', src: src, alt: img.getAttribute('alt') || '', caption: cap ? line(cap) : '' });
          }
        }
        else if (hasBlocks(n)) walk(n);
        else {
          a = settingsOf(n);
          if ((t = line(n, a.color))) blocks.push({ type: 'p', size: a.size, align: a.align, color: a.color, text: t });
        }
      });
    }
    walk(root);
    endLoose();
    return blocks;
  }

  /* --------------------------------------------------------------- editor */

  function readMode() { try { return localStorage.getItem(MODE_KEY) === 'text' ? 'text' : 'visual'; } catch (e) { return 'visual'; } }
  function saveMode(m) { try { localStorage.setItem(MODE_KEY, m); } catch (e) {} }

  /* opts: { id, labelId, value, onChange(text) } */
  function article(opts) {
    var text = opts.value == null ? '' : String(opts.value);
    var root = el('div', 'rte');
    var bar = el('div', 'rte__bar');
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'Text formatting');

    var style = el('select', 'rte__style');
    style.setAttribute('aria-label', 'Paragraph style');
    STYLES.forEach(function (s) {
      var o = el('option', null, s[1]);
      o.value = s[0];
      if (s[0] === 'list') o.disabled = true;
      style.appendChild(o);
    });
    bar.appendChild(style);

    var colour = el('select', 'rte__style rte__colour');
    colour.setAttribute('aria-label', 'Colour');
    colour.title = 'Colour of the selected words, or of the whole paragraph when nothing is selected';
    COLOURS.forEach(function (c) {
      var o = el('option', null, c[1]);
      o.value = c[0];
      colour.appendChild(o);
    });
    bar.appendChild(colour);

    function button(name, label, html) {
      var b = el('button', 'rte__btn rte__btn--' + name);
      b.type = 'button';
      b.title = label;
      b.setAttribute('aria-label', label);
      b.innerHTML = html;
      /* Keeps the caret and the selection in the text while the button is pressed. */
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      bar.appendChild(b);
      return b;
    }
    function icon(name) {
      return '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.4" ' +
             'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[name] + '</svg>';
    }
    var bBold = button('bold', 'Bold (Ctrl+B)', '<b>B</b>');
    var bItal = button('italic', 'Italic (Ctrl+I)', '<i>I</i>');
    var bLink = button('link', 'Link (Ctrl+K)', icon('link'));
    /* A paragraph's own alignment. Pressed again, it goes back to following
       the block's Text alignment setting. */
    var bAlign = {};
    ALIGNS.forEach(function (a) { bAlign[a[0]] = button('al-' + a[0], a[1], icon(a[0])); });
    var bUl = button('ul', 'Bulleted list', icon('ul'));
    var bOl = button('ol', 'Numbered list', icon('ol'));
    var bHr = button('hr', 'Divider', icon('hr'));
    var bImg = button('image', 'Image', icon('image'));
    var bMode = el('button', 'rte__mode', 'Text');
    bMode.type = 'button';
    bMode.title = 'Show the text with its marks';
    bMode.setAttribute('aria-pressed', 'false');
    bar.appendChild(bMode);

    var form = el('div', 'rte__form');
    form.hidden = true;

    var area = el('div', 'rte__area');
    area.contentEditable = 'true';
    area.id = opts.id;
    area.spellcheck = true;
    area.setAttribute('role', 'textbox');
    area.setAttribute('aria-multiline', 'true');
    if (opts.labelId) area.setAttribute('aria-labelledby', opts.labelId);

    var raw = el('textarea', 'ctl ctl--area rte__raw');
    raw.rows = 16;
    raw.hidden = true;
    raw.setAttribute('aria-label', 'Article text with marks');

    root.appendChild(bar); root.appendChild(form); root.appendChild(area); root.appendChild(raw);

    try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) {}

    function render() {
      area.innerHTML = CB.article.blocks(text).map(blockHtml).join('') || '<p><br></p>';
    }
    function sync() {
      var next = CB.article.text(blocksOf(area));
      if (next === text) return;
      text = next;
      opts.onChange(text);
    }

    /* ---- selection: remembered, because the style menu and the link form
       both take focus away from the text before they act on it. */
    var saved = null;
    function inArea(node) { return !!node && area.contains(node); }
    function onSelection() {
      if (!root.isConnected) { document.removeEventListener('selectionchange', onSelection); return; }
      var s = window.getSelection();
      if (!s.rangeCount || !inArea(s.anchorNode)) return;
      saved = s.getRangeAt(0).cloneRange();
      refresh();
    }
    document.addEventListener('selectionchange', onSelection);

    /* The live selection when it is still in the text, which it usually is
       even with the style menu focused; the remembered one when it is not. */
    function restore() {
      var s = window.getSelection();
      if (s.rangeCount && inArea(s.anchorNode)) saved = s.getRangeAt(0).cloneRange();
      area.focus();
      if (!saved) return;
      s.removeAllRanges();
      s.addRange(saved);
    }
    function caretAtEnd(node) {
      var r = document.createRange();
      r.selectNodeContents(node);
      r.collapse(false);
      var s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
      saved = r.cloneRange();
    }

    /* The top-level blocks the selection touches; the one holding the caret
       when nothing is selected. */
    function topBlocks() {
      var r = saved;
      if (!r || !inArea(r.commonAncestorContainer)) return [];
      return Array.prototype.filter.call(area.children, function (b) { return r.intersectsNode(b); });
    }
    /* The lines a block holds: one for a paragraph or heading, one per item
       for a list, one per paragraph in a quote. Rules and images hold none. */
    function partsOf(b) {
      var tag = b.tagName;
      if (tag === 'HR' || tag === 'FIGURE') return [];
      if (tag === 'UL' || tag === 'OL') return Array.prototype.slice.call(b.children);
      if (tag === 'BLOCKQUOTE' && b.children.length) return Array.prototype.slice.call(b.children);
      return [b];
    }
    function styleOf(b) {
      if (!b) return 'p';
      var tag = b.tagName;
      if (tag === 'H3') return 'h2';
      if (tag === 'H4') return 'h3';
      if (tag === 'BLOCKQUOTE') return 'quote';
      if (tag === 'UL' || tag === 'OL') return 'list';
      if (b.classList && b.classList.contains('is-large')) return 'large';
      if (b.classList && b.classList.contains('is-small')) return 'small';
      if (b.classList && b.classList.contains('is-xl')) return 'xl';
      return 'p';
    }
    function textBlocks() {
      return topBlocks().filter(function (b) { return /^(P|H3|H4)$/.test(b.tagName); });
    }

    function refresh() {
      var bl = topBlocks();
      style.value = styleOf(bl[0]);
      var on = function (b, cmd) {
        var v = false;
        try { v = document.queryCommandState(cmd); } catch (e) {}
        b.classList.toggle('is-on', v);
        b.setAttribute('aria-pressed', v ? 'true' : 'false');
      };
      on(bBold, 'bold'); on(bItal, 'italic');
      var list = bl.length && bl.every(function (b) { return b.tagName === 'UL'; });
      var olist = bl.length && bl.every(function (b) { return b.tagName === 'OL'; });
      bUl.classList.toggle('is-on', !!list); bUl.setAttribute('aria-pressed', list ? 'true' : 'false');
      bOl.classList.toggle('is-on', !!olist); bOl.setAttribute('aria-pressed', olist ? 'true' : 'false');
      var tb = textBlocks();
      ALIGNS.forEach(function (a) {
        var v = tb.length > 0 && tb.every(function (b) { return b.classList.contains('al-' + a[0]); });
        bAlign[a[0]].classList.toggle('is-on', v);
        bAlign[a[0]].setAttribute('aria-pressed', v ? 'true' : 'false');
      });
      /* What the caret is actually sitting in, whether that came from a
         coloured run or from the paragraph's own colour. */
      var now = '';
      try { now = tokenOf(document.queryCommandValue('foreColor')); } catch (e) {}
      colour.value = now || 'ink';
    }

    function setAlign(a) {
      restore();
      var tb = textBlocks();
      if (!tb.length) return;
      var all = tb.every(function (b) { return b.classList.contains('al-' + a); });
      tb.forEach(function (b) {
        ALIGNS.forEach(function (x) { b.classList.remove('al-' + x[0]); });
        if (!all) b.classList.add('al-' + a);
        if (!b.className) b.removeAttribute('class');
      });
      sync();
      refresh();
    }

    /* Selected words get a coloured run; with nothing selected, the whole
       paragraph or heading changes colour. */
    function setColour(v) {
      restore();
      var s = window.getSelection();
      if (s.rangeCount && !s.isCollapsed) {
        try {
          document.execCommand('styleWithCSS', false, false);
          document.execCommand('foreColor', false, hexOf(v));
        } catch (e) {}
      } else {
        textBlocks().forEach(function (b) {
          b.classList.remove('c-ink', 'c-muted', 'c-brand');
          if (v !== 'ink') b.classList.add('c-' + v);
          if (!b.className) b.removeAttribute('class');
        });
      }
      sync();
      refresh();
    }

    /* Replaces the selected blocks with new ones built from their lines.
       make(lines) returns the nodes to put in their place; each line carries
       its words and the alignment and colour it had, so changing a
       paragraph's style does not quietly undo either. */
    function restructure(make) {
      restore();
      var bl = topBlocks();
      if (!bl.length) return;
      var lines = [];
      bl.forEach(function (b) { lines = lines.concat(partsOf(b)); });
      if (!lines.length) return;
      var nodes = make(lines.map(function (n) {
        return { html: n.innerHTML, keep: (n.className.match(/\b(al|c)-[a-z]+/g) || []).join(' ') };
      }));
      var kept = bl.filter(function (b) { return !partsOf(b).length; });   // rules and images stay
      nodes.forEach(function (n) { area.insertBefore(n, bl[0]); });
      bl.forEach(function (b) { if (kept.indexOf(b) < 0) area.removeChild(b); });
      caretAtEnd(nodes[nodes.length - 1]);
      sync();
      refresh();
    }
    function blockOf(tag, html, cls) {
      var n = document.createElement(tag);
      n.innerHTML = html || '<br>';
      if (cls) n.className = cls;
      return n;
    }

    function setStyle(v) {
      if (v === 'list') return;
      restructure(function (lines) {
        if (v === 'quote') {
          var q = document.createElement('blockquote');
          lines.forEach(function (l) { q.appendChild(blockOf('p', l.html)); });
          return [q];
        }
        var tag = v === 'h2' ? 'h3' : v === 'h3' ? 'h4' : 'p';
        var size = v === 'large' || v === 'small' || v === 'xl' ? 'is-' + v : '';
        return lines.map(function (l) { return blockOf(tag, l.html, (size + ' ' + l.keep).trim()); });
      });
    }
    function toggleList(tag) {
      var bl = topBlocks();
      var already = bl.length && bl.every(function (b) { return b.tagName === tag.toUpperCase(); });
      restructure(function (lines) {
        if (already) return lines.map(function (l) { return blockOf('p', l.html); });
        var list = document.createElement(tag);
        lines.forEach(function (l) { list.appendChild(blockOf('li', l.html)); });
        return [list];
      });
    }
    function insertAfterCurrent(node) {
      restore();
      var bl = topBlocks();
      var after = bl[bl.length - 1];
      if (after) area.insertBefore(node, after.nextSibling);
      else area.appendChild(node);
      /* Somewhere to keep typing after a rule or an image. */
      var next = node.nextElementSibling;
      if (!next || next.tagName === 'HR' || next.tagName === 'FIGURE') {
        next = blockOf('p', '');
        area.insertBefore(next, node.nextSibling);
      }
      caretAtEnd(next);
      sync();
    }

    function exec(cmd, value) {
      restore();
      try { document.execCommand(cmd, false, value); } catch (e) {}
      sync();
      refresh();
    }

    /* ---- the link and image forms, shown under the toolbar */
    var editingFig = null;
    function field(label, value, placeholder) {
      var wrapEl = el('label', 'rte__field');
      wrapEl.appendChild(el('span', null, label));
      var i = el('input', 'ctl');
      i.type = 'text';
      i.value = value || '';
      if (placeholder) i.placeholder = placeholder;
      wrapEl.appendChild(i);
      form.appendChild(wrapEl);
      return i;
    }
    function actions(list) {
      var row = el('div', 'rte__acts');
      list.forEach(function (a) {
        var b = el('button', 'rte__act' + (a.primary ? ' is-primary' : ''), a.label);
        b.type = 'button';
        b.addEventListener('click', a.run);
        row.appendChild(b);
      });
      form.appendChild(row);
    }
    function closeForm(back) {
      form.hidden = true;
      form.innerHTML = '';
      editingFig = null;
      if (back) restore();
    }
    function onFormKeys(apply) {
      form.onkeydown = function (e) {
        if (e.key === 'Enter') { e.preventDefault(); apply(); }
        else if (e.key === 'Escape') { e.preventDefault(); closeForm(true); }
      };
    }

    function openLink() {
      if (!saved) return;
      form.innerHTML = '';
      var a = saved.startContainer.parentElement && saved.startContainer.parentElement.closest('a');
      if (a && !area.contains(a)) a = null;
      var href = field('Link address', a ? a.getAttribute('href') : '', 'https://…');
      function apply() {
        var v = href.value.trim();
        closeForm(true);
        if (!v) return;
        if (a) { a.setAttribute('href', v); sync(); return; }
        if (window.getSelection().isCollapsed) {
          /* No words chosen: the address becomes the words. */
          document.execCommand('insertHTML', false, '<a href="' + CB.attr(CB.url(v)) + '">' + CB.esc(v) + '</a>');
          sync();
        } else exec('createLink', v);
      }
      var list = [{ label: 'Apply', primary: true, run: apply }];
      if (a) list.push({ label: 'Remove link', run: function () { closeForm(true); exec('unlink'); } });
      list.push({ label: 'Cancel', run: function () { closeForm(true); } });
      actions(list);
      onFormKeys(apply);
      form.hidden = false;
      href.focus();
    }

    function openImage(fig) {
      form.innerHTML = '';
      editingFig = fig || null;
      var src = field('Image address', fig ? fig.getAttribute('data-src') : '', 'https://… or placeholder');
      var alt = field('Description', fig ? fig.getAttribute('data-alt') : '', 'What the image shows');
      var cap = field('Caption (optional)', fig ? fig.getAttribute('data-caption') : '', '');
      function apply() {
        var b = { type: 'figure', src: src.value.trim(), alt: alt.value.trim(), caption: cap.value.trim() };
        var target = editingFig;
        closeForm(false);
        if (!b.src) { restore(); return; }
        var holder = document.createElement('div');
        holder.innerHTML = figureHtml(b);
        var node = holder.firstChild;
        if (target) { area.replaceChild(node, target); sync(); }
        else insertAfterCurrent(node);
      }
      var list = [{ label: fig ? 'Update' : 'Insert', primary: true, run: apply }];
      if (fig) list.push({ label: 'Remove image', run: function () { var t = editingFig; closeForm(false); if (t) { t.remove(); sync(); } } });
      list.push({ label: 'Cancel', run: function () { closeForm(true); } });
      actions(list);
      onFormKeys(apply);
      form.hidden = false;
      src.focus();
    }

    /* ---- wiring */
    style.addEventListener('change', function () { setStyle(style.value); });
    colour.addEventListener('change', function () { setColour(colour.value); });
    ALIGNS.forEach(function (a) { bAlign[a[0]].addEventListener('click', function () { setAlign(a[0]); }); });
    bBold.addEventListener('click', function () { exec('bold'); });
    bItal.addEventListener('click', function () { exec('italic'); });
    bLink.addEventListener('click', openLink);
    bUl.addEventListener('click', function () { toggleList('ul'); });
    bOl.addEventListener('click', function () { toggleList('ol'); });
    bHr.addEventListener('click', function () { insertAfterCurrent(document.createElement('hr')); });
    bImg.addEventListener('click', function () { openImage(null); });

    area.addEventListener('input', sync);
    area.addEventListener('click', function (e) {
      var fig = e.target.closest && e.target.closest('.rte-fig');
      if (fig && area.contains(fig)) openImage(fig);
    });
    area.addEventListener('keydown', function (e) {
      var mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); openLink(); }
      /* A line break inside a paragraph has no mark to be written as, so
         Shift+Enter starts a new paragraph like Enter does. */
      else if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); document.execCommand('insertParagraph'); }
    });
    /* A paste is read the way the editor reads itself, so a document's bold,
       italic, headings, lists and links come across and its fonts, colours
       and spacing do not. Plain text is read as marks, so pasting text from
       the Text view keeps its formatting. Parsed in an inert document: markup
       from the clipboard never runs anything here. */
    area.addEventListener('paste', function (e) {
      var cd = e.clipboardData;
      if (!cd) return;
      var html = cd.getData('text/html'), plain = cd.getData('text/plain');
      e.preventDefault();
      var blocks = html
        ? blocksOf(new DOMParser().parseFromString(html, 'text/html').body)
        : CB.article.blocks(plain);
      if (!blocks.length) return;
      if (blocks.length === 1 && blocks[0].type === 'p' && !blocks[0].size) {
        document.execCommand('insertHTML', false, CB.article.inline(blocks[0].text));
      } else {
        document.execCommand('insertHTML', false, blocks.map(blockHtml).join(''));
      }
      sync();
    });

    raw.addEventListener('input', function () { text = raw.value; opts.onChange(text); });

    function setMode(m) {
      var asText = m === 'text';
      closeForm(false);
      if (asText) raw.value = text; else render();
      raw.hidden = !asText;
      area.hidden = asText;
      Array.prototype.forEach.call(bar.children, function (n) { if (n !== bMode) n.disabled = asText; });
      bMode.textContent = asText ? 'Visual' : 'Text';
      bMode.title = asText ? 'Back to formatting by sight' : 'Show the text with its marks';
      bMode.setAttribute('aria-pressed', asText ? 'true' : 'false');
      saveMode(m);
    }
    bMode.addEventListener('click', function () { setMode(raw.hidden ? 'text' : 'visual'); });

    setMode(readMode());
    return {
      node: root,
      focus: function () { (raw.hidden ? area : raw).focus(); }
    };
  }

  return { article: article, blocksOf: blocksOf, blockHtml: blockHtml };
})();
