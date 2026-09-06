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
      {
        k: 'radius', t: 'range', label: 'Tile corner radius', min: 0, max: 40, step: 2, unit: 'px',
        value: 0, auto: 0,
        help: 'Auto follows the project corner radius, a little rounder than a standard card. Set a value to pin this block to it instead.'
      },
      { k: 'hover', t: 'select', label: 'Hover effect', value: 'lift', options: [['lift', 'Lift'], ['glow', 'Border glow'], ['none', 'None']] },
      {
        k: 'bgMode', t: 'select', label: 'Background', value: 'page',
        options: CB.BG_MODES, legacy: { key: 'bg', value: 'custom' },
        help: 'Following the scheme is what lets one Light/Dark setting reach this block.'
      },
      { k: 'bg', t: 'color', label: 'Background colour', value: '#ffffff', when: { bgMode: ['custom'] } },
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
        ${s}.cb-bn { background: ${c.bg(p)}; padding-block: ${c.num(p.pad, 80)}px; }
        ${s} .cb-bn__head {
          margin-bottom: 32px; max-width: 660px;
          text-align: ${p.align}; ${p.align === 'center' ? 'margin-inline: auto;' : ''}
        }
        ${s} .cb-bn__h { font-size: calc(clamp(26px, 3.6vw, 38px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800); letter-spacing: calc(-.02em + var(--cb-h-track, 0em)); line-height: calc(1.15 + var(--cb-h-leading, 0)); text-wrap: balance; }
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
          /* Bento tiles are deliberately rounder than a standard card. Deriving
             that from the project token rather than pinning it to 22px is what
             lets the one corner-radius slider reach this block too; 1.5x lands
             on 21px at the default 14, which is where it always sat. */
          border-radius: ${c.num(p.radius, 0) > 0 ? c.num(p.radius, 0) + 'px' : 'calc(var(--cb-radius) * 1.5)'};
          display: flex; flex-direction: column; justify-content: flex-end;
          transition: transform .28s cubic-bezier(.2,.7,.3,1), box-shadow .28s ease;
        }
        ${hoverCss}
        ${s} .cb-bn__tile[data-size="2x1"] { grid-column: span 2; }
        ${s} .cb-bn__tile[data-size="1x2"] { grid-row: span 2; }
        ${s} .cb-bn__tile[data-size="2x2"] { grid-column: span 2; grid-row: span 2; }

        ${s} .cb-bn__tile[data-tone="surface"] { background: var(--cb-surface); border: 1px solid var(--cb-border); }
        ${s} .cb-bn__tile[data-tone="subtle"]  { background: var(--cb-subtle); }
        /* Solid colour and gradient stated separately, not as a shorthand.
           Sanitisers that drop gradient values otherwise leave this tile with
           no background at all, and its white text lands on the page's own
           white at 1:1. The gradient is opaque, so the solid never shows while
           it works. */
        ${s} .cb-bn__tile[data-tone="brand"]   { background: var(--cb-brand); background-image: linear-gradient(140deg, var(--cb-brand), var(--cb-brand-2)); }
        ${s} .cb-bn__tile[data-tone="dark"]    { background: var(--cb-deep, #141210); }
        ${s} .cb-bn__tile[data-tone="image"]   { background: var(--cb-deep, #141210); }
        ${s} .cb-bn__media { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        ${s} .cb-bn__tile[data-tone="image"] .cb-bn__body {
          position: relative; z-index: 1;
          background: linear-gradient(to top, rgba(12,10,8,.88) 15%, rgba(12,10,8,0) 75%);
        }

        ${s} .cb-bn__body { display: flex; flex-direction: column; gap: 8px; padding: 22px; }
        ${s} .cb-bn__eyebrow {
          font-size: calc(.7em * var(--cb-eyebrow-scale, 1)); font-weight: var(--cb-eyebrow-weight, 700); letter-spacing: calc(.12em + var(--cb-eyebrow-track, 0em));
          text-transform: uppercase; opacity: .72;
        }
        ${s} .cb-bn__title { font-size: 1.12em; font-weight: var(--cb-h-weight, 730); line-height: calc(1.25 + var(--cb-h-leading, 0)); letter-spacing: calc(-.01em + var(--cb-h-track, 0em)); }
        ${s} .cb-bn__tile[data-size="2x2"] .cb-bn__title { font-size: calc(clamp(20px, 2.4vw, 28px) * var(--cb-h-scale, 1)); }
        ${s} .cb-bn__text { font-size: .94em; opacity: .78; }
        ${s} .cb-bn__stat {
          font-size: calc(clamp(30px, 4vw, 46px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800); line-height: calc(1 + var(--cb-h-leading, 0));
          letter-spacing: calc(-.03em + var(--cb-h-track, 0em)); font-variant-numeric: tabular-nums; margin-top: 2px;
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
      {
        k: 'bgMode', t: 'select', label: 'Background', value: 'band',
        options: CB.BG_MODES, legacy: { key: 'bg', value: 'custom' },
        help: 'Following the scheme is what lets one Light/Dark setting reach this block.'
      },
      { k: 'bg', t: 'color', label: 'Background colour', value: '#f7f4f1', when: { bgMode: ['custom'] } },
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
        ${s}.cb-stk { background: ${c.bg(p)}; padding-block: ${c.num(p.pad, 80)}px; }
        ${s} .cb-stk__head { margin-bottom: 32px; max-width: 640px; }
        ${s} .cb-stk__h { font-size: calc(clamp(26px, 3.6vw, 38px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800); letter-spacing: calc(-.02em + var(--cb-h-track, 0em)); line-height: calc(1.15 + var(--cb-h-leading, 0)); }
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
        ${s} .cb-stk__card[data-tone="brand"]   { background: var(--cb-brand); background-image: linear-gradient(140deg, var(--cb-brand), var(--cb-brand-2)); }
        ${s} .cb-stk__card[data-tone="dark"]    { background: var(--cb-deep, #141210); }

        ${s} .cb-stk__copy { display: flex; flex-direction: column; gap: 12px; ${p.layout === 'text' ? 'max-width: 62ch;' : ''} }
        ${s} .cb-stk__eyebrow {
          font-size: calc(.72em * var(--cb-eyebrow-scale, 1)); font-weight: var(--cb-eyebrow-weight, 700); letter-spacing: calc(.12em + var(--cb-eyebrow-track, 0em));
          text-transform: uppercase; color: var(--cb-brand);
        }
        ${s} .cb-stk__title { font-size: calc(clamp(20px, 2.8vw, 30px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 780); line-height: calc(1.2 + var(--cb-h-leading, 0)); letter-spacing: calc(-.015em + var(--cb-h-track, 0em)); }
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

  /* --------------------------------------------------------------------- */
  /* Mosaic Grid                                                            */
  /* --------------------------------------------------------------------- */

  CB.register({
    id: 'mosaic-grid',
    name: 'Mosaic Grid',
    category: CAT,
    icon: '▩',
    blurb: 'Flush checkerboard of colour tiles and photos. Type is sized against the tile rather than the viewport, so a 5-up tile and a phone-width one are both readable. Zero JS.',
    props: [
      { t: 'section', label: 'Heading' },
      {
        k: 'title', t: 'text', label: 'Section title', value: '',
        help: 'Leave empty for a bare mosaic with nothing above it.'
      },
      { k: 'sub', t: 'textarea', label: 'Section intro', value: '' },
      { k: 'align', t: 'select', label: 'Heading alignment', value: 'left', options: [['left', 'Left'], ['center', 'Center']] },

      { t: 'section', label: 'Tiles' },
      {
        k: 'items', t: 'list', label: 'Tiles', itemLabel: 'title',
        help: 'Alternate colour and image tiles to get the checkerboard. Two of a kind side by side is allowed — it just reads as a block.',
        fields: [
          {
            k: 'kind', t: 'select', label: 'Tile', value: 'copy',
            options: [['copy', 'Colour tile'], ['photo', 'Image tile']]
          },
          { k: 'color', t: 'color', label: 'Tile colour', value: '#96694c', when: { kind: ['copy'] } },
          { k: 'title', t: 'text', label: 'Title', value: 'Tile title', when: { kind: ['copy'] } },
          { k: 'text', t: 'textarea', label: 'Body copy', value: 'A sentence on what this one covers.', when: { kind: ['copy'] } },
          {
            k: 'inkAuto', t: 'toggle', label: 'Pick the text colour for me', value: true,
            when: { kind: ['copy'] },
            help: 'Takes white or near-black, whichever has more contrast against the tile colour. Turn off to choose your own.'
          },
          { k: 'ink', t: 'color', label: 'Text colour', value: '#ffffff', when: { kind: ['copy'], inkAuto: [false] } },
          { k: 'btnText', t: 'text', label: 'Button label', value: 'View', when: { kind: ['copy'] }, help: 'Leave empty for no button.' },
          { k: 'btnUrl', t: 'text', label: 'Button link', value: '#', when: { kind: ['copy'] } },
          {
            k: 'btnStyle', t: 'select', label: 'Button style', value: 'inherit',
            when: { kind: ['copy'] },
            options: [
              ['inherit', 'Same as the block'], ['solid', 'Solid, contrasting the tile'],
              ['outline', 'Outlined'], ['brand', 'Brand colour'], ['custom', 'Custom colours']
            ]
          },
          { k: 'btnBg', t: 'color', label: 'Button fill', value: '#ffffff', when: { kind: ['copy'], btnStyle: ['custom'] } },
          { k: 'btnInk', t: 'color', label: 'Button label colour', value: '#141210', when: { kind: ['copy'], btnStyle: ['custom'] } },
          { k: 'image', t: 'image', label: 'Image', value: CB.ph(900, 900, '', '#2b241f', '#4a443e'), when: { kind: ['photo'] } },
          { k: 'alt', t: 'text', label: 'Alt text', value: '', when: { kind: ['photo'] } }
        ],
        value: [
          { kind: 'copy', color: '#96694c', ink: '#ffffff', title: 'Utility', text: 'Powering a resilient grid for where we live, work and play.', btnText: 'View', btnUrl: '#' },
          { kind: 'photo', image: CB.ph(900, 900, '', '#2b241f', '#4a443e'), alt: '' },
          { kind: 'copy', color: '#4A8C3E', ink: '#141210', title: 'EV Charging', text: 'Energising electric vehicles on the road, in the air and at sea.', btnText: 'View', btnUrl: '#' },
          { kind: 'photo', image: CB.ph(900, 900, '', '#3a332d', '#6f4c37'), alt: '' },
          { kind: 'copy', color: '#141210', ink: '#ffffff', title: 'New Products', text: 'Innovating to support an all-electric future.', btnText: 'View', btnUrl: '#' },
          { kind: 'photo', image: CB.ph(900, 900, '', '#4a443e', '#96694c'), alt: '' },
          { kind: 'copy', color: '#F0A22B', ink: '#141210', title: 'Residential', text: 'Streamlining operations at every stage of construction.', btnText: 'View', btnUrl: '#' },
          { kind: 'photo', image: CB.ph(900, 900, '', '#12161c', '#241a12'), alt: '' },
          { kind: 'copy', color: '#2BB3CD', ink: '#141210', title: 'Data Centers', text: 'Protecting data with secure and sustainable power.', btnText: 'View', btnUrl: '#' },
          { kind: 'photo', image: CB.ph(900, 900, '', '#6f4c37', '#141210'), alt: '' }
        ]
      },

      { t: 'section', label: 'Layout' },
      { k: 'cols', t: 'range', label: 'Columns (desktop)', min: 2, max: 6, step: 1, value: 5 },
      {
        k: 'colsMobile', t: 'select', label: 'Columns (mobile)', value: '2',
        options: [['2', 'Two — keeps the checkerboard'], ['1', 'One — a single stack']]
      },
      { k: 'ratio', t: 'select', label: 'Tile shape', value: '1/1', options: [['1/1', 'Square'], ['4/3', '4 : 3'], ['3/2', '3 : 2'], ['16/9', '16 : 9']] },
      { k: 'gap', t: 'range', label: 'Gap', min: 0, max: 24, step: 2, unit: 'px', value: 0, help: 'Zero is flush, which is what makes it read as one mosaic.' },
      {
        k: 'full', t: 'toggle', label: 'Full bleed', value: true,
        help: 'Off constrains the mosaic to the project content width.'
      },

      { t: 'section', label: 'Style' },
      {
        k: 'btnStyle', t: 'select', label: 'Button', value: 'solid',
        options: [['solid', 'Solid, contrasting the tile'], ['outline', 'Outlined'], ['brand', 'Brand colour']]
      },
      { k: 'zoom', t: 'toggle', label: 'Zoom images on hover', value: true },
      {
        k: 'reveal', t: 'toggle', label: 'Reveal as they scroll in', value: true,
        help: 'A CSS scroll timeline, so it still runs where an editor strips <script>. Ignored under reduced-motion.'
      },
      {
        k: 'bgMode', t: 'select', label: 'Background', value: 'page',
        options: CB.BG_MODES, legacy: { key: 'bg', value: 'custom' },
        help: 'Following the scheme is what lets one Light/Dark setting reach this block.'
      },
      { k: 'bg', t: 'color', label: 'Background colour', value: '#ffffff', when: { bgMode: ['custom'] } },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 0, max: 140, step: 8, unit: 'px', value: 0 }
    ],

    render: function (p, c) {
      var s = c.s;
      var cols = c.clamp(c.num(p.cols, 5), 2, 6);
      var mob = c.num(p.colsMobile, 2) === 1 ? 1 : 2;
      var gap = c.num(p.gap, 0);
      var items = (p.items || []).filter(Boolean);

      var tiles = items.map(function (it) {
        if (it.kind === 'photo') {
          return c.dedent(`
            <div class="cb-mo__tile cb-mo__tile--photo">
              ${it.image ? `<img class="cb-mo__img" src="${c.url(it.image)}" alt="${c.attr(it.alt)}" loading="lazy" decoding="async">` : ''}
            </div>`);
        }
        var fill = it.color || '#96694c';
        /* Auto by default, so a tile stays readable whatever colour it is given
           and nobody has to think about it. Off, the tile says what it wants —
           and preflight will tell you if that lands under 4.5:1. */
        var ink = it.inkAuto === false && it.ink ? it.ink : c.readableInk(fill);
        /* Resolved here rather than in CSS: "same as the block" is a build-time
           question, and settling it now keeps the stylesheet to one rule per
           style instead of one per tile. */
        var btn = (it.btnStyle && it.btnStyle !== 'inherit') ? it.btnStyle : (p.btnStyle || 'solid');
        var vars = '--cb-tile: ' + c.attr(fill) + '; --cb-tile-ink: ' + c.attr(ink) + ';' +
          (btn === 'custom'
            ? ' --cb-mo-btn-bg: ' + c.attr(it.btnBg || '#ffffff') +
              '; --cb-mo-btn-ink: ' + c.attr(it.btnInk || '#141210') + ';'
            : '');
        return c.dedent(`
          <article class="cb-mo__tile cb-mo__tile--copy" data-btn="${c.attr(btn)}" style="${vars}">
            <div class="cb-mo__in">
              <div class="cb-mo__top">
                ${it.title ? '<h3 class="cb-mo__t">' + c.rich(it.title) + '</h3>' : ''}
                ${it.text ? '<p class="cb-mo__x">' + c.rich(it.text) + '</p>' : ''}
              </div>
              ${it.btnText ? '<a class="cb-mo__btn" href="' + c.url(it.btnUrl) + '">' + c.esc(it.btnText) + '</a>' : ''}
            </div>
          </article>`);
      }).join('\n');

      var head = (p.title || p.sub) ? c.dedent(`
        <header class="cb-mo__head">
          ${p.title ? '<h2 class="cb-mo__title">' + c.rich(p.title) + '</h2>' : ''}
          ${p.sub ? '<p class="cb-mo__sub">' + c.rich(p.sub) + '</p>' : ''}
        </header>`) : '';

      var html = c.dedent(`
        <section class="${c.cls} cb-mo">
          ${p.full ? '' : '<div class="cb-wrap">'}
          ${head ? c.indent(head, p.full ? 2 : 4) : ''}
          <div class="cb-mo__grid">
        ${c.indent(tiles, 6)}
          </div>
          ${p.full ? '' : '</div>'}
        </section>`);

      /* At an odd column count, authoring tiles alternately checkerboards for
         free. At an even one the pattern lines up into stripes instead, so every
         second row is placed in reverse and `dense` backfills — which continues
         the alternation across the row boundary. Generated for the chosen count
         rather than hard-coded for two, so the columns control stays honest. */
      function swapRules(n, scope) {
        if (n % 2) return '';
        var out = [];
        for (var k = 1; k <= n; k++) {
          out.push(scope + ' .cb-mo__tile:nth-child(' + (n * 2) + 'n + ' + (n + k) + ') { grid-column: ' + (n - k + 1) + '; }');
        }
        return out.join('\n');
      }

      /* One rule per style, chosen by the attribute the tile resolved to, so a
         tile can differ from the block without emitting per-tile CSS. */
      var btnCss = [
        `${s} .cb-mo__tile[data-btn="solid"] .cb-mo__btn {
           background: var(--cb-tile-ink, #fff); color: var(--cb-tile, #141210);
         }`,
        `${s} .cb-mo__tile[data-btn="outline"] .cb-mo__btn {
           background: transparent; color: var(--cb-tile-ink, #fff);
           box-shadow: inset 0 0 0 var(--cb-btn-border, 2px) currentColor;
         }`,
        `${s} .cb-mo__tile[data-btn="brand"] .cb-mo__btn {
           background: var(--cb-brand); color: var(--cb-on-brand);
         }`,
        `${s} .cb-mo__tile[data-btn="custom"] .cb-mo__btn {
           background: var(--cb-mo-btn-bg, #fff); color: var(--cb-mo-btn-ink, #141210);
         }`
      ].join('\n        ');

      var css = `
        ${s}.cb-mo { background: ${c.bg(p)}; padding-block: ${c.num(p.pad, 0)}px; }
        ${s} .cb-mo__head { margin-bottom: 28px; max-width: 660px; ${p.full ? 'padding-inline: clamp(16px, 4vw, 48px);' : ''} ${p.align === 'center' ? 'margin-inline: auto; text-align: center;' : ''} }
        ${s} .cb-mo__title { font-size: calc(clamp(26px, 3.6vw, 38px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800); letter-spacing: calc(-.02em + var(--cb-h-track, 0em)); line-height: calc(1.15 + var(--cb-h-leading, 0)); }
        ${s} .cb-mo__sub { color: var(--cb-muted); margin-top: 10px; }

        ${s} .cb-mo__grid {
          display: grid; grid-template-columns: repeat(${cols}, minmax(0, 1fr));
          gap: ${gap}px; grid-auto-flow: row dense;
        }
        ${swapRules(cols, s)}

        ${s} .cb-mo__tile {
          position: relative; aspect-ratio: ${p.ratio};
          /* Type is sized against the tile, not the page, so the same tile is
             readable five-up on a desktop and two-up on a phone. */
          container-type: inline-size;
          ${gap ? 'border-radius: var(--cb-radius); overflow: hidden;' : ''}
        }
        ${s} .cb-mo__tile--copy {
          background: var(--cb-tile, var(--cb-brand));
          color: var(--cb-tile-ink, #fff);
          display: flex;
        }
        ${s} .cb-mo__in {
          flex: 1; display: flex; flex-direction: column; justify-content: space-between;
          padding: 22px; padding: clamp(16px, 10cqw, 52px);
        }
        ${s} .cb-mo__t {
          font-weight: var(--cb-h-weight, 800); line-height: calc(1.12 + var(--cb-h-leading, 0));
          letter-spacing: calc(-.02em + var(--cb-h-track, 0em));
          margin-bottom: 10px; margin-bottom: clamp(8px, 3.5cqw, 18px);
          font-size: 20px; font-size: calc(clamp(15px, 6.6cqw, 36px) * var(--cb-h-scale, 1));
        }
        ${s} .cb-mo__x {
          line-height: 1.45; font-size: 13px;
          font-size: calc(clamp(12px, 3.7cqw, 19px) * var(--cb-body-scale, 1));
          opacity: .95;
        }
        ${s} .cb-mo__btn {
          align-self: flex-start; text-decoration: none; display: inline-block;
          font-weight: var(--cb-btn-weight, 650); border-radius: var(--cb-btn-radius);
          letter-spacing: var(--cb-btn-tracking, 0);
          font-size: 12px; font-size: clamp(11px, 2.9cqw, 15px);
          padding: 9px 16px; padding: clamp(8px, 2.6cqw, 14px) clamp(14px, 5cqw, 26px);
          transition: transform .2s cubic-bezier(.22,.61,.36,1), filter .2s ease;
        }
        ${btnCss}
        ${s} .cb-mo__btn:hover { transform: translateY(-2px); filter: brightness(.94); }

        ${s} .cb-mo__tile--photo {
          overflow: hidden;
          background: linear-gradient(140deg, #241a12, #12161c);
        }
        ${s} .cb-mo__img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; display: block;
          transition: transform .7s cubic-bezier(.22,.61,.36,1);
        }
        ${p.zoom ? `${s} .cb-mo__tile--photo:hover .cb-mo__img { transform: scale(1.05); }` : ''}

        /* A theme that colours every heading and paragraph would otherwise turn
           the copy on a dark tile into black-on-black. */
        ${c.pin([s + ' .cb-mo__tile--copy .cb-mo__t', s + ' .cb-mo__tile--copy .cb-mo__x'], 'var(--cb-tile-ink, #fff)')}

        @media (max-width: 900px) {
          ${s} .cb-mo__grid { grid-template-columns: repeat(${mob}, minmax(0, 1fr)); }
          ${swapRules(cols, s).length ? `${s} .cb-mo__tile { grid-column: auto; }` : ''}
          ${swapRules(mob, s)}
        }`;

      /* Reveal is a scroll timeline rather than an IntersectionObserver, so it
         survives an editor that strips <script> — which is most of them. The
         per-tile delay comes from the range, not a transition-delay, because
         there is no JS to hand each tile an index. */
      var reveal = p.reveal ? `
        @keyframes cb-mo-in-${c.cls.replace(/[^\w-]/g, '')} {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: none; }
        }
        @supports (animation-timeline: view()) {
          @media (prefers-reduced-motion: no-preference) {
            ${s} .cb-mo__tile {
              animation: cb-mo-in-${c.cls.replace(/[^\w-]/g, '')} linear both;
              animation-timeline: view();
              animation-range: entry 0% entry 60%;
            }
          }
        }` : '';

      return { html: html, css: css + reveal, js: '' };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Split Reveal                                                           */
  /*                                                                        */
  /* A panel that opens like a set of blinds as you scroll, uncovering the   */
  /* message behind it. Every slat is a plain element rotated on its own     */
  /* slice of the scroll, so the whole thing is CSS.                        */
  /*                                                                        */
  /* The slats are decoration over content that is already there, never a    */
  /* container for it. Text living on a rotating face would be split across  */
  /* slats and unreadable, and would vanish outright wherever the animation  */
  /* does not run. So the content sits underneath in normal flow, and the    */
  /* slats only ever take themselves away.                                   */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'split-reveal',
    name: 'Split Reveal',
    category: CAT,
    icon: '▥',
    blurb: 'A cover that opens like blinds as you scroll, uncovering the message behind it. Zero JS, and the message is there whether it opens or not.',
    props: [
      { t: 'section', label: 'Behind the cover' },
      { k: 'eyebrow', t: 'text', label: 'Eyebrow', value: 'New for 2026' },
      { k: 'title', t: 'text', label: 'Heading', value: 'Rated for the pull, not the brochure.' },
      { k: 'sub', t: 'textarea', label: 'Copy', value: 'Independently tested to the standards our customers are held to.' },
      { k: 'btnText', t: 'text', label: 'Button label', value: 'See the test data',
        help: 'Leave empty for no button.' },
      { k: 'btnUrl', t: 'text', label: 'Button link', value: '#' },
      { k: 'image', t: 'image', label: 'Background image', value: '',
        help: 'Sits behind the copy. Leave empty for a plain ground.' },
      { k: 'alt', t: 'text', label: 'Alt text', value: '' },

      { t: 'section', label: 'The cover' },
      {
        k: 'coverMode', t: 'select', label: 'Cover is', value: 'brand',
        options: [['brand', 'The brand colour'], ['deep', 'Dark'], ['custom', 'A colour I pick'], ['image', 'An image']]
      },
      { k: 'cover', t: 'color', label: 'Cover colour', value: '#96694c', when: { coverMode: ['custom'] } },
      { k: 'coverImage', t: 'image', label: 'Cover image', value: '', when: { coverMode: ['image'] } },
      { k: 'coverAlt', t: 'text', label: 'Cover alt text', value: '', when: { coverMode: ['image'] } },
      { k: 'coverText', t: 'text', label: 'Word across the cover', value: '',
        help: 'Optional. Splits across the slats and goes with them — decoration, so it is kept from screen readers.' },

      { t: 'section', label: 'Motion' },
      {
        k: 'slats', t: 'range', label: 'Slats', min: 2, max: 14, step: 1, value: 7,
        help: 'More slats is a finer opening and more elements on the page.'
      },
      {
        k: 'axis', t: 'select', label: 'They open', value: 'vertical',
        options: [['vertical', 'Upward, like blinds'], ['horizontal', 'Sideways, like doors']]
      },
      {
        k: 'order', t: 'select', label: 'In order', value: 'across',
        options: [['across', 'One after another'], ['centre', 'From the middle out'], ['together', 'All at once']]
      },
      { k: 'stagger', t: 'range', label: 'Stagger', min: 0, max: 8, step: 1, value: 3 },

      { t: 'section', label: 'Style' },
      { k: 'minHeight', t: 'range', label: 'Height', min: 240, max: 720, step: 20, unit: 'px', value: 420 },
      { k: 'align', t: 'select', label: 'Alignment', value: 'left', options: [['left', 'Left'], ['center', 'Centre']] },
      {
        k: 'bgMode', t: 'select', label: 'Background', value: 'page',
        options: CB.BG_MODES, legacy: { key: 'bg', value: 'custom' },
        help: 'Following the scheme is what lets one Light/Dark setting reach this block.'
      },
      { k: 'bg', t: 'color', label: 'Background colour', value: '#ffffff', when: { bgMode: ['custom'] } },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 0, max: 140, step: 4, unit: 'px', value: 0 }
    ],

    render: function (p, c) {
      var s = c.s;
      var count = c.clamp(Math.round(c.num(p.slats, 7)), 2, 14);
      var vertical = p.axis !== 'horizontal';
      var word = String(p.coverText || '').trim();

      /* Which slat moves when. Kept here rather than in a selector so the CSS
         stays one rule with an index, whatever the order. */
      function delayIndex(i) {
        if (p.order === 'together') return 0;
        if (p.order === 'centre') return Math.abs(i - (count - 1) / 2);
        return i;
      }
      var step = c.num(p.stagger, 3);

      var coverFill = p.coverMode === 'custom' ? (p.cover || '#96694c')
        : p.coverMode === 'deep' ? 'var(--cb-deep, #141210)'
        : p.coverMode === 'image' ? 'var(--cb-subtle)'
        : 'var(--cb-brand)';

      var slats = '';
      for (var i = 0; i < count; i++) {
        var pos = (i / count * 100).toFixed(4);
        var seg = word ? c.esc(word.charAt(Math.floor(i * word.length / count)) || '') : '';
        slats += '<span class="cb-spl__slat" style="--i:' + delayIndex(i).toFixed(2) + '; --pos:' + pos + '%;">' +
                 (word ? '<span class="cb-spl__glyph">' + seg + '</span>' : '') +
                 '</span>';
      }

      var media = p.image
        ? '<img class="cb-spl__img" src="' + c.url(p.image) + '" alt="' + c.attr(p.alt) + '" loading="lazy" decoding="async">'
        : '';

      var html = c.dedent(`
        <section class="${c.cls} cb-spl">
          <div class="cb-spl__stage">
            ${media}
            <div class="cb-spl__inner">
              <div class="cb-wrap">
                ${p.eyebrow ? '<p class="cb-spl__eyebrow">' + c.esc(p.eyebrow) + '</p>' : ''}
                ${p.title ? '<h2 class="cb-spl__title">' + c.rich(p.title) + '</h2>' : ''}
                ${p.sub ? '<p class="cb-spl__sub">' + c.rich(p.sub) + '</p>' : ''}
                ${c.actions([{ text: p.btnText, url: p.btnUrl }], { align: p.align === 'center' ? 'center' : '' })}
              </div>
            </div>
            <div class="cb-spl__cover" aria-hidden="true">
        ${c.indent(slats, 8)}
            </div>
          </div>
        </section>`);

      var dark = p.coverMode === 'deep' || p.coverMode === 'brand' || p.coverMode === 'custom';
      var onMedia = !!p.image;

      var css = `
        ${s}.cb-spl { background: ${c.bg(p)}; padding-block: ${c.num(p.pad, 0)}px; }
        ${s} .cb-spl__stage {
          position: relative; overflow: hidden;
          min-height: ${c.num(p.minHeight, 420)}px;
          display: flex; align-items: center;
          border-radius: var(--cb-radius);
          background: ${onMedia ? 'var(--cb-subtle)' : 'var(--cb-band, #f7f4f1)'};
        }
        ${s} .cb-spl__img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; z-index: 0;
        }
        ${s} .cb-spl__inner {
          position: relative; z-index: 1; width: 100%;
          padding-block: 48px; text-align: ${p.align === 'center' ? 'center' : 'left'};
          ${onMedia ? 'background: linear-gradient(90deg, rgba(20,18,16,.72), rgba(20,18,16,.28));' : ''}
        }
        ${s} .cb-spl__eyebrow {
          font-size: calc(.75em * var(--cb-eyebrow-scale, 1)); font-weight: var(--cb-eyebrow-weight, 700);
          letter-spacing: calc(.12em + var(--cb-eyebrow-track, 0em)); text-transform: uppercase;
          color: ${onMedia ? 'var(--cb-on-dark, #ffffff)' : 'var(--cb-brand)'}; margin-bottom: 12px;
          ${onMedia ? 'opacity: .82;' : ''}
        }
        ${s} .cb-spl__title {
          font-size: calc(clamp(26px, 4vw, 42px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800);
          line-height: calc(1.12 + var(--cb-h-leading, 0)); letter-spacing: calc(-.02em + var(--cb-h-track, 0em));
          max-width: 20ch; ${p.align === 'center' ? 'margin-inline: auto;' : ''}
          ${onMedia ? 'color: var(--cb-on-dark, #ffffff);' : ''}
        }
        ${s} .cb-spl__sub {
          margin-top: 14px; max-width: 52ch;
          ${p.align === 'center' ? 'margin-inline: auto;' : ''}
          color: ${onMedia ? 'var(--cb-on-dark-muted, rgba(255,255,255,.82))' : 'var(--cb-muted)'};
        }
        ${onMedia ? c.pin([s + ' .cb-spl__title', s + ' .cb-spl__eyebrow'], 'var(--cb-on-dark, #ffffff)') : ''}

        ${s} .cb-spl__cover {
          position: absolute; inset: 0; z-index: 2;
          pointer-events: none;
          /* Gone unless a scroll timeline puts it back. A cover that needs an
             animation to get out of the way would otherwise sit on top of the
             message in every browser that cannot run one. */
          display: none;
        }
        ${s} .cb-spl__slat {
          position: absolute;
          background: ${coverFill};
          ${p.coverMode === 'image' && p.coverImage ? `
          background-image: url("${c.url(p.coverImage)}");
          background-size: ${vertical ? 'auto ' + count * 100 + '%' : count * 100 + '% auto'};
          background-position: ${vertical ? '50% var(--pos)' : 'var(--pos) 50%'};` : ''}
          display: flex; align-items: center; justify-content: center;
          ${vertical
            ? `left: 0; right: 0; top: var(--pos); height: calc(100% / ${count} + 1px); transform-origin: 50% 0%;`
            : `top: 0; bottom: 0; left: var(--pos); width: calc(100% / ${count} + 1px); transform-origin: 0% 50%;`}
        }
        ${s} .cb-spl__glyph {
          font-size: calc(clamp(22px, 4vw, 46px) * var(--cb-h-scale, 1));
          font-weight: var(--cb-h-weight, 800); letter-spacing: .04em;
          color: ${dark ? 'var(--cb-on-dark, #ffffff)' : 'var(--cb-ink)'};
        }

        @keyframes cb-spl-${c.id} {
          from { transform: ${vertical ? 'rotateX(0deg)' : 'rotateY(0deg)'}; opacity: 1; }
          80% { opacity: 1; }
          to { transform: ${vertical ? 'rotateX(-92deg)' : 'rotateY(92deg)'}; opacity: 0; }
        }
        /* The cover is only ever shown where it can also be taken away. Its
           finished state is "open", so even a timeline-less run that jumps
           straight to the end leaves the message uncovered. */
        @supports (animation-timeline: view()) {
          ${s} .cb-spl__cover { display: block; perspective: 900px; }
          ${s} .cb-spl__slat {
            animation: cb-spl-${c.id} linear both;
            animation-timeline: view();
            animation-range: entry calc(24% + var(--i) * ${step}%) cover calc(34% + var(--i) * ${step}%);
            backface-visibility: hidden;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          ${s} .cb-spl__cover { display: none; }
        }`;

      return { html: html, css: css, js: '' };
    }
  });
})();
