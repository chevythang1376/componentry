/* ============================================================================
   Modern layout — bento grid, sticky stacking cards

   Both are deliberately JavaScript-free. The conformance matrix showed that
   GrapesJS, DOMPurify at defaults and wp_kses_post all strip <script> while
   keeping <style>, so anything built in pure CSS keeps working on paths where
   JS-driven blocks go inert.
   ========================================================================== */
(function () {
  'use strict';

  var CAT = 'Modern Layout';

  /* --------------------------------------------------------------------- */
  /* Bento Grid                                                             */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'bento-grid',
    name: 'Bento Grid',
    category: CAT,
    icon: '▤',
    blurb: 'Asymmetric tile layout with mixed spans and per-tile tones. Collapses to a single readable column on mobile.',
    props: [
      { t: 'section', label: 'Heading' },
      { k: 'title', t: 'text', label: 'Section title', value: 'Everything in one place' },
      { k: 'sub', t: 'textarea', label: 'Section intro', value: '' },
      { k: 'align', t: 'select', label: 'Heading alignment', value: 'left', options: [['left', 'Left'], ['center', 'Center']] },

      { t: 'section', label: 'Tiles' },
      {
        k: 'items', t: 'list', label: 'Tiles', itemLabel: 'title',
        fields: [
          { k: 'eyebrow', t: 'text', label: 'Eyebrow', value: '' },
          { k: 'title', t: 'text', label: 'Title', value: 'Tile title' },
          { k: 'text', t: 'textarea', label: 'Body copy', value: '' },
          { k: 'stat', t: 'text', label: 'Big figure', value: '', help: 'Optional. Shown large in place of body copy.' },
          {
            k: 'size', t: 'select', label: 'Tile size', value: '1x1',
            options: [['1x1', 'Small — 1×1'], ['2x1', 'Wide — 2×1'], ['1x2', 'Tall — 1×2'], ['2x2', 'Feature — 2×2']]
          },
          {
            k: 'tone', t: 'select', label: 'Tone', value: 'surface',
            options: [['surface', 'Surface'], ['subtle', 'Subtle fill'], ['brand', 'Brand'], ['dark', 'Dark'], ['image', 'Image']]
          },
          { k: 'image', t: 'image', label: 'Image', value: '', help: 'Used as the tile background when tone is Image.' },
          { k: 'linkUrl', t: 'url', label: 'Link URL', value: '' }
        ],
        value: [
          { eyebrow: 'Platform', title: 'Built for the whole team', text: 'One workspace for design, build and hand-off — no context switching.', stat: '', size: '2x2', tone: 'brand', image: '', linkUrl: '' },
          { eyebrow: '', title: 'Uptime', text: '', stat: '99.98%', size: '1x1', tone: 'surface', image: '', linkUrl: '' },
          { eyebrow: '', title: 'Deploys each week', text: '', stat: '240+', size: '1x1', tone: 'subtle', image: '', linkUrl: '' },
          { eyebrow: 'Security', title: 'SOC 2 Type II', text: 'Audited annually, with data residency options in three regions.', stat: '', size: '2x1', tone: 'dark', image: '', linkUrl: '' },
          { eyebrow: 'Field notes', title: 'On the ground', text: '', stat: '', size: '1x2', tone: 'image', image: CB.ph(700, 1000, '', '#96694c', '#2b241f'), linkUrl: '' },
          { eyebrow: '', title: 'Integrations that stay out of the way', text: 'Connect the tools you already run and keep your existing workflow.', stat: '', size: '2x1', tone: 'surface', image: '', linkUrl: '' }
        ]
      },

      { t: 'section', label: 'Layout' },
      { k: 'cols', t: 'range', label: 'Columns (desktop)', min: 3, max: 5, step: 1, value: 4 },
      { k: 'rowHeight', t: 'range', label: 'Row height', min: 120, max: 320, step: 10, unit: 'px', value: 190 },
      { k: 'gap', t: 'range', label: 'Gap', min: 6, max: 32, step: 2, unit: 'px', value: 14 },

      { t: 'section', label: 'Style' },
      { k: 'radius', t: 'range', label: 'Tile corner radius', min: 0, max: 40, step: 2, unit: 'px', value: 22 },
      { k: 'hover', t: 'select', label: 'Hover effect', value: 'lift', options: [['lift', 'Lift'], ['glow', 'Border glow'], ['none', 'None']] },
      { k: 'bg', t: 'color', label: 'Background', value: '#ffffff' },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 0, max: 160, step: 8, unit: 'px', value: 80 }
    ],

    render: function (p, c) {
      var s = c.s;
      var items = (p.items || []).filter(Boolean);
      var cols = c.clamp(c.num(p.cols, 4), 3, 5);

      var tiles = items.map(function (it) {
        var body = it.stat
          ? '<p class="cb-bn__stat">' + c.esc(it.stat) + '</p>'
          : (it.text ? '<p class="cb-bn__text">' + c.rich(it.text) + '</p>' : '');
        var inner =
          (it.eyebrow ? '<span class="cb-bn__eyebrow">' + c.esc(it.eyebrow) + '</span>' : '') +
          (it.title ? '<h3 class="cb-bn__title">' + (it.linkUrl
            ? '<a class="cb-bn__link" href="' + c.url(it.linkUrl) + '">' + c.esc(it.title) + '</a>'
            : c.esc(it.title)) + '</h3>' : '') +
          body;

        return c.dedent(`
          <li class="cb-bn__tile" data-size="${c.attr(it.size)}" data-tone="${c.attr(it.tone)}">
            ${it.tone === 'image' && it.image ? '<img class="cb-bn__media" src="' + c.url(it.image) + '" alt="" loading="lazy" decoding="async">' : ''}
            <div class="cb-bn__body">${inner}</div>
          </li>`);
      }).join('\n');

      var html = c.dedent(`
        <section class="${c.cls} cb-bn">
          <div class="cb-wrap">
            ${(p.title || p.sub) ? `<header class="cb-bn__head">
              ${p.title ? '<h2 class="cb-bn__h">' + c.rich(p.title) + '</h2>' : ''}
              ${p.sub ? '<p class="cb-bn__sub">' + c.rich(p.sub) + '</p>' : ''}
            </header>` : ''}
            <ul class="cb-bn__grid">
        ${c.indent(tiles, 6)}
            </ul>
          </div>
        </section>`);

      var hoverCss = {
        lift: `${s} .cb-bn__tile:hover { transform: translateY(-5px); box-shadow: 0 26px 50px -30px rgba(20,18,16,.55); }`,
        glow: `${s} .cb-bn__tile:hover { box-shadow: 0 0 0 2px var(--cb-brand), 0 22px 44px -32px var(--cb-brand); }`,
        none: ''
      }[p.hover] || '';

      var css = `
        ${s}.cb-bn { background: ${p.bg}; padding-block: ${c.num(p.pad, 80)}px; }
        ${s} .cb-bn__head {
          margin-bottom: 32px; max-width: 660px;
          text-align: ${p.align}; ${p.align === 'center' ? 'margin-inline: auto;' : ''}
        }
        ${s} .cb-bn__h { font-size: clamp(26px, 3.6vw, 38px); font-weight: 800; letter-spacing: -.02em; line-height: 1.15; text-wrap: balance; }
        ${s} .cb-bn__sub { color: var(--cb-muted); margin-top: 10px; }

        ${s} .cb-bn__grid {
          display: grid;
          grid-template-columns: repeat(${cols}, minmax(0, 1fr));
          grid-auto-rows: ${c.num(p.rowHeight, 190)}px;
          grid-auto-flow: dense;
          gap: ${c.num(p.gap, 14)}px;
        }
        ${s} .cb-bn__tile {
          position: relative; overflow: hidden;
          border-radius: ${c.num(p.radius, 22)}px;
          display: flex; flex-direction: column; justify-content: flex-end;
          transition: transform .28s cubic-bezier(.2,.7,.3,1), box-shadow .28s ease;
        }
        ${hoverCss}
        ${s} .cb-bn__tile[data-size="2x1"] { grid-column: span 2; }
        ${s} .cb-bn__tile[data-size="1x2"] { grid-row: span 2; }
        ${s} .cb-bn__tile[data-size="2x2"] { grid-column: span 2; grid-row: span 2; }

        ${s} .cb-bn__tile[data-tone="surface"] { background: var(--cb-surface); border: 1px solid var(--cb-border); }
        ${s} .cb-bn__tile[data-tone="subtle"]  { background: var(--cb-subtle); }
        ${s} .cb-bn__tile[data-tone="brand"]   { background: linear-gradient(140deg, var(--cb-brand), var(--cb-brand-2)); }
        ${s} .cb-bn__tile[data-tone="dark"]    { background: var(--cb-ink); }
        ${s} .cb-bn__tile[data-tone="image"]   { background: var(--cb-ink); }
        ${s} .cb-bn__media { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        ${s} .cb-bn__tile[data-tone="image"] .cb-bn__body {
          position: relative; z-index: 1;
          background: linear-gradient(to top, rgba(12,10,8,.88) 15%, rgba(12,10,8,0) 75%);
        }

        ${s} .cb-bn__body { display: flex; flex-direction: column; gap: 8px; padding: 22px; }
        ${s} .cb-bn__eyebrow {
          font-size: .7em; font-weight: 700; letter-spacing: .12em;
          text-transform: uppercase; opacity: .72;
        }
        ${s} .cb-bn__title { font-size: 1.12em; font-weight: 730; line-height: 1.25; letter-spacing: -.01em; }
        ${s} .cb-bn__tile[data-size="2x2"] .cb-bn__title { font-size: clamp(20px, 2.4vw, 28px); }
        ${s} .cb-bn__text { font-size: .94em; opacity: .78; }
        ${s} .cb-bn__stat {
          font-size: clamp(30px, 4vw, 46px); font-weight: 800; line-height: 1;
          letter-spacing: -.03em; font-variant-numeric: tabular-nums; margin-top: 2px;
        }
        ${s} .cb-bn__link { text-decoration: none; }
        ${s} .cb-bn__link::after { content: ""; position: absolute; inset: 0; z-index: 2; }
        ${s} .cb-bn__tile:has(.cb-bn__link:focus-visible) { outline: 3px solid var(--cb-brand); outline-offset: 3px; }

        /* Light text on the dark tones has to state its colour — a theme rule
           like h3 { color:#111 !important } would otherwise black it out. */
        ${c.pin([
          s + ' .cb-bn__tile[data-tone="brand"] .cb-bn__title',
          s + ' .cb-bn__tile[data-tone="brand"] .cb-bn__stat',
          s + ' .cb-bn__tile[data-tone="brand"] .cb-bn__eyebrow',
          s + ' .cb-bn__tile[data-tone="brand"] .cb-bn__text',
          s + ' .cb-bn__tile[data-tone="brand"] .cb-bn__link'
        ], 'var(--cb-on-brand)')}
        ${c.pin([
          s + ' .cb-bn__tile[data-tone="dark"] .cb-bn__title',
          s + ' .cb-bn__tile[data-tone="dark"] .cb-bn__stat',
          s + ' .cb-bn__tile[data-tone="dark"] .cb-bn__eyebrow',
          s + ' .cb-bn__tile[data-tone="dark"] .cb-bn__text',
          s + ' .cb-bn__tile[data-tone="dark"] .cb-bn__link',
          s + ' .cb-bn__tile[data-tone="image"] .cb-bn__title',
          s + ' .cb-bn__tile[data-tone="image"] .cb-bn__stat',
          s + ' .cb-bn__tile[data-tone="image"] .cb-bn__eyebrow',
          s + ' .cb-bn__tile[data-tone="image"] .cb-bn__text',
          s + ' .cb-bn__tile[data-tone="image"] .cb-bn__link'
        ], '#ffffff')}

        @media (max-width: 900px) {
          ${s} .cb-bn__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          ${s} .cb-bn__tile[data-size="2x2"], ${s} .cb-bn__tile[data-size="2x1"] { grid-column: span 2; }
        }
        @media (max-width: 560px) {
          /* Spans off entirely below this — a 2-wide tile in one column is just
             a tall empty box. Row height goes auto so copy is never clipped. */
          ${s} .cb-bn__grid { grid-template-columns: 1fr; grid-auto-rows: auto; }
          ${s} .cb-bn__tile, ${s} .cb-bn__tile[data-size="2x2"],
          ${s} .cb-bn__tile[data-size="2x1"], ${s} .cb-bn__tile[data-size="1x2"] {
            grid-column: auto; grid-row: auto; min-height: 150px;
          }
        }`;

      return { html: html, css: css, js: '' };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Sticky Stacking Cards                                                  */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'sticky-stack',
    name: 'Sticky Stacking Cards',
    category: CAT,
    icon: '❐',
    blurb: 'Cards pin and stack as you scroll past them. Built on position:sticky, so the stack works everywhere; scroll timelines only add the depth cue.',
    props: [
      { t: 'section', label: 'Heading' },
      { k: 'title', t: 'text', label: 'Section title', value: 'How it comes together' },
      { k: 'sub', t: 'textarea', label: 'Section intro', value: '' },

      { t: 'section', label: 'Cards' },
      {
        k: 'items', t: 'list', label: 'Cards', itemLabel: 'title',
        fields: [
          { k: 'eyebrow', t: 'text', label: 'Eyebrow', value: 'Step' },
          { k: 'title', t: 'text', label: 'Title', value: 'Card title' },
          { k: 'text', t: 'textarea', label: 'Body copy', value: 'Supporting copy for this card.' },
          { k: 'image', t: 'image', label: 'Image', value: '' },
          { k: 'linkText', t: 'text', label: 'Link label', value: '' },
          { k: 'linkUrl', t: 'url', label: 'Link URL', value: '#' },
          { k: 'tone', t: 'select', label: 'Tone', value: 'surface', options: [['surface', 'Surface'], ['subtle', 'Subtle'], ['brand', 'Brand'], ['dark', 'Dark']] }
        ],
        value: [
          { eyebrow: 'One', title: 'Start from a real pattern', text: 'Pick a block that already matches what people expect, instead of assembling one from scratch.', image: CB.ph(900, 560, '', '#96694c', '#2b241f'), linkText: '', linkUrl: '#', tone: 'surface' },
          { eyebrow: 'Two', title: 'Make it yours', text: 'Copy, colour, spacing and behaviour are all editable, with the preview updating as you type.', image: CB.ph(900, 560, '', '#6f4c37', '#141210'), linkText: '', linkUrl: '#', tone: 'subtle' },
          { eyebrow: 'Three', title: 'Paste and move on', text: 'Take one self-contained snippet. No build step, no dependencies, nothing to maintain.', image: CB.ph(900, 560, '', '#2b241f', '#4a443e'), linkText: '', linkUrl: '#', tone: 'dark' }
        ]
      },

      { t: 'section', label: 'Stacking' },
      { k: 'topOffset', t: 'range', label: 'Pin offset from top', min: 20, max: 200, step: 4, unit: 'px', value: 96 },
      { k: 'step', t: 'range', label: 'Step between cards', min: 0, max: 40, step: 2, unit: 'px', value: 16 },
      { k: 'spacing', t: 'range', label: 'Scroll distance per card', min: 40, max: 120, step: 5, unit: 'vh', value: 85 },
      { k: 'depth', t: 'toggle', label: 'Shrink cards as they are covered', value: true, help: 'Uses a scroll timeline where supported. Cards stack normally without it.' },

      { t: 'section', label: 'Style' },
      { k: 'layout', t: 'select', label: 'Card layout', value: 'split', options: [['split', 'Text + image'], ['text', 'Text only']] },
      { k: 'minHeight', t: 'range', label: 'Card height', min: 240, max: 560, step: 10, unit: 'px', value: 380 },
      { k: 'bg', t: 'color', label: 'Background', value: '#f7f4f1' },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 0, max: 160, step: 8, unit: 'px', value: 80 }
    ],

    render: function (p, c) {
      var s = c.s;
      var items = (p.items || []).filter(Boolean);
      var step = c.num(p.step, 16);

      var cards = items.map(function (it, i) {
        var media = (p.layout === 'split' && it.image)
          ? '<div class="cb-stk__media"><img src="' + c.url(it.image) + '" alt="" loading="lazy" decoding="async"></div>' : '';
        return c.dedent(`
          <li class="cb-stk__item" style="--i: ${i}">
            <article class="cb-stk__card" data-tone="${c.attr(it.tone)}">
              <div class="cb-stk__copy">
                ${it.eyebrow ? '<span class="cb-stk__eyebrow">' + c.esc(it.eyebrow) + '</span>' : ''}
                ${it.title ? '<h3 class="cb-stk__title">' + c.esc(it.title) + '</h3>' : ''}
                ${it.text ? '<p class="cb-stk__text">' + c.rich(it.text) + '</p>' : ''}
                ${it.linkText ? '<a class="cb-stk__link" href="' + c.url(it.linkUrl) + '">' + c.esc(it.linkText) + ' <span aria-hidden="true">&rarr;</span></a>' : ''}
              </div>
              ${media}
            </article>
          </li>`);
      }).join('\n');

      var html = c.dedent(`
        <section class="${c.cls} cb-stk">
          <div class="cb-wrap">
            ${(p.title || p.sub) ? `<header class="cb-stk__head">
              ${p.title ? '<h2 class="cb-stk__h">' + c.rich(p.title) + '</h2>' : ''}
              ${p.sub ? '<p class="cb-stk__sub">' + c.rich(p.sub) + '</p>' : ''}
            </header>` : ''}
            <ol class="cb-stk__list">
        ${c.indent(cards, 6)}
            </ol>
          </div>
        </section>`);

      var css = `
        ${s}.cb-stk { background: ${p.bg}; padding-block: ${c.num(p.pad, 80)}px; }
        ${s} .cb-stk__head { margin-bottom: 32px; max-width: 640px; }
        ${s} .cb-stk__h { font-size: clamp(26px, 3.6vw, 38px); font-weight: 800; letter-spacing: -.02em; line-height: 1.15; }
        ${s} .cb-stk__sub { color: var(--cb-muted); margin-top: 10px; }

        ${s} .cb-stk__list { display: block; }
        /* Each card pins slightly lower than the one before, so the stack keeps
           a visible edge of every card underneath. */
        ${s} .cb-stk__item {
          position: sticky;
          top: calc(${c.num(p.topOffset, 96)}px + var(--i) * ${step}px);
          height: ${c.num(p.spacing, 85)}vh;
          display: flex; align-items: flex-start;
        }
        ${s} .cb-stk__item:last-child { height: auto; }

        ${s} .cb-stk__card {
          width: 100%; min-height: ${c.num(p.minHeight, 380)}px;
          display: grid; gap: clamp(20px, 3vw, 40px); align-items: center;
          grid-template-columns: ${p.layout === 'split' ? '1fr 1fr' : '1fr'};
          padding: clamp(24px, 4vw, 44px);
          border-radius: calc(var(--cb-radius) * 1.6);
          box-shadow: 0 24px 60px -34px rgba(20,18,16,.55);
          transform-origin: 50% 0%;
        }
        ${s} .cb-stk__card[data-tone="surface"] { background: var(--cb-surface); border: 1px solid var(--cb-border); }
        ${s} .cb-stk__card[data-tone="subtle"]  { background: var(--cb-subtle); border: 1px solid var(--cb-border); }
        ${s} .cb-stk__card[data-tone="brand"]   { background: linear-gradient(140deg, var(--cb-brand), var(--cb-brand-2)); }
        ${s} .cb-stk__card[data-tone="dark"]    { background: var(--cb-ink); }

        ${s} .cb-stk__copy { display: flex; flex-direction: column; gap: 12px; ${p.layout === 'text' ? 'max-width: 62ch;' : ''} }
        ${s} .cb-stk__eyebrow {
          font-size: .72em; font-weight: 700; letter-spacing: .12em;
          text-transform: uppercase; color: var(--cb-brand);
        }
        ${s} .cb-stk__title { font-size: clamp(20px, 2.8vw, 30px); font-weight: 780; line-height: 1.2; letter-spacing: -.015em; }
        ${s} .cb-stk__text { color: var(--cb-muted); }
        ${s} .cb-stk__link { color: var(--cb-brand); font-weight: 650; text-decoration: none; width: max-content; }
        ${s} .cb-stk__link:hover { text-decoration: underline; }
        ${s} .cb-stk__media img { width: 100%; aspect-ratio: 16/10; object-fit: cover; border-radius: var(--cb-radius); }

        ${c.pin([
          s + ' .cb-stk__card[data-tone="brand"] .cb-stk__title',
          s + ' .cb-stk__card[data-tone="brand"] .cb-stk__eyebrow',
          s + ' .cb-stk__card[data-tone="brand"] .cb-stk__text',
          s + ' .cb-stk__card[data-tone="brand"] .cb-stk__link'
        ], 'var(--cb-on-brand)')}
        ${c.pin([
          s + ' .cb-stk__card[data-tone="dark"] .cb-stk__title',
          s + ' .cb-stk__card[data-tone="dark"] .cb-stk__eyebrow',
          s + ' .cb-stk__card[data-tone="dark"] .cb-stk__text',
          s + ' .cb-stk__card[data-tone="dark"] .cb-stk__link'
        ], '#ffffff')}
        ${s} .cb-stk__card[data-tone="dark"] .cb-stk__eyebrow,
        ${s} .cb-stk__card[data-tone="brand"] .cb-stk__eyebrow { opacity: .8; }

        ${p.depth ? `
        /* Depth cue only — the stack itself is plain position:sticky and works
           without this. Where scroll timelines exist, each card shrinks and
           dims as the next one covers it. */
        @supports (animation-timeline: view()) {
          @media (prefers-reduced-motion: no-preference) {
            ${s} .cb-stk__card {
              animation: cb-stk-depth-${c.cls} linear both;
              animation-timeline: view();
              animation-range: exit-crossing 0% exit-crossing 100%;
            }
          }
        }
        @keyframes cb-stk-depth-${c.cls} {
          from { transform: scale(1); filter: brightness(1); }
          to { transform: scale(.92); filter: brightness(.82); }
        }` : ''}

        @media (max-width: 820px) {
          ${s} .cb-stk__card { grid-template-columns: 1fr; }
          ${s} .cb-stk__media { order: -1; }
        }
        @media (max-width: 640px) {
          /* Stacking on a short viewport hides more than it reveals, so the
             cards simply flow. */
          ${s} .cb-stk__item { position: static; height: auto; margin-bottom: 16px; }
          ${s} .cb-stk__card { min-height: 0; }
        }`;

      return { html: html, css: css, js: '' };
    }
  });
})();
