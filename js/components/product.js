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
        ].concat(CB.ctaFields({
          help: 'Shows only while this finish is selected, and swaps with the swatches. Leave empty for no button.'
        })),
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

      { t: 'section', label: 'Button' },
      { k: 'btnText', t: 'text', label: 'Button label', value: '',
        help: 'Sits with the copy — “Request a sample” fits well here. Leave empty for no button.' },
      { k: 'btnUrl', t: 'text', label: 'Button link', value: '#' },

      { t: 'section', label: 'Style' },
      {
        k: 'bgMode', t: 'select', label: 'Background', value: 'band',
        options: CB.BG_MODES, legacy: { key: 'bg', value: 'custom' },
        help: 'Following the scheme is what lets one Light/Dark setting reach this block.'
      },
      { k: 'bg', t: 'color', label: 'Background colour', value: '#f7f4f1', when: { bgMode: ['custom'] } },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 24, max: 180, step: 8, unit: 'px', value: 80 }
    ],

    render: function (p, c) {
      var s = c.s;
      var items = (p.items || []).filter(Boolean);
      /* Read from the ground rather than asked for separately. As its own
         control it could contradict the background it was describing — Tone
         dark with the ground following a light scheme painted white text onto
         white, and nothing in the panel said so. Following the scheme means the
         neutral tokens are already right for whichever scheme is on. */
      var dark = p.bgMode === 'deep' ||
                 (p.bgMode === 'custom' && c.relLum(p.bg) !== null && c.relLum(p.bg) < 0.4);
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

      /* One button per finish, all emitted, with the checked radio deciding
         which is displayed. display:none rather than opacity keeps the hidden
         ones out of the tab order — an invisible but focusable link is worse
         than no link at all. */
      var anyCta = items.some(function (it) { return it.btnText; });
      var ctas = anyCta ? items.map(function (it, i) {
        return it.btnText
          ? '<a class="cb-btn cb-btn--primary cb-fin__cta" data-i="' + i + '" href="' +
            c.url(it.btnUrl) + '">' + c.esc(it.btnText) + '</a>'
          : '';
      }).join('\n') : '';

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
              ${c.actions([{ text: p.btnText, url: p.btnUrl }])}
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
              ${anyCta ? `<div class="cb-actions cb-actions--center cb-fin__ctas">
        ${c.indent(ctas, 8)}
              </div>` : ''}
            </div>
          </div>
        </section>`);

      /* :has() drives the crossfade from the checked radio, which means the
         input can sit inside its label instead of being wired up by id. */
      var rules = items.map(function (it, i) {
        return `${s}:has(.cb-fin__radio[data-i="${i}"]:checked) .cb-fin__shot[data-i="${i}"] { opacity: 1; }` +
          (p.showName ? `\n        ${s}:has(.cb-fin__radio[data-i="${i}"]:checked) .cb-fin__label[data-i="${i}"] { opacity: 1; position: relative; }` : '') +
          (anyCta ? `\n        ${s}:has(.cb-fin__radio[data-i="${i}"]:checked) .cb-fin__cta[data-i="${i}"] { display: inline-flex; }` : '');
      }).join('\n        ');

      var css = `
        ${s}.cb-fin { background: ${c.bg(p)}; padding-block: ${c.num(p.pad, 96)}px; ${dark ? 'color: var(--cb-on-dark, #fff);' : ''} }
        ${s} .cb-fin__inner {
          display: ${p.layout === 'split' ? 'grid' : 'block'};
          ${p.layout === 'split' ? 'grid-template-columns: 1fr 1.15fr; gap: clamp(28px, 5vw, 64px); align-items: center;' : ''}
        }
        ${s} .cb-fin__copy {
          ${p.layout === 'split' ? '' : 'text-align: center; max-width: 620px; margin: 0 auto 34px;'}
          display: flex; flex-direction: column; gap: 10px;
        }
        ${s} .cb-fin__eyebrow {
          font-size: calc(.75em * var(--cb-eyebrow-scale, 1)); font-weight: var(--cb-eyebrow-weight, 700); letter-spacing: calc(.14em + var(--cb-eyebrow-track, 0em)); text-transform: uppercase;
          color: var(--cb-brand-ink, var(--cb-brand));
        }
        ${s} .cb-fin__title { font-size: calc(clamp(26px, 3.6vw, 38px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800); letter-spacing: calc(-.02em + var(--cb-h-track, 0em)); line-height: calc(1.15 + var(--cb-h-leading, 0)); text-wrap: balance; }
        ${s} .cb-fin__sub { color: ${dark ? 'rgba(255,255,255,.72)' : 'var(--cb-muted)'}; font-size: calc(clamp(16px, 2.2vw, 19px) * var(--cb-body-scale, 1)); }

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
        ${anyCta ? `${s} .cb-fin__cta { display: none; }
        ${s}:not(:has(.cb-fin__radio:checked)) .cb-fin__cta[data-i="0"] { display: inline-flex; }` : ''}

        ${s} .cb-fin__names {
          position: relative; text-align: center; margin-top: 20px; min-height: 2.6em;
        }
        ${s} .cb-fin__label {
          position: absolute; inset: 0; opacity: 0; transition: opacity .3s ease;
          display: flex; flex-direction: column; gap: 2px; align-items: center;
          font-size: 1.12em; font-weight: 700;
        }
        ${s} .cb-fin__note { font-size: .85em; font-weight: 500; color: ${dark ? 'rgba(255,255,255,.6)' : 'var(--cb-muted)'}; }

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
          outline-color: var(--cb-brand-ink, var(--cb-brand)); outline-width: 3px; outline-offset: 6px;
        }

        ${dark ? c.pin([s + ' .cb-fin__title', s + ' .cb-fin__label'], 'var(--cb-on-dark, #ffffff)') : ''}

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
          ${anyCta ? `${s} .cb-fin__cta[data-i="0"] { display: inline-flex; }` : ''}
          ${s} .cb-fin__picker::after {
            content: "Finish previews need a newer browser.";
            flex-basis: 100%; text-align: center; font-size: .85em;
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

      { t: 'section', label: 'Button' },
      { k: 'btnText', t: 'text', label: 'Button label', value: '',
        help: 'Sits below the last step. Leave empty for no button — each step can also carry its own.' },
      { k: 'btnUrl', t: 'text', label: 'Button link', value: '#' },
      { k: 'btnAlign', t: 'select', label: 'Button alignment', value: 'start',
        options: [['start', 'Left'], ['center', 'Centre']] },

      { t: 'section', label: 'Steps' },
      {
        k: 'items', t: 'list', label: 'Steps', itemLabel: 'title',
        fields: [
          { k: 'title', t: 'text', label: 'Step title', value: 'Step title' },
          { k: 'text', t: 'textarea', label: 'Step copy', value: 'One idea per step. Keep it to a sentence or two — the product is doing the talking.' },
          { k: 'image', t: 'image', label: 'Product shot for this step', value: CB.ph(1000, 1000, '', '#96694c', '#2b241f') }
        ].concat(CB.ctaFields({ help: 'Leave empty for no button on this step.' })),
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
      {
        k: 'bgMode', t: 'select', label: 'Background', value: 'deep',
        options: CB.BG_MODES, legacy: { key: 'bg', value: 'custom' },
        help: 'Following the scheme is what lets one Light/Dark setting reach this block.'
      },
      { k: 'bg', t: 'color', label: 'Background colour', value: '#141210', when: { bgMode: ['custom'] } },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 24, max: 200, step: 8, unit: 'px', value: 80 }
    ],

    render: function (p, c) {
      var s = c.s;
      var items = (p.items || []).filter(Boolean);
      var n = Math.max(1, items.length);
      /* Read from the ground rather than asked for separately. As its own
         control it could contradict the background it was describing — Tone
         dark with the ground following a light scheme painted white text onto
         white, and nothing in the panel said so. Following the scheme means the
         neutral tokens are already right for whichever scheme is on. */
      var dark = p.bgMode === 'deep' ||
                 (p.bgMode === 'custom' && c.relLum(p.bg) !== null && c.relLum(p.bg) < 0.4);
      var tl = '--cb-pin-' + c.cls;

      var shots = items.map(function (it, i) {
        return '<img class="cb-psc__shot" data-i="' + i + '" src="' + c.url(it.image) +
          '" alt="" loading="' + (i ? 'lazy' : 'eager') + '" decoding="async">';
      }).join('\n');

      var steps = items.map(function (it, i) {
        return c.dedent(`
          <li class="cb-psc__step">
            <img class="cb-psc__stepShot" src="${c.url(it.image)}" alt=""
                 loading="${i ? 'lazy' : 'eager'}" decoding="async">
            <div class="cb-psc__stepIn">
              <span class="cb-psc__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
              <h3 class="cb-psc__stepTitle">${c.esc(it.title)}</h3>
              ${it.text ? '<p class="cb-psc__stepText">' + c.rich(it.text) + '</p>' : ''}
              ${c.actions([{ text: it.btnText, url: it.btnUrl }], { cls: 'cb-psc__stepBtn' })}
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
            ${c.actions([{ text: p.btnText, url: p.btnUrl }], { align: p.btnAlign === 'center' ? 'center' : '', cls: 'cb-psc__cta' })}
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
        ${s}.cb-psc { background: ${c.bg(p)}; padding-block: ${c.num(p.pad, 110)}px; ${dark ? 'color: var(--cb-on-dark, #fff);' : ''} }
        ${s} .cb-psc__head { max-width: 640px; margin-bottom: clamp(32px, 6vw, 72px); }
        ${s} .cb-psc__eyebrow {
          font-size: calc(.75em * var(--cb-eyebrow-scale, 1)); font-weight: var(--cb-eyebrow-weight, 700); letter-spacing: calc(.14em + var(--cb-eyebrow-track, 0em)); text-transform: uppercase;
          color: ${dark ? 'var(--cb-brand-on-dark, var(--cb-brand))' : 'var(--cb-brand-ink, var(--cb-brand))'}; margin-bottom: 10px;
        }
        ${s} .cb-psc__title { font-size: calc(clamp(26px, 3.6vw, 38px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800); letter-spacing: calc(-.02em + var(--cb-h-track, 0em)); line-height: calc(1.15 + var(--cb-h-leading, 0)); text-wrap: balance; }

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
        /* Each step carries its own copy of its shot, for the narrow layout
           where there is no pinned stage to crossfade. Hidden here; the sticky
           stage is doing that job. */
        ${s} .cb-psc__stepShot { display: none; }
        ${s} .cb-psc__num {
          font-size: .75em; font-weight: 700; letter-spacing: .16em;
          color: ${dark ? 'var(--cb-brand-on-dark, var(--cb-brand))' : 'var(--cb-brand-ink, var(--cb-brand))'}; font-variant-numeric: tabular-nums;
        }
        ${s} .cb-psc__stepTitle { font-size: calc(clamp(20px, 2.6vw, 28px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 700); letter-spacing: calc(-.015em + var(--cb-h-track, 0em)); line-height: calc(1.15 + var(--cb-h-leading, 0)); }
        ${s} .cb-psc__stepText { font-size: .92em; color: ${dark ? 'rgba(255,255,255,.72)' : 'var(--cb-muted)'}; }
        /* stepIn is a flex column with its own gap, so the shared row adds
           nothing of its own on top of it. */
        ${s} .cb-psc__stepBtn { margin-top: 0; }
        ${s} .cb-psc__cta { margin-top: clamp(28px, 5vw, 56px); }

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

        ${dark ? c.pin([s + ' .cb-psc__title', s + ' .cb-psc__stepTitle'], 'var(--cb-on-dark, #ffffff)') : ''}

        @media (max-width: 860px) {
          /* Pinning beside a single narrow column reads badly, so each step
             gets its own shot directly above its copy instead.

             The shared stage cannot do this: it holds every shot stacked in one
             place and crossfades them from the track's scroll position. Left in
             the flow it put a single image at the top of the section with every
             step's copy below it, so nothing sat with the product it described.
             The stage is dropped here and the per-step images take over. */
          ${s} .cb-psc__track { grid-template-columns: 1fr; }
          ${s} .cb-psc__media { display: none; }
          ${s} .cb-psc__step {
            display: block; min-height: 0; margin-bottom: 44px;
          }
          ${s} .cb-psc__stepIn { max-width: none; }
          ${s} .cb-psc__stepShot {
            display: block; width: 100%; aspect-ratio: ${p.ratio};
            object-fit: cover; margin-bottom: 18px;
            border-radius: calc(var(--cb-radius) * 1.5);
            background: ${dark ? 'rgba(255,255,255,.05)' : 'var(--cb-subtle)'};
          }
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
        k: 'items', t: 'list', label: 'Specs', itemLabel: 'label', paste: true,
        fields: [
          { k: 'value', t: 'text', label: 'Value', value: '12 AWG' },
          { k: 'label', t: 'text', label: 'Label', value: 'Conductor' },
          { k: 'note', t: 'text', label: 'Note', value: '' }
        ].concat(CB.ctaFields({ help: 'Leave empty for no button on this spec.' })),
        value: [
          { value: '12 AWG', label: 'Conductor', note: 'Solid copper' },
          { value: '600 V', label: 'Rating', note: '' },
          { value: '90 °C', label: 'Temperature', note: 'Dry and damp' },
          { value: '1 000 ft', label: 'Reel length', note: '' }
        ]
      },

      { t: 'section', label: 'Button' },
      { k: 'btnText', t: 'text', label: 'Button label', value: '',
        help: 'Sits below the specs — a datasheet or spec-sheet link fits well here. Leave empty for no button.' },
      { k: 'btnUrl', t: 'text', label: 'Button link', value: '#' },

      { t: 'section', label: 'Style' },
      { k: 'align', t: 'select', label: 'Alignment', value: 'center', options: [['center', 'Center'], ['left', 'Left']] },
      { k: 'divider', t: 'toggle', label: 'Hairline dividers', value: true },
      { k: 'valueSize', t: 'range', label: 'Value size', min: 20, max: 64, step: 2, unit: 'px', value: 34 },
      {
        k: 'bgMode', t: 'select', label: 'Background', value: 'page',
        options: CB.BG_MODES, legacy: { key: 'bg', value: 'custom' },
        help: 'Following the scheme is what lets one Light/Dark setting reach this block.'
      },
      { k: 'bg', t: 'color', label: 'Background colour', value: '#ffffff', when: { bgMode: ['custom'] } },
      { k: 'pad', t: 'range', label: 'Vertical padding', min: 16, max: 140, step: 4, unit: 'px', value: 56 }
    ],

    render: function (p, c) {
      var s = c.s;
      var items = (p.items || []).filter(Boolean);
      /* Read from the ground rather than asked for separately. As its own
         control it could contradict the background it was describing — Tone
         dark with the ground following a light scheme painted white text onto
         white, and nothing in the panel said so. Following the scheme means the
         neutral tokens are already right for whichever scheme is on. */
      var dark = p.bgMode === 'deep' ||
                 (p.bgMode === 'custom' && c.relLum(p.bg) !== null && c.relLum(p.bg) < 0.4);

      var cells = items.map(function (it) {
        return c.dedent(`
          <li class="cb-spec__item">
            <p class="cb-spec__value">${c.esc(it.value)}</p>
            <p class="cb-spec__label">${c.esc(it.label)}</p>
            ${it.note ? '<p class="cb-spec__note">' + c.esc(it.note) + '</p>' : ''}
            ${c.actions([{ text: it.btnText, url: it.btnUrl }], { tight: true })}
          </li>`);
      }).join('\n');

      var html = c.dedent(`
        <section class="${c.cls} cb-spec">
          <div class="cb-wrap">
            ${p.title ? '<h2 class="cb-spec__title">' + c.rich(p.title) + '</h2>' : ''}
            <ul class="cb-spec__row">
        ${c.indent(cells, 6)}
            </ul>
            ${c.actions([{ text: p.btnText, url: p.btnUrl }], { align: p.align === 'center' ? 'center' : '' })}
          </div>
        </section>`);

      var css = `
        ${s}.cb-spec { background: ${c.bg(p)}; padding-block: ${c.num(p.pad, 56)}px; ${dark ? 'color: var(--cb-on-dark, #fff);' : ''} }
        ${s} .cb-spec__title {
          font-size: calc(clamp(20px, 2.6vw, 28px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 700); line-height: calc(1.2 + var(--cb-h-leading, 0)); letter-spacing: calc(-.015em + var(--cb-h-track, 0em));
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
          font-size: calc(${c.num(p.valueSize, 34)}px * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800); line-height: calc(1.1 + var(--cb-h-leading, 0));
          letter-spacing: calc(-.03em + var(--cb-h-track, 0em)); font-variant-numeric: tabular-nums;
        }
        ${s} .cb-spec__label {
          font-size: calc(.75em * var(--cb-eyebrow-scale, 1)); font-weight: var(--cb-eyebrow-weight, 700); letter-spacing: calc(.1em + var(--cb-eyebrow-track, 0em)); text-transform: uppercase;
          color: ${dark ? 'rgba(255,255,255,.6)' : 'var(--cb-muted)'}; margin-top: 6px;
        }
        ${s} .cb-spec__note { font-size: .85em; color: ${dark ? 'rgba(255,255,255,.5)' : 'var(--cb-muted)'}; }
        ${dark ? c.pin([s + ' .cb-spec__title', s + ' .cb-spec__value'], 'var(--cb-on-dark, #ffffff)') : ''}

        @media (max-width: 700px) {
          ${s} .cb-spec__item { flex-basis: 50%; min-width: 0; margin-bottom: 22px; }
          ${s} .cb-spec__item:nth-child(odd) { border-left: 0; }
        }`;

      return { html: html, css: css, js: '' };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Resource Library                                                       */
  /*                                                                        */
  /* Spec sheets, installation guides, safety data sheets, catalogs. The     */
  /* category filter is radio buttons and :has(), with no script, in the    */
  /* same spirit as Table's "only show differences" — so it still filters   */
  /* where an editor strips scripts.                                        */
  /*                                                                        */
  /* The inputs sit inside their labels rather than being joined by id and */
  /* for. A page with the same block pasted twice would otherwise have two  */
  /* copies of every id, and a click in one copy would work the filter in   */
  /* the other. The radio group's name is still shared between two identical*/
  /* pastes, which costs the other copy nothing worse than falling back to  */
  /* showing everything.                                                    */
  /* --------------------------------------------------------------------- */

  function rlSlug(s) {
    return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'other';
  }
  var RL_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function rlDate(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || '').trim());
    return m ? RL_MONTHS[+m[2] - 1] + ' ' + (+m[3]) + ', ' + m[1] : String(v || '').trim();
  }

  CB.register({
    id: 'resource-library',
    name: 'Resource Library',
    category: CAT,
    icon: '⎙',
    blurb: 'Spec sheets, installation guides and safety data sheets, filterable by category — with no JavaScript, so the filter survives any editor.',
    props: [
      { t: 'section', label: 'Heading' },
      { k: 'eyebrow', t: 'text', label: 'Eyebrow', value: 'Resources' },
      { k: 'title', t: 'text', label: 'Section title', value: 'Documents and downloads' },
      { k: 'sub', t: 'textarea', label: 'Section intro', value: 'Spec sheets, installation guides and safety data, all in one place.' },

      { t: 'section', label: 'Documents' },
      {
        k: 'items', t: 'list', label: 'Documents', itemLabel: 'title', paste: true,
        fields: [
          { k: 'title', t: 'text', label: 'Title', value: 'Document title' },
          { k: 'category', t: 'text', label: 'Category', value: 'Spec sheets', help: 'Documents with the same category share one filter button.' },
          { k: 'type', t: 'text', label: 'File type', value: 'PDF' },
          { k: 'size', t: 'text', label: 'File size', value: '' },
          { k: 'lang', t: 'text', label: 'Language', value: '' },
          { k: 'date', t: 'date', label: 'Updated', value: '' },
          { k: 'url', t: 'text', label: 'Link', value: '#' },
          { k: 'text', t: 'text', label: 'Description', value: '' }
        ],
        value: [
          { title: 'THHN/THWN-2 building wire — spec sheet', category: 'Spec sheets', type: 'PDF', size: '480 KB', lang: 'English', date: '2026-06-01', url: '#', text: '' },
          { title: 'Metal-clad armored cable — spec sheet', category: 'Spec sheets', type: 'PDF', size: '512 KB', lang: 'English', date: '2026-05-14', url: '#', text: '' },
          { title: 'Pulling cable through conduit', category: 'Installation guides', type: 'PDF', size: '2.1 MB', lang: 'English', date: '2026-04-02', url: '#', text: 'Tension, sidewall pressure and lubrication for a clean pull.' },
          { title: 'Terminating aluminum conductors', category: 'Installation guides', type: 'PDF', size: '1.4 MB', lang: 'English', date: '2026-03-18', url: '#', text: 'Preparation, lugs and torque.' },
          { title: 'Copper building wire — safety data sheet', category: 'Safety data sheets', type: 'PDF', size: '220 KB', lang: 'English', date: '2026-01-09', url: '#', text: '' },
          { title: 'Copper building wire — safety data sheet', category: 'Safety data sheets', type: 'PDF', size: '228 KB', lang: 'Español', date: '2026-01-09', url: '#', text: '' }
        ]
      },

      { t: 'section', label: 'Layout' },
      { k: 'filter', t: 'toggle', label: 'Filter by category', value: true },
      { k: 'layout', t: 'select', label: 'Show as', value: 'rows', options: [['rows', 'A list'], ['cards', 'Cards']] },
      { k: 'cols', t: 'range', label: 'Columns', min: 2, max: 4, step: 1, value: 3, when: { layout: ['cards'] } },
      { k: 'newTab', t: 'toggle', label: 'Open documents in a new tab', value: false },

      { t: 'section', label: 'Style' },
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
      var items = (p.items || []).filter(function (it) { return it && it.title; });
      var cards = p.layout === 'cards';
      var target = p.newTab ? ' target="_blank" rel="noopener"' : '';

      var cats = [];
      items.forEach(function (it) {
        var name = String(it.category || '').trim() || 'Other';
        var slug = rlSlug(name);
        var hit = cats.filter(function (x) { return x.slug === slug; })[0];
        if (hit) hit.n++; else cats.push({ name: name, slug: slug, n: 1 });
      });
      var filtering = p.filter && cats.length > 1;
      var group = 'cb-rl-' + c.cls;

      var chips = filtering ? '<div class="cb-rl__filters" role="group" aria-label="Filter documents by category">' +
        '<label class="cb-rl__chip"><input class="cb-rl__f cb-sr" type="radio" name="' + c.attr(group) + '" value="all" checked>' +
        '<span>All <span class="cb-rl__n">' + items.length + '</span></span></label>' +
        cats.map(function (x) {
          return '<label class="cb-rl__chip"><input class="cb-rl__f cb-sr" type="radio" name="' + c.attr(group) + '" value="' + x.slug + '">' +
            '<span>' + c.esc(x.name) + ' <span class="cb-rl__n">' + x.n + '</span></span></label>';
        }).join('') + '</div>' : '';

      var rows = items.map(function (it) {
        var slug = rlSlug(String(it.category || '').trim() || 'Other');
        var meta = [it.category, it.size, it.lang, it.date ? 'Updated ' + rlDate(it.date) : ''].filter(Boolean).map(c.esc)
          .join('<span aria-hidden="true"> · </span>');
        return c.dedent(`
          <li class="cb-rl__item" data-cat="${slug}">
            <span class="cb-rl__type" aria-hidden="true">${c.esc(String(it.type || 'File').slice(0, 5))}</span>
            <div class="cb-rl__body">
              <a class="cb-rl__a" href="${c.url(it.url)}"${target}>${c.esc(it.title)}<span class="cb-sr">${it.type ? ' (' + c.esc(it.type) + (it.size ? ', ' + c.esc(it.size) : '') + ')' : ''}${p.newTab ? ', opens in a new tab' : ''}</span></a>
              ${meta ? '<p class="cb-rl__meta">' + meta + '</p>' : ''}
              ${it.text ? '<p class="cb-rl__x">' + c.esc(it.text) + '</p>' : ''}
            </div>
          </li>`);
      }).join('\n');

      var html = c.dedent(`
        <section class="${c.cls} cb-rl">
          <div class="cb-wrap">
            ${(p.eyebrow || p.title || p.sub) ? `<header class="cb-rl__head">
              ${p.eyebrow ? '<p class="cb-rl__eyebrow">' + c.esc(p.eyebrow) + '</p>' : ''}
              ${p.title ? '<h2 class="cb-rl__title">' + c.rich(p.title) + '</h2>' : ''}
              ${p.sub ? '<p class="cb-rl__sub">' + c.rich(p.sub) + '</p>' : ''}
            </header>` : ''}
            ${chips}
            <ul class="cb-rl__list cb-rl__list--${cards ? 'cards' : 'rows'}">
        ${c.indent(rows, 6)}
            </ul>
          </div>
        </section>`);

      /* One rule per category, generated here where the categories are known.
         Nothing checked — which a duplicated paste can cause — shows everything. */
      var filterCss = filtering ? cats.map(function (x) {
        return s + ':has(.cb-rl__f[value="' + x.slug + '"]:checked) .cb-rl__item:not([data-cat="' + x.slug + '"]) { display: none; }';
      }).join('\n') : '';

      var css = `
        ${s}.cb-rl { background: ${c.bg(p)}; padding-block: ${c.num(p.pad, 80)}px; }
        ${s} .cb-rl__head { max-width: 660px; margin-bottom: 28px; }
        ${s} .cb-rl__eyebrow {
          font-size: calc(.75em * var(--cb-eyebrow-scale, 1)); font-weight: var(--cb-eyebrow-weight, 700);
          letter-spacing: calc(.12em + var(--cb-eyebrow-track, 0em)); text-transform: uppercase;
          color: var(--cb-brand-ink, var(--cb-brand)); margin-bottom: 12px;
        }
        ${s} .cb-rl__title {
          font-size: calc(clamp(26px, 3.6vw, 38px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800);
          line-height: calc(1.15 + var(--cb-h-leading, 0)); letter-spacing: calc(-.02em + var(--cb-h-track, 0em));
        }
        ${s} .cb-rl__sub { margin-top: 10px; color: var(--cb-muted); }

        ${s} .cb-rl__filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
        ${s} .cb-rl__chip {
          position: relative; display: inline-flex; cursor: pointer; padding: 7px 14px; border-radius: 999px;
          border: 1px solid var(--cb-border); background: var(--cb-surface); color: var(--cb-ink);
          font-size: .92em; font-weight: 600; transition: background-color .2s ease, color .2s ease, border-color .2s ease;
        }
        ${s} .cb-rl__chip:hover { border-color: var(--cb-ink); }
        ${s} .cb-rl__chip:has(.cb-rl__f:checked) { background: var(--cb-ink); border-color: var(--cb-ink); color: var(--cb-page); }
        ${s} .cb-rl__chip:has(.cb-rl__f:focus-visible) { outline: 2px solid var(--cb-brand); outline-offset: 2px; }
        ${s} .cb-rl__n { font-weight: 400; opacity: .8; font-variant-numeric: tabular-nums; }

        ${s} .cb-rl__list--rows { display: grid; }
        ${s} .cb-rl__list--rows .cb-rl__item { border-top: 1px solid var(--cb-border); }
        ${s} .cb-rl__list--rows .cb-rl__item:last-child { border-bottom: 1px solid var(--cb-border); }
        ${s} .cb-rl__list--cards {
          display: grid; gap: 18px; grid-template-columns: repeat(${c.clamp(c.num(p.cols, 3), 2, 4)}, minmax(0, 1fr));
        }
        ${s} .cb-rl__list--cards .cb-rl__item {
          background: var(--cb-surface); border: 1px solid var(--cb-border); border-radius: var(--cb-radius);
          grid-template-columns: 1fr; align-content: start;
        }
        ${s} .cb-rl__item { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 16px; align-items: start; padding: 18px 4px; }
        ${s} .cb-rl__list--cards .cb-rl__item { padding: 20px; }
        ${s} .cb-rl__type {
          display: grid; place-items: center; width: 52px; aspect-ratio: 1; border-radius: calc(var(--cb-radius) * .5);
          background: var(--cb-subtle); color: var(--cb-brand-ink, var(--cb-brand));
          font-size: .75em; font-weight: 800; letter-spacing: .04em; text-transform: uppercase;
        }
        ${s} .cb-rl__body { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        ${s} .cb-rl__a {
          font-weight: 700; color: var(--cb-ink); text-decoration: underline; text-decoration-color: var(--cb-border);
          text-underline-offset: .2em; overflow-wrap: anywhere;
        }
        ${s} .cb-rl__a:hover { text-decoration-color: currentColor; }
        ${s} .cb-rl__meta { font-size: .85em; color: var(--cb-muted); }
        ${s} .cb-rl__x { font-size: .92em; color: var(--cb-muted); }
        ${filterCss}

        @media (max-width: 860px) { ${s} .cb-rl__list--cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 520px) { ${s} .cb-rl__list--cards { grid-template-columns: 1fr; } }`;

      return { html: html, css: css, js: '' };
    }
  });

  /* --------------------------------------------------------------------- */
  /* Where to Buy                                                           */
  /*                                                                        */
  /* Retailers, distributors and online sellers, grouped by the kind of     */
  /* seller. A seller without a logo gets its name set as a wordmark, so a   */
  /* list can go live before every logo has been collected.                 */
  /* --------------------------------------------------------------------- */

  CB.register({
    id: 'where-to-buy',
    name: 'Where to Buy',
    category: CAT,
    icon: '⌂',
    blurb: 'Retailers, distributors and online sellers as logo tiles, grouped by the kind of seller.',
    props: [
      { t: 'section', label: 'Heading' },
      { k: 'eyebrow', t: 'text', label: 'Eyebrow', value: 'Where to buy' },
      { k: 'title', t: 'text', label: 'Section title', value: 'Find our products' },
      { k: 'sub', t: 'textarea', label: 'Section intro', value: 'In stores, through electrical distributors, and online.' },
      { k: 'align', t: 'select', label: 'Heading alignment', value: 'center', options: [['center', 'Center'], ['left', 'Left']] },

      { t: 'section', label: 'Sellers' },
      {
        k: 'items', t: 'list', label: 'Sellers', itemLabel: 'name', paste: true,
        fields: [
          { k: 'name', t: 'text', label: 'Name', value: 'Seller name' },
          { k: 'logo', t: 'image', label: 'Logo', value: '', help: 'Optional. Without one, the name is shown instead.' },
          { k: 'group', t: 'text', label: 'Group', value: 'Retail', help: 'Sellers in the same group are shown together — “Retail”, “Electrical distributors”, “Online”.' },
          { k: 'url', t: 'text', label: 'Link', value: '#' },
          { k: 'note', t: 'text', label: 'Note', value: '' }
        ],
        value: [
          { name: 'National home center', logo: '', group: 'Retail', url: '#', note: 'In store and online' },
          { name: 'Hardware cooperative', logo: '', group: 'Retail', url: '#', note: 'Find a store' },
          { name: 'Regional electrical supply', logo: '', group: 'Electrical distributors', url: '#', note: 'Find a branch' },
          { name: 'Independent distributor', logo: '', group: 'Electrical distributors', url: '#', note: 'Find a branch' },
          { name: 'Online marketplace', logo: '', group: 'Online', url: '#', note: '' },
          { name: 'Pro supply online', logo: '', group: 'Online', url: '#', note: '' }
        ]
      },

      { t: 'section', label: 'Layout' },
      { k: 'grouped', t: 'toggle', label: 'Group by the Group field', value: true },
      { k: 'cols', t: 'range', label: 'Tiles per row', min: 2, max: 6, step: 1, value: 4 },
      { k: 'newTab', t: 'toggle', label: 'Open sellers in a new tab', value: true },

      { t: 'section', label: 'Style' },
      { k: 'variant', t: 'select', label: 'Tile style', value: 'outline', options: [['outline', 'Outlined'], ['elevated', 'Elevated'], ['flat', 'Flat / borderless']] },
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
      var items = (p.items || []).filter(function (it) { return it && (it.name || it.logo); });
      var target = p.newTab ? ' target="_blank" rel="noopener"' : '';

      function tile(it) {
        var inner = it.logo
          ? '<img class="cb-wtb__logo" src="' + c.url(it.logo) + '" alt="' + c.attr(it.name) + '" loading="lazy" decoding="async">'
          : '<span class="cb-wtb__word">' + c.esc(it.name) + '</span>';
        return '<li><a class="cb-wtb__tile" href="' + c.url(it.url) + '"' + target + '>' + inner +
          (it.note ? '<span class="cb-wtb__note">' + c.esc(it.note) + '</span>' : '') +
          (p.newTab ? '<span class="cb-sr"> (opens in a new tab)</span>' : '') + '</a></li>';
      }

      var groups = [];
      if (p.grouped) {
        items.forEach(function (it) {
          var name = String(it.group || '').trim() || 'Other';
          var g = groups.filter(function (x) { return x.name === name; })[0];
          if (!g) { g = { name: name, items: [] }; groups.push(g); }
          g.items.push(it);
        });
      } else {
        groups.push({ name: '', items: items });
      }

      var body = groups.map(function (g) {
        return '<div class="cb-wtb__group">' +
          (g.name ? '<h3 class="cb-wtb__gname">' + c.esc(g.name) + '</h3>' : '') +
          '<ul class="cb-wtb__grid">' + g.items.map(tile).join('') + '</ul></div>';
      }).join('\n');

      var html = c.dedent(`
        <section class="${c.cls} cb-wtb">
          <div class="cb-wrap">
            ${(p.eyebrow || p.title || p.sub) ? `<header class="cb-wtb__head">
              ${p.eyebrow ? '<p class="cb-wtb__eyebrow">' + c.esc(p.eyebrow) + '</p>' : ''}
              ${p.title ? '<h2 class="cb-wtb__title">' + c.rich(p.title) + '</h2>' : ''}
              ${p.sub ? '<p class="cb-wtb__sub">' + c.rich(p.sub) + '</p>' : ''}
            </header>` : ''}
        ${c.indent(body, 4)}
          </div>
        </section>`);

      var tileCss = {
        outline: 'background: var(--cb-surface); border: 1px solid var(--cb-border);',
        elevated: 'background: var(--cb-surface); border: 1px solid transparent; box-shadow: 0 12px 30px -22px rgba(20,18,16,.5);',
        flat: 'background: var(--cb-subtle); border: 1px solid transparent;'
      }[p.variant] || '';
      var cols = c.clamp(c.num(p.cols, 4), 2, 6);

      var css = `
        ${s}.cb-wtb { background: ${c.bg(p)}; padding-block: ${c.num(p.pad, 80)}px; }
        ${s} .cb-wtb__head { max-width: 660px; margin-bottom: 34px; ${p.align === 'left' ? '' : 'margin-inline: auto; text-align: center;'} }
        ${s} .cb-wtb__eyebrow {
          font-size: calc(.75em * var(--cb-eyebrow-scale, 1)); font-weight: var(--cb-eyebrow-weight, 700);
          letter-spacing: calc(.12em + var(--cb-eyebrow-track, 0em)); text-transform: uppercase;
          color: var(--cb-brand-ink, var(--cb-brand)); margin-bottom: 12px;
        }
        ${s} .cb-wtb__title {
          font-size: calc(clamp(26px, 3.6vw, 38px) * var(--cb-h-scale, 1)); font-weight: var(--cb-h-weight, 800);
          line-height: calc(1.15 + var(--cb-h-leading, 0)); letter-spacing: calc(-.02em + var(--cb-h-track, 0em));
        }
        ${s} .cb-wtb__sub { margin-top: 10px; color: var(--cb-muted); }
        ${s} .cb-wtb__group + .cb-wtb__group { margin-top: 32px; }
        ${s} .cb-wtb__gname {
          margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid var(--cb-border);
          font-size: calc(.75em * var(--cb-eyebrow-scale, 1)); font-weight: var(--cb-eyebrow-weight, 700);
          letter-spacing: calc(.12em + var(--cb-eyebrow-track, 0em)); text-transform: uppercase; color: var(--cb-muted);
        }
        ${s} .cb-wtb__grid { display: grid; gap: 14px; grid-template-columns: repeat(${cols}, minmax(0, 1fr)); }
        /* The row stretches each list item; the link inside has to fill it,
           or a tile whose name wraps stands taller than its neighbour. */
        ${s} .cb-wtb__grid > li { display: grid; }
        ${s} .cb-wtb__tile {
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
          min-height: 108px; padding: 18px 14px; text-align: center; text-decoration: none; color: var(--cb-ink);
          border-radius: var(--cb-radius); ${tileCss}
          transition: border-color .2s ease, box-shadow .2s ease;
        }
        ${s} .cb-wtb__tile:hover { border-color: var(--cb-ink); }
        ${s} .cb-wtb__tile:focus-visible { outline: 2px solid var(--cb-brand); outline-offset: 2px; }
        ${s} .cb-wtb__logo { display: block; width: 100%; height: 44px; object-fit: contain; }
        ${s} .cb-wtb__word { font-size: 1.12em; font-weight: 800; letter-spacing: -.01em; line-height: 1.2; }
        ${s} .cb-wtb__note { font-size: .85em; color: var(--cb-muted); }
        @media (max-width: 860px) { ${s} .cb-wtb__grid { grid-template-columns: repeat(${Math.min(3, cols)}, minmax(0, 1fr)); } }
        @media (max-width: 520px) { ${s} .cb-wtb__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }`;

      return { html: html, css: css, js: '' };
    }
  });
})();
