/* ============================================================================
   Componentry — core runtime
   Zero-dependency. Classic script (no ES modules) so it runs from file://
   ========================================================================== */
window.CB = (function () {
  'use strict';

  var defs = new Map();
  var order = [];

  /* ---------------------------------------------------------------- utils */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function attr(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  /* Text that may contain simple inline markup the user typed on purpose. */
  function rich(s) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }
  /* Safe URL — blocks javascript: and data:text/html injection into href/src */
  function url(s) {
    s = String(s == null ? '' : s).trim();
    if (/^\s*(javascript|vbscript)\s*:/i.test(s)) return '#';
    if (/^\s*data\s*:/i.test(s) && !/^data:image\//i.test(s)) return '#';
    return attr(s);
  }

  var idc = 0;
  function uid(prefix) {
    idc++;
    return (prefix || 'cb') + '-' + Math.random().toString(36).slice(2, 7) + idc.toString(36);
  }

  function num(v, fallback) {
    var n = parseFloat(v);
    return isNaN(n) ? (fallback || 0) : n;
  }
  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

  /* hex -> rgba() so overlays can use an opacity slider */
  function rgba(hex, alpha) {
    var h = String(hex || '#000000').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) return 'rgba(0,0,0,' + alpha + ')';
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
  }

  /* Inline SVG placeholder — keeps the app fully functional offline. */
  function ph(w, h, label, c1, c2) {
    c1 = c1 || '#96694c'; c2 = c2 || '#2b241f';
    var fs = Math.round(Math.min(w, h) / 8);
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/>' +
      '</linearGradient></defs>' +
      '<rect width="' + w + '" height="' + h + '" fill="url(#g)"/>' +
      (label ? '<text x="50%" y="50%" fill="rgba(255,255,255,.8)" font-family="system-ui,sans-serif" ' +
        'font-size="' + fs + '" font-weight="700" text-anchor="middle" dominant-baseline="central">' +
        esc(label) + '</text>' : '') +
      '</svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  /* Wrap generated JS so pasting the same snippet twice is harmless.

     Two guards live here:
       1. data-cb-ready — the body never runs twice for the same element,
          however many copies of the <script> the page ends up with.
       2. id re-uniquing — a duplicated paste would otherwise repeat every id,
          leaving the second copy's aria-controls / aria-labelledby pointing at
          the first copy's nodes. Copies after the first get a suffix. */
  function wrap(cls, body) {
    return [
      '(function () {',
      '  var nodes = document.querySelectorAll(".' + cls + '");',
      '  Array.prototype.forEach.call(nodes, function (root) {',
      '    if (root.getAttribute("data-cb-ready")) return;',
      '    root.setAttribute("data-cb-ready", "1");',
      '',
      '    var copy = Array.prototype.indexOf.call(nodes, root);',
      '    if (copy > 0) {',
      '      var map = {};',
      '      Array.prototype.forEach.call(root.querySelectorAll("[id]"), function (n) {',
      '        map[n.id] = n.id + "-" + copy;',
      '        n.id = map[n.id];',
      '      });',
      '      ["aria-controls", "aria-labelledby", "aria-describedby", "for"].forEach(function (a) {',
      '        Array.prototype.forEach.call(root.querySelectorAll("[" + a + "]"), function (n) {',
      '          n.setAttribute(a, n.getAttribute(a).split(/\\s+/).map(function (t) {',
      '            return map[t] || t;',
      '          }).join(" "));',
      '        });',
      '      });',
      '    }',
      '',
      indent(body, 4),
      '  });',
      '})();'
    ].join('\n');
  }

  function indent(s, n) {
    var pad = new Array(n + 1).join(' ');
    return String(s).split('\n').map(function (l) { return l.trim() ? pad + l : l; }).join('\n');
  }

  function dedent(s) {
    var lines = String(s).replace(/^\n/, '').replace(/\s+$/, '').split('\n');
    var min = Infinity;
    lines.forEach(function (l) {
      if (!l.trim()) return;
      min = Math.min(min, l.match(/^ */)[0].length);
    });
    if (!isFinite(min)) min = 0;
    return lines.map(function (l) { return l.slice(min); }).join('\n');
  }

  /* --------------------------------------------------------- design tokens */

  var FONT_STACKS = {
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    grotesk: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
    serif: 'Georgia, "Times New Roman", "Iowan Old Style", serif',
    slab: '"Rockwell", "Courier Bold", Georgia, serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    rounded: '"Nunito", "Trebuchet MS", "Segoe UI", sans-serif'
  };

  /* Southwire: copper on black and white.
     brand2 is a *deeper* copper rather than a lighter one on purpose — every
     gradient built from brand→brand2 stays dark enough for white text to clear
     WCAG AA (4.75:1 and 7.6:1 respectively). A lighter partner measured 2.9:1. */
  var DEFAULT_TOKENS = {
    brand: '#96694c',
    brand2: '#6f4c37',
    ink: '#141210',
    muted: '#6b625a',
    surface: '#ffffff',
    subtle: '#f7f4f1',
    border: '#e4ddd5',
    onBrand: '#ffffff',
    font: 'system',
    fontImport: '',
    radius: 14,
    maxWidth: 1140,
    scale: 100
  };

  function fontStack(t) {
    if (t.font === 'custom') return t.fontCustom || FONT_STACKS.system;
    return FONT_STACKS[t.font] || FONT_STACKS.system;
  }

  /* Tokens live ON the component wrapper, never on :root — so an export
     dropped into a WYSIWYG page cannot leak variables into the host site. */
  function tokenCss(s, t) {
    return dedent(`
      ${s} {
        --cb-brand: ${t.brand};
        --cb-brand-2: ${t.brand2};
        --cb-ink: ${t.ink};
        --cb-muted: ${t.muted};
        --cb-surface: ${t.surface};
        --cb-subtle: ${t.subtle};
        --cb-border: ${t.border};
        --cb-on-brand: ${t.onBrand};
        --cb-radius: ${num(t.radius, 14)}px;
        --cb-max: ${num(t.maxWidth, 1140)}px;
        --cb-font: ${fontStack(t)};
        --cb-fs: ${(num(t.scale, 100) / 100 * 16).toFixed(2)}px;
      }`);
  }

  /* Defensive reset. WYSIWYG hosts inject unpredictable global styles
     (Bootstrap, theme resets, `img{width:100%}`, etc). Everything below is
     scoped to the component so it survives a hostile page without leaking. */
  function baseCss(s) {
    return dedent(`
      ${s} {
        box-sizing: border-box;
        font-family: var(--cb-font);
        font-size: var(--cb-fs);
        line-height: 1.6;
        color: var(--cb-ink);
        -webkit-font-smoothing: antialiased;
        text-align: left;
      }
      ${s} *, ${s} *::before, ${s} *::after { box-sizing: border-box; }
      ${s} h1, ${s} h2, ${s} h3, ${s} h4, ${s} h5, ${s} h6,
      ${s} p, ${s} figure, ${s} blockquote, ${s} dl, ${s} dd, ${s} li {
        margin: 0; padding: 0;
      }
      /* Host themes routinely restyle bare element selectors, which beats plain
         inheritance from the wrapper. Hand these properties back explicitly. */
      ${s} h1, ${s} h2, ${s} h3, ${s} h4, ${s} h5, ${s} h6, ${s} p, ${s} li,
      ${s} span, ${s} blockquote, ${s} figcaption, ${s} strong, ${s} em, ${s} small, ${s} cite {
        font-family: inherit; color: inherit; line-height: inherit;
        letter-spacing: inherit; text-transform: none; text-indent: 0;
      }
      ${s} ul, ${s} ol { margin: 0; padding: 0; list-style: none; }
      ${s} img, ${s} video, ${s} svg, ${s} iframe { display: block; max-width: 100%; }
      ${s} img { width: auto; height: auto; border: 0; }
      ${s} button {
        font: inherit; color: inherit; letter-spacing: inherit; text-transform: none;
        background: none; border: 0; border-radius: 0; padding: 0; margin: 0;
        cursor: pointer; text-align: inherit;
      }
      ${s} a { color: inherit; text-decoration: none; }
      ${s} .cb-wrap { width: 100%; max-width: var(--cb-max); margin-inline: auto; padding-inline: clamp(16px, 5vw, 32px); }
      ${s} .cb-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: .5em;
        padding: .78em 1.5em; border-radius: calc(var(--cb-radius) * .72);
        font-weight: 650; line-height: 1.2; text-decoration: none; cursor: pointer;
        transition: transform .18s ease, box-shadow .18s ease, background-color .18s ease;
      }
      ${s} .cb-btn:hover { transform: translateY(-2px); }
      ${s} .cb-btn:focus-visible, ${s} [class*="cb-"]:focus-visible {
        outline: 3px solid var(--cb-brand); outline-offset: 3px;
      }
      ${s} .cb-btn--primary { background: var(--cb-brand); color: var(--cb-on-brand); box-shadow: 0 6px 18px -6px var(--cb-brand); }
      ${s} .cb-btn--ghost { border: 2px solid currentColor; }
      ${s} .cb-sr {
        position: absolute !important; width: 1px; height: 1px; overflow: hidden;
        clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap;
      }
      @media (prefers-reduced-motion: reduce) {
        ${s} *, ${s} *::before, ${s} *::after {
          animation-duration: .01ms !important; animation-iteration-count: 1 !important;
          transition-duration: .01ms !important; scroll-behavior: auto !important;
        }
      }`);
  }

  /* ------------------------------------------------------------- registry */

  function register(def) {
    def.props = def.props || [];
    defs.set(def.id, def);
    order.push(def.id);
  }
  function get(id) { return defs.get(id); }
  function all() { return order.map(function (id) { return defs.get(id); }); }

  /* Walk a component's schema and collect default values. */
  function defaults(def) {
    var out = {};
    (def.props || []).forEach(function (f) {
      if (f.t === 'section') return;
      if (f.t === 'list') { out[f.k] = JSON.parse(JSON.stringify(f.value || [])); return; }
      out[f.k] = f.value;
    });
    return out;
  }

  /* ------------------------------------------------------------- rendering */

  function build(instance, tokens) {
    var def = get(instance.type);
    if (!def) return { html: '', css: '', js: '' };

    var cls = instance.cls;
    var s = '.' + cls;
    var ctx = {
      cls: cls, s: s, id: cls, tokens: tokens,
      esc: esc, attr: attr, rich: rich, url: url, num: num, clamp: clamp,
      rgba: rgba, ph: ph, uid: uid, wrap: wrap, dedent: dedent, indent: indent
    };

    var p = Object.assign({}, defaults(def), instance.props || {});
    var out;
    try {
      out = def.render(p, ctx) || {};
    } catch (err) {
      console.error('[Componentry] render failed for ' + def.id, err);
      return {
        html: '<div style="padding:24px;font:14px system-ui;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:8px">' +
          esc(def.name) + ' failed to render: ' + esc(err.message) + '</div>',
        css: '', js: ''
      };
    }

    return {
      html: (out.html || '').trim(),
      css: [tokenCss(s, tokens), baseCss(s), dedent(out.css || '')].join('\n\n').trim(),
      js: (out.js || '').trim()
    };
  }

  return {
    register: register, get: get, all: all, defaults: defaults, build: build,
    esc: esc, attr: attr, rich: rich, url: url, uid: uid, num: num, clamp: clamp,
    rgba: rgba, ph: ph, wrap: wrap, indent: indent, dedent: dedent,
    tokenCss: tokenCss, baseCss: baseCss,
    FONT_STACKS: FONT_STACKS, DEFAULT_TOKENS: DEFAULT_TOKENS, fontStack: fontStack
  };
})();

