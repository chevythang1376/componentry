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

  /* Optional call-to-action buttons. A blank label means the button simply
     isn't rendered — that's how every optional element in the library behaves,
     so "no button" needs no extra toggle. Pass any number; whichever have
     labels are emitted, and if none do the whole row disappears rather than
     leaving an empty flex container throwing off the spacing. */
  function actions(list, opts) {
    opts = opts || {};
    var live = (list || []).filter(function (b) { return b && b.text; });
    if (!live.length) return '';
    return '<div class="cb-actions' + (opts.align ? ' cb-actions--' + opts.align : '') +
      (opts.tight ? ' cb-actions--tight' : '') +
      (opts.cls ? ' ' + opts.cls : '') + '">' +
      live.map(function (b, i) {
        // First labelled button is the primary unless told otherwise, so
        // filling in only the second field still yields a solid button.
        var variant = b.variant || (i === 0 ? 'primary' : 'ghost');
        return '<a class="cb-btn cb-btn--' + variant + '" href="' + url(b.url) + '">' +
          esc(b.text) + '</a>';
      }).join('') +
      '</div>';
  }

  /* Field pair for a section-level CTA, spread into a component's props. */
  function ctaFields(opts) {
    opts = opts || {};
    return [
      { k: 'btnText', t: 'text', label: 'Button label', value: opts.text || '',
        help: opts.help || 'Leave empty for no button.' },
      { k: 'btnUrl', t: 'text', label: 'Button link', value: opts.url || '#' }
    ];
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

  /* Light-on-dark text has to state its colour, not inherit it.
     Themes very commonly ship `h2 { color: #111 !important }` (Elementor, Divi
     and most "fix my theme" snippets do). On a block with its own dark
     background that inheritance loss is catastrophic — a black title inside a
     black box — so these declarations are defended. Everything else is left
     overridable on purpose; this is only used where failure hides content.

     The block's own colour props still win, because changing one regenerates
     this rule. */
  function pin(selectors, color) {
    return selectors.join(',\n') + ' { color: ' + color + ' !important; }';
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
    scale: 100,

    /* Buttons. Defaults reproduce what was previously hard-coded — the old
       radius was calc(var(--cb-radius) * .72), which is 10px at radius 14 —
       so existing projects look unchanged until these are touched. */
    btnRadius: 10,
    btnPill: false,
    btnSize: 'md',
    btnWeight: 650,
    btnUpper: false,
    btnTracking: 0,
    btnBorder: 2,
    btnHover: 'lift',
    btnShadow: true
  };

  var BTN_SIZES = {
    sm: { py: '.58em', px: '1.1em', fs: '.92em' },
    md: { py: '.78em', px: '1.5em', fs: '1em' },
    lg: { py: '.95em', px: '1.9em', fs: '1.06em' }
  };

  /* Pull the family name out of a Google Fonts (or similar) URL, so choosing
     the imported font is one dropdown rather than hand-typing a stack.
     ...css2?family=Open+Sans:ital,wght@0,300..800  ->  Open Sans */
  function familyFromImport(url) {
    var m = String(url || '').match(/[?&]family=([^:&]+)/);
    if (!m) return '';
    try { return decodeURIComponent(m[1]).replace(/\+/g, ' ').trim(); }
    catch (e) { return m[1].replace(/\+/g, ' ').trim(); }
  }

  function fontStack(t) {
    if (t.font === 'import') {
      var fam = familyFromImport(t.fontImport);
      return fam ? '"' + fam + '", ' + FONT_STACKS.system : FONT_STACKS.system;
    }
    if (t.font === 'custom') return t.fontCustom || FONT_STACKS.system;
    return FONT_STACKS[t.font] || FONT_STACKS.system;
  }

  function btnSize(t) { return BTN_SIZES[t.btnSize] || BTN_SIZES.md; }

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

        --cb-btn-radius: ${t.btnPill ? '999px' : num(t.btnRadius, 10) + 'px'};
        --cb-btn-py: ${btnSize(t).py};
        --cb-btn-px: ${btnSize(t).px};
        --cb-btn-fs: ${btnSize(t).fs};
        --cb-btn-weight: ${num(t.btnWeight, 650)};
        --cb-btn-transform: ${t.btnUpper ? 'uppercase' : 'none'};
        --cb-btn-tracking: ${(num(t.btnTracking, 0) / 100).toFixed(3)}em;
        --cb-btn-border: ${num(t.btnBorder, 2)}px;
        --cb-btn-lift: ${t.btnHover === 'lift' ? '-2px' : '0px'};
        --cb-btn-filter: ${t.btnHover === 'darken' ? 'brightness(.9)' : 'none'};
        --cb-btn-shadow: ${t.btnShadow ? '0 6px 18px -6px var(--cb-brand)' : 'none'};
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
        /* Themes style bare section/article elements for their own layout.
           Without these the block inherits the theme's border and side padding.
           Each component re-declares what it needs at higher specificity. */
        background: none;
        border: 0;
        padding: 0;
        box-shadow: none;
        float: none;
        /* A theme that positions the block would lift it into the same paint
           layer as a fixed header and let it scroll over the top. */
        position: static;
        z-index: auto;
      }
      /* The big one: a theme rule such as header { background: #000 } for the
         site masthead paints a black box behind any heading block that uses
         a header element. Same story for figure/article/aside.
         Component rules are class-based, so they still win over this. */
      ${s} header, ${s} footer, ${s} nav, ${s} aside, ${s} article,
      ${s} section, ${s} figure, ${s} figcaption, ${s} main, ${s} hgroup {
        background: none;
        border: 0;
        padding: 0;
        margin: 0;
        box-shadow: none;
        display: block;
        text-align: inherit;
        float: none;
        width: auto;
        min-height: 0;
        position: static;
        z-index: auto;
      }
      /* Heading wrappers are the one place a host background is always wrong:
         a masthead rule like header{background:#000!important} paints a black
         box behind the block's title, and no plain-specificity reset can beat
         it. These elements never carry a background of their own, so forcing
         them is safe — unlike article/figure, which components do style. */
      ${s} [class*="__head"] {
        background: none !important;
        border: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
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
        /* Themes routinely do h2 { position: relative; z-index: 2 } to hang a
           decorative underline off a heading. Left alone, that promotes just
           that heading above a fixed site header while its siblings scroll
           under correctly — the confusing half-broken case. Components that
           genuinely need a positioned heading set it on their own class, which
           out-ranks this. */
        position: static; z-index: auto;
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
      /* Every button in every component reads from these, so the Buttons
         section of the design tokens restyles the whole project at once. */
      ${s} .cb-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: .5em;
        padding: var(--cb-btn-py) var(--cb-btn-px);
        border-radius: var(--cb-btn-radius);
        font-size: var(--cb-btn-fs);
        font-weight: var(--cb-btn-weight);
        text-transform: var(--cb-btn-transform);
        letter-spacing: var(--cb-btn-tracking);
        line-height: 1.2; text-decoration: none; cursor: pointer;
        transition: transform .18s ease, box-shadow .18s ease,
                    background-color .18s ease, filter .18s ease;
      }
      ${s} .cb-btn:hover {
        transform: translateY(var(--cb-btn-lift));
        filter: var(--cb-btn-filter);
      }
      ${s} .cb-btn:focus-visible, ${s} [class*="cb-"]:focus-visible {
        outline: 3px solid var(--cb-brand); outline-offset: 3px;
      }
      /* A solid button paints its own background, so losing its stated text
         colour is the same failure as a black title in a black box — and an
         !important link colour is one of the most common theme rules there
         is. Defended for the same reason pin() exists. */
      ${s} .cb-btn--primary {
        background: var(--cb-brand); color: var(--cb-on-brand) !important;
        box-shadow: var(--cb-btn-shadow);
      }
      ${s} .cb-btn--ghost { border: var(--cb-btn-border) solid currentColor; }
      /* Shared CTA row. Only ever present when a button label was filled in,
         so its margin never adds phantom space to a button-less block.

         Deliberately a block, not a flex row. Buttons are inline-level, so
         they follow the container's own text-align — which means a button
         dropped into a right-aligned timeline card, or a centred quote, lands
         correctly without the component having to restate the alignment. A
         flex row can't do that: flex containers ignore text-align, so every
         placement would have to pass its alignment down by hand and would
         silently go wrong the moment the surrounding alignment changed.

         The margin is split between row and button so wrapped lines keep an
         even rhythm: 12 + 10 = the 22px the row sits below its content. */
      ${s} .cb-actions { margin-top: 12px; }
      /* Several item containers are flex columns with their own align-items.
         Without this the row would be shrink-wrapped and positioned by the
         flex axis, so text-align would never get a say. Stretching hands
         alignment back to text-align in every context. */
      ${s} .cb-actions { align-self: stretch; }
      ${s} .cb-actions .cb-btn { margin-top: 10px; }
      ${s} .cb-actions .cb-btn + .cb-btn { margin-left: 12px; }
      ${s} .cb-actions--center { text-align: center; }
      ${s} .cb-actions--end { text-align: right; }
      /* Inside a repeating item — a card, a milestone, an answer panel — the
         button sits closer than it would at the foot of a whole section. */
      ${s} .cb-actions--tight { margin-top: 4px; }
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

  /* Controls every component gets for free. Appended at registration and
     applied centrally in build(), so a component's render() never deals with
     them and they can't drift apart between the 18 definitions. */
  var ADVANCED = [
    { t: 'section', label: 'Advanced' },
    {
      k: '_anchor', t: 'text', label: 'Anchor ID', value: '', ph: 'our-services',
      help: 'Adds an id to the block so you can link straight to it with #our-services.'
    },
    {
      k: '_class', t: 'text', label: 'Extra CSS class', value: '', ph: 'theme-dark-section',
      help: 'Added alongside the generated class so your theme can target this block.'
    },
    {
      k: '_heading', t: 'select', label: 'Heading level', value: '2',
      options: [['2', 'H2 — top-level section'], ['3', 'H3 — nested'], ['4', 'H4 — deeply nested']],
      help: 'Drop to H3/H4 when the block sits beneath an existing heading, so the page outline stays valid.'
    },
    {
      k: '_maxWidth', t: 'range', label: 'Content width', min: 0, max: 1600, step: 20, unit: 'px',
      value: 0, auto: 0, help: 'Overrides the project token for this block only.'
    },
    { k: '_padTop', t: 'range', label: 'Top padding', min: -4, max: 200, step: 4, unit: 'px', value: -4, auto: -4 },
    { k: '_padBottom', t: 'range', label: 'Bottom padding', min: -4, max: 200, step: 4, unit: 'px', value: -4, auto: -4 },
    {
      k: '_hide', t: 'select', label: 'Visibility', value: 'all',
      options: [['all', 'Always visible'], ['mobile', 'Hide on mobile (≤640px)'], ['desktop', 'Hide on desktop (>640px)']]
    },
    {
      k: '_reveal', t: 'select', label: 'Reveal on scroll', value: 'none',
      options: [['none', 'None'], ['fade', 'Fade in'], ['up', 'Fade up'], ['scale', 'Scale in']],
      help: 'Pure CSS — no JavaScript, so it still runs where an editor strips <script>. ' +
            'If your site has a fixed or sticky header, give it a z-index of 1 or more, ' +
            'or an animated block will scroll over it: animating puts this block in the ' +
            'same paint layer as the header, and the later element wins.'
    }
  ];

  function register(def) {
    def.props = (def.props || []).concat(ADVANCED);
    defs.set(def.id, def);
    order.push(def.id);
  }

  /* ------------------------------------------------- advanced post-process */

  /* Shift every heading in the block by the same delta, so the internal
     hierarchy (section h2 > item h3) is preserved as it moves down the page. */
  function shiftHeadings(html, delta) {
    if (!delta) return html;
    return html.replace(/<(\/?)h([1-6])\b/gi, function (m, slash, n) {
      return '<' + slash + 'h' + Math.min(6, Math.max(1, parseInt(n, 10) + delta));
    });
  }

  function patchRoot(html, anchor, extraClass) {
    if (!anchor && !extraClass) return html;
    return html.replace(/^(\s*<)([a-zA-Z0-9]+)([^>]*?)(\s*\/?)>/, function (m, lt, tag, attrs, tail) {
      if (anchor && !/\sid\s*=/.test(attrs)) attrs += ' id="' + attr(anchor) + '"';
      if (extraClass) {
        attrs = /\sclass\s*=\s*"/.test(attrs)
          ? attrs.replace(/(\sclass\s*=\s*")([^"]*)(")/, '$1$2 ' + attr(extraClass) + '$3')
          : attrs + ' class="' + attr(extraClass) + '"';
      }
      return lt + tag + attrs + tail + '>';
    });
  }

  /* Build a selector from the root's full class list so overrides match the
     component's own specificity and win on source order — no !important. */
  function rootSelector(html, fallback) {
    var m = html.match(/^\s*<[a-zA-Z0-9]+[^>]*?\sclass\s*=\s*"([^"]+)"/);
    if (!m) return fallback;
    return '.' + m[1].trim().split(/\s+/).join('.');
  }

  /* Scroll reveal, in pure CSS via a view() timeline — no JavaScript, so it
     survives the sanitisers that strip <script> and leave JS-driven blocks
     inert. Scroll timelines sit around 85% support, so this is layered as a
     pure enhancement: the block renders visible by default and only animates
     where timelines exist *and* the visitor hasn't asked for reduced motion.
     Strip the animation-timeline declaration and nothing is hidden. */
  function revealCss(sel, cls, p) {
    var from = {
      fade: 'opacity: 0;',
      up: 'opacity: 0; transform: translateY(28px);',
      scale: 'opacity: 0; transform: scale(.94);'
    }[p._reveal];
    if (!from) return '';

    var name = 'cb-reveal-' + cls;
    return dedent(`
      @keyframes ${name} {
        from { ${from} }
        to { opacity: 1; transform: none; }
      }
      @supports (animation-timeline: view()) {
        @media (prefers-reduced-motion: no-preference) {
          ${sel} {
            animation: ${name} linear both;
            animation-timeline: view();
            animation-range: entry 0% entry 75%;
          }
        }
      }`);
  }

  function advancedCss(sel, s, p) {
    var out = [];
    var pt = num(p._padTop, -4), pb = num(p._padBottom, -4), mw = num(p._maxWidth, 0);
    var box = [];
    if (pt >= 0) box.push('padding-top: ' + pt + 'px');
    if (pb >= 0) box.push('padding-bottom: ' + pb + 'px');
    if (box.length) out.push(sel + ' { ' + box.join('; ') + '; }');
    if (mw > 0) out.push(s + ' .cb-wrap { max-width: ' + mw + 'px; }');
    if (p._hide === 'mobile') out.push('@media (max-width: 640px) { ' + sel + ' { display: none !important; } }');
    if (p._hide === 'desktop') out.push('@media (min-width: 641px) { ' + sel + ' { display: none !important; } }');

    var reveal = revealCss(sel, s.replace(/^\./, ''), p);
    if (reveal) out.push(reveal);

    return out.length ? '\n/* Advanced overrides */\n' + out.join('\n') : '';
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
      rgba: rgba, ph: ph, uid: uid, wrap: wrap, dedent: dedent, indent: indent, pin: pin,
      actions: actions
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

    var html = (out.html || '').trim();
    html = shiftHeadings(html, clamp(num(p._heading, 2), 2, 4) - 2);
    html = patchRoot(html, (p._anchor || '').trim().replace(/\s+/g, '-'), (p._class || '').trim());

    var sel = rootSelector(html, s);

    return {
      html: html,
      css: [tokenCss(s, tokens), baseCss(s), dedent(out.css || ''), advancedCss(sel, s, p)]
             .filter(function (x) { return x && x.trim(); }).join('\n\n').trim(),
      js: (out.js || '').trim()
    };
  }

  return {
    register: register, get: get, all: all, defaults: defaults, build: build,
    esc: esc, attr: attr, rich: rich, url: url, uid: uid, num: num, clamp: clamp,
    rgba: rgba, ph: ph, wrap: wrap, indent: indent, dedent: dedent,
    actions: actions, ctaFields: ctaFields,
    tokenCss: tokenCss, baseCss: baseCss,
    FONT_STACKS: FONT_STACKS, DEFAULT_TOKENS: DEFAULT_TOKENS, fontStack: fontStack,
    familyFromImport: familyFromImport
  };
})();

