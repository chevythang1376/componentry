/* ============================================================================
   Content blocks — cards, features, stats, timeline, pricing
   ========================================================================== */
(function () {
  'use strict';

  var CAT = 'Content';

  /* --------------------------------------------------------------------- */
  /* Card Grid                                                              */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'card-grid',
    name: 'Card Grid',
    category: CAT,
    icon: '▦',
    blurb: 'Responsive card deck. Uses the "one link, whole card clickable" pattern so text stays selectable and screen readers hear a single link.',
    props: [
      { t: 'section', label: 'Heading' },
      { k: 'title', t: 'text', label: 'Section title', value: 'From the journal' },
      { k: 'sub', t: 'textarea', label: 'Section intro', value: 'Notes on design systems, performance and the web platform.' },

      { t: 'section', label: 'Cards' },
      {
        k: 'items', t: 'list', label: 'Cards', itemLabel: 'title',
        fields: [
          { k: 'image', t: 'image', label: 'Image', value: CB.ph(800, 600, '', '#96694c', '#2b241f') },
          { k: 'alt', t: 'text', label: 'Alt text', value: '' },
          { k: 'tag', t: 'text', label: 'Tag / eyebrow', value: '' },
          { k: 'title', t: 'text', label: 'Title', value: 'Card title' },
          { k: 'text', t: 'textarea', label: 'Body copy', value: 'Short supporting sentence.' },
          { k: 'meta', t: 'text', label: 'Meta line', value: '' },
          { k: 'linkText', t: 'text', label: 'Link label', value: 'Read more' },
          { k: 'linkUrl', t: 'url', label: 'Link URL', value: '#' }
        ],
        value: [
          { image: CB.ph(800, 600, '', '#96694c', '#2b241f'), alt: '', tag: 'Performance', title: 'Why your hero image is the whole story', text: 'Largest Contentful Paint is usually one element. Here is how to find it and fix it.', meta: '6 min read', linkText: 'Read more', linkUrl: '#' },
          { image: CB.ph(800, 600, '', '#6f4c37', '#141210'), alt: '', tag: 'Accessibility', title: 'Accordions that survive a keyboard audit', text: 'Roles, focus order and the animation trick that does not break screen readers.', meta: '9 min read', linkText: 'Read more', linkUrl: '#' },
          { image: CB.ph(800, 600, '', '#2b241f', '#4a443e'), alt: '', tag: 'CSS', title: 'Scoping styles without a build step', text: 'Custom properties, generated classes, and staying out of the host theme’s way.', meta: '4 min read', linkText: 'Read more', linkUrl: '#' }
        ]
      },

      { t: 'section', label: 'Layout' },
      { k: 'cols', t: 'range', label: 'Columns (desktop)', min: 1, max: 4, step: 1, value: 3 },
      { k: 'gap', t: 'range', label: 'Gap', min: 8, max: 48, step: 4, unit: 'px', value: 24 },
      { k: 'ratio', t: 'select', label: 'Image ratio', value: '4/3', options: [['16/9', '16 : 9'], ['4/3', '4 : 3'], ['1/1', 'Square'], ['3/2', '3 : 2'], ['none', 'No image']] },

      { t: 'section', label: 'Style' },
      { k: 'variant', t: 'select', label: 'Card style', value: 'elevated', options: [['elevated', 'Elevated'], ['outline', 'Outlined'], ['flat', 'Flat / borderless'], ['overlay', 'Text over image']] },
      { k: 'hover', t: 'select', label: 'Hover effect', value: 'lift', options: [['lift', 'Lift'], ['zoom', 'Image zoom'], ['border', 'Border glow'], ['none', 'None']] },
      { k: 'bg', t: 'color', label: 'Background', value: '#f7f4f1' },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 0, max: 140, step: 8, unit: 'px', value: 80 }
    ],

    render: function (p, c) {
      var s = c.s;
      var items = (p.items || []).filter(Boolean);
      var overlay = p.variant === 'overlay';
      var showImg = p.ratio !== 'none';

      var cards = items.map(function (it) {
        var linked = !!(it.linkUrl && it.linkText);
        var titleHtml = it.title
          ? '<h3 class="cb-cg__t">' + (linked
              ? '<a class="cb-cg__link" href="' + c.url(it.linkUrl) + '">' + c.esc(it.title) + '</a>'
              : c.esc(it.title)) + '</h3>'
          : '';
        return c.dedent(`
          <li class="cb-cg__card">
            <article class="cb-cg__inner">
              ${showImg && it.image ? `<div class="cb-cg__media"><img src="${c.url(it.image)}" alt="${c.attr(it.alt)}" loading="lazy" decoding="async"></div>` : ''}
              <div class="cb-cg__body">
                ${it.tag ? '<span class="cb-cg__tag">' + c.esc(it.tag) + '</span>' : ''}
                ${titleHtml}
                ${it.text ? '<p class="cb-cg__x">' + c.rich(it.text) + '</p>' : ''}
                <div class="cb-cg__foot">
                  ${it.meta ? '<span class="cb-cg__meta">' + c.esc(it.meta) + '</span>' : ''}
                  ${linked ? '<span class="cb-cg__cta" aria-hidden="true">' + c.esc(it.linkText) + ' &rarr;</span>' : ''}
                </div>
              </div>
            </article>
          </li>`);
      }).join('\n');

      var html = c.dedent(`
        <section class="${c.cls} cb-cg">
          <div class="cb-wrap">
            ${(p.title || p.sub) ? `<header class="cb-cg__head">
              ${p.title ? '<h2 class="cb-cg__title">' + c.rich(p.title) + '</h2>' : ''}
              ${p.sub ? '<p class="cb-cg__sub">' + c.rich(p.sub) + '</p>' : ''}
            </header>` : ''}
            <ul class="cb-cg__grid">
        ${c.indent(cards, 6)}
            </ul>
          </div>
        </section>`);

      var hoverCss = {
        lift: `${s} .cb-cg__card:hover .cb-cg__inner { transform: translateY(-6px); box-shadow: 0 28px 50px -28px rgba(20,18,16,.45); }`,
        zoom: `${s} .cb-cg__card:hover .cb-cg__media img { transform: scale(1.07); }`,
        border: `${s} .cb-cg__card:hover .cb-cg__inner { border-color: var(--cb-brand); box-shadow: 0 0 0 1px var(--cb-brand), 0 20px 40px -30px var(--cb-brand); }`,
        none: ''
      }[p.hover] || '';

      var variantCss = {
        elevated: `${s} .cb-cg__inner { background: var(--cb-surface); box-shadow: 0 12px 30px -22px rgba(20,18,16,.5); border: 1px solid transparent; }`,
        outline: `${s} .cb-cg__inner { background: var(--cb-surface); border: 1px solid var(--cb-border); }`,
        flat: `${s} .cb-cg__inner { background: transparent; border: 1px solid transparent; }
               ${s} .cb-cg__body { padding-inline: 0; }`,
        overlay: `
          ${s} .cb-cg__inner { background: #12100e; border: 1px solid transparent; }
          ${s} .cb-cg__media { position: absolute; inset: 0; }
          ${s} .cb-cg__media::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, rgba(12,10,8,.9) 10%, rgba(12,10,8,.15) 65%); }
          ${s} .cb-cg__media img { height: 100%; }
          ${s} .cb-cg__body { position: relative; z-index: 1; min-height: 320px; justify-content: flex-end; color: #fff; }
          ${s} .cb-cg__x { color: rgba(255,255,255,.82); }
          ${s} .cb-cg__meta { color: rgba(255,255,255,.7); }`
      }[p.variant] || '';

      var css = `
        ${s}.cb-cg { background: ${p.bg}; padding-block: ${c.num(p.pad, 80)}px; }
        ${s} .cb-cg__head { margin-bottom: 34px; max-width: 660px; }
        ${s} .cb-cg__title { font-size: clamp(26px, 3.6vw, 38px); font-weight: 800; letter-spacing: -.02em; line-height: 1.15; }
        ${s} .cb-cg__sub { color: var(--cb-muted); margin-top: 10px; }
        ${s} .cb-cg__grid {
          display: grid; gap: ${c.num(p.gap, 24)}px;
          grid-template-columns: repeat(${c.clamp(c.num(p.cols, 3), 1, 4)}, minmax(0, 1fr));
        }
        ${s} .cb-cg__inner {
          position: relative; height: 100%; overflow: hidden;
          display: flex; flex-direction: column;
          border-radius: var(--cb-radius);
          transition: transform .3s cubic-bezier(.2,.7,.3,1), box-shadow .3s ease, border-color .3s ease;
        }
        ${variantCss}
        ${hoverCss}
        ${s} .cb-cg__media { overflow: hidden; background: var(--cb-subtle); }
        ${s} .cb-cg__media img {
          width: 100%; ${p.ratio !== 'none' ? 'aspect-ratio: ' + p.ratio + ';' : ''} object-fit: cover;
          transition: transform .5s cubic-bezier(.2,.7,.3,1);
        }
        ${s} .cb-cg__body { display: flex; flex-direction: column; gap: 10px; padding: 22px; flex: 1 1 auto; }
        ${s} .cb-cg__tag {
          align-self: flex-start; font-size: .72em; font-weight: 700; letter-spacing: .1em;
          text-transform: uppercase; color: ${overlay ? '#fff' : 'var(--cb-brand)'};
          ${overlay ? 'background: rgba(255,255,255,.16); padding: 4px 9px; border-radius: 999px;' : ''}
        }
        ${s} .cb-cg__t { font-size: 1.18em; font-weight: 730; line-height: 1.3; letter-spacing: -.01em; }
        /* One link in the a11y tree; the pseudo-element makes the whole card a target. */
        ${s} .cb-cg__link { text-decoration: none; }
        ${s} .cb-cg__link::after { content: ""; position: absolute; inset: 0; z-index: 1; }
        ${s} .cb-cg__link:focus-visible { outline: none; }
        ${s} .cb-cg__card:has(.cb-cg__link:focus-visible) .cb-cg__inner { outline: 3px solid var(--cb-brand); outline-offset: 3px; }
        ${s} .cb-cg__x { color: ${overlay ? 'rgba(255,255,255,.82)' : 'var(--cb-muted)'}; font-size: .96em; }
        ${s} .cb-cg__foot {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          margin-top: auto; padding-top: 12px; font-size: .86em;
        }
        ${s} .cb-cg__meta { color: var(--cb-muted); }
        ${s} .cb-cg__cta { color: ${overlay ? '#fff' : 'var(--cb-brand)'}; font-weight: 650; margin-left: auto; }
        @media (max-width: 900px) { ${s} .cb-cg__grid { grid-template-columns: repeat(${Math.min(2, c.clamp(c.num(p.cols, 3), 1, 4))}, minmax(0, 1fr)); } }
        @media (max-width: 560px) { ${s} .cb-cg__grid { grid-template-columns: 1fr; } }`;

      return { html: html, css: css, js: '' };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Feature Grid                                                           */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'feature-grid',
    name: 'Feature Grid',
    category: CAT,
    icon: '⁘',
    blurb: 'Icon, title and blurb repeated on a responsive grid. Icons are plain text/emoji so nothing external has to load.',
    props: [
      { t: 'section', label: 'Heading' },
      { k: 'title', t: 'text', label: 'Section title', value: 'Built for the way you actually ship' },
      { k: 'sub', t: 'textarea', label: 'Section intro', value: '' },
      { k: 'align', t: 'select', label: 'Heading alignment', value: 'center', options: [['left', 'Left'], ['center', 'Center']] },

      { t: 'section', label: 'Features' },
      {
        k: 'items', t: 'list', label: 'Features', itemLabel: 'title',
        fields: [
          { k: 'icon', t: 'text', label: 'Icon (emoji or 1–2 letters)', value: '★' },
          { k: 'title', t: 'text', label: 'Title', value: 'Feature' },
          { k: 'text', t: 'textarea', label: 'Description', value: 'Description of the feature.' }
        ],
        value: [
          { icon: '⚡', title: 'No dependencies', text: 'Plain HTML, CSS and vanilla JS. Nothing to install, nothing to keep updated.' },
          { icon: '🔒', title: 'Scoped by default', text: 'Every rule is namespaced to a generated class, so your theme and the component leave each other alone.' },
          { icon: '♿', title: 'Accessible patterns', text: 'Roles, keyboard support and focus handling follow the WAI-ARIA Authoring Practices.' },
          { icon: '📱', title: 'Responsive out of the box', text: 'Fluid type, sensible breakpoints and touch-friendly targets on every block.' },
          { icon: '🎨', title: 'One set of tokens', text: 'Colours, type and radius live in custom properties shared across every component.' },
          { icon: '📋', title: 'Copy and paste', text: 'Export one snippet, or split HTML, CSS and JS for builders with separate fields.' }
        ]
      },

      { t: 'section', label: 'Style' },
      { k: 'cols', t: 'range', label: 'Columns (desktop)', min: 2, max: 4, step: 1, value: 3 },
      { k: 'iconStyle', t: 'select', label: 'Icon treatment', value: 'tint', options: [['tint', 'Tinted circle'], ['solid', 'Solid brand'], ['square', 'Rounded square'], ['bare', 'Bare']] },
      { k: 'cardStyle', t: 'select', label: 'Card treatment', value: 'none', options: [['none', 'No card'], ['outline', 'Outlined'], ['soft', 'Soft fill']] },
      { k: 'itemAlign', t: 'select', label: 'Item alignment', value: 'left', options: [['left', 'Left'], ['center', 'Center']] },
      { k: 'bg', t: 'color', label: 'Background', value: '#ffffff' },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 0, max: 140, step: 8, unit: 'px', value: 80 }
    ],

    render: function (p, c) {
      var s = c.s;
      var items = (p.items || []).filter(Boolean);

      var cells = items.map(function (it) {
        return c.dedent(`
          <li class="cb-fg__item">
            ${it.icon ? '<span class="cb-fg__icon" aria-hidden="true">' + c.esc(it.icon) + '</span>' : ''}
            <h3 class="cb-fg__t">${c.esc(it.title)}</h3>
            ${it.text ? '<p class="cb-fg__x">' + c.rich(it.text) + '</p>' : ''}
          </li>`);
      }).join('\n');

      var html = c.dedent(`
        <section class="${c.cls} cb-fg">
          <div class="cb-wrap">
            ${(p.title || p.sub) ? `<header class="cb-fg__head">
              ${p.title ? '<h2 class="cb-fg__title">' + c.rich(p.title) + '</h2>' : ''}
              ${p.sub ? '<p class="cb-fg__sub">' + c.rich(p.sub) + '</p>' : ''}
            </header>` : ''}
            <ul class="cb-fg__grid">
        ${c.indent(cells, 6)}
            </ul>
          </div>
        </section>`);

      var iconCss = {
        tint: `background: color-mix(in srgb, var(--cb-brand) 14%, transparent); color: var(--cb-brand); border-radius: 50%;`,
        solid: `background: var(--cb-brand); color: var(--cb-on-brand); border-radius: 50%;`,
        square: `background: color-mix(in srgb, var(--cb-brand) 14%, transparent); color: var(--cb-brand); border-radius: calc(var(--cb-radius) * .8);`,
        bare: `background: none; padding: 0; width: auto; height: auto; font-size: 32px;`
      }[p.iconStyle] || '';

      var cardCss = {
        none: '',
        outline: `${s} .cb-fg__item { border: 1px solid var(--cb-border); border-radius: var(--cb-radius); padding: 26px; }`,
        soft: `${s} .cb-fg__item { background: var(--cb-subtle); border-radius: var(--cb-radius); padding: 26px; }`
      }[p.cardStyle] || '';

      var css = `
        ${s}.cb-fg { background: ${p.bg}; padding-block: ${c.num(p.pad, 80)}px; }
        ${s} .cb-fg__head {
          margin-bottom: 42px; max-width: 680px;
          text-align: ${p.align}; ${p.align === 'center' ? 'margin-inline: auto;' : ''}
        }
        ${s} .cb-fg__title { font-size: clamp(26px, 3.6vw, 38px); font-weight: 800; letter-spacing: -.02em; line-height: 1.15; text-wrap: balance; }
        ${s} .cb-fg__sub { color: var(--cb-muted); margin-top: 10px; }
        ${s} .cb-fg__grid {
          display: grid; gap: clamp(20px, 3vw, 34px);
          grid-template-columns: repeat(${c.clamp(c.num(p.cols, 3), 2, 4)}, minmax(0, 1fr));
        }
        ${s} .cb-fg__item {
          display: flex; flex-direction: column; gap: 12px;
          text-align: ${p.itemAlign}; ${p.itemAlign === 'center' ? 'align-items: center;' : 'align-items: flex-start;'}
        }
        ${cardCss}
        ${s} .cb-fg__icon {
          display: grid; place-items: center; width: 52px; height: 52px;
          font-size: 24px; line-height: 1; flex-shrink: 0; ${iconCss}
        }
        ${s} .cb-fg__t { font-size: 1.12em; font-weight: 730; letter-spacing: -.01em; }
        ${s} .cb-fg__x { color: var(--cb-muted); font-size: .96em; max-width: 46ch; }
        @media (max-width: 860px) { ${s} .cb-fg__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 540px) { ${s} .cb-fg__grid { grid-template-columns: 1fr; } }`;

      return { html: html, css: css, js: '' };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Stats Counter                                                          */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'stats-counter',
    name: 'Stats Counter',
    category: CAT,
    icon: '↑',
    blurb: 'Numbers that count up once they scroll into view. Honours reduced-motion by showing the final value immediately.',
    props: [
      { t: 'section', label: 'Heading' },
      { k: 'title', t: 'text', label: 'Section title', value: '' },

      { t: 'section', label: 'Stats' },
      {
        k: 'items', t: 'list', label: 'Stats', itemLabel: 'label',
        fields: [
          { k: 'prefix', t: 'text', label: 'Prefix', value: '' },
          { k: 'value', t: 'text', label: 'Value', value: '100' },
          { k: 'suffix', t: 'text', label: 'Suffix', value: '' },
          { k: 'label', t: 'text', label: 'Label', value: 'Label' },
          { k: 'sub', t: 'text', label: 'Sub-label', value: '' }
        ],
        value: [
          { prefix: '', value: '17', suffix: '', label: 'Components', sub: 'and counting' },
          { prefix: '', value: '0', suffix: '', label: 'Dependencies', sub: 'nothing to install' },
          { prefix: '', value: '98', suffix: '%', label: 'Lighthouse median', sub: 'across every block' },
          { prefix: '~', value: '12', suffix: 'kB', label: 'Typical export', sub: 'HTML, CSS and JS' }
        ]
      },

      { t: 'section', label: 'Style' },
      { k: 'cols', t: 'range', label: 'Columns', min: 2, max: 5, step: 1, value: 4 },
      { k: 'duration', t: 'range', label: 'Count duration', min: 400, max: 3000, step: 100, unit: 'ms', value: 1600 },
      { k: 'divider', t: 'toggle', label: 'Dividers between stats', value: true },
      { k: 'align', t: 'select', label: 'Alignment', value: 'center', options: [['center', 'Center'], ['left', 'Left']] },
      { k: 'numColor', t: 'select', label: 'Number colour', value: 'brand', options: [['brand', 'Brand'], ['ink', 'Text colour'], ['gradient', 'Brand gradient']] },
      { k: 'bg', t: 'color', label: 'Background', value: '#ffffff' },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 0, max: 140, step: 8, unit: 'px', value: 72 }
    ],

    render: function (p, c) {
      var s = c.s;
      var items = (p.items || []).filter(Boolean);

      var cells = items.map(function (it) {
        // Keep the real value in the DOM for no-JS and for assistive tech.
        return c.dedent(`
          <li class="cb-st__item">
            <p class="cb-st__num">
              ${it.prefix ? '<span class="cb-st__fix">' + c.esc(it.prefix) + '</span>' : ''}<span class="cb-st__val" data-to="${c.attr(it.value)}">${c.esc(it.value)}</span>${it.suffix ? '<span class="cb-st__fix">' + c.esc(it.suffix) + '</span>' : ''}
            </p>
            <p class="cb-st__label">${c.esc(it.label)}</p>
            ${it.sub ? '<p class="cb-st__sub">' + c.esc(it.sub) + '</p>' : ''}
          </li>`);
      }).join('\n');

      var html = c.dedent(`
        <section class="${c.cls} cb-st">
          <div class="cb-wrap">
            ${p.title ? '<h2 class="cb-st__title">' + c.rich(p.title) + '</h2>' : ''}
            <ul class="cb-st__grid">
        ${c.indent(cells, 6)}
            </ul>
          </div>
        </section>`);

      var numColor = {
        brand: 'color: var(--cb-brand);',
        ink: 'color: var(--cb-ink);',
        gradient: 'background: linear-gradient(120deg, var(--cb-brand), var(--cb-brand-2)); -webkit-background-clip: text; background-clip: text; color: transparent;'
      }[p.numColor] || '';

      var css = `
        ${s}.cb-st { background: ${p.bg}; padding-block: ${c.num(p.pad, 72)}px; }
        ${s} .cb-st__title { font-size: clamp(24px, 3.2vw, 34px); font-weight: 800; letter-spacing: -.02em; text-align: ${p.align}; margin-bottom: 34px; }
        ${s} .cb-st__grid {
          display: grid; gap: clamp(20px, 3vw, 32px);
          grid-template-columns: repeat(${c.clamp(c.num(p.cols, 4), 2, 5)}, minmax(0, 1fr));
        }
        ${s} .cb-st__item {
          display: flex; flex-direction: column; gap: 4px; text-align: ${p.align};
          ${p.divider ? 'padding-inline: clamp(12px, 2vw, 24px);' : ''}
        }
        ${p.divider ? `${s} .cb-st__item + .cb-st__item { border-left: 1px solid var(--cb-border); }` : ''}
        ${s} .cb-st__num {
          font-size: clamp(34px, 5.5vw, 56px); font-weight: 800; line-height: 1;
          letter-spacing: -.03em; font-variant-numeric: tabular-nums; ${numColor}
        }
        ${s} .cb-st__fix { font-size: .62em; font-weight: 700; }
        ${s} .cb-st__label { font-weight: 650; margin-top: 8px; }
        ${s} .cb-st__sub { color: var(--cb-muted); font-size: .88em; }
        @media (max-width: 760px) {
          ${s} .cb-st__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          ${s} .cb-st__item:nth-child(odd) { border-left: 0; }
        }
        @media (max-width: 420px) {
          ${s} .cb-st__grid { grid-template-columns: 1fr; }
          ${s} .cb-st__item { border-left: 0 !important; }
        }`;

      var js = c.wrap(c.cls, `
        var vals = Array.prototype.slice.call(root.querySelectorAll(".cb-st__val"));
        if (!vals.length) return;
        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        if (!("IntersectionObserver" in window)) return;

        var DURATION = ${c.num(p.duration, 1600)};

        function run(el) {
          var raw = String(el.getAttribute("data-to"));
          var match = raw.match(/-?[\\d.,]+/);
          if (!match) return;                     /* non-numeric, e.g. "N/A" — leave it */
          var numText = match[0];
          var target = parseFloat(numText.replace(/,/g, ""));
          if (isNaN(target)) return;

          var decimals = (numText.split(".")[1] || "").length;
          var grouped = numText.indexOf(",") > -1;
          var before = raw.slice(0, match.index);
          var after = raw.slice(match.index + numText.length);
          var start = null;

          function format(n) {
            var t = n.toFixed(decimals);
            if (grouped) {
              var parts = t.split(".");
              parts[0] = parts[0].replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");
              t = parts.join(".");
            }
            return before + t + after;
          }

          function step(now) {
            if (start === null) start = now;
            var t = Math.min(1, (now - start) / DURATION);
            var eased = 1 - Math.pow(1 - t, 3);   /* easeOutCubic */
            el.textContent = format(target * eased);
            if (t < 1) requestAnimationFrame(step);
            else el.textContent = raw;
          }
          el.textContent = format(0);
          requestAnimationFrame(step);
        }

        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            io.unobserve(e.target);
            run(e.target);
          });
        }, { threshold: 0.45 });
        vals.forEach(function (v) { io.observe(v); });`);

      return { html: html, css: css, js: js };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Timeline                                                               */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'timeline',
    name: 'Timeline',
    category: CAT,
    icon: '⋮',
    blurb: 'Ordered list of milestones with a connecting rail. Alternating or single-sided, with optional reveal on scroll.',
    props: [
      { t: 'section', label: 'Heading' },
      { k: 'title', t: 'text', label: 'Section title', value: 'How a project runs' },

      { t: 'section', label: 'Milestones' },
      {
        k: 'items', t: 'list', label: 'Milestones', itemLabel: 'title',
        fields: [
          { k: 'date', t: 'text', label: 'Date / step', value: 'Step' },
          { k: 'title', t: 'text', label: 'Title', value: 'Milestone' },
          { k: 'text', t: 'textarea', label: 'Description', value: 'What happens at this stage.' }
        ],
        value: [
          { date: 'Week 1', title: 'Discovery', text: 'Audit what exists, agree the shape of the problem and write down what success looks like.' },
          { date: 'Week 2–3', title: 'Design system', text: 'Tokens, type scale and the first set of components, reviewed in the browser rather than a static mockup.' },
          { date: 'Week 4–6', title: 'Build', text: 'Components go into the page builder as self-contained blocks your team can edit without us.' },
          { date: 'Week 7', title: 'Hand-off', text: 'Documentation, an accessibility pass and a recorded walkthrough of every block.' }
        ]
      },

      { t: 'section', label: 'Style' },
      { k: 'layout', t: 'select', label: 'Layout', value: 'alternating', options: [['alternating', 'Alternating'], ['left', 'Single column']] },
      { k: 'marker', t: 'select', label: 'Marker', value: 'dot', options: [['dot', 'Dot'], ['number', 'Number'], ['ring', 'Ring']] },
      { k: 'reveal', t: 'toggle', label: 'Reveal on scroll', value: true },
      { k: 'bg', t: 'color', label: 'Background', value: '#ffffff' },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 0, max: 140, step: 8, unit: 'px', value: 80 }
    ],

    render: function (p, c) {
      var s = c.s;
      var items = (p.items || []).filter(Boolean);
      var alt = p.layout === 'alternating';

      var rows = items.map(function (it, i) {
        return c.dedent(`
          <li class="cb-tl__item">
            <span class="cb-tl__marker" aria-hidden="true">${p.marker === 'number' ? (i + 1) : ''}</span>
            <div class="cb-tl__card">
              ${it.date ? '<p class="cb-tl__date">' + c.esc(it.date) + '</p>' : ''}
              <h3 class="cb-tl__t">${c.esc(it.title)}</h3>
              ${it.text ? '<p class="cb-tl__x">' + c.rich(it.text) + '</p>' : ''}
            </div>
          </li>`);
      }).join('\n');

      var html = c.dedent(`
        <section class="${c.cls} cb-tl">
          <div class="cb-wrap">
            ${p.title ? '<h2 class="cb-tl__title">' + c.rich(p.title) + '</h2>' : ''}
            <ol class="cb-tl__list">
        ${c.indent(rows, 6)}
            </ol>
          </div>
        </section>`);

      var markerCss = {
        dot: `background: var(--cb-brand); box-shadow: 0 0 0 4px color-mix(in srgb, var(--cb-brand) 18%, transparent);`,
        ring: `background: var(--cb-surface); border: 3px solid var(--cb-brand);`,
        number: `background: var(--cb-brand); color: var(--cb-on-brand); font-size: .82em; font-weight: 700;`
      }[p.marker] || '';

      var css = `
        ${s}.cb-tl { background: ${p.bg}; padding-block: ${c.num(p.pad, 80)}px; }
        ${s} .cb-tl__title { font-size: clamp(26px, 3.6vw, 38px); font-weight: 800; letter-spacing: -.02em; margin-bottom: 44px; ${alt ? 'text-align: center;' : ''} }
        ${s} .cb-tl__list { position: relative; display: flex; flex-direction: column; gap: 34px; }
        ${s} .cb-tl__list::before {
          content: ""; position: absolute; top: 6px; bottom: 6px; width: 2px;
          background: var(--cb-border);
          left: ${alt ? '50%' : '13px'}; translate: ${alt ? '-50% 0' : '0 0'};
        }
        ${s} .cb-tl__item { position: relative; ${alt ? 'width: calc(50% - 34px);' : 'padding-left: 46px;'} }
        ${s} .cb-tl__marker {
          position: absolute; z-index: 1; display: grid; place-items: center;
          width: 28px; height: 28px; border-radius: 50%; top: 2px;
          ${alt ? 'right: -48px;' : 'left: 0;'}
          ${markerCss}
        }
        ${alt ? `
        ${s} .cb-tl__item:nth-child(even) { align-self: flex-end; }
        ${s} .cb-tl__item:nth-child(even) .cb-tl__marker { right: auto; left: -48px; }
        ${s} .cb-tl__item:nth-child(odd) { text-align: right; }
        ${s} .cb-tl__item:nth-child(odd) .cb-tl__x { margin-left: auto; }` : ''}
        ${s} .cb-tl__date { font-size: .78em; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--cb-brand); }
        ${s} .cb-tl__t { font-size: 1.15em; font-weight: 730; margin-top: 6px; letter-spacing: -.01em; }
        ${s} .cb-tl__x { color: var(--cb-muted); margin-top: 6px; max-width: 46ch; font-size: .96em; }
        ${p.reveal ? `
        ${s} .cb-tl__item { opacity: 0; transform: translateY(16px); transition: opacity .5s ease, transform .5s ease; }
        ${s} .cb-tl__item[data-in] { opacity: 1; transform: none; }
        @media (prefers-reduced-motion: reduce) { ${s} .cb-tl__item { opacity: 1; transform: none; } }` : ''}
        @media (max-width: 720px) {
          ${s} .cb-tl__list::before { left: 13px; translate: 0 0; }
          ${s} .cb-tl__item, ${s} .cb-tl__item:nth-child(even) {
            width: 100%; align-self: auto; padding-left: 46px; text-align: left;
          }
          ${s} .cb-tl__item:nth-child(odd) { text-align: left; }
          ${s} .cb-tl__marker, ${s} .cb-tl__item:nth-child(even) .cb-tl__marker { left: 0; right: auto; }
          ${s} .cb-tl__item:nth-child(odd) .cb-tl__x { margin-left: 0; }
        }`;

      var js = !p.reveal ? '' : c.wrap(c.cls, `
        var items = Array.prototype.slice.call(root.querySelectorAll(".cb-tl__item"));
        if (!("IntersectionObserver" in window) ||
            (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
          items.forEach(function (i) { i.setAttribute("data-in", "1"); });
          return;
        }
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            io.unobserve(e.target);
            var idx = items.indexOf(e.target);
            setTimeout(function () { e.target.setAttribute("data-in", "1"); }, (idx % 3) * 90);
          });
        }, { threshold: 0.25, rootMargin: "0px 0px -40px 0px" });
        items.forEach(function (i) { io.observe(i); });`);

      return { html: html, css: css, js: js };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Pricing Table                                                          */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'pricing',
    name: 'Pricing Table',
    category: CAT,
    icon: '$',
    blurb: 'Plan comparison with a highlighted tier and an optional monthly/annual switch.',
    props: [
      { t: 'section', label: 'Heading' },
      { k: 'title', t: 'text', label: 'Section title', value: 'Simple pricing' },
      { k: 'sub', t: 'textarea', label: 'Section intro', value: 'Every plan includes the full component library.' },

      { t: 'section', label: 'Plans' },
      {
        k: 'items', t: 'list', label: 'Plans', itemLabel: 'name',
        fields: [
          { k: 'name', t: 'text', label: 'Plan name', value: 'Plan' },
          { k: 'price', t: 'text', label: 'Price', value: '29' },
          { k: 'currency', t: 'text', label: 'Currency symbol', value: '$' },
          { k: 'priceYear', t: 'text', label: 'Annual price', value: '', help: 'Used by the billing switch. Leave blank to reuse the monthly price.' },
          { k: 'period', t: 'text', label: 'Period label', value: '/ month' },
          { k: 'blurb', t: 'text', label: 'One-liner', value: '' },
          { k: 'features', t: 'textarea', label: 'Features', value: 'Feature one\nFeature two', help: 'One per line. Prefix with "-" for a struck-through / unavailable item.' },
          { k: 'cta', t: 'text', label: 'Button label', value: 'Choose plan' },
          { k: 'ctaUrl', t: 'url', label: 'Button link', value: '#' },
          { k: 'featured', t: 'toggle', label: 'Highlight this plan', value: false },
          { k: 'badge', t: 'text', label: 'Badge text', value: '' }
        ],
        value: [
          { name: 'Starter', price: '0', currency: '$', priceYear: '0', period: '/ month', blurb: 'For a single site.', features: 'All 17 components\nUnlimited exports\nLight and dark tokens\n-Priority support', cta: 'Start free', ctaUrl: '#', featured: false, badge: '' },
          { name: 'Studio', price: '29', currency: '$', priceYear: '290', period: '/ month', blurb: 'For teams shipping client work.', features: 'Everything in Starter\nSaved brand presets\nShareable project files\nPriority support', cta: 'Choose Studio', ctaUrl: '#', featured: true, badge: 'Most popular' },
          { name: 'Agency', price: '79', currency: '$', priceYear: '790', period: '/ month', blurb: 'For larger design teams.', features: 'Everything in Studio\nCustom component requests\nWhite-label exports\nOnboarding session', cta: 'Talk to us', ctaUrl: '#', featured: false, badge: '' }
        ]
      },

      { t: 'section', label: 'Options' },
      { k: 'toggle', t: 'toggle', label: 'Monthly / annual switch', value: true },
      { k: 'monthLabel', t: 'text', label: 'Monthly label', value: 'Monthly', when: { toggle: [true] } },
      { k: 'yearLabel', t: 'text', label: 'Annual label', value: 'Annual · save 2 months', when: { toggle: [true] } },
      { k: 'yearPeriod', t: 'text', label: 'Annual period label', value: '/ year', when: { toggle: [true] } },

      { t: 'section', label: 'Style' },
      { k: 'bg', t: 'color', label: 'Background', value: '#f7f4f1' },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 24, max: 160, step: 8, unit: 'px', value: 88 }
    ],

    render: function (p, c) {
      var s = c.s;
      var items = (p.items || []).filter(Boolean);

      var plans = items.map(function (it) {
        var feats = String(it.features || '').split('\n').map(function (f) { return f.trim(); }).filter(Boolean)
          .map(function (f) {
            var off = f.charAt(0) === '-';
            var text = off ? f.slice(1).trim() : f;
            return '<li class="cb-pr__feat' + (off ? ' is-off' : '') + '"><span class="cb-pr__mark" aria-hidden="true"></span>' +
              '<span>' + c.esc(text) + '</span>' + (off ? '<span class="cb-sr"> (not included)</span>' : '') + '</li>';
          }).join('');

        var yearly = String(it.priceYear || '').trim() || String(it.price || '');
        return c.dedent(`
          <li class="cb-pr__plan${it.featured ? ' is-featured' : ''}">
            ${it.badge ? '<span class="cb-pr__badge">' + c.esc(it.badge) + '</span>' : ''}
            <h3 class="cb-pr__name">${c.esc(it.name)}</h3>
            ${it.blurb ? '<p class="cb-pr__blurb">' + c.esc(it.blurb) + '</p>' : ''}
            <p class="cb-pr__price">
              <span class="cb-pr__cur">${c.esc(it.currency)}</span><span class="cb-pr__amount" data-month="${c.attr(it.price)}" data-year="${c.attr(yearly)}">${c.esc(it.price)}</span><span class="cb-pr__period" data-month="${c.attr(it.period)}" data-year="${c.attr(p.yearPeriod)}">${c.esc(it.period)}</span>
            </p>
            <a class="cb-btn cb-pr__cta" href="${c.url(it.ctaUrl)}">${c.esc(it.cta)}</a>
            <ul class="cb-pr__feats">${feats}</ul>
          </li>`);
      }).join('\n');

      var html = c.dedent(`
        <section class="${c.cls} cb-pr">
          <div class="cb-wrap">
            <header class="cb-pr__head">
              ${p.title ? '<h2 class="cb-pr__title">' + c.rich(p.title) + '</h2>' : ''}
              ${p.sub ? '<p class="cb-pr__sub">' + c.rich(p.sub) + '</p>' : ''}
              ${p.toggle ? `<div class="cb-pr__switch" role="group" aria-label="Billing period">
                <button type="button" class="cb-pr__sw" data-period="month" aria-pressed="true">${c.esc(p.monthLabel)}</button>
                <button type="button" class="cb-pr__sw" data-period="year" aria-pressed="false">${c.esc(p.yearLabel)}</button>
              </div>` : ''}
            </header>
            <ul class="cb-pr__grid">
        ${c.indent(plans, 6)}
            </ul>
          </div>
        </section>`);

      var css = `
        ${s}.cb-pr { background: ${p.bg}; padding-block: ${c.num(p.pad, 88)}px; }
        ${s} .cb-pr__head { text-align: center; max-width: 640px; margin: 0 auto 44px; }
        ${s} .cb-pr__title { font-size: clamp(26px, 3.6vw, 38px); font-weight: 800; letter-spacing: -.02em; line-height: 1.15; }
        ${s} .cb-pr__sub { color: var(--cb-muted); margin-top: 10px; }
        ${s} .cb-pr__switch {
          display: inline-flex; gap: 4px; margin-top: 24px; padding: 5px;
          background: var(--cb-surface); border: 1px solid var(--cb-border); border-radius: 999px;
        }
        ${s} .cb-pr__sw {
          padding: 9px 18px; border-radius: 999px; font-size: .9em; font-weight: 650;
          color: var(--cb-muted); transition: all .2s ease;
        }
        ${s} .cb-pr__sw[aria-pressed="true"] { background: var(--cb-brand); color: var(--cb-on-brand); }
        ${s} .cb-pr__grid {
          display: grid; gap: 22px; align-items: start;
          grid-template-columns: repeat(${Math.min(items.length || 1, 4)}, minmax(0, 1fr));
        }
        ${s} .cb-pr__plan {
          position: relative; display: flex; flex-direction: column; gap: 12px;
          background: var(--cb-surface); border: 1px solid var(--cb-border);
          border-radius: calc(var(--cb-radius) * 1.2); padding: 30px 26px;
          transition: transform .25s ease, box-shadow .25s ease;
        }
        ${s} .cb-pr__plan:hover { transform: translateY(-4px); box-shadow: 0 24px 50px -34px rgba(20,18,16,.55); }
        ${s} .cb-pr__plan.is-featured {
          border-color: var(--cb-brand); border-width: 2px;
          box-shadow: 0 24px 60px -32px var(--cb-brand);
        }
        ${s} .cb-pr__badge {
          position: absolute; top: 0; left: 50%; translate: -50% -50%;
          background: var(--cb-brand); color: var(--cb-on-brand);
          font-size: .72em; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
          padding: 5px 13px; border-radius: 999px; white-space: nowrap;
        }
        ${s} .cb-pr__name { font-size: 1.15em; font-weight: 750; }
        ${s} .cb-pr__blurb { color: var(--cb-muted); font-size: .92em; }
        ${s} .cb-pr__price { display: flex; align-items: baseline; gap: 3px; margin-top: 6px; flex-wrap: wrap; }
        ${s} .cb-pr__cur { font-size: 1.3em; font-weight: 700; align-self: flex-start; margin-top: .35em; }
        ${s} .cb-pr__amount { font-size: 2.9em; font-weight: 800; letter-spacing: -.03em; line-height: 1; font-variant-numeric: tabular-nums; }
        ${s} .cb-pr__period { color: var(--cb-muted); font-size: .9em; margin-left: 4px; }
        ${s} .cb-pr__cta {
          margin-top: 10px; width: 100%;
          background: var(--cb-subtle); color: var(--cb-ink); text-decoration: none;
          border: 1px solid var(--cb-border);
        }
        ${s} .cb-pr__plan.is-featured .cb-pr__cta {
          background: var(--cb-brand); color: var(--cb-on-brand); border-color: var(--cb-brand);
          box-shadow: 0 8px 20px -10px var(--cb-brand);
        }
        ${s} .cb-pr__feats { display: flex; flex-direction: column; gap: 10px; margin-top: 14px; padding-top: 18px; border-top: 1px solid var(--cb-border); }
        ${s} .cb-pr__feat { display: flex; align-items: flex-start; gap: 10px; font-size: .94em; }
        ${s} .cb-pr__mark { position: relative; flex: 0 0 18px; width: 18px; height: 18px; margin-top: 3px; }
        ${s} .cb-pr__mark::after {
          content: ""; position: absolute; left: 6px; top: 2px;
          width: 5px; height: 10px; border: solid var(--cb-brand); border-width: 0 2px 2px 0; rotate: 45deg;
        }
        ${s} .cb-pr__feat.is-off { color: var(--cb-muted); opacity: .7; }
        ${s} .cb-pr__feat.is-off span:last-of-type { text-decoration: line-through; }
        ${s} .cb-pr__feat.is-off .cb-pr__mark::after {
          border: 0; left: 4px; top: 8px; width: 11px; height: 2px; rotate: 0deg;
          background: currentColor; border-radius: 2px;
        }
        @media (max-width: 900px) { ${s} .cb-pr__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 600px) { ${s} .cb-pr__grid { grid-template-columns: 1fr; } }`;

      var js = !p.toggle ? '' : c.wrap(c.cls, `
        var switches = Array.prototype.slice.call(root.querySelectorAll(".cb-pr__sw"));
        var amounts = Array.prototype.slice.call(root.querySelectorAll(".cb-pr__amount"));
        var periods = Array.prototype.slice.call(root.querySelectorAll(".cb-pr__period"));
        if (!switches.length) return;

        function apply(period) {
          switches.forEach(function (b) {
            b.setAttribute("aria-pressed", b.getAttribute("data-period") === period ? "true" : "false");
          });
          amounts.concat(periods).forEach(function (el) {
            var v = el.getAttribute("data-" + period);
            if (v !== null) el.textContent = v;
          });
        }
        switches.forEach(function (b) {
          b.addEventListener("click", function () { apply(b.getAttribute("data-period")); });
        });`);

      return { html: html, css: css, js: js };
    }
  });
})();


