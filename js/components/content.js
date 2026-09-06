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
      {
        k: 'bgMode', t: 'select', label: 'Background', value: 'band',
        options: CB.BG_MODES, legacy: { key: 'bg', value: 'custom' },
        help: 'Following the scheme is what lets one Light/Dark setting reach this block.'
      },
      { k: 'bg', t: 'color', label: 'Background colour', value: '#f7f4f1', when: { bgMode: ['custom'] } },
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
          ${s} .cb-cg__body { position: relative; z-index: 1; min-height: 320px; justify-content: flex-end; color: var(--cb-on-dark, #fff); }
          ${s} .cb-cg__x { color: var(--cb-on-dark-muted, rgba(255,255,255,.82)); }
          ${s} .cb-cg__meta { color: var(--cb-on-dark-muted, rgba(255,255,255,.7)); }
          ${c.pin([s + ' .cb-cg__t', s + ' .cb-cg__link', s + ' .cb-cg__tag', s + ' .cb-cg__cta'], 'var(--cb-on-dark, #fff)')}
          ${c.pin([s + ' .cb-cg__x'], 'var(--cb-on-dark-muted, rgba(255,255,255,.82))')}
          ${c.pin([s + ' .cb-cg__meta'], 'var(--cb-on-dark-muted, rgba(255,255,255,.7))')}`
      }[p.variant] || '';

      var css = `
        ${s}.cb-cg { background: ${c.bg(p)}; padding-block: ${c.num(p.pad, 80)}px; }
        ${s} .cb-cg__head { margin-bottom: 34px; max-width: 660px; }
        ${s} .cb-cg__title { font-size: calc(clamp(26px, 3.6vw, 38px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800); letter-spacing: calc(-.02em + var(--cb-h-track, 0em)); line-height: calc(1.15 + var(--cb-h-leading, 0)); }
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
          align-self: flex-start; font-size: calc(.72em * var(--cb-eyebrow-scale, 1)); font-weight: var(--cb-eyebrow-weight, 700); letter-spacing: calc(.1em + var(--cb-eyebrow-track, 0em));
          text-transform: uppercase; color: ${overlay ? '#fff' : 'var(--cb-brand)'};
          ${overlay ? 'background: rgba(255,255,255,.16); padding: 4px 9px; border-radius: 999px;' : ''}
        }
        ${s} .cb-cg__t { font-size: 1.18em; font-weight: var(--cb-h-weight, 730); line-height: calc(1.3 + var(--cb-h-leading, 0)); letter-spacing: calc(-.01em + var(--cb-h-track, 0em)); }
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
        ].concat(CB.ctaFields({ help: 'Leave empty for no button on this feature.' })),
        value: [
          { icon: '⚡', title: 'No dependencies', text: 'Plain HTML, CSS and vanilla JS. Nothing to install, nothing to keep updated.' },
          { icon: '🔒', title: 'Scoped by default', text: 'Every rule is namespaced to a generated class, so your theme and the component leave each other alone.' },
          { icon: '♿', title: 'Accessible patterns', text: 'Roles, keyboard support and focus handling follow the WAI-ARIA Authoring Practices.' },
          { icon: '📱', title: 'Responsive out of the box', text: 'Fluid type, sensible breakpoints and touch-friendly targets on every block.' },
          { icon: '🎨', title: 'One set of tokens', text: 'Colours, type and radius live in custom properties shared across every component.' },
          { icon: '📋', title: 'Copy and paste', text: 'Export one snippet, or split HTML, CSS and JS for builders with separate fields.' }
        ]
      },

      { t: 'section', label: 'Button' },
      { k: 'btnText', t: 'text', label: 'Button label', value: '',
        help: 'Sits below the grid. Leave empty for no button.' },
      { k: 'btnUrl', t: 'text', label: 'Button link', value: '#' },

      { t: 'section', label: 'Style' },
      { k: 'cols', t: 'range', label: 'Columns (desktop)', min: 2, max: 4, step: 1, value: 3 },
      { k: 'iconStyle', t: 'select', label: 'Icon treatment', value: 'tint', options: [['tint', 'Tinted circle'], ['solid', 'Solid brand'], ['square', 'Rounded square'], ['bare', 'Bare']] },
      { k: 'cardStyle', t: 'select', label: 'Card treatment', value: 'none', options: [['none', 'No card'], ['outline', 'Outlined'], ['soft', 'Soft fill']] },
      { k: 'itemAlign', t: 'select', label: 'Item alignment', value: 'left', options: [['left', 'Left'], ['center', 'Center']] },
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
      var items = (p.items || []).filter(Boolean);

      var cells = items.map(function (it) {
        return c.dedent(`
          <li class="cb-fg__item">
            ${it.icon ? '<span class="cb-fg__icon" aria-hidden="true">' + c.esc(it.icon) + '</span>' : ''}
            <h3 class="cb-fg__t">${c.esc(it.title)}</h3>
            ${it.text ? '<p class="cb-fg__x">' + c.rich(it.text) + '</p>' : ''}
            ${c.actions([{ text: it.btnText, url: it.btnUrl }], { tight: true })}
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
            ${c.actions([{ text: p.btnText, url: p.btnUrl }], { align: p.align === 'center' ? 'center' : '' })}
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
        ${s}.cb-fg { background: ${c.bg(p)}; padding-block: ${c.num(p.pad, 80)}px; }
        ${s} .cb-fg__head {
          margin-bottom: 42px; max-width: 680px;
          text-align: ${p.align}; ${p.align === 'center' ? 'margin-inline: auto;' : ''}
        }
        ${s} .cb-fg__title { font-size: calc(clamp(26px, 3.6vw, 38px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800); letter-spacing: calc(-.02em + var(--cb-h-track, 0em)); line-height: calc(1.15 + var(--cb-h-leading, 0)); text-wrap: balance; }
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
        ${s} .cb-fg__t { font-size: 1.12em; font-weight: var(--cb-h-weight, 730); letter-spacing: calc(-.01em + var(--cb-h-track, 0em)); }
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
        ].concat(CB.ctaFields({ help: 'Leave empty for no button on this stat.' })),
        value: [
          { prefix: '', value: '17', suffix: '', label: 'Components', sub: 'and counting' },
          { prefix: '', value: '0', suffix: '', label: 'Dependencies', sub: 'nothing to install' },
          { prefix: '', value: '98', suffix: '%', label: 'Lighthouse median', sub: 'across every block' },
          { prefix: '~', value: '12', suffix: 'kB', label: 'Typical export', sub: 'HTML, CSS and JS' }
        ]
      },

      { t: 'section', label: 'Button' },
      { k: 'btnText', t: 'text', label: 'Button label', value: '',
        help: 'Sits below the numbers. Leave empty for no button.' },
      { k: 'btnUrl', t: 'text', label: 'Button link', value: '#' },

      { t: 'section', label: 'Style' },
      { k: 'cols', t: 'range', label: 'Columns', min: 2, max: 5, step: 1, value: 4 },
      { k: 'duration', t: 'range', label: 'Count duration', min: 400, max: 3000, step: 100, unit: 'ms', value: 1600 },
      { k: 'divider', t: 'toggle', label: 'Dividers between stats', value: true },
      { k: 'align', t: 'select', label: 'Alignment', value: 'center', options: [['center', 'Center'], ['left', 'Left']] },
      { k: 'numColor', t: 'select', label: 'Number colour', value: 'brand', options: [['brand', 'Brand'], ['ink', 'Text colour'], ['gradient', 'Brand gradient']] },
      {
        k: 'bgMode', t: 'select', label: 'Background', value: 'page',
        options: CB.BG_MODES, legacy: { key: 'bg', value: 'custom' },
        help: 'Following the scheme is what lets one Light/Dark setting reach this block.'
      },
      { k: 'bg', t: 'color', label: 'Background colour', value: '#ffffff', when: { bgMode: ['custom'] } },
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
            ${c.actions([{ text: it.btnText, url: it.btnUrl }], { tight: true })}
          </li>`);
      }).join('\n');

      var html = c.dedent(`
        <section class="${c.cls} cb-st">
          <div class="cb-wrap">
            ${p.title ? '<h2 class="cb-st__title">' + c.rich(p.title) + '</h2>' : ''}
            <ul class="cb-st__grid">
        ${c.indent(cells, 6)}
            </ul>
            ${c.actions([{ text: p.btnText, url: p.btnUrl }], { align: p.align === 'center' ? 'center' : '' })}
          </div>
        </section>`);

      var numColor = {
        brand: 'color: var(--cb-brand);',
        ink: 'color: var(--cb-ink);',
        /* A real colour first. If background-clip is stripped by a CSS filter or
           unsupported, the number stays readable instead of vanishing into a
           solid gradient box — `color: transparent` alone is only safe when the
           clip is guaranteed, so the transparency is gated behind @supports. */
        gradient: 'color: var(--cb-brand); background: linear-gradient(120deg, var(--cb-brand), var(--cb-brand-2)); -webkit-background-clip: text; background-clip: text;'
      }[p.numColor] || '';

      var css = `
        ${s}.cb-st { background: ${c.bg(p)}; padding-block: ${c.num(p.pad, 72)}px; }
        ${s} .cb-st__title { font-size: calc(clamp(24px, 3.2vw, 34px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800); line-height: calc(1.6 + var(--cb-h-leading, 0)); letter-spacing: calc(-.02em + var(--cb-h-track, 0em)); text-align: ${p.align}; margin-bottom: 34px; }
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
          font-size: calc(clamp(34px, 5.5vw, 56px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800); line-height: calc(1 + var(--cb-h-leading, 0));
          letter-spacing: calc(-.03em + var(--cb-h-track, 0em)); font-variant-numeric: tabular-nums; ${numColor}
        }
        ${p.numColor === 'gradient' ? `
        ${c.pin([s + ' .cb-st__num'], 'var(--cb-brand)')}
        @supports ((background-clip: text) or (-webkit-background-clip: text)) {
          ${s} .cb-st__num { -webkit-text-fill-color: transparent !important; }
        }` : ''}
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
        ].concat(CB.ctaFields({ help: 'Leave empty for no button on this milestone.' })),
        value: [
          { date: 'Week 1', title: 'Discovery', text: 'Audit what exists, agree the shape of the problem and write down what success looks like.' },
          { date: 'Week 2–3', title: 'Design system', text: 'Tokens, type scale and the first set of components, reviewed in the browser rather than a static mockup.' },
          { date: 'Week 4–6', title: 'Build', text: 'Components go into the page builder as self-contained blocks your team can edit without us.' },
          { date: 'Week 7', title: 'Hand-off', text: 'Documentation, an accessibility pass and a recorded walkthrough of every block.' }
        ]
      },

      { t: 'section', label: 'Button' },
      { k: 'btnText', t: 'text', label: 'Button label', value: '',
        help: 'Sits after the last milestone. Leave empty for no button.' },
      { k: 'btnUrl', t: 'text', label: 'Button link', value: '#' },
      { k: 'btnAlign', t: 'select', label: 'Button alignment', value: 'center',
        options: [['center', 'Centre'], ['start', 'Left']] },

      { t: 'section', label: 'Style' },
      { k: 'layout', t: 'select', label: 'Layout', value: 'alternating', options: [['alternating', 'Alternating'], ['left', 'Single column']] },
      { k: 'marker', t: 'select', label: 'Marker', value: 'dot', options: [['dot', 'Dot'], ['number', 'Number'], ['ring', 'Ring']] },
      { k: 'reveal', t: 'toggle', label: 'Reveal on scroll', value: true },
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
              ${c.actions([{ text: it.btnText, url: it.btnUrl }], { tight: true })}
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
            ${c.actions([{ text: p.btnText, url: p.btnUrl }], { align: p.btnAlign === 'start' ? '' : 'center' })}
          </div>
        </section>`);

      var markerCss = {
        dot: `background: var(--cb-brand); box-shadow: 0 0 0 4px color-mix(in srgb, var(--cb-brand) 18%, transparent);`,
        ring: `background: var(--cb-surface); border: 3px solid var(--cb-brand);`,
        number: `background: var(--cb-brand); color: var(--cb-on-brand); font-size: .82em; font-weight: 700;`
      }[p.marker] || '';

      var css = `
        ${s}.cb-tl { background: ${c.bg(p)}; padding-block: ${c.num(p.pad, 80)}px; }
        ${s} .cb-tl__title { font-size: calc(clamp(26px, 3.6vw, 38px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800); line-height: calc(1.6 + var(--cb-h-leading, 0)); letter-spacing: calc(-.02em + var(--cb-h-track, 0em)); margin-bottom: 44px; ${alt ? 'text-align: center;' : ''} }
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
        ${s} .cb-tl__date { font-size: calc(.78em * var(--cb-eyebrow-scale, 1)); font-weight: var(--cb-eyebrow-weight, 700); letter-spacing: calc(.1em + var(--cb-eyebrow-track, 0em)); text-transform: uppercase; color: var(--cb-brand); }
        ${s} .cb-tl__t { font-size: 1.15em; font-weight: var(--cb-h-weight, 730); margin-top: 6px; letter-spacing: calc(-.01em + var(--cb-h-track, 0em)); }
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
      {
        k: 'bgMode', t: 'select', label: 'Background', value: 'band',
        options: CB.BG_MODES, legacy: { key: 'bg', value: 'custom' },
        help: 'Following the scheme is what lets one Light/Dark setting reach this block.'
      },
      { k: 'bg', t: 'color', label: 'Background colour', value: '#f7f4f1', when: { bgMode: ['custom'] } },
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
        ${s}.cb-pr { background: ${c.bg(p)}; padding-block: ${c.num(p.pad, 88)}px; }
        ${s} .cb-pr__head { text-align: center; max-width: 640px; margin: 0 auto 44px; }
        ${s} .cb-pr__title { font-size: calc(clamp(26px, 3.6vw, 38px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800); letter-spacing: calc(-.02em + var(--cb-h-track, 0em)); line-height: calc(1.15 + var(--cb-h-leading, 0)); }
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
          font-size: calc(.72em * var(--cb-eyebrow-scale, 1)); font-weight: var(--cb-eyebrow-weight, 700); letter-spacing: calc(.06em + var(--cb-eyebrow-track, 0em)); text-transform: uppercase;
          padding: 5px 13px; border-radius: 999px; white-space: nowrap;
        }
        ${s} .cb-pr__name { font-size: 1.15em; font-weight: 750; }
        ${s} .cb-pr__blurb { color: var(--cb-muted); font-size: .92em; }
        ${s} .cb-pr__price { display: flex; align-items: baseline; gap: 3px; margin-top: 6px; flex-wrap: wrap; }
        ${s} .cb-pr__cur { font-size: 1.3em; font-weight: 700; align-self: flex-start; margin-top: .35em; }
        ${s} .cb-pr__amount { font-size: calc(2.9em * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800); letter-spacing: calc(-.03em + var(--cb-h-track, 0em)); line-height: calc(1 + var(--cb-h-leading, 0)); font-variant-numeric: tabular-nums; }
        ${s} .cb-pr__period { color: var(--cb-muted); font-size: .9em; margin-left: 4px; }
        ${s} .cb-pr__cta {
          margin-top: 10px; width: 100%;
          background: var(--cb-subtle); text-decoration: none;
          border: 1px solid var(--cb-border);
        }
        ${s} .cb-pr__plan.is-featured .cb-pr__cta {
          background: var(--cb-brand); border-color: var(--cb-brand);
          box-shadow: 0 8px 20px -10px var(--cb-brand);
        }
        ${c.pin([s + ' .cb-pr__cta'], 'var(--cb-ink)')}
        ${c.pin([s + ' .cb-pr__plan.is-featured .cb-pr__cta'], 'var(--cb-on-brand)')}
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

  /* --------------------------------------------------------------------- */
  /* Webinar Library                                                        */
  /* --------------------------------------------------------------------- */

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* Built from the string parts rather than through Date. new Date("2026-08-25")
     is parsed as UTC midnight, so anyone west of Greenwich renders it as the
     24th — an off-by-one that only shows up for some of your visitors. */
  function niceDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || '').trim());
    if (!m) return String(iso || '').trim();   // "Coming soon" and the like pass through
    return MONTHS[+m[2] - 1] + ' ' + (+m[3]) + ', ' + m[1];
  }
  function isoDate(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || '').trim());
    return m ? m[0] : '';
  }

  /* Ordered here, at build time, so the exported markup is already in sequence
     and needs no script to stay that way — the same reason nothing else in this
     library sorts in the browser. */
  function byDate(list, mode) {
    if (mode === 'manual') return list.slice();
    return list
      .map(function (it, i) { return { it: it, i: i, k: isoDate(it.date) }; })
      .sort(function (a, b) {
        if (a.k === b.k) return a.i - b.i;   // same day keeps the order you typed
        if (!a.k) return 1;                  // undated sink to the bottom either way
        if (!b.k) return -1;
        return mode === 'old' ? (a.k < b.k ? -1 : 1) : (a.k > b.k ? -1 : 1);
      })
      .map(function (x) { return x.it; });
  }

  CB.register({
    id: 'webinar-grid',
    name: 'Webinar Library',
    category: CAT,
    icon: '⊡',
    blurb: 'An archive of recorded and upcoming sessions, newest first. The order is worked out when the code is generated rather than in the browser, so it survives an editor that strips scripts.',
    props: [
      { t: 'section', label: 'Heading' },
      { k: 'title', t: 'text', label: 'Section title', value: 'Webinars' },
      { k: 'sub', t: 'textarea', label: 'Section intro', value: 'Watch a recorded session, or register for one that has not aired yet.' },
      { k: 'align', t: 'select', label: 'Heading alignment', value: 'left', options: [['left', 'Left'], ['center', 'Center']] },

      { t: 'section', label: 'Webinars' },
      {
        k: 'sort', t: 'select', label: 'Order', value: 'new',
        options: [['new', 'Newest first'], ['old', 'Oldest first'], ['manual', 'Exactly as listed below']],
        help: 'Ordered by the date on each webinar. Ones with no date go last.'
      },
      {
        k: 'feature', t: 'toggle', label: 'Feature the first one', value: true,
        help: 'Gives whichever webinar sorts to the top a wider image and a row of its own.'
      },
      {
        k: 'items', t: 'list', label: 'Webinars', itemLabel: 'title',
        fields: [
          { k: 'image', t: 'image', label: 'Thumbnail', value: CB.ph(800, 450, '', '#96694c', '#2b241f') },
          { k: 'alt', t: 'text', label: 'Alt text', value: '' },
          { k: 'label', t: 'text', label: 'Label', value: '', help: 'Small line above the title — “On demand”, “Upcoming”, a product family.' },
          { k: 'title', t: 'text', label: 'Title', value: 'Webinar title' },
          { k: 'date', t: 'date', label: 'Date', value: '', help: 'What the list is ordered by. Free text works too, but only dated ones can sort.' },
          { k: 'text', t: 'textarea', label: 'Summary', value: 'One or two sentences on what the session covers.' },
          { k: 'btnText', t: 'text', label: 'Button label', value: 'Watch now' },
          { k: 'btnUrl', t: 'text', label: 'Button link', value: '#' }
        ],
        value: [
          {
            image: CB.ph(800, 450, '', '#96694c', '#2b241f'), alt: '',
            label: 'On demand', title: 'Sizing conductors for high-density data center builds',
            date: '2026-08-12',
            text: 'Ampacity, derating and conduit fill on projects where the rack layout is still moving.',
            btnText: 'Watch now', btnUrl: '#'
          },
          {
            image: CB.ph(800, 450, '', '#6f4c37', '#141210'), alt: '',
            label: 'On demand', title: 'What changed in the 2026 code cycle',
            date: '2026-06-24',
            text: 'The revisions most likely to affect how you specify and install, with the reasoning behind them.',
            btnText: 'Watch now', btnUrl: '#'
          },
          {
            image: CB.ph(800, 450, '', '#2b241f', '#4a443e'), alt: '',
            label: 'On demand', title: 'Reducing installed cost without cutting corners',
            date: '2026-05-06',
            text: 'Where labour actually goes on a commercial pull, and the decisions that move the number.',
            btnText: 'Watch now', btnUrl: '#'
          },
          {
            image: CB.ph(800, 450, '', '#4a443e', '#96694c'), alt: '',
            label: 'On demand', title: 'Specifying for harsh and wet locations',
            date: '2026-03-18',
            text: 'Jacket compounds, temperature ratings and the failure modes that show up years later.',
            btnText: 'Watch now', btnUrl: '#'
          }
        ]
      },

      { t: 'section', label: 'Layout' },
      { k: 'cols', t: 'range', label: 'Columns (desktop)', min: 2, max: 4, step: 1, value: 3 },
      { k: 'gap', t: 'range', label: 'Gap', min: 8, max: 48, step: 4, unit: 'px', value: 28 },
      { k: 'ratio', t: 'select', label: 'Thumbnail ratio', value: '16/9', options: [['16/9', '16 : 9'], ['4/3', '4 : 3'], ['3/2', '3 : 2'], ['none', 'No thumbnails']] },

      { t: 'section', label: 'Style' },
      { k: 'variant', t: 'select', label: 'Card style', value: 'outline', options: [['elevated', 'Elevated'], ['outline', 'Outlined'], ['flat', 'Flat / borderless']] },
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
      var showImg = p.ratio !== 'none';
      var items = byDate((p.items || []).filter(Boolean), p.sort);
      var lead = p.feature && items.length ? items[0] : null;
      var rest = lead ? items.slice(1) : items;

      function dateHtml(it, cls) {
        if (!it.date) return '';
        var iso = isoDate(it.date);
        return '<p class="' + cls + '">' + (iso
          ? '<time datetime="' + c.attr(iso) + '">' + c.esc(niceDate(it.date)) + '</time>'
          : c.esc(String(it.date).trim())) + '</p>';
      }
      function media(it, cls) {
        if (!showImg || !it.image) return '';
        return '<div class="' + cls + '"><img src="' + c.url(it.image) + '" alt="' +
               c.attr(it.alt) + '" loading="lazy" decoding="async"></div>';
      }

      var featureHtml = lead ? c.dedent(`
        <article class="cb-wb__feature">
          ${media(lead, 'cb-wb__featureMedia')}
          <div class="cb-wb__featureBody">
            ${lead.label ? '<span class="cb-wb__label">' + c.esc(lead.label) + '</span>' : ''}
            ${lead.title ? '<h3 class="cb-wb__featureTitle">' + c.rich(lead.title) + '</h3>' : ''}
            ${dateHtml(lead, 'cb-wb__date')}
            ${lead.text ? '<p class="cb-wb__x">' + c.rich(lead.text) + '</p>' : ''}
            ${c.actions([{ text: lead.btnText, url: lead.btnUrl }], { tight: true })}
          </div>
        </article>`) : '';

      var cards = rest.map(function (it) {
        return c.dedent(`
          <li class="cb-wb__card">
            <article class="cb-wb__inner">
              ${media(it, 'cb-wb__media')}
              <div class="cb-wb__body">
                ${it.label ? '<span class="cb-wb__label">' + c.esc(it.label) + '</span>' : ''}
                ${it.title ? '<h3 class="cb-wb__t">' + c.rich(it.title) + '</h3>' : ''}
                ${dateHtml(it, 'cb-wb__date')}
                ${it.text ? '<p class="cb-wb__x">' + c.rich(it.text) + '</p>' : ''}
                ${c.actions([{ text: it.btnText, url: it.btnUrl }], { tight: true })}
              </div>
            </article>
          </li>`);
      }).join('\n');

      var html = c.dedent(`
        <section class="${c.cls} cb-wb">
          <div class="cb-wrap">
            ${(p.title || p.sub) ? `<header class="cb-wb__head">
              ${p.title ? '<h2 class="cb-wb__title">' + c.rich(p.title) + '</h2>' : ''}
              ${p.sub ? '<p class="cb-wb__sub">' + c.rich(p.sub) + '</p>' : ''}
            </header>` : ''}
        ${c.indent(featureHtml, 4)}
            ${rest.length ? `<ul class="cb-wb__grid">
        ${c.indent(cards, 6)}
            </ul>` : ''}
          </div>
        </section>`);

      var variantCss = {
        elevated: `${s} .cb-wb__inner { background: var(--cb-surface); box-shadow: 0 12px 30px -22px rgba(20,18,16,.5); border: 1px solid transparent; }
                   ${s} .cb-wb__feature { background: var(--cb-surface); box-shadow: 0 16px 40px -28px rgba(20,18,16,.5); border: 1px solid transparent; }`,
        outline: `${s} .cb-wb__inner { background: var(--cb-surface); border: 1px solid var(--cb-border); }
                  ${s} .cb-wb__feature { background: var(--cb-surface); border: 1px solid var(--cb-border); }`,
        flat: `${s} .cb-wb__inner { background: transparent; border: 1px solid transparent; }
               ${s} .cb-wb__feature { background: transparent; border: 1px solid transparent; }
               ${s} .cb-wb__body, ${s} .cb-wb__featureBody { padding-inline: 0; }`
      }[p.variant] || '';

      var css = `
        ${s}.cb-wb { background: ${c.bg(p)}; padding-block: ${c.num(p.pad, 80)}px; }
        ${s} .cb-wb__head { margin-bottom: 34px; max-width: 660px; ${p.align === 'center' ? 'margin-inline: auto; text-align: center;' : ''} }
        ${s} .cb-wb__title { font-size: calc(clamp(26px, 3.6vw, 38px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800); letter-spacing: calc(-.02em + var(--cb-h-track, 0em)); line-height: calc(1.15 + var(--cb-h-leading, 0)); }
        ${s} .cb-wb__sub { color: var(--cb-muted); margin-top: 10px; }

        /* The featured row is two columns rather than a full-bleed banner, so
           the newest session leads without swallowing the fold. */
        ${s} .cb-wb__feature {
          display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
          gap: ${c.num(p.gap, 28)}px; align-items: center; overflow: hidden;
          border-radius: var(--cb-radius); margin-bottom: ${c.num(p.gap, 28)}px;
        }
        ${s} .cb-wb__featureMedia { background: var(--cb-subtle); }
        ${s} .cb-wb__featureMedia img { width: 100%; ${showImg ? 'aspect-ratio: ' + p.ratio + ';' : ''} object-fit: cover; display: block; }
        ${s} .cb-wb__featureBody { display: flex; flex-direction: column; gap: 10px; padding: 26px 26px 26px 4px; }
        ${s} .cb-wb__featureTitle {
          font-size: calc(clamp(21px, 2.4vw, 28px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 750);
          line-height: calc(1.25 + var(--cb-h-leading, 0)); letter-spacing: calc(-.015em + var(--cb-h-track, 0em));
        }

        ${s} .cb-wb__grid {
          display: grid; gap: ${c.num(p.gap, 28)}px;
          grid-template-columns: repeat(${c.clamp(c.num(p.cols, 3), 2, 4)}, minmax(0, 1fr));
        }
        ${s} .cb-wb__inner {
          height: 100%; overflow: hidden; display: flex; flex-direction: column;
          border-radius: var(--cb-radius);
          transition: transform .3s cubic-bezier(.2,.7,.3,1), box-shadow .3s ease, border-color .3s ease;
        }
        ${variantCss}
        ${s} .cb-wb__card:hover .cb-wb__inner { transform: translateY(-4px); box-shadow: 0 26px 46px -30px rgba(20,18,16,.45); }
        ${s} .cb-wb__media { overflow: hidden; background: var(--cb-subtle); }
        ${s} .cb-wb__media img {
          width: 100%; ${showImg ? 'aspect-ratio: ' + p.ratio + ';' : ''} object-fit: cover; display: block;
          transition: transform .5s cubic-bezier(.2,.7,.3,1);
        }
        ${s} .cb-wb__card:hover .cb-wb__media img { transform: scale(1.05); }
        ${s} .cb-wb__body { display: flex; flex-direction: column; gap: 9px; padding: 22px; flex: 1 1 auto; }
        ${s} .cb-wb__label {
          align-self: flex-start; font-size: calc(.72em * var(--cb-eyebrow-scale, 1)); font-weight: var(--cb-eyebrow-weight, 700);
          letter-spacing: calc(.1em + var(--cb-eyebrow-track, 0em)); text-transform: uppercase; color: var(--cb-brand);
        }
        ${s} .cb-wb__t {
          font-size: 1.12em; font-weight: var(--cb-h-weight, 730);
          line-height: calc(1.3 + var(--cb-h-leading, 0)); letter-spacing: calc(-.01em + var(--cb-h-track, 0em));
        }
        ${s} .cb-wb__date { color: var(--cb-muted); font-size: .86em; font-variant-numeric: tabular-nums; }
        ${s} .cb-wb__x { color: var(--cb-muted); font-size: .96em; }
        /* Buttons pinned to the bottom edge so a row of cards lines up however
           long the summaries run. */
        ${s} .cb-wb__body .cb-actions { margin-top: auto; padding-top: 6px; }

        @media (max-width: 900px) {
          ${s} .cb-wb__feature { grid-template-columns: 1fr; }
          ${s} .cb-wb__featureBody { padding: 0 22px 24px; }
          ${s} .cb-wb__grid { grid-template-columns: repeat(${Math.min(2, c.clamp(c.num(p.cols, 3), 2, 4))}, minmax(0, 1fr)); }
        }
        @media (max-width: 560px) { ${s} .cb-wb__grid { grid-template-columns: 1fr; } }`;

      return { html: html, css: css, js: '' };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Kinetic Text Reveal                                                    */
  /*                                                                        */
  /* A statement that assembles itself as it scrolls in. The splitting is    */
  /* done here, when the code is generated, rather than by a script in the   */
  /* browser — which is the whole reason this can be a CSS-only effect where */
  /* every library version of it needs JavaScript.                          */
  /*                                                                        */
  /* Splitting text into spans is also how these effects wreck a screen     */
  /* reader, which will happily read a headline out one letter at a time.    */
  /* So the heading carries the whole sentence as its label and the split    */
  /* pieces are hidden from the accessibility tree entirely.                */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'kinetic-text',
    name: 'Kinetic Text Reveal',
    category: CAT,
    icon: '✶',
    blurb: 'A statement that assembles as it scrolls in, by line, word or letter. Zero JS — the split happens when the code is written.',
    props: [
      { t: 'section', label: 'Words' },
      { k: 'eyebrow', t: 'text', label: 'Eyebrow', value: '' },
      {
        k: 'text', t: 'textarea', label: 'Statement',
        value: 'Built to be pulled,\nrated to be trusted.',
        help: 'Each new line is its own line on the page — that is what “by line” staggers.'
      },
      { k: 'sub', t: 'text', label: 'Supporting line', value: '' },

      { t: 'section', label: 'Motion' },
      {
        k: 'unit', t: 'select', label: 'Reveal by', value: 'word',
        options: [['line', 'Line'], ['word', 'Word'], ['char', 'Letter']],
        help: 'Letter suits a short statement. On a long one it is a lot of movement at once.'
      },
      {
        k: 'from', t: 'select', label: 'Coming from', value: 'up',
        options: [['up', 'Below'], ['down', 'Above'], ['left', 'The left'], ['right', 'The right'], ['none', 'Nowhere — fade only']]
      },
      { k: 'distance', t: 'range', label: 'Travel', min: 0, max: 80, step: 2, unit: 'px', value: 26 },
      { k: 'blur', t: 'range', label: 'Blur it starts with', min: 0, max: 20, step: 1, unit: 'px', value: 6 },
      {
        k: 'stagger', t: 'range', label: 'Stagger', min: 0, max: 10, step: 1, unit: '', value: 4,
        help: 'How far apart the pieces arrive. Spread across the scroll, and capped so the last piece ' +
              'always finishes while the block is still on screen.'
      },

      { t: 'section', label: 'Style' },
      {
        k: '_heading', t: 'select', label: 'Heading level', value: '2',
        options: [['2', 'H2 — top-level section'], ['3', 'H3 — nested'], ['p', 'Not a heading']]
      },
      { k: 'size', t: 'range', label: 'Size', min: 20, max: 96, step: 2, unit: 'px', value: 46 },
      { k: 'align', t: 'select', label: 'Alignment', value: 'left', options: [['left', 'Left'], ['center', 'Centre']] },
      { k: 'measure', t: 'range', label: 'Line length', min: 12, max: 40, step: 1, unit: 'ch', value: 22 },
      { k: 'btnText', t: 'text', label: 'Button label', value: '',
        help: 'Sits under the statement. Leave empty for no button.' },
      { k: 'btnUrl', t: 'text', label: 'Button link', value: '#' },
      {
        k: 'bgMode', t: 'select', label: 'Background', value: 'page',
        options: CB.BG_MODES, legacy: { key: 'bg', value: 'custom' },
        help: 'Following the scheme is what lets one Light/Dark setting reach this block.'
      },
      { k: 'bg', t: 'color', label: 'Background colour', value: '#ffffff', when: { bgMode: ['custom'] } },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 16, max: 200, step: 4, unit: 'px', value: 96 }
    ],

    render: function (p, c) {
      var s = c.s;
      var raw = String(p.text == null ? '' : p.text);
      var lines = raw.split('\n').filter(function (l) { return l.trim(); });
      if (!lines.length) lines = [''];

      var tag = p._heading === 'p' ? 'p' : 'h' + (p._heading === '3' ? 3 : 2);
      var n = 0;

      /* One span per piece, numbered, so the CSS can shift each one's slice of
         the scroll without a rule per index. */
      function piece(txt, joinAfter) {
        return '<span class="cb-kt__u" style="--i:' + (n++) + '">' + c.esc(txt) + '</span>' + (joinAfter || '');
      }

      var body = lines.map(function (line) {
        var inner;
        if (p.unit === 'line') {
          inner = piece(line);
        } else if (p.unit === 'char') {
          /* Words stay whole so a letter reveal cannot break one across a line
             break, which is what makes these effects look broken on a phone. */
          inner = line.split(/\s+/).filter(Boolean).map(function (w) {
            return '<span class="cb-kt__w">' +
                   w.split('').map(function (ch) { return piece(ch); }).join('') +
                   '</span>';
          }).join(' ');
        } else {
          inner = line.split(/\s+/).filter(Boolean).map(function (w) { return piece(w); }).join(' ');
        }
        return '<span class="cb-kt__line">' + inner + '</span>';
      }).join('');

      /* Capped so the last piece still finishes inside the block's own pass
         through the viewport. A long statement with a generous stagger would
         otherwise leave its final words arriving after you have scrolled past. */
      var SPREAD = 34;
      var step = n > 1 ? Math.min(c.num(p.stagger, 4), SPREAD / (n - 1)) : 0;

      var off = {
        up: '0, ' + c.num(p.distance, 26) + 'px',
        down: '0, -' + c.num(p.distance, 26) + 'px',
        left: '-' + c.num(p.distance, 26) + 'px, 0',
        right: c.num(p.distance, 26) + 'px, 0',
        none: '0, 0'
      }[p.from || 'up'] || ('0, ' + c.num(p.distance, 26) + 'px');

      var html = c.dedent(`
        <section class="${c.cls} cb-kt">
          <div class="cb-wrap">
            ${p.eyebrow ? '<p class="cb-kt__eyebrow">' + c.esc(p.eyebrow) + '</p>' : ''}
            <${tag} class="cb-kt__text" aria-label="${c.attr(lines.join(' '))}">
              <span aria-hidden="true">${body}</span>
            </${tag}>
            ${p.sub ? '<p class="cb-kt__sub">' + c.rich(p.sub) + '</p>' : ''}
            ${c.actions([{ text: p.btnText, url: p.btnUrl }], { align: p.align === 'center' ? 'center' : '' })}
          </div>
        </section>`);

      var css = `
        ${s}.cb-kt { background: ${c.bg(p)}; padding-block: ${c.num(p.pad, 96)}px; }
        ${s} .cb-kt .cb-wrap { text-align: ${p.align === 'center' ? 'center' : 'left'}; }
        ${s} .cb-kt__eyebrow {
          font-size: calc(.75em * var(--cb-eyebrow-scale, 1)); font-weight: var(--cb-eyebrow-weight, 700);
          letter-spacing: calc(.12em + var(--cb-eyebrow-track, 0em)); text-transform: uppercase;
          color: var(--cb-brand); margin-bottom: 16px;
        }
        ${s} .cb-kt__text {
          font-size: calc(${c.num(p.size, 46)}px * var(--cb-h-scale, 1));
          font-weight: var(--cb-h-weight, 800);
          line-height: calc(1.1 + var(--cb-h-leading, 0));
          letter-spacing: calc(-.025em + var(--cb-h-track, 0em));
          max-width: ${c.num(p.measure, 22)}ch;
          ${p.align === 'center' ? 'margin-inline: auto;' : ''}
          text-wrap: balance;
        }
        ${s} .cb-kt__line { display: block; }
        ${s} .cb-kt__w { display: inline-block; white-space: nowrap; }
        /* Inline-block so a transform applies at all, and a hair of vertical
           padding so descenders are not clipped while the piece is moving. */
        ${s} .cb-kt__u { display: inline-block; padding-block: .06em; will-change: transform, opacity, filter; }
        ${s} .cb-kt__sub {
          color: var(--cb-muted); margin-top: 18px; max-width: 56ch;
          ${p.align === 'center' ? 'margin-inline: auto;' : ''}
        }

        /* Read at rest. The animation only exists where a scroll timeline does,
           and its finished state is the readable one — so a browser without
           them, or a harness that strips animation-timeline and leaves this
           running on a zero-length time timeline, lands on legible text rather
           than on nothing. */
        @keyframes cb-kt-${c.id} {
          from { opacity: 0; transform: translate(${off}); filter: blur(${c.num(p.blur, 6)}px); }
          to { opacity: 1; transform: none; filter: blur(0); }
        }
        @supports (animation-timeline: view()) {
          ${s} .cb-kt__u {
            animation: cb-kt-${c.id} linear both;
            animation-timeline: view();
            animation-range: entry calc(14% + var(--i) * ${step}%) entry calc(62% + var(--i) * ${step}%);
          }
        }`;

      return { html: html, css: css, js: '' };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Table                                                                  */
  /*                                                                        */
  /* One table, not one per purpose. A product comparison, a spec sheet and */
  /* a plain grid of figures differ in what is in the cells, not in what a  */
  /* table is — so the comparison is a use of this rather than a component  */
  /* of its own. That also drops the four-column cap the comparison had,    */
  /* which only existed because its cells were fixed v1..v4 fields.         */
  /*                                                                        */
  /* A real <table>. The tie between a row label and the cell under a       */
  /* column heading is the whole content, and only a table hands that to a  */
  /* screen reader intact.                                                  */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'table',
    name: 'Table',
    category: CAT,
    icon: '▤',
    blurb: 'Paste cells straight from a spreadsheet. Sticky row labels, optional product headers, and a zero-JS “only show differences” filter.',
    props: [
      { t: 'section', label: 'Heading' },
      { k: 'eyebrow', t: 'text', label: 'Eyebrow', value: '' },
      { k: 'title', t: 'text', label: 'Section title', value: '' },
      { k: 'sub', t: 'text', label: 'Standfirst', value: '' },

      { t: 'section', label: 'Table' },
      {
        /* Ships empty. Sample rows in a table are not the same as sample copy
           in a hero: the whole content is somebody's own data, so anything here
           is only ever something to delete first — and a table nobody cleared
           properly ships a cable spec into an unrelated page. Import is the
           first thing offered instead. */
        k: 'rows', t: 'grid', label: 'Cells', columnsKey: 'columns',
        help: 'Import a block of cells from Excel or Sheets, or type straight into the grid. ' +
              'Pasting into a cell fills down and across from there, adding rows and columns as it needs them.',
        value: [
          { group: '', cells: ['', '', ''] },
          { group: '', cells: ['', '', ''] },
          { group: '', cells: ['', '', ''] }
        ]
      },
      {
        /* Edited inside the grid, which owns the column count — this exists so
           the extras have somewhere to live and so a saved project carries
           them. Hidden from the panel because two places to add a column is
           one place too many. */
        k: 'columns', t: 'columns', label: 'Columns',
        fields: [
          { k: 'label', t: 'text', label: 'Heading', value: '' },
          { k: 'tagline', t: 'text', label: 'Sub-heading', value: '' },
          { k: 'badge', t: 'text', label: 'Flag', value: '', help: 'A short marker above the heading — "Most specified", "New".' },
          { k: 'featured', t: 'toggle', label: 'Highlight this column', value: false },
          { k: 'image', t: 'image', label: 'Image', value: '' },
          { k: 'alt', t: 'text', label: 'Alt text', value: '' },
          { k: 'btnText', t: 'text', label: 'Button label', value: '', help: 'Sits under this column. Leave empty for no button.' },
          { k: 'btnUrl', t: 'text', label: 'Button link', value: '#' }
        ],
        value: [
          { label: '', tagline: '', badge: '', featured: false, image: '', alt: '', btnText: '', btnUrl: '#' },
          { label: '', tagline: '', badge: '', featured: false, image: '', alt: '', btnText: '', btnUrl: '#' },
          { label: '', tagline: '', badge: '', featured: false, image: '', alt: '', btnText: '', btnUrl: '#' }
        ]
      },

      { t: 'section', label: 'Reading' },
      {
        k: 'rowHeader', t: 'toggle', label: 'First column labels the row', value: true,
        help: 'Makes it a row header rather than a cell, so a screen reader reads it with every ' +
              'value across that row — and it stays put while the table scrolls sideways.'
      },
      {
        k: 'marks', t: 'toggle', label: 'Yes and No become a tick and a dash', value: true,
        help: 'A column is understood by shape long before it is read. The word still goes to a screen reader.'
      },
      {
        k: 'differences', t: 'toggle', label: 'Offer "only show differences"', value: true,
        help: 'A checkbox that hides every row where all the columns say the same thing. ' +
              'It appears only when there is at least one such row, and needs no JavaScript.'
      },
      {
        k: 'align', t: 'select', label: 'Number alignment', value: 'auto',
        options: [['auto', 'Right-align columns that are mostly numbers'], ['left', 'Everything left']]
      },

      { t: 'section', label: 'Style' },
      { k: 'zebra', t: 'toggle', label: 'Banded rows', value: true },
      { k: 'showImages', t: 'toggle', label: 'Show column images', value: false },
      {
        k: 'bgMode', t: 'select', label: 'Background', value: 'page',
        options: CB.BG_MODES, legacy: { key: 'bg', value: 'custom' },
        help: 'Following the scheme is what lets one Light/Dark setting reach this block.'
      },
      { k: 'bg', t: 'color', label: 'Background colour', value: '#ffffff', when: { bgMode: ['custom'] } },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 16, max: 140, step: 4, unit: 'px', value: 72 }
    ],

    render: function (p, c) {
      var s = c.s;
      var cols = (p.columns || []).filter(Boolean);
      var rows = (p.rows || []).filter(function (r) {
        return r && ((r.cells || []).some(function (x) { return String(x || '').trim(); }) || r.group);
      });
      var n = cols.length;

      if (!n || !rows.length) {
        return {
          html: '<section class="' + c.cls + ' cb-tbl"><div class="cb-wrap">' +
                '<p class="cb-tbl__empty">This table is empty. Import a block of cells from a ' +
                'spreadsheet, or type into the grid.</p></div></section>',
          css: s + ' .cb-tbl__empty { color: var(--cb-muted); padding-block: 40px; }',
          js: ''
        };
      }

      var rowHead = !!p.rowHeader;
      var chk = c.uid('tbl');
      function at(r, i) { return String((r.cells || [])[i] == null ? '' : (r.cells || [])[i]).trim(); }

      /* Yes and no earn a mark rather than the word, because a column is read
         by shape first. The word still goes to a screen reader, which gets
         nothing from a glyph. Detected from the value, so a pasted spreadsheet
         needs no extra column saying what kind of row this is. */
      function cell(v) {
        var t = String(v == null ? '' : v).trim();
        if (p.marks) {
          if (/^(yes|y|true|included|standard)$/i.test(t)) {
            return '<span class="cb-tbl__yes" aria-hidden="true">&#10003;</span><span class="cb-sr">Yes</span>';
          }
          if (/^(no|n|false|none|not available)$/i.test(t)) {
            return '<span class="cb-tbl__no" aria-hidden="true">&#8211;</span><span class="cb-sr">No</span>';
          }
        }
        if (!t) return '<span class="cb-tbl__no" aria-hidden="true">&#8211;</span><span class="cb-sr">Not stated</span>';
        return c.esc(t);
      }

      /* Decided here, where every value is known, rather than in a script an
         editor might strip — which is the whole reason the filter can be a
         checkbox. The label column is not part of the comparison: it differs
         on every row by definition. */
      var firstData = rowHead ? 1 : 0;
      function same(r) {
        if (n - firstData < 2) return false;
        var first = at(r, firstData).toLowerCase();
        for (var i = firstData + 1; i < n; i++) {
          if (at(r, i).toLowerCase() !== first) return false;
        }
        return true;
      }
      var offerFilter = p.differences && rows.some(function (r) {
        return (r.cells || []).length && same(r) && !r.group0;
      });

      /* A column of figures reads far better right-aligned, and asking somebody
         to set that per column is asking them to do arithmetic the values
         already answer. Mostly-numeric wins it; a stray "n/a" does not lose it. */
      var numeric = [];
      for (var ci = 0; ci < n; ci++) {
        if (p.align === 'left' || (rowHead && ci === 0)) { numeric.push(false); continue; }
        var seen = 0, num = 0;
        rows.forEach(function (r) {
          var v = at(r, ci);
          if (!v) return;
          seen++;
          if (/^[-+]?[$£€]?\s?[\d,]+(\.\d+)?\s?[%a-zA-Z°µ/]{0,6}$/.test(v)) num++;
        });
        numeric.push(seen >= 2 && num / seen >= 0.7);
      }

      var head = cols.map(function (col, i) {
        var corner = rowHead && i === 0;
        if (corner && !col.label) return '<td class="cb-tbl__corner"></td>';
        var img = p.showImages && col.image
          ? '<img class="cb-tbl__img" src="' + c.url(col.image) + '" alt="' + c.attr(col.alt) + '" loading="lazy" decoding="async">'
          : '';
        return c.dedent(`
          <th scope="col" class="cb-tbl__col${col.featured ? ' is-featured' : ''}${corner ? ' cb-tbl__corner' : ''}${numeric[i] ? ' is-num' : ''}">
            ${img}
            ${col.badge ? '<span class="cb-tbl__badge">' + c.esc(col.badge) + '</span>' : ''}
            <span class="cb-tbl__name">${c.esc(col.label)}</span>
            ${col.tagline ? '<span class="cb-tbl__tag">' + c.esc(col.tagline) + '</span>' : ''}
            ${c.actions([{ text: col.btnText, url: col.btnUrl }], { tight: true })}
          </th>`);
      }).join('\n');

      var body = rows.map(function (r) {
        var out = '';
        if (r.group) {
          out += '<tr class="cb-tbl__grouprow"><th scope="colgroup" colspan="' + n + '">' +
                 c.esc(r.group) + '</th></tr>\n';
        }
        if (!(r.cells || []).some(function (x) { return String(x || '').trim(); })) return out;

        var cells = '';
        for (var i = 0; i < n; i++) {
          var klass = 'cb-tbl__cell' + (cols[i] && cols[i].featured ? ' is-featured' : '') +
                      (numeric[i] ? ' is-num' : '');
          if (rowHead && i === 0) {
            cells += '<th scope="row" class="cb-tbl__rowlab">' + c.esc(at(r, 0)) + '</th>';
          } else {
            cells += '<td class="' + klass + '">' + cell(at(r, i)) + '</td>';
          }
        }
        out += '<tr' + (same(r) ? ' data-same="1"' : '') + '>' + cells + '</tr>';
        return out;
      }).join('\n');

      var html = c.dedent(`
        <section class="${c.cls} cb-tbl">
          <div class="cb-wrap">
            ${(p.eyebrow || p.title || p.sub) ? c.dedent(`
            <header class="cb-tbl__head">
              ${p.eyebrow ? '<p class="cb-tbl__eyebrow">' + c.esc(p.eyebrow) + '</p>' : ''}
              ${p.title ? '<h2 class="cb-tbl__title">' + c.rich(p.title) + '</h2>' : ''}
              ${p.sub ? '<p class="cb-tbl__sub">' + c.rich(p.sub) + '</p>' : ''}
            </header>`) : ''}
            ${offerFilter ? c.dedent(`
            <div class="cb-tbl__filter">
              <input type="checkbox" id="${chk}" class="cb-tbl__chk">
              <label for="${chk}">Only show differences</label>
            </div>`) : ''}
            <div class="cb-tbl__scroll" tabindex="0" role="region" aria-label="${c.attr(p.title || 'Table')}">
              <table class="cb-tbl__table">
                <thead>
                  <tr>
        ${c.indent(head, 20)}
                  </tr>
                </thead>
                <tbody>
        ${c.indent(body, 18)}
                </tbody>
              </table>
            </div>
          </div>
        </section>`);

      var colw = n >= 5 ? 140 : n === 4 ? 160 : 190;
      var labw = rowHead ? 140 : 0;

      var css = `
        ${s}.cb-tbl { background: ${c.bg(p)}; padding-block: ${c.num(p.pad, 72)}px; }
        ${s} .cb-tbl__head { max-width: 660px; margin-bottom: 26px; }
        ${s} .cb-tbl__eyebrow {
          font-size: calc(.75em * var(--cb-eyebrow-scale, 1)); font-weight: var(--cb-eyebrow-weight, 700);
          letter-spacing: calc(.12em + var(--cb-eyebrow-track, 0em)); text-transform: uppercase;
          color: var(--cb-brand); margin-bottom: 10px;
        }
        ${s} .cb-tbl__title {
          font-size: calc(clamp(24px, 3.4vw, 36px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800);
          line-height: calc(1.15 + var(--cb-h-leading, 0)); letter-spacing: calc(-.02em + var(--cb-h-track, 0em));
        }
        ${s} .cb-tbl__sub { color: var(--cb-muted); margin-top: 10px; }

        ${s} .cb-tbl__filter { display: flex; align-items: center; gap: 9px; margin-bottom: 14px; font-size: .9em; }
        ${s} .cb-tbl__chk { width: 16px; height: 16px; accent-color: var(--cb-brand); flex: none; }
        ${s} .cb-tbl__filter label { color: var(--cb-muted); cursor: pointer; }

        /* Horizontal, and inside its own box — never sticky to the viewport,
           which is what puts a block in the same paint layer as a host site's
           fixed header. */
        ${s} .cb-tbl__scroll { overflow-x: auto; }
        ${s} .cb-tbl__scroll:focus-visible { outline: 3px solid var(--cb-brand); outline-offset: 3px; }
        ${s} .cb-tbl__table {
          width: 100%; border-collapse: separate; border-spacing: 0;
          min-width: ${labw + (n - (rowHead ? 1 : 0)) * colw}px; text-align: left;
        }
        ${rowHead ? `
        ${s} .cb-tbl__corner, ${s} .cb-tbl__rowlab {
          position: sticky; left: 0; z-index: 1;
          background: ${c.bg(p)};
          width: ${labw}px; min-width: ${labw}px;
        }` : ''}
        ${s} .cb-tbl__col {
          vertical-align: bottom; padding: 0 16px 16px; min-width: ${colw}px;
          border-bottom: 2px solid var(--cb-border);
        }
        ${s} .cb-tbl__img { width: 100%; max-width: 130px; aspect-ratio: 4/3; object-fit: contain; margin-bottom: 10px; }
        ${s} .cb-tbl__badge {
          display: inline-block; font-size: calc(.66em * var(--cb-eyebrow-scale, 1));
          font-weight: 700; letter-spacing: .09em; text-transform: uppercase;
          color: var(--cb-on-brand); background: var(--cb-brand);
          padding: 3px 7px; border-radius: calc(var(--cb-radius) * .28); margin-bottom: 7px;
        }
        ${s} .cb-tbl__name {
          display: block; font-size: 1.02em; font-weight: var(--cb-h-weight, 730);
          line-height: calc(1.25 + var(--cb-h-leading, 0)); letter-spacing: calc(-.01em + var(--cb-h-track, 0em));
        }
        ${s} .cb-tbl__tag { display: block; font-size: .84em; color: var(--cb-muted); margin-top: 4px; font-weight: 400; }

        ${s} .cb-tbl__grouprow th {
          padding: 26px 16px 8px; text-align: left;
          font-size: calc(.72em * var(--cb-eyebrow-scale, 1)); font-weight: var(--cb-eyebrow-weight, 700);
          letter-spacing: calc(.11em + var(--cb-eyebrow-track, 0em)); text-transform: uppercase;
          color: var(--cb-muted);
        }
        ${s} .cb-tbl__rowlab {
          padding: 13px 16px 13px 0; font-weight: 600; font-size: .92em;
          border-bottom: 1px solid var(--cb-border); vertical-align: top;
        }
        ${s} .cb-tbl__cell {
          padding: 13px 16px; font-size: .92em; vertical-align: top;
          border-bottom: 1px solid var(--cb-border);
          font-variant-numeric: tabular-nums;
        }
        ${s} .cb-tbl__cell.is-num, ${s} .cb-tbl__col.is-num { text-align: right; }
        ${p.zebra ? `
        ${s} .cb-tbl__table tbody tr:nth-of-type(even):not(.cb-tbl__grouprow) .cb-tbl__cell,
        ${s} .cb-tbl__table tbody tr:nth-of-type(even):not(.cb-tbl__grouprow) .cb-tbl__rowlab {
          background: var(--cb-subtle);
        }` : ''}
        ${s} .cb-tbl__cell.is-featured, ${s} .cb-tbl__col.is-featured {
          background: color-mix(in srgb, var(--cb-brand) 7%, transparent);
        }
        ${s} .cb-tbl__col.is-featured { border-bottom-color: var(--cb-brand); }
        ${s} .cb-tbl__yes { color: var(--cb-brand); font-weight: 700; }
        ${s} .cb-tbl__no { color: var(--cb-muted); }

        /* The whole reason the filter can be a checkbox: which rows are
           identical is settled when the code is written, not in the browser. */
        ${s} .cb-tbl__chk:checked ~ .cb-tbl__scroll tr[data-same="1"] { display: none; }

        @media (max-width: 700px) {
          ${rowHead ? `${s} .cb-tbl__corner, ${s} .cb-tbl__rowlab { width: 116px; min-width: 116px; }` : ''}
          ${s} .cb-tbl__rowlab { font-size: .86em; padding-right: 12px; }
          ${s} .cb-tbl__cell { font-size: .86em; padding: 11px 12px; }
        }`;

      return { html: html, css: css, js: '' };
    }
  });
})();
