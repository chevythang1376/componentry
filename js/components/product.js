/* ============================================================================
   Product Showcase — finish switcher, pinned product scroller, spec strip

   The Apple product-page feel comes from three things: one product held still
   while the page moves around it, a lot of restraint, and motion tied to scroll
   position rather than a timer. All three blocks are CSS-first for the same
   reason as the Modern Layout set — they keep working where <script> is
   stripped.
   ========================================================================== */
(function () {
  'use strict';

  var CAT = 'Product Showcase';

  /* --------------------------------------------------------------------- */
  /* Finish Switcher                                                        */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'finish-switcher',
    name: 'Finish Switcher',
    category: CAT,
    icon: '◍',
    blurb: 'Swatches that crossfade the product shot. Built on real radio inputs and :has(), so it works with no JavaScript and is keyboard accessible by default.',
    props: [
      { t: 'section', label: 'Heading' },
      { k: 'eyebrow', t: 'text', label: 'Eyebrow', value: 'Finishes' },
      { k: 'title', t: 'text', label: 'Product name', value: 'Copper Series' },
      { k: 'sub', t: 'textarea', label: 'Supporting copy', value: 'Six finishes, one build standard.' },

      { t: 'section', label: 'Finishes' },
      {
        k: 'items', t: 'list', label: 'Finishes', itemLabel: 'name',
        fields: [
          { k: 'name', t: 'text', label: 'Finish name', value: 'Finish' },
          { k: 'swatch', t: 'color', label: 'Swatch colour', value: '#96694c' },
          { k: 'image', t: 'image', label: 'Product image', value: CB.ph(1000, 800, '', '#96694c', '#2b241f') },
          { k: 'alt', t: 'text', label: 'Image alt text', value: '' },
          { k: 'note', t: 'text', label: 'Caption under the name', value: '' }
        ],
        value: [
          { name: 'Bare Copper', swatch: '#96694c', image: CB.ph(1000, 800, '', '#96694c', '#2b241f'), alt: '', note: 'Standard build' },
          { name: 'Tinned', swatch: '#c9c6c1', image: CB.ph(1000, 800, '', '#c9c6c1', '#4a443e'), alt: '', note: 'Corrosion resistant' },
          { name: 'Black Jacket', swatch: '#1c1a18', image: CB.ph(1000, 800, '', '#3a332d', '#12100e'), alt: '', note: 'UV stable' },
          { name: 'Deep Bronze', swatch: '#6f4c37', image: CB.ph(1000, 800, '', '#6f4c37', '#141210'), alt: '', note: '' }
        ]
      },

      { t: 'section', label: 'Layout' },
      { k: 'layout', t: 'select', label: 'Layout', value: 'stacked', options: [['stacked', 'Product above swatches'], ['split', 'Product beside copy']] },
      { k: 'ratio', t: 'select', label: 'Product ratio', value: '4/3', options: [['4/3', '4 : 3'], ['1/1', 'Square'], ['16/9', '16 : 9'], ['3/2', '3 : 2']] },
      { k: 'swatchSize', t: 'range', label: 'Swatch size', min: 24, max: 64, step: 2, unit: 'px', value: 40 },
      { k: 'showName', t: 'toggle', label: 'Show the selected finish name', value: true },

      { t: 'section', label: 'Style' },
      { k: 'tone', t: 'select', label: 'Tone', value: 'light', options: [['light', 'Light'], ['dark', 'Dark']] },
      { k: 'bg', t: 'color', label: 'Background', value: '#f7f4f1' },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 24, max: 180, step: 8, unit: 'px', value: 96 }
    ],

    render: function (p, c) {
      var s = c.s;
      var items = (p.items || []).filter(Boolean);
      var dark = p.tone === 'dark';
      var group = 'cb-fin-' + c.cls;

      var shots = items.map(function (it, i) {
        return '<img class="cb-fin__shot" data-i="' + i + '" src="' + c.url(it.image) +
          '" alt="' + c.attr(it.alt || (it.name + ' finish')) + '" loading="' + (i ? 'lazy' : 'eager') + '" decoding="async">';
      }).join('\n');

      /* The input lives inside its label, so no id/for pairing is needed and
         nothing breaks if the same markup appears twice on a page. */
      var swatches = items.map(function (it, i) {
        return c.dedent(`
          <label class="cb-fin__swatch">
            <input class="cb-fin__radio" type="radio" name="${c.attr(group)}" data-i="${i}"${i === 0 ? ' checked' : ''}>
            <span class="cb-fin__dot" style="--cb-sw: ${c.attr(it.swatch)}"></span>
            <span class="cb-sr">${c.esc(it.name)}</span>
          </label>`);
      }).join('\n');

      var names = p.showName ? items.map(function (it, i) {
        return '<span class="cb-fin__label" data-i="' + i + '">' + c.esc(it.name) +
          (it.note ? '<span class="cb-fin__note">' + c.esc(it.note) + '</span>' : '') + '</span>';
      }).join('\n') : '';

      var html = c.dedent(`
        <section class="${c.cls} cb-fin">
          <div class="cb-wrap cb-fin__inner">
            <div class="cb-fin__copy">
              ${p.eyebrow ? '<p class="cb-fin__eyebrow">' + c.esc(p.eyebrow) + '</p>' : ''}
              ${p.title ? '<h2 class="cb-fin__title">' + c.rich(p.title) + '</h2>' : ''}
              ${p.sub ? '<p class="cb-fin__sub">' + c.rich(p.sub) + '</p>' : ''}
            </div>
            <div class="cb-fin__main">
              <div class="cb-fin__stage">
        ${c.indent(shots, 8)}
              </div>
              ${p.showName ? '<p class="cb-fin__names" aria-live="polite">' + names + '</p>' : ''}
              <fieldset class="cb-fin__picker">
                <legend class="cb-sr">Choose a finish for ${c.attr(p.title)}</legend>
        ${c.indent(swatches, 8)}
              </fieldset>
            </div>
          </div>
        </section>`);

      /* :has() drives the crossfade from the checked radio, which means the
         input can sit inside its label instead of being wired up by id. */
      var rules = items.map(function (it, i) {
        return `${s}:has(.cb-fin__radio[data-i="${i}"]:checked) .cb-fin__shot[data-i="${i}"] { opacity: 1; }` +
          (p.showName ? `\n        ${s}:has(.cb-fin__radio[data-i="${i}"]:checked) .cb-fin__label[data-i="${i}"] { opacity: 1; position: relative; }` : '');
      }).join('\n        ');

      var css = `
        ${s}.cb-fin { background: ${p.bg}; padding-block: ${c.num(p.pad, 96)}px; ${dark ? 'color: #fff;' : ''} }
        ${s} .cb-fin__inner {
          display: ${p.layout === 'split' ? 'grid' : 'block'};
          ${p.layout === 'split' ? 'grid-template-columns: 1fr 1.15fr; gap: clamp(28px, 5vw, 64px); align-items: center;' : ''}
        }
        ${s} .cb-fin__copy {
          ${p.layout === 'split' ? '' : 'text-align: center; max-width: 620px; margin: 0 auto 34px;'}
          display: flex; flex-direction: column; gap: 10px;
        }
        ${s} .cb-fin__eyebrow {
          font-size: .76em; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
          color: var(--cb-brand);
        }
        ${s} .cb-fin__title { font-size: clamp(30px, 5vw, 54px); font-weight: 800; letter-spacing: -.025em; line-height: 1.05; text-wrap: balance; }
        ${s} .cb-fin__sub { color: ${dark ? 'rgba(255,255,255,.72)' : 'var(--cb-muted)'}; font-size: 1.05em; }

        ${s} .cb-fin__stage {
          position: relative; aspect-ratio: ${p.ratio};
          border-radius: calc(var(--cb-radius) * 1.4); overflow: hidden;
          background: ${dark ? 'rgba(255,255,255,.05)' : 'var(--cb-surface)'};
        }
        ${s} .cb-fin__shot {
          position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
          opacity: 0; transition: opacity .45s ease;
        }
        /* The checked radio drives everything. */
        ${rules}
        /* Safety net: nothing checked — which a duplicated radio group can
           cause — falls back to the first finish, so the stage is never blank.
           This must stay conditional; an unconditional default would leave the
           first shot stacked on top of every other selection. */
        ${s}:not(:has(.cb-fin__radio:checked)) .cb-fin__shot[data-i="0"] { opacity: 1; }
        ${p.showName ? `${s}:not(:has(.cb-fin__radio:checked)) .cb-fin__label[data-i="0"] { opacity: 1; position: relative; }` : ''}

        ${s} .cb-fin__names {
          position: relative; text-align: center; margin-top: 20px; min-height: 2.6em;
        }
        ${s} .cb-fin__label {
          position: absolute; inset: 0; opacity: 0; transition: opacity .3s ease;
          display: flex; flex-direction: column; gap: 2px; align-items: center;
          font-size: 1.05em; font-weight: 650;
        }
        ${s} .cb-fin__note { font-size: .8em; font-weight: 500; color: ${dark ? 'rgba(255,255,255,.6)' : 'var(--cb-muted)'}; }

        ${s} .cb-fin__picker {
          display: flex; justify-content: center; flex-wrap: wrap; gap: 14px;
          border: 0; padding: 0; margin: 22px 0 0; min-inline-size: 0;
        }
        ${s} .cb-fin__swatch { display: inline-flex; cursor: pointer; }
        ${s} .cb-fin__radio {
          position: absolute; opacity: 0; width: 1px; height: 1px; margin: 0;
        }
        ${s} .cb-fin__dot {
          display: block;
          width: ${c.num(p.swatchSize, 40)}px; height: ${c.num(p.swatchSize, 40)}px;
          border-radius: 50%; background: var(--cb-sw);
          box-shadow: inset 0 0 0 1px rgba(0,0,0,.14);
          outline: 2px solid transparent; outline-offset: 4px;
          transition: outline-color .2s ease, transform .2s ease;
        }
        ${s} .cb-fin__swatch:hover .cb-fin__dot { transform: scale(1.08); }
        ${s} .cb-fin__radio:checked + .cb-fin__dot { outline-color: ${dark ? '#fff' : 'var(--cb-brand)'}; }
        /* Keyboard focus has to be visible on a visually hidden input. */
        ${s} .cb-fin__radio:focus-visible + .cb-fin__dot {
          outline-color: var(--cb-brand); outline-width: 3px; outline-offset: 6px;
        }

        ${dark ? c.pin([s + ' .cb-fin__title', s + ' .cb-fin__label'], '#ffffff') : ''}

        @media (max-width: 820px) {
          ${s} .cb-fin__inner { display: block; }
          ${s} .cb-fin__copy { text-align: center; max-width: 620px; margin: 0 auto 30px; }
        }
        /* :has() is ~93% supported. Without it the swatches still behave as a
           real radio group; the shot simply doesn't change. Pin the first
           finish on so the stage isn't empty there. */
        @supports not selector(:has(*)) {
          ${s} .cb-fin__shot[data-i="0"] { opacity: 1; }
          ${s} .cb-fin__label[data-i="0"] { opacity: 1; position: relative; }
          ${s} .cb-fin__picker::after {
            content: "Finish previews need a newer browser.";
            flex-basis: 100%; text-align: center; font-size: .8em;
            color: ${dark ? 'rgba(255,255,255,.55)' : 'var(--cb-muted)'};
          }
        }`;

      /* The block is fully functional with no JavaScript. This exists only to
         keep a *duplicated* paste isolated: radio groups are document-wide, so
         two copies sharing a name would fight over the selection. If an editor
         strips it, nothing else is lost. */
      var js = c.wrap(c.cls, `
        if (copy > 0) {
          Array.prototype.forEach.call(root.querySelectorAll(".cb-fin__radio"), function (r) {
            r.name = r.name + "-" + copy;
          });
        }`);

      return { html: html, css: css, js: js };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Pinned Product Scroller                                                */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'pinned-product',
    name: 'Pinned Product Scroller',
    category: CAT,
    icon: '◎',
    blurb: 'The product pins centre-screen while copy scrolls past it, swapping shots per step. Sticky does the pinning, so it holds up without scroll timelines.',
    props: [
      { t: 'section', label: 'Heading' },
      { k: 'eyebrow', t: 'text', label: 'Eyebrow', value: 'Built to last' },
      { k: 'title', t: 'text', label: 'Section title', value: 'Engineered end to end' },

      { t: 'section', label: 'Steps' },
      {
        k: 'items', t: 'list', label: 'Steps', itemLabel: 'title',
        fields: [
          { k: 'title', t: 'text', label: 'Step title', value: 'Step title' },
          { k: 'text', t: 'textarea', label: 'Step copy', value: 'One idea per step. Keep it to a sentence or two — the product is doing the talking.' },
          { k: 'image', t: 'image', label: 'Product shot for this step', value: CB.ph(1000, 1000, '', '#96694c', '#2b241f') }
        ],
        value: [
          { title: 'Solid conductor', text: 'Drawn to tolerance and annealed for a consistent bend radius, pull after pull.', image: CB.ph(1000, 1000, '', '#96694c', '#2b241f') },
          { title: 'Jacket that holds up', text: 'Rated for sunlight, abrasion and the back of a truck in February.', image: CB.ph(1000, 1000, '', '#6f4c37', '#141210') },
          { title: 'Printed where it matters', text: 'Legend stays legible after the pull, so the inspection goes quickly.', image: CB.ph(1000, 1000, '', '#3a332d', '#12100e') }
        ]
      },

      { t: 'section', label: 'Layout' },
      { k: 'side', t: 'select', label: 'Product side', value: 'left', options: [['left', 'Left'], ['right', 'Right']] },
      { k: 'stepHeight', t: 'range', label: 'Scroll distance per step', min: 60, max: 140, step: 5, unit: 'vh', value: 90 },
      {
        k: 'topOffset', t: 'range', label: 'Pin offset from top', min: 40, max: 200, step: 4, unit: 'px', value: 100,
        help: 'Measured from the top of the window. Set this to at least the height of your site’s fixed header, or the pinned product will sit underneath it.'
      },
      { k: 'ratio', t: 'select', label: 'Product ratio', value: '1/1', options: [['1/1', 'Square'], ['4/3', '4 : 3'], ['3/4', 'Portrait']] },

      { t: 'section', label: 'Style' },
      { k: 'tone', t: 'select', label: 'Tone', value: 'dark', options: [['dark', 'Dark'], ['light', 'Light']] },
      { k: 'bg', t: 'color', label: 'Background', value: '#141210' },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 24, max: 200, step: 8, unit: 'px', value: 110 }
    ],

    render: function (p, c) {
      var s = c.s;
      var items = (p.items || []).filter(Boolean);
      var n = Math.max(1, items.length);
      var dark = p.tone === 'dark';
      var tl = '--cb-pin-' + c.cls;

      var shots = items.map(function (it, i) {
        return '<img class="cb-psc__shot" data-i="' + i + '" src="' + c.url(it.image) +
          '" alt="" loading="' + (i ? 'lazy' : 'eager') + '" decoding="async">';
      }).join('\n');

      var steps = items.map(function (it, i) {
        return c.dedent(`
          <li class="cb-psc__step">
            <div class="cb-psc__stepIn">
              <span class="cb-psc__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
              <h3 class="cb-psc__stepTitle">${c.esc(it.title)}</h3>
              ${it.text ? '<p class="cb-psc__stepText">' + c.rich(it.text) + '</p>' : ''}
            </div>
          </li>`);
      }).join('\n');

      var html = c.dedent(`
        <section class="${c.cls} cb-psc">
          <div class="cb-wrap">
            ${(p.eyebrow || p.title) ? `<header class="cb-psc__head">
              ${p.eyebrow ? '<p class="cb-psc__eyebrow">' + c.esc(p.eyebrow) + '</p>' : ''}
              ${p.title ? '<h2 class="cb-psc__title">' + c.rich(p.title) + '</h2>' : ''}
            </header>` : ''}
            <div class="cb-psc__track">
              <div class="cb-psc__media">
                <div class="cb-psc__stage">
        ${c.indent(shots, 10)}
                </div>
              </div>
              <ol class="cb-psc__steps">
        ${c.indent(steps, 8)}
              </ol>
            </div>
          </div>
        </section>`);

      /* Each shot takes an equal slice of the track's own view progress. The
         timeline is named on the track so descendants can reference it — no
         timeline-scope needed, since the shots are inside it. */
      var shotAnim = items.map(function (it, i) {
        var from = (i / n) * 100, to = ((i + 1) / n) * 100;
        var pad = 100 / n * 0.18;
        return c.dedent(`
          ${s} .cb-psc__shot[data-i="${i}"] {
            animation-name: cb-psc-fade-${c.cls};
            animation-range: contain ${Math.max(0, from - pad).toFixed(1)}% contain ${Math.min(100, to + pad).toFixed(1)}%;
          }`);
      }).join('\n');

      var css = `
        ${s}.cb-psc { background: ${p.bg}; padding-block: ${c.num(p.pad, 110)}px; ${dark ? 'color: #fff;' : ''} }
        ${s} .cb-psc__head { max-width: 640px; margin-bottom: clamp(32px, 6vw, 72px); }
        ${s} .cb-psc__eyebrow {
          font-size: .76em; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
          color: var(--cb-brand); margin-bottom: 10px;
        }
        ${s} .cb-psc__title { font-size: clamp(32px, 5.5vw, 60px); font-weight: 800; letter-spacing: -.025em; line-height: 1.04; text-wrap: balance; }

        ${s} .cb-psc__track {
          display: grid; gap: clamp(24px, 5vw, 72px); align-items: start;
          grid-template-columns: 1fr 1fr;
          view-timeline-name: ${tl};
        }
        ${s} .cb-psc__media { order: ${p.side === 'right' ? 2 : 1}; }
        ${s} .cb-psc__steps { order: ${p.side === 'right' ? 1 : 2}; }

        ${s} .cb-psc__media {
          position: sticky; top: ${c.num(p.topOffset, 100)}px;
          height: calc(100vh - ${c.num(p.topOffset, 100) + 40}px);
          display: flex; align-items: center;
        }
        ${s} .cb-psc__stage {
          position: relative; width: 100%; aspect-ratio: ${p.ratio};
          border-radius: calc(var(--cb-radius) * 1.5); overflow: hidden;
          background: ${dark ? 'rgba(255,255,255,.05)' : 'var(--cb-subtle)'};
        }
        ${s} .cb-psc__shot {
          position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
          opacity: 0;
        }
        /* Without scroll timelines the first shot simply stays put — pinned
           product, readable copy, no missing content. */
        ${s} .cb-psc__shot[data-i="0"] { opacity: 1; }

        ${s} .cb-psc__steps { display: block; }
        ${s} .cb-psc__step {
          min-height: ${c.num(p.stepHeight, 90)}vh;
          display: flex; align-items: center;
        }
        ${s} .cb-psc__stepIn { display: flex; flex-direction: column; gap: 12px; max-width: 46ch; }
        ${s} .cb-psc__num {
          font-size: .82em; font-weight: 700; letter-spacing: .16em;
          color: var(--cb-brand); font-variant-numeric: tabular-nums;
        }
        ${s} .cb-psc__stepTitle { font-size: clamp(24px, 3.4vw, 38px); font-weight: 780; letter-spacing: -.02em; line-height: 1.15; }
        ${s} .cb-psc__stepText { font-size: 1.05em; color: ${dark ? 'rgba(255,255,255,.72)' : 'var(--cb-muted)'}; }

        @keyframes cb-psc-fade-${c.cls} {
          0% { opacity: 0; }
          18%, 82% { opacity: 1; }
          100% { opacity: 0; }
        }
        @supports (animation-timeline: view()) {
          @media (prefers-reduced-motion: no-preference) {
            ${s} .cb-psc__shot {
              animation-timeline: ${tl};
              animation-fill-mode: both;
              animation-timing-function: linear;
              opacity: 0;
            }
            ${shotAnim}
          }
        }

        ${dark ? c.pin([s + ' .cb-psc__title', s + ' .cb-psc__stepTitle'], '#ffffff') : ''}

        @media (max-width: 860px) {
          /* Pinning beside a single narrow column reads badly — the product
             goes above each step instead. */
          ${s} .cb-psc__track { grid-template-columns: 1fr; }
          ${s} .cb-psc__media { position: static; height: auto; order: 1; margin-bottom: 24px; }
          ${s} .cb-psc__steps { order: 2; }
          ${s} .cb-psc__step { min-height: 0; margin-bottom: 40px; }
        }`;

      return { html: html, css: css, js: '' };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Spec Strip                                                             */
  /* --------------------------------------------------------------------- */
  CB.register({
    id: 'spec-strip',
    name: 'Spec Strip',
    category: CAT,
    icon: '⋯',
    blurb: 'A quiet row of headline specs with hairline dividers — the detail buyers actually scan for.',
    props: [
      { t: 'section', label: 'Heading' },
      { k: 'title', t: 'text', label: 'Section title', value: '' },

      { t: 'section', label: 'Specs' },
      {
        k: 'items', t: 'list', label: 'Specs', itemLabel: 'label',
        fields: [
          { k: 'value', t: 'text', label: 'Value', value: '12 AWG' },
          { k: 'label', t: 'text', label: 'Label', value: 'Conductor' },
          { k: 'note', t: 'text', label: 'Note', value: '' }
        ],
        value: [
          { value: '12 AWG', label: 'Conductor', note: 'Solid copper' },
          { value: '600 V', label: 'Rating', note: '' },
          { value: '90 °C', label: 'Temperature', note: 'Dry and damp' },
          { value: '1 000 ft', label: 'Reel length', note: '' }
        ]
      },

      { t: 'section', label: 'Style' },
      { k: 'align', t: 'select', label: 'Alignment', value: 'center', options: [['center', 'Center'], ['left', 'Left']] },
      { k: 'divider', t: 'toggle', label: 'Hairline dividers', value: true },
      { k: 'valueSize', t: 'range', label: 'Value size', min: 20, max: 64, step: 2, unit: 'px', value: 34 },
      { k: 'tone', t: 'select', label: 'Tone', value: 'light', options: [['light', 'Light'], ['dark', 'Dark']] },
      { k: 'bg', t: 'color', label: 'Background', value: '#ffffff' },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 16, max: 140, step: 4, unit: 'px', value: 56 }
    ],

    render: function (p, c) {
      var s = c.s;
      var items = (p.items || []).filter(Boolean);
      var dark = p.tone === 'dark';

      var cells = items.map(function (it) {
        return c.dedent(`
          <li class="cb-spec__item">
            <p class="cb-spec__value">${c.esc(it.value)}</p>
            <p class="cb-spec__label">${c.esc(it.label)}</p>
            ${it.note ? '<p class="cb-spec__note">' + c.esc(it.note) + '</p>' : ''}
          </li>`);
      }).join('\n');

      var html = c.dedent(`
        <section class="${c.cls} cb-spec">
          <div class="cb-wrap">
            ${p.title ? '<h2 class="cb-spec__title">' + c.rich(p.title) + '</h2>' : ''}
            <ul class="cb-spec__row">
        ${c.indent(cells, 6)}
            </ul>
          </div>
        </section>`);

      var css = `
        ${s}.cb-spec { background: ${p.bg}; padding-block: ${c.num(p.pad, 56)}px; ${dark ? 'color: #fff;' : ''} }
        ${s} .cb-spec__title {
          font-size: clamp(20px, 2.6vw, 26px); font-weight: 750; letter-spacing: -.015em;
          text-align: ${p.align}; margin-bottom: 28px;
        }
        ${s} .cb-spec__row {
          display: flex; flex-wrap: wrap;
          justify-content: ${p.align === 'center' ? 'center' : 'flex-start'};
          gap: 0;
        }
        ${s} .cb-spec__item {
          flex: 1 1 auto; min-width: 150px;
          display: flex; flex-direction: column; gap: 2px;
          text-align: ${p.align}; padding-inline: clamp(16px, 3vw, 36px);
          ${p.align === 'left' ? 'align-items: flex-start;' : 'align-items: center;'}
        }
        ${p.divider ? `
        ${s} .cb-spec__item + .cb-spec__item {
          border-left: 1px solid ${dark ? 'rgba(255,255,255,.18)' : 'var(--cb-border)'};
        }` : ''}
        ${s} .cb-spec__value {
          font-size: ${c.num(p.valueSize, 34)}px; font-weight: 780; line-height: 1.1;
          letter-spacing: -.03em; font-variant-numeric: tabular-nums;
        }
        ${s} .cb-spec__label {
          font-size: .8em; font-weight: 650; letter-spacing: .1em; text-transform: uppercase;
          color: ${dark ? 'rgba(255,255,255,.6)' : 'var(--cb-muted)'}; margin-top: 6px;
        }
        ${s} .cb-spec__note { font-size: .85em; color: ${dark ? 'rgba(255,255,255,.5)' : 'var(--cb-muted)'}; }
        ${dark ? c.pin([s + ' .cb-spec__title', s + ' .cb-spec__value'], '#ffffff') : ''}

        @media (max-width: 700px) {
          ${s} .cb-spec__item { flex-basis: 50%; min-width: 0; margin-bottom: 22px; }
          ${s} .cb-spec__item:nth-child(odd) { border-left: 0; }
        }`;

      return { html: html, css: css, js: '' };
    }
  });
})();
