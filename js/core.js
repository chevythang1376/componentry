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

  /* Ink that is actually readable on an arbitrary background.

     Compares real WCAG contrast for each candidate and returns the better one,
     rather than testing luminance against a threshold. A threshold gets the
     obvious cases right and the boundary wrong: #4A8C3E reads as "dark enough
     for white text" and lands at 4.11:1, when near-black on the same green
     gives 4.55:1 and passes. The colours here are user-chosen, so the boundary
     is not a rare case. */
  function relLum(hex) {
    var h = String(hex || '').trim().replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    var n = parseInt(h, 16);
    var ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  }
  function contrast(a, b) {
    var x = relLum(a), y = relLum(b);
    if (x === null || y === null) return 0;
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  /* The dark counterpart of the five neutrals. Everything else — brand, button
     styling, the whole type scale — is deliberately untouched: a scheme changes
     the surface a design sits on, not the design. */
  var DARK_NEUTRALS = {
    ink: '#f3efeb',
    muted: '#9c9289',
    surface: '#1a1714',
    subtle: '#121010',
    border: '#2f2a25'
  };
  var NEUTRAL_KEYS = ['ink', 'muted', 'surface', 'subtle', 'border'];

  /* The two grounds a block sits on, as opposed to the surfaces inside it.
     `page` is the plain one and `band` the tinted alternate, and the
     relationship inverts between schemes on purpose: in light the tint is
     slightly darker than the page, in dark it has to be slightly lighter or it
     disappears into it. */
  var GROUNDS = {
    light: { page: '#ffffff', band: '#f7f4f1' },
    dark: { page: '#121010', band: '#1a1714' }
  };

  /* How a block decides its own background. Shared so all 23 that have one
     offer the same choice rather than each inventing wording. */
  var BG_MODES = [
    ['page', 'Follow the colour scheme'],
    ['band', 'Follow the scheme, tinted'],
    ['deep', 'Always dark'],
    ['custom', 'A colour I pick']
  ];

  /* The CSS value for a block's background. Anything but `custom` resolves to a
     token, which is what lets one scheme setting reach every block. */
  function bgValue(p) {
    var mode = p && p.bgMode;
    if (mode === 'band') return 'var(--cb-band, #f7f4f1)';
    if (mode === 'deep') return 'var(--cb-deep, #141210)';
    if (mode === 'page') return 'var(--cb-page, #ffffff)';
    return (p && p.bg) || 'var(--cb-page, #ffffff)';
  }

  /* The five neutrals for a scheme. 'light' returns whatever the project has
     set; 'dark' returns the dark counterparts. Anything else is treated as
     light, so an unknown value can never produce a half-applied scheme. */
  function neutrals(t, scheme) {
    var out = {};
    NEUTRAL_KEYS.forEach(function (k) {
      out[k] = scheme === 'dark' ? DARK_NEUTRALS[k] : t[k];
    });
    return out;
  }

  /* The project scheme can now be a swap, and a swap is two schemes rather than
     one. Everything that has to name a single scheme — the tokens on the shared
     scope, the neutrals a colour picker is editing — wants the one it *starts*
     in, so that a page at rest at the top is in a defined state and not halfway
     through something. The swap itself is emitted per block, where the ground is
     actually known. */
  function baseScheme(v) {
    if (v === 'swapDark') return 'light';
    if (v === 'swapLight') return 'dark';
    return v === 'dark' ? 'dark' : 'light';
  }
  function isSwap(v) { return v === 'swapDark' || v === 'swapLight'; }

  /* True once the "text on dark bands" colour is something other than the white
     every block already hard-codes as its fallback. */
  function customOnDark(t) {
    var v = String(t.inkOnDark || '').trim().toLowerCase();
    return !!v && v !== '#ffffff' && v !== '#fff' && v !== 'white';
  }

  /* A brand colour is chosen to be seen, not to be read at 12px.

     Southwire's copper sits at 4.33:1 on the tinted band and 3.76:1 on a dark
     surface — fine for a heading, which WCAG allows 3:1, and short of the 4.5:1
     that small text needs. That is not a fault in the colour; it is what brand
     colours are for. It is a fault in using one as body ink without adjusting
     it, and it accounted for every one of the 41 contrast failures in the
     library.

     So the accent is nudged along its own lightness until it conforms, keeping
     hue and saturation, which is what keeps it recognisably the brand rather
     than a different colour that happens to pass. Where it already conforms,
     nothing moves at all. */
  function hexToHsl(hex) {
    var h = String(hex || '').trim().replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    var n = parseInt(h, 16);
    var r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    var l = (mx + mn) / 2, s = 0, hue = 0;
    if (d) {
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      hue = mx === r ? ((g - b) / d + (g < b ? 6 : 0))
          : mx === g ? ((b - r) / d + 2)
          : ((r - g) / d + 4);
      hue *= 60;
    }
    return { h: hue, s: s, l: l };
  }

  function hslToHex(o) {
    var h = ((o.h % 360) + 360) % 360 / 360, s = clamp(o.s, 0, 1), l = clamp(o.l, 0, 1);
    function hue(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    var rgb = s === 0 ? [l, l, l] : [hue(p, q, h + 1 / 3), hue(p, q, h), hue(p, q, h - 1 / 3)];
    return '#' + rgb.map(function (v) {
      var x = Math.round(v * 255).toString(16);
      return x.length === 1 ? '0' + x : x;
    }).join('');
  }

  function toContrast(hex, bgHex, target) {
    var base = hexToHsl(hex);
    if (!base || relLum(bgHex) === null) return hex;
    if (contrast(hex, bgHex) >= target) return hex;

    // Move away from the background: lighten on a dark ground, darken on a
    // light one. Anything else is walking towards the problem.
    var up = relLum(bgHex) < 0.5;
    for (var i = 1; i <= 100; i++) {
      var candidate = hslToHex({ h: base.h, s: base.s, l: base.l + (up ? i : -i) / 100 });
      if (contrast(candidate, bgHex) >= target) return candidate;
    }
    // Nothing along that axis reaches it — take whichever end is furthest.
    return up ? '#ffffff' : '#000000';
  }

  function readableInk(bg, light, dark) {
    light = light || '#ffffff';
    dark = dark || '#141210';
    if (relLum(bg) === null) return light;
    return contrast(bg, light) >= contrast(bg, dark) ? light : dark;
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

  /* Recognises anything ph() produced, whatever size or colours it was given.
     Preflight uses it to stay quiet about a placeholder nobody has replaced:
     an image the user has not chosen yet cannot have alt text they meant. */
  var PH_MARK = encodeURIComponent('<linearGradient id="g"');
  function isPlaceholder(src) {
    return typeof src === 'string' &&
           src.indexOf('data:image/svg+xml,') === 0 &&
           src.indexOf(PH_MARK) > 0;
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
    inter: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
    grotesk: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
    serif: 'Georgia, "Times New Roman", "Iowan Old Style", serif',
    slab: '"Rockwell", "Courier Bold", Georgia, serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    rounded: '"Nunito", "Trebuchet MS", "Segoe UI", sans-serif'
  };

  /* Stacks that need a webfont to be what they claim. Selecting one of these is
     enough — the @import is emitted for you. That is the whole difference
     between `inter` and `grotesk`, whose identical stack only resolves to Inter
     if the visitor happens to have it installed already.

     400..800 is a variable range covering every weight the components ask for,
     500 through 800, so no browser has to synthesise a fake bold. */
  var FONT_IMPORTS = {
    inter: 'https://fonts.googleapis.com/css2?family=Inter:wght@400..800&display=swap'
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
    /* A surface that is dark in either scheme. A "dark tone" tile used to paint
       itself with --cb-ink, which is fine while ink is near-black and inverts
       the moment the scheme flips it light — the tile turning pale while its
       text stays pinned white. Kept separate so dark means dark either way. */
    deep: '#141210',
    /* Light or dark. Only the five neutrals move; brand, buttons and type stay
       exactly as set, because a scheme is about the surface under the design,
       not a different design. */
    scheme: 'light',
    /* Text on a surface the block paints dark itself — a colour band, a photo
       hero, a dark tile. Held apart from `ink` on purpose: those places are
       defended with !important so a host theme cannot black them out, and
       tying them to the body colour would mean a dark ink setting produced
       black text on a black band. */
    inkOnDark: '#ffffff',
    /* Headings follow the body colour until this is turned on. */
    hColorOn: false,
    hColor: '#141210',
    font: 'inter',
    fontImport: '',
    radius: 14,
    maxWidth: 1140,
    scale: 100,

    /* Buttons. Everything here except the radius reproduces what used to be
       hard-coded, so an old project looks unchanged until it is touched. The
       radius is the deliberate exception: it was calc(var(--cb-radius) * .72),
       or 10px, and is now a near-square 1px by choice. */
    btnRadius: 1,
    btnPill: false,
    btnSize: 'md',
    btnWeight: 650,
    btnUpper: false,
    btnTracking: 0,
    btnBorder: 2,
    btnHover: 'lift',
    btnShadow: true,

    /* Typography, expressed as adjustments rather than absolute values.
       Components do not all want the same numbers — a hero headline is set
       tighter than a card title on purpose — so replacing every literal with
       one shared token would quietly redesign half the library. Sizes take a
       multiplier and tracking takes a delta, which keeps each component's own
       proportions and only moves them together. Weight and line height have no
       sensible relative form, so those override outright and fall back to
       whatever the component already set.

       At 1 and 0 the output is identical to before any of this existed. */
    hScale: 1,        // headings
    hTrack: 0,        // in hundredths of an em
    hWeight: 0,       // 0 = leave each component's own weight alone
    hLeading: 0,      // 0 = leave alone
    bodyTrack: 0,
    bodyLeading: 0,
    eyebrowScale: 1,  // small uppercase labels
    eyebrowTrack: 0,
    eyebrowWeight: 0
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

  /* Every @import a project needs, in the order they have to be written. A
     custom import is still emitted when one is set but not selected — that has
     always been the behaviour, and the field's help text says so. */
  function fontImports(t) {
    var out = [];
    if (FONT_IMPORTS[t.font]) out.push(FONT_IMPORTS[t.font]);
    var custom = String(t.fontImport || '').trim();
    if (/^https?:\/\//i.test(custom) && out.indexOf(custom) < 0) out.push(custom);
    return out;
  }

  function btnSize(t) { return BTN_SIZES[t.btnSize] || BTN_SIZES.md; }

  /* Shared scope class, carried by every component root alongside its own
     generated class. It exists so the reset and the tokens can be stated once
     for a whole page instead of repeated per block — that block is ~7kB, and
     on a five-block page repeating it accounted for half the exported CSS.
     Deliberately not a short name like "cb": this lands in host pages that
     have their own class vocabulary. */
  var SCOPE = 'cb-scope';

  /* The reset and tokens, stated once against the shared scope. Emitted ahead
     of every component's own rules, which keeps source order — and therefore
     which rule wins — exactly as it is when each block carries its own copy. */
  function sharedCss(tokens) {
    return [tokenCss('.' + SCOPE, tokens), baseCss('.' + SCOPE)].join('\n\n').trim();
  }

  /* Tokens live ON the component wrapper, never on :root — so an export
     dropped into a WYSIWYG page cannot leak variables into the host site. */
  function tokenCss(s, t) {
    return dedent(`
      ${s} {
        --cb-brand: ${t.brand};
        --cb-brand-2: ${t.brand2};
        --cb-ink: ${neutrals(t, baseScheme(t.scheme)).ink};
        --cb-muted: ${neutrals(t, baseScheme(t.scheme)).muted};
        --cb-surface: ${neutrals(t, baseScheme(t.scheme)).surface};
        --cb-subtle: ${neutrals(t, baseScheme(t.scheme)).subtle};
        --cb-border: ${neutrals(t, baseScheme(t.scheme)).border};
        --cb-deep: ${t.deep || '#141210'};
        --cb-page: ${GROUNDS[baseScheme(t.scheme)].page};
        --cb-band: ${GROUNDS[baseScheme(t.scheme)].band};
        --cb-on-brand: ${t.onBrand};
        /* The accent, adjusted until small text on it conforms. Two of them,
           because a block sitting on the scheme's own ground and one painting
           its own dark surface are different problems — the same split the ink
           tokens already make. */
        --cb-brand-ink: ${toContrast(t.brand, GROUNDS[baseScheme(t.scheme)].band, 4.5)};
        --cb-brand-on-dark: ${toContrast(t.brand, t.deep || '#141210', 4.5)};
        /* Emitted only once this is moved off white, so that until it is, every
           block keeps the exact literal it was designed with. Those literals are
           not interchangeable — captions sit at .6, .7, .72 and .82 depending on
           what they sit on — and collapsing them onto one shared alpha changed
           the countdown labels the first time this was written. The muted
           partner is derived rather than asked for separately, so one control
           still keeps a caption and the title above it in the same family. */
        ${customOnDark(t) ? '--cb-on-dark: ' + t.inkOnDark + ';' : ''}
        ${customOnDark(t) ? '--cb-on-dark-muted: ' + rgba(t.inkOnDark, 0.72) + ';' : ''}
        ${t.hColorOn && t.hColor ? '--cb-h-color: ' + t.hColor + ';' : ''}
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

        /* Sizes multiply, tracking and leading add. Both are no-ops at the
           defaults, so each component's own type scale survives untouched until
           someone actually moves a slider: a hero headline stays tighter than a
           card title instead of being flattened to one shared value. */
        --cb-h-scale: ${num(t.hScale, 1)};
        --cb-h-track: ${(num(t.hTrack, 0) / 100).toFixed(3)}em;
        --cb-h-leading: ${(num(t.hLeading, 0) / 100).toFixed(2)};
        /* Body px sizes follow the same slider that sets --cb-fs, so text that
           happens to be clamped in px scales with the em text around it. */
        --cb-body-scale: ${(num(t.scale, 100) / 100).toFixed(3)};
        --cb-body-track: ${(num(t.bodyTrack, 0) / 100).toFixed(3)}em;
        --cb-body-leading: ${(num(t.bodyLeading, 0) / 100).toFixed(2)};
        --cb-eyebrow-scale: ${num(t.eyebrowScale, 1)};
        --cb-eyebrow-track: ${(num(t.eyebrowTrack, 0) / 100).toFixed(3)}em;
        ${num(t.hWeight, 0) ? '--cb-h-weight: ' + num(t.hWeight, 0) + ';' : ''}
        ${num(t.eyebrowWeight, 0) ? '--cb-eyebrow-weight: ' + num(t.eyebrowWeight, 0) + ';' : ''}
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
        line-height: calc(1.6 + var(--cb-body-leading, 0));
        letter-spacing: var(--cb-body-track, 0em);
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
      /* Headings take their own colour once one is set, and inherit exactly as
         before when it is not. Same specificity as the reset above and written
         after it, so source order decides; and lower than any component class,
         so a block that paints its own dark surface still wins — setting a
         heading colour must not put dark text on a dark band. */
      ${s} h1, ${s} h2, ${s} h3, ${s} h4, ${s} h5, ${s} h6 {
        color: var(--cb-h-color, inherit);
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
    {
      k: '_scheme', t: 'select', label: 'Colour scheme', value: 'inherit',
      options: [
        ['inherit', 'Follow the project'], ['light', 'Light'], ['dark', 'Dark'],
        ['swapDark', 'Swap to dark on scroll'], ['swapLight', 'Swap to light on scroll']
      ],
      help: 'Following the project includes following it into a scroll swap, so ' +
            'setting the swap once under Colour scheme carries every block. Light ' +
            'or Dark here pins this block instead, and it will sit still while the ' +
            'rest of the page changes around it. In a swap the ground fades and the ' +
            'text switches once, near the middle: fading both would pass through ' +
            'grey text on a grey ground, which is unreadable at about 1:1.'
    },
    {
      k: '_textOn', t: 'toggle', label: 'Override text colour', value: false,
      help: 'Sets the body and heading colour for this block only. A block that ' +
            'paints its own dark surface keeps its defended colour, so this cannot ' +
            'put dark text on a dark band.'
    },
    { k: '_text', t: 'color', label: 'Text colour', value: '#141210', when: { _textOn: [true] } },
    {
      k: '_radius', t: 'range', label: 'Corner radius', min: -1, max: 40, step: 1, unit: 'px',
      value: -1, auto: -1,
      help: 'Overrides the project corner radius for this block only. Everything inside ' +
            'that is proportional to it follows, so the block stays internally consistent. ' +
            'Circles and pills keep their shape.'
    },
    { k: '_padTop', t: 'range', label: 'Top padding', min: -4, max: 200, step: 4, unit: 'px', value: -4, auto: -4 },
    { k: '_padBottom', t: 'range', label: 'Bottom padding', min: -4, max: 200, step: 4, unit: 'px', value: -4, auto: -4 },
    {
      k: '_hScale', t: 'range', label: 'Heading size', min: 0.6, max: 1.6, step: 0.05,
      unit: '\u00d7', value: 1,
      help: 'Multiplies the project heading size for this block only. 1\u00d7 leaves it alone.'
    },
    {
      k: '_hTrack', t: 'range', label: 'Heading letter spacing', min: -6, max: 10, step: 1,
      unit: '/100em', value: 0, help: 'Added on top of the project value.'
    },
    {
      k: '_bodyScale', t: 'range', label: 'Body size', min: 0.8, max: 1.4, step: 0.05,
      unit: '\u00d7', value: 1
    },

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
  /* A block's own light/dark scheme, and the scroll-driven version of it.

     Both work by redeclaring the same five neutral tokens on the block root,
     which is all a scheme is — every component already reads them, so nothing
     needs per-component wiring.

     The scroll version is a *step*, not a fade, and that is not a shortcut. A
     light-to-dark crossfade is unreadable at its own midpoint by definition:
     interpolate the background white-to-black and the text black-to-white and
     they meet at grey on grey, about 1:1. Custom properties that have not been
     registered with @property animate discretely — both states change on the
     same frame at the midpoint of the range — so the swap never passes through
     a state you cannot read. Measured, not assumed.

     Wrapped in @supports so a browser without scroll timelines simply renders
     the end state rather than nothing. */
  function schemeCss(sel, cls, p, t) {
    /* "Follow the project" has to mean following it into a swap as well, or a
       project-level swap reaches only the blocks somebody remembered to set —
       and the ones left behind sit light against dark neighbours, which is the
       seam the whole design is trying to avoid. A block that names its own
       scheme still wins: an explicit Light or Dark is a decision to stay put,
       not an omission. */
    var mode = p._scheme;
    if (!mode || mode === 'inherit') mode = isSwap(t && t.scheme) ? t.scheme : '';
    if (!mode || mode === 'inherit') return '';

    /* The grounds go in alongside the neutrals. Without them a block set to
       dark on its own would flip its text and cards while its background kept
       whatever the project's page colour is — light text on a white ground,
       which is the whole failure this is meant to avoid. */
    function decls(scheme) {
      var n = neutrals(t || {}, scheme);
      var g = GROUNDS[scheme === 'dark' ? 'dark' : 'light'];
      return NEUTRAL_KEYS.map(function (k) {
        return '--cb-' + k + ': ' + n[k] + ';';
      }).concat([
        '--cb-page: ' + g.page + ';',
        '--cb-band: ' + g.band + ';',
        /* Derived from this scheme's own ground, so a block that swaps carries
           a conforming accent into the scheme it lands in. */
        '--cb-brand-ink: ' + toContrast((t || {}).brand || '#96694c', g.band, 4.5) + ';'
      ]).join(' ');
    }

    if (mode === 'light' || mode === 'dark') {
      return sel + ' { ' + decls(mode) + ' }';
    }

    var to = mode === 'swapLight' ? 'light' : 'dark';
    var from = to === 'dark' ? 'light' : 'dark';
    var name = 'cb-scheme-' + cls;

    /* The ground this block paints in each scheme. Only page and band follow the
       scheme; a colour somebody picked, or an always-dark block, keeps what it
       has and only its text moves. */
    function ground(scheme) {
      if (p.bgMode === 'custom') return p.bg || GROUNDS[scheme].page;
      if (p.bgMode === 'deep') return (t && t.deep) || '#141210';
      return GROUNDS[scheme][p.bgMode === 'band' ? 'band' : 'page'];
    }

    /* Two things happen across one timeline, at deliberately different rates,
       so they are two animations rather than one.

       The ground *fades*, because background-color is a real animatable
       property and interpolates without needing @property. The text *steps*,
       because unregistered custom properties change discretely — and that is
       what keeps the transition readable. Fading both is what is unreadable: a
       white-to-black ground under black-to-white text meets at grey on grey,
       around 1:1.

       They are split because the ground wants easing across the whole fade and
       the text does not. A timing function applies to each keyframe segment
       individually, so easing one four-keyframe animation would put an S-curve
       either side of the step instead of one across the transition. Two
       animations on one timeline give the ground a single eased ramp — soft at
       both ends, so you never catch it starting or stopping. */
    var STEP = 54.5;
    return dedent(`
      ${sel} { ${decls(from)} }
      @keyframes ${name}-ground {
        from { background-color: ${ground(from)}; }
        to { background-color: ${ground(to)}; }
      }
      @keyframes ${name}-ink {
        from { ${decls(from)} }
        ${STEP - 0.1}% { ${decls(from)} }
        ${STEP}% { ${decls(to)} }
        to { ${decls(to)} }
      }
      /* scroll(root), not view(): every block set to swap then shares the page's
         scroll progress and moves in lockstep. On a per-element timeline each
         block crosses at its own moment, so a dark block sits against a light
         one and you see the seam between them — which is the thing that read as
         unfinished.

         The range is measured in viewport heights, not in percent of the page.
         A percentage stretches the transition over the whole document, so the
         same setting is a brisk change on a short page and an imperceptible
         drift on a long one — the block is never quite either colour, which
         reads as a wrong colour rather than as a transition. Sixty vh of travel
         is about two thirds of a screen: long enough to feel deliberate,
         short enough to finish while you are still looking at it. */
      @supports (animation-timeline: scroll()) {
        ${sel} {
          animation: ${name}-ground ease-in-out both, ${name}-ink linear both;
          animation-timeline: scroll(root), scroll(root);
          animation-range: 10vh 70vh, 10vh 70vh;
        }
      }`);
  }

  /* Components that have been replaced by a better shape rather than removed.
     A saved project names its blocks by id, so retiring an id silently empties
     somebody's canvas — and "it opened blank" is the least debuggable bug
     there is. Each entry says how to carry the old props across.

     Compare Table became a use of Table. Its cells lived in fixed v1..v4
     fields, which is exactly why it could only ever hold four columns; the
     general table stores real cell arrays and has no such limit. */
  var MIGRATIONS = {
    'compare-table': function (p) {
      p = p || {};
      var products = (p.products || []).filter(function (x) { return x && x.name; });
      var columns = [{
        label: 'Attribute', tagline: '', badge: '', featured: false,
        image: '', alt: '', btnText: '', btnUrl: '#'
      }].concat(products.map(function (pr) {
        return {
          label: pr.name || '', tagline: pr.tagline || '', badge: pr.badge || '',
          featured: !!pr.featured, image: pr.image || '', alt: pr.alt || '',
          btnText: pr.btnText || '', btnUrl: pr.btnUrl || '#'
        };
      }));
      var keys = ['v1', 'v2', 'v3', 'v4'].slice(0, products.length);
      var rows = (p.rows || []).map(function (r) {
        return {
          group: r.group || '',
          cells: [r.label || ''].concat(keys.map(function (k) { return r[k] == null ? '' : r[k]; }))
        };
      });
      return {
        type: 'table',
        props: {
          eyebrow: p.eyebrow || '', title: p.title || '', sub: p.sub || '',
          columns: columns, rows: rows,
          rowHeader: true, marks: true,
          differences: p.differences !== false,
          align: 'auto',
          zebra: p.zebra !== false,
          showImages: !!p.showImages,
          bgMode: p.bgMode || 'page', bg: p.bg || '#ffffff',
          pad: p.pad == null ? 72 : p.pad
        }
      };
    }
  };

  /* Applied wherever a project comes in from outside this session — restored
     from storage, opened from a file, or pasted back in as code. */
  function migrate(instances) {
    return (instances || []).map(function (inst) {
      var fn = inst && MIGRATIONS[inst.type];
      if (!fn) return inst;
      var next = fn(inst.props);
      return {
        uid: inst.uid, cls: inst.cls,
        type: next.type,
        props: next.props
      };
    });
  }

  /* The one thing an export deliberately will not do for you.

     A block paints itself and stops there, because reaching up to body or
     :root is precisely what makes a pasted component wreck the page around it.
     The cost of that rule is that the page's own ground never moves: set the
     project dark and you still get white down both sides of a centred content
     column, white below the last block, and white in the overscroll at either
     end. On a scroll swap it is worse, because the page is then the one thing
     standing still while everything on it changes.

     So this is emitted separately and installed deliberately — pasted into a
     theme's own CSS by someone who means it — rather than smuggled into a
     block where it would be a bug. Same grounds, same range, so the page and
     the blocks move together.

     What it cannot do is restyle the theme's header and footer. Their text
     keeps whatever colour the theme gave it, which is why the selector is
     yours to set: scoping this to one page's body class is usually right, and
     darkening a whole site from here usually is not. */
  function pageCss(t, opts) {
    opts = opts || {};
    var sel = safeSelector(opts.selector) || 'body';
    var scheme = (t && t.scheme) || 'light';
    var start = GROUNDS[baseScheme(scheme)].page;

    if (!isSwap(scheme)) {
      return sel + ' { background-color: ' + start + '; }';
    }

    var end = GROUNDS[scheme === 'swapDark' ? 'dark' : 'light'].page;
    return dedent(`
      ${sel} { background-color: ${start}; }
      @keyframes cb-page-swap {
        from { background-color: ${start}; }
        to { background-color: ${end}; }
      }
      @supports (animation-timeline: scroll()) {
        ${sel} {
          animation: cb-page-swap ease-in-out both;
          animation-timeline: scroll(root);
          animation-range: 10vh 70vh;
        }
      }`);
  }

  /* A selector typed by hand lands inside a rule this file writes, so it is
     checked rather than trusted: anything that could close the block and start
     emitting declarations of its own is refused outright, and the caller falls
     back to body. Not a security boundary — it is the author's own project —
     but a typo that silently produced broken CSS would be blamed on the
     export. */
  function safeSelector(s) {
    s = String(s == null ? '' : s).trim();
    if (!s) return '';
    if (!/^[A-Za-z0-9_\-.#>, [\]="':()]+$/.test(s)) return '';
    if (/[{};@\\]|\/\*/.test(s)) return '';
    return s;
  }

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

  function advancedCss(sel, s, p, tokens) {
    var out = [];
    tokens = tokens || {};
    var pt = num(p._padTop, -4), pb = num(p._padBottom, -4), mw = num(p._maxWidth, 0);
    var box = [];
    if (pt >= 0) box.push('padding-top: ' + pt + 'px');
    if (pb >= 0) box.push('padding-bottom: ' + pb + 'px');
    if (box.length) out.push(sel + ' { ' + box.join('; ') + '; }');
    if (mw > 0) out.push(s + ' .cb-wrap { max-width: ' + mw + 'px; }');
    if (p._hide === 'mobile') out.push('@media (max-width: 640px) { ' + sel + ' { display: none !important; } }');
    if (p._hide === 'desktop') out.push('@media (min-width: 641px) { ' + sel + ' { display: none !important; } }');

    /* Per-block type. These compose with the project values instead of
       replacing them, so 1x and 0 always mean "same as the rest of the page"
       and there is no sentinel to explain. Redeclaring the tokens on the block
       root is enough: every component already reads them, so nothing needs
       per-component wiring. */
    var hs = num(p._hScale, 1), ht = num(p._hTrack, 0), bs = num(p._bodyScale, 1);
    var typ = [];
    /* Redeclaring the token is enough for corners: nothing rounded is written as
       a bare pixel value, it is either var(--cb-radius) or a multiple of it, so
       the whole block rescales together. Circles and pills are 50% and 999px and
       are deliberately left out of that. */
    var rad = num(p._radius, -1);
    if (rad >= 0) typ.push('--cb-radius: ' + rad + 'px');
    /* Both, so the block's headings move with its body rather than splitting
       off onto the project's heading colour. */
    if (p._textOn && p._text) {
      typ.push('--cb-ink: ' + p._text);
      typ.push('--cb-h-color: ' + p._text);
    }
    if (hs !== 1) typ.push('--cb-h-scale: ' + (num(tokens.hScale, 1) * hs).toFixed(3));
    if (ht) typ.push('--cb-h-track: ' + ((num(tokens.hTrack, 0) + ht) / 100).toFixed(3) + 'em');
    if (bs !== 1) {
      typ.push('--cb-fs: ' + (num(tokens.scale, 100) / 100 * 16 * bs).toFixed(2) + 'px');
      typ.push('--cb-body-scale: ' + (num(tokens.scale, 100) / 100 * bs).toFixed(3));
    }
    if (typ.length) out.push(sel + ' { ' + typ.join('; ') + '; }');


    var scheme = schemeCss(sel, s.replace(/^\./, ''), p, tokens);
    if (scheme) out.push(scheme);

    /* "Always dark" means the ground stops following the scheme — but until now
       the text did not stop with it. On a light project, choosing it gave every
       one of the twenty-two blocks that offer it black text on a black ground:
       1.00:1, invisible. It survived because every harness judged components at
       their defaults, and this is never the default.

       Fixing it once here rather than in twenty-two components is also the only
       way it stays fixed: a component that paints its own dark ground has to
       carry the dark neutrals with it, and that is a property of the ground, not
       of the block. Emitted after the scheme block so it wins — a ground that is
       dark whatever the scheme needs ink that is light whatever the scheme. */
    if (p.bgMode === 'deep' || p.bgMode === 'custom') {
      var ground = p.bgMode === 'deep' ? (tokens.deep || '#141210') : (p.bg || '#ffffff');

      /* Which neutrals belong on this ground, decided by measuring both rather
         than by a luminance threshold — the same reasoning readableInk() uses,
         and for the same reason: thresholds get the obvious cases right and the
         boundary wrong, and a chosen colour is all boundary. */
      var useDark = contrast(DARK_NEUTRALS.ink, ground) > contrast(tokens.ink || '#141210', ground);
      var nn = neutrals(tokens, useDark ? 'dark' : 'light');

      out.push(sel + ' { ' + NEUTRAL_KEYS.map(function (k) {
        return '--cb-' + k + ': ' + nn[k] + ';';
      }).join(' ') +
        ' --cb-page: ' + ground + ';' +
        ' --cb-band: ' + ground + ';' +
        /* Derived against the hardest surface this block might put accent text
           on, not against the ground behind it. A block does not only paint one
           colour: a card sits on --cb-surface and a panel on --cb-subtle, and
           either can be the worse of the two. Deriving against the ground alone
           passed a white custom background and then failed on the panel inside
           it at 4.33:1. Whichever candidate gives the brand the least contrast
           is the one to satisfy — clear it and the rest come free. */
        ' --cb-brand-ink: ' + toContrast(tokens.brand || '#96694c',
          [ground, nn.surface, nn.subtle].reduce(function (worst, cand) {
            return contrast(tokens.brand || '#96694c', cand) < contrast(tokens.brand || '#96694c', worst)
              ? cand : worst;
          }, ground), 4.5) + '; }');
    }

    var reveal = revealCss(sel, s.replace(/^\./, ''), p);
    if (reveal) out.push(reveal);

    return out.length ? '\n/* Advanced overrides */\n' + out.join('\n') : '';
  }
  /* A slider that cannot change anything is just noise in the panel, and the
     Advanced section repeats on all 25 blocks. Build each component once and
     look at which type tokens its CSS actually reads, then offer only those.
     Logo Marquee, for instance, has a kicker and logos but no heading. */
  var tokenUseCache = new Map();
  function tokenUse(id) {
    if (tokenUseCache.has(id)) return tokenUseCache.get(id);
    var use = { h: true };
    var def = defs.get(id);
    if (def) {
      var css = '';
      try {
        css = build({ type: id, cls: 'cb-probe-' + id, props: defaults(def) },
                    DEFAULT_TOKENS, { omitBase: true }).css;
      } catch (e) { css = ''; }
      if (css) {
        use = { h: css.indexOf('--cb-h-') >= 0 };
      }
    }
    tokenUseCache.set(id, use);
    return use;
  }

  /* The schema the inspector should draw for one component. */
  function fields(def) {
    if (!def) return [];
    if (tokenUse(def.id).h) return def.props || [];
    return (def.props || []).filter(function (f) {
      return f.k !== '_hScale' && f.k !== '_hTrack';
    });
  }


  function get(id) { return defs.get(id); }
  function all() { return order.map(function (id) { return defs.get(id); }); }

  /* Walk a component's schema and collect default values. */
  /* The default value for one item of a list, built from the sub-field
     declarations rather than repeated in every entry of the list's own value. */
  function itemTemplate(f) {
    var tpl = {};
    (f.fields || []).forEach(function (sub) {
      if (sub.t !== 'section') tpl[sub.k] = sub.value;
    });
    return tpl;
  }

  function defaults(def) {
    var out = {};
    (def.props || []).forEach(function (f) {
      if (f.t === 'section') return;
      if (f.t === 'list') {
        /* Merged over the template so a list entry carries every field the
           schema declares, not only the ones written out in the literal. A
           field added to a list later is otherwise simply absent from every
           shipped item, and the panel then shows a toggle as off and a colour
           as blank while the component renders the default anyway — the control
           disagreeing with what you are looking at. */
        var tpl = itemTemplate(f);
        out[f.k] = JSON.parse(JSON.stringify(f.value || [])).map(function (item) {
          return Object.assign({}, tpl, item);
        });
        return;
      }
      out[f.k] = f.value;
    });
    return out;
  }

  /* Defaults merged under an instance's saved props, one level into lists as
     well as at the top. Called whenever an instance is edited, so a project
     saved before a field existed picks it up rather than carrying a hole. */
  function hydrate(def, props) {
    var out = Object.assign(defaults(def), props || {});

    /* A field added later can carry `legacy: { key, value }`, meaning: if the
       saved props already contain `key`, this field defaults to `value` instead
       of its own. Without it, adding a "follow the scheme" background mode that
       defaults to following would silently discard a background somebody had
       already chosen — the saved colour would still be there, just ignored.
       Only applies when the field is genuinely absent from the save. */
    if (props) {
      (def.props || []).forEach(function (f) {
        if (!f.legacy || f.k in props) return;
        if (f.legacy.key in props) out[f.k] = f.legacy.value;
      });
    }

    (def.props || []).forEach(function (f) {
      if (f.t !== 'list' || !Array.isArray(out[f.k])) return;
      var tpl = itemTemplate(f);
      out[f.k] = out[f.k].map(function (item) {
        return Object.assign({}, tpl, item);
      });
    });
    return out;
  }

  /* ------------------------------------------------------------- rendering */

  function build(instance, tokens, opts) {
    opts = opts || {};
    var def = get(instance.type);
    if (!def) return { html: '', css: '', js: '' };

    var cls = instance.cls;
    var s = '.' + cls;
    var ctx = {
      cls: cls, s: s, id: cls, tokens: tokens,
      esc: esc, attr: attr, rich: rich, url: url, num: num, clamp: clamp,
      rgba: rgba, ph: ph, uid: uid, wrap: wrap, dedent: dedent, indent: indent, pin: pin,
      bg: bgValue,
      readableInk: readableInk, contrast: contrast, toContrast: toContrast, relLum: relLum,
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
    /* Every root carries the shared scope class as well as its own, so the
       markup is byte-identical whether the reset is emitted per block or once
       for the page. Switching modes never means re-pasting the HTML. */
    html = patchRoot(html, (p._anchor || '').trim().replace(/\s+/g, '-'),
                     (SCOPE + ' ' + (p._class || '').trim()).trim());

    var sel = rootSelector(html, s);

    return {
      html: html,
      css: [opts.omitBase ? '' : tokenCss(s, tokens),
            opts.omitBase ? '' : baseCss(s),
            dedent(out.css || ''), advancedCss(sel, s, p, tokens)]
             .filter(function (x) { return x && x.trim(); }).join('\n\n').trim(),
      js: (out.js || '').trim()
    };
  }

  return {
    register: register, get: get, all: all, defaults: defaults, hydrate: hydrate, build: build,
    fields: fields,
    esc: esc, attr: attr, rich: rich, url: url, uid: uid, num: num, clamp: clamp,
    isPlaceholder: isPlaceholder,
    rgba: rgba, ph: ph, wrap: wrap, indent: indent, dedent: dedent,
    readableInk: readableInk, contrast: contrast, toContrast: toContrast, relLum: relLum,
    actions: actions, ctaFields: ctaFields,
    tokenCss: tokenCss, baseCss: baseCss, sharedCss: sharedCss, SCOPE: SCOPE,
    FONT_STACKS: FONT_STACKS, DEFAULT_TOKENS: DEFAULT_TOKENS, fontStack: fontStack,
    BG_MODES: BG_MODES, bgValue: bgValue,
    pageCss: pageCss, safeSelector: safeSelector,
    migrate: migrate, MIGRATIONS: MIGRATIONS,
    fontImports: fontImports,
    familyFromImport: familyFromImport
  };
})();

